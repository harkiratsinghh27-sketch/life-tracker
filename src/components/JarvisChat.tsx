import React, { useState, useRef, useEffect } from 'react';
import { useLifeDb } from '../context/LifeDbContext';
import {
  Sparkles,
  X,
  Send,
  Mic,
  MicOff,
  ShieldAlert,
  BrainCircuit,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Zap,
  User,
  MessageSquare,
  Compass,
  ArrowRight,
  Flame,
  Target,
  Plus,
  RefreshCw,
  Lightbulb,
} from 'lucide-react';
import { LIFE_AREAS_CONFIG } from '../data/seedData';
import { LifeAreaKey } from '../types';

export const JarvisChat: React.FC = () => {
  const {
    isJarvisOpen,
    setIsJarvisOpen,
    chatMessages,
    sendChatMessage,
    confirmPendingAction,
    cancelPendingAction,
    executeInteractiveAction,
    coachingMode,
    setCoachingMode,
    userProfile,
    addLearnedInsight,
    askRandomQuestion,
    activeDiscoveryQuestion,
  } = useLifeDb();

  const [activeTab, setActiveTab] = useState<'chat' | 'memory' | 'actions'>('chat');
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [newInsightText, setNewInsightText] = useState('');
  const [newInsightCat, setNewInsightCat] = useState<
    'energy' | 'schedule' | 'distraction' | 'ambition' | 'health' | 'habits'
  >('habits');
  const [isAddingInsight, setIsAddingInsight] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeTab === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isJarvisOpen, activeTab]);

  if (!isJarvisOpen) return null;

  const handleSend = () => {
    if (!input.trim()) return;
    sendChatMessage(input);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleVoice = () => {
    if (!isListening) {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognition.continuous = false;
          recognition.interimResults = false;
          recognition.lang = 'en-US';

          recognition.onstart = () => {
            setIsListening(true);
          };

          recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setInput(transcript);
            setIsListening(false);
          };

          recognition.onerror = () => {
            setIsListening(false);
          };

          recognition.onend = () => {
            setIsListening(false);
          };

          recognition.start();
          return;
        } catch (e) {
          console.warn('SpeechRecognition start error:', e);
        }
      }

      setIsListening(true);
      setTimeout(() => {
        setInput('Completed gym session and prayer today.');
        setIsListening(false);
      }, 2000);
    } else {
      setIsListening(false);
    }
  };

  const handleAddManualInsight = () => {
    if (!newInsightText.trim()) return;
    addLearnedInsight(newInsightCat, newInsightText.trim());
    setNewInsightText('');
    setIsAddingInsight(false);
  };

  return (
    <div className="jarvis-drawer">
      {/* Header */}
      <div className="jarvis-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              background: 'linear-gradient(135deg, #6366F1, #A855F7)',
              padding: '8px',
              borderRadius: '10px',
              color: '#FFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Sparkles size={18} />
          </div>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 900, color: '#FFF', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>JARVIS</span>
              <span
                style={{
                  fontSize: '9px',
                  background: 'rgba(99, 102, 241, 0.25)',
                  border: '1px solid #6366F1',
                  color: '#A5B4FC',
                  padding: '1px 6px',
                  borderRadius: '4px',
                  fontWeight: 700,
                }}
              >
                AUTONOMOUS
              </span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Connected to Harkirat Singh's Life DB ({userProfile.learned_insights.length} Memories)
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() =>
              setCoachingMode(
                coachingMode === 'drill-sergeant' ? 'strategist' : 'drill-sergeant'
              )
            }
            style={{
              background:
                coachingMode === 'drill-sergeant'
                  ? 'rgba(239, 68, 68, 0.2)'
                  : 'rgba(56, 189, 248, 0.2)',
              border: `1px solid ${
                coachingMode === 'drill-sergeant' ? '#EF4444' : '#38BDF8'
              }`,
              color: coachingMode === 'drill-sergeant' ? '#EF4444' : '#38BDF8',
              borderRadius: '6px',
              padding: '4px 8px',
              fontSize: '10px',
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            {coachingMode === 'drill-sergeant' ? 'DRILL SERGEANT' : 'STRATEGIST'}
          </button>

          <button
            onClick={() => setIsJarvisOpen(false)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: '4px',
            }}
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'rgba(0, 0, 0, 0.3)',
          padding: '4px 12px',
          gap: '6px',
        }}
      >
        <button
          onClick={() => setActiveTab('chat')}
          style={{
            flex: 1,
            background: activeTab === 'chat' ? 'var(--bg-elevated)' : 'transparent',
            border: activeTab === 'chat' ? '1px solid var(--border-active)' : '1px solid transparent',
            color: activeTab === 'chat' ? '#FFF' : 'var(--text-muted)',
            borderRadius: '6px',
            padding: '6px 8px',
            fontSize: '11px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '5px',
            cursor: 'pointer',
          }}
        >
          <MessageSquare size={13} />
          Chat & Control
        </button>

        <button
          onClick={() => setActiveTab('memory')}
          style={{
            flex: 1,
            background: activeTab === 'memory' ? 'var(--bg-elevated)' : 'transparent',
            border: activeTab === 'memory' ? '1px solid var(--border-active)' : '1px solid transparent',
            color: activeTab === 'memory' ? '#A5B4FC' : 'var(--text-muted)',
            borderRadius: '6px',
            padding: '6px 8px',
            fontSize: '11px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '5px',
            cursor: 'pointer',
          }}
        >
          <BrainCircuit size={13} />
          Memory ({userProfile.learned_insights.length})
        </button>

        <button
          onClick={() => setActiveTab('actions')}
          style={{
            flex: 1,
            background: activeTab === 'actions' ? 'var(--bg-elevated)' : 'transparent',
            border: activeTab === 'actions' ? '1px solid var(--border-active)' : '1px solid transparent',
            color: activeTab === 'actions' ? '#10B981' : 'var(--text-muted)',
            borderRadius: '6px',
            padding: '6px 8px',
            fontSize: '11px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '5px',
            cursor: 'pointer',
          }}
        >
          <Zap size={13} />
          Quick Actions
        </button>
      </div>

      {/* TAB 1: CHAT FEED */}
      {activeTab === 'chat' && (
        <>
          <div className="jarvis-chat-messages">
            {/* Active Question Alert Banner if Jarvis is waiting for profile discovery answer */}
            {activeDiscoveryQuestion && (
              <div
                style={{
                  background: 'rgba(99, 102, 241, 0.15)',
                  border: '1px solid #6366F1',
                  borderRadius: '10px',
                  padding: '12px 14px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                }}
              >
                <HelpCircle size={18} color="#A5B4FC" style={{ marginTop: '2px', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#A5B4FC', marginBottom: '3px' }}>
                    PENDING DISCOVERY CALIBRATION ({activeDiscoveryQuestion.category.toUpperCase()})
                  </div>
                  <div style={{ fontSize: '13px', color: '#FFF', lineHeight: 1.4 }}>
                    {activeDiscoveryQuestion.question}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Type your answer below so Jarvis can commit it to memory and adapt your schedule.
                  </div>
                </div>
              </div>
            )}

            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`chat-bubble ${msg.role}`}
                style={{
                  whiteSpace: 'pre-wrap',
                }}
              >
                <div
                  style={{
                    fontSize: '10px',
                    opacity: 0.7,
                    marginBottom: '4px',
                    display: 'flex',
                    justifyContent: 'space-between',
                  }}
                >
                  <span style={{ fontWeight: 800 }}>
                    {msg.role === 'user' ? 'YOU (HARKIRAT)' : 'JARVIS'}
                  </span>
                  <span>{msg.timestamp}</span>
                </div>

                <div>{msg.content}</div>

                {/* Interactive Action Chips */}
                {msg.interactive_actions && msg.interactive_actions.length > 0 && (
                  <div
                    style={{
                      marginTop: '10px',
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '6px',
                      paddingTop: '6px',
                      borderTop: '1px dashed rgba(255, 255, 255, 0.12)',
                    }}
                  >
                    {msg.interactive_actions.map((act, i) => (
                      <button
                        key={i}
                        onClick={() => executeInteractiveAction(act.action_type, act.payload)}
                        style={{
                          background:
                            act.variant === 'primary'
                              ? '#6366F1'
                              : act.variant === 'success'
                              ? '#10B981'
                              : 'rgba(255, 255, 255, 0.08)',
                          border: `1px solid ${
                            act.variant === 'primary'
                              ? '#818CF8'
                              : act.variant === 'success'
                              ? '#34D399'
                              : 'rgba(255, 255, 255, 0.18)'
                          }`,
                          color: act.variant === 'success' ? '#000' : '#FFF',
                          fontWeight: 700,
                          fontSize: '11px',
                          padding: '5px 10px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {act.label}
                      </button>
                    ))}
                  </div>
                )}

                {/* Pending Confirmation Card */}
                {msg.pending_confirmation && (
                  <div
                    style={{
                      marginTop: '12px',
                      background: 'rgba(0, 0, 0, 0.4)',
                      border: '1px solid #6366F1',
                      borderRadius: '10px',
                      padding: '12px',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '12px',
                        fontWeight: 800,
                        color: '#A5B4FC',
                        marginBottom: '4px',
                      }}
                    >
                      ⚠ MUTATION CONFIRMATION REQUIRED
                    </div>
                    <div style={{ fontSize: '13px', color: '#FFF', marginBottom: '10px' }}>
                      {msg.pending_confirmation.description}
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => confirmPendingAction(msg.id)}
                        style={{
                          background: '#10B981',
                          border: 'none',
                          color: '#000',
                          fontWeight: 800,
                          padding: '6px 12px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '11px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <CheckCircle2 size={13} /> CONFIRM
                      </button>
                      <button
                        onClick={() => cancelPendingAction(msg.id)}
                        style={{
                          background: 'rgba(239, 68, 68, 0.2)',
                          border: '1px solid #EF4444',
                          color: '#EF4444',
                          fontWeight: 700,
                          padding: '6px 12px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '11px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <XCircle size={13} /> CANCEL
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {isListening && (
              <div
                className="chat-bubble assistant"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  border: '1px solid #6366F1',
                }}
              >
                <div
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    backgroundColor: '#EF4444',
                    animation: 'pulse 1s infinite',
                  }}
                />
                <span style={{ fontSize: '12px', color: '#A5B4FC' }}>
                  Listening to voice input... speak your update
                </span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts Carousel */}
          <div
            style={{
              padding: '8px 18px',
              display: 'flex',
              gap: '6px',
              overflowX: 'auto',
              borderTop: '1px solid var(--border-subtle)',
              background: 'rgba(0, 0, 0, 0.2)',
            }}
          >
            <button
              onClick={askRandomQuestion}
              style={{
                background: 'rgba(99, 102, 241, 0.2)',
                border: '1px solid #6366F1',
                color: '#A5B4FC',
                padding: '4px 10px',
                borderRadius: '9999px',
                fontSize: '11px',
                fontWeight: 700,
                whiteSpace: 'nowrap',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <Lightbulb size={12} /> 🎲 Interview Me
            </button>

            <button
              onClick={() => sendChatMessage('optimize my day')}
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-secondary)',
                padding: '4px 10px',
                borderRadius: '9999px',
                fontSize: '11px',
                whiteSpace: 'nowrap',
                cursor: 'pointer',
              }}
            >
              ⚡ Optimize Day
            </button>

            <button
              onClick={() => sendChatMessage('switch to week view')}
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-secondary)',
                padding: '4px 10px',
                borderRadius: '9999px',
                fontSize: '11px',
                whiteSpace: 'nowrap',
                cursor: 'pointer',
              }}
            >
              📅 Week View
            </button>

            <button
              onClick={() => sendChatMessage('how can i hit 1 crore faster?')}
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-secondary)',
                padding: '4px 10px',
                borderRadius: '9999px',
                fontSize: '11px',
                whiteSpace: 'nowrap',
                cursor: 'pointer',
              }}
            >
              💰 1 Crore Blueprint
            </button>

            <button
              onClick={() => sendChatMessage('who am i')}
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-secondary)',
                padding: '4px 10px',
                borderRadius: '9999px',
                fontSize: '11px',
                whiteSpace: 'nowrap',
                cursor: 'pointer',
              }}
            >
              🧠 My Profile
            </button>
          </div>

          {/* Input Bar */}
          <div className="jarvis-input-bar">
            <button
              onClick={toggleVoice}
              style={{
                background: isListening ? '#EF4444' : 'var(--bg-elevated)',
                border: '1px solid var(--border-active)',
                color: isListening ? '#FFF' : 'var(--text-secondary)',
                borderRadius: '10px',
                padding: '10px',
                cursor: 'pointer',
              }}
              title={isListening ? 'Stop listening' : 'Start voice input (Speech-to-Text)'}
            >
              {isListening ? <MicOff size={18} /> : <Mic size={18} />}
            </button>

            <input
              type="text"
              className="jarvis-input"
              placeholder="Ask anything, command schedule changes, or answer questions..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
            />

            <button
              onClick={handleSend}
              style={{
                background: '#6366F1',
                border: 'none',
                color: '#FFF',
                borderRadius: '10px',
                padding: '10px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Send size={18} />
            </button>
          </div>
        </>
      )}

      {/* TAB 2: NEURAL MEMORY & PROFILE */}
      {activeTab === 'memory' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Identity Card */}
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '10px',
              padding: '14px 16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <User size={16} color="#6366F1" />
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#FFF' }}>
                {userProfile.name.toUpperCase()}
              </div>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
              Role: <strong style={{ color: '#E2E8F0' }}>{userProfile.current_role}</strong>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
              Location: <strong style={{ color: '#E2E8F0' }}>{userProfile.location}</strong>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
              Alma Mater: <strong style={{ color: '#E2E8F0' }}>{userProfile.education}</strong>
            </div>
            <div
              style={{
                background: 'rgba(99, 102, 241, 0.1)',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                padding: '8px 10px',
                borderRadius: '6px',
                fontSize: '11px',
                color: '#A5B4FC',
              }}
            >
              🎯 <strong>Vision:</strong> {userProfile.grand_vision}
            </div>
          </div>

          {/* Random Question Trigger */}
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(168, 85, 247, 0.15))',
              border: '1px solid #6366F1',
              borderRadius: '10px',
              padding: '14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            <div style={{ fontSize: '13px', fontWeight: 800, color: '#FFF', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Lightbulb size={15} color="#FBBF24" />
              <span>Calibrate Jarvis Memory</span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
              Let Jarvis ask you random questions about your schedule, distractions, and ambitions to tailor future adjustments.
            </p>
            <button
              onClick={() => {
                setActiveTab('chat');
                askRandomQuestion();
              }}
              style={{
                background: '#6366F1',
                border: 'none',
                color: '#FFF',
                fontWeight: 700,
                fontSize: '12px',
                padding: '8px 14px',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                marginTop: '4px',
              }}
            >
              🎲 Ask Me a Random Question
            </button>
          </div>

          {/* Learned Insights Section */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#FFF' }}>
                LEARNED INSIGHTS ({userProfile.learned_insights.length})
              </div>
              <button
                onClick={() => setIsAddingInsight(!isAddingInsight)}
                style={{
                  background: 'transparent',
                  border: '1px solid var(--border-subtle)',
                  color: '#A5B4FC',
                  fontSize: '11px',
                  padding: '3px 8px',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Plus size={12} /> Add Fact
              </button>
            </div>

            {isAddingInsight && (
              <div
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-active)',
                  borderRadius: '8px',
                  padding: '10px',
                  marginBottom: '10px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <select
                  value={newInsightCat}
                  onChange={(e: any) => setNewInsightCat(e.target.value)}
                  style={{
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-subtle)',
                    color: '#FFF',
                    padding: '6px',
                    borderRadius: '5px',
                    fontSize: '11px',
                  }}
                >
                  <option value="energy">Energy & Focus Peaks</option>
                  <option value="schedule">Schedule & Work Hours</option>
                  <option value="distraction">Friction & Distractions</option>
                  <option value="ambition">Ambition & 1 Crore</option>
                  <option value="health">Gym & Nutrition</option>
                  <option value="habits">Habits & Mindset</option>
                </select>
                <input
                  type="text"
                  placeholder="e.g., I focus best when phone is in airplane mode..."
                  value={newInsightText}
                  onChange={(e) => setNewInsightText(e.target.value)}
                  style={{
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-subtle)',
                    color: '#FFF',
                    padding: '6px 10px',
                    borderRadius: '5px',
                    fontSize: '12px',
                  }}
                />
                <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => setIsAddingInsight(false)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-muted)',
                      fontSize: '11px',
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddManualInsight}
                    style={{
                      background: '#10B981',
                      border: 'none',
                      color: '#000',
                      fontWeight: 700,
                      fontSize: '11px',
                      padding: '4px 10px',
                      borderRadius: '5px',
                      cursor: 'pointer',
                    }}
                  >
                    Save Memory
                  </button>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {userProfile.learned_insights.map((ins) => (
                <div
                  key={ins.id}
                  style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    padding: '10px 12px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span
                      style={{
                        fontSize: '9px',
                        textTransform: 'uppercase',
                        fontWeight: 800,
                        color: '#A5B4FC',
                        background: 'rgba(99, 102, 241, 0.15)',
                        padding: '2px 6px',
                        borderRadius: '4px',
                      }}
                    >
                      {ins.category}
                    </span>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                      {ins.learned_at}
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#E2E8F0', lineHeight: 1.4 }}>
                    {ins.insight}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SYSTEM ACTIONS */}
      {activeTab === 'actions' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 800, color: '#FFF', marginBottom: '8px' }}>
              CALENDAR VIEW CONTROLLER
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
              {[
                { label: 'Day Timeline', view: 'day' },
                { label: 'Week Calendar', view: 'week' },
                { label: 'Month Horizon', view: 'month' },
                { label: 'Life DB Studio', view: 'table' },
                { label: 'Core Life Goals', view: 'goals' },
              ].map((item) => (
                <button
                  key={item.view}
                  onClick={() => {
                    executeInteractiveAction('switch_view', { view: item.view });
                    setActiveTab('chat');
                    sendChatMessage(`Switched to ${item.label}`);
                  }}
                  style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    color: '#FFF',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '12px', fontWeight: 800, color: '#FFF', marginBottom: '8px' }}>
              FILTER BY LIFE AREA
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              <button
                onClick={() => {
                  executeInteractiveAction('filter_area', { area: 'all' });
                  setActiveTab('chat');
                  sendChatMessage('Clear filter');
                }}
                style={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-active)',
                  color: '#FFF',
                  padding: '5px 10px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                All Areas
              </button>
              {(Object.keys(LIFE_AREAS_CONFIG) as LifeAreaKey[]).map((key) => {
                const area = LIFE_AREAS_CONFIG[key];
                return (
                  <button
                    key={key}
                    onClick={() => {
                      executeInteractiveAction('filter_area', { area: key });
                      setActiveTab('chat');
                      sendChatMessage(`Filter by ${area.name}`);
                    }}
                    style={{
                      background: area.bgLight,
                      border: `1px solid ${area.color}`,
                      color: area.color,
                      padding: '5px 10px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    {area.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '12px', fontWeight: 800, color: '#FFF', marginBottom: '8px' }}>
              SYSTEM MACROS & AUDITS
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                onClick={() => {
                  setActiveTab('chat');
                  sendChatMessage('optimize my day');
                }}
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  color: '#FFF',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span>⚡ Auto-Optimize & Resolve Schedule Conflicts</span>
                <ArrowRight size={14} color="#6366F1" />
              </button>

              <button
                onClick={() => {
                  setActiveTab('chat');
                  sendChatMessage('critique my schedule and balance radar');
                }}
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  color: '#FFF',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span>📊 Brutal Schedule & Radar Audit</span>
                <ArrowRight size={14} color="#F59E0B" />
              </button>

              <button
                onClick={() => {
                  setActiveTab('chat');
                  sendChatMessage('how can i hit 1 crore faster?');
                }}
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  color: '#FFF',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span>💰 High-Leverage ₹1 Crore Wealth Strategy</span>
                <ArrowRight size={14} color="#10B981" />
              </button>

              <button
                onClick={() => {
                  setActiveTab('chat');
                  sendChatMessage('clear overdue');
                }}
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  color: '#FFF',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span>🧹 Reschedule All Overdue Sessions to Now</span>
                <ArrowRight size={14} color="#EF4444" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
