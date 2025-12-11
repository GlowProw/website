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
     * @param data
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
     * 获取配装列表
     * @param params
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
     * 获取配装详情
     * @param assemblyUuid
     * @param options
     */
    const getAssemblyItem = async (assemblyUuid: string, options?: {
        password?: string | null,
        force?: boolean
    }) => {
        try {
            const result = await http.get(`assembly/item`, {
                params: {
                    uuid: assemblyUuid,
                    password: options?.password
                },
                data: {
                    force: options?.force
                }
            });
            return handleResponse(result);
        } catch (error) {
            return handleError(error);
        }
    };

    /**
     * 编辑配装
     * @param data
     */
    const editAssembly = async (data: EditAssemblyData) => {
        try {
            const result = await http.put(`assembly/edit`, {data});
            return handleResponse(result);
        } catch (error) {
            return handleError(error);
        }
    };

    /**
     * 删除组件
     * @param assemblyUuid
     */
    const deleteAssembly = async (assemblyUuid: string) => {
        try {
            const result = await http.post(`assembly/delete`, {
                data: {uuid: assemblyUuid}
            });
            return handleResponse(result);
        } catch (error) {
            return handleError(error);
        }
    };

    /**
     * 获取组件属性
     */
    const getAssemblyAttr = async (assemblyUuid: string) => {
        try {
            const result = await http.get(`assembly/attr`, {
                params: {
                    uuid: assemblyUuid
                }
            });
            return handleResponse(result);
        } catch (error) {
            return handleError(error);
        }
    };

    /**
     * 编辑组件属性
     */
    const editAssemblyAttr = async (assemblyUuid: string, attrData: any) => {
        try {
            const result = await http.post(`assembly/attr/edit`, {
                data: {
                    uuid: assemblyUuid,
                    ...attrData
                }
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
