/**
 * 消息 / 私聊 API 服务
 * 对应后端 /api/messages/* 路由
 */
import {useHttpToken} from "@/assets/sripts/http_util";

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

export function useMessagesApi() {
    const http = useHttpToken();

    const getConversations = async (): Promise<Conversation[]> => {
        try {
            const res = await http.get('messages/conversations');
            const body = (res as any).data;
            if (body?.code === 0) return (body.data as Conversation[]) || [];
            return [];
        } catch { return []; }
    };

    const getConversation = async (id: number, opts?: { beforeId?: number; limit?: number }): Promise<ConversationDetail | null> => {
        try {
            const params: Record<string, any> = {};
            if (opts?.beforeId) params.beforeId = opts.beforeId;
            if (opts?.limit) params.limit = opts.limit;
            const res = await http.get(`messages/conversation/${id}`, { data: {}, params });
            const body = (res as any).data;
            if (body?.code === 0) return body.data as ConversationDetail;
            return null;
        } catch { return null; }
    };

    const sendMessage = async (peerId: string, content: string, type: MessageItem['type'] = 'user') => {
        try {
            const res = await http.post('messages/send', { data: { peerId, type, content } });
            const body = (res as any).data;
            if (body?.code === 0 || body?.success === 1) return body.data as any;
            return null;
        } catch { return null; }
    };

    const markRead = async (conversationId: number) => {
        try {
            const res = await http.post('messages/read', { data: { conversationId } });
            const body = (res as any).data;
            return body?.code === 0;
        } catch { return false; }
    };

    const markAllRead = async () => {
        try {
            const res = await http.post('messages/read-all');
            const body = (res as any).data;
            return body?.code === 0;
        } catch { return false; }
    };

    const deleteConversation = async (conversationId: number) => {
        try {
            const res = await http.post('messages/delete', { data: { conversationId } });
            const body = (res as any).data;
            return body?.code === 0;
        } catch { return false; }
    };

    const togglePin = async (conversationId: number, pinned: boolean) => {
        try {
            const res = await http.post('messages/pin', { data: { conversationId, pinned } });
            const body = (res as any).data;
            return body?.code === 0;
        } catch { return false; }
    };

    const getUnreadCount = async (): Promise<number> => {
        try {
            const res = await http.get('messages/unread');
            const body = (res as any).data;
            if (body?.code === 0) return Number((body.data as any)?.unreadCount) || 0;
            return 0;
        } catch { return 0; }
    };

    const updateSettings = async (settings: Partial<{ dmEnabled: boolean; notifyMessage: boolean; notifyReply: boolean; notifyLike: boolean }>) => {
        try {
            const res = await http.post('messages/settings', { data: settings });
            const body = (res as any).data;
            if (body?.code === 0) return body.data as any;
            return null;
        } catch { return null; }
    };

    // 拉任意用户公开信息（用于 pendingPeerId 场景显示对方名字）
    const getUserInfo = async (id: string): Promise<{ username: string; alternativeName?: string } | null> => {
        try {
            const res = await http.get(`user/info?id=${encodeURIComponent(id)}`);
            const body = (res as any).data;
            if (body?.success === 1 && body.data) {
                return { username: body.data.username, alternativeName: body.data.alternativeName };
            }
            return null;
        } catch (e) {
            console.warn('[MessagesCenter] getUserInfo failed:', e);
            return null;
        }
    };

    return {getConversations, getConversation, sendMessage, markRead, markAllRead, deleteConversation, togglePin, getUnreadCount, updateSettings, getUserInfo};
}
