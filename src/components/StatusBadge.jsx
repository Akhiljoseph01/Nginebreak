import React from 'react';
import { STATUS } from '../services/CalculationEngine';

export default function StatusBadge({ status }) {
  const config = {
    [STATUS.OVERDUE]:  { label: 'Overdue',  cls: 'danger',  dot: 'status-danger' },
    [STATUS.DUE_SOON]: { label: 'Due Soon', cls: 'warning', dot: 'status-warning' },
    [STATUS.UPCOMING]: { label: 'OK',       cls: 'success', dot: 'status-success' },
    [STATUS.COMPLETED]:{ label: 'Done',     cls: 'info',    dot: 'status-info' },
  };
  const c = config[status] || config[STATUS.UPCOMING];
  return (
    <span className={`badge bg-${c.cls} bg-opacity-20 text-${c.cls}`} style={{fontSize:'0.7rem',padding:'0.3em 0.6em',borderRadius:'20px'}}>
      <span className={`status-dot ${c.dot}`} style={{width:7,height:7}}></span>
      {c.label}
    </span>
  );
}
