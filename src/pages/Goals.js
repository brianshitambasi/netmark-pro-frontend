import React, { useState } from 'react';
import { Row, Col, Card, Button, Modal, Form, ProgressBar, Badge } from 'react-bootstrap';
import { FaPlus, FaTrash, FaBullseye, FaTrophy } from 'react-icons/fa';
import { useGoals } from '../hooks/useGoals';
import ConfirmationModal from '../components/ConfirmationModal';

function Goals() {
  const { goals, loading, createGoal, deleteGoal } = useGoals();
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    type: 'recruitment',
    target: '',
    period: 'monthly',
    startDate: '',
    endDate: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    await createGoal(formData);
    setShowModal(false);
    setFormData({ title: '', type: 'recruitment', target: '', period: 'monthly', startDate: '', endDate: '' });
  };

  const handleDelete = async () => {
    if (selectedId) {
      await deleteGoal(selectedId);
      setShowDeleteModal(false);
      setSelectedId(null);
    }
  };

  const getTypeIcon = (type) => {
    const icons = {
      recruitment: '',
      sales: '',
      commission: '',
      activity: ''
    };
    return icons[type] || '';
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2><FaBullseye className="me-2" />Goals & Targets</h2>
        <Button variant="primary" onClick={() => setShowModal(true)}>
          <FaPlus className="me-2" /> Set New Goal
        </Button>
      </div>

      <Row>
        {goals.length === 0 ? (
          <Col xs={12}>
            <div className="text-center py-5">
              <FaBullseye className="fa-3x text-muted mb-3" />
              <p className="text-muted">No goals set yet. Click the button to create your first goal!</p>
            </div>
          </Col>
        ) : (
          goals.map((goal) => {
            const progress = (goal.current / goal.target) * 100;
            const isAchieved = progress >= 100;

            return (
              <Col md={6} lg={4} key={goal.id} className="mb-4">
                <Card className="h-100 shadow-sm border-0">
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <div>
                        <h5 className="card-title mb-1">{goal.title}</h5>
                        <Badge bg="secondary" className="mt-1">
                          {getTypeIcon(goal.type)} {goal.type}
                        </Badge>
                      </div>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => {
                          setSelectedId(goal.id);
                          setShowDeleteModal(true);
                        }}
                      >
                        <FaTrash />
                      </Button>
                    </div>

                    <div className="mb-3">
                      <div className="d-flex justify-content-between mb-1">
                        <span>Progress</span>
                        <span className="fw-bold">{goal.current}/{goal.target}</span>
                      </div>
                      <ProgressBar
                        now={progress}
                        variant={isAchieved ? 'success' : progress >= 75 ? 'info' : progress >= 50 ? 'warning' : 'secondary'}
                        className="rounded-pill"
                        style={{ height: '10px' }}
                      />
                    </div>

                    <div className="text-muted small">
                      <div><i className="fas fa-calendar me-2"></i> Period: {goal.period}</div>
                      <div><i className="fas fa-hourglass-half me-2"></i> Days remaining: {goal.daysRemaining}</div>
                      {progress >= 100 && (
                        <div className="mt-2 text-success">
                          <FaTrophy className="me-1" /> Achieved!
                        </div>
                      )}
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            );
          })
        )}
      </Row>

      {/* Create Goal Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title><FaPlus className="me-2" />Create New Goal</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Row>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label>Goal Title</Form.Label>
                  <Form.Control
                    type="text"
                    required
                    placeholder="e.g., Recruit 10 Team Members"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Type</Form.Label>
                  <Form.Select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  >
                    <option value="recruitment">Recruitment (Team Members)</option>
                    <option value="sales">Sales (Products)</option>
                    <option value="commission">Commission (Earnings)</option>
                    <option value="activity">Activity (Follow-ups)</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Target Value</Form.Label>
                  <Form.Control
                    type="number"
                    required
                    placeholder="Enter target number"
                    value={formData.target}
                    onChange={(e) => setFormData({ ...formData, target: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Period</Form.Label>
                  <Form.Select
                    value={formData.period}
                    onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                  >
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Start Date</Form.Label>
                  <Form.Control
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>End Date</Form.Label>
                  <Form.Control
                    type="date"
                    required
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  />
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button variant="primary" type="submit">Create Goal</Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Goal"
        message="Are you sure you want to delete this goal?"
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}

export default Goals;
