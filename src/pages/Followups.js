import React, { useState } from 'react';
import { Table, Button, Card, Modal, Form, Row, Col, Badge, InputGroup, Tabs, Tab, ProgressBar, Alert } from 'react-bootstrap';
import { 
  FaPlus, FaWhatsapp, FaCheck, FaTrash, FaSearch, FaCalendarAlt, 
  FaClock, FaMoneyBill, FaWallet, FaChartLine, FaPercent,
  FaEdit, FaStar, FaGem, FaCrown, FaRocket, FaCheckCircle
} from 'react-icons/fa';
import { useFollowups } from '../hooks/useFollowups';
import ConfirmationModal from '../components/ConfirmationModal';
import PaymentOptions from '../components/PaymentOptions';
import toast from 'react-hot-toast';

const PACKAGES = [
  { name: 'ENTRIVERSE', price: 29888, accounts: 1, icon: <FaStar />, color: 'info' },
  { name: 'NEOVERSE', price: 42000, accounts: 3, icon: <FaRocket />, color: 'primary', recommended: true },
  { name: 'TECHNOVERSE', price: 123900, accounts: 7, icon: <FaGem />, color: 'warning' },
  { name: 'DIGIVERSE', price: 254200, accounts: 15, icon: <FaCrown />, color: 'danger' },
  { name: 'MEGAVERSE', price: 505100, accounts: 31, icon: <FaCrown />, color: 'dark' }
];

