import type {AssemblyListParams, EditAssemblyData, PublishAssemblyData} from '@/assets/types/Assembly';
import {useHttpToken} from "@/assets/sripts/http_util";
import {PaginationParams} from "@/assets/types";
import {createApiBase} from "@/assets/sripts/api/api-util";

/**
 * 配装接口
 */
export function useAssemblyApi() {
    const createHttp = () => useHttpToken();
    const http = createHttp();
    const {handleError, handleResponse} = createApiBase();

    /**
     * 发布组件
     */
    const publishAssembly = async (data: PublishAssemblyData) => {
        try {
            const result = await http.post('assembly/publish', {data});
            return handleResponse(result);
        } catch (error) {
            return handleError(error);
        }
    };

    /**
     * 获取组件列表
     */
    const getAssemblyList = async (params?: AssemblyListParams & PaginationParams) => {
        try {
            const result = await http.get('assembly/list', {params});
            return handleResponse(result);
        } catch (error) {
            return handleError(error);
        }
    };

    /**
     * 获取组件详情
     */
    const getAssemblyItem = async (assemblyId: string) => {
        try {
            const result = await http.get(`assembly/item/${assemblyId}`);
            return handleResponse(result);
        } catch (error) {
            return handleError(error);
        }
    };

    /**
     * 编辑组件
     */
    const editAssembly = async (assemblyId: string, data: EditAssemblyData) => {
        try {
            const result = await http.put(`assembly/edit/${assemblyId}`, {data});
            return handleResponse(result);
        } catch (error) {
            return handleError(error);
        }
    };

    /**
     * 删除组件
     */
    const deleteAssembly = async (assemblyId: string): Promise<void> => {
        try {
            await http.del(`assembly/delete/${assemblyId}`);
        } catch (error) {
            return handleError(error);
        }
    };

    /**
     * 获取组件属性
     */
    const getAssemblyAttr = async (assemblyId: string) => {
        try {
            const result = await http.get(`assembly/attr/${assemblyId}`);
            return handleResponse(result);
        } catch (error) {
            return handleError(error);
        }
    };

    /**
     * 编辑组件属性
     */
    const editAssemblyAttr = async (assemblyId: string, attrData: any) => {
        try {
            const result = await http.put(`assembly/attr/edit/${assemblyId}`, {
                data: attrData
            });
            return handleResponse(result);
        } catch (error) {
            return handleError(error);
        }
    };

    /**
     * 获取用户组件
     */
    const getUserAssemblies = async (userId?: string, pagination?: PaginationParams) => {
        try {
            const url = userId ? 'user/space/assemblys' : 'user/me/assemblys';
            const result = await http.get(url, {
                params: {...pagination, userId}
            });
            return handleResponse(result);
        } catch (error) {
            return handleError(error);
        }
    };

    return {
        publishAssembly,
        getAssemblyList,
        getAssemblyItem,
        editAssembly,
        deleteAssembly,
        getAssemblyAttr,
        editAssemblyAttr,
        getUserAssemblies,
    };
}
