/**
 * 登录 / 授权成功后的安全回跳
 *
 * 使用场景：
 *  - 账号登录页（Signin.vue）：登录成功后回到 backUrl
 *  - 第三方登录回调页（OAuthCallback.vue）：QQ / Google / Discord 登录或绑定成功后回到 backUrl
 *  - MCP 授权流程：授权页未登录时跳转到登录页并带上 backUrl（形如
 *    http://localhost:3000/authorize?...），登录成功后必须整页跳回该地址，
 *    由后端识别会话后继续走「同意授权」流程
 *
 * 安全策略：仅允许跳转到官方域名或本地回环地址，避免 backUrl 被利用为钓鱼跳板
 */
import type { Router } from 'vue-router';

/**
 * 回跳到指定地址
 * @param url backUrl，相对路径走前端路由，绝对地址整页跳转（需通过白名单校验）
 * @param router 当前路由实例（内部路径跳转用）
 */
export const goBackUrl = (url: string, router: Router): void => {
    if (/^https?:\/\//i.test(url)) {
        let host = '';
        try {
            host = new URL(url).hostname;
        } catch {
            router.push('/');
            return;
        }
        const isOfficial = /(^|\.)glow-prow\.top$/i.test(host) || /(^|\.)cabbagelol\.net$/i.test(host);
        // 本地开发：MCP 授权页跑在 localhost:3000，登录后需整页跳回
        const isLocal = /^(localhost|127(?:\.\d{1,3}){3}|\[::1\])$/i.test(host);
        if (isOfficial || isLocal) {
            window.location.href = url;
            return;
        }
        router.push('/');
        return;
    }
    router.push(url);
};
