import React, { useState, useEffect } from 'react';
import { Table, Card, Button, Badge, Row, Col, Form, InputGroup, Spinner, Pagination } from 'react-bootstrap';
import { 
  FaPlus, FaWhatsapp, FaChartLine, FaSearch, 
  FaFilter, FaEdit, FaTrash, FaEye, FaUserCheck,
  FaPhoneAlt, FaMapMarkerAlt, FaBriefcase,
  FaStar, FaEnvelope, FaCalendarAlt, FaMoneyBill, FaRocket,
  FaTrophy
} from 'react-icons/fa';
import axios from 'axios';
import toast from 'react-hot-toast';
import ProspectForm from '../components/ProspectForm';
import ProspectDetailsModal from '../components/ProspectDetailsModal';
import EditProspectModal from '../components/EditProspectModal';
import StageManager from '../components/StageManager';
import ConfirmationModal from '../components/ConfirmationModal';

const API_URL = process.env.REACT_APP_API_URL || 'https://netmark-pro-backend.onrender.com/api';

// Helper function to get source display name
const getSourceDisplay = (source) => {
  const sourceMap = {
    'referral': 'referral from a friend',
    'social_media': 'social media (Facebook/Instagram)',
    'event': 'the event we met at',
    'cold_call': 'a previous call',
    'website': 'our website',
    'other': 'other platform'
  };
  return sourceMap[source] || 'a mutual connection';
};

