/**
 * 头像工具函数
 * 将后端返回的预设头像 ID (如 preset:kraken) 转换为前端真实的静态图片地址
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
    return `/images/avatars/${presetId}.png`;
  }

  // 兼容纯 ID 命名（如 kraken）
  if (trimmed === 'kraken') {
    return '/images/avatars/kraken.png';
  }

  return trimmed;
}

/**
 * 判断给定值是否为预设头像
 * @param {string | null | undefined} avatar 头像地址或预设ID
 * @returns {boolean} 是否为预设头像
 */
export function isPresetAvatar(avatar?: string | null): boolean {
  if (!avatar) return false;
  const trimmed = String(avatar).trim();
  return trimmed.startsWith('preset:') || trimmed === 'kraken';
}
