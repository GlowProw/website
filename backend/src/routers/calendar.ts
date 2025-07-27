import express from 'express';
import {ICalCalendar} from 'ical-generator';
import {query as checkquery} from "express-validator/lib/middlewares/validation-chain-builders";
import {validationResult} from "express-validator";
import {calendarRateLimiter} from "../middleware/rateLimiter";
import i18n from "../../i18n";
import config from "../../config";
import logger from "../../logger";
import {fileURLToPath} from "node:url";
import path from "path";
import fs from 'fs/promises';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '../../data/calendar');

/**
 * 获取赛季原始数据
 * 路由: GET /data
 * 参数:
 *   - season: 赛季ID (必填)
 */
router.get('/data', [
    // 验证season参数: 长度1-255
    checkquery("season").isLength({min: 1, max: 255}),
], async (req: any, res: any) => {
    try {
        // 验证请求参数
        const validateErr = validationResult(req);
        if (!validateErr.isEmpty())
            return res.status(400).json({error: 1, code: 'data.bad', message: validateErr.array()});

        const {season} = req.query;

        // 加载当前赛季的事件数据
        const gameEventsData = await loadGameEventsData(season);

        // 设置响应头 - 指定内容类型为JSON
        res.setHeader('Content-Type', 'application/json');

        // 返回原始数据
        res.setHeader('Cache-Control', `public, max-age=${config.__DEBUG__ ? 0 : 10 * 24 * 60 * 60}`).json({
            code: 0,
            data: gameEventsData
        });
    } catch (e) {
        // 捕获并记录错误
        logger.error(e);
        res.status(500).json({code: 'data.error'});
    }
});

/**
 * 加载指定赛季的游戏事件数据
 * @param season 赛季ID
 * @returns 返回该赛季的事件数据对象
 */
async function loadGameEventsData(season: string): Promise<any> {
    const seasonPath = path.join(DATA_DIR, season, 'index.json');
    try {
        const data = await fs.readFile(seasonPath, 'utf-8');
        return JSON.parse(data);
    } catch (err) {
        logger.error(`加载赛季数据失败: ${seasonPath}`, err);
        return {events: {}};
    }
}

/**
 * 获取赛季所有事件的ICS日历
 * 路由: GET /events.ics
 * 参数:
 *   - season: 赛季ID (必填)
 *   - language: 语言代码 (必填)
 */
router.get('/events.ics', calendarRateLimiter, [
    // 验证season参数: 长度1-255
    checkquery("season").isLength({min: 1, max: 255}),
    // 验证language参数: 必须在配置的语言列表中
    checkquery("language").isIn(config.i18n.locales),
], async (req: any, res: any) => {
    try {
        // 验证请求参数
        const validateErr = validationResult(req);
        if (!validateErr.isEmpty())
            return res.status(400).json({error: 1, code: 'events.bad', message: validateErr.array()});

        const {season, language} = req.query;

        // 加载当前赛季的事件数据
        const gameEventsData = await loadGameEventsData(season);

        // 创建新的日历实例
        const cal = new ICalCalendar({
            name: await i18n.translate(`${season}.name`, language) || '赛季名称',
            url: req.protocol + '://' + req.get('host') + req.originalUrl,
            prodId: {company: 'Ubisoft', product: 'GameEventsCalendar'},
            ttl: 60 * 60 // 缓存1小时
        });

        const eventsToAdd: any[] = [];
        const currentYear = new Date().getFullYear(); // 获取当前年份

        // 遍历所有事件
        for (const e of Object.values(gameEventsData.events)) {
            let event: any = e;

            // 遍历每个事件的所有发生日期
            for (const occurrence of event.occurrences) {
                // 创建事件开始日期 (月份是0-based所以要减1)
                const startDate = new Date(currentYear, occurrence.month - 1, occurrence.day, 12, 0, 0);
                const endDate = new Date(startDate);
                endDate.setDate(startDate.getDate() + event.duration); // 设置结束日期

                // 添加事件到列表
                eventsToAdd.push({
                    uid: `${event.id}-${occurrence.month}-${occurrence.day}-${currentYear}`, // 唯一事件ID
                    start: startDate, // 开始时间
                    end: endDate,    // 结束时间
                    summary: await i18n.translate(`${season}.data.${event.id}.name`, language), // 事件名称
                    description: await i18n.translate(`${season}.data.${event.id}.description`, language) || '', // 事件描述
                    allDay: true,    // 全天事件
                    location: 'In-Game', // 事件位置
                    url: `${req.$AppBaseUrl}/calendar`, // 相关URL
                });
            }
        }

        // 将所有事件添加到日历
        cal.events(eventsToAdd);

        // 设置响应头 - 指定内容类型为日历格式
        res.setHeader('Content-Type', 'text/calendar');
        // 设置响应头 - 指定下载文件名
        res.setHeader('Content-Disposition', 'attachment; filename="game-events.ics"');
        // 发送日历内容
        res.send(cal.toString());
    } catch (e) {
        // 捕获并记录错误
        logger.error(e);
        res.status(500).json({code: 'events.error'});
    }
});

