/**
 * 图鉴详情页快捷键
 * 为各分类详情页统一提供收藏、复制名称、分享、上下一件与新窗口打开
 */
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { useAuthStore } from '~/stores/userAccountStore';
import { useCollectionStore } from '~/stores/collectionStore';
import { useNoticeStore } from '~/stores/noticeStore';
import { usePageHotkeys } from '@/assets/sripts/page_hotkeys';
import { getCodexDetailPath } from '@/assets/sripts/codex_detail';
import type { CodexDetailHotkeysOptions } from '@/assets/types/Codex';

/**
 * 注册图鉴详情页快捷键
 * @param options 当前详情页的目标类型、ID、名称与同分类条目清单
 */
export function useCodexDetailHotkeys(options: CodexDetailHotkeysOptions) {
  const { t } = useI18n();
  const router = useRouter();
  const authStore = useAuthStore();
  const collectionStore = useCollectionStore();
  const noticeStore = useNoticeStore();

  /**
   * 切换当前图鉴的收藏状态
   */
  const onToggleCollect = async () => {
    const targetId = options.targetId();
    if (!targetId) return;
    try {
      const collected = await collectionStore.onToggle(options.targetType, targetId);
      if (authStore.isLogin) {
        noticeStore.success(collected ? t('codex.item.collectedOn') : t('codex.item.collectedOff'), { mode: 'minimal' });
      } else {
        noticeStore.success(t('codex.item.collectionLocalSaved'), { mode: 'minimal' });
      }
    } catch (e: any) {
      noticeStore.error(e?.message || t('codex.item.collectedFailed'));
    }
  };

  /**
   * 复制当前图鉴名称
   */
  const onCopyName = async () => {
    const name = options.targetName();
    if (!name) return;
    try {
      await navigator.clipboard.writeText(name);
      noticeStore.success(t('basic.tips.copySuccess'), { mode: 'minimal' });
    } catch (e: any) {
      noticeStore.error(t('basic.tips.copyFailed'));
    }
  };

  /**
   * 复制当前图鉴分享链接
   */
  const onShare = async () => {
    try {
      const url = typeof window !== 'undefined' ? window.location.href : '';
      if (!url) return;
      await navigator.clipboard.writeText(url);
      noticeStore.success(t('basic.tips.copySuccess'), { mode: 'minimal' });
    } catch (e: any) {
      noticeStore.error(t('basic.tips.copyFailed'));
    }
  };

  /**
   * 跳转到当前分类中的相邻条目
   * @param step 偏移量，-1 为上一件，1 为下一件
   */
  const onSwitchItem = (step: number) => {
    if (!options.list) return;
    const list = options.list();
    if (list.length <= 0) return;
    const currentId = options.targetId();
    const currentIndex = list.findIndex(item => item.id === currentId);
    if (currentIndex < 0) return;
    const nextIndex = (currentIndex + step + list.length) % list.length;
    const nextId = list[nextIndex]?.id;
    if (!nextId) return;
    router.push(getCodexDetailPath(options.targetType, nextId)).catch(() => {
    });
  };

  /**
   * 在新窗口打开当前图鉴详情
   */
  const onOpenNewWindow = () => {
    if (typeof window === 'undefined' || !options.targetId()) return;
    window.open(window.location.href, '_blank');
  };

  usePageHotkeys({
    codexCollect: onToggleCollect,
    codexCopyName: onCopyName,
    codexShare: onShare,
    codexPrevItem: () => onSwitchItem(-1),
    codexNextItem: () => onSwitchItem(1),
    codexOpenNewWindow: onOpenNewWindow,
  });
}

export default useCodexDetailHotkeys;
