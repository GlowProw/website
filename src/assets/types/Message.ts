/**
 * 站内消息会话相关类型
 */

export interface Conversation {
    id: number;
    userId: string;
    peerId: string;
    type: 'user' | 'system';
    peerName: string | null;
    lastMessage: string | null;
    lastTime: string;
    unreadCount: number;
    pinned: number;
    muted: number;
    valid: number;
}

export interface MessageItem {
    id: number;
    conversationId: number;
    type: 'user' | 'reply' | 'like' | 'warn' | 'info';
    senderId: string | null;
    receiverId: string;
    content: string;
    valid: number;
    createdTime: string;
}

export interface ConversationDetail {
    conversation: Conversation;
    messages: MessageItem[];
    total: number;
}

/**
 * 消息中心一次短轮询拿回的增量数据
 */
export interface MessagesPollResult {
    conversations: Conversation[];
    // 当前打开会话中晚于本地最后一条的新消息，未打开会话时为空数组
    messages: MessageItem[];
    unreadCount: number;
}
