import {mergeAttributes, Node, type RawCommands, VueNodeViewRenderer} from "@tiptap/vue-3"
import Component from "./view.vue";

const VideoNode = Node.create({
    name: 'Video',
    group: 'inline',
    topNode: false,
    atom: true,
    inline: true,
    selectable: true,
    draggable: false,
    addAttributes() {
        return {
            src: {
                default: null
            }
        }
    },
    parseHTML() {
        return [{
            tag: 'video',
            getAttrs: (node) => {
                return {
                    src: node.getAttribute('src'),
                }
            },
        }]
    },
    renderHTML({HTMLAttributes}) {
        const attrs = mergeAttributes(HTMLAttributes)
        return ['video', {src: attrs.src}, attrs.src || '']
    },
    addNodeView() {
        return VueNodeViewRenderer(Component)
    },
    addCommands() {
        return {
            insertVideo: (src) => ({chain}: any) => {
                return chain()
                    .insertContent([
                        {
                            type: this.name,
                            updateSelection: true,
                            attrs: {
                                src
                            }
                        },
                        {type: 'paragraph'}
                    ])
                    .run()
            },
        } as Partial<RawCommands>
    },
})

export type VideoUrlError = 'invalid' | 'unsupported' | 'b23tv'

export interface NormalizeVideoResult {
    ok: boolean
    url?: string
    reason?: VideoUrlError
}

const VIDEO_FILE_RE = /\.(mp4|webm|ogv|ogg|mov|m4v|m3u8)(\?|#|$)/i

/**
 * 视频平台白名单（注册域名）。
 * 精确匹配或为其任意子域名均放行，例如 www.youtube.com、m.youtube.com、
 * player.bilibili.com；但 evilyoutube.com 这种“长得像”的域名不以后缀命中，仍拦截。
 */
const VIDEO_HOST_WHITELIST = [
    'youtube.com',
    'youtube-nocookie.com',
    'youtu.be',
    'bilibili.com',
    'b23.tv',
    'v.qq.com',
    'youku.com',
]

function isWhitelistedHost(host: string, domain: string): boolean {
    return host === domain || host.endsWith(`.${domain}`)
}

export function normalizeVideoUrl(input: string): NormalizeVideoResult {
    const raw = (input ?? '').trim()
    if (!raw) return {ok: false, reason: 'invalid'}

    let url: URL
    try {
        url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`)
    } catch {
        return {ok: false, reason: 'invalid'}
    }

    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        return {ok: false, reason: 'invalid'}
    }

    const host = url.hostname.toLowerCase()
    const path = url.pathname

    /* YouTube
    if (isWhitelistedHost(host, 'youtube.com') || isWhitelistedHost(host, 'youtube-nocookie.com')) {
        let id = ''
        if (path === '/watch') {
            id = url.searchParams.get('v') || ''
        } else if (path.startsWith('/shorts/') || path.startsWith('/embed/') || path.startsWith('/v/')) {
            id = decodeURIComponent(path.split('/')[2] || '')
        }
        if (id) return {ok: true, url: `https://www.youtube.com/embed/${id}`}
        // 白名单内但提取不到视频 id：交给文末白名单兜底
    }
    if (isWhitelistedHost(host, 'youtu.be')) {
        const id = decodeURIComponent(path.slice(1).split('/')[0] || '')
        if (id) return {ok: true, url: `https://www.youtube.com/embed/${id}`}
        return {ok: false, reason: 'invalid'}
    }

    /* 哔哩哔哩：b23.tv 短链无法在前端可靠展开，要求粘贴原始链接 */
    if (isWhitelistedHost(host, 'b23.tv')) return {ok: false, reason: 'b23tv'}

    if (isWhitelistedHost(host, 'bilibili.com')) {
        // 已是播放器地址（player.bilibili.com）
        if (host === 'player.bilibili.com') {
            const bvid = url.searchParams.get('bvid')
            const aid = url.searchParams.get('aid')
            const page = url.searchParams.get('p') || url.searchParams.get('page') || '1'
            if (bvid) return {ok: true, url: `https://player.bilibili.com/player.html?bvid=${bvid}&page=${page}&high_quality=1`}
            if (aid) return {ok: true, url: `https://player.bilibili.com/player.html?aid=${aid}&page=${page}&high_quality=1`}
            return {ok: false, reason: 'invalid'}
        }

        // /video/BVxxxx 或 /video/av123
        const m = path.match(/\/video\/((?:BV[0-9A-Za-z]+)|(?:av\d+))/i)
        if (m) {
            const id = m[1]
            const page = url.searchParams.get('p') || '1'
            if (/^bv/i.test(id)) {
                return {ok: true, url: `https://player.bilibili.com/player.html?bvid=${id}&page=${page}&high_quality=1`}
            }
            return {ok: true, url: `https://player.bilibili.com/player.html?aid=${id.replace(/^av/i, '')}&page=${page}&high_quality=1`}
        }
        // 番剧/课程等其它页面或未知子域：交给文末白名单兜底
    }

    /* 腾讯视频
    if (isWhitelistedHost(host, 'v.qq.com')) {
        if (path.startsWith('/txp/iframe/player.html') && url.searchParams.get('vid')) {
            return {ok: true, url: url.toString()}
        }
        const m = path.match(/\/([a-z0-9]+)\.html$/i)
        if (m) return {ok: true, url: `https://v.qq.com/txp/iframe/player.html?vid=${m[1]}`}
        // 其它路径：交给文末白名单兜底
    }

    /* 优酷
    if (isWhitelistedHost(host, 'youku.com')) {
        if (host === 'player.youku.com') {
            const mEmbed = path.match(/\/embed\/([^/?#]+)/i)
            if (mEmbed) return {ok: true, url: `https://player.youku.com/embed/${mEmbed[1]}`}
        }
        const m = path.match(/id_([^./]+)/i)
        if (m) return {ok: true, url: `https://player.youku.com/embed/${m[1]}`}
        // 其它路径：交给文末白名单兜底
    }

    /* 白名单域名（含任意子域）下的地址原样放行 */
    if (VIDEO_HOST_WHITELIST.some(domain => isWhitelistedHost(host, domain))) {
        return {ok: true, url: url.toString()}
    }

    /* 视频文件直链 */
    if (VIDEO_FILE_RE.test(path) || VIDEO_FILE_RE.test(url.toString())) {
        return {ok: true, url: url.toString()}
    }

    return {ok: false, reason: 'unsupported'}
}

export {
    VideoNode,
}
