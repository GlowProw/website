import {CaptchaParams} from "@/assets/types/Captcha";

/**
 * 评论
 */
export interface Comment {
    id: string;
    content: string;
    userId: string;
    userName?: string;
    userAvatar?: string;
    createTime: string;
    likeCount?: number;
    replyCount?: number;
    isLiked?: boolean;
}

/**
 * 评论列表请求体
 */
export interface CommentListParams {
    targetId: string | number | null | unknown,
    targetType: string | number | null | unknown,
}

/**
 * 创建评论请求体
 */
export interface CreateCommentParams {
    targetId: string | number | null | unknown,
    targetType: string | number | null | unknown,
    content: string,
    captcha: CaptchaParams,
}

/**
 * 更新评论请求体
 */
export interface UpdateCommentParams {
    content: string;
}
