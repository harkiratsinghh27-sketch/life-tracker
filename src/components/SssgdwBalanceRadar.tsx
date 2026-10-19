import React from 'react';
import { useLifeDb } from '../context/LifeDbContext';
import { LIFE_AREAS_CONFIG } from '../data/seedData';
import { LifeAreaKey } from '../types';
import { ShieldCheck, Target, Zap } from 'lucide-react';

export const SssgdwBalanceRadar: React.FC = () => {
  const { metrics } = useLifeDb();

  return (
    <div className="glass-panel" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 800 }}>
            TATTOO FRAMEWORK ANALYSIS
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#FFF', marginTop: '2px' }}>
            SSSGDW-B LIFE EQUILIBRIUM
          </h3>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', color: '#10B981', fontWeight: 800 }}>
            INDEX: {metrics.overall_score}/100
          </span>
        </div>
      </div>

      {/* Grid of the 7 Areas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
        {(Object.keys(LIFE_AREAS_CONFIG) as LifeAreaKey[]).map((key) => {
          const area = LIFE_AREAS_CONFIG[key];
          const executedHours = metrics.area_distribution[key] || 0;
          const plannedHours = metrics.planned_distribution[key] || 0;
          const target = key === 'work' ? 8 : key === 'gym' ? 1.5 : key === 'study' ? 1.5 : 1;
          const score = Math.min(100, Math.round((executedHours / target) * 100));

          return (
            <div
              key={key}
              style={{
                backgroundColor: 'var(--bg-elevated)',
                border: `1px solid var(--border-subtle)`,
                borderTop: `3px solid ${area.color}`,
                borderRadius: '12px',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', fontWeight: 900, color: area.color, letterSpacing: '0.8px' }}>
                  {area.letter} // {area.name.toUpperCase()}
                </span>
                <span className="mono" style={{ fontSize: '11px', color: executedHours > 0 ? '#10B981' : 'var(--text-muted)' }}>
                  {executedHours.toFixed(1)}h / {plannedHours > 0 ? plannedHours.toFixed(1) : target}h
                </span>
              </div>

              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: '14px', height: '28px' }}>
                {area.description.slice(0, 50)}...
              </div>

              {/* Progress bar */}
              <div style={{ height: '5px', backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${score}%`,
                    backgroundColor: area.color,
                    borderRadius: '3px',
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
