// team
interface WebSocketMessage {
    type: string;
    payload?: any;
    token?: string;

    [key: string]: any;
}

interface TeamUpData {
    player: string;
    description: string;
    tags: string[];
    createdAt: Date;
    expiresAt: Date;
}
