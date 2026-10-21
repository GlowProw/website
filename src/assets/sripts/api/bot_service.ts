import {ApiError} from "@/assets/types/Api";
import {useHttpToken} from "@/assets/sripts/http_util";
import {createApiBase} from "@/assets/sripts/api/api-util";
import type {
    BotAccountOverview,
    BotAccountStatus,
    BotCommandInfo,
    BotCommandResult,
    BotGroupDetail,
    BotGroupItem,
    BotGroupMembers,
    BotGroupQuota,
    BotGroupSettings,
    BotGroupSignIn,
    BotInstanceOption,
    BotPlatformOption,
    BotPushTargetPlatform
} from "@/assets/types/Bot";

/**
 * 机器人模块 API
 * 所有接口要求登录且具备有效赞助档位
 */
export function useBotApi() {
    const http = useHttpToken();
    const {handleError, handleResponse} = createApiBase();

    /**
     * 查询模块准入状态
     */
    const getStatus = async () => {
        try {
            const result = await http.get('bot-account/status');
            return handleResponse(result) as unknown as { data: { data: BotAccountStatus } };
        } catch (error) {
            if (error instanceof ApiError) throw error;
            return handleError(error);
        }
    };

    /**
     * 查询平台列表
     */
    const getPlatforms = async () => {
        try {
            const result = await http.get('bot-account/platforms');
            return handleResponse(result) as unknown as { data: { data: BotPlatformOption[] } };
        } catch (error) {
            if (error instanceof ApiError) throw error;
            return handleError(error);
        }
    };

    /**
     * 查询机器人列表
     * @param platform 平台标识
     */
    const getBots = async (platform?: string) => {
        try {
            const result = await http.get('bot-account/bots', {params: platform ? {platform} : {}});
            return handleResponse(result) as unknown as { data: { data: BotInstanceOption[] } };
        } catch (error) {
            if (error instanceof ApiError) throw error;
            return handleError(error);
        }
    };

    /**
     * 查询已绑定的群
     */
    const getGroups = async () => {
        try {
            const result = await http.get('bot-account/groups');
            return handleResponse(result) as unknown as { data: { data: BotGroupItem[] } };
        } catch (error) {
            if (error instanceof ApiError) throw error;
            return handleError(error);
        }
    };

    /**
     * 生成群绑定验证码
     * @param data 机器人、群号与管理口令
     */
    const createBindCode = async (data: { botId: number; groupNumber: string; password: string }) => {
        try {
            const result = await http.post('bot-account/groups/bind-code', {data});
            return handleResponse(result) as unknown as { data: { data: { code: string; ttlMinutes: number; instruction: string; botJoined?: boolean } } };
        } catch (error) {
            if (error instanceof ApiError) throw error;
            return handleError(error);
        }
    };

    /**
     * 更新群配置
     * @param id 群记录ID
     * @param data 配置补丁
     */
    const updateGroup = async (id: number, data: Partial<BotGroupSettings>) => {
        try {
            const result = await http.put(`bot-account/groups/${id}`, {data});
            return handleResponse(result);
        } catch (error) {
            if (error instanceof ApiError) throw error;
            return handleError(error);
        }
    };

    /**
     * 删除群绑定
     * @param id 群记录ID
     */
    const deleteGroup = async (id: number) => {
        try {
            const result = await http.del(`bot-account/groups/${id}`);
            return handleResponse(result);
        } catch (error) {
            if (error instanceof ApiError) throw error;
            return handleError(error);
        }
    };

    /**
     * 查询群详情
     * @param id 群记录ID
     */
    const getGroupDetail = async (id: number) => {
        try {
            const result = await http.get(`bot-account/groups/${id}/detail`);
            return handleResponse(result) as unknown as { data: { data: BotGroupDetail } };
        } catch (error) {
            if (error instanceof ApiError) throw error;
            return handleError(error);
        }
    };

    /**
     * 查询群额度
     * @param id 群记录ID
     */
    const getGroupQuota = async (id: number) => {
        try {
            const result = await http.get(`bot-account/groups/${id}/quota`);
            return handleResponse(result) as unknown as { data: { data: BotGroupQuota } };
        } catch (error) {
            if (error instanceof ApiError) throw error;
            return handleError(error);
        }
    };

    /**
     * 查询群签到用户
     * @param id 群记录ID
     */
    const getGroupSignIns = async (id: number) => {
        try {
            const result = await http.get(`bot-account/groups/${id}/signins`);
            return handleResponse(result) as unknown as { data: { data: BotGroupSignIn[] } };
        } catch (error) {
            if (error instanceof ApiError) throw error;
            return handleError(error);
        }
    };

    /**
     * 查询概览统计
     */
    const getOverview = async () => {
        try {
            const result = await http.get('bot-account/overview');
            return handleResponse(result) as unknown as { data: { data: BotAccountOverview } };
        } catch (error) {
            if (error instanceof ApiError) throw error;
            return handleError(error);
        }
    };

    /**
     * 主动刷新群信息与状态
     * @param id 群记录ID
     */
    const refreshGroup = async (id: number) => {
        try {
            const result = await http.post(`bot-account/groups/${id}/refresh`, {data: {}});
            return handleResponse(result) as unknown as { data: { data: BotGroupDetail } };
        } catch (error) {
            if (error instanceof ApiError) throw error;
            return handleError(error);
        }
    };

    /**
     * 立即推送
     * @param id 群记录ID
     * @param type 推送类型
     */
    const pushNow = async (id: number, type: 'daily' | 'drop' | 'teamup') => {
        try {
            const result = await http.post(`bot-account/groups/${id}/push-now`, {data: {type}});
            return handleResponse(result);
        } catch (error) {
            if (error instanceof ApiError) throw error;
            return handleError(error);
        }
    };

    /**
     * 查询群成员
     * @param id 群记录ID
     * @param cursor 分页游标
     */
    const getGroupMembers = async (id: number, cursor: string = '') => {
        try {
            const result = await http.get(`bot-account/groups/${id}/members`, {params: cursor ? {cursor} : {}});
            return handleResponse(result) as unknown as { data: { data: BotGroupMembers } };
        } catch (error) {
            if (error instanceof ApiError) throw error;
            return handleError(error);
        }
    };

    /**
     * 查询机器人支持的指令目录
     * @param id 群记录ID
     */
    const getGroupCommands = async (id: number) => {
        try {
            const result = await http.get(`bot-account/groups/${id}/commands`);
            return handleResponse(result) as unknown as { data: { data: { items: BotCommandInfo[] } } };
        } catch (error) {
            if (error instanceof ApiError) throw error;
            return handleError(error);
        }
    };

    /**
     * 让机器人在群里执行一条指令
     * @param id 群记录ID
     * @param command 指令文本
     */
    const executeGroupCommand = async (id: number, command: string) => {
        try {
            const result = await http.post(`bot-account/groups/${id}/command`, {data: {command}});
            return handleResponse(result) as unknown as { data: { data: BotCommandResult } };
        } catch (error) {
            if (error instanceof ApiError) throw error;
            return handleError(error);
        }
    };

    /**
     * 查询组队同步可选平台与机器人
     */
    const getPushTargets = async () => {
        try {
            const result = await http.get('bot-account/push-targets');
            return handleResponse(result) as unknown as { data: { data: BotPushTargetPlatform[] } };
        } catch (error) {
            if (error instanceof ApiError) throw error;
            return handleError(error);
        }
    };

    return {
        getStatus,
        getPlatforms,
        getBots,
        getGroups,
        createBindCode,
        updateGroup,
        deleteGroup,
        getGroupDetail,
        getGroupQuota,
        getGroupSignIns,
        getOverview,
        refreshGroup,
        pushNow,
        getGroupMembers,
        getGroupCommands,
        executeGroupCommand,
        getPushTargets
    };
}
