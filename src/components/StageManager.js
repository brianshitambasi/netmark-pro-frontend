import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Alert, Row, Col, Badge } from 'react-bootstrap';
import { FaEnvelope, FaCalendarAlt, FaMoneyBill, FaUserCheck, FaStar, FaRocket } from 'react-icons/fa';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = process.env.REACT_APP_API_URL || 'https://netmark-pro-backend.onrender.com/api';

const StageManager = ({ show, onHide, prospect, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedStage, setSelectedStage] = useState('lead');
  const [qualificationNotes, setQualificationNotes] = useState('');
  const [invitationMethod, setInvitationMethod] = useState('whatsapp');
  const [eventName, setEventName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventLink, setEventLink] = useState('');
  const [packageSelected, setPackageSelected] = useState('');
  const [amount, setAmount] = useState('');
  const [sponsorName, setSponsorName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');

  useEffect(() => {
    if (prospect) {
      setSelectedStage(prospect.pipelineStage || 'lead');
      setQualificationNotes(prospect.qualificationNotes || '');
      setInvitationMethod(prospect.invitationDetails?.method || 'whatsapp');
      setEventName(prospect.invitationDetails?.eventName || '');
      setEventDate(prospect.invitationDetails?.eventDate ? prospect.invitationDetails.eventDate.split('T')[0] : '');
      setEventLink(prospect.invitationDetails?.eventLink || '');
      setPackageSelected(prospect.enrollmentDetails?.package || '');
      setAmount(prospect.enrollmentDetails?.amount || '');
      setSponsorName(prospect.enrollmentDetails?.sponsorName || '');
      setAccountNumber(prospect.enrollmentDetails?.accountNumber || '');
    }
  }, [prospect]);

  const stages = [
    { value: 'lead', label: 'Lead', icon: <FaStar />, color: 'secondary', description: 'Initial contact' },
    { value: 'qualified', label: 'Qualified', icon: <FaUserCheck />, color: 'info', description: 'Meets criteria' },
    { value: 'invited', label: 'Invited', icon: <FaEnvelope />, color: 'warning', description: 'Invited to event' },
    { value: 'presented', label: 'Presented', icon: <FaCalendarAlt />, color: 'primary', description: 'Presentation done' },
    { value: 'negotiation', label: 'Negotiation', icon: <FaMoneyBill />, color: 'danger', description: 'Discussing terms' },
    { value: 'enrolled', label: 'Enrolled', icon: <FaRocket />, color: 'success', description: 'Successfully enrolled' }
  ];

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const updateData = { 
        pipelineStage: selectedStage, 
        qualificationNotes, 
        invitationDetails: { 
          method: invitationMethod, 
          eventName, 
          eventDate, 
          eventLink 
        }, 
        enrollmentDetails: { 
          package: packageSelected, 
          amount: parseFloat(amount) || 0, 
          sponsorName, 
          accountNumber 
        } 
      };
      const response = await axios.put(`${API_URL}/prospects/${prospect._id}`, updateData, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      if (response.data.success) {
        toast.success(`Prospect moved to ${stages.find(s => s.value === selectedStage)?.label} stage`);
        if (onUpdate) onUpdate();
        onHide();
      } else {
        setError(response.data.message || 'Update failed');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update stage');
      toast.error('Failed to update stage');
    } finally {
      setLoading(false);
    }
  };

  const currentStage = stages.find(s => s.value === selectedStage);
  if (!prospect) return null;

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title><FaRocket className="me-2 text-primary" />Update Pipeline - {prospect.name}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        <div className="mb-4">
          <label className="fw-bold mb-2">Select Pipeline Stage:</label>
          <div className="d-flex flex-wrap gap-2">
            {stages.map((stage) => (
              <Button 
                key={stage.value} 
                variant={selectedStage === stage.value ? stage.color : 'outline-secondary'} 
                size="sm" 
                onClick={() => setSelectedStage(stage.value)}
              >
                {stage.icon} {stage.label}
              </Button>
            ))}
          </div>
        </div>
        <div className="mb-3">
          <Badge bg={currentStage?.color} className="fs-6 p-2">
            {currentStage?.icon} Current: {currentStage?.label}
          </Badge>
        </div>
        <hr />
        {(selectedStage === 'qualified' || selectedStage === 'invited' || selectedStage === 'presented' || selectedStage === 'negotiation' || selectedStage === 'enrolled') && (
          <div className="mb-3">
            <label className="fw-bold mb-2">Qualification Notes</label>
            <Form.Control 
              as="textarea" 
              rows={2} 
              value={qualificationNotes} 
              onChange={(e) => setQualificationNotes(e.target.value)} 
              placeholder="Why is this prospect qualified?" 
            />
          </div>
        )}
        {(selectedStage === 'invited' || selectedStage === 'presented' || selectedStage === 'negotiation' || selectedStage === 'enrolled') && (
          <div className="mb-3">
            <label className="fw-bold mb-2">Invitation Details</label>
            <Row>
              <Col md={6}>
                <Form.Select 
                  value={invitationMethod} 
                  onChange={(e) => setInvitationMethod(e.target.value)} 
                  className="mb-2"
                >
                  <option value="whatsapp">WhatsApp</option>
                  <option value="email">Email</option>
                  <option value="call">Phone Call</option>
                  <option value="in_person">In Person</option>
                </Form.Select>
              </Col>
              <Col md={6}>
                <Form.Control 
                  type="text" 
                  placeholder="Event Name" 
                  value={eventName} 
                  onChange={(e) => setEventName(e.target.value)} 
                  className="mb-2" 
                />
              </Col>
              <Col md={6}>
                <Form.Control 
                  type="date" 
                  value={eventDate} 
                  onChange={(e) => setEventDate(e.target.value)} 
                  className="mb-2" 
                />
              </Col>
              <Col md={6}>
                <Form.Control 
                  type="text" 
                  placeholder="Event Link" 
                  value={eventLink} 
                  onChange={(e) => setEventLink(e.target.value)} 
                />
              </Col>
            </Row>
          </div>
        )}
        {selectedStage === 'enrolled' && (
          <div className="mb-3">
            <label className="fw-bold mb-2">Enrollment Details</label>
            <Row>
              <Col md={6}>
                <Form.Select 
                  value={packageSelected} 
                  onChange={(e) => setPackageSelected(e.target.value)} 
                  className="mb-2"
                >
                  <option value="">Select Package</option>
                  <option value="ENTRIVERSE">ENTRIVERSE - KSh 29,888</option>
                  <option value="NEOVERSE">NEOVERSE - KSh 42,000</option>
                  <option value="TECHNOVERSE">TECHNOVERSE - KSh 123,900</option>
                  <option value="DIGIVERSE">DIGIVERSE - KSh 254,200</option>
                  <option value="MEGAVERSE">MEGAVERSE - KSh 505,100</option>
                </Form.Select>
              </Col>
              <Col md={6}>
                <Form.Control 
                  type="number" 
                  placeholder="Amount Paid" 
                  value={amount} 
                  onChange={(e) => setAmount(e.target.value)} 
                  className="mb-2" 
                />
              </Col>
              <Col md={6}>
                <Form.Control 
                  type="text" 
                  placeholder="Sponsor Name" 
                  value={sponsorName} 
                  onChange={(e) => setSponsorName(e.target.value)} 
                  className="mb-2" 
                />
              </Col>
              <Col md={6}>
                <Form.Control 
                  type="text" 
                  placeholder="Account Number" 
                  value={accountNumber} 
                  onChange={(e) => setAccountNumber(e.target.value)} 
                />
              </Col>
            </Row>
          </div>
        )}
        <Alert variant="info" className="mt-2 small">
          <strong>{currentStage?.label} Stage:</strong> {currentStage?.description}
        </Alert>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>Cancel</Button>
        <Button 
          variant={currentStage?.color} 
          onClick={handleSubmit} 
          disabled={loading}
        >
          {loading ? 'Updating...' : `Move to ${currentStage?.label}`}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default StageManager;
