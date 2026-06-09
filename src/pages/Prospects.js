import React, { useState, useEffect } from 'react';
import { Table, Card, Button, Badge, Row, Col, Form, InputGroup, Spinner, Alert } from 'react-bootstrap';
import { FaPlus, FaWhatsapp, FaEnvelope, FaCalendar, FaChartLine, FaSearch, FaFilter } from 'react-icons/fa';
import axios from 'axios';
import toast from 'react-hot-toast';
import ProspectForm from '../components/ProspectForm';

const API_URL = process.env.REACT_APP_API_URL || 'https://netmark-pro-backend.onrender.com/api';

function Prospects() {
  const [prospects, setProspects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [summary, setSummary] = useState({});

  useEffect(() => {
    loadProspects();
  }, []);

  const loadProspects = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/prospects`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProspects(response.data.data);
      setSummary(response.data.summary);
    } catch (error) {
      toast.error('Failed to load prospects');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      new: 'secondary',
      contacted: 'info',
      qualified: 'primary',
      invited: 'warning',
      presentation_scheduled: 'info',
      presentation_done: 'success',
      follow_up: 'warning',
      negotiation: 'primary',
      enrolled: 'success',
      not_interested: 'danger',
      lost: 'dark'
    };
    return <Badge bg={variants[status] || 'secondary'}>{status.replace('_', ' ')}</Badge>;
  };

  const getPriorityBadge = (priority) => {
    const variants = {
      high: 'danger',
      medium: 'warning',
      low: 'secondary'
    };
    return <Badge bg={variants[priority] || 'secondary'}>{priority}</Badge>;
  };

  const getScoreColor = (score) => {
    if (score >= 70) return 'success';
    if (score >= 40) return 'warning';
    return 'danger';
  };

  const filteredProspects = prospects.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
                         p.phone.includes(search);
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2><FaChartLine className="me-2" />Prospect Management</h2>
        <Button variant="primary" onClick={() => setShowForm(true)}>
          <FaPlus className="me-2" /> Add Prospect
        </Button>
      </div>

      {/* Summary Cards */}
      <Row className="g-3 mb-4">
        <Col md={3}>
          <Card className="bg-primary text-white">
            <Card.Body>
              <div className="d-flex justify-content-between">
                <div>
                  <small>Total Prospects</small>
                  <h3 className="mb-0">{summary.total || 0}</h3>
                </div>
                <FaChartLine size={30} className="opacity-50" />
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="bg-success text-white">
            <Card.Body>
              <div className="d-flex justify-content-between">
                <div>
                  <small>Qualified</small>
                  <h3 className="mb-0">{summary.qualified || 0}</h3>
                </div>
                <FaChartLine size={30} className="opacity-50" />
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="bg-warning text-white">
            <Card.Body>
              <div className="d-flex justify-content-between">
                <div>
                  <small>Invited</small>
                  <h3 className="mb-0">{summary.invited || 0}</h3>
                </div>
                <FaChartLine size={30} className="opacity-50" />
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="bg-info text-white">
            <Card.Body>
              <div className="d-flex justify-content-between">
                <div>
                  <small>Enrolled</small>
                  <h3 className="mb-0">{summary.enrolled || 0}</h3>
                </div>
                <FaChartLine size={30} className="opacity-50" />
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Filters */}
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
        <Col md={3}>
          <InputGroup>
            <InputGroup.Text><FaFilter /></InputGroup.Text>
            <Form.Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All Status</option>
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="qualified">Qualified</option>
              <option value="invited">Invited</option>
              <option value="presentation_scheduled">Presentation Scheduled</option>
              <option value="presentation_done">Presentation Done</option>
              <option value="follow_up">Follow Up</option>
              <option value="enrolled">Enrolled</option>
            </Form.Select>
          </InputGroup>
        </Col>
      </Row>

      {/* Prospects Table */}
      <Card className="shadow-sm border-0">
        <Card.Body className="p-0">
          <div className="table-responsive">
            <Table hover className="mb-0">
              <thead className="bg-light">
                <tr>
                  <th>Name</th>
                  <th>Contact</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Score</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProspects.map((prospect) => (
                  <tr key={prospect._id}>
                    <td>
                      <strong>{prospect.name}</strong>
                      <br />
                      <small className="text-muted">{prospect.occupation || 'No occupation'}</small>
                    </td>
                    <td>
                      {prospect.phone}<br />
                      <small className="text-muted">{prospect.email || 'No email'}</small>
                    </td>
                    <td>{prospect.location?.city || 'N/A'}</td>
                    <td>{getStatusBadge(prospect.status)}</td>
                    <td>{getPriorityBadge(prospect.priority)}</td>
                    <td>
                      <Badge bg={getScoreColor(prospect.score)}>{prospect.score}%</Badge>
                    </td>
                    <td>
                      <Button
                        variant="success"
                        size="sm"
                        className="me-1"
                        onClick={() => window.open(`https://wa.me/${prospect.phone}`, '_blank')}
                      >
                        <FaWhatsapp />
                      </Button>
                      <Button
                        variant="info"
                        size="sm"
                        className="me-1"
                        onClick={() => window.location.href = `mailto:${prospect.email}`}
                      >
                        <FaEnvelope />
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => alert('View details coming soon')}
                      >
                        <FaCalendar />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>

      {/* Add Prospect Modal */}
      <ProspectForm
        show={showForm}
        onHide={() => setShowForm(false)}
        onProspectAdded={loadProspects}
      />
    </div>
  );
}

export default Prospects;
