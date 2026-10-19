import React, { useState } from 'react';
import { useLifeDb } from '../context/LifeDbContext';
import { LIFE_AREAS_CONFIG } from '../data/seedData';
import { LifeAreaKey, MasterLifeGoal } from '../types';
import {
  Target,
  Plus,
  CheckCircle2,
  Circle,
  AlertTriangle,
  Flame,
  Calendar,
  Trash2,
  X,
  Check,
} from 'lucide-react';

export const MasterGoals: React.FC = () => {
  const { milestones, setMilestones, metrics } = useLifeDb();
  const [selectedAreaFilter, setSelectedAreaFilter] = useState<LifeAreaKey | 'all'>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  // New goal form state
  const [newTitle, setNewTitle] = useState('');
  const [newArea, setNewArea] = useState<LifeAreaKey>('spiritual');
  const [newWhy, setNewWhy] = useState('');
  const [newPenalty, setNewPenalty] = useState('');
  const [newTargetDate, setNewTargetDate] = useState('2026-12-31');
  const [newMilestonesText, setNewMilestonesText] = useState('');

  const goals = (milestones as MasterLifeGoal[]) || [];

  const filteredGoals = goals.filter((g) => {
    if (selectedAreaFilter !== 'all' && g.life_area !== selectedAreaFilter) return false;
    return true;
  });

  const toggleMilestone = (goalId: string, milestoneId: string) => {
    setMilestones((prev: any) =>
      prev.map((g: MasterLifeGoal) => {
        if (g.id !== goalId) return g;
        const updatedMs = g.milestones.map((m) =>
          m.id === milestoneId ? { ...m, completed: !m.completed } : m
        );
        const completedCount = updatedMs.filter((m) => m.completed).length;
        const progressPct = updatedMs.length
          ? Math.round((completedCount / updatedMs.length) * 100)
          : 0;
        return {
          ...g,
          milestones: updatedMs,
          progress_pct: progressPct,
          status: progressPct === 100 ? 'achieved' : 'active',
        };
      })
    );
  };

  const deleteGoal = (goalId: string) => {
    setMilestones((prev: any) => prev.filter((g: MasterLifeGoal) => g.id !== goalId));
  };

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const msLines = newMilestonesText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    const createdGoal: MasterLifeGoal = {
      id: `goal-${Date.now()}`,
      title: newTitle.trim(),
      life_area: newArea,
      why_it_matters: newWhy.trim() || 'Core commitment to personal sovereignty and standards.',
      target_date: newTargetDate,
      status: 'active',
      progress_pct: 0,
      stakes_penalty: newPenalty.trim() || undefined,
      milestones: msLines.length
        ? msLines.map((t, idx) => ({ id: `ms-${Date.now()}-${idx}`, text: t, completed: false }))
        : [
            { id: `ms-${Date.now()}-1`, text: 'Establish 30-day baseline streak', completed: false },
            { id: `ms-${Date.now()}-2`, text: 'Execute without compromise', completed: false },
          ],
    };

    setMilestones((prev: any) => [createdGoal, ...prev]);
    setShowAddModal(false);
    setNewTitle('');
    setNewWhy('');
    setNewPenalty('');
    setNewMilestonesText('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Executive Command Header */}
      <div
        className="glass-panel"
        style={{
          padding: '24px 28px',
          borderLeft: '4px solid #F59E0B',
          background: 'var(--bg-card)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#F59E0B', fontWeight: 800, fontSize: '11px', letterSpacing: '1px' }}>
              <Target size={15} /> SSSGDW-B MASTER LIFE DESTINATIONS & HIGH-STAKES VISION
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: 900, color: '#FFF', marginTop: '6px', letterSpacing: '-0.5px' }}>
              HIGH-STAKES LIFE GOALS
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '6px', maxWidth: '750px', lineHeight: '20px' }}>
              Permanent systems over fleeting motivation. Define non-negotiables across all 7 tattoo dimensions (Social, Spiritual, Study, Gym, Diet, Work, Balance), attach concrete stakes, and track milestone execution.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-active)',
                padding: '10px 16px',
                borderRadius: '10px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase' }}>
                Discipline Rating
              </div>
              <div style={{ fontSize: '20px', fontWeight: 900, color: '#F59E0B', marginTop: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                <Flame size={18} /> {metrics.overall_score}%
              </div>
            </div>

            <button
              onClick={() => setShowAddModal(true)}
              style={{
                background: '#6366F1',
                border: 'none',
                color: '#FFF',
                padding: '12px 18px',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Plus size={16} />
              Add Life Goal
            </button>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div style={{ display: 'flex', gap: '6px', marginTop: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 800, marginRight: '4px', textTransform: 'uppercase' }}>
            Filter:
          </span>
          <button
            onClick={() => setSelectedAreaFilter('all')}
            className={`nav-tab-btn ${selectedAreaFilter === 'all' ? 'active' : ''}`}
            style={{ fontSize: '11px', padding: '5px 12px' }}
          >
            All Areas ({goals.length})
          </button>
          {(Object.keys(LIFE_AREAS_CONFIG) as LifeAreaKey[]).map((key) => {
            const area = LIFE_AREAS_CONFIG[key];
            const isSel = selectedAreaFilter === key;
            const count = goals.filter((g) => g.life_area === key).length;
            return (
              <button
                key={key}
                onClick={() => setSelectedAreaFilter(key)}
                className={`nav-tab-btn ${isSel ? 'active' : ''}`}
                style={{
                  fontSize: '11px',
                  padding: '5px 12px',
                  borderLeft: `3px solid ${area.color}`,
                }}
              >
                {area.name} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Goals Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(480px, 1fr))', gap: '16px' }}>
        {filteredGoals.map((goal) => {
          const area = LIFE_AREAS_CONFIG[goal.life_area] || LIFE_AREAS_CONFIG.balance;
          const isAchieved = goal.status === 'achieved';

          return (
            <div
              key={goal.id}
              className="glass-panel"
              style={{
                padding: '22px',
                borderTop: `3px solid ${area.color}`,
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
              }}
            >
              {/* Card Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <span
                      style={{
                        backgroundColor: area.bgLight,
                        color: area.color,
                        border: `1px solid ${area.color}`,
                        fontSize: '10px',
                        fontWeight: 900,
                        padding: '2px 8px',
                        borderRadius: '6px',
                        fontFamily: 'JetBrains Mono',
                      }}
                    >
                      {area.letter} // {area.name.toUpperCase()}
                    </span>

                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: '6px',
                        backgroundColor: isAchieved ? 'rgba(16, 185, 129, 0.2)' : 'rgba(99, 102, 241, 0.15)',
                        color: isAchieved ? '#34D399' : '#818CF8',
                        fontFamily: 'JetBrains Mono',
                      }}
                    >
                      {isAchieved ? '✓ ACHIEVED' : `TARGET: ${goal.target_date}`}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#FFF', lineHeight: '22px' }}>
                    {goal.title}
                  </h3>
                </div>

                <button
                  onClick={() => deleteGoal(goal.id)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: '4px',
                  }}
                  title="Delete Goal"
                >
                  <Trash2 size={15} />
                </button>
              </div>

              {/* Progress Bar */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '5px' }}>
                  <span>Execution Velocity</span>
                  <span className="mono" style={{ color: area.color, fontWeight: 800 }}>
                    {goal.progress_pct}%
                  </span>
                </div>
                <div style={{ height: '6px', backgroundColor: 'var(--bg-surface)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${goal.progress_pct}%`,
                      backgroundColor: isAchieved ? '#10B981' : area.color,
                      transition: 'width 0.3s ease',
                    }}
                  />
                </div>
              </div>

              {/* Why Inaction is Fatal (Stakes) */}
              <div
                style={{
                  background: 'rgba(0, 0, 0, 0.25)',
                  borderLeft: '2px solid rgba(255, 255, 255, 0.1)',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  color: 'var(--text-secondary)',
                  lineHeight: '17px',
                }}
              >
                <span style={{ color: '#F1F5F9', fontWeight: 700 }}>WHY INACTION IS FATAL: </span>
                {goal.why_it_matters}
              </div>

              {/* High Stakes Penalty Note */}
              {goal.stakes_penalty && (
                <div
                  style={{
                    background: 'rgba(239, 68, 68, 0.08)',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    color: '#FCA5A5',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <AlertTriangle size={13} color="#EF4444" />
                  <span>Stakes / Penalty: {goal.stakes_penalty}</span>
                </div>
              )}

              {/* Milestones Checklist */}
              <div>
                <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Execution Anchors (Click to check off)
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {goal.milestones.map((ms) => (
                    <div
                      key={ms.id}
                      onClick={() => toggleMilestone(goal.id, ms.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '6px 10px',
                        backgroundColor: ms.completed ? 'rgba(16, 185, 129, 0.08)' : 'var(--bg-elevated)',
                        border: ms.completed ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid var(--border-subtle)',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        color: ms.completed ? '#34D399' : 'var(--text-primary)',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {ms.completed ? (
                        <CheckCircle2 size={14} color="#10B981" />
                      ) : (
                        <Circle size={14} color="var(--text-muted)" />
                      )}
                      <span style={{ textDecoration: ms.completed ? 'line-through' : 'none', flex: 1 }}>
                        {ms.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Life Goal Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '580px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Target size={18} color="#6366F1" />
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#FFF' }}>
                  CREATE HIGH-STAKES LIFE GOAL
                </h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddGoal} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  GOAL TITLE (CONCRETE DESTINATION)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Master Full-Stack Agentic AI Systems & Ship 2 Products"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                  style={{ width: '100%', padding: '10px', background: 'var(--bg-elevated)', border: '1px solid var(--border-active)', borderRadius: '8px', color: '#FFF' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    SSSGDW-B DIMENSION
                  </label>
                  <select
                    value={newArea}
                    onChange={(e) => setNewArea(e.target.value as LifeAreaKey)}
                    style={{ width: '100%', padding: '10px', background: 'var(--bg-elevated)', border: '1px solid var(--border-active)', borderRadius: '8px', color: '#FFF' }}
                  >
                    {(Object.keys(LIFE_AREAS_CONFIG) as LifeAreaKey[]).map((k) => (
                      <option key={k} value={k}>
                        {LIFE_AREAS_CONFIG[k].name} ({LIFE_AREAS_CONFIG[k].letter})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    TARGET DEADLINE
                  </label>
                  <input
                    type="date"
                    value={newTargetDate}
                    onChange={(e) => setNewTargetDate(e.target.value)}
                    style={{ width: '100%', padding: '9px', background: 'var(--bg-elevated)', border: '1px solid var(--border-active)', borderRadius: '8px', color: '#FFF' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  WHY INACTION IS FATAL (THE STAKES / HONEST TRUTH)
                </label>
                <textarea
                  rows={2}
                  placeholder="Explain why failing this goal will destroy your momentum or future..."
                  value={newWhy}
                  onChange={(e) => setNewWhy(e.target.value)}
                  style={{ width: '100%', padding: '10px', background: 'var(--bg-elevated)', border: '1px solid var(--border-active)', borderRadius: '8px', color: '#FFF', resize: 'none' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  ACCOUNTABILITY PENALTY (REAL COST IF YOU QUIT)
                </label>
                <input
                  type="text"
                  placeholder="e.g. ₹5,000 donation or public accountability write-up"
                  value={newPenalty}
                  onChange={(e) => setNewPenalty(e.target.value)}
                  style={{ width: '100%', padding: '10px', background: 'var(--bg-elevated)', border: '1px solid var(--border-active)', borderRadius: '8px', color: '#FFF' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  MILESTONES (ONE PER LINE)
                </label>
                <textarea
                  rows={3}
                  placeholder="30-day streak with zero snooze&#10;Ship production prototype&#10;Achieve target benchmark"
                  value={newMilestonesText}
                  onChange={(e) => setNewMilestonesText(e.target.value)}
                  style={{ width: '100%', padding: '10px', background: 'var(--bg-elevated)', border: '1px solid var(--border-active)', borderRadius: '8px', color: '#FFF', resize: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{ background: 'transparent', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ background: '#6366F1', border: 'none', color: '#FFF', fontWeight: 800, padding: '10px 20px', borderRadius: '8px', cursor: 'pointer' }}
                >
                  Commit Goal to DB
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
