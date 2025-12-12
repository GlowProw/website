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
    private eventListeners: any = {};

    public start(): void {
        const url = this.buildWebSocketUrl()
        console.log("WebSocket connecting to:", url)
        this.socket = new WebSocket(url)
        this.setupEventHandlers()
    }

    private buildWebSocketUrl(): string {
        return `${http.globalUrl.wsProtocol}://${http.host}:${http.globalUrl.wsPort || ''}${http.globalUrl.wsPathname || ''}`;
    }

    private setupEventHandlers(callback?: any): void {
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

    handleReconnect(callback?: any): void {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`)

            setTimeout(() => {
                const url = this.buildWebSocketUrl()
                this.socket = new WebSocket(url)

                this.setupEventHandlers(({code}: { code: any }) => {
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
    public get connected(): boolean | undefined {
        if (this.socket)
            return this.isConnected && this.socket.readyState === WebSocket.OPEN;
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
        this.eventListeners[event]!.push(listener)
    }

    // 移除事件监听
    public off<K extends keyof WebSocketEventMap>(event: K, listener: WebSocketEventMap[K]): void {
        const listeners = this.eventListeners[event];
        if (listeners) {
            this.eventListeners[event] = listeners.filter((l: any) => l !== listener)
        }
    }

    // 触发事件
    private emit<K extends keyof WebSocketEventMap>(event: K, ...args: Parameters<WebSocketEventMap[K]>): void {
        const listeners = this.eventListeners[event];
        if (listeners) {
            listeners.forEach((listener: any) => listener(...args))
        }
    }

    // 关闭连接
    public close(code?: number, reason?: string): void {
        if (this.socket)
            this.socket.close(code, reason)
    }
}
