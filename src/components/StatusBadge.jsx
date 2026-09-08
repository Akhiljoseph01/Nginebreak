import React from 'react';
import { STATUS } from '../services/CalculationEngine';

export default function StatusBadge({ status }) {
  const config = {
    [STATUS.OVERDUE]:   { label: 'Overdue',  cls: 'danger' },
    [STATUS.DUE_SOON]:  { label: 'Due Soon', cls: 'warning' },
    [STATUS.UPCOMING]:  { label: 'OK',        cls: 'success' },
    [STATUS.COMPLETED]: { label: 'Done',      cls: 'info' },
  };
  const c = config[status] || config[STATUS.UPCOMING];
  return (
    <span className={`badge-pill badge-${c.cls}`}>
      <span className={`status-dot status-${c.cls}`} />
      {c.label}
    </span>
  );
}
