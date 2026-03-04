export interface EventOccurrence {
    month: number;
    day: number;
}

export interface CalendarEvent {
    id: string;
    name: string;
    description: string;
    duration: number;
    occurrences: EventOccurrence[];
}

export interface CalendarData {
    events: {
        [key: string]: CalendarEvent;
    };
}

export interface DayEvent {
    id: string;
    name: string;
    description: string;
    duration: number;
    isStart: boolean;
}

export interface CalendarDay {
    day: number;
    events: DayEvent[];
}

export interface FormattedCalendar {
    [month: string]: {
        data: CalendarDay[];
    };
}
