"use strict";
import xss, {IFilterXSSOptions} from "xss";

const config = {
    // XSS过滤配置
    xss: {
        whiteList: {
            a: ["href", "title", "target"],
            b: [],
            br: [],
            div: [],
            hr: [],
            i: [],
            img: ["src", "alt", "style", "title", "width", "height"],
            li: [],
            oi: [],
            ul: [],
            p: [],
            span: ["data-type"],
            strong: [],
            u: [],
            video: ["autoplay", "controls", "crossorigin", "loop", "muted", "playsinline", "poster", "preload", "src", "height", "width"],
        },
        css: false,
        allowCommentTag: false,
    }
}

/**
 * 富文本输入处理（XSS过滤）
 * @param content 输入内容
 * @param options
 * @returns 安全处理后的内容
 */
function sanitizeRichText(content: string, options?: IFilterXSSOptions): string {
    return xss(content, options || config.xss);
}

export {
    xss,
    config,
    sanitizeRichText
}
