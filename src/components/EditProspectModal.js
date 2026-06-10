import React, { useState, useEffect } from 'react';
import { Modal, Form, Button, Row, Col, Alert } from 'react-bootstrap';
import { FaSave } from 'react-icons/fa';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = process.env.REACT_APP_API_URL || 'https://netmark-pro-backend.onrender.com/api';

function EditProspectModal({ show, onHide, prospect, onProspectUpdated }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    alternativePhone: '',
    location: {
      address: '',
      city: '',
      state: '',
      country: 'Kenya',
      landmark: ''
    },
    occupation: '',
    source: 'other',
    interestLevel: 5,
    notes: '',
    status: 'new'
  });

  useEffect(() => {
    if (prospect) {
      setFormData({
        name: prospect.name || '',
        phone: prospect.phone || '',
        email: prospect.email || '',
        alternativePhone: prospect.alternativePhone || '',
        location: {
          address: prospect.location?.address || '',
          city: prospect.location?.city || '',
          state: prospect.location?.state || '',
          country: prospect.location?.country || 'Kenya',
          landmark: prospect.location?.landmark || ''
        },
        occupation: prospect.occupation || '',
        source: prospect.source || 'other',
        interestLevel: prospect.interestLevel || 5,
        notes: prospect.notes || '',
        status: prospect.status || 'new'
      });
    }
  }, [prospect]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: { ...prev[parent], [child]: value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`${API_URL}/prospects/${prospect._id}`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        toast.success('Prospect updated successfully');
        onProspectUpdated(response.data.data);
        onHide();
      } else {
        setError(response.data.message || 'Failed to update prospect');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update prospect');
      toast.error('Failed to update prospect');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title><FaSave className="me-2 text-primary" />Edit {prospect?.name}</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          {error && <Alert variant="danger">{error}</Alert>}
          
          <div className="mb-4">
            <h6 className="mb-3 text-primary">Basic Information</h6>
            <Row>
              <Col md={6}><Form.Group className="mb-3"><Form.Label>Full Name *</Form.Label><Form.Control type="text" name="name" required value={formData.name} onChange={handleChange} /></Form.Group></Col>
              <Col md={6}><Form.Group className="mb-3"><Form.Label>Phone Number *</Form.Label><Form.Control type="tel" name="phone" required value={formData.phone} onChange={handleChange} /></Form.Group></Col>
              <Col md={6}><Form.Group className="mb-3"><Form.Label>Email</Form.Label><Form.Control type="email" name="email" value={formData.email} onChange={handleChange} /></Form.Group></Col>
              <Col md={6}><Form.Group className="mb-3"><Form.Label>Alternative Phone</Form.Label><Form.Control type="tel" name="alternativePhone" value={formData.alternativePhone} onChange={handleChange} /></Form.Group></Col>
            </Row>
          </div>

          <div className="mb-4">
            <h6 className="mb-3 text-primary">Location Information</h6>
            <Row>
              <Col md={6}><Form.Group className="mb-3"><Form.Label>City/Town</Form.Label><Form.Control type="text" name="location.city" value={formData.location.city} onChange={handleChange} /></Form.Group></Col>
              <Col md={6}><Form.Group className="mb-3"><Form.Label>Landmark</Form.Label><Form.Control type="text" name="location.landmark" value={formData.location.landmark} onChange={handleChange} /></Form.Group></Col>
              <Col md={12}><Form.Group className="mb-3"><Form.Label>Address</Form.Label><Form.Control type="text" name="location.address" value={formData.location.address} onChange={handleChange} /></Form.Group></Col>
            </Row>
          </div>

          <div className="mb-4">
            <h6 className="mb-3 text-primary">Professional Information</h6>
            <Row>
              <Col md={6}><Form.Group className="mb-3"><Form.Label>Occupation</Form.Label><Form.Control type="text" name="occupation" value={formData.occupation} onChange={handleChange} /></Form.Group></Col>
              <Col md={6}><Form.Group className="mb-3"><Form.Label>Status</Form.Label><Form.Select name="status" value={formData.status} onChange={handleChange}><option value="new">New</option><option value="contacted">Contacted</option><option value="qualified">Qualified</option><option value="invited">Invited</option><option value="presentation_scheduled">Presentation Scheduled</option><option value="presentation_done">Presentation Done</option><option value="follow_up">Follow Up</option><option value="negotiation">Negotiation</option><option value="enrolled">Enrolled</option></Form.Select></Form.Group></Col>
              <Col md={12}><Form.Group className="mb-3"><Form.Label>Source</Form.Label><Form.Select name="source" value={formData.source} onChange={handleChange}><option value="referral">Referral</option><option value="social_media">Social Media</option><option value="event">Event</option><option value="cold_call">Cold Call</option><option value="website">Website</option><option value="other">Other</option></Form.Select></Form.Group></Col>
            </Row>
          </div>

          <div className="mb-4">
            <h6 className="mb-3 text-primary">Interest Information</h6>
            <Row>
              <Col md={12}><Form.Group className="mb-3"><Form.Label>Interest Level: {formData.interestLevel}/10</Form.Label><Form.Range name="interestLevel" min="1" max="10" value={formData.interestLevel} onChange={handleChange} /></Form.Group></Col>
              <Col md={12}><Form.Group className="mb-3"><Form.Label>Notes</Form.Label><Form.Control as="textarea" rows={3} name="notes" value={formData.notes} onChange={handleChange} /></Form.Group></Col>
            </Row>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>Cancel</Button>
          <Button variant="primary" type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save Changes'}</Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}

export default EditProspectModal;
