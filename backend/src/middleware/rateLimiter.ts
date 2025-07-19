"use strict";
import rateLimit from "express-rate-limit";

const captchaRateLimiter = rateLimit({
    windowMs: 1000,
    max: 5,
    message: {error: 1, code: 'request.rateLimited', message: 'slow down please.'}
});

const timeUpRateLimiter = rateLimit({
    windowMs: 1000,
    max: 3,
    message: {error: 1, code: 'request.rateLimited', message: 'slow down please.'}
});


const registerRateLimiter = rateLimit({
    windowMs: 1000,
    max: 5,
    message: {error: 1, code: 'request.rateLimited', message: 'slow down please.'}
});

const loginRateLimiter = rateLimit({
    windowMs: 1000,
    max: 5,
    message: {error: 1, code: 'request.rateLimited', message: 'slow down please.'}
});

export {
    captchaRateLimiter,
    timeUpRateLimiter,
    registerRateLimiter,
    loginRateLimiter,
}
