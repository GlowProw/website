/**
 * 获取当前应用的主机名
 * 优先读取浏览器 window.location.host，SSR / 构建期读取 .env 中的 APP_HOST / VITE_APP_HOST
 */
export const getAppHost = (): string => {
  if (typeof window !== 'undefined' && window.location?.host) {
    return window.location.host;
  }
  return import.meta.env?.APP_HOST || 'glow-prow.top';
};

/**
 * 获取当前应用的 Origin
 * 优先读取浏览器 window.location.origin，SSR / 构建期根据 APP_HOST 生成
 */
export const getAppOrigin = (): string => {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  const host = getAppHost();
  return host.startsWith('http://') || host.startsWith('https://') ? host : `https://${host}`;
};

/**
 * 获取完整的绝对 URL（如 https://xxx.xxx/codex/item/culverin1）
 */
export const getAppUrl = (path: string = ''): string => {
  const origin = getAppOrigin();
  if (!path) return origin;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${origin}${cleanPath}`;
};

export default {
  getAppHost,
  getAppOrigin,
  getAppUrl
};
