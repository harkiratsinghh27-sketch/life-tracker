import React, { useState } from 'react';
import { useLifeDb } from '../context/LifeDbContext';
import { AlertTriangle, X, Check } from 'lucide-react';

export const SkipModal: React.FC = () => {
  const { skipTargetEvent, setSkipTargetEvent, skipEvent } = useLifeDb();
  const [reason, setReason] = useState('');

  if (!skipTargetEvent) return null;

  const trimmed = reason.trim();
  const charCount = trimmed.length;
  const MIN_CHARS = 20;
  const isValid = charCount >= MIN_CHARS;

  const handleSubmit = () => {
    if (!isValid) return;
    skipEvent(skipTargetEvent.id, trimmed);
    setReason('');
    setSkipTargetEvent(null);
  };

  const handleCancel = () => {
    setReason('');
    setSkipTargetEvent(null);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        {/* Warning Tag */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              color: '#F87171',
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <AlertTriangle size={14} /> HIGH FRICTION CHECKPOINT
          </div>
          <button
            onClick={handleCancel}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Title */}
        <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#FFF', lineHeight: '24px' }}>
          Why are you skipping "{skipTargetEvent.title}"?
        </h3>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '8px', lineHeight: '18px' }}>
          Skipping is a deliberate choice. You cannot swipe this away. You must type an honest, complete sentence explaining why you are breaking this commitment.
        </p>

        {/* Textarea */}
        <div style={{ marginTop: '16px' }}>
          <textarea
            placeholder="I am skipping because..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
            style={{
              width: '100%',
              backgroundColor: 'var(--bg-elevated)',
              border: '1px solid var(--border-active)',
              borderRadius: '10px',
              padding: '12px',
              color: '#FFF',
              fontSize: '14px',
              outline: 'none',
              resize: 'none',
              fontFamily: 'Inter',
            }}
          />

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '11px', fontWeight: 700 }}>
            <span style={{ color: isValid ? '#10B981' : '#F87171' }}>
              {charCount} / {MIN_CHARS} characters minimum
            </span>
            {!isValid && (
              <span style={{ color: 'var(--text-muted)' }}>
                {MIN_CHARS - charCount} more needed
              </span>
            )}
          </div>
        </div>

        {/* Warning Penalty Note */}
        <div
          style={{
            marginTop: '16px',
            padding: '10px 14px',
            backgroundColor: 'rgba(239, 68, 68, 0.08)',
            borderLeft: '3px solid #EF4444',
            borderRadius: '6px',
            fontSize: '12px',
            color: '#FCA5A5',
          }}
        >
          Note: Skipping breaks your streak and logs this justification permanently to your daily record.
        </div>

        {/* Action Buttons */}
        <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button
            onClick={handleSubmit}
            disabled={!isValid}
            style={{
              background: isValid ? '#EF4444' : 'var(--bg-elevated)',
              border: isValid ? 'none' : '1px solid var(--border-subtle)',
              color: isValid ? '#FFF' : 'var(--text-muted)',
              fontWeight: 800,
              fontSize: '13px',
              padding: '14px',
              borderRadius: '10px',
              cursor: isValid ? 'pointer' : 'not-allowed',
            }}
          >
            {isValid ? 'CONFIRM SKIP (BREAK COMMITMENT)' : `WRITE AT LEAST ${MIN_CHARS} CHARACTERS`}
          </button>

          <button
            onClick={handleCancel}
            style={{
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: '#34D399',
              fontWeight: 700,
              fontSize: '13px',
              padding: '12px',
              borderRadius: '10px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <Check size={16} /> I changed my mind — I will do the task
          </button>
        </div>
      </div>
    </div>
  );
};