/**
 * 获取单个事件的ICS日历
 * 路由: GET /event.ics
 * 参数:
 *   - season: 赛季ID (必填)
 *   - language: 语言代码 (必填)
 *   - eventId: 事件ID (必填)
 *   - occurrenceIndex: 事件发生索引 (可选)
 */
router.get('/event.ics', calendarRateLimiter, [
    checkquery("season").isLength({min: 1, max: 255}),
    checkquery("language").isIn(config.i18n.locales),
    checkquery("eventId").isLength({min: 1, max: 255}),
    checkquery("occurrenceIndex").optional().isInt({min: 0}).toInt(),
], async (req: any, res: any) => {
    try {
        // 验证请求参数
        const validateErr = validationResult(req);
        if (!validateErr.isEmpty())
            return res.status(400).json({error: 1, code: 'events.bad', message: validateErr.array()});

        const {season, language, eventId, occurrenceIndex} = req.query;

        // 加载当前赛季的事件数据
        const gameEventsData = await loadGameEventsData(season);
        const event = gameEventsData.events[eventId];

        // 检查事件是否存在
        if (!event) {
            return res.status(404).json({error: 1, code: 'event.not_found', message: '事件不存在'});
        }

        // 创建新的日历实例
        const cal = new ICalCalendar({
            name: await i18n.translate(`${season}.data.${eventId}.name`, language) || '事件名称',
            url: req.protocol + '://' + req.get('host') + req.originalUrl,
            prodId: {company: 'Ubisoft', product: 'GameEventsCalendar'},
            ttl: 60 * 60 // 缓存1小时
        });

        const eventsToAdd: any[] = [];
        const currentYear = new Date().getFullYear(); // 获取当前年份

        // 如果指定了occurrenceIndex，只添加该特定发生日期
        if (occurrenceIndex !== undefined) {
            // 检查occurrenceIndex是否有效
            if (occurrenceIndex >= event.occurrences.length || occurrenceIndex < 0) {
                return res.status(400).json({error: 1, code: 'event.invalid_occurrence', message: '无效的事件发生索引'});
            }

            const occurrence = event.occurrences[occurrenceIndex];
            const startDate = new Date(currentYear, occurrence.month - 1, occurrence.day, 12, 0, 0);
            const endDate = new Date(startDate);
            endDate.setDate(startDate.getDate() + event.duration);

            // 添加单个事件到列表
            eventsToAdd.push({
                uid: `${eventId}-${occurrenceIndex}-${currentYear}`,
                start: startDate,
                end: endDate,
                summary: await i18n.translate(`${season}.data.${eventId}.name`, language),
                description: await i18n.translate(`${season}.data.${eventId}.description`, language) || '',
                allDay: true,
                location: 'In-Game',
                url: `${req.$AppBaseUrl}/calendar`,
            });
        } else {
            // 如果没有指定occurrenceIndex，添加所有发生日期
            for (const occurrence of event.occurrences) {
                const index = event.occurrences.indexOf(occurrence);
                const startDate = new Date(currentYear, occurrence.month - 1, occurrence.day, 12, 0, 0);
                const endDate = new Date(startDate);
                endDate.setDate(startDate.getDate() + event.duration);

                eventsToAdd.push({
                    uid: `${eventId}-${index}-${currentYear}`,
                    start: startDate,
                    end: endDate,
                    summary: await i18n.translate(`${season}.data.${eventId}.name`, language),
                    description: await i18n.translate(`${season}.data.${eventId}.description`, language) || '',
                    allDay: true,
                    location: 'In-Game',
                    url: `${req.$AppBaseUrl}/calendar`,
                });
            }
        }

        // 将所有事件添加到日历
        cal.events(eventsToAdd);

        // 设置响应头 - 指定内容类型为日历格式
        res.setHeader('Content-Type', 'text/calendar');
        // 设置响应头 - 指定下载文件名(包含事件ID和可选的发生索引)
        res.setHeader('Content-Disposition', `attachment; filename="${eventId}${occurrenceIndex !== undefined ? `-${occurrenceIndex}` : ''}.ics"`);
        // 发送日历内容
        res.send(cal.toString());
    } catch (e) {
        // 捕获并记录错误
        logger.error(e);
        res.status(500).json({code: 'events.error'});
    }
});

export default router;
