import React, { useState } from 'react';
import { Table, Button, Card, Modal, Form, Row, Col, Badge, InputGroup, Dropdown } from 'react-bootstrap';
import { FaPlus, FaWhatsapp, FaCheck, FaTrash, FaSearch, FaCalendarAlt, FaClock, FaHistory } from 'react-icons/fa';
import { useFollowups } from '../hooks/useFollowups';
import ConfirmationModal from '../components/ConfirmationModal';
import toast from 'react-hot-toast';
import moment from 'moment';

function Followups() {
  const {
    followups,
    loading,
    createFollowup,
    deleteFollowup,
    whatsappClick,
    markFollowed,
    updateFollowup,
  } = useFollowups();

  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [selectedFollowup, setSelectedFollowup] = useState(null);
  const [search, setSearch] = useState('');
  const [rescheduleData, setRescheduleData] = useState({
    nextCallDate: '',
    reason: '',
    daysToAdd: ''
  });
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    category: 'warm',
    nextCallDate: '',
    notes: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    await createFollowup(formData);
    setShowModal(false);
    setFormData({ name: '', phone: '', category: 'warm', nextCallDate: '', notes: '' });
  };

  const handleDelete = async () => {
    if (selectedId) {
      await deleteFollowup(selectedId);
      setShowDeleteModal(false);
      setSelectedId(null);
    }
  };

  const handleReschedule = async () => {
    if (!selectedId) return;
    
    try {
      let response;
      if (rescheduleData.daysToAdd) {
        // Quick reschedule by adding days
        response = await fetch(`${process.env.REACT_APP_API_URL}/followups/${selectedId}/quick-reschedule`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ option: rescheduleData.daysToAdd })
        });
      } else {
        // Custom date reschedule
        response = await fetch(`${process.env.REACT_APP_API_URL}/followups/${selectedId}/reschedule`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            nextCallDate: rescheduleData.nextCallDate,
            reason: rescheduleData.reason
          })
        });
      }
      
      const data = await response.json();
      if (data.success) {
        toast.success(data.message);
        setShowRescheduleModal(false);
        setRescheduleData({ nextCallDate: '', reason: '', daysToAdd: '' });
        window.location.reload(); // Refresh to show updated date
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error('Failed to reschedule');
    }
  };

  const handleMarkFollowed = async (id, followup) => {
    setSelectedId(id);
    setSelectedFollowup(followup);
    // Prompt for reschedule option
    const days = window.prompt(
      'Follow-up completed! Schedule next follow-up in:\n' +
      'Enter number of days (1, 3, 7, 14, 30) or leave empty to not reschedule'
    );
    
    if (days && !isNaN(parseInt(days))) {
      await markFollowed(id, `Followed up and rescheduled in ${days} days`);
      // Auto reschedule
      await fetch(`${process.env.REACT_APP_API_URL}/followups/${id}/quick-reschedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ 
          option: days === '1' ? 'tomorrow' : 
                  days === '3' ? 'in_3_days' :
                  days === '7' ? 'in_1_week' :
                  days === '14' ? 'in_2_weeks' : 'in_1_month'
        })
      });
      toast.success(`Next follow-up scheduled in ${days} days`);
    } else {
      await markFollowed(id, 'Followed up via app');
    }
    window.location.reload();
  };

  const handleWhatsApp = async (id, phone) => {
    await whatsappClick(id);
  };

  const openRescheduleModal = (id, followup) => {
    setSelectedId(id);
    setSelectedFollowup(followup);
    setRescheduleData({ nextCallDate: followup.nextCallDate.split('T')[0], reason: '', daysToAdd: '' });
    setShowRescheduleModal(true);
  };

  const getCategoryBadge = (category) => {
    const variants = {
      hot: 'danger',
      warm: 'warning',
      cold: 'secondary',
      converted: 'success'
    };
    return <Badge bg={variants[category] || 'secondary'}>{category}</Badge>;
  };

  const getStatusBadge = (status) => {
    const variants = {
      pending: 'warning',
      followed: 'info',
      converted: 'success',
      missed: 'danger'
    };
    return <Badge bg={variants[status] || 'secondary'}>{status}</Badge>;
  };

  const isOverdue = (date) => {
    return new Date(date) < new Date() && new Date(date).toDateString() !== new Date().toDateString();
  };

  const filteredFollowups = followups.filter(f =>
    f.name.toLowerCase().includes(search.toLowerCase()) ||
    f.phone.includes(search)
  );

  const quickRescheduleOptions = [
    { value: 'tomorrow', label: 'Tomorrow (+1 day)', days: 1 },
    { value: 'in_3_days', label: 'In 3 days', days: 3 },
    { value: 'in_1_week', label: 'In 1 week', days: 7 },
    { value: 'in_2_weeks', label: 'In 2 weeks', days: 14 },
    { value: 'in_1_month', label: 'In 1 month', days: 30 }
  ];

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary"></div>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Follow-up Management</h2>
        <Button variant="primary" onClick={() => setShowModal(true)}>
          <FaPlus className="me-2" /> Add Follow-up
        </Button>
      </div>

      <Row className="mb-4">
        <Col md={6}>
          <InputGroup>
            <InputGroup.Text><FaSearch /></InputGroup.Text>
            <Form.Control
              placeholder="Search by name or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </InputGroup>
        </Col>
      </Row>

      <Card className="shadow-sm border-0">
        <Card.Body className="p-0">
          <div className="table-responsive">
            <Table hover className="mb-0">
              <thead className="bg-light">
                <tr>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Category</th>
                  <th>Next Call Date</th>
                  <th>Status</th>
                  <th>Follow-ups</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredFollowups.map((followup) => (
                  <tr key={followup._id} className={isOverdue(followup.nextCallDate) ? 'table-danger' : ''}>
                    <td>
                      <strong>{followup.name}</strong>
                      {followup.notes && <br /><small className="text-muted">{followup.notes.substring(0, 30)}</small>}
                    </td>
                    <td>{followup.phone}</td>
                    <td>{getCategoryBadge(followup.category)}</td>
                    <td>
                      <div className="d-flex align-items-center">
                        <FaCalendarAlt className="me-2 text-muted" />
                        {new Date(followup.nextCallDate).toLocaleDateString()}
                        {isOverdue(followup.nextCallDate) && (
                          <Badge bg="danger" className="ms-2">Overdue</Badge>
                        )}
                      </div>
                    </td>
                    <td>{getStatusBadge(followup.status)}</td>
                    <td>
                      <Badge bg="secondary" className="me-1">
                        <FaHistory className="me-1" /> {followup.followupCount || 0}
                      </Badge>
                    </td>
                    <td>
                      <Button
                        variant="success"
                        size="sm"
                        className="me-1"
                        onClick={() => handleWhatsApp(followup._id, followup.phone)}
                      >
                        <FaWhatsapp />
                      </Button>
                      <Button
                        variant="info"
                        size="sm"
                        className="me-1"
                        onClick={() => handleMarkFollowed(followup._id, followup)}
                        disabled={followup.status !== 'pending' && followup.status !== 'followed'}
                        title="Mark as followed"
                      >
                        <FaCheck />
                      </Button>
                      <Button
                        variant="warning"
                        size="sm"
                        className="me-1"
                        onClick={() => openRescheduleModal(followup._id, followup)}
                        title="Reschedule"
                      >
                        <FaClock />
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => {
                          setSelectedId(followup._id);
                          setShowDeleteModal(true);
                        }}
                      >
                        <FaTrash />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>

      {/* Add/Edit Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title><FaPlus className="me-2" />Add Follow-up</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Name *</Form.Label>
                  <Form.Control
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Phone *</Form.Label>
                  <Form.Control
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Category</Form.Label>
                  <Form.Select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    <option value="hot">Hot - Call immediately</option>
                    <option value="warm">Warm - Follow up soon</option>
                    <option value="cold">Cold - Nurture</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Next Call Date *</Form.Label>
                  <Form.Control
                    type="date"
                    required
                    value={formData.nextCallDate}
                    onChange={(e) => setFormData({ ...formData, nextCallDate: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label>Notes</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button variant="primary" type="submit">Create</Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Reschedule Modal */}
      <Modal show={showRescheduleModal} onHide={() => setShowRescheduleModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title><FaClock className="me-2" />Reschedule Follow-up</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p><strong>Prospect:</strong> {selectedFollowup?.name}</p>
          <p><strong>Current Date:</strong> {selectedFollowup && new Date(selectedFollowup.nextCallDate).toLocaleDateString()}</p>
          
          <Form.Group className="mb-3">
            <Form.Label>Quick Reschedule Options</Form.Label>
            <div className="d-grid gap-2">
              {quickRescheduleOptions.map(option => (
                <Button
                  key={option.value}
                  variant="outline-primary"
                  onClick={() => {
                    setRescheduleData({ ...rescheduleData, daysToAdd: option.value, nextCallDate: '' });
                    setTimeout(handleReschedule, 100);
                  }}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </Form.Group>

          <hr />

          <Form.Group className="mb-3">
            <Form.Label>Or Select Custom Date</Form.Label>
            <Form.Control
              type="date"
              value={rescheduleData.nextCallDate}
              onChange={(e) => setRescheduleData({ ...rescheduleData, nextCallDate: e.target.value, daysToAdd: '' })}
              min={new Date().toISOString().split('T')[0]}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Reason (Optional)</Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              value={rescheduleData.reason}
              onChange={(e) => setRescheduleData({ ...rescheduleData, reason: e.target.value })}
              placeholder="Why are you rescheduling?"
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowRescheduleModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleReschedule}
            disabled={!rescheduleData.nextCallDate && !rescheduleData.daysToAdd}
          >
            Confirm Reschedule
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Follow-up"
        message="Are you sure you want to delete this follow-up? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}

export default Followups;
