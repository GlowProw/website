import {useHttpToken} from "@/assets/sripts/http_util";
import {PaginationParams} from "@/assets/types";
import {ApiError} from "@/assets/types/Api";
import {createApiBase} from "@/assets/sripts/api/api-util";

/**
 * 权限管理接口
 */
export function usePrivilegeApi() {
    const createHttp = () => useHttpToken()
    const http = createHttp()
    const {handleError, handleResponse} = createApiBase()

    /**
     * 授予用户权限
     * @param data 授权参数
     */
    const grantPrivilege = async (data: any) => {
        try {
            const result = await http.post('privilege/grant', {data})
            return handleResponse(result)
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            return handleError(error)
        }
    };

    /**
     * 吊销用户权限
     * @param data 吊销参数
     */
    const revokePrivilege = async (data: any) => {
        try {
            const result = await http.post('privilege/revoke', {data})
            return handleResponse(result)
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            return handleError(error)
        }
    };

    /**
     * 暂停用户权限（临时禁用）
     * @param data 暂停参数
     */
    const suspendPrivilege = async (data: any) => {
        try {
            const result = await http.post('privilege/suspend', {data})
            return handleResponse(result)
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            return handleError(error)
        }
    };

    /**
     * 获取用户的所有权限
     * @param userId 用户ID
     * @param params 查询参数
     */
    const getUserPrivileges = async (userId: string, params?: any) => {
        try {
            const result = await http.get(`privilege/user/${userId}`, {
                params
            })
            return handleResponse(result)
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            return handleError(error)
        }
    };

    /**
     * 检查用户是否拥有特定权限
     * @param userId 用户ID
     * @param privilegeType 权限类型
     */
    const checkPrivilege = async (userId: string, privilegeType: string) => {
        try {
            const result = await http.get(`privilege/check/${userId}/${privilegeType}`)
            return handleResponse(result)
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            return handleError(error)
        }
    };

    /**
     * 获取所有权限类型
     */
    const getPrivilegeTypes = async () => {
        try {
            const result = await http.get('privilege/types')
            return handleResponse(result)
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            return handleError(error)
        }
    };

    /**
     * 批量授予权限
     * @param data 批量授权参数
     */
    const batchGrantPrivilege = async (data: any) => {
        try {
            const result = await http.post('privilege/batch-grant', {data})
            return handleResponse(result)
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            return handleError(error)
        }
    };

    /**
     * 更新权限过期时间
     * @param data 更新参数
     */
    const updatePrivilegeExpiry = async (data: any) => {
        try {
            const result = await http.post('privilege/update-expiry', {data})
            return handleResponse(result)
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            return handleError(error)
        }
    };

    /**
     * 分页查询权限列表（管理员用）
     * @param params 分页和查询参数
     */
    const getPrivileges = async (params?: PaginationParams & {
        userId?: string;
        privilegeType?: string;
        status?: string;
    }) => {
        try {
            const result = await http.get('privilege/list', {
                params
            })
            return handleResponse(result)
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            return handleError(error)
        }
    };

    /**
     * 搜索权限（管理员用）
     * @param keyword 搜索关键词（用户名、用户ID）
     * @param privilegeType 权限类型过滤
     * @param params 分页参数
     */
    const searchPrivileges = async (keyword?: string, privilegeType?: string, params?: PaginationParams) => {
        try {
            const result = await http.get('privilege/search', {
                params: {
                    keyword,
                    privilegeType,
                    ...params
                }
            })
            return handleResponse(result)
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            return handleError(error)
        }
    };

    /**
     * 导出权限列表（管理员用）
     * @param params 导出参数
     */
    const exportPrivileges = async (params?: any) => {
        try {
            const result = await http.get('privilege/export', {
                params,
            })
            return handleResponse(result)
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            return handleError(error)
        }
    };

    return {
        grantPrivilege,
        revokePrivilege,
        suspendPrivilege,
        getUserPrivileges,
        checkPrivilege,
        getPrivilegeTypes,
        batchGrantPrivilege,
        updatePrivilegeExpiry,
        getPrivileges,
        searchPrivileges,
        exportPrivileges
    };
}
