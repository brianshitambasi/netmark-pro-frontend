// This is the fixed reschedule handler - add this to your existing Followups.js

const handleReschedule = async () => {
  if (!selectedId) return;
  
  setLoading(true);
  try {
    let response;
    let url;
    let body;
    
    if (rescheduleData.daysToAdd) {
      // Quick reschedule using preset option
      url = `${process.env.REACT_APP_API_URL}/followups/${selectedId}/quick-reschedule`;
      body = JSON.stringify({ option: rescheduleData.daysToAdd });
      console.log('Quick reschedule with option:', rescheduleData.daysToAdd);
    } else if (rescheduleData.nextCallDate) {
      // Custom date reschedule
      url = `${process.env.REACT_APP_API_URL}/followups/${selectedId}/reschedule`;
      body = JSON.stringify({
        nextCallDate: rescheduleData.nextCallDate,
        reason: rescheduleData.reason || 'Rescheduled by user'
      });
      console.log('Custom reschedule to date:', rescheduleData.nextCallDate);
    } else {
      toast.error('Please select a date or quick option');
      setLoading(false);
      return;
    }
    
    const token = localStorage.getItem('token');
    const method = rescheduleData.daysToAdd ? 'POST' : 'PUT';
    
    response = await fetch(url, {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: body
    });
    
    const data = await response.json();
    console.log('Reschedule response:', data);
    
    if (data.success) {
      toast.success(data.message);
      setShowRescheduleModal(false);
      setRescheduleData({ nextCallDate: '', reason: '', daysToAdd: '' });
      // Reload the page to show updated date
      window.location.reload();
    } else {
      toast.error(data.message || 'Failed to reschedule');
    }
  } catch (error) {
    console.error('Reschedule error:', error);
    toast.error('Failed to reschedule follow-up');
  } finally {
    setLoading(false);
  }
};
