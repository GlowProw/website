import Storage from './storage';

const _storage = new Storage();

/**
 * 获取或生成浏览器持久指纹
 */
export function getBrowserFingerprint(): string {
  try {
    const stored = _storage.local.get('browser_fingerprint');
    if (stored && stored.code === 0 && stored.data && stored.data.value) {
      return stored.data.value;
    }

    const nav = typeof navigator !== 'undefined' ? navigator : {} as any;
    const scr = typeof screen !== 'undefined' ? screen : {} as any;

    const screenStr = scr.width ? `${scr.width}x${scr.height}x${scr.colorDepth}` : 'unknown_screen';
    const userAgent = nav.userAgent || 'unknown_ua';
    const language = nav.language || 'unknown_lang';
    const timezone = new Date().getTimezoneOffset();

    const rawInfo = `${userAgent}|${language}|${screenStr}|${timezone}`;
    
    // 生成简易 Hash 标识
    let hash = 0;
    for (let i = 0; i < rawInfo.length; i++) {
      const char = rawInfo.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0;
    }

    const randomPart = Math.random().toString(36).substring(2, 10);
    const fingerprint = `fp_${Math.abs(hash).toString(36)}_${randomPart}_${Date.now().toString(36)}`;

    _storage.local.set('browser_fingerprint', fingerprint);
    return fingerprint;
  } catch (e) {
    console.error('Failed to generate browser fingerprint:', e);
    return 'fp_fallback_' + Date.now();
  }
}
