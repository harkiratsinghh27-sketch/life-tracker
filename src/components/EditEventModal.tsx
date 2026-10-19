import React, { useState } from 'react';
import { useLifeDb } from '../context/LifeDbContext';
import { LIFE_AREAS_CONFIG } from '../data/seedData';
import { LifeAreaKey, Priority } from '../types';
import { Clock, Lock, X, Trash2, Check } from 'lucide-react';

export const EditEventModal: React.FC = () => {
  const { editTargetEvent, setEditTargetEvent, updateEvent, deleteEvent } = useLifeDb();

  if (!editTargetEvent) return null;

  const [title, setTitle] = useState(editTargetEvent.title);
  const [date, setDate] = useState(editTargetEvent.date);
  const [startTime, setStartTime] = useState(editTargetEvent.start_time);
  const [endTime, setEndTime] = useState(editTargetEvent.end_time);
  const [area, setArea] = useState<LifeAreaKey>(editTargetEvent.life_area);
  const [priority, setPriority] = useState<Priority>(editTargetEvent.priority);
  const [isFixed, setIsFixed] = useState(editTargetEvent.is_fixed);

  const handleSave = () => {
    updateEvent(editTargetEvent.id, {
      title: title.trim(),
      date,
      start_time: startTime,
      end_time: endTime,
      life_area: area,
      priority,
      is_fixed: isFixed,
    });
    setEditTargetEvent(null);
  };

  const handleDelete = () => {
    deleteEvent(editTargetEvent.id);
    setEditTargetEvent(null);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={18} color="#6366F1" />
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#FFF' }}>
              RESCHEDULE / ALTER SESSION
            </h3>
          </div>
          <button
            onClick={() => setEditTargetEvent(null)}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>

        {editTargetEvent.is_fixed && (
          <div
            style={{
              padding: '10px 14px',
              backgroundColor: 'rgba(245, 158, 11, 0.1)',
              borderLeft: '3px solid #F59E0B',
              borderRadius: '6px',
              fontSize: '12px',
              color: '#FDE68A',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Lock size={14} color="#F59E0B" />
            <span>WARNING: This slot is marked as LOCKED (Fixed Commitment). Altering will log a schedule mutation.</span>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>TITLE</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{ width: '100%', padding: '10px', background: 'var(--bg-elevated)', border: '1px solid var(--border-active)', borderRadius: '8px', color: '#FFF' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>DATE</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                style={{ width: '100%', padding: '8px', background: 'var(--bg-elevated)', border: '1px solid var(--border-active)', borderRadius: '8px', color: '#FFF' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>TIME RANGE</label>
              <div style={{ display: 'flex', gap: '6px' }}>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  style={{ width: '50%', padding: '8px', background: 'var(--bg-elevated)', border: '1px solid var(--border-active)', borderRadius: '8px', color: '#FFF' }}
                />
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  style={{ width: '50%', padding: '8px', background: 'var(--bg-elevated)', border: '1px solid var(--border-active)', borderRadius: '8px', color: '#FFF' }}
                />
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>SSSGDW-B AREA</label>
              <select
                value={area}
                onChange={(e) => setArea(e.target.value as LifeAreaKey)}
                style={{ width: '100%', padding: '9px', background: 'var(--bg-elevated)', border: '1px solid var(--border-active)', borderRadius: '8px', color: '#FFF' }}
              >
                {(Object.keys(LIFE_AREAS_CONFIG) as LifeAreaKey[]).map((k) => (
                  <option key={k} value={k}>{LIFE_AREAS_CONFIG[k].name} ({LIFE_AREAS_CONFIG[k].letter})</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>PRIORITY</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                style={{ width: '100%', padding: '9px', background: 'var(--bg-elevated)', border: '1px solid var(--border-active)', borderRadius: '8px', color: priority === 'P0' ? '#F87171' : '#FFF' }}
              >
                <option value="P0">P0 (Rock / Non-Negotiable)</option>
                <option value="P1">P1 (Core / Important)</option>
                <option value="P2">P2 (Flexible)</option>
                <option value="P3">P3 (Optional)</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#FFF', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={isFixed}
                onChange={(e) => setIsFixed(e.target.checked)}
              />
              <span>Lock Slot as Fixed Commitment (e.g. Work 9-5 or Prayer)</span>
            </label>
          </div>
        </div>

        <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            onClick={handleDelete}
            style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#EF4444',
              padding: '10px 14px',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              fontWeight: 700,
            }}
          >
            <Trash2 size={14} /> Delete Slot
          </button>

          <button
            onClick={handleSave}
            style={{
              background: '#6366F1',
              border: 'none',
              color: '#FFF',
              padding: '10px 20px',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              fontWeight: 800,
            }}
          >
            <Check size={16} /> Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};
