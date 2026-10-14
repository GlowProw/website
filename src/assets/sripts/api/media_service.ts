import { useHttpToken } from "@/assets/sripts/http_util";
import { createApiBase } from "@/assets/sripts/api/api-util";

export interface MediaItem {
    id: string;
    userId: string;
    storageId?: string;
    storageType?: string;
    filename: string;
    ext: string;
    mimeType: string;
    size: number;
    storageKey?: string;
    url: string;
    reuploadCount: number;
    createdTime: string;
    updatedTime: string;
}

export interface MediaQuotaDetail {
    identity: {
        roles: string[];
        tier: string | null;
        multiplier: number;
        unlimited: boolean;
    };
    files: {
        monthly: { used: number; limit: number | null };
        yearly: { used: number; limit: number | null };
    };
    storage: {
        monthly: { used: number; limit: number | null };
        yearly: { used: number; limit: number | null };
        maxFileSize: number;
    };
    reupload: {
        monthly: { used: number; limit: number | null };
        maxPerFile: number;
    };
    storagePool?: {
        uploadDisabled: boolean;
        totalUsedBytes: number;
        quotaBytes: number;
        remainingBytes: number;
    } | null;
}

export function useMediaApi() {
    const createHttp = () => useHttpToken();
    const http = createHttp();
    const { handleError, handleResponse } = createApiBase();

    /**
     * 获取用户媒体配额与容量使用详情
     */
    const getMediaQuota = async (): Promise<MediaQuotaDetail> => {
        try {
            const result = await http.get('media/quota');
            const res = handleResponse(result);
            return (res as any)?.data || res;
        } catch (error) {
            return handleError(error);
        }
    };

    /**
     * 获取媒体列表
     */
    const getMediaList = async (params?: { page?: number; pageSize?: number; keyword?: string }): Promise<{ data: MediaItem[]; pagination: any }> => {
        try {
            const result = await http.get('media/list', { params });
            const res = handleResponse(result);
            const serverPayload = (res as any)?.data?.data || (res as any)?.data || {};
            const listData: MediaItem[] = Array.isArray(serverPayload?.data)
                ? serverPayload.data
                : (Array.isArray(serverPayload) ? serverPayload : []);
            const paginationData = serverPayload?.pagination || {
                page: params?.page || 1,
                pageSize: params?.pageSize || 20,
                totalCount: listData.length,
                totalPages: 1
            };
            return {
                data: listData,
                pagination: paginationData
            };
        } catch (error) {
            return handleError(error);
        }
    };

    /**
     * 小文件单次上传接口 (POST ≤ 340KB)
     */
    const uploadMedia = async (file: File): Promise<MediaItem> => {
        try {
            const formData = new FormData();
            formData.append('file', file);
            const result = await http.post('media/upload', {
                data: formData,
            });
            const res = handleResponse(result);
            return (res as any)?.data?.data || (res as any)?.data;
        } catch (error) {
            return handleError(error);
        }
    };

    /**
     * 大文件分片/分块上传接口 (POST)
     * 将文件切片为指定大小 (如 256KB)，逐一发送到大文件接口并在合并完成后返回
     */
    const uploadLargeMedia = async (
        file: File,
        chunkSize = 256 * 1024,
        onProgress?: (percent: number) => void
    ): Promise<MediaItem> => {
        try {
            const uploadId = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
            const totalChunks = Math.ceil(file.size / chunkSize);
            let lastResult: any = null;

            for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
                const start = chunkIndex * chunkSize;
                const end = Math.min(file.size, start + chunkSize);
                const chunkBlob = file.slice(start, end);

                const formData = new FormData();
                formData.append('chunk', chunkBlob, file.name);
                formData.append('uploadId', uploadId);
                formData.append('chunkIndex', String(chunkIndex));
                formData.append('totalChunks', String(totalChunks));
                formData.append('filename', file.name);
                formData.append('mimeType', file.type || 'image/png');

                const res = await http.post('media/upload/large', {
                    data: formData,
                });
                lastResult = handleResponse(res);

                if (onProgress) {
                    const percent = Math.round(((chunkIndex + 1) / totalChunks) * 100);
                    onProgress(percent);
                }
            }

            return (lastResult as any)?.data?.data || (lastResult as any)?.data;
        } catch (error) {
            return handleError(error);
        }
    };

    /**
     * 重新上传覆盖已有文件 (单文件限10次，月限30次)
     */
    const reuploadMedia = async (uuid: string, file: File): Promise<MediaItem> => {
        try {
            const formData = new FormData();
            formData.append('file', file);
            const result = await http.post(`media/${uuid}/reupload`, {
                data: formData,
            });
            const res = handleResponse(result);
            return (res as any)?.data?.data || (res as any)?.data;
        } catch (error) {
            return handleError(error);
        }
    };

    /**
     * 用户软删除媒体
     */
    const deleteMedia = async (uuid: string) => {
        try {
            const result = await http.del(`media/${uuid}`);
            const res = handleResponse(result);
            return (res as any)?.data?.data || (res as any)?.data;
        } catch (error) {
            return handleError(error);
        }
    };

    return {
        getMediaQuota,
        getMediaList,
        uploadMedia,
        uploadLargeMedia,
        reuploadMedia,
        deleteMedia,
    };
}
