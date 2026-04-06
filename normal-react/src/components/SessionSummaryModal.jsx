import React from 'react';

const SessionSummaryModal = ({ open, onClose, summary }) => {
  if (!open) return null;
  return (
    <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="modal" style={{ background: '#fff', borderRadius: 12, padding: 32, minWidth: 320, maxWidth: 400, boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }}>
        <h2 style={{ marginBottom: 16 }}>Session Summary</h2>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          <li><b>Duration:</b> {summary.duration} seconds</li>
          <li><b>Average Stress:</b> {summary.avg}%</li>
          <li><b>Max Stress:</b> {summary.max}%</li>
          <li><b>Min Stress:</b> {summary.min}%</li>
        </ul>
        <div style={{ margin: '18px 0', color: '#9333ea', fontWeight: 500 }}>{summary.tip}</div>
        <button className="btn btn-primary" onClick={onClose} style={{ marginTop: 12 }}>Close</button>
      </div>
    </div>
  );
};

export default SessionSummaryModal;
