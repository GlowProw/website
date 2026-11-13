/**
 * 提示卡片关闭回调类型
 */
export type ItemCardTooltipCloseHandler = () => void;

/**
 * 活动提示卡片记录结构
 */
export interface ActiveItemCardTooltip {
  /**
   * 卡片实例唯一标识
   */
  id: symbol | string | number;
  /**
   * 关闭该卡片的回调函数
   */
  close: ItemCardTooltipCloseHandler;
}

// 当前处于打开状态的提示卡片实例
let activeTooltip: ActiveItemCardTooltip | null = null;

/**
 * 提示卡片全局状态管理器
 * 统一调度全局提示卡片显示状态，保证全站同一时间仅显示一个卡片，避免多卡片同时残留
 */
export const itemCardTooltipManager = {
  /**
   * 注册并打开新的提示卡片
   * 当新卡片准备展示时，会立即强制关闭并重置任何已打开的旧卡片
   *
   * @param id 当前卡片实例唯一标识
   * @param close 当前卡片的关闭回调
   */
  openTooltip(id: symbol | string | number, close: ItemCardTooltipCloseHandler): void {
    if (activeTooltip && activeTooltip.id !== id) {
      const prev = activeTooltip;
      activeTooltip = null;
      try {
        prev.close();
      } catch (err) {
        console.error("关闭旧提示卡片失败", err);
      }
    }
    activeTooltip = {id, close};
  },

  /**
   * 注销提示卡片
   * 仅在注销者为当前激活卡片时清空全局状态
   *
   * @param id 当前卡片实例唯一标识
   */
  closeTooltip(id: symbol | string | number): void {
    if (activeTooltip && activeTooltip.id === id) {
      activeTooltip = null;
    }
  },

  /**
   * 强制关闭当前正在展示的提示卡片
   */
  closeActiveTooltip(): void {
    if (activeTooltip) {
      const prev = activeTooltip;
      activeTooltip = null;
      try {
        prev.close();
      } catch (err) {
        console.error("强制关闭当前提示卡片失败", err);
      }
    }
  },

  /**
   * 获取当前处于打开状态的提示卡片标识
   */
  getActiveTooltipId(): symbol | string | number | null {
    return activeTooltip ? activeTooltip.id : null;
  },
};

// 窗口失去焦点时主动关闭浮动卡片，防止跨应用或切页残留
if (typeof window !== "undefined") {
  window.addEventListener("blur", () => {
    itemCardTooltipManager.closeActiveTooltip();
  });
}

