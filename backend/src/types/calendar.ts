export interface GameEventOccurrence {
    month: number;
    day: number;
}

export interface GameEvent {
    id: string;
    name?: string; // Optional name, will use id if not provided
    description?: string; // Optional description
    duration: number; // Duration in days
    occurrences: GameEventOccurrence[];
}

export interface GameEventsData {
    events: { [key: string]: GameEvent };
}
