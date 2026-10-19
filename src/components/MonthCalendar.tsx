import React from 'react';
import { useLifeDb } from '../context/LifeDbContext';
import { LIFE_AREAS_CONFIG } from '../data/seedData';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const MonthCalendar: React.FC = () => {
  const { selectedDate, setSelectedDate, events } = useLifeDb();

  const currentYear = parseInt(selectedDate.split('-')[0], 10);
  const currentMonth = parseInt(selectedDate.split('-')[1], 10) - 1; // 0-indexed

  // Days in month
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay(); // 0 is Sun

  const monthName = new Date(currentYear, currentMonth, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const handlePrevMonth = () => {
    const d = new Date(currentYear, currentMonth - 1, 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleNextMonth = () => {
    const d = new Date(currentYear, currentMonth + 1, 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Month Header */}
      <div className="glass-panel" style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#FFF' }}>
            MONTHLY SSSGDW-B OVERVIEW // {monthName}
          </h2>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            High-level life distribution. Colored dots indicate daily execution categories.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handlePrevMonth}
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-secondary)',
              borderRadius: '6px',
              padding: '6px 10px',
              cursor: 'pointer',
            }}
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={handleNextMonth}
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-secondary)',
              borderRadius: '6px',
              padding: '6px 10px',
              cursor: 'pointer',
            }}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Month Days Grid */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        {/* Weekday Labels */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', marginBottom: '12px' }}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
            <div key={d} style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              {d}
            </div>
          ))}
        </div>

        {/* Days Cells */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
          {/* Empty prefix cells */}
          {Array.from({ length: firstDayIndex }).map((_, i) => (
            <div key={`empty-${i}`} style={{ height: '90px', borderRadius: '8px', opacity: 0.2 }} />
          ))}

          {/* Month Day Cells */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const dayStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
            const isSelected = dayStr === selectedDate;
            const dayEvents = events.filter((e) => e.date === dayStr);

            return (
              <div
                key={dayStr}
                onClick={() => setSelectedDate(dayStr)}
                style={{
                  height: '90px',
                  backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'var(--bg-elevated)',
                  border: isSelected ? '1.5px solid #6366F1' : '1px solid var(--border-subtle)',
                  borderRadius: '10px',
                  padding: '10px',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'all 0.15s',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: isSelected ? '#FFF' : 'var(--text-secondary)' }}>
                    {dayNum}
                  </span>
                  {dayEvents.some((e) => e.priority === 'P0') && (
                    <span style={{ fontSize: '9px', color: '#F87171', fontWeight: 900 }}>P0</span>
                  )}
                </div>

                {/* SSSGDW-B Activity Dots */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {dayEvents.map((e) => (
                    <div
                      key={e.id}
                      title={`${e.title} (${e.start_time})`}
                      style={{
                        width: '7px',
                        height: '7px',
                        borderRadius: '50%',
                        backgroundColor: LIFE_AREAS_CONFIG[e.life_area]?.color || '#999',
                        boxShadow: `0 0 4px ${LIFE_AREAS_CONFIG[e.life_area]?.color}`,
                      }}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
