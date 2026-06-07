import React from 'react';
import { Card } from 'react-bootstrap';

function StatsCard({ title, value, icon, color = 'primary', bg = 'white' }) {
  const colorVariants = {
    primary: { bg: 'bg-primary', text: 'text-primary' },
    success: { bg: 'bg-success', text: 'text-success' },
    info: { bg: 'bg-info', text: 'text-info' },
    warning: { bg: 'bg-warning', text: 'text-warning' },
    danger: { bg: 'bg-danger', text: 'text-danger' },
  };

  return (
    <Card className={`shadow-sm border-0 h-100 ${bg === 'white' ? 'bg-white' : ''}`}>
      <Card.Body>
        <div className="d-flex justify-content-between align-items-start">
          <div>
            <h6 className="text-muted mb-2">{title}</h6>
            <h2 className="mb-0 fw-bold">{value}</h2>
          </div>
          <div className={`${colorVariants[color].text} fs-1`}>
            {icon}
          </div>
        </div>
      </Card.Body>
    </Card>
  );
}

export default StatsCard;
