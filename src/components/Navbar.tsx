import React from 'react';
import { useLifeDb } from '../context/LifeDbContext';
import { LIFE_AREAS_CONFIG } from '../data/seedData';
import { LifeAreaKey } from '../types';
import {
  Calendar,
  CalendarDays,
  CalendarRange,
  Database,
  Target,
  Sparkles,
  Flame,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  BrainCircuit,
} from 'lucide-react';

interface NavbarProps {
  currentView?: 'day' | 'week' | 'month' | 'table' | 'goals';
  setCurrentView?: (view: 'day' | 'week' | 'month' | 'table' | 'goals') => void;
  selectedAreaFilter?: LifeAreaKey | 'all';
  setSelectedAreaFilter?: (area: LifeAreaKey | 'all') => void;
}

export const Navbar: React.FC<NavbarProps> = (props) => {
  const context = useLifeDb();
  const currentView = props.currentView || context.currentView;
  const setCurrentView = props.setCurrentView || context.setCurrentView;
  const selectedAreaFilter = props.selectedAreaFilter || context.selectedAreaFilter;
  const setSelectedAreaFilter = props.setSelectedAreaFilter || context.setSelectedAreaFilter;

  const {
    selectedDate,
    setSelectedDate,
    metrics,
    coachingMode,
    setCoachingMode,
    setIsJarvisOpen,
  } = context;

  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleToday = () => {
    setSelectedDate(new Date().toISOString().split('T')[0]);
  };

  return (
    <header className="navbar">
      {/* Brand & Tattoo Framework Pills */}
      <div className="brand-section">
        <div className="brand-logo">
          <Database size={20} color="#6366F1" />
          <span>LIFE DB</span>
        </div>

        {/* SSSGDW-B Tattoo Framework Bar */}
        <div className="sssgdw-pill-bar" title="SSSGDW-B Tattoo Framework">
          {(Object.keys(LIFE_AREAS_CONFIG) as LifeAreaKey[]).map((key) => {
            const area = LIFE_AREAS_CONFIG[key];
            const isSelected = selectedAreaFilter === key;
            return (
              <span
                key={key}
                className="sssgdw-pill"
                style={{
                  backgroundColor: isSelected ? area.color : area.bgLight,
                  color: isSelected ? '#000' : area.color,
                  border: `1px solid ${area.color}`,
                }}
                onClick={() =>
                  setSelectedAreaFilter(selectedAreaFilter === key ? 'all' : key)
                }
                title={`${area.name} (${area.letter}): ${area.description}`}
              >
                {area.letter}
              </span>
            );
          })}
        </div>
      </div>

      {/* View Switcher Tabs */}
      <nav className="nav-views">
        <button
          className={`nav-tab-btn ${currentView === 'day' ? 'active' : ''}`}
          onClick={() => setCurrentView('day')}
        >
          <Calendar size={14} />
          Day
        </button>
        <button
          className={`nav-tab-btn ${currentView === 'week' ? 'active' : ''}`}
          onClick={() => setCurrentView('week')}
        >
          <CalendarDays size={14} />
          Week
        </button>
        <button
          className={`nav-tab-btn ${currentView === 'month' ? 'active' : ''}`}
          onClick={() => setCurrentView('month')}
        >
          <CalendarRange size={14} />
          Month
        </button>
        <button
          className={`nav-tab-btn ${currentView === 'table' ? 'active' : ''}`}
          onClick={() => setCurrentView('table')}
        >
          <Database size={14} />
          Life DB Studio
        </button>
        <button
          className={`nav-tab-btn ${currentView === 'goals' ? 'active' : ''}`}
          onClick={() => setCurrentView('goals')}
        >
          <Target size={14} />
          Core Goals
        </button>
      </nav>

      {/* Date Navigation & Right Actions */}
      <div className="nav-actions">
        {/* Date Navigator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button
            onClick={handlePrevDay}
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-secondary)',
              borderRadius: '6px',
              padding: '6px 8px',
              cursor: 'pointer',
            }}
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={handleToday}
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              color: '#FFF',
              borderRadius: '6px',
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'JetBrains Mono',
            }}
          >
            {selectedDate}
          </button>
          <button
            onClick={handleNextDay}
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-secondary)',
              borderRadius: '6px',
              padding: '6px 8px',
              cursor: 'pointer',
            }}
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Discipline Score Badge */}
        <div className="discipline-badge" title="Daily Discipline Index">
          <Flame size={14} />
          <span>{metrics.overall_score}%</span>
        </div>

        {/* Coaching Mode Toggle */}
        <button
          onClick={() =>
            setCoachingMode(
              coachingMode === 'drill-sergeant' ? 'strategist' : 'drill-sergeant'
            )
          }
          style={{
            background:
              coachingMode === 'drill-sergeant'
                ? 'rgba(239, 68, 68, 0.15)'
                : 'rgba(56, 189, 248, 0.15)',
            border: `1px solid ${
              coachingMode === 'drill-sergeant' ? '#EF4444' : '#38BDF8'
            }`,
            color: coachingMode === 'drill-sergeant' ? '#EF4444' : '#38BDF8',
            borderRadius: '8px',
            padding: '6px 10px',
            fontSize: '11px',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
          }}
          title="Toggle Coaching Mode"
        >
          {coachingMode === 'drill-sergeant' ? (
            <ShieldAlert size={13} />
          ) : (
            <BrainCircuit size={13} />
          )}
          <span>{coachingMode === 'drill-sergeant' ? 'Drill' : 'Strategist'}</span>
        </button>

        {/* JARVIS Button */}
        <button className="jarvis-btn" onClick={() => setIsJarvisOpen(true)} title="Open JARVIS AI Assistant">
          <Sparkles size={14} />
          <span>JARVIS</span>
        </button>
      </div>
    </header>
  );
};
