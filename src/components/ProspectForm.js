import React, { useState } from 'react';
import { Modal, Form, Button, Row, Col, Alert } from 'react-bootstrap';
import { FaUserPlus, FaMapMarkerAlt, FaBriefcase, FaHeart } from 'react-icons/fa';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = process.env.REACT_APP_API_URL || 'https://netmark-pro-backend.onrender.com/api';

function ProspectForm({ show, onHide, onProspectAdded }) {
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
    interests: ['business_opportunity'],
    interestLevel: 5,
    notes: ''
  });

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
      const response = await axios.post(`${API_URL}/prospects`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        toast.success(response.data.message);
        onProspectAdded(response.data.data);
        onHide();
        setFormData({
          name: '',
          phone: '',
          email: '',
          alternativePhone: '',
          location: { address: '', city: '', state: '', country: 'Kenya', landmark: '' },
          occupation: '',
          source: 'other',
          interests: ['business_opportunity'],
          interestLevel: 5,
          notes: ''
        });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add prospect');
      toast.error('Failed to add prospect');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title><FaUserPlus className="me-2" />Add New Prospect</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          
          <h6 className="mb-3"><FaUserPlus className="me-2" />Basic Information</h6>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Full Name *</Form.Label>
                <Form.Control
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Phone Number *</Form.Label>
                <Form.Control
                  type="tel"
                  name="phone"
                  required
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="254712345678"
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Email</Form.Label>
                <Form.Control
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Alternative Phone</Form.Label>
                <Form.Control
                  type="tel"
                  name="alternativePhone"
                  value={formData.alternativePhone}
                  onChange={handleChange}
                />
              </Form.Group>
            </Col>
          </Row>

          <h6 className="mb-3"><FaMapMarkerAlt className="me-2" />Location Information</h6>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>City/Town</Form.Label>
                <Form.Control
                  type="text"
                  name="location.city"
                  value={formData.location.city}
                  onChange={handleChange}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Landmark</Form.Label>
                <Form.Control
                  type="text"
                  name="location.landmark"
                  value={formData.location.landmark}
                  onChange={handleChange}
                />
              </Form.Group>
            </Col>
            <Col md={12}>
              <Form.Group className="mb-3">
                <Form.Label>Address</Form.Label>
                <Form.Control
                  type="text"
                  name="location.address"
                  value={formData.location.address}
                  onChange={handleChange}
                />
              </Form.Group>
            </Col>
          </Row>

          <h6 className="mb-3"><FaBriefcase className="me-2" />Professional Information</h6>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Occupation</Form.Label>
                <Form.Control
                  type="text"
                  name="occupation"
                  value={formData.occupation}
                  onChange={handleChange}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Source</Form.Label>
                <Form.Select name="source" value={formData.source} onChange={handleChange}>
                  <option value="referral">Referral</option>
                  <option value="social_media">Social Media</option>
                  <option value="event">Event</option>
                  <option value="cold_call">Cold Call</option>
                  <option value="website">Website</option>
                  <option value="other">Other</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          <h6 className="mb-3"><FaHeart className="me-2" />Interest Information</h6>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Interest Level (1-10)</Form.Label>
                <Form.Range
                  name="interestLevel"
                  min="1"
                  max="10"
                  value={formData.interestLevel}
                  onChange={handleChange}
                />
                <div className="text-center">{formData.interestLevel}/10</div>
              </Form.Group>
            </Col>
            <Col md={12}>
              <Form.Group className="mb-3">
                <Form.Label>Notes</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Any additional information about this prospect..."
                />
              </Form.Group>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>Cancel</Button>
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? 'Adding...' : 'Add Prospect'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}

export default ProspectForm;
