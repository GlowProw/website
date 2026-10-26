import { useHttpToken } from "@/assets/sripts/http_util";
import { PaginationParams } from "@/assets/types";
import { createApiBase } from "@/assets/sripts/api/api-util";

export interface RankingDesignedListParams extends PaginationParams {
    keyword?: string;
    tag?: string;
    sortField?: "updatedTime" | "createdTime" | "likes" | "views";
    sortOrder?: "asc" | "desc";
    userId?: string;
}

export interface PublishRankingData {
    name: string;
    description?: string;
    tags?: string[];
    data: any;
    attr?: any;
    visibility?: "publicly" | "private" | "unlisted";
}

/**
 * 物品天梯榜单接口
 */
export function useRankingDesignedApi() {
    const createHttp = () => useHttpToken();
    const http = createHttp();
    const { handleError, handleResponse } = createApiBase();

    /**
     * 发布天梯榜单
     * @param data 发布负载
     */
    const publishRanking = async (data: PublishRankingData) => {
        try {
            const result = await http.post("rankingDesigned/publish", { data });
            return handleResponse(result);
        } catch (error) {
            return handleError(error);
        }
    };

    /**
     * 编辑天梯榜单
     * @param uuid 榜单唯一标识
     * @param data 更新负载
     */
    const editRanking = async (uuid: string, data: Partial<PublishRankingData>) => {
        try {
            const result = await http.put(`rankingDesigned/edit/${uuid}`, { data });
            return handleResponse(result);
        } catch (error) {
            return handleError(error);
        }
    };

    /**
     * 获取天梯榜单列表
     * @param params 过滤分页参数
     */
    const getRankingList = async (params?: RankingDesignedListParams) => {
        try {
            const result = await http.get("rankingDesigned/list", { params });
            return handleResponse(result);
        } catch (error) {
            return handleError(error);
        }
    };

    /**
     * 获取天梯榜单详情
     * @param uuid 榜单全局标识
     */
    const getRankingItem = async (uuid: string) => {
        try {
            const result = await http.get(`rankingDesigned/item/${uuid}`);
            return handleResponse(result);
        } catch (error) {
            return handleError(error);
        }
    };

    /**
     * 删除天梯榜单
     * @param uuid 榜单唯一标识
     */
    const deleteRanking = async (uuid: string) => {
        try {
            const result = await http.delete(`rankingDesigned/${uuid}`);
            return handleResponse(result);
        } catch (error) {
            return handleError(error);
        }
    };

    /**
     * 点赞或取消点赞天梯榜单
     * @param uuid 榜单唯一标识
     */
    const toggleLike = async (uuid: string) => {
        try {
            const result = await http.post("likes/toggle", {
                data: {
                    targetType: "rankingDesigned",
                    targetId: uuid,
                },
            });
            return handleResponse(result);
        } catch (error) {
            return handleError(error);
        }
    };

    /**
     * 获取天梯属性配置（对齐 AssemblySettingPanel）
     * @param uuid 天梯唯一标识
     */
    const getRankingAttr = async (uuid: string) => {
        try {
            const result = await http.get("rankingDesigned/attr", {
                params: { uuid },
            });
            return handleResponse(result);
        } catch (error) {
            return handleError(error);
        }
    };

    /**
     * 编辑天梯属性配置（对齐 AssemblySettingPanel）
     * @param uuid 天梯唯一标识
     * @param attrData 属性数据
     */
    const editRankingAttr = async (uuid: string, attrData: any) => {
        try {
            const result = await http.post("rankingDesigned/attr/edit", {
                data: {
                    uuid,
                    ...attrData,
                },
            });
            return handleResponse(result);
        } catch (error) {
            return handleError(error);
        }
    };

    /**
     * 克隆天梯榜单
     * @param uuid 榜单全局标识
     * @param name 可选自定义名称
     */
    const cloneRanking = async (uuid: string, name?: string) => {
        try {
            const result = await http.post("rankingDesigned/clone", { uuid, name });
            return handleResponse(result);
        } catch (error) {
            return handleError(error);
        }
    };

    return {
        publishRanking,
        editRanking,
        cloneRanking,
        getRankingList,
        getRankingItem,
        deleteRanking,
        toggleLike,
        getRankingAttr,
        editRankingAttr,
    };
}
