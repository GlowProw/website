import {ApiError} from "@/assets/types/Api";
import {useHttpToken} from "@/assets/sripts/http_util";
import {createApiBase} from "@/assets/sripts/api/api-util";
import {
    CommentListParams,
    CreateCommentParams,
    UpdateCommentParams,
    ReplyListParams,
    CreateReplyParams,
    UpdateReplyParams
} from "@/assets/types/Comment";

/**
 * 评论
 */
export function useCommentApi() {
    const http = useHttpToken()
    const {handleError, handleResponse} = createApiBase()

    /**
     * 获取评论列表
     * @param params
     */
    const getComments = async (params: CommentListParams) => {
        try {
            const result = await http.get('comment/comments', {
                params: {
                    targetId: params.targetId,
                    targetType: params.targetType,
                    sort: params.sort,
                    page: params.page,
                    pageSize: params.pageSize,
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
     * 获取回复列表
     * @param params
     */
    const getReplies = async (params: ReplyListParams) => {
        try {
            const result = await http.get('comment/replies', {
                params: {
                    id: params.id,
                    sort: params.sort,
                    page: params.page,
                    pageSize: params.pageSize,
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
     * 创建评论
     * @param data
     */
    const createComment = async (data: CreateCommentParams) => {
        try {
            const result = await http.post('comment', {
                data
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
     * 创建回复
     * @param data
     */
    const createReply = async (data: CreateReplyParams) => {
        try {
            const result = await http.post('comment/reply', {
                data
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
     * 编辑评论
     * @param commentId
     * @param data
     */
    const editComment = async (commentId: string, data: UpdateCommentParams) => {
        try {
            const result = await http.post('comment/edit', {
                data: {
                    id: commentId,
                    content: data.content
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
     * 编辑回复
     * @param replyId
     * @param data
     */
    const editReply = async (replyId: string, data: UpdateReplyParams) => {
        try {
            const result = await http.post('comment/reply/edit', {
                data: {
                    id: replyId,
                    content: data.content
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
     * 删除评论
     * @param commentId
     */
    const deleteComment = async (commentId: string) => {
        try {
            const result = await http.post('comment/delete', {
                data: {
                    id: commentId
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
     * 删除回复
     * @param replyId
     */
    const deleteReply = async (replyId: string) => {
        try {
            const result = await http.post('comment/reply/delete', {
                data: {
                    id: replyId
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

    return {
        getComments,
        getReplies,
        createComment,
        createReply,
        editComment,
        editReply,
        deleteComment,
        deleteReply,
    };
}
