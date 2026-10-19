import React from 'react';
import { useLifeDb } from '../context/LifeDbContext';
import { LIFE_AREAS_CONFIG } from '../data/seedData';
import { ScheduledEvent, LifeAreaKey } from '../types';
import {
  Lock,
  CheckCircle2,
  AlertTriangle,
  Clock,
  RotateCcw,
  Edit2,
  Plus,
} from 'lucide-react';

interface DayTimelineProps {
  selectedAreaFilter: LifeAreaKey | 'all';
}

const HOURS = [
  '05:00',
  '06:00',
  '07:00',
  '08:00',
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
  '18:00',
  '19:00',
  '20:00',
  '21:00',
  '22:00',
  '23:00',
];

export const DayTimeline: React.FC<DayTimelineProps> = ({ selectedAreaFilter }) => {
  const {
    selectedDate,
    events,
    completeEvent,
    resetEventStatus,
    setSkipTargetEvent,
    setEditTargetEvent,
    addEvent,
  } = useLifeDb();

  const now = new Date();
  const currentHourStr = `${String(now.getHours()).padStart(2, '0')}:${String(
    now.getMinutes()
  ).padStart(2, '0')}`;

  const dayEvents = events.filter((e) => {
    if (e.date !== selectedDate) return false;
    if (selectedAreaFilter !== 'all' && e.life_area !== selectedAreaFilter) return false;
    return true;
  });

  // Sort by start_time
  dayEvents.sort((a, b) => a.start_time.localeCompare(b.start_time));

  // Overdue, active, and upcoming events
  const overdueEvents = dayEvents.filter(
    (e) => (e.status === 'planned' || e.status === 'rescheduled') && e.end_time < currentHourStr
  );

  const activeEvent = dayEvents.find(
    (e) => e.start_time <= currentHourStr && currentHourStr <= e.end_time && e.status !== 'completed' && e.status !== 'skipped'
  );

  const upcomingEvent = dayEvents.find(
    (e) => (e.status === 'planned' || e.status === 'rescheduled') && e.start_time > currentHourStr
  );

  const handleQuickAdd = (hour: string) => {
    const [h] = hour.split(':').map(Number);
    const endH = String((h + 1) % 24).padStart(2, '0') + ':00';
    const newEvent: ScheduledEvent = {
      id: `evt-${Date.now()}`,
      task_id: `custom-${Date.now()}`,
      title: 'New SSSGDW-B Session',
      life_area: selectedAreaFilter !== 'all' ? selectedAreaFilter : 'study',
      priority: 'P1',
      is_fixed: false,
      date: selectedDate,
      start_time: hour,
      end_time: endH,
      status: 'planned',
    };
    addEvent(newEvent);
    setEditTargetEvent(newEvent);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Banner: Upcoming Focus & Status */}
      <div
        className="glass-panel"
        style={{
          padding: '18px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderLeft: activeEvent ? '4px solid #10B981' : upcomingEvent ? `4px solid ${LIFE_AREAS_CONFIG[upcomingEvent.life_area]?.color || '#6366F1'}` : '4px solid #6366F1',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              background: activeEvent ? 'rgba(16, 185, 129, 0.15)' : 'rgba(99, 102, 241, 0.15)',
              padding: '10px',
              borderRadius: '12px',
              color: activeEvent ? '#10B981' : '#818CF8',
            }}
          >
            <Clock size={24} />
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 800 }}>
              LIVE SCHEDULE MONITOR // {selectedDate}
            </div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#FFF', marginTop: '2px' }}>
              {activeEvent ? (
                <span style={{ color: '#34D399' }}>
                  ⚡ Active Now: {activeEvent.title} ({activeEvent.start_time} — {activeEvent.end_time})
                </span>
              ) : upcomingEvent ? (
                <span>
                  Next Focus: <span style={{ color: LIFE_AREAS_CONFIG[upcomingEvent.life_area].color }}>{upcomingEvent.title}</span> at {upcomingEvent.start_time}
                </span>
              ) : dayEvents.length === 0 ? (
                <span style={{ color: 'var(--text-muted)' }}>
                  No sessions scheduled for this day. Click "+ Add Time Slot" to plan.
                </span>
              ) : (
                '✓ All scheduled sessions for today executed. SSSGDW-B protocol protected.'
              )}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => handleQuickAdd('14:00')}
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-active)',
              color: '#FFF',
              borderRadius: '8px',
              padding: '8px 14px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Plus size={14} />
            Add Time Slot
          </button>
        </div>
      </div>

      {/* 24-Hour Timeline Grid */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        {HOURS.map((hour) => {
          const hourEvents = dayEvents.filter((e) => {
            const eventH = e.start_time.split(':')[0] + ':00';
            return eventH === hour;
          });

          return (
            <div key={hour} className="timeline-hour-slot">
              {/* Hour Label */}
              <div className="timeline-time-label">
                <span>{hour}</span>
              </div>

              {/* Slots Content */}
              <div className="timeline-slot-content">
                {hourEvents.length === 0 ? (
                  <div
                    style={{
                      height: '100%',
                      minHeight: '40px',
                      borderRadius: '8px',
                      border: '1px dashed rgba(255, 255, 255, 0.04)',
                      display: 'flex',
                      alignItems: 'center',
                      paddingLeft: '12px',
                      color: 'rgba(255, 255, 255, 0.15)',
                      fontSize: '11px',
                      cursor: 'pointer',
                    }}
                    onClick={() => handleQuickAdd(hour)}
                  >
                    + Free Slot (Click to plan SSSGDW-B block)
                  </div>
                ) : (
                  hourEvents.map((evt) => {
                    const area = LIFE_AREAS_CONFIG[evt.life_area];
                    const isCompleted = evt.status === 'completed';
                    const isSkipped = evt.status === 'skipped';
                    const isOverdue = (evt.status === 'planned' || evt.status === 'rescheduled') && evt.end_time < currentHourStr;
                    const isActiveNow = evt.start_time <= currentHourStr && currentHourStr <= evt.end_time && !isCompleted && !isSkipped;

                    return (
                      <div
                        key={evt.id}
                        className={`event-block ${evt.priority.toLowerCase()} ${
                          isCompleted ? 'completed' : ''
                        } ${isSkipped ? 'skipped' : ''}`}
                        style={{
                          backgroundColor: isOverdue ? 'rgba(39, 15, 18, 0.7)' : isActiveNow ? 'rgba(6, 40, 29, 0.7)' : 'rgba(18, 22, 36, 0.85)',
                          borderLeft: `4px solid ${isOverdue ? '#EF4444' : isActiveNow ? '#10B981' : area.color}`,
                          borderColor: isOverdue ? 'rgba(239, 68, 68, 0.4)' : isActiveNow ? 'rgba(16, 185, 129, 0.4)' : undefined,
                        }}
                      >
                        {/* Event Left Metadata */}
                        <div className="event-left">
                          <div
                            style={{
                              width: '10px',
                              height: '10px',
                              borderRadius: '9999px',
                              backgroundColor: area.color,
                              boxShadow: `0 0 8px ${area.color}`,
                            }}
                          />

                          <div className="event-meta">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                              <span
                                style={{
                                  fontSize: '10px',
                                  fontWeight: 800,
                                  color: area.color,
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.8px',
                                }}
                              >
                                {area.name} ({area.letter})
                              </span>

                              <span
                                style={{
                                  fontSize: '10px',
                                  fontWeight: 900,
                                  padding: '1px 6px',
                                  borderRadius: '4px',
                                  backgroundColor:
                                    evt.priority === 'P0'
                                      ? 'rgba(239, 68, 68, 0.2)'
                                      : 'rgba(99, 102, 241, 0.2)',
                                  color: evt.priority === 'P0' ? '#F87171' : '#818CF8',
                                  border: `1px solid ${
                                    evt.priority === 'P0'
                                      ? 'rgba(239, 68, 68, 0.4)'
                                      : 'rgba(99, 102, 241, 0.4)'
                                  }`,
                                }}
                              >
                                {evt.priority}
                              </span>

                              {isOverdue && (
                                <span
                                  style={{
                                    fontSize: '10px',
                                    fontWeight: 900,
                                    padding: '1px 6px',
                                    borderRadius: '4px',
                                    backgroundColor: 'rgba(239, 68, 68, 0.25)',
                                    color: '#F87171',
                                    border: '1px solid rgba(239, 68, 68, 0.5)',
                                  }}
                                >
                                  ⚠ OVERDUE
                                </span>
                              )}

                              {isActiveNow && (
                                <span
                                  style={{
                                    fontSize: '10px',
                                    fontWeight: 900,
                                    padding: '1px 6px',
                                    borderRadius: '4px',
                                    backgroundColor: 'rgba(16, 185, 129, 0.25)',
                                    color: '#34D399',
                                    border: '1px solid rgba(16, 185, 129, 0.5)',
                                  }}
                                >
                                  ⚡ ACTIVE NOW
                                </span>
                              )}

                              {evt.is_fixed && (
                                <span
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '3px',
                                    fontSize: '10px',
                                    fontWeight: 700,
                                    color: '#FBBF24',
                                  }}
                                  title="Fixed Commitment: Cannot be rescheduled without warning"
                                >
                                  <Lock size={10} /> Locked
                                </span>
                              )}
                            </div>

                            <div className="event-title">{evt.title}</div>

                            <div className="event-time-span">
                              {evt.start_time} — {evt.end_time}
                            </div>

                            {isSkipped && evt.skip_reason && (
                              <div
                                style={{
                                  color: '#FCA5A5',
                                  fontSize: '12px',
                                  fontStyle: 'italic',
                                  marginTop: '4px',
                                }}
                              >
                                Justification: "{evt.skip_reason}"
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Event Actions */}
                        <div className="event-actions">
                          {evt.status === 'planned' && (
                            <>
                              <button
                                className="btn-done"
                                onClick={() => completeEvent(evt.id)}
                              >
                                <CheckCircle2 size={14} />
                                DONE
                              </button>

                              <button
                                className="btn-skip"
                                onClick={() => setSkipTargetEvent(evt)}
                              >
                                <AlertTriangle size={13} />
                                SKIP
                              </button>
                            </>
                          )}

                          {isCompleted && (
                            <span
                              style={{
                                color: 'var(--done-emerald)',
                                fontSize: '12px',
                                fontWeight: 800,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                              }}
                            >
                              <CheckCircle2 size={16} /> Completed
                            </span>
                          )}

                          {isSkipped && (
                            <span
                              style={{
                                color: 'var(--skip-crimson)',
                                fontSize: '12px',
                                fontWeight: 800,
                              }}
                            >
                              Skipped
                            </span>
                          )}

                          {/* Reset / Edit */}
                          {(isCompleted || isSkipped) && (
                            <button
                              onClick={() => resetEventStatus(evt.id)}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--text-muted)',
                                cursor: 'pointer',
                                padding: '4px',
                              }}
                              title="Reset status"
                            >
                              <RotateCcw size={14} />
                            </button>
                          )}

                          <button
                            onClick={() => setEditTargetEvent(evt)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: 'var(--text-muted)',
                              cursor: 'pointer',
                              padding: '4px',
                            }}
                            title="Reschedule / Edit slot"
                          >
                            <Edit2 size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
