import React, { useState } from 'react';
import { Modal, Form, Button, Alert, ProgressBar, Badge } from 'react-bootstrap';
import { FaMoneyBill, FaCheckCircle, FaTrophy, FaStar, FaRocket } from 'react-icons/fa';
import toast from 'react-hot-toast';

const API_URL = process.env.REACT_APP_API_URL;

function PaymentOptions({ show, onHide, followup, onPaymentComplete }) {
  const [loading, setLoading] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('mpesa');
  const [transactionId, setTransactionId] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const totalAmount = followup?.totalAmount || 0;
  const paidAmount = followup?.amountPaid || 0;
  const remainingBalance = totalAmount - paidAmount;
  const isFullyPaid = remainingBalance <= 0;

  const handleFullPayment = async () => {
    const amountToPay = remainingBalance;
    if (amountToPay <= 0) {
      toast.error('No remaining balance to pay');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/followups/${followup._id}/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          amount: amountToPay,
          paymentMethod: paymentMethod,
          transactionId: transactionId,
          notes: `FULL PAYMENT - Package ${followup.packageName || 'Custom'} completed`
        })
      });
      const data = await response.json();
      if (data.success) {
        setShowSuccess(true);
        toast.success(`í¾‰ FULL PAYMENT RECEIVED! ${followup.name} has completed their package!`);
        setTimeout(() => { setShowSuccess(false); onPaymentComplete(); onHide(); }, 3000);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error('Failed to record payment');
    } finally {
      setLoading(false);
    }
  };

  const handleRegularPayment = async () => {
    if (!paymentAmount) {
      toast.error('Please enter amount');
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/followups/${followup._id}/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          amount: paymentAmount,
          paymentMethod: paymentMethod,
          transactionId: transactionId,
          notes: `Payment for ${followup.name}`
        })
      });
      const data = await response.json();
      if (data.success) {
        const newPaidAmount = paidAmount + parseFloat(paymentAmount);
        if (newPaidAmount >= totalAmount) {
          setShowSuccess(true);
          toast.success(`í¾‰ CONGRATULATIONS! ${followup.name} has completed full payment!`);
          setTimeout(() => { setShowSuccess(false); onPaymentComplete(); onHide(); }, 3000);
        } else {
          toast.success(data.message);
          onPaymentComplete();
          onHide();
        }
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error('Failed to record payment');
    } finally {
      setLoading(false);
    }
  };

  if (showSuccess) {
    return (
      <Modal show={showSuccess} onHide={() => setShowSuccess(false)} centered size="lg">
        <Modal.Body className="text-center py-5">
          <div className="mb-4"><FaTrophy size={80} className="text-warning mb-3" /><FaStar size={40} className="text-warning position-absolute" style={{ marginLeft: -60, marginTop: -20 }} /><FaStar size={30} className="text-warning position-absolute" style={{ marginLeft: 40, marginTop: -30 }} /></div>
          <h2 className="text-success mb-3">ï¿½ï¿½ PAYMENT COMPLETED! í¾‰</h2>
          <div className="mb-3"><Badge bg="success" className="p-3 fs-5"><FaCheckCircle className="me-2" /> FULLY PAID</Badge></div>
          <h4>{followup?.name}</h4>
          <p className="lead">Package: <strong>{followup?.packageName || 'Custom'}</strong></p>
          <p className="lead">Total Amount: <strong className="text-success">KSh {totalAmount.toLocaleString()}</strong></p>
          <div className="mt-4"><FaRocket size={50} className="text-primary" /><p className="mt-2">Account activation in progress...</p></div>
          <Button variant="success" className="mt-4" onClick={() => setShowSuccess(false)}>Continue</Button>
        </Modal.Body>
      </Modal>
    );
  }

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton><Modal.Title><FaMoneyBill className="me-2" />Payment Options - {followup?.name}</Modal.Title></Modal.Header>
      <Modal.Body>
        <Alert variant={isFullyPaid ? 'success' : 'info'} className="mb-3">
          <div className="d-flex justify-content-between align-items-center">
            <div><strong>Package: {followup?.packageName || 'Custom'}</strong><br /><small>Total: KSh {totalAmount.toLocaleString()}</small></div>
            <div className="text-end"><strong>Paid: KSh {paidAmount.toLocaleString()}</strong><br /><strong className="text-danger">Balance: KSh {remainingBalance.toLocaleString()}</strong></div>
          </div>
          <ProgressBar now={(paidAmount / totalAmount) * 100} className="mt-2" variant={isFullyPaid ? 'success' : 'warning'} />
          <div className="text-center mt-1"><small>{((paidAmount / totalAmount) * 100).toFixed(0)}% Complete</small></div>
        </Alert>

        {!isFullyPaid && remainingBalance > 0 && (
          <div className="mb-4"><div className="d-grid"><Button variant="success" size="lg" onClick={handleFullPayment} disabled={loading} className="p-3"><FaTrophy className="me-2" />í²° COMPLETE FULL PAYMENT - KSh {remainingBalance.toLocaleString()} í²°</Button></div><div className="text-center mt-2"><small className="text-muted">Click to complete the full payment and activate account</small></div></div>
        )}

        {isFullyPaid && <Alert variant="success" className="text-center"><FaCheckCircle className="me-2" /><strong>âœ… FULLY PAID!</strong> This prospect has completed their package payment.</Alert>}

        <hr />

        {!isFullyPaid && (
          <>
            <h6>Record Partial Payment</h6>
            <Form.Group className="mb-2"><Form.Label>Amount to Pay (KSh)</Form.Label><Form.Control type="number" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} placeholder={`Max: ${remainingBalance}`} max={remainingBalance} /></Form.Group>
            <Form.Group className="mb-2"><Form.Label>Payment Method</Form.Label><Form.Select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}><option value="mpesa">M-Pesa</option><option value="cash">Cash</option><option value="bank">Bank Transfer</option><option value="card">Card</option></Form.Select></Form.Group>
            <Form.Group className="mb-2"><Form.Label>Transaction ID (M-Pesa Code)</Form.Label><Form.Control type="text" value={transactionId} onChange={(e) => setTransactionId(e.target.value)} placeholder="Enter transaction ID" /></Form.Group>
            <Button variant="primary" onClick={handleRegularPayment} disabled={loading} className="w-100">{loading ? 'Processing...' : 'Record Payment'}</Button>
          </>
        )}
      </Modal.Body>
      <Modal.Footer><Button variant="secondary" onClick={onHide}>Close</Button></Modal.Footer>
    </Modal>
  );
}

export default PaymentOptions;
