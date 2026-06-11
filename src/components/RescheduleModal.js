import React, { useState } from 'react';
import { Modal, Button, Form, Alert } from 'react-bootstrap';
import { FaClock } from 'react-icons/fa';
import toast from 'react-hot-toast';

const API_URL = process.env.REACT_APP_API_URL || 'https://netmark-pro-backend.onrender.com/api';

function RescheduleModal({ show, onHide, followup, onRescheduleComplete }) {
  const [loading, setLoading] = useState(false);
  const [selectedOption, setSelectedOption] = useState('');
  const [customDate, setCustomDate] = useState('');
  const [reason, setReason] = useState('');

  const quickOptions = [
    { value: 'tomorrow', label: 'Tomorrow', days: 1 },
    { value: 'in_3_days', label: 'In 3 Days', days: 3 },
    { value: 'in_1_week', label: 'In 1 Week', days: 7 },
    { value: 'in_2_weeks', label: 'In 2 Weeks', days: 14 },
    { value: 'in_1_month', label: 'In 1 Month', days: 30 }
  ];

  const handleQuickReschedule = async (option) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/followups/${followup._id}/quick-reschedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ option: option })
      });
      
      const data = await response.json();
      if (data.success) {
        toast.success(data.message);
        onRescheduleComplete();
        onHide();
      } else {
        toast.error(data.message || 'Failed to reschedule');
      }
    } catch (error) {
      console.error('Reschedule error:', error);
      toast.error('Failed to reschedule');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomReschedule = async () => {
    if (!customDate) {
      toast.error('Please select a date');
      return;
    }
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/followups/${followup._id}/reschedule`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          nextCallDate: customDate,
          reason: reason || 'Rescheduled by user'
        })
      });
      
      const data = await response.json();
      if (data.success) {
        toast.success(data.message);
        onRescheduleComplete();
        onHide();
      } else {
        toast.error(data.message || 'Failed to reschedule');
      }
    } catch (error) {
      console.error('Reschedule error:', error);
      toast.error('Failed to reschedule');
    } finally {
      setLoading(false);
    }
  };

  if (!followup) return null;

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title><FaClock className="me-2 text-warning" />Reschedule Follow-up</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p><strong>Prospect:</strong> {followup.name}</p>
        <p><strong>Current Date:</strong> {new Date(followup.nextCallDate).toLocaleDateString()}</p>
        
        <Alert variant="info" className="small">
          <strong>Quick Options</strong> - Click to reschedule immediately
        </Alert>
        
        <div className="d-grid gap-2 mb-4">
          {quickOptions.map((opt) => (
            <Button
              key={opt.value}
              variant="outline-primary"
              onClick={() => handleQuickReschedule(opt.value)}
              disabled={loading}
            >
              {opt.label} {opt.value === 'tomorrow' ? '(+1 day)' : `(+${opt.days} days)`}
            </Button>
          ))}
        </div>
        
        <hr />
        
        <Alert variant="secondary" className="small">
          <strong>Custom Date</strong> - Select a specific date
        </Alert>
        
        <Form.Group className="mb-3">
          <Form.Label>Select New Date</Form.Label>
          <Form.Control
            type="date"
            value={customDate}
            onChange={(e) => setCustomDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
          />
        </Form.Group>
        
        <Form.Group className="mb-3">
          <Form.Label>Reason (Optional)</Form.Label>
          <Form.Control
            as="textarea"
            rows={2}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g., Customer requested, No answer, etc."
          />
        </Form.Group>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cancel
        </Button>
        <Button 
          variant="primary" 
          onClick={handleCustomReschedule}
          disabled={loading || !customDate}
        >
          {loading ? 'Processing...' : 'Confirm Reschedule'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default RescheduleModal;
