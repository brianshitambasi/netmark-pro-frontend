import React from 'react';
import { Modal, Button, Badge, Row, Col, Card } from 'react-bootstrap';
import { FaUser, FaPhoneAlt, FaMapMarkerAlt, FaBriefcase, FaCalendarAlt, FaStar, FaWhatsapp, FaEdit, FaTrash } from 'react-icons/fa';

function ProspectDetailsModal({ show, onHide, prospect, onEdit, onDelete, onWhatsApp }) {
  if (!prospect) return null;

  const getStatusBadge = (status) => {
    const variants = { new: 'secondary', contacted: 'info', qualified: 'primary', invited: 'warning', presentation_scheduled: 'info', presentation_done: 'success', follow_up: 'warning', negotiation: 'primary', enrolled: 'success', customer: 'success', not_interested: 'danger', lost: 'dark' };
    return <Badge bg={variants[status] || 'secondary'}>{status?.replace('_', ' ') || 'New'}</Badge>;
  };

  const getScoreColor = (score) => {
    if (score >= 70) return 'success';
    if (score >= 40) return 'warning';
    return 'danger';
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton className="bg-primary text-white"><Modal.Title><FaUser className="me-2" /> Prospect Details</Modal.Title></Modal.Header>
      <Modal.Body>
        <div className="text-center mb-4"><div className="bg-light rounded-circle p-3 d-inline-flex mb-3"><FaUser size={50} className="text-primary" /></div><h3>{prospect.name}</h3><div className="d-flex justify-content-center gap-2">{getStatusBadge(prospect.status)}<Badge bg={getScoreColor(prospect.score)}>Score: {prospect.score || 0}%</Badge></div></div>
        <Row>
          <Col md={6}><Card className="border-0 shadow-sm mb-3"><Card.Header className="bg-white"><strong><FaPhoneAlt className="me-2 text-primary" /> Contact Information</strong></Card.Header><Card.Body><p><strong>Phone:</strong> {prospect.phone}</p>{prospect.alternativePhone && <p><strong>Alternative Phone:</strong> {prospect.alternativePhone}</p>}{prospect.email && <p><strong>Email:</strong> {prospect.email}</p>}</Card.Body></Card></Col>
          <Col md={6}><Card className="border-0 shadow-sm mb-3"><Card.Header className="bg-white"><strong><FaMapMarkerAlt className="me-2 text-primary" /> Location</strong></Card.Header><Card.Body>{prospect.location?.city && <p><strong>City:</strong> {prospect.location.city}</p>}{prospect.location?.landmark && <p><strong>Landmark:</strong> {prospect.location.landmark}</p>}{prospect.location?.address && <p><strong>Address:</strong> {prospect.location.address}</p>}{!prospect.location?.city && !prospect.location?.address && <p className="text-muted">No location information provided</p>}</Card.Body></Card></Col>
          <Col md={6}><Card className="border-0 shadow-sm mb-3"><Card.Header className="bg-white"><strong><FaBriefcase className="me-2 text-primary" /> Professional Info</strong></Card.Header><Card.Body><p><strong>Occupation:</strong> {prospect.occupation || 'Not specified'}</p><p><strong>Source:</strong> {prospect.source?.replace('_', ' ') || 'Not specified'}</p></Card.Body></Card></Col>
          <Col md={6}><Card className="border-0 shadow-sm mb-3"><Card.Header className="bg-white"><strong><FaStar className="me-2 text-primary" /> Interest Level</strong></Card.Header><Card.Body><div className="d-flex align-items-center mb-2"><span className="me-2">Interest:</span><div className="flex-grow-1"><div className="progress" style={{ height: '8px' }}><div className="progress-bar bg-warning" style={{ width: `${(prospect.interestLevel / 10) * 100}%` }} /></div></div><span className="ms-2 fw-bold">{prospect.interestLevel || 0}/10</span></div>{prospect.notes && <><hr /><p><strong>Notes:</strong></p><p className="text-muted small">{prospect.notes}</p></>}</Card.Body></Card></Col>
          <Col md={12}><Card className="border-0 shadow-sm"><Card.Header className="bg-white"><strong><FaCalendarAlt className="me-2 text-primary" /> Timeline</strong></Card.Header><Card.Body><Row><Col md={6}><p><strong>Created:</strong> {new Date(prospect.createdAt).toLocaleDateString()}</p></Col><Col md={6}><p><strong>Last Updated:</strong> {new Date(prospect.updatedAt).toLocaleDateString()}</p></Col></Row></Card.Body></Card></Col>
        </Row>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>Close</Button>
        <Button variant="success" onClick={() => { onHide(); onWhatsApp(prospect.phone, prospect.name); }}><FaWhatsapp className="me-1" /> WhatsApp</Button>
        <Button variant="warning" onClick={() => { onHide(); onEdit(prospect); }}><FaEdit className="me-1" /> Edit</Button>
        <Button variant="danger" onClick={() => { onHide(); onDelete(prospect); }}><FaTrash className="me-1" /> Delete</Button>
      </Modal.Footer>
    </Modal>
  );
}

export default ProspectDetailsModal;
