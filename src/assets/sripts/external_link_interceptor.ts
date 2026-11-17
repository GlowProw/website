import type { Router } from 'vue-router';
import { getCurrentLang, DEFAULT_LANG } from '@/config/languages';
import { getAppHost } from './app_host';

// 官方内置安全域名白名单（包括子域名），不会被视为外部链接拦截
const INTERNAL_DOMAINS = [
  'glow-prow.top',
  'localhost',
  '127.0.0.1',
];

/**
 * 判断指定域名是否属于本站或官方内置域名
 * @param hostname 待检测的主机名
 * @param currentHost 当前运行环境的主机名
 */
export const isInternalHost = (hostname: string, currentHost?: string): boolean => {
  if (!hostname) return true;
  const activeHost = currentHost || (typeof window !== 'undefined' ? window.location.hostname : getAppHost());
  
  // 匹配当前域名
  if (hostname === activeHost) {
    return true;
  }

  // 匹配官方根域名或子域名
  for (const domain of INTERNAL_DOMAINS) {
    if (hostname === domain || hostname.endsWith(`.${domain}`)) {
      return true;
    }
  }

  return false;
};

/**
 * 判断指定 URL 是否属于非本站的外部链接
 * @param rawUrl 待检测的链接字符串
 * @param currentHost 当前运行环境主机名（可选，默认读取浏览器环境）
 */
export const isExternalLink = (rawUrl: string, currentHost?: string): boolean => {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return false;
  }

  const trimmed = rawUrl.trim();

  // 站内相对路径、锚点或协议行为直接放行
  if (
    trimmed.startsWith('#') ||
    trimmed.startsWith('/') && !trimmed.startsWith('//') ||
    trimmed.startsWith('./') ||
    trimmed.startsWith('../') ||
    trimmed.startsWith('javascript:') ||
    trimmed.startsWith('mailto:') ||
    trimmed.startsWith('tel:') ||
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('data:')
  ) {
    return false;
  }

  try {
    const baseOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://glow-prow.top';
    const parsed = new URL(trimmed, baseOrigin);

    // 仅针对 http 和 https 网页外链进行安全拦截
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return false;
    }

    return !isInternalHost(parsed.hostname, currentHost);
  } catch {
    return false;
  }
};

/**
 * 解析并校验外部目标链接的安全性与元数据
 * @param rawTarget 待解析的目标链接参数
 */
export const parseExternalTargetUrl = (
  rawTarget: string | string[] | undefined | null
): {
  url: string;
  isValid: boolean;
  hostname: string;
  protocol: string;
} => {
  if (!rawTarget || typeof rawTarget !== 'string') {
    return { url: '', isValid: false, hostname: '', protocol: '' };
  }

  let decoded = rawTarget.trim();
  try {
    decoded = decodeURIComponent(decoded);
  } catch {
    // 解码失败时沿用原始字符串
  }

  try {
    const parsed = new URL(decoded);
    const isValid = parsed.protocol === 'http:' || parsed.protocol === 'https:';
    return {
      url: parsed.href,
      isValid,
      hostname: parsed.hostname,
      protocol: parsed.protocol,
    };
  } catch {
    return { url: decoded, isValid: false, hostname: '', protocol: '' };
  }
};

/**
 * 输出开发者工具控制台防骗与安全警示告示
 */
export const initConsoleSecurityNotice = (): void => {
  if (typeof window === 'undefined') return;

  const titleStyle = 'color: #ff1744; font-size: 26px; font-weight: 900; line-height: 1.5; padding: 4px 0; -webkit-text-stroke: 0.5px black;';
  const bodyStyle = 'color: #ff9800; font-size: 15px; font-weight: bold; line-height: 1.8;';
  const subStyle = 'color: #9e9e9e; font-size: 12px; line-height: 1.6;';

  console.log(
    '%c【安全警告 / SECURITY WARNING】%c\n\n' +
    '不要粘贴任何脚本再此处，任何告诉你需要执行此处脚本都是骗子，不可相信。\n' +
    '请勿在控制台粘贴或运行任何未知来源的代码，谨防账号被盗、虚拟财产损失或隐私泄露！\n\n' +
    '%cDo NOT paste or run any script here! Anyone telling you to execute scripts here is a scammer and cannot be trusted.',
    titleStyle,
    bodyStyle,
    subStyle
  );
};

/**
 * 安装全局外部链接点击拦截监听器
 * 点击任意非本站链接时阻止默认直接跳出，转为跳转到拦截路由告示页面
 * @param router Vue Router 实例
 */
export const setupExternalLinkInterceptor = (router: Router): (() => void) => {
  if (typeof document === 'undefined') {
    return () => {};
  }

  const handleClick = (event: MouseEvent) => {
    // 仅响应鼠标左键或中键点击，右键菜单不拦截
    if (event.button !== 0 && event.button !== 1) {
      return;
    }

    const targetElement = event.target as HTMLElement | null;
    const anchor = targetElement?.closest?.('a');
    if (!anchor) {
      return;
    }

    const href = anchor.getAttribute('href');
    if (!href) {
      return;
    }

    // 显式白名单标记放行（如拦截页面上的继续访问按钮）
    if (
      anchor.hasAttribute('data-external-link-allowed') ||
      anchor.hasAttribute('data-no-intercept') ||
      anchor.classList.contains('no-intercept')
    ) {
      return;
    }

    if (!isExternalLink(href)) {
      return;
    }

    // 拦截外链默认跳出行为
    event.preventDefault();
    event.stopPropagation();

    // 解析出绝对格式的目标网址
    const absoluteTargetUrl = new URL(href, window.location.href).href;

    const currentLang = getCurrentLang() || DEFAULT_LANG;
    const redirectPath = `/${currentLang}/link`;

    // 若原本要求在新标签页打开，或用户按住功能键（Cmd/Ctrl/Shift）/使用滚轮中键
    const openInNewTab =
      anchor.getAttribute('target') === '_blank' ||
      event.ctrlKey ||
      event.metaKey ||
      event.button === 1;

    const encodedTarget = encodeURIComponent(absoluteTargetUrl);
    const destinationUrl = `${redirectPath}?target=${encodedTarget}`;

    if (openInNewTab) {
      window.open(destinationUrl, '_blank', 'noopener,noreferrer');
    } else {
      router.push({
        name: 'LinkRedirect',
        params: { lang: currentLang },
        query: { target: absoluteTargetUrl },
      });
    }
  };

  // 捕获阶段优先截获全局点击事件
  document.addEventListener('click', handleClick, true);

  return () => {
    document.removeEventListener('click', handleClick, true);
  };
};
