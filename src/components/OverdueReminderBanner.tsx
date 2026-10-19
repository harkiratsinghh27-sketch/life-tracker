import React from 'react';
import { useLifeDb } from '../context/LifeDbContext';
import { LIFE_AREAS_CONFIG } from '../data/seedData';
import { AlertTriangle, CheckCircle, Clock, FastForward, ChevronRight } from 'lucide-react';

export const OverdueReminderBanner: React.FC = () => {
  const {
    selectedDate,
    events,
    completeEvent,
    setSkipTargetEvent,
    rescheduleEvent,
    coachingMode,
  } = useLifeDb();

  const now = new Date();
  const currentHourStr = `${String(now.getHours()).padStart(2, '0')}:${String(
    now.getMinutes()
  ).padStart(2, '0')}`;

  const overdueEvents = events.filter((e) => {
    if (e.date !== selectedDate) return false;
    return (e.status === 'planned' || e.status === 'rescheduled') && e.end_time < currentHourStr;
  });

  if (overdueEvents.length === 0) return null;

  const handlePushToNow = (e: any) => {
    const startH = now.getHours();
    const startM = now.getMinutes();
    const [origStartH, origStartM] = e.start_time.split(':').map(Number);
    const [origEndH, origEndM] = e.end_time.split(':').map(Number);
    const origDurationMin = (origEndH * 60 + origEndM) - (origStartH * 60 + origStartM) || 60;

    const newStartStr = `${String(startH).padStart(2, '0')}:${String(startM).padStart(2, '0')}`;
    const endTotalMin = startH * 60 + startM + origDurationMin;
    const endH = Math.floor(endTotalMin / 60) % 24;
    const endM = endTotalMin % 60;
    const newEndStr = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;

    rescheduleEvent(e.id, selectedDate, newStartStr, newEndStr);
  };

  return (
    <div
      style={{
        backgroundColor: 'rgba(239, 68, 68, 0.12)',
        border: '1.5px solid rgba(239, 68, 68, 0.4)',
        borderLeft: '5px solid #EF4444',
        borderRadius: '12px',
        padding: '14px 20px',
        marginBottom: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        boxShadow: '0 4px 20px rgba(239, 68, 68, 0.15)',
        animation: 'pulse 2s infinite',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              backgroundColor: '#EF4444',
              color: '#FFF',
              padding: '6px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <AlertTriangle size={18} />
          </div>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 900, color: '#F87171', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
              🚨 {coachingMode === 'drill-sergeant' ? 'DRILL SERGEANT DISCIPLINE ALERT' : 'HONEST DATA MIRROR'}
            </div>
            <div style={{ fontSize: '14px', fontWeight: 800, color: '#FFF' }}>
              {overdueEvents.length} session{overdueEvents.length > 1 ? 's' : ''} past due and NOT done. Inaction is expensive.
            </div>
          </div>
        </div>

        <span
          style={{
            fontSize: '11px',
            fontFamily: 'JetBrains Mono',
            color: '#FCA5A5',
            backgroundColor: 'rgba(239, 68, 68, 0.2)',
            padding: '4px 10px',
            borderRadius: '6px',
            fontWeight: 800,
          }}
        >
          {overdueEvents.length} UNEXECUTED
        </span>
      </div>

      {/* List of Overdue Tasks with Direct Actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {overdueEvents.map((evt) => {
          const area = LIFE_AREAS_CONFIG[evt.life_area] || LIFE_AREAS_CONFIG.balance;
          return (
            <div
              key={evt.id}
              style={{
                backgroundColor: 'rgba(15, 19, 29, 0.85)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '8px',
                padding: '10px 14px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '10px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span
                  style={{
                    backgroundColor: area.bgLight,
                    color: area.color,
                    border: `1px solid ${area.color}`,
                    fontSize: '10px',
                    fontWeight: 900,
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontFamily: 'JetBrains Mono',
                  }}
                >
                  {area.letter}
                </span>

                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 900,
                    backgroundColor: evt.priority === 'P0' ? 'rgba(239, 68, 68, 0.25)' : 'rgba(99, 102, 241, 0.2)',
                    color: evt.priority === 'P0' ? '#F87171' : '#818CF8',
                    padding: '2px 6px',
                    borderRadius: '4px',
                  }}
                >
                  {evt.priority}
                </span>

                <span style={{ fontSize: '13px', fontWeight: 700, color: '#FFF' }}>
                  {evt.title}
                </span>

                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono' }}>
                  ({evt.start_time} - {evt.end_time})
                </span>
              </div>

              {/* Direct 1-Click Resolvers */}
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  onClick={() => completeEvent(evt.id)}
                  style={{
                    backgroundColor: 'rgba(16, 185, 129, 0.2)',
                    border: '1px solid rgba(16, 185, 129, 0.5)',
                    color: '#34D399',
                    fontSize: '11px',
                    fontWeight: 800,
                    padding: '6px 10px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <CheckCircle size={13} />
                  Done
                </button>

                <button
                  onClick={() => handlePushToNow(evt)}
                  style={{
                    backgroundColor: 'rgba(99, 102, 241, 0.2)',
                    border: '1px solid rgba(99, 102, 241, 0.5)',
                    color: '#818CF8',
                    fontSize: '11px',
                    fontWeight: 800,
                    padding: '6px 10px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                  title="Shift this slot to start right now"
                >
                  <FastForward size={13} />
                  Push to Now
                </button>

                <button
                  onClick={() => setSkipTargetEvent(evt)}
                  style={{
                    backgroundColor: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.35)',
                    color: '#F87171',
                    fontSize: '11px',
                    fontWeight: 800,
                    padding: '6px 10px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                  }}
                >
                  Skip
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
