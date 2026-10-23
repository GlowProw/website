import Storage from "./storage";

const storage = new Storage();
const TRUST_STORAGE_KEY = "user.2fa.trustToken";

/**
 * 读取本机保存的 2FA 信任令牌
 */
export function getTrustToken(): string {
    const d = storage.local.get(TRUST_STORAGE_KEY);
    if (d.code < 0) return "";
    return String(d.data?.value || "");
}

/**
 * 保存服务端签发的 2FA 信任令牌
 * @param token 信任令牌
 */
export function setTrustToken(token: string): void {
    if (!token) return;
    storage.local.set(TRUST_STORAGE_KEY, token);
}

/**
 * 清除本机的 2FA 信任令牌
 */
export function clearTrustToken(): void {
    storage.local.rem(TRUST_STORAGE_KEY);
}
