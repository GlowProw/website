// 预设头像路径映射表
export const PRESET_AVATARS_MAP: Record<string, string> = {
  kraken: '/images/avatars/kraken.png',
  vikramRajan: '/images/avatars/vikramRajan.webp',
  hubacTwins: '/images/avatars/hubacTwins.webp',
  long: '/images/avatars/long.webp',
  liTianning: '/images/avatars/liTianning.webp',
  laPeste: '/images/avatars/laPeste.webp',
};

/**
 * 头像工具函数
 * 将后端返回的预设头像 ID (如 preset:kraken 或 preset:vikramRajan) 转换为前端真实的静态图片地址
 *
 * @param {string | null | undefined} avatar 头像地址或预设ID
 * @returns {string} 可直接访问的图片URL
 */
export function normalizeAvatarUrl(avatar?: string | null): string {
  if (!avatar) return '';
  const trimmed = String(avatar).trim();
  if (!trimmed) return '';

  // 预设头像 ID（如 preset:kraken）映射到前端静态资源路径
  if (trimmed.startsWith('preset:')) {
    const presetId = trimmed.slice(7).trim();
    return PRESET_AVATARS_MAP[presetId] || `/images/avatars/${presetId}.webp`;
  }

  // 兼容纯 ID 命名（如 kraken, vikramRajan 等）
  if (PRESET_AVATARS_MAP[trimmed]) {
    return PRESET_AVATARS_MAP[trimmed];
  }

  return trimmed;
}

/**
 * 判断给定值是否为预设头像
 *
 * @param {string | null | undefined} avatar 头像地址或预设ID
 * @returns {boolean} 是否为预设头像
 */
export function isPresetAvatar(avatar?: string | null): boolean {
  if (!avatar) return false;
  const trimmed = String(avatar).trim();
  if (trimmed.startsWith('preset:')) return true;
  return Boolean(PRESET_AVATARS_MAP[trimmed]);
}

/**
 * 从预设头像标识符或路径解析出预设 ID
 * 例如 "preset:kraken" -> "kraken"、"/images/avatars/kraken.png" -> "kraken"
 *
 * @param {string | null | undefined} avatar 头像地址或预设ID
 * @returns {string} 预设 ID，非预设头像时返回空串
 */
export function extractPresetId(avatar?: string | null): string {
  if (!avatar) return '';
  const trimmed = String(avatar).trim();
  if (!trimmed) return '';

  if (trimmed.startsWith('preset:')) {
    return trimmed.slice(7).trim();
  }

  // 兼容直接传入已知预设 ID 或静态资源路径
  const matched = Object.keys(PRESET_AVATARS_MAP).find(
    (id) => id === trimmed || PRESET_AVATARS_MAP[id] === trimmed
  );
  return matched || '';
}
