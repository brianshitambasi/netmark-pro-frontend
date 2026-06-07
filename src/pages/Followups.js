import React, { useState } from 'react';
import { Table, Button, Card, Modal, Form, Row, Col, Badge, InputGroup } from 'react-bootstrap';
import { FaPlus, FaWhatsapp, FaCheck, FaTrash, FaSearch } from 'react-icons/fa';
import { useFollowups } from '../hooks/useFollowups';
import ConfirmationModal from '../components/ConfirmationModal';

function Followups() {
  const {
    followups,
    loading,
    createFollowup,
    deleteFollowup,
    whatsappClick,
    markFollowed,
  } = useFollowups();

  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [search, setSearch] = useState('');
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

  const handleWhatsApp = async (id) => {
    await whatsappClick(id);
  };

  const handleMarkFollowed = async (id) => {
    await markFollowed(id, 'Followed up via app');
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

  const filteredFollowups = followups.filter(f =>
    f.name.toLowerCase().includes(search.toLowerCase()) ||
    f.phone.includes(search)
  );

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
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredFollowups.map((followup) => (
                  <tr key={followup._id}>
                    <td><strong>{followup.name}</strong></td>
                    <td>{followup.phone}</td>
                    <td>{getCategoryBadge(followup.category)}</td>
                    <td>{new Date(followup.nextCallDate).toLocaleDateString()}</td>
                    <td>{getStatusBadge(followup.status)}</td>
                    <td>
                      <Button
                        variant="success"
                        size="sm"
                        className="me-2"
                        onClick={() => handleWhatsApp(followup._id)}
                      >
                        <FaWhatsapp />
                      </Button>
                      <Button
                        variant="info"
                        size="sm"
                        className="me-2"
                        onClick={() => handleMarkFollowed(followup._id)}
                        disabled={followup.status !== 'pending'}
                      >
                        <FaCheck />
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
