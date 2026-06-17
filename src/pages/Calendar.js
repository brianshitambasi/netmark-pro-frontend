import React, { useState, useEffect, useCallback } from 'react';
import { Card, Spinner, Badge } from 'react-bootstrap';
import { dashboardService } from '../services/api';
import toast from 'react-hot-toast';

function Calendar() {
  const [calendarData, setCalendarData] = useState({});
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  const loadCalendar = useCallback(async () => {
    try {
      const response = await dashboardService.getCalendar(currentMonth, currentYear);
      setCalendarData(response.data.data);
    } catch (error) {
      toast.error('Failed to load calendar');
    } finally {
      setLoading(false);
    }
  }, [currentMonth, currentYear]);

  useEffect(() => {
    loadCalendar();
  }, [loadCalendar]);

  const getDaysInMonth = (year, month) => {
    return new Date(year, month, 0).getDate();
  };

  const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month - 1, 1).getDay();
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
    const days = [];

    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="col p-2 border bg-light"></div>);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const events = calendarData[dateKey] || [];
      
      days.push(
        <div key={day} className="col p-2 border" style={{ minHeight: '100px' }}>
          <div className="fw-bold mb-2">{day}</div>
          {events.followups?.map((event, idx) => (
            <div key={idx} className="small mb-1">
              <Badge bg="info" className="me-1"></Badge>
              {event.name}
            </div>
          ))}
          {events.events?.map((event, idx) => (
            <div key={idx} className="small mb-1">
              <Badge bg="success" className="me-1"> </Badge>
              
              {event.title}
            </div>
          ))}
        </div>
      );
    }

    return days;
  };

  const changeMonth = (delta) => {
    let newMonth = currentMonth + delta;
    let newYear = currentYear;
    
    if (newMonth > 12) {
      newMonth = 1;
      newYear++;
    } else if (newMonth < 1) {
      newMonth = 12;
      newYear--;
    }
    
    setCurrentMonth(newMonth);
    setCurrentYear(newYear);
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="fade-in">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Calendar View</h2>
        <div>
          <button className="btn btn-outline-primary me-2" onClick={() => changeMonth(-1)}>
            &lt; Previous
          </button>
          <button className="btn btn-outline-primary" onClick={() => changeMonth(1)}>
            Next &gt;
          </button>
        </div>
      </div>

      <Card className="shadow-sm border-0">
        <Card.Header className="bg-white text-center">
          <h4 className="mb-0">{monthNames[currentMonth - 1]} {currentYear}</h4>
        </Card.Header>
        <Card.Body>
          <div className="row g-0">
            {weekDays.map(day => (
              <div key={day} className="col p-2 text-center fw-bold border bg-light">
                {day}
              </div>
            ))}
            {renderCalendar()}
          </div>
        </Card.Body>
      </Card>
    </div>
  );
}

export default Calendar;
