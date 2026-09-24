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
    droppeds?: any;
    year?: number;
    month?: number;
    startDay?: number;
}

export interface CalendarDay {
    day: number;
    events: DayEvent[];
}

export interface FormattedMonth {
    year: number;
    month: number;
    eventCount: number;
    data: CalendarDay[];
}

export interface FormattedCalendar {
    [month: string]: FormattedMonth;
}