function Followups() {
  const { followups, loading, createFollowup, deleteFollowup, whatsappClick, markFollowed } = useFollowups();

  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showAmountModal, setShowAmountModal] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [selectedFollowup, setSelectedFollowup] = useState(null);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('followups');
  const [rescheduleLoading, setRescheduleLoading] = useState(false);
  const [amountToSet, setAmountToSet] = useState('');
  const [rescheduleData, setRescheduleData] = useState({ nextCallDate: '', reason: '', daysToAdd: '' });
  const [formData, setFormData] = useState({
    name: '', phone: '', email: '', category: 'warm', nextCallDate: '', notes: '', totalAmount: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const submitData = {
      ...formData,
      totalAmount: selectedPackage ? selectedPackage.price : formData.totalAmount,
      packageName: selectedPackage ? selectedPackage.name : 'CUSTOM'
    };
    await createFollowup(submitData);
    setShowModal(false);
    setSelectedPackage(null);
    setFormData({ name: '', phone: '', email: '', category: 'warm', nextCallDate: '', notes: '', totalAmount: '' });
  };

  const handleDelete = async () => {
    if (selectedId) {
      await deleteFollowup(selectedId);
      setShowDeleteModal(false);
      setSelectedId(null);
    }
  };

  const handleSetAmount = async () => {
    if (!selectedId || !amountToSet) {
      toast.error('Please enter an amount');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      await fetch(`${process.env.REACT_APP_API_URL}/followups/${selectedId}/set-amount`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ totalAmount: parseFloat(amountToSet) })
      });
      toast.success('Amount set successfully');
      setShowAmountModal(false);
      setAmountToSet('');
      window.location.reload();
    } catch (error) {
      toast.error('Failed to set amount');
    }
  };

  const handleSelectPackage = (pkg) => {
    setSelectedPackage(pkg);
    setFormData({ ...formData, totalAmount: pkg.price });
  };

  const handleReschedule = async () => {
    if (!selectedId) return;
    
    setRescheduleLoading(true);
    try {
      let url, body, method;
      
      if (rescheduleData.daysToAdd) {
        url = `${process.env.REACT_APP_API_URL}/followups/${selectedId}/quick-reschedule`;
        body = JSON.stringify({ option: rescheduleData.daysToAdd });
        method = 'POST';
      } else if (rescheduleData.nextCallDate) {
        url = `${process.env.REACT_APP_API_URL}/followups/${selectedId}/reschedule`;
        body = JSON.stringify({
          nextCallDate: rescheduleData.nextCallDate,
          reason: rescheduleData.reason || 'Rescheduled by user'
        });
        method = 'PUT';
      } else {
        toast.error('Please select a date or quick option');
        setRescheduleLoading(false);
        return;
      }
      
      const token = localStorage.getItem('token');
      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: body
      });
      
      const data = await response.json();
      if (data.success) {
        toast.success(data.message);
        setShowRescheduleModal(false);
        setRescheduleData({ nextCallDate: '', reason: '', daysToAdd: '' });
        window.location.reload();
      } else {
        toast.error(data.message || 'Failed to reschedule');
      }
    } catch (error) {
      console.error('Reschedule error:', error);
      toast.error('Failed to reschedule follow-up');
    } finally {
      setRescheduleLoading(false);
    }
  };

  const handleWhatsApp = async (id) => {
    await whatsappClick(id);
  };

  const handleMarkFollowed = async (id) => {
    const days = window.prompt('Schedule next follow-up in (days):', '3');
    if (days && !isNaN(parseInt(days))) {
      await markFollowed(id, `Followed up - next in ${days} days`);
      const option = days === '1' ? 'tomorrow' : days === '3' ? 'in_3_days' : days === '7' ? 'in_1_week' : 'in_1_month';
      await fetch(`${process.env.REACT_APP_API_URL}/followups/${id}/quick-reschedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ option })
      });
      toast.success(`Next follow-up scheduled in ${days} days`);
    } else {
      await markFollowed(id, 'Followed up via app');
    }
    window.location.reload();
  };

  const getPaymentBadge = (status) => {
    const variants = { paid: 'success', partial: 'warning', pending: 'danger' };
    const labels = { paid: '✅ Paid', partial: '⚠️ Partial', pending: '⏳ Pending' };
    return <Badge bg={variants[status] || 'secondary'}>{labels[status] || status}</Badge>;
  };

  const filteredFollowups = followups.filter(f => 
    f.name?.toLowerCase().includes(search.toLowerCase()) || 
    (f.phone && f.phone.includes(search))
  );

  const stats = {
    total: filteredFollowups.length,
    paid: filteredFollowups.filter(f => f.paymentStatus === 'paid').length,
    partial: filteredFollowups.filter(f => f.paymentStatus === 'partial').length,
    pending: filteredFollowups.filter(f => f.paymentStatus === 'pending').length,
    totalRevenue: filteredFollowups.reduce((sum, f) => sum + (f.amountPaid || 0), 0)
  };

  if (loading) {
    return <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>;
  }

  return (
    <div className="fade-in">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Follow-up Management</h2>
        <Button variant="primary" onClick={() => setShowModal(true)}><FaPlus className="me-2" /> Add Follow-up</Button>
      </div>

      <Row className="g-3 mb-4">
        <Col md={3}><Card className="bg-success text-white"><Card.Body><div className="d-flex justify-content-between"><div><small>Paid</small><h3 className="mb-0">{stats.paid}</h3></div><FaWallet size={30} className="opacity-50" /></div></Card.Body></Card></Col>
        <Col md={3}><Card className="bg-warning text-dark"><Card.Body><div className="d-flex justify-content-between"><div><small>Partial</small><h3 className="mb-0">{stats.partial}</h3></div><FaPercent size={30} className="opacity-50" /></div></Card.Body></Card></Col>
        <Col md={3}><Card className="bg-danger text-white"><Card.Body><div className="d-flex justify-content-between"><div><small>Pending</small><h3 className="mb-0">{stats.pending}</h3></div><FaClock size={30} className="opacity-50" /></div></Card.Body></Card></Col>
        <Col md={3}><Card className="bg-info text-white"><Card.Body><div className="d-flex justify-content-between"><div><small>Revenue</small><h3 className="mb-0">KSh {stats.totalRevenue.toLocaleString()}</h3></div><FaChartLine size={30} className="opacity-50" /></div></Card.Body></Card></Col>
      </Row>

      <Row className="mb-4"><Col md={6}><InputGroup><InputGroup.Text><FaSearch /></InputGroup.Text><Form.Control placeholder="Search by name or phone..." value={search} onChange={(e) => setSearch(e.target.value)} /></InputGroup></Col></Row>

      <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="mb-3">
        <Tab eventKey="followups" title="All Follow-ups">
          <Card className="shadow-sm border-0">
            <Card.Body className="p-0">
              <div className="table-responsive">
                <Table hover className="mb-0">
                  <thead className="bg-light">
                    <tr>
                      <th>Name</th>
                      <th>Phone</th>
                      <th>Category</th>
                      <th>Next Call</th>
                      <th>Payment</th>
                      <th>Progress</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredFollowups.map((f) => {
                      const paidAmount = f.amountPaid || 0;
                      const totalAmount = f.totalAmount || 0;
                      const progressPercent = totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0;
                      return (
                        <tr key={f._id} className={new Date(f.nextCallDate) < new Date() ? 'table-danger' : ''}>
                          <td>
                            <div>
                              <strong>{f.name}</strong>
                              {f.notes && <><br /><small className="text-muted">{f.notes.substring(0, 30)}</small></>}
                            </div>
                          </td>
                          <td>{f.phone}</td>
                          <td><Badge bg={f.category === 'hot' ? 'danger' : f.category === 'warm' ? 'warning' : 'secondary'}>{f.category}</Badge></td>
                          <td><div className="d-flex align-items-center"><FaCalendarAlt className="me-2 text-muted" />{new Date(f.nextCallDate).toLocaleDateString()}</div></td>
                          <td>{getPaymentBadge(f.paymentStatus)}</td>
                          <td>
                            <div className="d-flex justify-content-between small mb-1">
                              <span>KSh {paidAmount.toLocaleString()}</span>
                              <span>/ KSh {totalAmount.toLocaleString()}</span>
                            </div>
                            <ProgressBar now={progressPercent} style={{ height: '8px' }} className="mt-1" />
                            <small className="text-muted d-block mt-1">{progressPercent.toFixed(0)}% paid</small>
                          </td>
                          <td>
                            <div className="d-flex flex-wrap gap-1">
                              <Button variant="success" size="sm" onClick={() => handleWhatsApp(f._id)}><FaWhatsapp /></Button>
                              <Button variant="info" size="sm" onClick={() => handleMarkFollowed(f._id)}><FaCheck /></Button>
                              <Button variant="warning" size="sm" onClick={() => { setSelectedId(f._id); setSelectedFollowup(f); setShowRescheduleModal(true); }}><FaClock /></Button>
                              <Button variant="primary" size="sm" onClick={() => { setSelectedId(f._id); setSelectedFollowup(f); setShowPaymentModal(true); }}><FaMoneyBill /></Button>
                              <Button variant="danger" size="sm" onClick={() => { setSelectedId(f._id); setShowDeleteModal(true); }}><FaTrash /></Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>
        </Tab>
      </Tabs>

      {/* Add Follow-up Modal */}
      <Modal show={showModal} onHide={() => { setShowModal(false); setSelectedPackage(null); }} size="lg" centered>
        <Modal.Header closeButton><Modal.Title><FaPlus className="me-2" />Add Follow-up</Modal.Title></Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Alert variant="info" className="small"><strong>Select Investment Package</strong></Alert>
            <div className="mb-4">
              <Form.Label className="fw-bold">Select Package</Form.Label>
              <Row className="g-2">
                {PACKAGES.map((pkg, idx) => (
                  <Col md={4} lg={2.4} key={idx}>
                    <div className={`border rounded p-2 text-center cursor-pointer ${selectedPackage?.name === pkg.name ? 'border-primary bg-primary bg-opacity-10' : 'border-secondary'}`} style={{ cursor: 'pointer' }} onClick={() => handleSelectPackage(pkg)}>
                      <div className="fs-2">{pkg.icon}</div>
                      <div className="fw-bold small">{pkg.name}</div>
                      <div className="text-primary fw-bold">KSh {pkg.price.toLocaleString()}</div>
                      <div className="small text-muted">{pkg.accounts} Acc</div>
                      {selectedPackage?.name === pkg.name && <FaCheckCircle className="text-primary" />}
                    </div>
                  </Col>
                ))}
              </Row>
            </div>
            <hr />
            <Row>
              <Col md={6}><Form.Group className="mb-3"><Form.Label>Name *</Form.Label><Form.Control type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} /></Form.Group></Col>
              <Col md={6}><Form.Group className="mb-3"><Form.Label>Phone *</Form.Label><Form.Control type="tel" required value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} placeholder="254712345678" /></Form.Group></Col>
              <Col md={6}><Form.Group className="mb-3"><Form.Label>Email</Form.Label><Form.Control type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} /></Form.Group></Col>
              <Col md={6}><Form.Group className="mb-3"><Form.Label>Category</Form.Label><Form.Select value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})}><option value="hot">Hot</option><option value="warm">Warm</option><option value="cold">❄️ Cold</option></Form.Select></Form.Group></Col>
              <Col md={6}><Form.Group className="mb-3"><Form.Label>Next Call Date *</Form.Label><Form.Control type="date" required value={formData.nextCallDate} onChange={(e) => setFormData({...formData, nextCallDate: e.target.value})} /></Form.Group></Col>
              <Col md={12}><Form.Group className="mb-3"><Form.Label>Total Amount (KSh)</Form.Label><Form.Control type="number" value={formData.totalAmount} onChange={(e) => setFormData({...formData, totalAmount: e.target.value})} placeholder="Enter amount or select package" disabled={!!selectedPackage} /></Form.Group></Col>
              <Col md={12}><Form.Group className="mb-3"><Form.Label>Notes</Form.Label><Form.Control as="textarea" rows={2} value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} /></Form.Group></Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => { setShowModal(false); setSelectedPackage(null); }}>Cancel</Button>
            <Button variant="primary" type="submit">Add Prospect</Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Set Amount Modal */}
      <Modal show={showAmountModal} onHide={() => setShowAmountModal(false)} centered>
        <Modal.Header closeButton><Modal.Title><FaEdit className="me-2" />Set Package for {selectedFollowup?.name}</Modal.Title></Modal.Header>
        <Modal.Body>
          <Alert variant="info">Select a package:</Alert>
          <Row className="mb-3 g-2">
            {PACKAGES.map((pkg, idx) => (
              <Col md={6} key={idx}>
                <Button variant="outline-primary" className="w-100 text-start" onClick={() => setAmountToSet(pkg.price.toString())}>
                  <strong>{pkg.name}</strong><br />
                  <small>KSh {pkg.price.toLocaleString()}</small>
                </Button>
              </Col>
            ))}
          </Row>
          <Form.Group><Form.Label>Custom Amount</Form.Label><Form.Control type="number" value={amountToSet} onChange={(e) => setAmountToSet(e.target.value)} placeholder="Enter amount" autoFocus /></Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAmountModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleSetAmount}>Set Amount</Button>
        </Modal.Footer>
      </Modal>

      {/* Reschedule Modal */}
      <Modal show={showRescheduleModal} onHide={() => setShowRescheduleModal(false)} centered>
        <Modal.Header closeButton><Modal.Title><FaClock className="me-2" />Reschedule Follow-up</Modal.Title></Modal.Header>
        <Modal.Body>
          <p><strong>{selectedFollowup?.name}</strong> - Current: {selectedFollowup && new Date(selectedFollowup.nextCallDate).toLocaleDateString()}</p>
          <Form.Group><Form.Label>Quick Options</Form.Label><div className="d-grid gap-2">
            <Button variant="outline-primary" onClick={() => { setRescheduleData({ ...rescheduleData, daysToAdd: 'tomorrow', nextCallDate: '' }); setTimeout(handleReschedule, 100); }}>Tomorrow</Button>
            <Button variant="outline-primary" onClick={() => { setRescheduleData({ ...rescheduleData, daysToAdd: 'in_3_days', nextCallDate: '' }); setTimeout(handleReschedule, 100); }}>In 3 Days</Button>
            <Button variant="outline-primary" onClick={() => { setRescheduleData({ ...rescheduleData, daysToAdd: 'in_1_week', nextCallDate: '' }); setTimeout(handleReschedule, 100); }}>In 1 Week</Button>
          </div></Form.Group>
          <hr />
          <Form.Group><Form.Label>Custom Date</Form.Label><Form.Control type="date" value={rescheduleData.nextCallDate} onChange={(e) => setRescheduleData({...rescheduleData, nextCallDate: e.target.value, daysToAdd: ''})} min={new Date().toISOString().split('T')[0]} /></Form.Group>
          <Form.Group><Form.Label>Reason</Form.Label><Form.Control as="textarea" rows={2} value={rescheduleData.reason} onChange={(e) => setRescheduleData({...rescheduleData, reason: e.target.value})} /></Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowRescheduleModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleReschedule} disabled={rescheduleLoading}>Confirm</Button>
        </Modal.Footer>
      </Modal>

      {/* Payment Options Modal */}
      {selectedFollowup && <PaymentOptions show={showPaymentModal} onHide={() => setShowPaymentModal(false)} followup={selectedFollowup} onPaymentComplete={() => window.location.reload()} />}

      {/* Delete Modal */}
      <ConfirmationModal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} onConfirm={handleDelete} title="Delete" message="Delete this follow-up?" confirmText="Delete" variant="danger" />
    </div>
  );
}

export default Followups;
