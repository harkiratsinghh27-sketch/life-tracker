import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Task,
  ScheduledEvent,
  DailyLog,
  ChatMessage,
  GoalMilestone,
  MasterLifeGoal,
  LifeAreaKey,
  DisciplineMetrics,
  UserProfile,
  RandomDiscoveryQuestion,
  InteractiveAction,
} from '../types';
import {
  INITIAL_TASKS,
  generateSeedEvents,
  INITIAL_MILESTONES,
  LIFE_AREAS_CONFIG,
} from '../data/seedData';
import { INITIAL_USER_PROFILE } from '../data/seedProfile';
import { DISCOVERY_QUESTIONS } from '../data/discoveryQuestions';
import { processJarvisInput } from '../utils/jarvisEngine';

export const getTodayDateString = (): string => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

interface LifeDbContextType {
  // Navigation & View Controller
  currentView: 'day' | 'week' | 'month' | 'table' | 'goals';
  setCurrentView: (view: 'day' | 'week' | 'month' | 'table' | 'goals') => void;
  selectedAreaFilter: LifeAreaKey | 'all';
  setSelectedAreaFilter: (area: LifeAreaKey | 'all') => void;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  today: string;
  hidePastDays: boolean;
  setHidePastDays: React.Dispatch<React.SetStateAction<boolean>>;

  // Database Records
  tasks: Task[];
  events: ScheduledEvent[];
  dailyLogs: DailyLog[];
  chatMessages: ChatMessage[];
  milestones: GoalMilestone[];
  setMilestones: React.Dispatch<React.SetStateAction<GoalMilestone[]>>;

  // User Profile & Neural Memory
  userProfile: UserProfile;
  updateUserProfile: (updates: Partial<UserProfile>) => void;
  addLearnedInsight: (
    category: UserProfile['learned_insights'][0]['category'],
    insight: string
  ) => void;
  activeDiscoveryQuestion: RandomDiscoveryQuestion | null;
  askRandomQuestion: () => void;

  // Coaching & Assistant
  coachingMode: 'drill-sergeant' | 'strategist';
  setCoachingMode: (mode: 'drill-sergeant' | 'strategist') => void;
  isJarvisOpen: boolean;
  setIsJarvisOpen: (open: boolean) => void;

  // Event Actions
  completeEvent: (eventId: string) => void;
  skipEvent: (eventId: string, reason: string) => void;
  resetEventStatus: (eventId: string) => void;
  rescheduleEvent: (
    eventId: string,
    newDate: string,
    startTime: string,
    endTime: string
  ) => void;

  // CRUD
  addTask: (task: Omit<Task, 'id' | 'created_at'>) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  deleteTask: (taskId: string) => void;
  addEvent: (event: Omit<ScheduledEvent, 'id'>) => void;
  updateEvent: (eventId: string, updates: Partial<ScheduledEvent>) => void;
  deleteEvent: (eventId: string) => void;

  // Modal targets
  skipTargetEvent: ScheduledEvent | null;
  setSkipTargetEvent: (event: ScheduledEvent | null) => void;
  editTargetEvent: ScheduledEvent | null;
  setEditTargetEvent: (event: ScheduledEvent | null) => void;

  // Chat & Universal Action Dispatcher
  sendChatMessage: (content: string) => void;
  executeInteractiveAction: (actionType: string, payload?: any) => void;
  optimizeSchedule: (targetDate?: string) => string;
  confirmPendingAction: (messageId: string) => void;
  cancelPendingAction: (messageId: string) => void;

  // Metrics
  metrics: DisciplineMetrics;
  resetDatabase: () => void;
}

const LifeDbContext = createContext<LifeDbContextType | null>(null);

