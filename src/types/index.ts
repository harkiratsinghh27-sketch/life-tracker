export type LifeAreaKey = 'social' | 'spiritual' | 'study' | 'gym' | 'diet' | 'work' | 'balance';

export interface LifeArea {
  id: LifeAreaKey;
  name: string;
  letter: string;
  description: string;
  color: string;
  glow: string;
  bgLight: string;
}

export type Priority = 'P0' | 'P1' | 'P2' | 'P3';

export interface Task {
  id: string;
  title: string;
  description?: string;
  life_area: LifeAreaKey;
  priority: Priority;
  is_recurring: boolean;
  recurrence_rule?: string; // 'daily', 'weekdays', 'weekends', 'weekly'
  duration_minutes: number;
  is_fixed: boolean; // e.g. Work 9-5 or fixed prayer times
  fixed_start_time?: string; // 'HH:mm'
  fixed_end_time?: string;   // 'HH:mm'
  fixed_day_of_week?: number; // 0=Sun, 1=Mon... null for daily
  created_at: string;
}

export interface ScheduledEvent {
  id: string;
  task_id: string;
  title: string;
  life_area: LifeAreaKey;
  priority: Priority;
  is_fixed: boolean;
  date: string; // 'YYYY-MM-DD'
  start_time: string; // 'HH:mm'
  end_time: string;   // 'HH:mm'
  status: 'planned' | 'completed' | 'missed' | 'skipped' | 'rescheduled';
  skip_reason?: string;
  notes?: string;
}

export interface DailyLog {
  id: string;
  date: string; // 'YYYY-MM-DD'
  task_id: string;
  title: string;
  life_area: LifeAreaKey;
  priority: Priority;
  status: 'done' | 'skipped';
  skip_reason?: string;
  timestamp: string;
}

export interface InteractiveAction {
  label: string;
  action_type: string;
  payload?: any;
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  linked_task_id?: string;
  parsed_intent?: string;
  action_taken?: string;
  interactive_actions?: InteractiveAction[];
  is_question?: boolean;
  question_id?: string;
  pending_confirmation?: {
    action: string;
    description: string;
    payload: any;
  };
}

export interface LearnedInsight {
  id: string;
  category: 'energy' | 'schedule' | 'distraction' | 'ambition' | 'health' | 'habits';
  insight: string;
  learned_at: string;
}

export interface UserProfile {
  name: string;
  current_role: string;
  location: string;
  education: string;
  grand_vision: string;
  core_values: string[];
  learned_insights: LearnedInsight[];
  custom_preferences: {
    wake_time?: string;
    bed_time?: string;
    peak_focus_hours?: string;
    biggest_friction?: string;
    workout_style?: string;
    diet_style?: string;
    favorite_habit?: string;
    [key: string]: string | undefined;
  };
}

export interface RandomDiscoveryQuestion {
  id: string;
  category: 'energy' | 'schedule' | 'distraction' | 'ambition' | 'health' | 'habits';
  question: string;
  impact_area: LifeAreaKey;
  customization_suggestion: string;
}

export interface MasterGoalMilestone {
  id: string;
  text: string;
  completed: boolean;
}

export interface MasterLifeGoal {
  id: string;
  title: string;
  life_area: LifeAreaKey;
  why_it_matters: string; // Why inaction is fatal / stakes
  target_date: string;
  status: 'active' | 'achieved' | 'at_risk';
  progress_pct: number;
  milestones: MasterGoalMilestone[];
  stakes_penalty?: string;
}

// Alias for seamless backward compatibility
export type GoalMilestone = MasterLifeGoal;

export interface DisciplineMetrics {
  overall_score: number; // 0-100
  p0_completion_rate: number;
  streak_days: number;
  area_distribution: Record<LifeAreaKey, number>; // executed hours
  planned_distribution: Record<LifeAreaKey, number>; // planned hours
  week_misses: number;
}
