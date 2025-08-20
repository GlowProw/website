"use strict";
import rateLimit, {ipKeyGenerator} from "express-rate-limit";

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    keyGenerator: (req) => {
        // 优先使用Cloudflare提供的真实IP
        const ip: string = req.headers['cf-connecting-ip']?.toString()?.split(',')[0]?.trim() || req.ip || '';

        // 处理可能的多IP情况（如X-Forwarded-For）
        const firstIp = ip.split(',')[0].trim();

        // 使用内置的IPv6处理
        return ipKeyGenerator(firstIp);
    },
    validate: {
        trustProxy: false // 不信任所有代理
    }
});

const captchaRateLimiter = rateLimit({
    windowMs: 1000,
    max: 3,
    message: {error: 1, code: 'request.rateLimited', message: 'slow down please.'}
});

const timeUpRateLimiter = rateLimit({
    windowMs: 3000,
    max: 3,
    message: {error: 1, code: 'request.rateLimited', message: 'slow down please.'}
});

const registerRateLimiter = rateLimit({
    windowMs: 1000,
    max: 3,
    message: {error: 1, code: 'request.rateLimited', message: 'slow down please.'}
});

const loginRateLimiter = rateLimit({
    windowMs: 1000,
    max: 3,
    message: {error: 1, code: 'request.rateLimited', message: 'slow down please.'}
});

const calendarRateLimiter = rateLimit({
    windowMs: 10000,
    max: 4,
    message: {error: 1, code: 'request.rateLimited', message: 'slow down please.'}
});

const likesRateLimiter = rateLimit({
    windowMs: 10000,
    max: 4,
    message: {error: 1, code: 'request.rateLimited', message: 'slow down please.'}
});

const accountRateLimiter = rateLimit({
    windowMs: 20000,
    max: 10,
    message: {error: 1, code: 'request.rateLimited', message: 'slow down please.'}
});

export {
    limiter,
    captchaRateLimiter,
    timeUpRateLimiter,
    registerRateLimiter,
    loginRateLimiter,
    calendarRateLimiter,
    likesRateLimiter,
    accountRateLimiter
}
