export interface GameEventOccurrence {
    month: number;
    day: number;
}

export interface GameEvent {
    id: string;
    name?: string;
    description?: string; // Optional description
    duration: number;
    occurrences: GameEventOccurrence[];
}

export interface GameEventsData {
    events: { [key: string]: GameEvent };
}
