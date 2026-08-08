import {http} from "./index";

type WebSocketEventMap = {
    open: (event: Event) => void;
    close: (event: CloseEvent) => void;
    error: (event: Event) => void;
    message: (event: MessageEvent) => void;
};

export default class Ws {
    socket: WebSocket | undefined;
    private isConnected: boolean = false;
    reconnectAttempts: number = 0;
    private maxReconnectAttempts: number = 3;
    private reconnectInterval: number = 5000; // 5秒
    private eventListeners: Partial<Record<keyof WebSocketEventMap, Function[]>> = {};

    public start(): void {
        if (this.socket && (this.socket.readyState === WebSocket.CONNECTING || this.socket.readyState === WebSocket.OPEN)) {
            console.log("WebSocket already connected or connecting");
            return;
        }

        try {
            const url = this.buildWebSocketUrl();
            console.log("WebSocket connecting to:", url);
            this.socket = new WebSocket(url);
            this.setupEventHandlers();
        } catch (e) {
            console.error("WebSocket connection error:", e);
            this.isConnected = false;
            this.emit('error', e as any);
        }
    }

    private buildWebSocketUrl(): string {
        try {
            const globalUrl = http.globalUrl || {};
            const protocol = globalUrl.wsProtocol || (window.location.protocol === 'https:' ? 'wss' : 'ws');
            const host = globalUrl.wsHost || globalUrl.host || window.location.hostname;
            const wsPort = (globalUrl.wsPort !== undefined && globalUrl.wsPort !== null && globalUrl.wsPort !== '') 
                ? globalUrl.wsPort 
                : globalUrl.port;
            const portStr = (wsPort !== undefined && wsPort !== null && wsPort !== '') ? `:${wsPort}` : '';
            const pathname = globalUrl.wsPathname !== undefined ? globalUrl.wsPathname : '';

            return `${protocol}://${host}${portStr}${pathname}`;
        } catch (e) {
            const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
            return `${protocol}://${window.location.host}/ws`;
        }
    }

    private setupEventHandlers(callback?: (result: { code: number }) => void): void {
        if (this.socket)
            this.socket.onopen = (event) => {
                this.isConnected = true;
                this.reconnectAttempts = 0;
                this.emit('open', event)
                console.log("WebSocket connected")

                if (callback)
                    callback({code: 0})
            };

        if (this.socket)
            this.socket.onclose = (event) => {
                this.isConnected = false;
                this.emit('close', event)
                console.log("WebSocket disconnected")
                this.handleReconnect()

                if (callback)
                    callback({code: -1})
            };

        if (this.socket)
            this.socket.onerror = (event) => {
                this.emit('error', event)
                console.error("WebSocket error:", event)

                if (callback)
                    callback({code: -1})
            };

        if (this.socket)
            this.socket.onmessage = (event) => {
                this.emit('message', event)
            };
    }

    handleReconnect(callback?: (result: { code: number }) => void): void {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`)

            setTimeout(() => {
                const url = this.buildWebSocketUrl()
                this.socket = new WebSocket(url)

                this.setupEventHandlers(({code}) => {
                    if (callback)
                        callback({code})
                })

                if (callback)
                    callback({code: 0})
            }, this.reconnectInterval)
        } else {
            console.log("Max reconnection attempts reached")
            if (callback)
                callback({code: -1})
        }
    }

    // 检查连接状态
    public get connected(): boolean {
        if (this.socket)
            return this.isConnected && this.socket.readyState === WebSocket.OPEN;
        return false;
    }

    // 获取原生 WebSocket 客户端
    public get client(): WebSocket | undefined {
        return this.socket;
    }

    // 发送消息
    public send(data: string | ArrayBuffer | Blob | ArrayBufferView): boolean {
        if (this.connected) {
            if (this.socket)
                this.socket.send(data)
            return true;
        }
        console.warn("Cannot send message - WebSocket is not connected")
        return false;
    }

    // 添加事件监听
    public on<K extends keyof WebSocketEventMap>(event: K, listener: WebSocketEventMap[K]): void {
        if (!this.eventListeners[event]) {
            this.eventListeners[event] = [];
        }
        this.eventListeners[event]!.push(listener as Function)
    }

    // 移除事件监听
    public off<K extends keyof WebSocketEventMap>(event: K, listener: WebSocketEventMap[K]): void {
        const listeners = this.eventListeners[event];
        if (listeners) {
            this.eventListeners[event] = listeners.filter((l) => l !== listener)
        }
    }

    // 触发事件
    private emit<K extends keyof WebSocketEventMap>(event: K, ...args: Parameters<WebSocketEventMap[K]>): void {
        const listeners = this.eventListeners[event];
        if (listeners) {
            listeners.forEach((listener) => (listener as Function)(...args))
        }
    }

    // 关闭连接
    public close(code?: number, reason?: string): void {
        this.isConnected = false;
        if (this.socket) {
            this.socket.close(code, reason);
            this.socket = undefined;
        }
    }
}
