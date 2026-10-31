/**
 * 消息 / 私聊 API 服务
 * 对应后端 /api/messages/* 路由
 */
import {useHttpToken} from "@/assets/sripts/http_util";
import type {Conversation, ConversationDetail, MessageItem, MessagesPollResult} from "@/assets/types/Message";

export function useMessagesApi() {
    const http = useHttpToken();

    /**
     * 获取会话列表
     */
    const getConversations = async (): Promise<Conversation[]> => {
        try {
            const res = await http.get('messages/conversations');
            const body = (res as any).data;
            if (body?.success === 1 || body?.code === 0) return (body.data as Conversation[]) || [];
            return [];
        } catch { return []; }
    };

    /**
     * 获取单个会话详情与消息
     * @param id 会话 ID
     * @param opts 翻页参数
     */
    const getConversation = async (id: number, opts?: { beforeId?: number; limit?: number }): Promise<ConversationDetail | null> => {
        try {
            const params: Record<string, any> = {};
            if (opts?.beforeId) params.beforeId = opts.beforeId;
            if (opts?.limit) params.limit = opts.limit;
            const res = await http.get(`messages/conversation/${id}`, { data: {}, params });
            const body = (res as any).data;
            if (body?.success === 1 || body?.code === 0) return body.data as ConversationDetail;
            return null;
        } catch { return null; }
    };

    /**
     * 发送私信
     * @param peerId 对方用户 ID
     * @param content 消息内容
     * @param type 消息类型
     */
    const sendMessage = async (peerId: string, content: string, type: MessageItem['type'] = 'user') => {
        try {
            const res = await http.post('messages/send', { data: { peerId, type, content } });
            const body = (res as any).data;
            if (body?.code === 0 || body?.success === 1) return body.data as any;
            return null;
        } catch { return null; }
    };

    /**
     * 标记会话已读
     * @param conversationId 会话 ID
     */
    const markRead = async (conversationId: number) => {
        try {
            const res = await http.post('messages/read', { data: { conversationId } });
            const body = (res as any).data;
            return body?.success === 1 || body?.code === 0;
        } catch { return false; }
    };

    /**
     * 全部标记已读
     */
    const markAllRead = async () => {
        try {
            const res = await http.post('messages/read-all');
            const body = (res as any).data;
            return body?.success === 1 || body?.code === 0;
        } catch { return false; }
    };

    /**
     * 删除会话
     * @param conversationId 会话 ID
     */
    const deleteConversation = async (conversationId: number) => {
        try {
            const res = await http.post('messages/delete', { data: { conversationId } });
            const body = (res as any).data;
            return body?.success === 1 || body?.code === 0;
        } catch { return false; }
    };

    /**
     * 置顶或取消置顶会话
     * @param conversationId 会话 ID
     * @param pinned 是否置顶
     */
    const togglePin = async (conversationId: number, pinned: boolean) => {
        try {
            const res = await http.post('messages/pin', { data: { conversationId, pinned } });
            const body = (res as any).data;
            return body?.success === 1 || body?.code === 0;
        } catch { return false; }
    };

    /**
     * 获取未读消息总数
     */
    const getUnreadCount = async (): Promise<number> => {
        try {
            const res = await http.get('messages/unread');
            const body = (res as any).data;
            if (body?.success === 1 || body?.code === 0) return Number((body.data as any)?.unreadCount) || 0;
            return 0;
        } catch { return 0; }
    };

    /**
     * 消息中心短轮询：会话列表 + 未读总数，可顺带拿回打开会话的增量消息
     */
    const pollMessages = async (params?: { conversationId?: number; afterMessageId?: number }): Promise<MessagesPollResult | null> => {
        try {
            const query: Record<string, number> = {};
            if (params?.conversationId) query.conversationId = params.conversationId;
            if (params?.afterMessageId) query.afterMessageId = params.afterMessageId;
            const res = await http.get('messages/poll', {data: {}, params: query});
            const body = (res as any).data;
            if (body?.success === 1 || body?.code === 0) return body.data as MessagesPollResult;
            return null;
        } catch { return null; }
    };

    /**
     * 更新私信与通知偏好设置
     * @param settings 设置项
     */
    const updateSettings = async (settings: Partial<{ dmEnabled: boolean; notifyMessage: boolean; notifyReply: boolean; notifyLike: boolean }>) => {
        try {
            const res = await http.post('messages/settings', { data: settings });
            const body = (res as any).data;
            if (body?.success === 1 || body?.code === 0) return body.data as any;
            return null;
        } catch { return null; }
    };

    /**
     * 拉取任意用户公开信息（用于 pendingPeerId 场景显示对方名字）
     * @param id 用户 ID
     */
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

    return {getConversations, getConversation, sendMessage, markRead, markAllRead, deleteConversation, togglePin, getUnreadCount, pollMessages, updateSettings, getUserInfo};
}
