import type {useNoticeStore} from "~/stores/noticeStore";
import type {ReviewResult} from "@/assets/types/Review";

/**
 * 根据内容审查结果给出提示，被拒绝时用阻断弹窗展示原因
 * @param review 后端返回的审查结果
 * @param notice 全局通知状态机
 * @param t 国际化翻译方法
 * @returns 内容是否被接受，拒绝时返回 false
 */
export const notifyReviewResult = (
    review: ReviewResult | null | undefined,
    notice: ReturnType<typeof useNoticeStore>,
    t: (key: string, params?: Record<string, unknown>) => string
): boolean => {
    if (!review || review.status === 'approved') return true;

    const reason = review.reason
        ? t('basic.review.reason', {reason: review.reason})
        : t('basic.review.unknownReason');

    if (review.status === 'rejected') {
        notice.warning(`${t('basic.review.rejectedDetail')}\n${reason}`, {
            title: t('basic.review.rejectedTitle')
        });
        return false;
    }

    notice.info(t('basic.review.pendingDetail'), {
        title: t('basic.review.pendingTitle'),
        mode: 'minimal'
    });
    return true;
};
