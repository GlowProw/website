import config from "../../config";
import * as misc from "../lib/misc";
import db from "../../mysql";
import {body as checkBody} from "express-validator";

async function verifyCaptcha(req: any, res: any, next: any) {
    try {
        try {
            switch (req.body.captcha.captchaType || 'svg') {
                default:
                case 'svg': {
                    // validation
                    if (typeof req.body.captcha == 'object' && req.body.captcha.captchaType) {
                        if (!(await checkBody('captcha.encryptCaptcha').isBase64().run(req, {dryRun: true})).isEmpty() ||
                            !(await checkBody('captcha.response').isAscii().isLength({
                                min: 4,
                                max: 4
                            }).run(req, {dryRun: true})).isEmpty())
                            return res.status(400).json({error: 1, code: 'captcha.bad'});
                    }

                    const encryptCaptcha = req.body.captcha.encryptCaptcha || req.body.encryptCaptcha;
                    const submitCaptcha = (req.body.captcha.response || req.body.captcha).toLowerCase();

                    const decryptCaptcha = misc.decrypt(Buffer.from(encryptCaptcha, 'base64'), config.secret).toString('utf8'); // be warn: we might get meaningless str if the encryptCaptcha is not ours
                    const [rightCaptcha, timeStamp] = decryptCaptcha.split(',', 2); // so .split here, the second param could be undefined or meaningless

                    if (!Number.isInteger(parseInt(timeStamp))) // so here we check if it can be parse as int
                        return res.status(400).json({error: 1, code: 'captcha.bad'});
                    if (Date.now() - parseInt(timeStamp) > config.captchaExpiresIn) // is captcha expired?
                        return res.status(403).json({error: 1, code: 'captcha.expired'});
                    if (rightCaptcha !== submitCaptcha) // wrong captcha
                        return res.status(403).json({error: 1, code: 'captcha.wrong'});
                    if ((await db.select('*').from('used_captchas').where({uniqHash: encryptCaptcha})).length > 0) // used captcha
                        return res.status(403).json({error: 1, code: 'captcha.expired'});

                    await db('used_captchas').insert({
                        uniqHash: encryptCaptcha,
                        expiresTime: new Date( Number(timeStamp) + config.captchaExpiresIn)
                    });
                    next();
                }
                    break;
            }
        } catch (e: any) {
            console.error('Turnstile Error:', e.message);
            return res.status(500).json({
                error: 1,
                code: 'captcha.bad',
                message: e
            });
        }
    } catch (err) {
        next(err);
    }

}

export default verifyCaptcha;
