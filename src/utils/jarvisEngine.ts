import {
  ScheduledEvent,
  Task,
  MasterLifeGoal,
  UserProfile,
  DisciplineMetrics,
  LifeAreaKey,
  RandomDiscoveryQuestion,
  InteractiveAction,
} from '../types';
import { LIFE_AREAS_CONFIG, generateSeedEvents } from '../data/seedData';
import { DISCOVERY_QUESTIONS } from '../data/discoveryQuestions';

export interface JarvisEngineResult {
  reply: string;
  actionTaken?: string;
  interactiveActions?: InteractiveAction[];
  learnedInsight?: {
    category: 'energy' | 'schedule' | 'distraction' | 'ambition' | 'health' | 'habits';
    insight: string;
  };
  customPreferenceUpdate?: { key: string; value: string };
  viewChange?: 'day' | 'week' | 'month' | 'table' | 'goals';
  filterChange?: LifeAreaKey | 'all';
  dateChange?: string;
  coachingModeChange?: 'drill-sergeant' | 'strategist';
  eventUpdates?: Array<{ id: string; updates: Partial<ScheduledEvent> }>;
  eventAdds?: Array<Omit<ScheduledEvent, 'id'>>;
  eventDeletes?: string[];
  repopulateWeek?: boolean;
  milestoneUpdates?: Array<{ id: string; updates: Partial<MasterLifeGoal> }>;
  newDiscoveryQuestion?: RandomDiscoveryQuestion;
  clearDiscoveryQuestion?: boolean;
  togglePastDays?: boolean;
}

// Helper: Get array of 7 date strings (YYYY-MM-DD) for current week (Mon-Sun)
export function getWeekDates(baseDateStr: string): string[] {
  const [bYear, bMonth, bDay] = baseDateStr.split('-').map(Number);
  const baseDate = new Date(bYear, bMonth - 1, bDay);
  const dayOfWeek = baseDate.getDay(); // 0 is Sunday, 1 is Monday
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(baseDate);
  monday.setDate(baseDate.getDate() + mondayOffset);

  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dayNum = String(d.getDate()).padStart(2, '0');
    dates.push(`${y}-${m}-${dayNum}`);
  }
  return dates;
}

export const DAY_NAME_MAP: Record<string, number> = {
  monday: 0,
  mon: 0,
  tuesday: 1,
  tue: 1,
  wednesday: 2,
  wed: 2,
  thursday: 3,
  thu: 3,
  friday: 4,
  fri: 4,
  saturday: 5,
  sat: 5,
  sunday: 6,
  sun: 6,
};

// Helper: Extract 24-hour or 12-hour time from user text (including "at 6", "at 7 pm", "gym 6", etc.)
export const extractTime = (str: string): string | null => {
  // 1. HH:MM (24h or 12h)
  const match24 = str.match(/\b([01]?\d|2[0-3]):([0-5]\d)\b/);
  if (match24) return `${match24[1].padStart(2, '0')}:${match24[2]}`;

  // 2. 12-hour with explicit am/pm (e.g. "6 pm", "7am", "6:30pm")
  const matchAmPm = str.match(/\b(1[0-2]|0?[1-9])(?::([0-5]\d))?\s*(am|pm)\b/i);
  if (matchAmPm) {
    let h = parseInt(matchAmPm[1], 10);
    const m = matchAmPm[2] || '00';
    const meridian = matchAmPm[3].toLowerCase();
    if (meridian === 'pm' && h < 12) h += 12;
    if (meridian === 'am' && h === 12) h = 0;
    return `${String(h).padStart(2, '0')}:${m}`;
  }

  // 3. "at [number]" (e.g. "at 6", "at 7", "at 18")
  const matchAt = str.match(/\b(?:at|from)\s+([01]?\d|2[0-3])(?::([0-5]\d))?\s*(am|pm)?\b/i);
  if (matchAt) {
    let h = parseInt(matchAt[1], 10);
    const m = matchAt[2] || '00';
    const meridian = matchAt[3]?.toLowerCase();
    if (meridian === 'pm' && h < 12) h += 12;
    else if (meridian === 'am' && h === 12) h = 0;
    else if (!meridian) {
      if (h >= 1 && h <= 4) h += 12; // 1-4 PM
      else if (h >= 5 && h <= 11) {
        const lower = str.toLowerCase();
        if (lower.includes('morning') || lower.includes('fajr') || lower.includes('am')) {
          // AM
        } else {
          // Evening / PM
          h += 12;
        }
      }
    }
    return `${String(h).padStart(2, '0')}:${m}`;
  }

  // 4. Bare number after area keyword (e.g. "gym 6", "prayer 7")
  const matchBare = str.match(/\b(?:gym|workout|prayer|study|work|task)\s+([01]?\d|2[0-3])(?::([0-5]\d))?\s*(am|pm)?\b/i);
  if (matchBare) {
    let h = parseInt(matchBare[1], 10);
    const m = matchBare[2] || '00';
    const meridian = matchBare[3]?.toLowerCase();
    if (meridian === 'pm' && h < 12) h += 12;
    else if (meridian === 'am' && h === 12) h = 0;
    else if (!meridian) {
      if (h >= 5 && h <= 11) {
        const lower = str.toLowerCase();
        if (lower.includes('gym') || lower.includes('workout') || lower.includes('study') || lower.includes('pm')) {
          h += 12;
        }
      }
    }
    return `${String(h).padStart(2, '0')}:${m}`;
  }

  return null;
};

export interface ParsedTimeRange {
  startTime: string;
  endTime: string;
  isRange: boolean;
}

