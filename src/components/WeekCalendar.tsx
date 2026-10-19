import React from 'react';
import { useLifeDb } from '../context/LifeDbContext';
import { LIFE_AREAS_CONFIG } from '../data/seedData';
import { Lock, CheckCircle, AlertTriangle, EyeOff, Eye, Plus, Sparkles } from 'lucide-react';

export const WeekCalendar: React.FC = () => {
  const {
    selectedDate,
    setSelectedDate,
    events,
    setEditTargetEvent,
    today,
    hidePastDays,
    setHidePastDays,
    addEvent,
  } = useLifeDb();

  // Compute 7 days of current week (starting from Monday)
  const curr = new Date(selectedDate);
  const dayOfWeek = curr.getDay(); // 0 is Sun
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

  const monday = new Date(curr);
  monday.setDate(curr.getDate() + mondayOffset);

  const allWeekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    return {
      dateStr,
      dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
      dayNumber: d.getDate(),
      isToday: dateStr === today,
      isSelected: dateStr === selectedDate,
      isPast: dateStr < today,
    };
  });

  // Filter past days if toggle is active (removes Mon 12, Tue 13 when today is Wed 14)
  const visibleDays = hidePastDays
    ? allWeekDays.filter((col) => col.dateStr >= today)
    : allWeekDays;

  const pastCount = allWeekDays.filter((col) => col.isPast).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Week Header */}
      <div className="glass-panel" style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#FFF', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>WEEKLY EXECUTION GRID</span>
              {hidePastDays && pastCount > 0 && (
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 800,
                    background: 'rgba(99, 102, 241, 0.2)',
                    border: '1px solid #6366F1',
                    color: '#A5B4FC',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    letterSpacing: '0.5px',
                  }}
                >
                  ACTIVE DAYS ONLY ({visibleDays.length} DAYS)
                </span>
              )}
            </h2>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Fixed commitments (Work 9-5, Prayers) are locked. P0 non-negotiables govern momentum.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {/* Toggle past days button */}
            {pastCount > 0 && (
              <button
                onClick={() => setHidePastDays(!hidePastDays)}
                style={{
                  background: hidePastDays ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                  border: hidePastDays ? '1px solid #6366F1' : '1px solid var(--border-subtle)',
                  color: hidePastDays ? '#A5B4FC' : 'var(--text-secondary)',
                  borderRadius: '8px',
                  padding: '6px 14px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease',
                }}
              >
                {hidePastDays ? (
                  <>
                    <EyeOff size={13} color="#818CF8" /> Past Days Hidden ({pastCount} days)
                  </>
                ) : (
                  <>
                    <Eye size={13} /> Showing All 7 Days
                  </>
                )}
              </button>
            )}

            <span style={{ fontSize: '12px', color: '#FBBF24', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Lock size={13} /> Locked
            </span>
            <span style={{ fontSize: '12px', color: '#F87171' }}>
              ● P0
            </span>
          </div>
        </div>
      </div>

      {/* Columns Grid - Expands dynamically to fill width cleanly */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${visibleDays.length}, minmax(0, 1fr))`,
          gap: '12px',
          transition: 'all 0.2s ease',
        }}
      >
        {visibleDays.map((col) => {
          const dayEvents = events.filter((e) => e.date === col.dateStr);
          dayEvents.sort((a, b) => a.start_time.localeCompare(b.start_time));

          return (
            <div
              key={col.dateStr}
              className="glass-panel"
              style={{
                padding: '16px 12px',
                minHeight: '620px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                border: col.isToday
                  ? '2px solid #6366F1'
                  : col.isSelected
                  ? '1px solid var(--border-active)'
                  : '1px solid var(--border-subtle)',
                backgroundColor: col.isToday ? 'rgba(99, 102, 241, 0.06)' : undefined,
                boxShadow: col.isToday ? '0 0 20px rgba(99, 102, 241, 0.15)' : undefined,
                borderRadius: '12px',
              }}
            >
              {/* Column Header */}
              <div
                onClick={() => setSelectedDate(col.dateStr)}
                style={{
                  paddingBottom: '12px',
                  borderBottom: '1px solid var(--border-subtle)',
                  textAlign: 'center',
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '5px' }}>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 800,
                      color: col.isToday ? '#818CF8' : 'var(--text-muted)',
                      textTransform: 'uppercase',
                    }}
                  >
                    {col.dayName}
                  </span>
                  {col.isToday && (
                    <span
                      style={{
                        fontSize: '8px',
                        fontWeight: 900,
                        background: '#6366F1',
                        color: '#FFF',
                        padding: '1px 5px',
                        borderRadius: '4px',
                        letterSpacing: '0.4px',
                      }}
                    >
                      TODAY
                    </span>
                  )}
                </div>

                <div
                  style={{
                    fontSize: '22px',
                    fontWeight: 900,
                    color: col.isToday ? '#FFF' : 'var(--text-primary)',
                    marginTop: '2px',
                  }}
                >
                  {col.dayNumber}
                </div>
              </div>

              {/* Event Cards inside column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                {dayEvents.map((evt) => {
                  const area = LIFE_AREAS_CONFIG[evt.life_area];
                  const isDone = evt.status === 'completed';
                  const isSkipped = evt.status === 'skipped';

                  return (
                    <div
                      key={evt.id}
                      onClick={() => setEditTargetEvent(evt)}
                      style={{
                        backgroundColor: 'var(--bg-elevated)',
                        borderLeft: `3px solid ${area.color}`,
                        borderTop:
                          evt.priority === 'P0'
                            ? '1px solid rgba(245, 158, 11, 0.5)'
                            : '1px solid var(--border-subtle)',
                        borderRight: '1px solid var(--border-subtle)',
                        borderBottom: '1px solid var(--border-subtle)',
                        borderRadius: '8px',
                        padding: '10px',
                        cursor: 'pointer',
                        opacity: isDone || isSkipped ? 0.6 : 1,
                        transition: 'transform 0.15s, box-shadow 0.15s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.4)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'none';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '4px',
                        }}
                      >
                        <span style={{ fontSize: '9px', fontWeight: 900, color: area.color }}>
                          {area.letter} // {evt.priority}
                        </span>
                        {evt.is_fixed && <Lock size={10} color="#FBBF24" />}
                      </div>

                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#FFF', lineHeight: '16px' }}>
                        {evt.title}
                      </div>

                      <div
                        style={{
                          fontSize: '11px',
                          color: 'var(--text-muted)',
                          fontFamily: 'JetBrains Mono',
                          marginTop: '4px',
                        }}
                      >
                        {evt.start_time} - {evt.end_time}
                      </div>

                      {isDone && (
                        <div
                          style={{
                            color: 'var(--done-emerald)',
                            fontSize: '10px',
                            fontWeight: 800,
                            marginTop: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '3px',
                          }}
                        >
                          <CheckCircle size={10} /> Completed
                        </div>
                      )}
                      {isSkipped && (
                        <div
                          style={{
                            color: 'var(--skip-crimson)',
                            fontSize: '10px',
                            fontWeight: 800,
                            marginTop: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '3px',
                          }}
                        >
                          <AlertTriangle size={10} /> Skipped
                        </div>
                      )}
                    </div>
                  );
                })}

                {dayEvents.length === 0 && (
                  <div
                    style={{
                      color: 'var(--text-muted)',
                      fontSize: '11px',
                      textAlign: 'center',
                      marginTop: '30px',
                      fontStyle: 'italic',
                    }}
                  >
                    No sessions scheduled
                  </div>
                )}
              </div>

              {/* Add Quick Session Button at bottom of each column */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedDate(col.dateStr);
                  addEvent({
                    task_id: `custom-${Date.now()}`,
                    title: 'Deep Focus Block',
                    life_area: 'study',
                    priority: 'P1',
                    is_fixed: false,
                    date: col.dateStr,
                    start_time: '17:30',
                    end_time: '19:00',
                    status: 'planned',
                  });
                }}
                style={{
                  marginTop: 'auto',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px dashed var(--border-subtle)',
                  borderRadius: '6px',
                  padding: '7px',
                  color: 'var(--text-muted)',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '5px',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#6366F1';
                  e.currentTarget.style.color = '#FFF';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-subtle)';
                  e.currentTarget.style.color = 'var(--text-muted)';
                }}
              >
                <Plus size={12} /> Add Slot
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
