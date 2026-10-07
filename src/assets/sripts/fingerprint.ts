import Storage from './storage';

const _storage = new Storage();

/** 持久客户端唯一标识（跨会话、跨重启） */
const CLIENT_ID_KEY = 'glow_prow_client_id';
/** 会话唯一标识（关闭标签页后失效） */
const SESSION_ID_KEY = 'glow_prow_session_id';

/**
 * 简易 32 位 hash（升级版 FNV-1a 变体，多轮扩散）
 */
function multiRoundHash(input: string, rounds = 3): string {
  let hash = 0;
  for (let r = 0; r < rounds; r++) {
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char + r * 31;
      hash |= 0;
    }
    // 混入时间戳片段进一步扩散
    hash = (hash ^ (hash >>> 13)) * 1274126177;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

/**
 * 收集尽量多的浏览器/设备特征，用于生成更稳定的指纹
 */
function collectBrowserFeatures(): Record<string, string> {
  const nav = typeof navigator !== 'undefined' ? navigator : ({} as any);
  const scr = typeof screen !== 'undefined' ? screen : ({} as any);
  const win = typeof window !== 'undefined' ? window : ({} as any);

  const canvasFp = (() => {
    try {
      const c = document.createElement('canvas');
      c.width = 200; c.height = 50;
      const ctx = c.getContext('2d');
      if (!ctx) return 'no_canvas';
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillStyle = '#f60';
      ctx.fillRect(125, 1, 62, 20);
      ctx.fillStyle = '#069';
      ctx.fillText('GlowProw-FP-π', 2, 15);
      ctx.fillStyle = 'rgba(102,204,0,0.7)';
      ctx.fillText('GlowProw-FP-π', 4, 17);
      return c.toDataURL().slice(-32);
    } catch {
      return 'canvas_blocked';
    }
  })();

  const audioFp = (() => {
    try {
      const AC = (win.AudioContext || win.webkitAudioContext);
      if (!AC) return 'no_audio';
      const ctx = new AC();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      gain.gain.value = 0.01;
      osc.frequency.value = 440;
      osc.type = 'sine';
      osc.start(); osc.stop(ctx.currentTime + 0.01);
      const data = ctx.sampleRate + '-' + ctx.state;
      ctx.close().catch(() => {});
      return data;
    } catch {
      return 'audio_blocked';
    }
  })();

  return {
    ua: nav.userAgent || 'unknown_ua',
    platform: nav.platform || 'unknown_plat',
    language: nav.language || 'unknown_lang',
    languages: (nav.languages || []).join(','),
    screen: scr.width ? `${scr.width}x${scr.height}x${scr.colorDepth}` : 'unknown_screen',
    viewport: win.innerWidth ? `${win.innerWidth}x${win.innerHeight}` : 'unknown_vp',
    dpr: (win.devicePixelRatio || 1).toString(),
    tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
    tzOffset: new Date().getTimezoneOffset().toString(),
    canvas: canvasFp,
    audio: audioFp,
    hardwareConcurrency: (nav.hardwareConcurrency || 0).toString(),
    maxTouchPoints: (nav.maxTouchPoints || 0).toString(),
    vendor: nav.vendor || '',
  };
}

/**
 * 生成 Client ID：
 *   前缀 + 多轮特征 hash(更稳定) + 24 位随机 + base36 时间戳
 *   总长度约 60+ 字符，远长于旧版 fp_* 格式
 */
function generateClientId(): string {
  const features = collectBrowserFeatures();
  const raw = Object.entries(features).map(([k, v]) => `${k}=${v}`).join('|');

  const stablePart = multiRoundHash(raw, 5);
  const randPart = Math.random().toString(36).slice(2, 26);   // 24 位
  const timePart = Date.now().toString(36);
  const extraRand1 = Math.random().toString(36).slice(2, 10);  // 8 位
  const extraRand2 = Math.random().toString(36).slice(2, 10);  // 8 位

  return `gp_cli_${stablePart}_${randPart}_${extraRand1}_${timePart}_${extraRand2}`;
}

/**
 * 生成 Session ID（会话级，纯随机 + 时间戳）
 */
function generateSessionId(): string {
  const rand1 = Math.random().toString(36).slice(2, 18);
  const rand2 = Math.random().toString(36).slice(2, 18);
  const timePart = Date.now().toString(36);
  return `gp_sess_${rand1}_${timePart}_${rand2}`;
}

/**
 * 获取或生成持久 Client ID（localStorage）
 * 复用 error_logger.ts 等已有的 glow_prow_client_id 存储
 */
export function getClientId(): string {
  try {
    const stored = _storage.local.get(CLIENT_ID_KEY);
    if (stored?.data?.value && typeof stored.data.value === 'string' && stored.data.value.length >= 8) {
      return stored.data.value;
    }
    const newId = generateClientId();
    _storage.local.set(CLIENT_ID_KEY, newId);
    return newId;
  } catch (e) {
    console.error('Failed to get/create clientId:', e);
    return 'gp_cli_fb_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
  }
}

/**
 * 获取或生成会话 Session ID（sessionStorage）
 */
export function getSessionId(): string {
  try {
    const stored = _storage.session.get(SESSION_ID_KEY);
    if (stored?.data?.value && typeof stored.data.value === 'string' && stored.data.value.length >= 8) {
      return stored.data.value;
    }
    const newId = generateSessionId();
    _storage.session.set(SESSION_ID_KEY, newId);
    return newId;
  } catch (e) {
    console.error('Failed to get/create sessionId:', e);
    return 'gp_sess_fb_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
  }
}

/**
 * 浏览器指纹（用于后端识别匿名用户的客户端侧锚点）
 * 现在直接返回 Client ID——它已经包含稳定指纹 + 足够长的随机后缀
 * 保持向后兼容：fingerprint_auth.ts 通过 generateAuthGpHeader() → getBrowserFingerprint() 取值
 */
export function getBrowserFingerprint(): string {
  return getClientId();
}

/**
 * 强制重新生成 Client ID（清 localStorage 后调用）
 */
export function regenerateClientId(): string {
  try {
    _storage.local.rem(CLIENT_ID_KEY);
  } catch { /* ignore */ }
  return getClientId();
}