// Helper: Extract 24-hour, 12-hour or time ranges (e.g. 6-7 pm, 6-7, 6 to 7, 9-5)
export const parseTimeAndRange = (
  str: string,
  defaultDurationMin: number = 60
): ParsedTimeRange | null => {
  const lower = str.toLowerCase();

  // 1. Time range matching: e.g. "6-7 pm", "6 to 7 pm", "6:30 - 8:00 pm", "9-5", "18:00-19:00", "5:30 to 6:15 am", "6-7", "6 to 7"
  const rangeRegex =
    /\b(?:from\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\s*(?:to|-|–)\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/i;
  const matchRange = str.match(rangeRegex);

  if (matchRange) {
    let startH = parseInt(matchRange[1], 10);
    const startM = matchRange[2] || '00';
    let startMeridian = matchRange[3]?.toLowerCase();

    let endH = parseInt(matchRange[4], 10);
    const endM = matchRange[5] || '00';
    let endMeridian = matchRange[6]?.toLowerCase();

    if (!startMeridian) {
      if (endMeridian) {
        if (startH > endH && endMeridian === 'pm') {
          startMeridian = 'am';
        } else {
          startMeridian = endMeridian;
        }
      } else {
        if (startH >= 12 || endH >= 12) {
          // Already in 24h format
        } else if (startH > endH) {
          startMeridian = 'am';
          endMeridian = 'pm';
        } else if (startH >= 5 && startH <= 11) {
          if (
            lower.includes('morning') ||
            lower.includes('fajr') ||
            lower.includes('am')
          ) {
            startMeridian = 'am';
            endMeridian = 'am';
          } else {
            startMeridian = 'pm';
            endMeridian = 'pm';
          }
        }
      }
    } else if (!endMeridian) {
      endMeridian = startMeridian;
    }

    if (startMeridian === 'pm' && startH < 12) startH += 12;
    if (startMeridian === 'am' && startH === 12) startH = 0;

    if (endMeridian === 'pm' && endH < 12) endH += 12;
    if (endMeridian === 'am' && endH === 12) endH = 0;

    const startStr = `${String(startH).padStart(2, '0')}:${startM}`;
    const endStr = `${String(endH).padStart(2, '0')}:${endM}`;
    return { startTime: startStr, endTime: endStr, isRange: true };
  }

  // 2. Single time extraction
  const singleTime = extractTime(str);
  if (singleTime) {
    const [h, m] = singleTime.split(':').map(Number);
    const totalMin = h * 60 + m + defaultDurationMin;
    const endH = Math.floor(totalMin / 60) % 24;
    const endM = totalMin % 60;
    return {
      startTime: singleTime,
      endTime: `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`,
      isRange: false,
    };
  }

  // 3. "Now" / "Right now"
  if (/\b(now|right now|starting now)\b/i.test(str)) {
    const d = new Date();
    const curH = d.getHours();
    const curM = Math.floor(d.getMinutes() / 5) * 5;
    const startStr = `${String(curH).padStart(2, '0')}:${String(curM).padStart(2, '0')}`;
    const totalMin = curH * 60 + curM + defaultDurationMin;
    const endH = Math.floor(totalMin / 60) % 24;
    const endM = totalMin % 60;
    return {
      startTime: startStr,
      endTime: `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`,
      isRange: false,
    };
  }

  return null;
};

export const getCanonicalTitle = (area: LifeAreaKey): string => {
  switch (area) {
    case 'gym':
      return 'Gym & Physical Strength Training';
    case 'spiritual':
      return 'Daily Prayer & Spiritual Alignment';
    case 'study':
      return 'Deep Technical Study & High-Income Mastery';
    case 'work':
      return 'Professional Work Execution (Locked 9-5)';
    case 'diet':
      return 'Clean Nutrition & Hydration';
    case 'social':
      return 'Badminton / Friend Walk & Social Connection';
    case 'balance':
      return 'Circadian Reset & Evening Stillness';
    default:
      return 'Session';
  }
};

export const extractCleanTitle = (rawText: string, area: LifeAreaKey): string => {
  let cleaned = rawText
    .replace(
      /^(?:please\s+|pls\s+|can\s+you\s+|could\s+you\s+|i\s+want\s+(?:to\s+)?|i\s+need\s+(?:to\s+)?|make\s+room\s+for|make\s+space\s+for|make\s+time\s+for|clear\s+time\s+for|find\s+time\s+for|block\s+out\s+time\s+for|block\s+time\s+for|block\s+out|block\s+in|fit\s+in|lock\s+in|reserve\s+time\s+for|set\s+aside\s+time\s+for|put\s+in|schedule\s+in|add\s+in|plan\s+in|add|ad|schedule|create|plan|set|change|move|shift|push|make|put|keep|do)\s+/i,
      ''
    )
    .replace(/\b(now\s+i\s+do|i\s+do|i\s+want\s+to|from\s+now\s+on|starting\s+now)\b/gi, '')
    .replace(/\b(is\s+gym|isgym|is\s+prayer|isprayer|is\s+study|isstudy)\b/gi, '')
    .replace(
      /\b(every\s*day|eveyday|evryday|every\s+weekday|daily|weekly|every\s+morning|every\s+evening|all\s+week|whole\s+week|all\s+days)\b/gi,
      ''
    )
    .replace(/\b(?:mon(?:day)?\s*(?:to|-|–)\s*(?:fri(?:day)?|sat(?:urday)?|sun(?:day)?))\b/gi, '')
    .replace(
      /\b(?:except|excluding|without|save|skip|leave|no|not|off)\s+(?:for\s+|on\s+)?(?:the\s+)?(?:sunday|saturday|weekends?|mon|tue|wed|thu|fri|sat|sun)s?\b/gi,
      ''
    )
    .replace(/\b(?:from\s+)?\d{1,2}(?::\d{2})?\s*(?:am|pm)?\s*(?:to|-|–)\s*\d{1,2}(?::\d{2})?\s*(?:am|pm)?\b/gi, '')
    .replace(/\bat\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)?\b/gi, '')
    .replace(/\b\d{1,2}(?::\d{2})?\s*(?:am|pm)\b/gi, '')
    .replace(
      /\b(?:on|for)\s+(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun)\b/gi,
      ''
    )
    .replace(/\b(room\s+for|space\s+for|time\s+for|slot\s+for|block\s+for|session\s+for|except|excluding|without|on|for|at|the|a|an)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  const isGeneric =
    !cleaned ||
    /^(gym|isgym|is gym|workout|lift|lifting|training|prayer|namaz|fajr|fajr namaz|meditation|study|code|coding|reading|read|book|books|work|job|diet|food|meal|dinner|lunch|breakfast|badminton|social|balance)$/i.test(
      cleaned
    ) ||
    /^(room|space|time|slot|session|block)(\s+(for|of|to))?(\s+(gym|prayer|study|work|diet|social|balance))?$/i.test(cleaned) ||
    /^(gym|prayer|study|work|diet|social|balance)\s+(room|session|slot|time|block|except)$/i.test(cleaned);

  if (isGeneric) {
    return getCanonicalTitle(area);
  }

  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
};

export interface ResolvedTargetDates {
  targetDates: string[];
  isMultiDay: boolean;
  scopeDescription: string;
  excludedDayNames: string[];
}

export function resolveTargetDates({
  input,
  currentWeekDates,
  selectedDate,
}: {
  input: string;
  currentWeekDates: string[];
  selectedDate: string;
}): ResolvedTargetDates {
  const lower = input.toLowerCase();

  // Multi-day keywords:
  const hasMultiDayIntent =
    lower.includes('everyday') ||
    lower.includes('eveyday') ||
    lower.includes('evryday') ||
    lower.includes('every day') ||
    lower.includes('daily') ||
    lower.includes('all days') ||
    lower.includes('from now on') ||
    lower.includes('all week') ||
    lower.includes('whole week') ||
    lower.includes('entire week') ||
    lower.includes('throughout the week') ||
    lower.includes('every weekday') ||
    lower.includes('weekdays') ||
    lower.includes('mon to fri') ||
    lower.includes('mon-fri') ||
    lower.includes('mon to sat') ||
    lower.includes('mon-sat') ||
    /(?:except|excluding|without|not|no|skip|off|leave\s+out)\s+(?:for\s+|on\s+)?(?:the\s+)?(?:sun(?:day)?|sat(?:urday)?|weekends?)/i.test(lower) ||
    /\b(?:sun(?:day)?|sat(?:urday)?|weekends?)\s+(?:is|are\s+)?(?:off|free|rest\s*days?)\b/i.test(lower);

  const isExplicitToday = lower.includes('today') || lower.includes('tonight');
  const isExplicitTomorrow = lower.includes('tomorrow');

  if (!hasMultiDayIntent && (isExplicitToday || isExplicitTomorrow)) {
    let target = selectedDate;
    if (isExplicitTomorrow) {
      const d = new Date(selectedDate);
      d.setDate(d.getDate() + 1);
      target = d.toISOString().split('T')[0];
    }
    return {
      targetDates: [target],
      isMultiDay: false,
      scopeDescription: isExplicitTomorrow ? 'Tomorrow' : 'Today',
      excludedDayNames: [],
    };
  }

  // Check specific day of week if not multi-day
  if (!hasMultiDayIntent) {
    for (const [dayName, dayIndex] of Object.entries(DAY_NAME_MAP)) {
      if (lower.includes(dayName)) {
        return {
          targetDates: [currentWeekDates[dayIndex]],
          isMultiDay: false,
          scopeDescription: dayName.charAt(0).toUpperCase() + dayName.slice(1),
          excludedDayNames: [],
        };
      }
    }
  }

  // Multi-day resolution
  if (hasMultiDayIntent) {
    const excludedDayIndices: number[] = [];
    const excludedDayNames: string[] = [];

    // Sunday exclusion regex (matches "except on sunday", "except sunday", "not on sunday", "no gym on sunday", "sundays off", etc.)
    const isSundayExcluded =
      /(?:except|excluding|without|not|no|skip|off|leave\s+out|save)\s+(?:for\s+|on\s+)?(?:the\s+)?(?:all\s+)?(?:gym\s+|prayer\s+|work\s+)?sun(?:day)?s?\b/i.test(lower) ||
      /\bsun(?:day)?s?\s+(?:is\s+)?(?:off|free|rest\s*day|excluded)\b/i.test(lower) ||
      /\bmon(?:day)?\s*(?:to|-|–)\s*sat(?:urday)?\b/i.test(lower);

    if (isSundayExcluded) {
      excludedDayIndices.push(6); // Sunday
      excludedDayNames.push('Sunday');
    }

    // Saturday exclusion regex
    const isSaturdayExcluded =
      /(?:except|excluding|without|not|no|skip|off|leave\s+out|save)\s+(?:for\s+|on\s+)?(?:the\s+)?(?:all\s+)?(?:gym\s+|prayer\s+|work\s+)?sat(?:urday)?s?\b/i.test(lower) ||
      /\bsat(?:urday)?s?\s+(?:is\s+)?(?:off|free|rest\s*day|excluded)\b/i.test(lower);

    if (isSaturdayExcluded && !excludedDayIndices.includes(5)) {
      excludedDayIndices.push(5); // Saturday
      excludedDayNames.push('Saturday');
    }

    // Weekend exclusion regex
    const isWeekendExcluded =
      /(?:except|excluding|without|not|no|skip|off|leave\s+out|save)\s+(?:for\s+|on\s+)?(?:the\s+)?(?:all\s+)?weekends?\b/i.test(lower) ||
      /\bweekends?\s+(?:are|is\s+)?(?:off|free|rest\s*days?|excluded)\b/i.test(lower) ||
      /\b(?:every\s+)?weekdays?\b/i.test(lower) ||
      /\bmon(?:day)?\s*(?:to|-|–)\s*fri(?:day)?\b/i.test(lower);

    if (isWeekendExcluded) {
      if (!excludedDayIndices.includes(5)) {
        excludedDayIndices.push(5);
        excludedDayNames.push('Saturday');
      }
      if (!excludedDayIndices.includes(6)) {
        excludedDayIndices.push(6);
        excludedDayNames.push('Sunday');
      }
    }

    const targetDates = currentWeekDates.filter((_, idx) => !excludedDayIndices.includes(idx));
    const desc =
      excludedDayNames.length > 0
        ? `Mon–${excludedDayNames.includes('Sunday') && !excludedDayNames.includes('Saturday') ? 'Sat' : 'Fri'} (excluding ${excludedDayNames.join(', ')})`
        : 'Every day (Mon–Sun)';

    return {
      targetDates,
      isMultiDay: true,
      scopeDescription: `${desc} — ${targetDates.length} days`,
      excludedDayNames,
    };
  }

  // Default to today
  return {
    targetDates: [selectedDate],
    isMultiDay: false,
    scopeDescription: `Today (${selectedDate})`,
    excludedDayNames: [],
  };
}

// Helper: Find target event by text query
export const findMatchingEvent = (
  query: string,
  events: ScheduledEvent[],
  selectedDate: string
): ScheduledEvent | undefined => {
  const target = query.toLowerCase();
  // Check selected date events first
  let found = events.find((e) => {
    if (e.date !== selectedDate) return false;
    return target.includes(e.title.toLowerCase()) || target.includes(e.life_area);
  });
  if (!found) {
    // Check any date
    found = events.find(
      (e) => target.includes(e.title.toLowerCase()) || target.includes(e.life_area)
    );
  }
  return found;
};

// Helper: Detect life area from text
export const detectLifeArea = (text: string): LifeAreaKey | null => {
  const lower = text.toLowerCase();
  if (lower.includes('gym') || lower.includes('workout') || lower.includes('lift') || lower.includes('training')) return 'gym';
  if (lower.includes('spiritual') || lower.includes('prayer') || lower.includes('namaz') || lower.includes('fajr') || lower.includes('dhikr') || lower.includes('meditation')) return 'spiritual';
  if (lower.includes('study') || lower.includes('code') || lower.includes('coding') || lower.includes('reading') || lower.includes('read') || lower.includes('book') || lower.includes('books') || lower.includes('learning') || lower.includes('learn') || lower.includes('course') || lower.includes('lecture') || lower.includes('ai agent') || lower.includes('technical')) return 'study';
  if (lower.includes('work') || lower.includes('job') || lower.includes('office') || lower.includes('client') || lower.includes('meeting') || lower.includes('engineering')) return 'work';
  if (lower.includes('diet') || lower.includes('meal') || lower.includes('food') || lower.includes('breakfast') || lower.includes('lunch') || lower.includes('dinner') || lower.includes('nutrition') || lower.includes('water')) return 'diet';
  if (lower.includes('social') || lower.includes('friend') || lower.includes('badminton') || lower.includes('hike') || lower.includes('hiking') || lower.includes('walk') || lower.includes('brotherhood')) return 'social';
  if (lower.includes('balance') || lower.includes('sleep') || lower.includes('rest') || lower.includes('recovery') || lower.includes('audit')) return 'balance';
  return null;
};

export interface ScheduleFilterExceptions {
  hasException: boolean;
  rawExceptionText: string;
  preservedAreas: LifeAreaKey[];
  preservedPriorities: string[];
  preservedKeywords: string[];
}

export const extractExceptions = (input: string): ScheduleFilterExceptions => {
  const lower = input.toLowerCase();
  // Matches "except gym", "excluding prayer", "but keep work", "without p0", "leave study", "aside from gym", "other than workout", "except for prayer and gym"
  const exceptionRegex =
    /(?:except(?: for)?|excluding|but keep|keep|save|without|leave|aside from|other than)\s+([^.,;!?]+)/i;
  const match = lower.match(exceptionRegex);

  if (!match) {
    return {
      hasException: false,
      rawExceptionText: '',
      preservedAreas: [],
      preservedPriorities: [],
      preservedKeywords: [],
    };
  }

  const exceptionClause = match[1].trim();
  const preservedAreas: LifeAreaKey[] = [];
  const preservedPriorities: string[] = [];
  const preservedKeywords: string[] = [];

  // Priorities
  if (exceptionClause.includes('p0') || exceptionClause.includes('non negotiable') || exceptionClause.includes('non-negotiable')) {
    preservedPriorities.push('P0');
  }
  if (exceptionClause.includes('p1')) {
    preservedPriorities.push('P1');
  }

  // Life Areas mapping
  const areaKeywords: Record<LifeAreaKey, string[]> = {
    gym: ['gym', 'workout', 'fitness', 'strength', 'training', 'exercise', 'deadlift', 'squat', 'bench', 'lift', 'lifting'],
    spiritual: ['spiritual', 'prayer', 'namaz', 'meditation', 'spirituality', 'nitnem', 'ardaas', 'stillness', 'fajr'],
    study: ['study', 'dsa', 'system design', 'interview', 'leetcode', 'learning', 'durham', 'reading', 'ai study', 'tech'],
    work: ['work', 'deep work', 'code', 'coding', 'datapilot', 'saas', 'client', 'engineering', '9-5', 'office', 'job'],
    diet: ['diet', 'meal', 'food', 'nutrition', 'breakfast', 'lunch', 'dinner', 'protein', 'macro'],
    social: ['social', 'family', 'friends', 'brotherhood', 'badminton', 'hike'],
    balance: ['balance', 'sleep', 'rest', 'evening unwind', 'digital sunset', 'recovery', 'bed'],
  };

  for (const [area, keywords] of Object.entries(areaKeywords) as [LifeAreaKey, string[]][]) {
    if (keywords.some((kw) => exceptionClause.includes(kw))) {
      preservedAreas.push(area);
    }
  }

  // Custom keywords from tokens
  const tokens = exceptionClause.split(/\s+(?:and|or|,|\+)\s+|\s+/).map((t) => t.trim()).filter((t) => t.length > 2);
  for (const token of tokens) {
    if (!['and', 'the', 'for', 'all', 'any', 'my', 'slots', 'events', 'sessions', 'schedule'].includes(token)) {
      preservedKeywords.push(token);
    }
  }

  return {
    hasException: preservedAreas.length > 0 || preservedPriorities.length > 0 || preservedKeywords.length > 0,
    rawExceptionText: exceptionClause,
    preservedAreas,
    preservedPriorities,
    preservedKeywords,
  };
};

export const shouldPreserveEvent = (
  event: ScheduledEvent,
  exceptions: ScheduleFilterExceptions
): boolean => {
  if (!exceptions.hasException) return false;

  // 1. Preserved life area match
  if (exceptions.preservedAreas.includes(event.life_area)) {
    return true;
  }

  // 2. Preserved priority match (e.g. P0)
  if (exceptions.preservedPriorities.includes(event.priority)) {
    return true;
  }

  // 3. Keyword in title match
  const titleLower = event.title.toLowerCase();
  for (const kw of exceptions.preservedKeywords) {
    if (titleLower.includes(kw)) {
      return true;
    }
  }

  return false;
};

// Helper to calculate total hours and minutes from events
export function calculateAreaHours(
  evs: ScheduledEvent[],
  area?: LifeAreaKey
): { totalHours: number; totalMinutes: number; count: number; completedCount: number; completedHours: number } {
  const filtered = area ? evs.filter((e) => e.life_area === area) : evs;
  let totalMin = 0;
  let completedMin = 0;
  let completedCount = 0;

  for (const ev of filtered) {
    const [sh, sm] = ev.start_time.split(':').map(Number);
    const [eh, em] = ev.end_time.split(':').map(Number);
    let dur = eh * 60 + em - (sh * 60 + sm);
    if (dur <= 0) dur += 24 * 60;
    totalMin += dur;
    if (ev.status === 'completed') {
      completedMin += dur;
      completedCount++;
    }
  }

  return {
    totalHours: Number((totalMin / 60).toFixed(1)),
    totalMinutes: totalMin,
    count: filtered.length,
    completedCount,
    completedHours: Number((completedMin / 60).toFixed(1)),
  };
}

export function generateDynamicJarvisResponse({
  input,
  userProfile,
  events,
  tasks,
  milestones,
  metrics,
  selectedDate,
  today,
  coachingMode,
  currentView,
  selectedAreaFilter,
}: {
  input: string;
  userProfile: UserProfile;
  events: ScheduledEvent[];
  tasks: Task[];
  milestones: MasterLifeGoal[];
  metrics: DisciplineMetrics;
  selectedDate: string;
  today: string;
  coachingMode: 'drill-sergeant' | 'strategist';
  currentView: 'day' | 'week' | 'month' | 'table' | 'goals';
  selectedAreaFilter: LifeAreaKey | 'all';
}): JarvisEngineResult {
  const trimmed = input.trim();
  const lower = trimmed.toLowerCase();
  const currentWeekDates = getWeekDates(selectedDate);
  const now = new Date();
  const curTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const todayEvents = events.filter((e) => e.date === today);

  // --------------------------------------------------------------------------
  // BRANCH 1: REAL-TIME WHAT'S NEXT / CURRENT TASK STATUS
  // --------------------------------------------------------------------------
  const isTimeQuery =
    lower.includes('what should i do') ||
    lower.includes('what to do') ||
    lower.includes("what's next") ||
    lower.includes('what is next') ||
    lower.includes('what next') ||
    lower.includes('current task') ||
    lower.includes('right now') ||
    lower.includes('what am i doing') ||
    lower.includes('what do i do') ||
    lower.includes('next task');

  if (isTimeQuery) {
    const activeEvent = todayEvents.find(
      (e) => e.start_time <= curTimeStr && e.end_time >= curTimeStr
    );
    const upcoming = todayEvents
      .filter((e) => e.start_time > curTimeStr)
      .sort((a, b) => a.start_time.localeCompare(b.start_time))[0];
    const overdue = todayEvents.filter(
      (e) => (e.status === 'planned' || e.status === 'rescheduled') && e.end_time < curTimeStr
    );

    if (activeEvent) {
      const areaName = LIFE_AREAS_CONFIG[activeEvent.life_area]?.name || activeEvent.life_area;
      const advice =
        activeEvent.life_area === 'gym'
          ? 'Lock in your progressive overload. Keep rest intervals disciplined and maintain high biomechanical tension on every rep.'
          : activeEvent.life_area === 'spiritual'
          ? 'Protect this window of mental stillness. Zero phone screen, zero digital distractions.'
          : activeEvent.life_area === 'work'
          ? 'Execute your primary engineering deliverables with zero context switching so your evening study block stays protected.'
          : activeEvent.life_area === 'study'
          ? 'Deep Technical AI sprint. Focus on autonomous agent loops, tool calling protocols, or productizing your SaaS.'
          : 'Maintain laser focus through the remainder of this block.';

      const reply =
        `📍 **CURRENT SCHEDULED TARGET (${curTimeStr}):**\n\n` +
        `You are active in **"${activeEvent.title}"** (${activeEvent.start_time} - ${activeEvent.end_time})\n` +
        `• Area: **${areaName}** | Priority: **${activeEvent.priority}**\n\n` +
        `💡 **Coaching Directive:**\n${advice}\n\n` +
        (upcoming
          ? `⏭️ **Up Next:** "${upcoming.title}" at ${upcoming.start_time} (${upcoming.start_time} - ${upcoming.end_time})\n`
          : `🏁 **Day Horizon:** No further scheduled sessions for today.\n`) +
        (overdue.length > 0
          ? `⚠️ **Overdue:** ${overdue.length} pending slot(s) need attention (${overdue.map((o) => o.title).join(', ')}).`
          : `✓ All preceding schedule blocks are completed or clear.`);

      return {
        reply,
        actionTaken: `Queried real-time status: Active on ${activeEvent.title}`,
        interactiveActions: [
          {
            label: `✓ Mark "${activeEvent.title}" Complete`,
            action_type: 'execute_command',
            payload: { command: `done with ${activeEvent.title}` },
            variant: 'primary',
          },
          {
            label: `⚡ Auto-Optimize Remaining Day`,
            action_type: 'optimize_schedule',
            variant: 'secondary',
          },
          {
            label: `📅 View Day Timeline`,
            action_type: 'switch_view',
            payload: { view: 'day' },
            variant: 'secondary',
          },
        ],
      };
    }

    // Between slots or day completed
    const reply =
      `📍 **CURRENT CLOCK: ${curTimeStr}**\n\n` +
      (upcoming
        ? `You are currently in an open transition interval.\n\n` +
          `⏭️ **Next Scheduled Session:**\n` +
          `• **"${upcoming.title}"** (${upcoming.start_time} - ${upcoming.end_time})\n` +
          `• Area: **${LIFE_AREAS_CONFIG[upcoming.life_area]?.name}** [${upcoming.priority}]\n\n` +
          `Prepare your workspace and eliminate digital friction before the block starts.`
        : `All scheduled sessions for today are executed or clear. Your SSSGDW-B foundation is protected.`) +
      (overdue.length > 0
        ? `\n\n⚠️ **ATTENTION NEEDED:** You have ${overdue.length} unfinished slot(s): ${overdue.map((o) => o.title).join(', ')}. Click below to push them forward.`
        : '');

    return {
      reply,
      actionTaken: 'Queried current time and upcoming tasks',
      interactiveActions: [
        {
          label: `⚡ Auto-Optimize Remaining Day`,
          action_type: 'optimize_schedule',
          variant: 'primary',
        },
        {
          label: `📅 Switch to Day Timeline`,
          action_type: 'switch_view',
          payload: { view: 'day' },
          variant: 'secondary',
        },
        {
          label: `🎲 Ask Me a Discovery Question`,
          action_type: 'ask_question',
          variant: 'secondary',
        },
      ],
    };
  }

  // --------------------------------------------------------------------------
  // BRANCH 2: QUANTITATIVE SCHEDULE & HOURS QUERIES
  // --------------------------------------------------------------------------
  const isHoursQuery =
    lower.includes('how many hour') ||
    lower.includes('how much hour') ||
    lower.includes('how much time') ||
    lower.includes('hours of') ||
    lower.includes('total hours') ||
    lower.includes('hours this week') ||
    lower.includes('schedule breakdown') ||
    lower.includes('hours scheduled');

  if (isHoursQuery) {
    const area = detectLifeArea(lower);
    const weekEvents = events.filter((e) => currentWeekDates.includes(e.date));

    if (area) {
      const stats = calculateAreaHours(weekEvents, area);
      const todayStats = calculateAreaHours(todayEvents, area);
      const areaConfig = LIFE_AREAS_CONFIG[area];

      const reply =
        `📊 **[${areaConfig.name.toUpperCase()} HOURS AUDIT]**\n\n` +
        `• **Weekly Total Scheduled:** ${stats.totalHours} hrs across ${stats.count} session(s) (${currentWeekDates[0]} to ${currentWeekDates[6]})\n` +
        `• **Completed This Week:** ${stats.completedHours} hrs (${stats.completedCount} sessions)\n` +
        `• **Remaining This Week:** ${(stats.totalHours - stats.completedHours).toFixed(1)} hrs\n` +
        `• **Today's Commitment:** ${todayStats.totalHours} hrs scheduled (${todayStats.completedHours} hrs completed)\n` +
        `• **Daily Average Target:** ${(stats.totalHours / 7).toFixed(1)} hrs/day\n\n` +
        `💡 ${areaConfig.description}`;

      return {
        reply,
        actionTaken: `Calculated weekly hours for ${areaConfig.name}`,
        interactiveActions: [
          {
            label: `📅 Filter [${areaConfig.name}] on Week Calendar`,
            action_type: 'filter_area',
            payload: { area },
            variant: 'primary',
          },
          {
            label: `⚡ Repopulate Standard SSSGDW-B Week Routine`,
            action_type: 'repopulate_week',
            variant: 'secondary',
          },
        ],
      };
    }

    // All areas breakdown
    const allAreas: LifeAreaKey[] = ['spiritual', 'gym', 'work', 'study', 'diet', 'social', 'balance'];
    const lines = allAreas.map((a) => {
      const s = calculateAreaHours(weekEvents, a);
      return `• **${LIFE_AREAS_CONFIG[a].name}**: ${s.totalHours} hrs (${s.count} sessions, ${s.completedHours} hrs completed)`;
    });

    const totalAll = calculateAreaHours(weekEvents);

    const reply =
      `📊 **[WEEKLY SCHEDULE HOURS BREAKDOWN]**\n` +
      `Week Horizon: ${currentWeekDates[0]} to ${currentWeekDates[6]}\n` +
      `Total Scheduled: **${totalAll.totalHours} hrs** across **${totalAll.count} sessions**\n\n` +
      lines.join('\n') +
      `\n\n` +
      `• **Overall Discipline Execution:** ${metrics.overall_score}% index | P0 Non-negotiables: ${metrics.p0_completion_rate}%`;

    return {
      reply,
      actionTaken: 'Calculated comprehensive weekly hours breakdown',
      interactiveActions: [
        {
          label: `📅 View Week Calendar`,
          action_type: 'switch_view',
          payload: { view: 'week' },
          variant: 'primary',
        },
        {
          label: `📊 Review Balance Radar`,
          action_type: 'switch_view',
          payload: { view: 'day' },
          variant: 'secondary',
        },
      ],
    };
  }

  // --------------------------------------------------------------------------
  // BRANCH 3: FITNESS, LIFTS, NUTRITION & BODY COMPOSITION
  // --------------------------------------------------------------------------
  const isFitnessQuery =
    lower.includes('deadlift') ||
    lower.includes('bench') ||
    lower.includes('squat') ||
    lower.includes('workout') ||
    lower.includes('lift') ||
    lower.includes('muscle') ||
    lower.includes('creatine') ||
    lower.includes('protein') ||
    lower.includes('body fat') ||
    lower.includes('bodyfat') ||
    lower.includes('cut') ||
    lower.includes('bulk') ||
    lower.includes('hypertrophy');

  if (isFitnessQuery) {
    let specificGuide = '';
    if (lower.includes('deadlift') || lower.includes('140')) {
      specificGuide =
        `🏋️ **ROADMAP TO 140KG DEADLIFT (Harkirat's P0 Strength Milestone):**\n\n` +
        `1. **The Wedge & Slack Pull:** Do not jerk the bar off the floor. Stand with shins 1 inch from bar. Hinge, grab, pull all slack out of the barbell with your lats ("protect your armpits"), then wedge your hips down and forward into the bar.\n` +
        `2. **Intra-Abdominal Pressure (Valsalva):** Big 360-degree belly breath into your lifting belt, flex your core like preparing for a punch. This locks the lumbar spine completely rigid.\n` +
        `3. **Push the Floor Away:** Think of the first 4 inches as a leg press pushing the earth away, rather than a pull with your lower back.\n` +
        `4. **Programming & Microloading:** 1 heavy session per week: 3 sets of 3-5 reps at 82.5–87.5% 1RM. Add 2.5kg microplates every 10-14 days. Deload every 5th week.`;
    } else if (lower.includes('bench')) {
      specificGuide =
        `🏋️ **BENCH PRESS MECHANICS & CHEST HYPERTROPHY:**\n\n` +
        `1. **Scapular Retraction & Depression:** Pin your shoulder blades together and down into the bench before un-racking. This creates a solid shelf and protects the anterior deltoids.\n` +
        `2. **Leg Drive:** Drive through your heels into the ground to transfer kinetic energy through your glutes and core.\n` +
        `3. **Bar Path:** Lower diagonally to the lower sternum/nipple line, press back up in a slight J-curve over the shoulders. Keep wrists stacked straight over elbows.`;
    } else if (lower.includes('protein') || lower.includes('diet') || lower.includes('cut') || lower.includes('fat')) {
      specificGuide =
        `🥩 **NUTRITION PROTOCOL FOR SUB-12% BODY FAT & LEAN RETENTION:**\n\n` +
        `1. **Protein Target:** 1.8g per kg bodyweight (~140g–150g daily for your frame). Split across 3–4 meals containing at least 3g leucine per feeding to trigger muscle protein synthesis.\n` +
        `2. **Caloric Deficit:** Maintain a conservative 350–450 kcal deficit below maintenance. Aggressive cuts cause muscle catabolism and tank training intensity.\n` +
        `3. **Daily Non-Exercise Steps:** 10,000 steps daily (N.E.A.T.) burns fat without neurological fatigue or cortisol elevation.`;
    } else {
      specificGuide =
        `🏋️ **SSSGDW-B COMPOUND STRENGTH BLUEPRINT:**\n\n` +
        `• **Push/Pull/Legs Architecture:** Compound barbell movements (Deadlift, Squat, Bench, Overhead Press, Weighted Pull-ups) form the foundation.\n` +
        `• **RPE & Intensity:** Keep working sets between RPE 7.5 and 9. Leave 1-2 clean reps in reserve on compound lifts to avoid central nervous system burnout.\n` +
        `• **Hydration & Creatine:** 5g creatine monohydrate daily with 3.5 liters of clean water. Creatine increases phosphocreatine stores for maximal ATP replenishment during heavy lifts.`;
    }

    return {
      reply: specificGuide,
      actionTaken: 'Provided biomechanical strength and nutrition advisory',
      interactiveActions: [
        {
          label: `🏋️ Schedule Morning Heavy Gym at 06:30`,
          action_type: 'execute_command',
          payload: { command: 'schedule gym 06:30 to 08:00 daily' },
          variant: 'primary',
        },
        {
          label: `🎯 View Master Goals Detail`,
          action_type: 'switch_view',
          payload: { view: 'goals' },
          variant: 'secondary',
        },
      ],
    };
  }

  // --------------------------------------------------------------------------
  // BRANCH 4: AI ENGINEERING, AUTONOMOUS AGENTS & TECH CRAFTSMANSHIP
  // --------------------------------------------------------------------------
  const isAiQuery =
    lower.includes('ai agent') ||
    lower.includes('agentic') ||
    lower.includes('langchain') ||
    lower.includes('mcp') ||
    lower.includes('model context') ||
    lower.includes('rag') ||
    lower.includes('system design') ||
    lower.includes('interview') ||
    lower.includes('ai engineer') ||
    lower.includes('tech stack') ||
    lower.includes('datapilot') ||
    lower.includes('software engineer');

  if (isAiQuery) {
    const reply =
      `🤖 **[ELITE AI ENGINEERING & AGENTIC ARCHITECTURES]**\n\n` +
      `Harkirat, to establish yourself as a global Top 1% AI Software Engineer (transitioning from Durham College into senior enterprise impact):\n\n` +
      `1. **Master Closed-Loop Agent Patterns Over Toy Frameworks:**\n` +
      `   • Do not rely on brittle high-level abstractions. Understand raw multi-turn tool calling, JSON schema enforcement, and self-healing validation loops.\n` +
      `   • Build deterministic state machines (Plan -> Execute -> Observe -> Verify -> Finalize) with explicit human-in-the-loop escapes.\n\n` +
      `2. **Model Context Protocol (MCP) Mastery:**\n` +
      `   • MCP is the emerging enterprise standard for connecting LLMs to databases, internal APIs, and development environments.\n` +
      `   • Building high-throughput, memory-safe MCP servers in Python and TypeScript sets you apart from 99% of prompt wrappers.\n\n` +
      `3. **High-Value Productization (DataPilot AI & Smart Invoice AI):**\n` +
      `   • DataPilot AI: Position it as an enterprise CSV intelligence engine for business analytics teams.\n` +
      `   • Package these into micro-SaaS subscriptions or proprietary tools for local business clients.\n\n` +
      `Would you like to lock a 90-minute evening "Deep AI Mastery" block into your calendar today?`;

    return {
      reply,
      actionTaken: 'Delivered AI Engineering architecture guidance',
      interactiveActions: [
        {
          label: `💻 Schedule 90-Min Deep Study at 17:30`,
          action_type: 'add_task',
          payload: {
            title: 'Deep AI Architecture & Agent Loop Sprint',
            area: 'study',
            startTime: '17:30',
            endTime: '19:00',
            priority: 'P1',
          },
          variant: 'primary',
        },
        {
          label: `🎯 Open Core Goals & Milestones`,
          action_type: 'switch_view',
          payload: { view: 'goals' },
          variant: 'secondary',
        },
      ],
    };
  }

  // --------------------------------------------------------------------------
  // BRANCH 5: USER PROFILE, IDENTITY & PERSONAL BACKGROUND
  // --------------------------------------------------------------------------
  const isProfileQuery =
    lower.includes('who am i') ||
    lower.includes('who are you') ||
    lower.includes('what do you know about me') ||
    lower.includes('my profile') ||
    lower.includes('about me') ||
    lower.includes('my background') ||
    lower.includes('my college') ||
    lower.includes('my university') ||
    lower.includes('my goals') ||
    lower.includes('my net worth');

  if (isProfileQuery) {
    const insights = userProfile.learned_insights;
    const reply =
      `🧠 **[HARKIRAT SINGH // NEURAL PROFILE & MEMORY AUDIT]**\n\n` +
      `I am JARVIS, your autonomous Life Operating System and Chief-of-Staff with direct read/write access to your Life DB.\n\n` +
      `**Your Profile Dossier:**\n` +
      `• **Name:** Harkirat Singh\n` +
      `• **Location:** Delhi NCR (Global execution mindset)\n` +
      `• **Education:** Durham College (Computer Programming, graduating 2025)\n` +
      `• **Career Focus:** Senior AI Software Engineer & Autonomous Systems Architect\n` +
      `• **North Star Wealth Goal:** ₹1 Crore Net Worth Milestone (Target: Dec 2026)\n` +
      `• **Physical Anchors:** 140kg Deadlift, Sub-12% Body Fat, Morning 06:30 Gym\n` +
      `• **Spiritual Anchor:** 05:30 Fajr prayer & contemplation (Locked P0)\n` +
      `• **Framework:** SSSGDW-B (Spiritual, Strength, Study, Grind, Diet, Wellness, Brotherhood)\n\n` +
      `**Current System Metrics:**\n` +
      `• Overall Discipline Score: **${metrics.overall_score}%**\n` +
      `• P0 Non-Negotiable Completion: **${metrics.p0_completion_rate}%**\n` +
      `• Neural Memories Committed: **${insights.length}** insights\n\n` +
      `I calibrate your daily routine, protect your non-negotiables, and execute direct database mutations across your schedule on demand.`;

    return {
      reply,
      actionTaken: 'Displayed comprehensive user memory profile',
      interactiveActions: [
        {
          label: `🎲 Ask Me a Discovery Question`,
          action_type: 'ask_question',
          variant: 'primary',
        },
        {
          label: `⚡ Auto-Optimize Day Around Profile`,
          action_type: 'optimize_schedule',
          variant: 'secondary',
        },
        {
          label: `🎯 View Master Goals Detail`,
          action_type: 'switch_view',
          payload: { view: 'goals' },
          variant: 'secondary',
        },
      ],
    };
  }

  // --------------------------------------------------------------------------
  // BRANCH 6: WEB APP ASSISTANT CAPABILITY DISCOVERY ("What can you do?", "Help")
  // --------------------------------------------------------------------------
  const isHelpQuery =
    lower === 'help' ||
    lower.includes('what can you do') ||
    lower.includes('capabilities') ||
    lower.includes('how to use') ||
    lower.includes('commands');

  if (isHelpQuery) {
    const reply =
      `⚡ **[JARVIS COMMAND & CONTROL CAPABILITIES]**\n\n` +
      `You can speak or type to me naturally. Here is what I execute across your Life DB in real time:\n\n` +
      `1. **Intelligent Schedule Mutations (With Exception Handling!):**\n` +
      `   • \`"Remove all week schedule except gym"\` -> Wipes non-gym sessions, preserves gym!\n` +
      `   • \`"Clear today except prayer"\` -> Preserves spiritual P0 anchors.\n` +
      `   • \`"Schedule gym 6-7 pm daily"\` -> Locks recurring weekday/daily routine.\n` +
      `   • \`"Move study to 8pm"\` or \`"Shift all tasks by 2 hours"\`\n` +
      `   • \`"Repopulate week"\` -> Restores the standard 43-session SSSGDW-B protocol.\n\n` +
      `2. **Real-Time Queries & Audits:**\n` +
      `   • \`"What should I do right now?"\` -> Real-time clock inspection & directive.\n` +
      `   • \`"How many hours of gym this week?"\` -> Exact quantitative audit.\n` +
      `   • \`"Critique my schedule"\` -> Brutal radar gap analysis.\n\n` +
      `3. **Autonomous Learning & Guidance:**\n` +
      `   • \`"Ask me a question"\` -> Calibrate your peak energy hours, sleep, and habits.\n` +
      `   • Ask about workouts, deadlifts, AI engineering, or ₹1 Crore roadmap strategy.`;

    return {
      reply,
      actionTaken: 'Listed assistant capabilities and commands',
      interactiveActions: [
        {
          label: `⚡ Repopulate Standard SSSGDW-B Week Routine`,
          action_type: 'repopulate_week',
          variant: 'primary',
        },
        {
          label: `🎲 Ask Me a Discovery Question`,
          action_type: 'ask_question',
          variant: 'secondary',
        },
        {
          label: `📅 Switch to Week Calendar`,
          action_type: 'switch_view',
          payload: { view: 'week' },
          variant: 'secondary',
        },
      ],
    };
  }

  // --------------------------------------------------------------------------
  // BRANCH 7: DYNAMIC CONTEXTUAL REASONING (Never Static!)
  // --------------------------------------------------------------------------
  const currentStatusSummary =
    todayEvents.length > 0
      ? `You currently have ${todayEvents.length} sessions logged for today (${today}), with your discipline score tracking at ${metrics.overall_score}%.`
      : `Your schedule for today (${today}) currently has zero sessions.`;

  const reply =
    coachingMode === 'drill-sergeant'
      ? `Understood, Harkirat. Regarding "${trimmed}":\n\n` +
        `Every question must translate into disciplined execution. ${currentStatusSummary}\n\n` +
        `If you need schedule updates, tell me directly:\n` +
        `• e.g. "Remove all week schedule except gym", "Repopulate week", or "Optimize my day".\n` +
        `If you want strategic advice on workouts, AI engineering, or hitting ₹1 Crore, ask me specifically.`
      : `I hear you, Harkirat. Regarding your inquiry on "${trimmed}":\n\n` +
        `${currentStatusSummary}\n\n` +
        `As your Chief-of-Staff, I have full read/write authority across your Life DB. I can instantly modify your calendar (with exceptions like "except gym"), answer quantitative hours queries, optimize your day, or advise you on your AI engineering career and physical training.\n\n` +
        `What would you like to execute next?`;

  return {
    reply,
    actionTaken: `Processed contextual inquiry: "${trimmed}"`,
    interactiveActions: [
      {
        label: `⚡ Auto-Optimize Day`,
        action_type: 'optimize_schedule',
        variant: 'primary',
      },
      {
        label: `📅 View Week Calendar`,
        action_type: 'switch_view',
        payload: { view: 'week' },
        variant: 'secondary',
      },
      {
        label: `🎲 Ask Me a Discovery Question`,
        action_type: 'ask_question',
        variant: 'secondary',
      },
    ],
  };
}

export function processJarvisInput({
  input,
  userProfile,
  events,
  tasks,
  milestones,
  metrics,
  selectedDate,
  today,
  coachingMode,
  currentView,
  selectedAreaFilter,
  activeDiscoveryQuestion,
}: {
  input: string;
  userProfile: UserProfile;
  events: ScheduledEvent[];
  tasks: Task[];
  milestones: MasterLifeGoal[];
  metrics: DisciplineMetrics;
  selectedDate: string;
  today: string;
  coachingMode: 'drill-sergeant' | 'strategist';
  currentView: 'day' | 'week' | 'month' | 'table' | 'goals';
  selectedAreaFilter: LifeAreaKey | 'all';
  activeDiscoveryQuestion: RandomDiscoveryQuestion | null;
}): JarvisEngineResult {
  const trimmed = input.trim();
  const lower = trimmed.toLowerCase();
  const currentWeekDates = getWeekDates(selectedDate);

  // --------------------------------------------------------------------------
  // 1. ACTIVE DISCOVERY QUESTION RESPONSE
  // --------------------------------------------------------------------------
  if (activeDiscoveryQuestion) {
    const question = activeDiscoveryQuestion;
    const learnedText = trimmed;

    const prefUpdate: { key: string; value: string } = {
      key: question.category,
      value: learnedText,
    };

    if (question.category === 'energy' && extractTime(trimmed)) {
      prefUpdate.key = 'peak_focus_hours';
      prefUpdate.value = trimmed;
    } else if (question.category === 'schedule' && lower.includes('bed')) {
      prefUpdate.key = 'bed_time';
      prefUpdate.value = extractTime(trimmed) || trimmed;
    }

    const reply =
      `🧠 [NEURAL MEMORY UPDATED]\n\n` +
      `Understood, Harkirat. I have committed this to your persistent Life DB profile:\n` +
      `• Category: ${question.category.toUpperCase()}\n` +
      `• Insight: "${learnedText}"\n\n` +
      `💡 Customization Action Applied:\n` +
      `${question.customization_suggestion}\n\n` +
      `Your schedule algorithms and advisory models are now updated.`;

    const interactiveActions: InteractiveAction[] = [
      {
        label: `⚡ Auto-Optimize Schedule Around This`,
        action_type: 'optimize_schedule',
        variant: 'primary',
      },
      {
        label: `🔍 View Updated Memory Profile`,
        action_type: 'show_profile',
        variant: 'secondary',
      },
      {
        label: `🎲 Ask Another Question`,
        action_type: 'ask_question',
        variant: 'secondary',
      },
    ];

    return {
      reply,
      actionTaken: `Learned: ${question.category} -> ${learnedText}`,
      learnedInsight: {
        category: question.category,
        insight: learnedText,
      },
      customPreferenceUpdate: prefUpdate,
      clearDiscoveryQuestion: true,
      interactiveActions,
    };
  }

  // --------------------------------------------------------------------------
  // 1.9 AREA-SPECIFIC DAY DELETION / DAY OFF
  // ("i want no gym on sun", "no gym on sunday", "remove gym on sunday", "gym off on sunday", "no prayer on monday")
  // --------------------------------------------------------------------------
  const targetAreaForRemoval = detectLifeArea(lower);
  const matchedDayEntry = Object.entries(DAY_NAME_MAP).find(([dayName]) =>
    new RegExp(`\\b${dayName}s?\\b`, 'i').test(lower)
  );

  const isExplicitDayOffCommand =
    targetAreaForRemoval !== null &&
    matchedDayEntry !== undefined &&
    (/\b(no|don't|dont|remove|delete|cancel|clear|skip|drop|off|leave\s+out|free|without)\b/i.test(lower) ||
      lower.startsWith('i want no ') ||
      lower.startsWith('no ') ||
      lower.includes('off on'));

  if (isExplicitDayOffCommand) {
    const [dayName, dayIndex] = matchedDayEntry;
    const targetDate = currentWeekDates[dayIndex];
    const capDay = dayName.charAt(0).toUpperCase() + dayName.slice(1);
    const areaName = LIFE_AREAS_CONFIG[targetAreaForRemoval].name;

    const matchingEvents = events.filter(
      (e) =>
        e.date === targetDate &&
        (e.life_area === targetAreaForRemoval ||
          e.title.toLowerCase().includes(targetAreaForRemoval) ||
          (targetAreaForRemoval === 'gym' && (e.title.toLowerCase().includes('gym') || e.life_area === 'gym')))
    );

    const deleteIds = matchingEvents.map((e) => e.id);

    return {
      reply: `✓ [SCHEDULE CALIBRATED] Removed ${areaName} from ${capDay} (${targetDate}). ${capDay} is strictly designated as a Rest & Recovery Day.${
        deleteIds.length > 0 ? ` Purged ${deleteIds.length} existing scheduled block(s).` : ' Zero sessions present.'
      }`,
      actionTaken: `Removed ${areaName} on ${capDay}`,
      eventDeletes: deleteIds,
      viewChange: 'week',
      interactiveActions: [
        {
          label: '📅 View Week Calendar',
          action_type: 'switch_view',
          payload: { view: 'week' },
          variant: 'primary',
        },
        {
          label: `🔁 Re-schedule ${areaName} on ${capDay}`,
          action_type: 'execute_command',
          payload: { command: `add ${targetAreaForRemoval} on ${dayName} at 18:00` },
          variant: 'secondary',
        },
      ],
    };
  }

  // --------------------------------------------------------------------------
  // 2. BATCH DELETION & SCHEDULE WIPING (WITH EXCEPTION HANDLING!)
  //    e.g. "remove all week schedule except gym", "clear week except prayer", "delete today", etc.
  // --------------------------------------------------------------------------
  const isDeleteCommand =
    lower.includes('remove') ||
    lower.includes('delete') ||
    lower.includes('clear') ||
    lower.includes('wipe') ||
    lower.includes('cancel');

  if (isDeleteCommand) {
    const exceptions = extractExceptions(trimmed);

    // A. Entire Week Deletion: "remove all schedule for week", "remove all week schedule except gym", "clear week", "wipe week"
    if (
      lower.includes('for week') ||
      lower.includes('this week') ||
      lower.includes('all week') ||
      lower.includes('the week') ||
      lower.includes('week schedule') ||
      lower === 'clear week' ||
      lower === 'wipe week' ||
      lower === 'delete week' ||
      lower === 'remove week'
    ) {
      const weekEvents = events.filter((e) => currentWeekDates.includes(e.date));

      if (weekEvents.length === 0) {
        return {
          reply: `✓ [MASS DB MUTATION] Your schedule for the week of ${currentWeekDates[0]} to ${currentWeekDates[6]} is already completely clear. Zero sessions found.`,
          actionTaken: 'Verified empty week schedule',
          interactiveActions: [
            {
              label: '⚡ Repopulate Standard SSSGDW-B Week Routine',
              action_type: 'repopulate_week',
              variant: 'primary',
            },
          ],
        };
      }

      const preservedEvents = weekEvents.filter((e) => shouldPreserveEvent(e, exceptions));
      const deleteIds = weekEvents.filter((e) => !shouldPreserveEvent(e, exceptions)).map((e) => e.id);

      if (exceptions.hasException && deleteIds.length === 0) {
        return {
          reply: `✓ [SCHEDULE PRESERVED] All ${weekEvents.length} sessions for this week match your exception filter ("${exceptions.rawExceptionText}"). Zero events were deleted.`,
          actionTaken: 'Retained schedule matching exception filter',
          interactiveActions: [
            {
              label: '📅 View Week Calendar',
              action_type: 'switch_view',
              payload: { view: 'week' },
              variant: 'primary',
            },
          ],
        };
      }

      const preservedDescription = exceptions.hasException
        ? `, strictly preserving ${preservedEvents.length} session(s) (${exceptions.preservedAreas.map((a) => LIFE_AREAS_CONFIG[a]?.name || a).join(', ') || exceptions.rawExceptionText}) as requested`
        : '';

      return {
        reply: `✓ [MASS DB MUTATION EXECUTED] Removed ${deleteIds.length} scheduled events across the entire week (${currentWeekDates[0]} to ${currentWeekDates[6]})${preservedDescription}. dbo.scheduled_events updated for this week.`,
        actionTaken: `Deleted ${deleteIds.length} events for the week${exceptions.hasException ? ` (preserved ${preservedEvents.length})` : ''}`,
        eventDeletes: deleteIds,
        interactiveActions: [
          {
            label: '📅 View Week Calendar',
            action_type: 'switch_view',
            payload: { view: 'week' },
            variant: 'primary',
          },
          {
            label: '⚡ Repopulate Standard SSSGDW-B Week Routine',
            action_type: 'repopulate_week',
            variant: 'secondary',
          },
        ],
      };
    }

    // B. Entire Today / Tomorrow Deletion
    if (
      lower.includes('for today') ||
      lower.includes('all today') ||
      lower.includes('today schedule') ||
      lower.includes('today except') ||
      lower === 'clear today' ||
      lower === 'wipe today' ||
      lower === 'delete today' ||
      lower === 'remove today'
    ) {
      const todayEvents = events.filter((e) => e.date === selectedDate);
      const preservedEvents = todayEvents.filter((e) => shouldPreserveEvent(e, exceptions));
      const deleteIds = todayEvents.filter((e) => !shouldPreserveEvent(e, exceptions)).map((e) => e.id);

      const preservedDescription = exceptions.hasException
        ? `, strictly preserving ${preservedEvents.length} session(s) (${exceptions.preservedAreas.map((a) => LIFE_AREAS_CONFIG[a]?.name || a).join(', ') || exceptions.rawExceptionText})`
        : '';

      return {
        reply: `✓ [MASS DB MUTATION EXECUTED] Cleared ${deleteIds.length} scheduled sessions for ${selectedDate}${preservedDescription}. Day timeline reset.`,
        actionTaken: `Deleted ${deleteIds.length} events for today`,
        eventDeletes: deleteIds,
        interactiveActions: [
          {
            label: '⚡ Auto-Schedule Balanced Day Routine',
            action_type: 'optimize_schedule',
            variant: 'primary',
          },
        ],
      };
    }

    if (
      lower.includes('for tomorrow') ||
      lower.includes('all tomorrow') ||
      lower === 'clear tomorrow'
    ) {
      const tmrw = new Date(selectedDate);
      tmrw.setDate(tmrw.getDate() + 1);
      const tmrwStr = tmrw.toISOString().split('T')[0];
      const tmrwEvents = events.filter((e) => e.date === tmrwStr);
      const deleteIds = tmrwEvents.filter((e) => !shouldPreserveEvent(e, exceptions)).map((e) => e.id);
      return {
        reply: `✓ [MASS DB MUTATION EXECUTED] Cleared ${deleteIds.length} scheduled sessions for tomorrow (${tmrwStr}).`,
        actionTaken: `Deleted ${deleteIds.length} events for tomorrow`,
        eventDeletes: deleteIds,
      };
    }

    // C. Specific Day of Week Deletion: "clear wednesday", "delete all on friday", "remove thursday schedule"
    for (const [dayName, dayIndex] of Object.entries(DAY_NAME_MAP)) {
      if (lower.includes(dayName)) {
        const targetDate = currentWeekDates[dayIndex];
        const dayEvents = events.filter((e) => e.date === targetDate);
        const preservedDay = dayEvents.filter((e) => shouldPreserveEvent(e, exceptions));
        const dayIds = dayEvents.filter((e) => !shouldPreserveEvent(e, exceptions)).map((e) => e.id);
        const capitalizedDay = dayName.charAt(0).toUpperCase() + dayName.slice(1);

        if (dayIds.length > 0) {
          const preservedDesc = exceptions.hasException
            ? `, preserving ${preservedDay.length} session(s) (${exceptions.rawExceptionText})`
            : '';
          return {
            reply: `✓ [MASS DB MUTATION EXECUTED] Removed ${dayIds.length} sessions scheduled on ${capitalizedDay} (${targetDate})${preservedDesc}.`,
            actionTaken: `Deleted ${dayIds.length} events on ${capitalizedDay}`,
            eventDeletes: dayIds,
          };
        }
      }
    }

    // D. Area-wide Deletion: "delete all gym", "remove all prayer", "clear study"
    // BUT NOT if the area is inside an exception clause (e.g. "remove all except gym")
    const isWipeAllWithException = (lower.includes('all') || lower.includes('everything') || lower.includes('schedule')) && exceptions.hasException;

    if (!isWipeAllWithException) {
      const detectedArea = detectLifeArea(lower);
      if (detectedArea && (lower.includes('all') || lower.includes('every')) && !exceptions.preservedAreas.includes(detectedArea)) {
        const areaIds = events
          .filter((e) => e.life_area === detectedArea && currentWeekDates.includes(e.date))
          .map((e) => e.id);

        return {
          reply: `✓ [MASS DB MUTATION EXECUTED] Removed all ${areaIds.length} [${LIFE_AREAS_CONFIG[detectedArea].name.toUpperCase()}] sessions scheduled this week.`,
          actionTaken: `Deleted all ${detectedArea} events`,
          eventDeletes: areaIds,
        };
      }
    }

    // E. General Schedule Wipe: "remove all schedule", "remove all except gym", "clear all", "delete everything"
    const isGeneralWipe =
      isWipeAllWithException ||
      lower.includes('remove all') ||
      lower.includes('delete all') ||
      lower.includes('clear all') ||
      lower.includes('wipe all') ||
      lower.includes('remove everything') ||
      lower.includes('delete everything') ||
      lower.includes('clear everything') ||
      lower.includes('wipe everything') ||
      lower.includes('all schedule') ||
      lower.includes('the schedule') ||
      lower.includes('my schedule') ||
      lower.includes('entire schedule') ||
      lower.includes('remove schedule') ||
      lower.includes('clear schedule') ||
      lower.includes('delete schedule') ||
      lower.includes('wipe schedule');

    if (isGeneralWipe) {
      const weekEvents = events.filter((e) => currentWeekDates.includes(e.date));

      if (weekEvents.length === 0) {
        return {
          reply: `✓ [MASS DB MUTATION] Your schedule is already completely empty. Zero sessions found for this week (${currentWeekDates[0]} to ${currentWeekDates[6]}).`,
          actionTaken: 'Verified empty schedule',
          interactiveActions: [
            {
              label: '⚡ Repopulate Standard SSSGDW-B Week Routine',
              action_type: 'repopulate_week',
              variant: 'primary',
            },
          ],
        };
      }

      const preservedEvents = weekEvents.filter((e) => shouldPreserveEvent(e, exceptions));
      const deleteIds = weekEvents.filter((e) => !shouldPreserveEvent(e, exceptions)).map((e) => e.id);

      const preservedDescription = exceptions.hasException
        ? `, strictly preserving ${preservedEvents.length} session(s) (${exceptions.preservedAreas.map((a) => LIFE_AREAS_CONFIG[a]?.name || a).join(', ') || exceptions.rawExceptionText}) as requested`
        : '';

      return {
        reply: `✓ [MASS DB MUTATION EXECUTED] Removed ${deleteIds.length} scheduled sessions across the entire schedule (${currentWeekDates[0]} to ${currentWeekDates[6]})${preservedDescription}. Database updated.`,
        actionTaken: `Deleted ${deleteIds.length} scheduled events`,
        eventDeletes: deleteIds,
        interactiveActions: [
          {
            label: '📅 View Week Calendar',
            action_type: 'switch_view',
            payload: { view: 'week' },
            variant: 'primary',
          },
          {
            label: '⚡ Repopulate Standard SSSGDW-B Week Routine',
            action_type: 'repopulate_week',
            variant: 'secondary',
          },
        ],
      };
    }
  }

  // --------------------------------------------------------------------------
  // 2.5 HIDE / REMOVE PAST DAYS FROM CALENDAR ("remove past days", "why showing past days 12 13", "hide 12 13")
  // --------------------------------------------------------------------------
  if (
    lower.includes('past day') ||
    lower.includes('past days') ||
    lower.includes('hide past') ||
    lower.includes('remove past') ||
    lower.includes('why showing') ||
    lower.includes('why showig') ||
    lower.includes('12 13') ||
    lower.includes('remove 12') ||
    lower.includes('its gone')
  ) {
    return {
      reply: `✓ [CALENDAR VIEW CALIBRATED] Removed past days (Monday 12 & Tuesday 13 Oct) from your active execution horizon. Your weekly grid now displays active days starting directly from Today (${today}) through Sunday.`,
      actionTaken: 'Removed past days from week calendar',
      viewChange: 'week',
      togglePastDays: true,
      interactiveActions: [
        {
          label: '📅 View Week Calendar (Active Days)',
          action_type: 'switch_view',
          payload: { view: 'week' },
          variant: 'primary',
        },
      ],
    };
  }

  // --------------------------------------------------------------------------
  // 3. REPOPULATE & BATCH GENERATION ("Repopulate week", "Generate week routine", "Reset week")
  // --------------------------------------------------------------------------
  if (
    lower.includes('repopulate week') ||
    lower.includes('generate week') ||
    lower.includes('reset week') ||
    lower.includes('restore week') ||
    lower.includes('standard week') ||
    lower.includes('create week routine')
  ) {
    const seedEvents = generateSeedEvents(selectedDate);
    // Filter out existing events for this week first to avoid duplicates
    const existingWeekIds = events
      .filter((e) => currentWeekDates.includes(e.date))
      .map((e) => e.id);

    const adds: Array<Omit<ScheduledEvent, 'id'>> = seedEvents.map((se) => ({
      task_id: se.task_id,
      title: se.title,
      life_area: se.life_area,
      priority: se.priority,
      is_fixed: se.is_fixed,
      date: se.date,
      start_time: se.start_time,
      end_time: se.end_time,
      status: se.status,
    }));

    return {
      reply: `✓ [MASS DB GENERATION EXECUTED] Repopulated full balanced SSSGDW-B schedule for the week (${currentWeekDates[0]} to ${currentWeekDates[6]}). Generated ${adds.length} structured sessions with P0 Spiritual & Gym anchors locked.`,
      actionTaken: 'Repopulated standard SSSGDW-B week schedule',
      eventDeletes: existingWeekIds,
      eventAdds: adds,
      viewChange: 'week',
      interactiveActions: [
        {
          label: '📅 View Repopulated Week',
          action_type: 'switch_view',
          payload: { view: 'week' },
          variant: 'primary',
        },
      ],
    };
  }

  // --------------------------------------------------------------------------
  // 4. BATCH COMPLETION ("Mark all done today", "Complete all tasks")
  // --------------------------------------------------------------------------
  if (
    lower.includes('mark all done') ||
    lower.includes('complete all') ||
    lower.includes('finish all') ||
    lower.includes('finished everything today') ||
    lower.includes('all done today')
  ) {
    const pendingToday = events.filter((e) => e.date === selectedDate && e.status !== 'completed');
    const updates = pendingToday.map((e) => ({
      id: e.id,
      updates: { status: 'completed' as const },
    }));

    return {
      reply: `✓ [BATCH STATUS UPDATE EXECUTED] Marked all ${updates.length} remaining tasks for ${selectedDate} as COMPLETED. Daily discipline index maximized.`,
      actionTaken: `Completed ${updates.length} tasks for today`,
      eventUpdates: updates,
    };
  }

  // --------------------------------------------------------------------------
  // 5. BATCH RESCHEDULING & TIME SHIFTING ("Move all tasks today by 2 hours", "Shift everything after 2pm")
  // --------------------------------------------------------------------------
  if (
    /\b(move all|shift all|push all|reschedule all)\b/i.test(lower) &&
    !lower.includes('remove') &&
    !lower.includes('delete') &&
    !lower.includes('clear') &&
    !lower.includes('wipe')
  ) {
    const hourMatch = trimmed.match(/(\d+)\s*(?:hour|hr|hours|hrs)/i);
    const shiftHours = hourMatch ? parseInt(hourMatch[1], 10) : 1;

    const todayEvents = events.filter((e) => e.date === selectedDate);
    const updates = todayEvents.map((ev) => {
      const [sh, sm] = ev.start_time.split(':').map(Number);
      const [eh, em] = ev.end_time.split(':').map(Number);
      const newSh = (sh + shiftHours) % 24;
      const newEh = (eh + shiftHours) % 24;
      return {
        id: ev.id,
        updates: {
          start_time: `${String(newSh).padStart(2, '0')}:${String(sm).padStart(2, '0')}`,
          end_time: `${String(newEh).padStart(2, '0')}:${String(em).padStart(2, '0')}`,
          status: 'rescheduled' as const,
        },
      };
    });

    return {
      reply: `✓ [BATCH RESCHEDULING EXECUTED] Shifted all ${updates.length} scheduled sessions on ${selectedDate} forward by ${shiftHours} hour(s).`,
      actionTaken: `Shifted all tasks by ${shiftHours} hours`,
      eventUpdates: updates,
    };
  }

  // --------------------------------------------------------------------------
  // 6. RECURRING ROUTINE CREATION & MULTI-DAY SCHEDULING
  // ("add gym eveyday at 6 except sunday", "6-7 pm gym daily", "Schedule prayer every day at 5:30am", "Add gym mon-sat at 6")
  // --------------------------------------------------------------------------
  const resolvedTargetScope = resolveTargetDates({ input: trimmed, currentWeekDates, selectedDate });

  const isWeekRoutineCommand =
    resolvedTargetScope.isMultiDay ||
    lower.includes('every day') ||
    lower.includes('everyday') ||
    lower.includes('eveyday') ||
    lower.includes('evryday') ||
    lower.includes('daily') ||
    lower.includes('all days') ||
    lower.includes('from now on') ||
    lower.includes('every morning') ||
    lower.includes('every evening') ||
    lower.includes('whole week') ||
    lower.includes('all week') ||
    lower.includes('mon to sat') ||
    lower.includes('mon-sat') ||
    lower.includes('mon to fri') ||
    lower.includes('mon-fri') ||
    lower.includes('except sunday') ||
    lower.includes('excluding sunday') ||
    lower.includes('except sun') ||
    (currentView === 'week' &&
      (lower.startsWith('make ') ||
        lower.startsWith('set ') ||
        lower.startsWith('schedule ') ||
        lower.startsWith('add ') ||
        lower.startsWith('ad ') ||
        lower.includes('isgym') ||
        lower.includes('is gym')) &&
      !lower.includes('today') &&
      !lower.includes('tomorrow'));

  if (isWeekRoutineCommand) {
    const area = detectLifeArea(trimmed) || 'gym';
    const defaultDuration =
      area === 'gym' ? 60 : area === 'spiritual' ? 45 : area === 'work' ? 480 : 60;
    const timeRange = parseTimeAndRange(trimmed, defaultDuration);

    // If user asked to add a multi-day routine but DID NOT specify the time at all (e.g. "add gym everyday except sunday")
    if (!timeRange) {
      const scopeDesc = resolvedTargetScope.scopeDescription;
      const excParam = resolvedTargetScope.excludedDayNames.length > 0 ? ` except ${resolvedTargetScope.excludedDayNames[0].toLowerCase()}` : '';
      return {
        reply: `❓ **[SPECIFY TIME FOR ROUTINE]** I am ready to schedule **${LIFE_AREAS_CONFIG[area].name}** across **${scopeDesc}**.\n\nWhat time slot works best for you? Tap an option below or type your preferred hours (e.g. "at 6" or "6-7 pm"):`,
        actionTaken: `Requested time clarification for ${LIFE_AREAS_CONFIG[area].name}`,
        interactiveActions: [
          {
            label: '🏋️ 6:00 PM – 7:00 PM (Evening)',
            action_type: 'execute_command',
            payload: { command: `add ${area} everyday at 18:00${excParam}` },
            variant: 'primary',
          },
          {
            label: '🌅 6:30 AM – 7:30 AM (Morning)',
            action_type: 'execute_command',
            payload: { command: `add ${area} everyday at 06:30${excParam}` },
            variant: 'secondary',
          },
          {
            label: '⚡ 7:00 PM – 8:00 PM (Night)',
            action_type: 'execute_command',
            payload: { command: `add ${area} everyday at 19:00${excParam}` },
            variant: 'secondary',
          },
        ],
      };
    }

    const priority = area === 'spiritual' || area === 'gym' ? 'P0' : 'P1';
    const cleanTitle = extractCleanTitle(trimmed, area);
    const targetDates = resolvedTargetScope.targetDates;

    // Smart Deduplication: remove existing/stale events of this area across target dates to prevent duplicate overlapping cards
    // AND if specific days are excluded (e.g. Sunday), also remove any existing events of this area on the excluded days in the current week
    const excludedDates = currentWeekDates.filter((d) => !targetDates.includes(d));
    const staleIds = events
      .filter(
        (e) =>
          (targetDates.includes(e.date) || (resolvedTargetScope.excludedDayNames.length > 0 && excludedDates.includes(e.date))) &&
          (e.life_area === area ||
            e.title.toLowerCase().includes(area) ||
            (area === 'gym' && e.title.toLowerCase().includes('gym')))
      )
      .map((e) => e.id);

    const adds: Array<Omit<ScheduledEvent, 'id'>> = targetDates.map((d) => ({
      task_id: `rec-${Date.now()}-${d}`,
      title: cleanTitle,
      life_area: area,
      priority,
      is_fixed: priority === 'P0',
      date: d,
      start_time: timeRange.startTime,
      end_time: timeRange.endTime,
      status: 'planned',
    }));

    const excludedNote =
      resolvedTargetScope.excludedDayNames.length > 0
        ? ` (${resolvedTargetScope.excludedDayNames.join(', ')} strictly preserved as Rest Day)`
        : '';

    const staleNote =
      staleIds.length > 0
        ? ` Replaced and deduplicated ${staleIds.length} existing ${LIFE_AREAS_CONFIG[area].name} session(s).`
        : '';

    const isPm = parseInt(timeRange.startTime.split(':')[0], 10) >= 12;
    const excArg = resolvedTargetScope.excludedDayNames.length > 0 ? ` except ${resolvedTargetScope.excludedDayNames[0].toLowerCase()}` : '';

    return {
      reply: `✓ [RECURRING GENERATION EXECUTED] Scheduled "${cleanTitle}" [${priority}] across ${resolvedTargetScope.scopeDescription} from ${timeRange.startTime} to ${timeRange.endTime}${excludedNote}.${staleNote}`,
      actionTaken: `Created recurring routine for ${cleanTitle} across ${adds.length} days`,
      eventDeletes: staleIds,
      eventAdds: adds,
      viewChange: 'week',
      interactiveActions: [
        {
          label: '📅 View Week Calendar',
          action_type: 'switch_view',
          payload: { view: 'week' },
          variant: 'primary',
        },
        ...(resolvedTargetScope.excludedDayNames.includes('Sunday')
          ? [
              {
                label: '🔁 Include Sunday (All 7 Days)',
                action_type: 'execute_command' as const,
                payload: { command: `add ${area} everyday at ${timeRange.startTime}` },
                variant: 'secondary' as const,
              },
            ]
          : [
              {
                label: '⛔ Exclude Sunday (Rest Day)',
                action_type: 'execute_command' as const,
                payload: { command: `add ${area} everyday at ${timeRange.startTime} except sunday` },
                variant: 'secondary' as const,
              },
            ]),
        ...(isPm
          ? [
              {
                label: '🌅 Switch to Morning (06:00 – 07:00)',
                action_type: 'execute_command' as const,
                payload: { command: `add ${area} everyday at 06:00${excArg}` },
                variant: 'secondary' as const,
              },
            ]
          : [
              {
                label: '🌆 Switch to Evening (18:00 – 19:00)',
                action_type: 'execute_command' as const,
                payload: { command: `add ${area} everyday at 18:00${excArg}` },
                variant: 'secondary' as const,
              },
            ]),
        {
          label: '🎯 Apply to Today Only',
          action_type: 'execute_command',
          payload: { command: `add ${area} today at ${timeRange.startTime}` },
          variant: 'secondary',
        },
      ],
    };
  }

  // --------------------------------------------------------------------------
  // 6.5 IMMEDIATE / "NOW" TASK SCHEDULING ("now i do gym", "i do gym now", "start gym now")
  // --------------------------------------------------------------------------
  if (
    lower.startsWith('now i do') ||
    lower.startsWith('now do') ||
    lower.startsWith('i do ') ||
    lower === 'now gym' ||
    lower === 'gym now' ||
    lower === 'start gym now' ||
    (/\b(now|right now)\b/i.test(lower) &&
      (lower.includes('gym') || lower.includes('study') || lower.includes('prayer') || lower.includes('workout')))
  ) {
    const area = detectLifeArea(trimmed) || 'gym';
    const cleanTitle = extractCleanTitle(trimmed, area);
    const priority = area === 'spiritual' || area === 'gym' ? 'P0' : 'P1';

    const nowRange = parseTimeAndRange('now', area === 'gym' ? 90 : 60)!;

    // Check if an existing event in this area exists today
    const existingToday = events.find(
      (e) => e.date === selectedDate && (e.life_area === area || e.title.toLowerCase().includes(area))
    );

    if (existingToday) {
      return {
        reply: `✓ [SCHEDULE SYNCHRONIZED] Shifted "${existingToday.title}" to start right now (${nowRange.startTime} – ${nowRange.endTime}) on ${selectedDate}. Live execution initiated.`,
        actionTaken: `Rescheduled ${existingToday.title} to now`,
        eventUpdates: [
          {
            id: existingToday.id,
            updates: {
              start_time: nowRange.startTime,
              end_time: nowRange.endTime,
              status: 'rescheduled',
            },
          },
        ],
        viewChange: 'day',
      };
    } else {
      const newEv: Omit<ScheduledEvent, 'id'> = {
        task_id: `now-${Date.now()}`,
        title: cleanTitle,
        life_area: area,
        priority,
        is_fixed: priority === 'P0',
        date: selectedDate,
        start_time: nowRange.startTime,
        end_time: nowRange.endTime,
        status: 'planned',
      };

      return {
        reply: `✓ [SESSION SCHEDULED NOW] Added "${cleanTitle}" [${priority}] starting right now (${nowRange.startTime} – ${nowRange.endTime}) on ${selectedDate}.`,
        actionTaken: `Created session for ${cleanTitle} right now`,
        eventAdds: [newEv],
        viewChange: 'day',
      };
    }
  }

  // --------------------------------------------------------------------------
  // 6.6 DEDUPLICATION / DUPLICATE CLEANUP ("clean duplicates", "fix duplicates", "remove duplicate gym")
  // --------------------------------------------------------------------------
  if (lower.includes('duplicate') || lower.includes('clean duplicates') || lower.includes('fix duplicates')) {
    const targetArea = detectLifeArea(trimmed);
    const seen = new Set<string>();
    const dupIds: string[] = [];

    events.forEach((ev) => {
      if (targetArea && ev.life_area !== targetArea) return;
      const key = `${ev.date}-${ev.life_area}-${ev.start_time}`;
      const generalKey = `${ev.date}-${ev.life_area}`;
      if (seen.has(key) || (targetArea && seen.has(generalKey))) {
        dupIds.push(ev.id);
      } else {
        seen.add(key);
        if (targetArea) seen.add(generalKey);
      }
    });

    if (dupIds.length === 0) {
      return {
        reply: `✓ [INTELLIGENT DEDUPLICATION AUDIT] Zero duplicate or overlapping sessions detected in dbo.scheduled_events. Timeline is cleanly structured.`,
        actionTaken: 'Audited duplicates',
      };
    }

    return {
      reply: `✓ [INTELLIGENT DEDUPLICATION EXECUTED] Removed ${dupIds.length} redundant/overlapping sessions from your schedule. Only canonical, primary SSSGDW-B sessions are preserved.`,
      actionTaken: `Removed ${dupIds.length} duplicate events`,
      eventDeletes: dupIds,
      viewChange: 'week',
    };
  }

  // --------------------------------------------------------------------------
  // 7. SPECIFIC DAY QUERY ("What is on Wednesday?", "What is on Friday?", "Show Friday")
  // --------------------------------------------------------------------------
  for (const [dayName, dayIndex] of Object.entries(DAY_NAME_MAP)) {
    if (
      (lower.includes(dayName) && (lower.includes('what') || lower.includes('schedule') || lower.includes('show') || lower.includes('tasks'))) ||
      lower === dayName
    ) {
      const targetDate = currentWeekDates[dayIndex];
      const dayEvents = events.filter((e) => e.date === targetDate);
      const capDay = dayName.charAt(0).toUpperCase() + dayName.slice(1);

      if (dayEvents.length === 0) {
        return {
          reply: `📅 [SCHEDULE FOR ${capDay.toUpperCase()} (${targetDate})]\n\nZero sessions currently scheduled for this day. It is completely open.`,
          dateChange: targetDate,
          viewChange: 'day',
          actionTaken: `Navigated to ${capDay}`,
          interactiveActions: [
            {
              label: `⚡ Auto-Generate Routine for ${capDay}`,
              action_type: 'optimize_schedule',
              variant: 'primary',
            },
          ],
        };
      }

      const scheduleText = dayEvents
        .map((e) => `• [${e.priority}] ${e.start_time}–${e.end_time} : ${e.title} (${LIFE_AREAS_CONFIG[e.life_area].name}) [${e.status.toUpperCase()}]`)
        .join('\n');

      return {
        reply: `📅 [SCHEDULE FOR ${capDay.toUpperCase()} (${targetDate}) — ${dayEvents.length} SESSIONS]:\n\n${scheduleText}`,
        dateChange: targetDate,
        viewChange: 'day',
        actionTaken: `Viewed schedule for ${capDay}`,
      };
    }
  }

  // --------------------------------------------------------------------------
  // 8. COACHING MODE SWITCH ("Switch to drill sergeant", "Switch to strategist")
  // --------------------------------------------------------------------------
  if (lower.includes('drill sergeant') || lower.includes('drill mode')) {
    return {
      reply: `🚨 [COACHING MODE SWITCHED: DRILL SERGEANT]\n\nUnderstood. From this moment, zero excuses will be tolerated. Excuses will be met with immediate pushback and audit penalties. Execute your SSSGDW-B blocks without hesitation.`,
      coachingModeChange: 'drill-sergeant',
      actionTaken: 'Switched to drill sergeant mode',
    };
  }

  if (lower.includes('strategist') || lower.includes('calm mode') || lower.includes('advisor mode')) {
    return {
      reply: `🧠 [COACHING MODE SWITCHED: STRATEGIC ADVISOR]\n\nSwitched to analytical, high-leverage strategic guidance. Focused on long-term compound growth, circadian optimization, and the ₹1 Crore roadmap.`,
      coachingModeChange: 'strategist',
      actionTaken: 'Switched to strategist mode',
    };
  }

  // --------------------------------------------------------------------------
  // 9. TRIGGER RANDOM DISCOVERY QUESTION ("Interview Me" / "Know Me Better")
  // --------------------------------------------------------------------------
  if (
    lower.includes('ask me a question') ||
    lower.includes('interview me') ||
    lower.includes('know me better') ||
    lower.includes('ask me something') ||
    lower.includes('random question') ||
    lower.includes('quiz me') ||
    lower === 'interview'
  ) {
    const answeredCategories = userProfile.learned_insights.map((i) => i.category);
    let chosen = DISCOVERY_QUESTIONS.find((q) => !answeredCategories.includes(q.category));
    if (!chosen) {
      chosen = DISCOVERY_QUESTIONS[Math.floor(Math.random() * DISCOVERY_QUESTIONS.length)];
    }

    const reply =
      `🤖 [JARVIS PROFILE DISCOVERY // SSSGDW-B CALIBRATION]\n\n` +
      `"${chosen.question}"\n\n` +
      `_Type your authentic answer below. I will store this directly in your neural memory profile and calibrate your schedule accordingly._`;

    return {
      reply,
      actionTaken: `Initiated discovery question: ${chosen.category}`,
      newDiscoveryQuestion: chosen,
    };
  }

  // --------------------------------------------------------------------------
  // 10. PROFILE & MEMORY QUERIES ("Who am I", "What do you know about me")
  // --------------------------------------------------------------------------
  if (
    lower.includes('who am i') ||
    lower.includes('what do you know about me') ||
    lower.includes('show my profile') ||
    lower.includes('my memory') ||
    lower.includes('show memory') ||
    lower.includes('what do you know') ||
    lower === 'profile'
  ) {
    const insightsList = userProfile.learned_insights
      .map((ins, idx) => `  ${idx + 1}. [${ins.category.toUpperCase()}]: ${ins.insight}`)
      .join('\n');

    const reply =
      `📋 [JARVIS NEURAL PROFILE: ${userProfile.name.toUpperCase()}]\n\n` +
      `• Primary Identity: ${userProfile.current_role}\n` +
      `• Location: ${userProfile.location}\n` +
      `• Foundation: ${userProfile.education}\n` +
      `• North Star Vision: ${userProfile.grand_vision}\n\n` +
      `🛡️ CORE SSSGDW-B VALUES:\n` +
      userProfile.core_values.map((v) => `• ${v}`).join('\n') +
      `\n\n🧠 PERSISTENT LEARNED INSIGHTS (${userProfile.learned_insights.length} active):\n` +
      (insightsList || '  None yet. Ask me to interview you to begin learning!') +
      `\n\n⚙️ CALIBRATED PREFERENCES:\n` +
      `• Wake-Up: ${userProfile.custom_preferences.wake_time || '05:30 (Fajr)'}\n` +
      `• Bedtime: ${userProfile.custom_preferences.bed_time || '23:00'}\n` +
      `• Peak Focus Window: ${userProfile.custom_preferences.peak_focus_hours || '05:30 - 08:30 & 17:30 - 19:00'}\n` +
      `• Workout Style: ${userProfile.custom_preferences.workout_style || '5x Heavy Compound'}\n` +
      `• Diet Discipline: ${userProfile.custom_preferences.diet_style || 'High Protein, Zero Refined Sugar'}\n\n` +
      `You can teach me new facts anytime (e.g. "Remember that I prefer...") or tell me to "Ask me a question"!`;

    const interactiveActions: InteractiveAction[] = [
      {
        label: `🎲 Ask Me a Question to Know Me Better`,
        action_type: 'ask_question',
        variant: 'primary',
      },
      {
        label: `⚡ Auto-Optimize Schedule Today`,
        action_type: 'optimize_schedule',
        variant: 'secondary',
      },
    ];

    return {
      reply,
      actionTaken: 'Queried user profile & neural memory',
      interactiveActions,
    };
  }

  // --------------------------------------------------------------------------
  // 11. TEACHING JARVIS A FACT DIRECTLY ("Remember that...", "Note that...")
  // --------------------------------------------------------------------------
  if (
    lower.startsWith('remember that') ||
    lower.startsWith('remember ') ||
    lower.startsWith('note that') ||
    lower.startsWith('store that')
  ) {
    const rawFact = trimmed
      .replace(/^(remember that|remember|note that|store that)\s+/i, '')
      .trim();

    let cat: 'energy' | 'schedule' | 'distraction' | 'ambition' | 'health' | 'habits' = 'habits';
    if (lower.includes('energy') || lower.includes('focus') || lower.includes('tired')) cat = 'energy';
    else if (lower.includes('sleep') || lower.includes('bed') || lower.includes('time') || lower.includes('hour')) cat = 'schedule';
    else if (lower.includes('distract') || lower.includes('phone') || lower.includes('social media')) cat = 'distraction';
    else if (lower.includes('crore') || lower.includes('money') || lower.includes('goal') || lower.includes('career')) cat = 'ambition';
    else if (lower.includes('gym') || lower.includes('lift') || lower.includes('diet') || lower.includes('food') || lower.includes('water')) cat = 'health';

    const reply =
      `🧠 [PERMANENT FACT STORED]\n\n` +
      `Acknowledged, Harkirat. I have logged this into your permanent memory under [${cat.toUpperCase()}]:\n` +
      `"${rawFact}"\n\n` +
      `I will factor this constraint into all future schedule optimizations, coaching feedback, and conflict resolutions.`;

    return {
      reply,
      actionTaken: `Saved learned insight: ${rawFact}`,
      learnedInsight: {
        category: cat,
        insight: rawFact,
      },
    };
  }

  // --------------------------------------------------------------------------
  // 12. VIEW NAVIGATION ("Switch to week view", "Show goals", "Table", etc.)
  // --------------------------------------------------------------------------
  if (
    lower.includes('week view') ||
    lower.includes('show week') ||
    lower.includes('open week') ||
    lower === 'week'
  ) {
    return {
      reply: `✓ [VIEW CONTROLLER] Switched UI to 7-Day Week Calendar View. All SSSGDW-B blocks for this week are loaded on your screen.`,
      viewChange: 'week',
      actionTaken: 'Switched to week view',
    };
  }

  if (
    lower.includes('month view') ||
    lower.includes('show month') ||
    lower.includes('open month') ||
    lower === 'month'
  ) {
    return {
      reply: `✓ [VIEW CONTROLLER] Switched UI to Monthly Horizon View. High-level discipline density and completion patterns visible.`,
      viewChange: 'month',
      actionTaken: 'Switched to month view',
    };
  }

  if (
    lower.includes('day view') ||
    lower.includes('show day') ||
    lower.includes('today view') ||
    lower.includes('timeline view') ||
    lower === 'day' ||
    lower === 'timeline'
  ) {
    return {
      reply: `✓ [VIEW CONTROLLER] Switched UI to Daily Execution Timeline & SSSGDW-B Balance Radar for ${selectedDate}.`,
      viewChange: 'day',
      actionTaken: 'Switched to day view',
    };
  }

  if (
    lower.includes('table view') ||
    lower.includes('life db studio') ||
    lower.includes('show table') ||
    lower.includes('open table') ||
    lower.includes('studio') ||
    lower === 'table'
  ) {
    return {
      reply: `✓ [VIEW CONTROLLER] Switched UI to Life DB Studio (Raw SQL Table & Filter Engine). Full database records ready for inspection.`,
      viewChange: 'table',
      actionTaken: 'Switched to table view',
    };
  }

  if (
    lower.includes('goal') ||
    lower.includes('milestone') ||
    lower.includes('1 crore') ||
    lower.includes('core goals') ||
    lower.includes('show goals')
  ) {
    const activeGoals = milestones;
    const reply =
      `✓ [VIEW CONTROLLER] Switched UI to Core Life Goals (₹1 Crore & SSSGDW-B Pillars).\n\n` +
      `HIGH-STAKES GOALS ACTIVE:\n` +
      activeGoals
        .map(
          (g) =>
            `• [${g.progress_pct}%] ${g.title} (${LIFE_AREAS_CONFIG[g.life_area]?.name || 'Core'}) — Deadline: ${g.target_date}`
        )
        .join('\n') +
      `\n\nCurrent Discipline Score: ${metrics.overall_score}%. Inaction is the only true failure.`;

    return {
      reply,
      viewChange: 'goals',
      actionTaken: 'Switched to goals view',
    };
  }

  // --------------------------------------------------------------------------
  // 13. LIFE AREA FILTERING ("Filter by gym", "Filter spiritual", "Clear filter")
  // --------------------------------------------------------------------------
  if (
    lower.includes('filter') ||
    lower.includes('show only') ||
    lower.includes('clear filter') ||
    lower.includes('reset filter') ||
    lower.includes('show all areas')
  ) {
    if (lower.includes('clear') || lower.includes('reset') || lower.includes('all')) {
      return {
        reply: `✓ [FILTER CONTROLLER] Cleared all life area filters. Showing full SSSGDW-B integrated schedule.`,
        filterChange: 'all',
        actionTaken: 'Reset area filter to all',
      };
    }

    const targetArea = detectLifeArea(lower);
    if (targetArea) {
      return {
        reply: `✓ [FILTER CONTROLLER] Active filter applied: [${LIFE_AREAS_CONFIG[targetArea].name.toUpperCase()}]. The timeline and views are now narrowed to ${LIFE_AREAS_CONFIG[targetArea].name} sessions only.`,
        filterChange: targetArea,
        actionTaken: `Filtered by ${targetArea}`,
      };
    }
  }

  // --------------------------------------------------------------------------
  // 14. DATE NAVIGATION ("Go to tomorrow", "Show yesterday", "Jump to today")
  // --------------------------------------------------------------------------
  if (
    (lower.includes('tomorrow') ||
      lower.includes('yesterday') ||
      lower.includes('go to today') ||
      lower.includes('jump to today')) &&
    !lower.startsWith('add') &&
    !lower.startsWith('schedule') &&
    !lower.startsWith('create') &&
    !lower.startsWith('plan')
  ) {
    const curDate = new Date(selectedDate);
    if (lower.includes('tomorrow')) {
      curDate.setDate(curDate.getDate() + 1);
      const newD = curDate.toISOString().split('T')[0];
      return {
        reply: `✓ [CALENDAR NAVIGATOR] Moved calendar to Tomorrow (${newD}). Schedule loaded.`,
        dateChange: newD,
        actionTaken: `Changed date to ${newD}`,
      };
    } else if (lower.includes('yesterday')) {
      curDate.setDate(curDate.getDate() - 1);
      const newD = curDate.toISOString().split('T')[0];
      return {
        reply: `✓ [CALENDAR NAVIGATOR] Moved calendar to Yesterday (${newD}). Historical log loaded.`,
        dateChange: newD,
        actionTaken: `Changed date to ${newD}`,
      };
    } else {
      return {
        reply: `✓ [CALENDAR NAVIGATOR] Reset calendar to Today (${today}). Live schedule active.`,
        dateChange: today,
        actionTaken: `Reset date to ${today}`,
      };
    }
  }

  // --------------------------------------------------------------------------
  // 15. SCHEDULE OPTIMIZATION ("Optimize my day", "Fix schedule", "Make room")
  // --------------------------------------------------------------------------
  if (
    lower.includes('optimize') ||
    lower.includes('fix my schedule') ||
    lower.includes('clean my schedule') ||
    lower.includes('rebalance my day') ||
    lower.includes('reorganize') ||
    lower.includes('make room')
  ) {
    const todayEvents = events.filter((e) => e.date === selectedDate);
    const updates: Array<{ id: string; updates: Partial<ScheduledEvent> }> = [];

    todayEvents.forEach((ev) => {
      if (ev.priority === 'P0' && !ev.is_fixed) {
        updates.push({ id: ev.id, updates: { is_fixed: true } });
      }
    });

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

    const reply =
      `⚡ [SCHEDULE AUTO-OPTIMIZER EXECUTED]\n\n` +
      `Analyzed ${todayEvents.length} scheduled slots for ${selectedDate} against your SSSGDW-B protocol and biological focus peaks:\n\n` +
      `1. 🛡️ Inviolable Anchors Protected:\n` +
      `   • 05:30–06:15 Spiritual (Fajr & Morning Stillness) [LOCKED P0]\n` +
      `   • 06:30–08:00 Heavy Compound Gym Session [LOCKED P0]\n` +
      `   • 09:00–17:00 Locked Professional Work Execution (9-5)\n\n` +
      `2. 🔄 Dynamic Slots Calibrated:\n` +
      (overdueEvents.length > 0
        ? `   • Shifted ${overdueEvents.length} overdue task(s) (${overdueEvents.map((o) => o.title).join(', ')}) forward to unobstructed evening hours.\n`
        : `   • Zero overdue conflicts detected. Timeline flows seamlessly.\n`) +
      `   • 17:30–19:00 Deep Technical Study & AI Mastery guarded.\n` +
      `   • 19:15–20:30 Social / Athletic recharge.\n` +
      `   • 22:15 Digital Sunset & 23:00 Bedtime protocol intact.\n\n` +
      `All changes are directly written to your database.`;

    const interactiveActions: InteractiveAction[] = [
      {
        label: `📅 View Updated Day Timeline`,
        action_type: 'switch_view',
        payload: { view: 'day' },
        variant: 'primary',
      },
      {
        label: `📊 Review Balance Radar`,
        action_type: 'switch_view',
        payload: { view: 'day' },
        variant: 'secondary',
      },
    ];

    return {
      reply,
      actionTaken: 'Executed schedule auto-optimization',
      eventUpdates: updates,
      interactiveActions,
    };
  }

  // --------------------------------------------------------------------------
  // 16. BRUTAL CRITIQUE / RADAR AUDIT ("Critique my schedule", "What am I neglecting")
  // --------------------------------------------------------------------------
  if (
    lower.includes('critique') ||
    lower.includes('audit') ||
    lower.includes('what am i neglecting') ||
    lower.includes('balance radar') ||
    lower.includes('honest review') ||
    lower.includes('am i on track')
  ) {
    const todayEvents = events.filter((e) => e.date === selectedDate);
    const completedCount = todayEvents.filter((e) => e.status === 'completed').length;
    const skippedCount = todayEvents.filter((e) => e.status === 'skipped').length;
    const p0Count = todayEvents.filter((e) => e.priority === 'P0').length;
    const p0Done = todayEvents.filter((e) => e.priority === 'P0' && e.status === 'completed').length;

    const areas = Object.keys(metrics.planned_distribution) as LifeAreaKey[];
    const zeroExecAreas = areas.filter(
      (a) => metrics.planned_distribution[a] > 0 && metrics.area_distribution[a] === 0
    );

    const toneTitle =
      coachingMode === 'drill-sergeant'
        ? '🚨 [DRILL SERGEANT BRUTAL AUDIT]'
        : '📊 [STRATEGIC PERFORMANCE AUDIT]';

    const reply =
      `${toneTitle}\n\n` +
      `Target Date: ${selectedDate} | Current Discipline Score: ${metrics.overall_score}%\n\n` +
      `• P0 Non-Negotiable Anchor Execution: ${p0Done} / ${p0Count} completed (${metrics.p0_completion_rate}%)\n` +
      `• Total Tasks Completed: ${completedCount} / ${todayEvents.length}\n` +
      `• Logged Skips / Misses: ${skippedCount}\n\n` +
      (zeroExecAreas.length > 0
        ? `⚠️ CRITICAL DEFICIT AREAS DETECTED:\n` +
          zeroExecAreas
            .map(
              (za) =>
                `• [${LIFE_AREAS_CONFIG[za].name}]: ${metrics.planned_distribution[za].toFixed(1)} planned hours with ZERO execution so far.`
            )
            .join('\n') +
          `\n`
        : `✓ All planned areas have active execution logged.\n`) +
      `\n💡 DIRECT VERDICT:\n` +
      (coachingMode === 'drill-sergeant'
        ? `You talk about achieving ₹1 Crore and becoming an elite AI Engineer, but every missed block is evidence of leaking discipline. Stop negotiating with yourself. Execute the next planned slot immediately.`
        : `Your SSSGDW-B radar indicates solid foundation, but ensure your evening deep study block isn't consumed by passive fatigue. Protect your 17:30-19:00 window.`);

    const interactiveActions: InteractiveAction[] = [
      {
        label: `⚡ Auto-Optimize Remaining Hours`,
        action_type: 'optimize_schedule',
        variant: 'primary',
      },
      {
        label: `🎯 Open Core Goals & Milestones`,
        action_type: 'switch_view',
        payload: { view: 'goals' },
        variant: 'secondary',
      },
    ];

    return {
      reply,
      actionTaken: 'Executed brutal schedule & radar audit',
      interactiveActions,
    };
  }

  // --------------------------------------------------------------------------
  // 17. WEALTH & ₹1 CRORE STRATEGY ("How to hit 1 crore faster", "Monetize")
  // --------------------------------------------------------------------------
  if (
    lower.includes('1 crore') ||
    lower.includes('wealth') ||
    lower.includes('crore') ||
    lower.includes('make money') ||
    lower.includes('monetize') ||
    lower.includes('financial goal')
  ) {
    const croreGoal = milestones.find(
      (m) => m.title.toLowerCase().includes('crore') || m.life_area === 'study'
    );

    const reply =
      `💰 [₹1 CRORE WEALTH ARCHITECTURE // HIGH-LEVERAGE BLUEPRINT]\n\n` +
      `Harkirat, reaching ₹1 Crore requires understanding one fundamental law: **Income follows leverage, not hours worked.**\n\n` +
      `Here is your 3-Phase Execution Roadmap as an AI Engineer:\n\n` +
      `1. **Leverage Pillar 1: High-Income Engineering Baseline (Locked 9-5)**\n` +
      `   • Deliver top 5% performance at work so your daytime income is stable, predictable, and stress-free.\n` +
      `   • Hard stop at 17:00. Do not donate overtime for free when you have equity to build.\n\n` +
      `2. **Leverage Pillar 2: Autonomous AI Product Monetization (17:30–19:00 Deep Study Block)**\n` +
      `   • Your active projects: **DataPilot AI** (CSV intelligence engine) and **Smart Invoice AI** (multimodal expense assistant).\n` +
      `   • Move from portfolio demos to paid enterprise micro-SaaS or API services.\n` +
      `   • 5 enterprise clients paying ₹50,000/mo = ₹2.5 Lakhs/month recurring independent cashflow.\n\n` +
      `3. **Leverage Pillar 3: High-Ticket Agentic AI Consulting / System Architecture**\n` +
      `   • Companies are desperate for real closed-loop agentic pipelines (tool routing, in-memory SQL, zero hallucination).\n` +
      `   • Package your skills into ₹3L–₹5L fixed-scope agent implementations.\n\n` +
      `Current Progress: ${croreGoal?.progress_pct || 68}% | Target Date: ${croreGoal?.target_date || '2026-12-31'}\n` +
      `Would you like me to lock a dedicated 90-minute evening "Monetization Sprint" block into your daily calendar?`;

    const interactiveActions: InteractiveAction[] = [
      {
        label: `🚀 Schedule 90-Min AI Monetization Sprint at 17:30`,
        action_type: 'add_task',
        payload: {
          title: 'AI Product Monetization & Enterprise Sprint',
          area: 'study',
          startTime: '17:30',
          endTime: '19:00',
          priority: 'P1',
        },
        variant: 'primary',
      },
      {
        label: `🎯 View Master Goals Detail`,
        action_type: 'switch_view',
        payload: { view: 'goals' },
        variant: 'secondary',
      },
    ];

    return {
      reply,
      actionTaken: 'Generated ₹1 Crore wealth execution strategy',
      interactiveActions,
    };
  }

  // --------------------------------------------------------------------------
  // 18. LIFE & PERFORMANCE ADVISORY ("How do I be better at...", "Overcome laziness", etc.)
  // --------------------------------------------------------------------------
  if (
    lower.includes('how can i be better') ||
    lower.includes('how to be better') ||
    lower.includes('lazy') ||
    lower.includes('procrastinating') ||
    lower.includes('procrastination') ||
    lower.includes('no motivation') ||
    lower.includes('discipline') ||
    lower.includes('level up') ||
    lower.includes('advice')
  ) {
    const isProcrastination = lower.includes('lazy') || lower.includes('procrastinat');
    const isGym = lower.includes('gym') || lower.includes('lift') || lower.includes('muscle');
    const isSleep = lower.includes('sleep') || lower.includes('tired') || lower.includes('wake up');

    let title = '🧠 [JARVIS SSSGDW-B PERFORMANCE ADVISOR]';
    let content = '';
    const actions: InteractiveAction[] = [];

    if (isProcrastination) {
      content =
        `Harkirat, procrastination is never a character flaw—it is a **friction and ambiguity problem**.\n\n` +
        `When you hesitate to start a task (e.g. evening study or writing code), your brain perceives the task as too vast or vague.\n\n` +
        `Apply the **"Rule of First 5 Minutes"**:\n` +
        `1. Do not commit to working 90 minutes. Commit to opening the IDE and writing 1 line of code or reading 1 page.\n` +
        `2. Remove the digital friction: Put your phone in another room or turn on airplane mode.\n` +
        `3. Remember your ₹1 Crore milestone: Every day wasted in comfort is a day delayed from total sovereign freedom.\n\n` +
        `What task are you delaying right now? Tell me, and I will shrink it into an immediate 20-minute micro-block.`;

      actions.push({
        label: `⚡ Schedule 25-Min Micro-Focus Sprint Now`,
        action_type: 'add_task',
        payload: {
          title: '25-Min Hyper-Focus Sprint (Zero Phone)',
          area: 'study',
          startTime: `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes() + 5).padStart(2, '0')}`,
          endTime: `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes() + 30).padStart(2, '0')}`,
          priority: 'P1',
        },
        variant: 'primary',
      });
    } else if (isGym) {
      content =
        `For your target of sub-12% body fat and 140kg deadlift:\n\n` +
        `1. **Progressive Overload Tracking:** Add 2.5kg to your main compound lifts every 10 days rather than guessing weights.\n` +
        `2. **Macro Precision:** 1.8g protein per kg of bodyweight, eaten within clean whole foods (chicken, eggs, paneer/whey, lentils).\n` +
        `3. **Sleep Recovery:** Muscle tissue does not grow in the gym; it grows during Stage 3 deep sleep between 23:00 and 04:00.\n\n` +
        `Keep morning gym locked at 06:30 as your daily discipline anchor.`;
    } else if (isSleep) {
      content =
        `To wake up energized at 05:30 for Fajr prayer:\n\n` +
        `1. **The 22:15 Digital Sunset:** Screen light halts melatonin synthesis. Turn off all blue-light displays 45 minutes before sleep.\n` +
        `2. **Zero Caffeine After 14:00:** Caffeine has a 6-hour half-life; it disrupts deep sleep architecture even if you fall asleep easily.\n` +
        `3. **Morning Sun / Light:** Get immediate natural light exposure right after Fajr to anchor your circadian rhythm.`;
    } else {
      content =
        `To continuously elevate yourself as a senior AI Engineer and disciplined sovereign individual:\n\n` +
        `• **Protect the P0 Anchors (Spiritual + Gym):** When prayer and physical conditioning are executed daily, your mental baseline becomes unshakable.\n` +
        `• **Deep Work Over Busywork:** 90 minutes of high-intensity uninterrupted study on agent architectures out-compounds 8 hours of distracted browsing.\n` +
        `• **Regular Life DB Calibration:** Check your discipline score and radar daily to catch imbalances before they become habits.\n\n` +
        `I am equipped to manage and adjust any aspect of your schedule or habits. What specific area would you like to level up today?`;
    }

    actions.push({
      label: `🎲 Ask Me a Discovery Question`,
      action_type: 'ask_question',
      variant: 'secondary',
    });

    return {
      reply: `${title}\n\n${content}`,
      actionTaken: 'Delivered performance advisory',
      interactiveActions: actions,
    };
  }

  // --------------------------------------------------------------------------
  // 19. SINGLE EVENT ACTIONS: MARK DONE / COMPLETE
  // --------------------------------------------------------------------------
  if (
    lower.includes('done') ||
    lower.includes('finished') ||
    lower.includes('completed') ||
    lower.includes('did ') ||
    lower.includes('prayed')
  ) {
    const target = findMatchingEvent(lower, events, selectedDate);
    if (target) {
      return {
        reply:
          coachingMode === 'drill-sergeant'
            ? `✓ [DISCIPLINE CONFIRMED] "${target.title}" marked DONE in dbo.scheduled_events. No applause for doing what was scheduled. Keep momentum.`
            : `✓ Completed "${target.title}" (${LIFE_AREAS_CONFIG[target.life_area].name}). Schedule updated in database.`,
        actionTaken: `Completed event ${target.title}`,
        eventUpdates: [{ id: target.id, updates: { status: 'completed' } }],
      };
    }
  }

  // --------------------------------------------------------------------------
  // 20. SINGLE EVENT ACTIONS: SKIP WITH REASON
  // --------------------------------------------------------------------------
  if (lower.startsWith('skip') || lower.includes('skip ')) {
    const target = findMatchingEvent(lower, events, selectedDate);
    if (target) {
      const reasonMatch = trimmed.match(/because\s+(.+)$/i) || trimmed.match(/due to\s+(.+)$/i);
      const reason = reasonMatch ? reasonMatch[1].trim() : 'Skipped via conversational command.';
      return {
        reply:
          coachingMode === 'drill-sergeant'
            ? `⚠️ [SKIP RECORDED IN AUDIT LOG] "${target.title}" skipped. Reason logged: "${reason}". Inaction has consequences. Make up for this in your next block.`
            : `Skipped "${target.title}". Reason logged: "${reason}". Life DB audit updated.`,
        actionTaken: `Skipped event ${target.title}`,
        eventUpdates: [{ id: target.id, updates: { status: 'skipped', skip_reason: reason } }],
      };
    }
  }

  // --------------------------------------------------------------------------
  // 21. SINGLE EVENT ACTIONS: MOVE / RESCHEDULE
  // --------------------------------------------------------------------------
  if (
    /\b(move|reschedule|shift|push)\b/i.test(lower) &&
    !lower.includes('remove') &&
    !lower.includes('delete') &&
    !lower.includes('clear') &&
    !lower.includes('wipe')
  ) {
    const parsedTime = extractTime(trimmed) || '20:00';
    const target = findMatchingEvent(lower, events, selectedDate);

    if (target) {
      const [h, m] = parsedTime.split(':').map(Number);
      const [origSh, origSm] = target.start_time.split(':').map(Number);
      const [origEh, origEm] = target.end_time.split(':').map(Number);
      const durationMin = origEh * 60 + origEm - (origSh * 60 + origSm) || 60;

      const endTotalMin = h * 60 + m + durationMin;
      const endH = Math.floor(endTotalMin / 60) % 24;
      const endM = endTotalMin % 60;
      const newEndTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;

      return {
        reply: `✓ [DIRECT DB MUTATION EXECUTED] Moved "${target.title}" to ${parsedTime} — ${newEndTime} on ${target.date}. Scheduled event updated in dbo.scheduled_events.`,
        actionTaken: `Rescheduled ${target.title} to ${parsedTime}`,
        eventUpdates: [
          {
            id: target.id,
            updates: {
              start_time: parsedTime,
              end_time: newEndTime,
              status: 'rescheduled',
            },
          },
        ],
      };
    }
  }

  // --------------------------------------------------------------------------
  // 22. SINGLE EVENT ACTIONS: DELETE / REMOVE
  // --------------------------------------------------------------------------
  if (
    lower.startsWith('delete') ||
    lower.startsWith('remove') ||
    lower.includes('delete ') ||
    lower.includes('remove ')
  ) {
    const target = findMatchingEvent(lower, events, selectedDate);
    if (target) {
      return {
        reply: `✓ [DIRECT DB MUTATION EXECUTED] Deleted "${target.title}" from dbo.scheduled_events.`,
        actionTaken: `Deleted ${target.title}`,
        eventDeletes: [target.id],
      };
    }
  }

  // --------------------------------------------------------------------------
  // 23. EVENT ACTIONS: ADD / SCHEDULE NEW TASK ("gym 6-7 pm", "6-7 gym", "add gym at 6", "ad prayer at 7 am")
  // --------------------------------------------------------------------------
  const area = detectLifeArea(trimmed);
  const parsedRange = parseTimeAndRange(trimmed);

  const isDirectAddCommand =
    lower.startsWith('add') ||
    lower.startsWith('ad ') ||
    lower.startsWith('schedule') ||
    lower.startsWith('create') ||
    lower.startsWith('plan') ||
    lower.startsWith('set ') ||
    lower.startsWith('put ') ||
    lower.startsWith('make ') ||
    lower.startsWith('keep ') ||
    lower.startsWith('do ') ||
    lower.includes('isgym') ||
    lower.includes('is gym') ||
    (area !== null && (
      parsedRange !== null ||
      lower.includes('today') ||
      lower.includes('tomorrow') ||
      trimmed.split(/\s+/).length <= 2
    ));

  // Case A: User gave a time range like "6-7", "6 to 7", "at 5" but NO life area!
  if (parsedRange !== null && area === null && (
    lower.startsWith('add') ||
    lower.startsWith('set') ||
    lower.startsWith('at ') ||
    lower.startsWith('from ') ||
    /^\d/.test(lower) ||
    trimmed.split(/\s+/).length <= 3
  )) {
    return {
      reply: `❓ **[SELECT LIFE DOMAIN]** You specified the time slot **${parsedRange.startTime} – ${parsedRange.endTime}**. Which domain would you like to schedule?`,
      actionTaken: 'Requested domain clarification for time slot',
      interactiveActions: [
        {
          label: '🏋️ Gym & Physical Training',
          action_type: 'execute_command',
          payload: { command: `add gym at ${parsedRange.startTime}` },
          variant: 'primary',
        },
        {
          label: '💻 Deep Technical Study',
          action_type: 'execute_command',
          payload: { command: `add study at ${parsedRange.startTime}` },
          variant: 'secondary',
        },
        {
          label: '💼 Professional Work',
          action_type: 'execute_command',
          payload: { command: `add work at ${parsedRange.startTime}` },
          variant: 'secondary',
        },
        {
          label: '🙏 Daily Prayer & Alignment',
          action_type: 'execute_command',
          payload: { command: `add prayer at ${parsedRange.startTime}` },
          variant: 'secondary',
        },
      ],
    };
  }

  // Case B: User specified an area (e.g. "add gym", "gym", "work", "prayer", "study") but NO time!
  if (isDirectAddCommand && area !== null && parsedRange === null) {
    const areaEmoji =
      area === 'gym' ? '🏋️' :
      area === 'study' ? '💻' :
      area === 'spiritual' ? '🙏' :
      area === 'work' ? '💼' :
      area === 'diet' ? '🥗' :
      area === 'social' ? '🏸' : '⚖️';

    const areaDefaultTime =
      area === 'gym' ? '6:00 PM – 7:00 PM' :
      area === 'spiritual' ? '5:30 AM – 6:15 AM' :
      area === 'work' ? '9:00 AM – 5:00 PM' :
      area === 'study' ? '2:00 PM – 4:00 PM' :
      '6:00 PM – 7:00 PM';

    const areaDefaultCmd =
      area === 'gym' ? '6-7 pm' :
      area === 'spiritual' ? '5:30 am' :
      area === 'work' ? '9-5' :
      area === 'study' ? '2-4 pm' :
      '6-7 pm';

    const isSpiritual = area === 'spiritual';

    return {
      reply: `❓ **[CLARIFICATION REQUIRED]** You asked to schedule **${LIFE_AREAS_CONFIG[area].name}**, but didn't specify a time or recurrence.\n\nWhen would you like to execute this, and should it apply to **Today only** or your **Whole Week**?`,
      actionTaken: `Requested timing clarification for ${LIFE_AREAS_CONFIG[area].name}`,
      interactiveActions: [
        {
          label: `${areaEmoji} Everyday ${areaDefaultTime} ${isSpiritual ? '(All 7 Days)' : '(Except Sun)'}`,
          action_type: 'execute_command',
          payload: { command: `add ${area} everyday ${areaDefaultCmd} ${isSpiritual ? '' : 'except sunday'}`.trim() },
          variant: 'primary',
        },
        {
          label: `🎯 Today Only (${areaDefaultTime})`,
          action_type: 'execute_command',
          payload: { command: `add ${area} today ${areaDefaultCmd}` },
          variant: 'secondary',
        },
        {
          label: `⚡ Start Right Now (Next 60–90 mins)`,
          action_type: 'execute_command',
          payload: { command: `start ${area} now` },
          variant: 'secondary',
        },
        {
          label: `📅 View Week Calendar`,
          action_type: 'switch_view',
          payload: { view: 'week' },
          variant: 'secondary',
        },
      ],
    };
  }

  // Case C: User specified both area and time ("6-7 gym", "add gym at 6", "ad prayer at 7 am")
  if (isDirectAddCommand && area !== null && parsedRange !== null) {
    const timeRange = parsedRange;
    const priority = area === 'spiritual' || area === 'gym' ? 'P0' : 'P1';
    const cleanTitle = extractCleanTitle(trimmed, area);

    let targetDate = selectedDate;
    if (lower.includes('tomorrow')) {
      const d = new Date(selectedDate);
      d.setDate(d.getDate() + 1);
      targetDate = d.toISOString().split('T')[0];
    } else {
      for (const [dayName, dayIndex] of Object.entries(DAY_NAME_MAP)) {
        if (new RegExp(`\\b(?:on\\s+)?${dayName}\\b`, 'i').test(lower)) {
          targetDate = currentWeekDates[dayIndex];
          break;
        }
      }
    }

    // Deduplicate any existing session in this area on targetDate
    const staleTodayIds = events
      .filter(
        (e) =>
          e.date === targetDate &&
          (e.life_area === area || (area === 'gym' && e.title.toLowerCase().includes('gym')))
      )
      .map((e) => e.id);

    const newEv: Omit<ScheduledEvent, 'id'> = {
      task_id: `custom-${Date.now()}`,
      title: cleanTitle,
      life_area: area,
      priority,
      is_fixed: priority === 'P0',
      date: targetDate,
      start_time: timeRange.startTime,
      end_time: timeRange.endTime,
      status: 'planned',
    };

    const isExplicitSingleDay = lower.includes('today') || lower.includes('tonight') || lower.includes('tomorrow');
    const isPm = parseInt(timeRange.startTime.split(':')[0], 10) >= 12;

    return {
      reply: `✓ [DIRECT DB MUTATION EXECUTED] Scheduled "${cleanTitle}" [${priority}] (${LIFE_AREAS_CONFIG[area].name}) on ${targetDate} from ${timeRange.startTime} to ${timeRange.endTime} in dbo.scheduled_events.${staleTodayIds.length > 0 ? ` Replaced existing ${LIFE_AREAS_CONFIG[area].name} session.` : ''}${
        !isExplicitSingleDay
          ? `\n\n❓ *Would you like this ${timeRange.startTime} – ${timeRange.endTime} routine applied across your whole week as well?*`
          : ''
      }`,
      actionTaken: `Created event ${cleanTitle}`,
      eventDeletes: staleTodayIds,
      eventAdds: [newEv],
      interactiveActions: [
        {
          label: '🔁 Apply Everyday Except Sun (Mon–Sat)',
          action_type: 'execute_command',
          payload: { command: `add ${area} everyday at ${timeRange.startTime} except sunday` },
          variant: 'primary',
        },
        {
          label: '🔁 Apply All 7 Days (Mon–Sun)',
          action_type: 'execute_command',
          payload: { command: `add ${area} everyday at ${timeRange.startTime}` },
          variant: 'secondary',
        },
        ...(isPm
          ? [
              {
                label: '🌅 Switch to Morning (06:00 – 07:00)',
                action_type: 'execute_command' as const,
                payload: { command: `add ${area} today at 06:00` },
                variant: 'secondary' as const,
              },
            ]
          : [
              {
                label: '🌆 Switch to Evening (18:00 – 19:00)',
                action_type: 'execute_command' as const,
                payload: { command: `add ${area} today at 18:00` },
                variant: 'secondary' as const,
              },
            ]),
        {
          label: '📅 View Week Calendar',
          action_type: 'switch_view',
          payload: { view: 'week' },
          variant: 'secondary',
        },
      ],
    };
  }

  // --------------------------------------------------------------------------
  // 24. SCHEDULE QUERY: WHAT'S LEFT TODAY
  // --------------------------------------------------------------------------
  if (
    lower.includes('what is left') ||
    lower.includes("what's left") ||
    lower.includes('remaining') ||
    lower.includes('my schedule')
  ) {
    const pending = events.filter((e) => e.date === selectedDate && e.status === 'planned');
    const overdue = events.filter(
      (e) =>
        (e.status === 'planned' || e.status === 'rescheduled') &&
        e.date === selectedDate &&
        e.end_time < new Date().toTimeString().slice(0, 5)
    );

    const response =
      pending.length === 0
        ? `All scheduled sessions for today are executed. SSSGDW-B protocol protected.`
        : `Schedule Status for ${selectedDate}:\n` +
          (overdue.length > 0 ? `⚠ ${overdue.length} OVERDUE: ${overdue.map((o) => o.title).join(', ')}\n\n` : '') +
          `Remaining Planned Tasks (${pending.length}):\n` +
          pending.map((p) => `• [${p.priority}] ${p.title} (${p.start_time} - ${p.end_time})`).join('\n');

    return {
      reply: response,
      actionTaken: 'Queried remaining schedule',
    };
  }

  // --------------------------------------------------------------------------
  // 25. DYNAMIC INTELLIGENCE & CONTEXTUAL REASONING ENGINE
  // --------------------------------------------------------------------------
  return generateDynamicJarvisResponse({
    input: trimmed,
    userProfile,
    events,
    tasks,
    milestones,
    metrics,
    selectedDate,
    today,
    coachingMode,
    currentView,
    selectedAreaFilter,
  });
}