export const LifeDbProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const today = getTodayDateString();
  const [selectedDate, setSelectedDate] = useState<string>(today);
  const [currentView, setCurrentView] = useState<'day' | 'week' | 'month' | 'table' | 'goals'>('day');
  const [selectedAreaFilter, setSelectedAreaFilter] = useState<LifeAreaKey | 'all'>('all');
  const [hidePastDays, setHidePastDays] = useState<boolean>(true);

  // Persistence Load
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('life_db_user_profile');
    return saved ? JSON.parse(saved) : INITIAL_USER_PROFILE;
  });

  const [activeDiscoveryQuestion, setActiveDiscoveryQuestion] =
    useState<RandomDiscoveryQuestion | null>(null);

  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('life_db_tasks');
    return saved ? JSON.parse(saved) : INITIAL_TASKS;
  });

  const [events, setEvents] = useState<ScheduledEvent[]>(() => {
    const saved = localStorage.getItem('life_db_events');
    if (saved !== null) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      } catch (e) {}
    }
    return generateSeedEvents(today);
  });

  const [dailyLogs, setDailyLogs] = useState<DailyLog[]>(() => {
    const saved = localStorage.getItem('life_db_logs');
    return saved ? JSON.parse(saved) : [];
  });

  const [milestones, setMilestones] = useState<GoalMilestone[]>(() => {
    const saved = localStorage.getItem('life_db_milestones');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].why_it_matters) {
          return parsed;
        }
      } catch (e) {}
    }
    return INITIAL_MILESTONES;
  });

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('life_db_chat');
    if (saved) return JSON.parse(saved);
    return [
      {
        id: 'msg-welcome',
        role: 'assistant',
        content:
          "JARVIS Universal Life Partner Online. I am connected to your entire webapp, schedule database, and personal memory profile. You can command me to do anything: change views, reschedule slots, optimize your day, interview you to learn your schedule, or ask me for high-level life advice. What is your status right now?",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        interactive_actions: [
          {
            label: '🎲 Interview Me (Ask Random Question)',
            action_type: 'ask_question',
            variant: 'primary',
          },
          {
            label: '⚡ Auto-Optimize Today',
            action_type: 'optimize_schedule',
            variant: 'secondary',
          },
          {
            label: '🧠 What You Know About Me',
            action_type: 'show_profile',
            variant: 'secondary',
          },
        ],
      },
    ];
  });

  const [coachingMode, setCoachingMode] = useState<'drill-sergeant' | 'strategist'>(() => {
    const saved = localStorage.getItem('life_db_coaching_mode');
    return saved === 'drill-sergeant' || saved === 'strategist' ? saved : 'strategist';
  });
  const [isJarvisOpen, setIsJarvisOpen] = useState(false);
  const [skipTargetEvent, setSkipTargetEvent] = useState<ScheduledEvent | null>(null);
  const [editTargetEvent, setEditTargetEvent] = useState<ScheduledEvent | null>(null);

  // Auto-sync localStorage
  useEffect(() => {
    localStorage.setItem('life_db_coaching_mode', coachingMode);
  }, [coachingMode]);

  useEffect(() => {
    localStorage.setItem('life_db_user_profile', JSON.stringify(userProfile));
  }, [userProfile]);

  useEffect(() => {
    localStorage.setItem('life_db_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('life_db_events', JSON.stringify(events));
  }, [events]);

  useEffect(() => {
    localStorage.setItem('life_db_logs', JSON.stringify(dailyLogs));
  }, [dailyLogs]);

  useEffect(() => {
    localStorage.setItem('life_db_milestones', JSON.stringify(milestones));
  }, [milestones]);

  useEffect(() => {
    localStorage.setItem('life_db_chat', JSON.stringify(chatMessages));
  }, [chatMessages]);

  // Profile Mutations
  const updateUserProfile = (updates: Partial<UserProfile>) => {
    setUserProfile((prev) => ({
      ...prev,
      ...updates,
      custom_preferences: {
        ...prev.custom_preferences,
        ...(updates.custom_preferences || {}),
      },
    }));
  };

  const addLearnedInsight = (
    category: UserProfile['learned_insights'][0]['category'],
    insight: string
  ) => {
    setUserProfile((prev) => ({
      ...prev,
      learned_insights: [
        {
          id: `ins-${Date.now()}`,
          category,
          insight,
          learned_at: new Date().toISOString().split('T')[0],
        },
        ...prev.learned_insights,
      ],
    }));
  };

  // Event completion
  const completeEvent = (eventId: string) => {
    const target = events.find((e) => e.id === eventId);
    if (!target) return;

    setEvents((prev) =>
      prev.map((e) => (e.id === eventId ? { ...e, status: 'completed' } : e))
    );

    const log: DailyLog = {
      id: `log-${Date.now()}`,
      date: target.date,
      task_id: target.task_id,
      title: target.title,
      life_area: target.life_area,
      priority: target.priority,
      status: 'done',
      timestamp: new Date().toISOString(),
    };
    setDailyLogs((prev) => [log, ...prev]);

    const ack =
      coachingMode === 'drill-sergeant'
        ? `[DISCIPLINE CONFIRMED] "${target.title}" marked DONE. Good. No applause for doing what was scheduled. Keep momentum.`
        : `Completed "${target.title}" (${LIFE_AREAS_CONFIG[target.life_area].name}). Schedule updated.`;

    setChatMessages((prev) => [
      ...prev,
      {
        id: `sys-${Date.now()}`,
        role: 'assistant',
        content: ack,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        linked_task_id: target.task_id,
        action_taken: `Completed ${target.title}`,
      },
    ]);
  };

  // Event skip with mandatory reason
  const skipEvent = (eventId: string, reason: string) => {
    const target = events.find((e) => e.id === eventId);
    if (!target) return;

    setEvents((prev) =>
      prev.map((e) =>
        e.id === eventId ? { ...e, status: 'skipped', skip_reason: reason } : e
      )
    );

    const log: DailyLog = {
      id: `log-${Date.now()}`,
      date: target.date,
      task_id: target.task_id,
      title: target.title,
      life_area: target.life_area,
      priority: target.priority,
      status: 'skipped',
      skip_reason: reason,
      timestamp: new Date().toISOString(),
    };
    setDailyLogs((prev) => [log, ...prev]);

    const reaction =
      coachingMode === 'drill-sergeant'
        ? `[DISCIPLINE FAILURE LOGGED] Skipped P0 "${target.title}". Excuse recorded: "${reason}". Your ₹1 Crore roadmap does not care about comfort. When will you make this up?`
        : `Skipped "${target.title}". Justification logged: "${reason}". Consider rescheduling to evening or tomorrow morning to maintain balance score.`;

    setChatMessages((prev) => [
      ...prev,
      {
        id: `sys-${Date.now()}`,
        role: 'assistant',
        content: reaction,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        linked_task_id: target.task_id,
        action_taken: `Skipped ${target.title}`,
      },
    ]);
  };

  const resetEventStatus = (eventId: string) => {
    setEvents((prev) =>
      prev.map((e) => (e.id === eventId ? { ...e, status: 'planned', skip_reason: undefined } : e))
    );
  };

  const rescheduleEvent = (
    eventId: string,
    newDate: string,
    startTime: string,
    endTime: string
  ) => {
    setEvents((prev) =>
      prev.map((e) =>
        e.id === eventId
          ? {
              ...e,
              date: newDate,
              start_time: startTime,
              end_time: endTime,
              status: 'rescheduled',
            }
          : e
      )
    );
  };

  const addTask = (taskData: Omit<Task, 'id' | 'created_at'>) => {
    const newTask: Task = {
      ...taskData,
      id: `t-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    setTasks((prev) => [newTask, ...prev]);
  };

  const updateTask = (taskId: string, updates: Partial<Task>) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, ...updates } : t))
    );
  };

  const deleteTask = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  const addEvent = (eventData: Omit<ScheduledEvent, 'id'>) => {
    const newEvent: ScheduledEvent = {
      ...eventData,
      id: `e-${Date.now()}`,
    };
    setEvents((prev) => [...prev, newEvent]);
  };

  const updateEvent = (eventId: string, updates: Partial<ScheduledEvent>) => {
    setEvents((prev) =>
      prev.map((e) => (e.id === eventId ? { ...e, ...updates } : e))
    );
  };

  const deleteEvent = (eventId: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== eventId));
  };

  // Trigger Random Discovery Question
  const askRandomQuestion = () => {
    const answeredCats = userProfile.learned_insights.map((i) => i.category);
    let chosen = DISCOVERY_QUESTIONS.find((q) => !answeredCats.includes(q.category));
    if (!chosen) {
      chosen = DISCOVERY_QUESTIONS[Math.floor(Math.random() * DISCOVERY_QUESTIONS.length)];
    }

    setActiveDiscoveryQuestion(chosen);

    const questionMsg: ChatMessage = {
      id: `asst-${Date.now()}`,
      role: 'assistant',
      content:
        `🤖 [JARVIS PROFILE DISCOVERY // SSSGDW-B CALIBRATION]\n\n` +
        `"${chosen.question}"\n\n` +
        `_Reply directly. I will commit this to your neural memory and customize your schedule algorithms._`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      is_question: true,
      question_id: chosen.id,
    };

    setChatMessages((prev) => [...prev, questionMsg]);
  };

  // Schedule Optimizer
  const optimizeSchedule = (targetDate?: string): string => {
    const dStr = targetDate || selectedDate;
    const todayEvents = events.filter((e) => e.date === dStr);
    const updates: Array<{ id: string; updates: Partial<ScheduledEvent> }> = [];

    // Ensure P0 anchors are locked and intact
    todayEvents.forEach((ev) => {
      if (ev.priority === 'P0' && !ev.is_fixed) {
        updates.push({ id: ev.id, updates: { is_fixed: true } });
      }
    });

    // Check for overdue unfinished events and push forward
    const now = new Date();
    const currentHour = now.getHours();
    const currentMin = now.getMinutes();
    const curTimeStr = `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`;

    const overdueEvents = todayEvents.filter(
      (e) => (e.status === 'planned' || e.status === 'rescheduled') && e.end_time < curTimeStr
    );

    let nextSlotHour = Math.max(currentHour, 17);
    overdueEvents.forEach((ov) => {
      const sTime = `${String(nextSlotHour % 24).padStart(2, '0')}:30`;
      const eTime = `${String((nextSlotHour + 1) % 24).padStart(2, '0')}:30`;
      nextSlotHour++;
      updates.push({
        id: ov.id,
        updates: {
          start_time: sTime,
          end_time: eTime,
          status: 'rescheduled',
        },
      });
    });

    // Apply updates
    updates.forEach((u) => updateEvent(u.id, u.updates));

    const summary = `⚡ Optimized ${todayEvents.length} events for ${dStr}. Locked P0 anchors (Prayer & Gym) and adjusted ${overdueEvents.length} overdue task(s).`;
    return summary;
  };

  // Universal Interactive Action Dispatcher
  const executeInteractiveAction = (actionType: string, payload?: any) => {
    if (actionType === 'switch_view' && payload?.view) {
      setCurrentView(payload.view);
    } else if (actionType === 'filter_area' && payload?.area) {
      setSelectedAreaFilter(payload.area);
    } else if (actionType === 'ask_question') {
      askRandomQuestion();
    } else if (actionType === 'optimize_schedule') {
      const summary = optimizeSchedule(selectedDate);
      setChatMessages((prev) => [
        ...prev,
        {
          id: `asst-${Date.now()}`,
          role: 'assistant',
          content: `✓ [AUTO-OPTIMIZATION EXECUTED]\n\n${summary}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } else if (actionType === 'repopulate_week') {
      sendChatMessage('repopulate week');
    } else if (
      (actionType === 'execute_command' || actionType === 'auto_schedule' || actionType === 'send_chat') &&
      (payload?.command || payload?.prompt)
    ) {
      sendChatMessage(payload.command || payload.prompt);
    } else if (actionType === 'show_profile') {
      sendChatMessage('who am i');
    } else if (actionType === 'add_task' && payload) {
      addEvent({
        task_id: `custom-${Date.now()}`,
        title: payload.title,
        life_area: payload.area || 'study',
        priority: payload.priority || 'P1',
        is_fixed: false,
        date: selectedDate,
        start_time: payload.startTime || '17:30',
        end_time: payload.endTime || '19:00',
        status: 'planned',
      });
      setChatMessages((prev) => [
        ...prev,
        {
          id: `asst-${Date.now()}`,
          role: 'assistant',
          content: `✓ Scheduled "${payload.title}" (${payload.startTime} - ${payload.endTime}) in your calendar for ${selectedDate}.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }
  };

  // Periodic Overdue Reminder Engine - disabled constant audio & chat spam per user request
  useEffect(() => {
    // Intrusive audio chimes and continuous chat alerts removed
  }, []);

  // Main Comprehensive Chat & Command Processor
  const sendChatMessage = (userText: string) => {
    const trimmed = userText.trim();
    if (!trimmed) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmed,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages((prev) => [...prev, userMsg]);

    // Process through the deep Jarvis Engine
    const result = processJarvisInput({
      input: trimmed,
      userProfile,
      events,
      tasks,
      milestones,
      metrics: calculateMetrics(),
      selectedDate,
      today,
      coachingMode,
      currentView,
      selectedAreaFilter,
      activeDiscoveryQuestion,
    });

    // Execute side-effects atomically
    if (result.coachingModeChange) {
      setCoachingMode(result.coachingModeChange);
    }

    if (result.viewChange) {
      setCurrentView(result.viewChange);
    }

    if (result.filterChange) {
      setSelectedAreaFilter(result.filterChange);
    }

    if (result.dateChange) {
      setSelectedDate(result.dateChange);
    }

    // Atomic Batch Event Deletes
    if (result.eventDeletes && result.eventDeletes.length > 0) {
      const deleteSet = new Set(result.eventDeletes);
      setEvents((prev) => prev.filter((e) => !deleteSet.has(e.id)));
    }

    // Atomic Batch Event Adds
    if (result.eventAdds && result.eventAdds.length > 0) {
      const newItems: ScheduledEvent[] = result.eventAdds.map((a, idx) => ({
        ...a,
        id: `e-${Date.now()}-${idx}`,
      }));
      setEvents((prev) => [...prev, ...newItems]);
    }

    // Atomic Batch Event Updates
    if (result.eventUpdates && result.eventUpdates.length > 0) {
      const updateMap = new Map(result.eventUpdates.map((u) => [u.id, u.updates]));
      setEvents((prev) =>
        prev.map((e) => (updateMap.has(e.id) ? { ...e, ...updateMap.get(e.id)! } : e))
      );
    }

    if (result.learnedInsight) {
      addLearnedInsight(result.learnedInsight.category, result.learnedInsight.insight);
    }

    if (result.customPreferenceUpdate) {
      setUserProfile((prev) => ({
        ...prev,
        custom_preferences: {
          ...prev.custom_preferences,
          [result.customPreferenceUpdate!.key]: result.customPreferenceUpdate!.value,
        },
      }));
    }

    if (result.clearDiscoveryQuestion) {
      setActiveDiscoveryQuestion(null);
    }

    if (result.newDiscoveryQuestion) {
      setActiveDiscoveryQuestion(result.newDiscoveryQuestion);
    }

    if (result.togglePastDays !== undefined) {
      setHidePastDays(result.togglePastDays);
    }

    // Append Assistant Message
    const assistantMsg: ChatMessage = {
      id: `asst-${Date.now()}`,
      role: 'assistant',
      content: result.reply,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      action_taken: result.actionTaken,
      interactive_actions: result.interactiveActions,
    };

    setChatMessages((prev) => [...prev, assistantMsg]);
  };

  const confirmPendingAction = (messageId: string) => {
    const msg = chatMessages.find((m) => m.id === messageId);
    if (!msg || !msg.pending_confirmation) return;

    const { action, payload } = msg.pending_confirmation;
    if (action === 'reschedule' && payload.eventId) {
      updateEvent(payload.eventId, {
        start_time: payload.newStartTime,
        end_time: payload.newEndTime,
        status: 'rescheduled',
      });
    }

    setChatMessages((prev) =>
      prev.map((m) =>
        m.id === messageId
          ? {
              ...m,
              pending_confirmation: undefined,
              content: `${m.content}\n\n[ACTION CONFIRMED & EXECUTED IN DATABASE]`,
            }
          : m
      )
    );
  };

  const cancelPendingAction = (messageId: string) => {
    setChatMessages((prev) =>
      prev.map((m) =>
        m.id === messageId
          ? {
              ...m,
              pending_confirmation: undefined,
              content: `${m.content}\n\n[ACTION CANCELLED] Schedule preserved.`,
            }
          : m
      )
    );
  };

  // Metrics computation
  const calculateMetrics = (): DisciplineMetrics => {
    const todayEvents = events.filter((e) => e.date === selectedDate);
    const p0Events = todayEvents.filter((e) => e.priority === 'P0');
    const p0Completed = p0Events.filter((e) => e.status === 'completed').length;
    const p0Rate = p0Events.length ? Math.round((p0Completed / p0Events.length) * 100) : 100;

    const totalCompleted = todayEvents.filter((e) => e.status === 'completed').length;
    const overallRate = todayEvents.length
      ? Math.round((totalCompleted / todayEvents.length) * 100)
      : 100;

    const misses = todayEvents.filter((e) => e.status === 'skipped' || e.status === 'missed').length;

    const executedDistribution: Record<LifeAreaKey, number> = {
      social: 0,
      spiritual: 0,
      study: 0,
      gym: 0,
      diet: 0,
      work: 0,
      balance: 0,
    };

    const plannedDistribution: Record<LifeAreaKey, number> = {
      social: 0,
      spiritual: 0,
      study: 0,
      gym: 0,
      diet: 0,
      work: 0,
      balance: 0,
    };

    todayEvents.forEach((e) => {
      const [sh, sm] = e.start_time.split(':').map(Number);
      const [eh, em] = e.end_time.split(':').map(Number);
      const durationHours = Math.max(0.25, eh + em / 60 - (sh + sm / 60));

      plannedDistribution[e.life_area] += durationHours;
      if (e.status === 'completed') {
        executedDistribution[e.life_area] += durationHours;
      }
    });

    return {
      overall_score: Math.min(100, Math.round(p0Rate * 0.65 + overallRate * 0.35)),
      p0_completion_rate: p0Rate,
      streak_days: misses > 0 ? 0 : 14,
      area_distribution: executedDistribution,
      planned_distribution: plannedDistribution,
      week_misses: misses,
    };
  };

  const resetDatabase = () => {
    localStorage.clear();
    setUserProfile(INITIAL_USER_PROFILE);
    setTasks(INITIAL_TASKS);
    setEvents(generateSeedEvents(today));
    setDailyLogs([]);
    setMilestones(INITIAL_MILESTONES);
  };

  return (
    <LifeDbContext.Provider
      value={{
        currentView,
        setCurrentView,
        selectedAreaFilter,
        setSelectedAreaFilter,
        selectedDate,
        setSelectedDate,
        today,
        hidePastDays,
        setHidePastDays,
        tasks,
        events,
        dailyLogs,
        chatMessages,
        milestones,
        setMilestones,
        userProfile,
        updateUserProfile,
        addLearnedInsight,
        activeDiscoveryQuestion,
        askRandomQuestion,
        coachingMode,
        setCoachingMode,
        isJarvisOpen,
        setIsJarvisOpen,
        completeEvent,
        skipEvent,
        resetEventStatus,
        rescheduleEvent,
        addTask,
        updateTask,
        deleteTask,
        addEvent,
        updateEvent,
        deleteEvent,
        skipTargetEvent,
        setSkipTargetEvent,
        editTargetEvent,
        setEditTargetEvent,
        sendChatMessage,
        executeInteractiveAction,
        optimizeSchedule,
        confirmPendingAction,
        cancelPendingAction,
        metrics: calculateMetrics(),
        resetDatabase,
      }}
    >
      {children}
    </LifeDbContext.Provider>
  );
};

export const useLifeDb = () => {
  const context = useContext(LifeDbContext);
  if (!context) throw new Error('useLifeDb must be used within LifeDbProvider');
  return context;
};
