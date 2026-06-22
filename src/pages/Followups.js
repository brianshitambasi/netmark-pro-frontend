import React, { useState } from 'react';
import { Table, Modal, Form, Row, Col, Tabs, Tab } from 'react-bootstrap';
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
  { name: 'ENTRIVERSE', price: 29888, accounts: 1, icon: <FaStar />, accent: '#4453D8' },
  { name: 'NEOVERSE', price: 42000, accounts: 3, icon: <FaRocket />, accent: '#17A589', recommended: true },
  { name: 'TECHNOVERSE', price: 123900, accounts: 7, icon: <FaGem />, accent: '#E08E1D' },
  { name: 'DIGIVERSE', price: 254200, accounts: 15, icon: <FaCrown />, accent: '#C2629A' },
  { name: 'MEGAVERSE', price: 505100, accounts: 31, icon: <FaCrown />, accent: '#12182B' }
];

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

const CATEGORY_STYLE = {
  hot: { color: '#E14B3D', label: 'Hot' },
  warm: { color: '#E08E1D', label: 'Warm' },
  cold: { color: '#4453D8', label: 'Cold' },
};

const PAYMENT_STYLE = {
  paid: { color: '#17A589', label: 'Paid' },
  partial: { color: '#E08E1D', label: 'Partial' },
  pending: { color: '#E14B3D', label: 'Pending' },
};

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

  const handleWhatsAppWithMessage = (followup) => {
    const name = followup.name || 'there';
    const source = getSourceDisplay(followup.source);
    const message = `Hello ${name}! This is from Mr Brian. I hope you remember me - we connected via ${source}. Let me know when you're available for a quick chat.`;
    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/${followup.phone}?text=${encoded}`, '_blank');
    toast.success(`Opening WhatsApp for ${name}`);
  };

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

  const handleWhatsAppClick = async (id) => {
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
    return (
      <div className="fdash-loading">
        <div className="fdash-spinner" />
        <p>Loading follow-ups…</p>
        <FollowupsStyles />
      </div>
    );
  }

  return (
    <div className="fdash">
      {/* Header */}
      <div className="fdash-header">
        <div>
          <span className="fdash-eyebrow">Pipeline</span>
          <h1 className="fdash-title">Follow-up management</h1>
        </div>
        <button className="fdash-btn fdash-btn-solid" onClick={() => setShowModal(true)}>
          <FaPlus /> Add follow-up
        </button>
      </div>

      {/* Stat strip */}
      <div className="fdash-stat-strip">
        <div className="fdash-stat-tile" style={{ '--tile-accent': '#17A589' }}>
          <div className="fdash-stat-top"><div className="fdash-stat-icon"><FaWallet /></div></div>
          <div className="fdash-stat-value">{stats.paid}</div>
          <div className="fdash-stat-label">Paid</div>
        </div>
        <div className="fdash-stat-tile" style={{ '--tile-accent': '#E08E1D' }}>
          <div className="fdash-stat-top"><div className="fdash-stat-icon"><FaPercent /></div></div>
          <div className="fdash-stat-value">{stats.partial}</div>
          <div className="fdash-stat-label">Partial</div>
        </div>
        <div className="fdash-stat-tile" style={{ '--tile-accent': '#E14B3D' }}>
          <div className="fdash-stat-top"><div className="fdash-stat-icon"><FaClock /></div></div>
          <div className="fdash-stat-value">{stats.pending}</div>
          <div className="fdash-stat-label">Pending</div>
        </div>
        <div className="fdash-stat-tile" style={{ '--tile-accent': '#4453D8' }}>
          <div className="fdash-stat-top"><div className="fdash-stat-icon"><FaChartLine /></div></div>
          <div className="fdash-stat-value fdash-stat-value-sm">KSh {stats.totalRevenue.toLocaleString()}</div>
          <div className="fdash-stat-label">Revenue</div>
        </div>
      </div>

      {/* Search */}
      <div className="fdash-search">
        <FaSearch className="fdash-search-icon" />
        <input
          className="fdash-search-input"
          placeholder="Search by name or phone…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="fdash-tabs">
        <Tab eventKey="followups" title="All follow-ups">
          <div className="fdash-panel fdash-table-panel">
            <div className="table-responsive">
              <Table hover className="fdash-table mb-0">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Phone</th>
                    <th>Category</th>
                    <th>Next call</th>
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
                    const isOverdue = new Date(f.nextCallDate) < new Date();
                    const cat = CATEGORY_STYLE[f.category] || { color: '#6B7280', label: f.category };
                    const pay = PAYMENT_STYLE[f.paymentStatus] || { color: '#6B7280', label: f.paymentStatus };
                    return (
                      <tr key={f._id} className={isOverdue ? 'fdash-row-overdue' : ''}>
                        <td>
                          <strong>{f.name}</strong>
                          {f.notes && <div className="fdash-table-note">{f.notes.substring(0, 30)}</div>}
                        </td>
                        <td className="fdash-mono">{f.phone}</td>
                        <td><span className="fdash-tag" style={{ color: cat.color, background: `${cat.color}1A` }}>{cat.label}</span></td>
                        <td>
                          <div className="fdash-table-date">
                            <FaCalendarAlt />
                            <span className="fdash-mono">{new Date(f.nextCallDate).toLocaleDateString()}</span>
                          </div>
                        </td>
                        <td><span className="fdash-tag" style={{ color: pay.color, background: `${pay.color}1A` }}>{pay.label}</span></td>
                        <td style={{ minWidth: 140 }}>
                          <div className="fdash-progress-meta">
                            <span className="fdash-mono">KSh {paidAmount.toLocaleString()}</span>
                            <span className="fdash-mono">/ {totalAmount.toLocaleString()}</span>
                          </div>
                          <div className="fdash-track-bar-bg">
                            <div className="fdash-track-bar-fill" style={{ width: `${progressPercent}%`, background: pay.color }} />
                          </div>
                        </td>
                        <td>
                          <div className="fdash-icon-actions">
                            <button className="fdash-icon-btn fdash-icon-btn-wa" title="WhatsApp" onClick={() => { handleWhatsAppClick(f._id); handleWhatsAppWithMessage(f); }}><FaWhatsapp /></button>
                            <button className="fdash-icon-btn fdash-icon-btn-teal" title="Mark followed" onClick={() => handleMarkFollowed(f._id)}><FaCheck /></button>
                            <button className="fdash-icon-btn fdash-icon-btn-amber" title="Reschedule" onClick={() => { setSelectedId(f._id); setSelectedFollowup(f); setShowRescheduleModal(true); }}><FaClock /></button>
                            <button className="fdash-icon-btn fdash-icon-btn-indigo" title="Payment" onClick={() => { setSelectedId(f._id); setSelectedFollowup(f); setShowPaymentModal(true); }}><FaMoneyBill /></button>
                            <button className="fdash-icon-btn fdash-icon-btn-coral" title="Delete" onClick={() => { setSelectedId(f._id); setShowDeleteModal(true); }}><FaTrash /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </div>
          </div>
        </Tab>
      </Tabs>

      {/* Add Follow-up Modal */}
      <Modal show={showModal} onHide={() => { setShowModal(false); setSelectedPackage(null); }} size="lg" centered dialogClassName="fdash-modal">
        <Modal.Header closeButton><Modal.Title className="fdash-modal-title"><FaPlus /> Add follow-up</Modal.Title></Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <div className="fdash-modal-section-label">Select investment package</div>
            <div className="fdash-package-grid">
              {PACKAGES.map((pkg, idx) => {
                const active = selectedPackage?.name === pkg.name;
                return (
                  <div
                    key={idx}
                    className={`fdash-package-card ${active ? 'is-active' : ''}`}
                    style={{ '--pkg-accent': pkg.accent }}
                    onClick={() => handleSelectPackage(pkg)}
                  >
                    {pkg.recommended && <span className="fdash-package-flag">Popular</span>}
                    <div className="fdash-package-icon">{pkg.icon}</div>
                    <div className="fdash-package-name">{pkg.name}</div>
                    <div className="fdash-package-price fdash-mono">KSh {pkg.price.toLocaleString()}</div>
                    <div className="fdash-package-accounts">{pkg.accounts} acc</div>
                    {active && <FaCheckCircle className="fdash-package-check" />}
                  </div>
                );
              })}
            </div>

            <div className="fdash-modal-divider" />
            <Row>
              <Col md={6}><Form.Group className="mb-3"><Form.Label className="fdash-form-label">Name *</Form.Label><Form.Control className="fdash-input" type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} /></Form.Group></Col>
              <Col md={6}><Form.Group className="mb-3"><Form.Label className="fdash-form-label">Phone *</Form.Label><Form.Control className="fdash-input" type="tel" required value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} placeholder="254712345678" /></Form.Group></Col>
              <Col md={6}><Form.Group className="mb-3"><Form.Label className="fdash-form-label">Email</Form.Label><Form.Control className="fdash-input" type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} /></Form.Group></Col>
              <Col md={6}><Form.Group className="mb-3"><Form.Label className="fdash-form-label">Category</Form.Label><Form.Select className="fdash-input" value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})}><option value="hot">Hot</option><option value="warm">Warm</option><option value="cold">Cold</option></Form.Select></Form.Group></Col>
              <Col md={6}><Form.Group className="mb-3"><Form.Label className="fdash-form-label">Next call date *</Form.Label><Form.Control className="fdash-input" type="date" required value={formData.nextCallDate} onChange={(e) => setFormData({...formData, nextCallDate: e.target.value})} /></Form.Group></Col>
              <Col md={12}><Form.Group className="mb-3"><Form.Label className="fdash-form-label">Total amount (KSh)</Form.Label><Form.Control className="fdash-input" type="number" value={formData.totalAmount} onChange={(e) => setFormData({...formData, totalAmount: e.target.value})} placeholder="Enter amount or select package above" disabled={!!selectedPackage} /></Form.Group></Col>
              <Col md={12}><Form.Group className="mb-3"><Form.Label className="fdash-form-label">Notes</Form.Label><Form.Control className="fdash-input" as="textarea" rows={2} value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} /></Form.Group></Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <button type="button" className="fdash-btn fdash-btn-outline" onClick={() => { setShowModal(false); setSelectedPackage(null); }}>Cancel</button>
            <button type="submit" className="fdash-btn fdash-btn-solid">Add prospect</button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Set Amount Modal */}
      <Modal show={showAmountModal} onHide={() => setShowAmountModal(false)} centered dialogClassName="fdash-modal">
        <Modal.Header closeButton><Modal.Title className="fdash-modal-title"><FaEdit /> Set package for {selectedFollowup?.name}</Modal.Title></Modal.Header>
        <Modal.Body>
          <div className="fdash-modal-section-label">Select a package</div>
          <Row className="mb-3 g-2">
            {PACKAGES.map((pkg, idx) => (
              <Col md={6} key={idx}>
                <button type="button" className="fdash-package-pick" style={{ '--pkg-accent': pkg.accent }} onClick={() => setAmountToSet(pkg.price.toString())}>
                  <strong>{pkg.name}</strong>
                  <span className="fdash-mono">KSh {pkg.price.toLocaleString()}</span>
                </button>
              </Col>
            ))}
          </Row>
          <Form.Group><Form.Label className="fdash-form-label">Custom amount</Form.Label><Form.Control className="fdash-input" type="number" value={amountToSet} onChange={(e) => setAmountToSet(e.target.value)} placeholder="Enter amount" autoFocus /></Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <button className="fdash-btn fdash-btn-outline" onClick={() => setShowAmountModal(false)}>Cancel</button>
          <button className="fdash-btn fdash-btn-solid" onClick={handleSetAmount}>Set amount</button>
        </Modal.Footer>
      </Modal>

      {/* Reschedule Modal */}
      <Modal show={showRescheduleModal} onHide={() => setShowRescheduleModal(false)} centered dialogClassName="fdash-modal">
        <Modal.Header closeButton><Modal.Title className="fdash-modal-title"><FaClock /> Reschedule follow-up</Modal.Title></Modal.Header>
        <Modal.Body>
          <p className="fdash-modal-note"><strong>{selectedFollowup?.name}</strong> — current: <span className="fdash-mono">{selectedFollowup && new Date(selectedFollowup.nextCallDate).toLocaleDateString()}</span></p>
          <div className="fdash-modal-section-label">Quick options</div>
          <div className="d-grid gap-2 mb-3">
            <button className="fdash-btn fdash-btn-outline" onClick={() => { setRescheduleData({ ...rescheduleData, daysToAdd: 'tomorrow', nextCallDate: '' }); setTimeout(handleReschedule, 100); }}>Tomorrow</button>
            <button className="fdash-btn fdash-btn-outline" onClick={() => { setRescheduleData({ ...rescheduleData, daysToAdd: 'in_3_days', nextCallDate: '' }); setTimeout(handleReschedule, 100); }}>In 3 days</button>
            <button className="fdash-btn fdash-btn-outline" onClick={() => { setRescheduleData({ ...rescheduleData, daysToAdd: 'in_1_week', nextCallDate: '' }); setTimeout(handleReschedule, 100); }}>In 1 week</button>
          </div>
          <div className="fdash-modal-divider" />
          <Form.Group className="mb-3"><Form.Label className="fdash-form-label">Custom date</Form.Label><Form.Control className="fdash-input" type="date" value={rescheduleData.nextCallDate} onChange={(e) => setRescheduleData({...rescheduleData, nextCallDate: e.target.value, daysToAdd: ''})} min={new Date().toISOString().split('T')[0]} /></Form.Group>
          <Form.Group><Form.Label className="fdash-form-label">Reason</Form.Label><Form.Control className="fdash-input" as="textarea" rows={2} value={rescheduleData.reason} onChange={(e) => setRescheduleData({...rescheduleData, reason: e.target.value})} /></Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <button className="fdash-btn fdash-btn-outline" onClick={() => setShowRescheduleModal(false)}>Cancel</button>
          <button className="fdash-btn fdash-btn-solid" onClick={handleReschedule} disabled={rescheduleLoading}>Confirm</button>
        </Modal.Footer>
      </Modal>

      {/* Payment Options Modal */}
      {selectedFollowup && <PaymentOptions show={showPaymentModal} onHide={() => setShowPaymentModal(false)} followup={selectedFollowup} onPaymentComplete={() => window.location.reload()} />}

      {/* Delete Modal */}
      <ConfirmationModal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} onConfirm={handleDelete} title="Delete" message="Delete this follow-up?" confirmText="Delete" variant="danger" />

      <FollowupsStyles />
    </div>
  );
}

function FollowupsStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@500;600&display=swap');

      .fdash {
        --ink: #12182B;
        --muted: #6B7280;
        --canvas: #F1F3F8;
        --surface: #FFFFFF;
        --line: #E2E5EE;
        --indigo: #4453D8;
        --teal: #17A589;
        --amber: #E08E1D;
        --coral: #E14B3D;
        font-family: 'Inter', sans-serif;
        color: var(--ink);
        background: var(--canvas);
        padding: 28px;
        border-radius: 16px;
      }
      .fdash-loading { text-align: center; padding: 80px 0; color: #6B7280; font-family: 'Inter', sans-serif; }
      .fdash-spinner { width: 32px; height: 32px; margin: 0 auto; border: 3px solid #E2E5EE; border-top-color: #4453D8; border-radius: 50%; animation: fdash-spin 0.8s linear infinite; }
      @keyframes fdash-spin { to { transform: rotate(360deg); } }

      .fdash-header { display: flex; justify-content: space-between; align-items: flex-end; flex-wrap: wrap; gap: 16px; margin-bottom: 24px; }
      .fdash-eyebrow { font-family: 'IBM Plex Mono', monospace; font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--indigo); }
      .fdash-title { font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 28px; margin: 4px 0 0; }
      .fdash-mono { font-family: 'IBM Plex Mono', monospace; }

      .fdash-btn { font-family: 'Inter', sans-serif; font-weight: 500; font-size: 13px; border-radius: 9px; padding: 9px 16px; display: inline-flex; align-items: center; gap: 6px; cursor: pointer; transition: all 0.15s ease; border: none; }
      .fdash-btn-outline { background: var(--surface); border: 1px solid var(--line); color: var(--ink); }
      .fdash-btn-outline:hover { border-color: var(--indigo); color: var(--indigo); }
      .fdash-btn-solid { background: var(--indigo); color: #fff; }
      .fdash-btn-solid:hover { opacity: 0.9; }

      .fdash-stat-strip { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }
      @media (max-width: 900px) { .fdash-stat-strip { grid-template-columns: repeat(2, 1fr); } }
      .fdash-stat-tile { background: var(--surface); border-radius: 14px; padding: 16px 18px; border-left: 4px solid var(--tile-accent); box-shadow: 0 1px 2px rgba(18,24,43,0.04); }
      .fdash-stat-top { display: flex; justify-content: flex-end; margin-bottom: 10px; }
      .fdash-stat-icon { color: var(--tile-accent); font-size: 16px; opacity: 0.7; }
      .fdash-stat-value { font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 26px; line-height: 1; }
      .fdash-stat-value-sm { font-size: 19px; }
      .fdash-stat-label { font-size: 11px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.04em; margin-top: 6px; }

      .fdash-search { display: flex; align-items: center; gap: 10px; background: var(--surface); border: 1px solid var(--line); border-radius: 10px; padding: 10px 14px; max-width: 360px; margin-bottom: 18px; }
      .fdash-search-icon { color: var(--muted); font-size: 13px; }
      .fdash-search-input { border: none; outline: none; font-family: 'Inter', sans-serif; font-size: 13px; flex: 1; background: transparent; color: var(--ink); }

      .fdash-tabs.nav-tabs { border-bottom: 1px solid var(--line); margin-bottom: 16px; }
      .fdash-tabs .nav-link { font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 500; color: var(--muted); border: none; padding: 10px 4px; margin-right: 22px; }
      .fdash-tabs .nav-link.active { color: var(--indigo); background: transparent; border-bottom: 2px solid var(--indigo); }

      .fdash-panel { background: var(--surface); border-radius: 14px; box-shadow: 0 1px 2px rgba(18,24,43,0.04); }
      .fdash-table-panel { overflow: hidden; padding: 0; }

      .fdash-table { font-family: 'Inter', sans-serif; font-size: 13px; }
      .fdash-table thead th { font-family: 'IBM Plex Mono', monospace; font-size: 10.5px; letter-spacing: 0.06em; text-transform: uppercase; color: var(--muted); border-bottom: 1px solid var(--line); padding: 14px 16px; background: var(--canvas); }
      .fdash-table tbody td { padding: 14px 16px; vertical-align: middle; border-bottom: 1px solid var(--line); }
      .fdash-table tbody tr:last-child td { border-bottom: none; }
      .fdash-row-overdue { background: rgba(225,75,61,0.04); }
      .fdash-table-note { font-size: 11.5px; color: var(--muted); margin-top: 2px; }
      .fdash-table-date { display: flex; align-items: center; gap: 7px; color: var(--ink); }
      .fdash-table-date svg { color: var(--muted); font-size: 12px; }

      .fdash-tag { font-family: 'IBM Plex Mono', monospace; font-size: 10.5px; font-weight: 600; padding: 3px 9px; border-radius: 20px; display: inline-block; }

      .fdash-progress-meta { display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 5px; color: var(--muted); }
      .fdash-track-bar-bg { background: var(--canvas); border-radius: 6px; height: 6px; overflow: hidden; }
      .fdash-track-bar-fill { height: 100%; border-radius: 6px; transition: width 0.3s ease; }

      .fdash-icon-actions { display: flex; gap: 6px; flex-wrap: wrap; }
      .fdash-icon-btn { width: 30px; height: 30px; border-radius: 8px; border: none; display: flex; align-items: center; justify-content: center; font-size: 13px; cursor: pointer; color: #fff; transition: opacity 0.15s ease; }
      .fdash-icon-btn:hover { opacity: 0.85; }
      .fdash-icon-btn-wa { background: #25D366; }
      .fdash-icon-btn-teal { background: var(--teal); }
      .fdash-icon-btn-amber { background: var(--amber); }
      .fdash-icon-btn-indigo { background: var(--indigo); }
      .fdash-icon-btn-coral { background: var(--coral); }

      /* Modals */
      .fdash-modal .modal-content { border-radius: 16px; border: none; font-family: 'Inter', sans-serif; }
      .fdash-modal .modal-header, .fdash-modal .modal-footer { border-color: var(--line, #E2E5EE); }
      .fdash-modal-title { font-family: 'Space Grotesk', sans-serif; font-weight: 600; font-size: 17px; display: flex; align-items: center; gap: 8px; }
      .fdash-modal-section-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; color: var(--muted, #6B7280); font-weight: 600; margin-bottom: 10px; }
      .fdash-modal-divider { border-top: 1px solid var(--line, #E2E5EE); margin: 18px 0; }
      .fdash-modal-note { font-size: 13px; color: var(--muted, #6B7280); }
      .fdash-form-label { font-size: 12.5px; font-weight: 500; color: var(--ink, #12182B); }
      .fdash-input { border-radius: 9px; border: 1px solid var(--line, #E2E5EE); font-size: 13px; padding: 9px 12px; }
      .fdash-input:focus { border-color: var(--indigo, #4453D8); box-shadow: 0 0 0 3px rgba(68,83,216,0.12); }

      .fdash-package-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; }
      @media (max-width: 700px) { .fdash-package-grid { grid-template-columns: repeat(2, 1fr); } }
      .fdash-package-card { position: relative; border: 1.5px solid var(--line, #E2E5EE); border-radius: 12px; padding: 14px 10px; text-align: center; cursor: pointer; transition: all 0.15s ease; }
      .fdash-package-card:hover { border-color: var(--pkg-accent); }
      .fdash-package-card.is-active { border-color: var(--pkg-accent); background: color-mix(in srgb, var(--pkg-accent) 8%, white); }
      .fdash-package-flag { position: absolute; top: -9px; right: 8px; background: var(--pkg-accent); color: #fff; font-size: 9px; font-family: 'IBM Plex Mono', monospace; padding: 2px 7px; border-radius: 20px; }
      .fdash-package-icon { color: var(--pkg-accent); font-size: 20px; margin-bottom: 6px; }
      .fdash-package-name { font-family: 'Space Grotesk', sans-serif; font-weight: 600; font-size: 11.5px; }
      .fdash-package-price { font-size: 12px; color: var(--pkg-accent); font-weight: 600; margin-top: 4px; }
      .fdash-package-accounts { font-size: 10.5px; color: var(--muted, #6B7280); margin-top: 2px; }
      .fdash-package-check { color: var(--pkg-accent); position: absolute; bottom: 8px; right: 8px; font-size: 12px; }

      .fdash-package-pick { width: 100%; text-align: left; background: var(--surface, #fff); border: 1.5px solid var(--line, #E2E5EE); border-radius: 10px; padding: 10px 14px; display: flex; flex-direction: column; gap: 3px; cursor: pointer; transition: border-color 0.15s ease; }
      .fdash-package-pick:hover { border-color: var(--pkg-accent); }
      .fdash-package-pick span { color: var(--pkg-accent); font-size: 12px; }
    `}</style>
  );
}

export default Followups;