function Prospects() {
  const [prospects, setProspects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showStageModal, setShowStageModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedProspect, setSelectedProspect] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [summary, setSummary] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    loadProspects();
  }, []);

  const loadProspects = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/prospects`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProspects(response.data.data || []);
      setSummary(response.data.summary || {});
    } catch (error) {
      toast.error('Failed to load prospects');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedProspect) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/prospects/${selectedProspect._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(`Prospect ${selectedProspect.name} deleted`);
      setShowDeleteModal(false);
      setSelectedProspect(null);
      loadProspects();
    } catch (error) {
      toast.error('Failed to delete prospect');
    }
  };

  // Personalized WhatsApp message with source
  const handleSendWhatsApp = (prospect) => {
    const name = prospect.name || 'there';
    const source = getSourceDisplay(prospect.source);
    const message = `Hello ${name}! This is from Mr Brian. I hope you remember me - we connected via ${source}. Let me know when you're available for a quick chat.`;
    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/${prospect.phone}?text=${encoded}`, '_blank');
    toast.success(`Opening WhatsApp for ${name}`);
  };

  const getPipelineStageBadge = (stage) => {
    const stages = {
      lead: { icon: <FaStar />, color: 'secondary', label: 'LEAD' },
      qualified: { icon: <FaUserCheck />, color: 'info', label: 'QUALIFIED' },
      invited: { icon: <FaEnvelope />, color: 'warning', label: 'INVITED' },
      presented: { icon: <FaCalendarAlt />, color: 'primary', label: 'PRESENTED' },
      negotiation: { icon: <FaMoneyBill />, color: 'danger', label: 'NEGOTIATION' },
      enrolled: { icon: <FaRocket />, color: 'success', label: 'ENROLLED' }
    };
    const s = stages[stage] || stages.lead;
    return (
      <Badge bg={s.color} className={`px-2 py-1 ${s.color === 'warning' ? 'text-dark' : 'text-white'}`}>
        {s.icon} {s.label}
      </Badge>
    );
  };

  const getScoreColor = (score) => {
    if (score >= 70) return 'success';
    if (score >= 40) return 'warning';
    return 'secondary';
  };

  const filteredProspects = prospects.filter(p => 
    p.name?.toLowerCase().includes(search.toLowerCase()) || 
    p.phone?.includes(search) || 
    p.email?.toLowerCase().includes(search.toLowerCase())
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredProspects.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredProspects.length / itemsPerPage);

  const stageCounts = {
    lead: prospects.filter(p => p.pipelineStage === 'lead').length,
    qualified: prospects.filter(p => p.pipelineStage === 'qualified').length,
    invited: prospects.filter(p => p.pipelineStage === 'invited').length,
    presented: prospects.filter(p => p.pipelineStage === 'presented').length,
    negotiation: prospects.filter(p => p.pipelineStage === 'negotiation').length,
    enrolled: prospects.filter(p => p.pipelineStage === 'enrolled').length
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Loading prospects...</p>
      </div>
    );
  }

  return (
    <div className="fade-in">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2><FaChartLine className="me-2 text-primary" />Prospect Management</h2>
          <p className="text-muted mb-0">Track your prospects through the sales pipeline</p>
        </div>
        <Button variant="primary" onClick={() => setShowForm(true)}>
          <FaPlus className="me-2" /> Add Prospect
        </Button>
      </div>

      {/* Pipeline Stage Summary Cards */}
      <Row className="g-2 mb-4">
        <Col md={2} xs={6}>
          <Card className="border-0 shadow-sm text-center">
            <Card.Body className="py-2">
              <FaStar className="text-secondary mb-1" />
              <div className="fw-bold fs-4">{stageCounts.lead}</div>
              <small className="text-muted">Lead</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={2} xs={6}>
          <Card className="border-0 shadow-sm text-center">
            <Card.Body className="py-2">
              <FaUserCheck className="text-info mb-1" />
              <div className="fw-bold fs-4">{stageCounts.qualified}</div>
              <small className="text-muted">Qualified</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={2} xs={6}>
          <Card className="border-0 shadow-sm text-center">
            <Card.Body className="py-2">
              <FaEnvelope className="text-warning mb-1" />
              <div className="fw-bold fs-4">{stageCounts.invited}</div>
              <small className="text-muted">Invited</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={2} xs={6}>
          <Card className="border-0 shadow-sm text-center">
            <Card.Body className="py-2">
              <FaCalendarAlt className="text-primary mb-1" />
              <div className="fw-bold fs-4">{stageCounts.presented}</div>
              <small className="text-muted">Presented</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={2} xs={6}>
          <Card className="border-0 shadow-sm text-center">
            <Card.Body className="py-2">
              <FaMoneyBill className="text-danger mb-1" />
              <div className="fw-bold fs-4">{stageCounts.negotiation}</div>
              <small className="text-muted">Negotiation</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={2} xs={6}>
          <Card className="border-0 shadow-sm text-center">
            <Card.Body className="py-2">
              <FaRocket className="text-success mb-1" />
              <div className="fw-bold fs-4">{stageCounts.enrolled}</div>
              <small className="text-muted">Enrolled</small>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Stats Cards */}
      <Row className="g-3 mb-4">
        <Col md={3} sm={6}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <small className="text-muted">Total Prospects</small>
                  <h2 className="mb-0 fw-bold">{summary.total || 0}</h2>
                </div>
                <div className="bg-primary bg-opacity-10 p-3 rounded-circle">
                  <FaChartLine className="text-primary fs-4" />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} sm={6}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <small className="text-muted">Qualified</small>
                  <h2 className="mb-0 fw-bold">{summary.qualified || 0}</h2>
                </div>
                <div className="bg-info bg-opacity-10 p-3 rounded-circle">
                  <FaUserCheck className="text-info fs-4" />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} sm={6}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <small className="text-muted">Enrolled</small>
                  <h2 className="mb-0 fw-bold">{summary.enrolled || 0}</h2>
                </div>
                <div className="bg-success bg-opacity-10 p-3 rounded-circle">
                  <FaRocket className="text-success fs-4" />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} sm={6}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <small>Conversion Rate</small>
                  <h2 className="mb-0 fw-bold">
                    {summary.total > 0 ? Math.round((stageCounts.enrolled / summary.total) * 100) : 0}%
                  </h2>
                </div>
                <div className="bg-success bg-opacity-10 p-3 rounded-circle">
                  <FaTrophy className="text-success fs-4" />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card className="border-0 shadow-sm mb-4">
        <Card.Body>
          <Row className="g-3">
            <Col md={6}>
              <InputGroup>
                <InputGroup.Text><FaSearch /></InputGroup.Text>
                <Form.Control
                  placeholder="Search by name, phone or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </InputGroup>
            </Col>
            <Col md={4}>
              <InputGroup>
                <InputGroup.Text><FaFilter /></InputGroup.Text>
                <Form.Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="all">All Status</option>
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="qualified">Qualified</option>
                  <option value="invited">Invited</option>
                  <option value="enrolled">Enrolled</option>
                </Form.Select>
              </InputGroup>
            </Col>
            <Col md={2}>
              <Button variant="outline-secondary" onClick={loadProspects} className="w-100">
                Refresh
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Prospects Table */}
      <Card className="border-0 shadow-sm">
        <Card.Body className="p-0">
          <div className="table-responsive">
            <Table hover className="mb-0">
              <thead className="bg-light">
                <tr>
                  <th>Prospect</th>
                  <th>Contact</th>
                  <th>Location</th>
                  <th>Pipeline Stage</th>
                  <th>Score</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-5">
                      <p className="text-muted mb-0">No prospects found</p>
                      <Button variant="primary" size="sm" className="mt-2" onClick={() => setShowForm(true)}>
                        <FaPlus className="me-2" /> Add Prospect
                      </Button>
                    </td>
                  </tr>
                ) : (
                  currentItems.map((prospect) => (
                    <tr key={prospect._id} className="align-middle">
                      <td>
                        <div>
                          <strong>{prospect.name}</strong>
                          <br />
                          <small className="text-muted">
                            <FaBriefcase className="me-1" size={12} />
                            {prospect.occupation || 'No occupation'}
                          </small>
                          <br />
                          <small className="text-muted">
                            <FaMapMarkerAlt className="me-1" size={12} />
                            {prospect.location?.city || 'Location not set'}
                          </small>
                        </div>
                      </td>
                      <td>
                        <div>
                          <FaPhoneAlt className="me-1 text-success" size={12} /> {prospect.phone}
                        </div>
                        {prospect.email && (
                          <div>
                            <FaEnvelope className="me-1 text-info" size={12} /> 
                            <small>{prospect.email}</small>
                          </div>
                        )}
                      </td>
                      <td>{prospect.location?.city || 'N/A'}</td>
                      <td>{getPipelineStageBadge(prospect.pipelineStage)}</td>
                      <td>
                        <div className="text-center">
                          <span className={`fw-bold text-${getScoreColor(prospect.score)}`}>
                            {prospect.score || 0}%
                          </span>
                          <div className="progress mt-1" style={{ height: '3px' }}>
                            <div 
                              className={`progress-bar bg-${getScoreColor(prospect.score)}`}
                              style={{ width: `${prospect.score || 0}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="d-flex gap-1 flex-wrap">
                          {/* WhatsApp Button with personalized message */}
                          <Button 
                            variant="success" 
                            size="sm" 
                            onClick={() => handleSendWhatsApp(prospect)}
                            title="Send WhatsApp"
                          >
                            <FaWhatsapp />
                          </Button>
                          
                          {/* Rocket Button */}
                          <Button 
                            variant="info" 
                            size="sm" 
                            onClick={() => {
                              setSelectedProspect(prospect);
                              setShowStageModal(true);
                            }}
                            title="Update Pipeline Stage"
                          >
                            <FaRocket />
                          </Button>
                          
                          {/* View Details */}
                          <Button 
                            variant="primary" 
                            size="sm" 
                            onClick={() => {
                              setSelectedProspect(prospect);
                              setShowDetailsModal(true);
                            }}
                            title="View Details"
                          >
                            <FaEye />
                          </Button>
                          
                          {/* Edit */}
                          <Button 
                            variant="warning" 
                            size="sm" 
                            onClick={() => {
                              setSelectedProspect(prospect);
                              setShowEditModal(true);
                            }}
                            title="Edit Prospect"
                          >
                            <FaEdit />
                          </Button>
                          
                          {/* Delete */}
                          <Button 
                            variant="danger" 
                            size="sm" 
                            onClick={() => {
                              setSelectedProspect(prospect);
                              setShowDeleteModal(true);
                            }}
                            title="Delete Prospect"
                          >
                            <FaTrash />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </div>
        </Card.Body>
        {totalPages > 1 && (
          <Card.Footer className="bg-white">
            <div className="d-flex justify-content-between align-items-center">
              <small className="text-muted">
                Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredProspects.length)} of {filteredProspects.length} prospects
              </small>
              <Pagination size="sm" className="mb-0">
                <Pagination.First onClick={() => setCurrentPage(1)} disabled={currentPage === 1} />
                <Pagination.Prev onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1} />
                <Pagination.Next onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage === totalPages} />
                <Pagination.Last onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} />
              </Pagination>
            </div>
          </Card.Footer>
        )}
      </Card>

      {/* Modals */}
      <ProspectForm show={showForm} onHide={() => setShowForm(false)} onProspectAdded={loadProspects} />
      <ProspectDetailsModal show={showDetailsModal} onHide={() => setShowDetailsModal(false)} prospect={selectedProspect} onEdit={(p) => { setSelectedProspect(p); setShowEditModal(true); }} onDelete={(p) => { setSelectedProspect(p); setShowDeleteModal(true); }} onWhatsApp={handleSendWhatsApp} />
      <EditProspectModal show={showEditModal} onHide={() => setShowEditModal(false)} prospect={selectedProspect} onProspectUpdated={loadProspects} />
      <StageManager show={showStageModal} onHide={() => setShowStageModal(false)} prospect={selectedProspect} onUpdate={loadProspects} />
      <ConfirmationModal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} onConfirm={handleDelete} title="Delete Prospect" message={`Delete ${selectedProspect?.name}?`} confirmText="Delete" variant="danger" />
    </div>
  );
}

export default Prospects;
