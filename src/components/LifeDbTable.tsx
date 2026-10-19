import React, { useState } from 'react';
import { useLifeDb } from '../context/LifeDbContext';
import { LIFE_AREAS_CONFIG } from '../data/seedData';
import { LifeAreaKey, Priority, Task, ScheduledEvent } from '../types';
import { Database, Plus, Trash2, Search, Table2, Layers, Check, Edit3, Download } from 'lucide-react';

export const LifeDbTable: React.FC = () => {
  const {
    tasks,
    updateTask,
    deleteTask,
    addTask,
    events,
    addEvent,
    updateEvent,
    deleteEvent,
    dailyLogs,
    selectedDate,
    setEditTargetEvent,
  } = useLifeDb();

  const [activeTable, setActiveTable] = useState<'tasks' | 'events' | 'logs'>('tasks');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  // New Record Form State
  const [showAddRow, setShowAddRow] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState(selectedDate);
  const [newArea, setNewArea] = useState<LifeAreaKey>('social');
  const [newPriority, setNewPriority] = useState<Priority>('P1');
  const [newFixed, setNewFixed] = useState(false);
  const [newStart, setNewStart] = useState('09:00');
  const [newEnd, setNewEnd] = useState('10:00');

  const handleCreateRecord = () => {
    if (!newTitle.trim()) return;

    if (activeTable === 'tasks') {
      addTask({
        title: newTitle.trim(),
        life_area: newArea,
        priority: newPriority,
        is_recurring: true,
        duration_minutes: 60,
        is_fixed: newFixed,
        fixed_start_time: newStart,
        fixed_end_time: newEnd,
      });
    } else if (activeTable === 'events') {
      addEvent({
        task_id: `custom-${Date.now()}`,
        title: newTitle.trim(),
        life_area: newArea,
        priority: newPriority,
        is_fixed: newFixed,
        date: newDate || selectedDate,
        start_time: newStart,
        end_time: newEnd,
        status: 'planned',
      });
    }

    setNewTitle('');
    setShowAddRow(false);
  };

  const exportBackupJson = () => {
    const backup = {
      exported_at: new Date().toISOString(),
      tasks,
      events,
      dailyLogs,
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `life_db_backup_${selectedDate}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Studio Header */}
      <div className="glass-panel" style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Database size={20} color="#6366F1" />
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#FFF' }}>
                LIFE DATABASE // SQL STUDIO
              </h2>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Direct relational storage of your life protocols. Alter weekend plans, lock fixed slots, and query logs.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {/* Table Selector */}
            <div style={{ display: 'flex', background: 'var(--bg-surface)', padding: '3px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
              <button
                onClick={() => setActiveTable('tasks')}
                className={`nav-tab-btn ${activeTable === 'tasks' ? 'active' : ''}`}
                style={{ fontSize: '11px', padding: '5px 12px' }}
              >
                <Table2 size={13} />
                dbo.tasks ({tasks.length})
              </button>
              <button
                onClick={() => setActiveTable('events')}
                className={`nav-tab-btn ${activeTable === 'events' ? 'active' : ''}`}
                style={{ fontSize: '11px', padding: '5px 12px' }}
              >
                <Layers size={13} />
                dbo.scheduled_events ({events.length})
              </button>
              <button
                onClick={() => setActiveTable('logs')}
                className={`nav-tab-btn ${activeTable === 'logs' ? 'active' : ''}`}
                style={{ fontSize: '11px', padding: '5px 12px' }}
              >
                <Database size={13} />
                dbo.daily_logs ({dailyLogs.length})
              </button>
            </div>

            <button
              onClick={() => setShowAddRow(!showAddRow)}
              style={{
                background: '#6366F1',
                border: 'none',
                color: '#FFF',
                padding: '8px 14px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Plus size={14} />
              Insert Row
            </button>

            <button
              onClick={exportBackupJson}
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-secondary)',
                padding: '8px 14px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
              title="Export database JSON backup"
            >
              <Download size={14} />
              Export JSON
            </button>
          </div>
        </div>

        {/* Search / SQL Filter Input */}
        <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              flex: 1,
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-active)',
              borderRadius: '8px',
              padding: '8px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <Search size={15} color="var(--text-muted)" />
            <input
              type="text"
              placeholder={`Filter dbo.${activeTable} (e.g. gym, spiritual, P0, weekend)...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#FFF',
                outline: 'none',
                width: '100%',
                fontSize: '13px',
                fontFamily: 'JetBrains Mono',
              }}
            />
          </div>
        </div>
      </div>

      {/* Insert Form Drawer */}
      {showAddRow && (
        <div className="glass-panel" style={{ padding: '20px 24px', border: '1.5px solid #6366F1' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#FFF', marginBottom: '14px' }}>
            INSERT INTO dbo.{activeTable} VALUES (...)
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
            {activeTable === 'events' && (
              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>DATE</label>
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  style={{ width: '100%', padding: '8px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: '#FFF' }}
                />
              </div>
            )}
            <div>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>TITLE</label>
              <input
                type="text"
                placeholder="e.g. Saturday Trail Run"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                style={{ width: '100%', padding: '8px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: '#FFF' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>LIFE AREA (SSSGDW-B)</label>
              <select
                value={newArea}
                onChange={(e) => setNewArea(e.target.value as LifeAreaKey)}
                style={{ width: '100%', padding: '8px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: '#FFF' }}
              >
                {(Object.keys(LIFE_AREAS_CONFIG) as LifeAreaKey[]).map((k) => (
                  <option key={k} value={k}>{LIFE_AREAS_CONFIG[k].name} ({LIFE_AREAS_CONFIG[k].letter})</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>PRIORITY</label>
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value as Priority)}
                style={{ width: '100%', padding: '8px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: '#FFF' }}
              >
                <option value="P0">P0 (Rock / Non-Negotiable)</option>
                <option value="P1">P1 (Channel / Core)</option>
                <option value="P2">P2 (Flexible)</option>
                <option value="P3">P3 (Optional)</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>IS_FIXED (LOCKED)</label>
              <select
                value={newFixed ? 'true' : 'false'}
                onChange={(e) => setNewFixed(e.target.value === 'true')}
                style={{ width: '100%', padding: '8px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: '#FFF' }}
              >
                <option value="false">FALSE (Flexible)</option>
                <option value="true">TRUE (Locked Slot)</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>START / END</label>
              <div style={{ display: 'flex', gap: '6px' }}>
                <input
                  type="time"
                  value={newStart}
                  onChange={(e) => setNewStart(e.target.value)}
                  style={{ width: '50%', padding: '6px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: '#FFF' }}
                />
                <input
                  type="time"
                  value={newEnd}
                  onChange={(e) => setNewEnd(e.target.value)}
                  style={{ width: '50%', padding: '6px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: '#FFF' }}
                />
              </div>
            </div>
          </div>
          <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
            <button
              onClick={handleCreateRecord}
              style={{ background: '#10B981', color: '#000', fontWeight: 800, padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer' }}
            >
              EXECUTE COMMIT
            </button>
            <button
              onClick={() => setShowAddRow(false)}
              style={{ background: 'transparent', color: 'var(--text-secondary)', padding: '8px 16px', borderRadius: '6px', border: '1px solid var(--border-subtle)', cursor: 'pointer' }}
            >
              CANCEL
            </button>
          </div>
        </div>
      )}

      {/* Database Table Render */}
      <div className="db-table-wrapper">
        {activeTable === 'tasks' && (
          <table className="db-table">
            <thead>
              <tr>
                <th>id</th>
                <th>title</th>
                <th>life_area</th>
                <th>priority</th>
                <th>is_fixed</th>
                <th>fixed_slot</th>
                <th>actions</th>
              </tr>
            </thead>
            <tbody>
              {tasks
                .filter((t) => t.title.toLowerCase().includes(searchTerm.toLowerCase()) || t.life_area.includes(searchTerm.toLowerCase()) || t.priority.includes(searchTerm.toUpperCase()))
                .map((task) => {
                  const area = LIFE_AREAS_CONFIG[task.life_area];
                  return (
                    <tr key={task.id}>
                      <td className="mono" style={{ color: 'var(--text-muted)' }}>{task.id}</td>
                      <td>
                        <input
                          type="text"
                          value={task.title}
                          onChange={(e) => updateTask(task.id, { title: e.target.value })}
                          style={{ background: 'transparent', border: 'none', color: '#FFF', fontWeight: 600, width: '100%', outline: 'none' }}
                        />
                      </td>
                      <td>
                        <span
                          className="sql-badge"
                          style={{ backgroundColor: area.bgLight, color: area.color, border: `1px solid ${area.color}` }}
                        >
                          {area.name} ({area.letter})
                        </span>
                      </td>
                      <td>
                        <select
                          value={task.priority}
                          onChange={(e) => updateTask(task.id, { priority: e.target.value as Priority })}
                          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', color: task.priority === 'P0' ? '#F87171' : '#FFF', padding: '3px 6px', borderRadius: '4px', fontWeight: 700 }}
                        >
                          <option value="P0">P0</option>
                          <option value="P1">P1</option>
                          <option value="P2">P2</option>
                          <option value="P3">P3</option>
                        </select>
                      </td>
                      <td>
                        <button
                          onClick={() => updateTask(task.id, { is_fixed: !task.is_fixed })}
                          style={{
                            background: task.is_fixed ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                            border: `1px solid ${task.is_fixed ? '#F59E0B' : 'var(--border-subtle)'}`,
                            color: task.is_fixed ? '#F59E0B' : 'var(--text-muted)',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '11px',
                            fontFamily: 'JetBrains Mono',
                          }}
                        >
                          {task.is_fixed ? 'TRUE (LOCKED)' : 'FALSE'}
                        </button>
                      </td>
                      <td className="mono" style={{ color: 'var(--text-secondary)' }}>
                        {task.fixed_start_time || '—'} - {task.fixed_end_time || '—'}
                      </td>
                      <td>
                        <button
                          onClick={() => deleteTask(task.id)}
                          style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                          title="DELETE FROM tasks"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        )}

        {activeTable === 'events' && (
          <table className="db-table">
            <thead>
              <tr>
                <th>id</th>
                <th>date</th>
                <th>start / end</th>
                <th>title</th>
                <th>life_area</th>
                <th>priority</th>
                <th>status</th>
                <th>actions</th>
              </tr>
            </thead>
            <tbody>
              {events
                .filter((e) => e.title.toLowerCase().includes(searchTerm.toLowerCase()) || e.status.includes(searchTerm.toLowerCase()))
                .map((evt) => {
                  const area = LIFE_AREAS_CONFIG[evt.life_area];
                  return (
                    <tr key={evt.id}>
                      <td className="mono" style={{ color: 'var(--text-muted)' }}>{evt.id}</td>
                      <td className="mono">{evt.date}</td>
                      <td className="mono">{evt.start_time} - {evt.end_time}</td>
                      <td style={{ fontWeight: 600 }}>{evt.title}</td>
                      <td>
                        <span className="sql-badge" style={{ backgroundColor: area.bgLight, color: area.color, border: `1px solid ${area.color}` }}>
                          {area.name}
                        </span>
                      </td>
                      <td><span className="mono" style={{ color: evt.priority === 'P0' ? '#F87171' : '#818CF8' }}>{evt.priority}</span></td>
                      <td>
                        <select
                          value={evt.status}
                          onChange={(e) => updateEvent(evt.id, { status: e.target.value as any })}
                          style={{
                            background: 'var(--bg-elevated)',
                            border: '1px solid var(--border-subtle)',
                            color: evt.status === 'completed' ? '#10B981' : evt.status === 'skipped' ? '#EF4444' : '#94A3B8',
                            padding: '3px 6px',
                            borderRadius: '4px',
                            fontWeight: 800,
                            fontSize: '11px',
                          }}
                        >
                          <option value="planned">PLANNED</option>
                          <option value="completed">COMPLETED</option>
                          <option value="skipped">SKIPPED</option>
                          <option value="rescheduled">RESCHEDULED</option>
                        </select>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            onClick={() => setEditTargetEvent(evt)}
                            style={{ background: 'transparent', border: 'none', color: '#818CF8', cursor: 'pointer', padding: '4px' }}
                            title="Edit / Reschedule Slot"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            onClick={() => deleteEvent(evt.id)}
                            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                            title="DELETE FROM scheduled_events"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        )}

        {activeTable === 'logs' && (
          <table className="db-table">
            <thead>
              <tr>
                <th>timestamp</th>
                <th>date</th>
                <th>title</th>
                <th>status</th>
                <th>skip_reason</th>
              </tr>
            </thead>
            <tbody>
              {dailyLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>
                    No audit logs recorded yet. Execute or skip tasks to generate entries.
                  </td>
                </tr>
              ) : (
                dailyLogs.map((log) => (
                  <tr key={log.id}>
                    <td className="mono" style={{ color: 'var(--text-muted)' }}>{log.timestamp.slice(11, 19)}</td>
                    <td className="mono">{log.date}</td>
                    <td style={{ fontWeight: 600 }}>{log.title}</td>
                    <td>
                      <span style={{ color: log.status === 'done' ? '#10B981' : '#EF4444', fontWeight: 800 }}>
                        {log.status.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ fontStyle: 'italic', color: '#FCA5A5' }}>{log.skip_reason || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
