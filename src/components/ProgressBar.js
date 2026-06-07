import React from 'react';
import { ProgressBar as BootstrapProgressBar } from 'react-bootstrap';

function ProgressBar({ now, label, variant = 'success', animated = false }) {
  return (
    <div>
      {label && (
        <div className="d-flex justify-content-between mb-1">
          <span>{label}</span>
          <span className="fw-bold">{Math.round(now)}%</span>
        </div>
      )}
      <BootstrapProgressBar
        now={now}
        variant={variant}
        animated={animated}
        className="rounded-pill"
        style={{ height: '10px' }}
      />
    </div>
  );
}

export default ProgressBar;
