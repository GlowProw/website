import {CaptchaParams} from "@/assets/types/Captcha";

export type CommentSortType = 'composite' | 'latest' | 'hot';

/**
 * 评论
 */
export interface Comment {
    id: string;
    content: string;
    userId: string;
    userName?: string;
    username?: string;
    userAvatar?: string;
    createTime?: string;
    createdTime?: string;
    likeCount?: number;
    replyCount?: number;
    isLiked?: boolean;
    spam?: number;
    reviewStatus?: number;
    likeLoading?: boolean;
    deleteLoading?: boolean;
    isEdit?: boolean;
    editContent?: string;
    loading?: boolean;
    showReplyInput?: boolean;
    replyContent?: string;
    replyPushLoading?: boolean;
    showReplies?: boolean;
    repliesLoading?: boolean;
    replies?: CommentReply[];
    previewReplies?: CommentReply[];
    paginatedReplies?: CommentReply[];
    isExpandedAll?: boolean;
    replyPage?: number;
    replyPageSize?: number;
    replyTotalPages?: number;
    repliesTotalCount?: number;
}

/**
 * 评论回复
 */
export interface CommentReply {
    id: string;
    commentId: string;
    userId: string;
    username?: string;
    userAvatar?: string;
    content: string;
    createdTime: string;
    updatedTime?: string;
    spam?: number;
    reviewStatus?: number;
    likeCount?: number;
    isLiked?: boolean;
    likeLoading?: boolean;
    deleteLoading?: boolean;
    isEdit?: boolean;
    editContent?: string;
    loading?: boolean;
}

/**
 * 评论列表请求体
 */
export interface CommentListParams {
    targetId: string | number | null | unknown;
    targetType: string | number | null | unknown;
    page?: number;
    pageSize?: number;
    sort?: CommentSortType;
}

/**
 * 回复列表请求体
 */
export interface ReplyListParams {
    id: string;
    sort?: 'hot' | 'latest' | 'asc';
    page?: number;
    pageSize?: number;
}

/**
 * 创建回复请求体
 */
export interface CreateReplyParams {
    commentId: string;
    content: string;
}

/**
 * 更新回复请求体
 */
export interface UpdateReplyParams {
    content: string;
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

export type commentTargetType = 'assembly' | 'item' | 'commoditie' | 'ship' | 'ultimate' | 'mod' | 'material' | 'set' | 'treasureMap' | 'npc' | 'mapLocation' | 'cosmetic' | 'empireSkill' | 'mastery' | 'quest' | 'rankingDesigned' | 'enemy'
