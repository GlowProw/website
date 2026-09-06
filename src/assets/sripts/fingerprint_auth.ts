import { getBrowserFingerprint } from './fingerprint';

const GP_AUTH_SALT = "GP_AUTH_FP_SECRET_SALT_KEY";

/**
 * RC4 对称流加密
 */
function rc4(key: string, input: Uint8Array): Uint8Array {
  const s = new Uint8Array(256);
  for (let i = 0; i < 256; i++) s[i] = i;
  let j = 0;
  for (let i = 0; i < 256; i++) {
    j = (j + s[i] + key.charCodeAt(i % key.length)) % 256;
    const temp = s[i];
    s[i] = s[j];
    s[j] = temp;
  }
  let i = 0;
  j = 0;
  const output = new Uint8Array(input.length);
  for (let k = 0; k < input.length; k++) {
    i = (i + 1) % 256;
    j = (j + s[i]) % 256;
    const temp = s[i];
    s[i] = s[j];
    s[j] = temp;
    const t = (s[i] + s[j]) % 256;
    output[k] = input[k] ^ s[t];
  }
  return output;
}

/**
 * Uint8Array 转 URL-Safe Base64
 */
function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * 生成混淆后的 x-auth-gp 协议头
 */
export function generateAuthGpHeader(fingerprint?: string): string {
  try {
    const rawFp = fingerprint || getBrowserFingerprint();
    const timestamp = Date.now();
    // 随机生成 4 位 hex IV
    const randomHex = Math.floor(Math.random() * 0xffff).toString(16).padStart(4, '0');
    const encryptKey = `${GP_AUTH_SALT}_${randomHex}`;

    const payload = `${rawFp}###${timestamp}###gp_verified`;
    const encoder = new TextEncoder();
    const plainBytes = encoder.encode(payload);
    const cipherBytes = rc4(encryptKey, plainBytes);
    const b64 = bytesToBase64Url(cipherBytes);

    return `gp1_${randomHex}.${b64}`;
  } catch (err) {
    console.error('Failed to generate auth gp header:', err);
    return 'gp1_fallback.' + Date.now().toString(36);
  }
}
