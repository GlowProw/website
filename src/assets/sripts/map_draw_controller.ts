import { ref, type Ref } from 'vue';
import Map from 'ol/Map';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Feature from 'ol/Feature';
import LineString from 'ol/geom/LineString';
import Polygon from 'ol/geom/Polygon';
import Draw from 'ol/interaction/Draw';
import Modify from 'ol/interaction/Modify';
import Snap from 'ol/interaction/Snap';
import { unByKey } from 'ol/Observable';
import type { EventsKey } from 'ol/events';
import { Circle as CircleStyle, Fill, Stroke, Style } from 'ol/style';
import { fromLonLat, toLonLat } from 'ol/proj';
import type { Feature as OLFeature } from 'ol';
import type { Geometry, SimpleGeometry } from 'ol/geom';
import type {MapShape, MapShapeType, ShapeGeometry, ShapeStyle} from '@/assets/types/Map';
import {
    parseShapeGeometry,
    parseShapeStyle,
    hexToRgba,
    resolveShapeStyle,
    DEFAULT_PATH_COLOR,
    DEFAULT_REGION_COLOR,
    DEFAULT_LINE_OPACITY,
    DEFAULT_FILL_OPACITY,
    DEFAULT_SHAPE_LINE_WIDTH,
} from '@/assets/types/Map';

// 纯样式工具已移至 types/Map（无 OL 依赖），此处再导出保持既有引用路径可用
export {
    hexToRgba,
    resolveShapeStyle,
    DEFAULT_PATH_COLOR,
    DEFAULT_REGION_COLOR,
    DEFAULT_LINE_OPACITY,
    DEFAULT_FILL_OPACITY,
};

export type DrawShapeMode = MapShapeType;

/** 判断渲染图形是否为未提交草稿 */
export const DRAFT_SHAPE_UUID = '__draft_shape__';

/** 判断渲染图形是否为未提交草稿 */
export const isDraftUuid = (uuid: string | null | undefined): boolean =>
    !!uuid && uuid.startsWith(DRAFT_SHAPE_UUID);

export const DEFAULT_SHAPE_STYLE = {
    color: DEFAULT_PATH_COLOR,
    opacity: DEFAULT_LINE_OPACITY,
    width: DEFAULT_SHAPE_LINE_WIDTH,
    dashed: false,
    smoothed: false,
    fillColor: DEFAULT_PATH_COLOR,
    fillOpacity: DEFAULT_FILL_OPACITY,
} as const;

/* ============================== 坐标与几何工具 ============================== */

export const xyFromLonLat = (coords: number[]): number[] => fromLonLat([coords[0], coords[1]]);
export const lonLatFromXy = (coords: number[]): number[] => toLonLat([coords[0], coords[1]]);

/**
 * Catmull-Rom（转三次贝塞尔后采样）平滑折线。
 * 输入/输出均为投影坐标 XY。closed=true 时首尾相接（处理带闭合点的环）。
 */
export function smoothCoordsXY(points: number[][], closed = false, segments = 24): number[][] {
    if (points.length < 3) return points.map(p => [...p]);

    // 去掉多边形环末尾与首点重复的闭合点
    let ring = points.map(p => [...p]);
    let wasClosed = closed;
    if (wasClosed) {
        const first = ring[0];
        const last = ring[ring.length - 1];
        if (first[0] === last[0] && first[1] === last[1]) {
            ring = ring.slice(0, -1);
        }
        if (ring.length < 3) return points.map(p => [...p]);
    }

    const n = ring.length;
    const pointAt = (i: number): number[] => {
        if (wasClosed) return ring[((i % n) + n) % n];
        return ring[Math.min(n - 1, Math.max(0, i))];
    };

    const out: number[][] = [];
    const segmentCount = wasClosed ? n : n - 1;
    for (let i = 0; i < segmentCount; i++) {
        const p0 = pointAt(i - 1);
        const p1 = pointAt(i);
        const p2 = pointAt(i + 1);
        const p3 = pointAt(i + 2);
        // Catmull-Rom -> cubic bezier control points
        const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
        const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];

        const startT = i === 0 ? 0 : 1;
        for (let s = startT; s <= segments; s++) {
            if (i > 0 && s === 0) continue;
            const t = s / segments;
            const mt = 1 - t;
            const x = mt ** 3 * p1[0] + 3 * mt ** 2 * t * c1[0] + 3 * mt * t ** 2 * c2[0] + t ** 3 * p2[0];
            const y = mt ** 3 * p1[1] + 3 * mt ** 2 * t * c1[1] + 3 * mt * t ** 2 * c2[1] + t ** 3 * p2[1];
            out.push([x, y]);
        }
    }
    if (wasClosed) out.push([...out[0]]);
    return out;
}

/** 保证多边形外环闭合 */
function ensureClosed(ring: number[][]): number[][] {
    if (ring.length === 0) return ring;
    const first = ring[0];
    const last = ring[ring.length - 1];
    if (first[0] !== last[0] || first[1] !== last[1]) {
        return [...ring, [...first]];
    }
    return ring;
}

/** 由原始经纬度几何 + 样式生成用于渲染的投影几何（平滑在渲染层，不改原始顶点） */
export function buildRenderGeometry(raw: ShapeGeometry, style: ShapeStyle = {}): LineString | Polygon {
    const smoothed = !!style.smoothed;
    if (raw.type === 'LineString') {
        const xy = (raw.coordinates as number[][]).map(xyFromLonLat);
        const rendered = smoothed ? smoothCoordsXY(xy, false) : xy;
        return new LineString(rendered);
    }
    const outer = ((raw.coordinates as number[][][])[0] || []).map(xyFromLonLat);
    const rendered = smoothed ? smoothCoordsXY(ensureClosed(outer), true) : ensureClosed(outer);
    return new Polygon([rendered]);
}

/** 编辑用的"原始顶点"投影几何（直线，拖动顶点即调整弯曲控制顶点） */
export function buildEditGeometry(raw: ShapeGeometry): LineString | Polygon {
    if (raw.type === 'LineString') {
        return new LineString((raw.coordinates as number[][]).map(xyFromLonLat));
    }
    const outer = ensureClosed(((raw.coordinates as number[][][])[0] || []).map(xyFromLonLat));
    return new Polygon([outer]);
}

/** 从 OL 投影几何读出经纬度 GeoJSON */
export function extractRawGeometry(geom: SimpleGeometry): ShapeGeometry | null {
    const type = geom.getType();
    if (type === 'LineString') {
        const coordinates = (geom.getCoordinates() as number[][]).map(lonLatFromXy);
        if (coordinates.length < 2) return null;
        return { type: 'LineString', coordinates };
    }
    if (type === 'Polygon') {
        const rings = geom.getCoordinates() as number[][][];
        const outer = ensureClosed(rings[0] || []).map(lonLatFromXy);
        if (outer.length < 4) return null;
        return { type: 'Polygon', coordinates: [outer] };
    }
    return null;
}

/* ============================== 样式工厂 ============================== */

export function createShapeOlStyle(shapeType: MapShapeType, input?: ShapeStyle | null): Style {
    const s = resolveShapeStyle(input, shapeType);
    const stroke = new Stroke({
        color: hexToRgba(s.color, s.opacity),
        width: s.width,
        lineDash: s.dashed ? [s.width * 3.5, s.width * 2.5] : undefined,
        lineCap: 'round',
        lineJoin: 'round',
    });
    if (shapeType === 'region') {
        return new Style({
            stroke,
            fill: new Fill({ color: hexToRgba(s.fillColor, s.fillOpacity) }),
            zIndex: 10,
        });
    }
    return new Style({ stroke, zIndex: 10 });
}

/** 顶点编辑时显示的原始控制线样式 */
function createEditOlStyle(input?: ShapeStyle | null, shapeType: MapShapeType = 'path'): Style[] {
    const s = resolveShapeStyle(input, shapeType);
    // 第一条：加宽的近乎透明触控带，肉眼几乎不可见，但能让手指轻松抓住线条和区域边缘
    // 第二条：真正显示的白色虚线控制线
    return [
        createHitAreaStyle(s.fillColor, shapeType),
        new Style({
            stroke: new Stroke({
                color: 'rgba(255,255,255,0.85)',
                width: 1.5,
                lineDash: [6, 5],
            }),
            fill: shapeType === 'region'
                ? new Fill({ color: hexToRgba(s.fillColor, Math.min(0.12, s.fillOpacity / 2)) })
                : undefined,
            image: new CircleStyle({
                radius: 5,
                fill: new Fill({ color: '#ffffff' }),
                stroke: new Stroke({ color: s.color, width: 2 }),
            }),
            zIndex: 11,
        }),
    ];
}

/**
 * 近乎全透明的触控带样式：编辑模式下所有本人图形都挂一份，
 * 肉眼不可见但实际参与渲染，因此既能被鼠标命中、又不遮挡地图
 */
function createHitAreaStyle(fillColor?: string | null, shapeType: MapShapeType = 'path'): Style {
    const color = fillColor || DEFAULT_PATH_COLOR;
    return new Style({
        stroke: new Stroke({
            color: 'rgba(255,255,255,0.01)',
            width: 24,
        }),
        fill: shapeType === 'region'
            ? new Fill({ color: hexToRgba(color, 0.01) })
            : undefined,
        zIndex: 10,
    });
}

/** 不可见但仍可被 Modify 命中 */
const INVISIBLE_STYLE = new Style({});

let cachedMainColor: string | null = null;
let cachedVertexHandleStyles: Style[] | null = null;

/** 主题色（兼容 hex / rgb()）转 rgba 字符串 */
function mainColorToRgba(alpha: number): string {
    const raw = (cachedMainColor || '').trim();
    if (raw.startsWith('#')) return hexToRgba(raw, alpha);
    const m = raw.match(/rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/i);
    if (m) return `rgba(${m[1]},${m[2]},${m[3]},${Math.min(1, Math.max(0, alpha))})`;
    return hexToRgba(DEFAULT_PATH_COLOR, alpha);
}

/** 失效主题色缓存（预留主题热切换） */
export function invalidateVertexHandleStyle(): void {
    cachedMainColor = null;
    cachedVertexHandleStyles = null;
}

/**
 * 顶点编辑手柄样式：外圈 var(--main-color) 半透明圆环 + 内圈白点，
 */
export function createVertexHandleStyles(): Style[] {
    if (cachedVertexHandleStyles) return cachedVertexHandleStyles;
    if (cachedMainColor === null && typeof document !== 'undefined') {
        cachedMainColor = getComputedStyle(document.documentElement)
            .getPropertyValue('--main-color').trim() || DEFAULT_PATH_COLOR;
    }
    cachedVertexHandleStyles = [
        new Style({
            image: new CircleStyle({
                radius: 7,
                fill: new Fill({color: mainColorToRgba(0.25)}),
                stroke: new Stroke({color: mainColorToRgba(1), width: 1.5}),
            }),
            zIndex: 12,
        }),
        new Style({
            image: new CircleStyle({
                radius: 2.5,
                fill: new Fill({color: '#ffffff'}),
            }),
            zIndex: 13,
        }),
    ];
    return cachedVertexHandleStyles;
}

/** 绘制过程中的草图样式 */
function createDrawStyle(mode: DrawShapeMode): Style[] {
    const color = mode === 'region' ? DEFAULT_REGION_COLOR : DEFAULT_PATH_COLOR;
    const stroke = new Stroke({
        color: hexToRgba(color, DEFAULT_LINE_OPACITY),
        width: 3,
        lineDash: [8, 6],
        lineCap: 'round',
    });
    return [
        new Style({
            stroke,
            fill: mode === 'region' ? new Fill({ color: hexToRgba(color, DEFAULT_FILL_OPACITY) }) : undefined,
            image: new CircleStyle({
                radius: 5,
                fill: new Fill({ color: '#ffffff' }),
                stroke: new Stroke({ color, width: 2 }),
            }),
        }),
    ];
}

/* ============================== 控制器 ============================== */

export interface MapDrawControllerCallbacks {
    /** 一次绘制完成（草稿已加入图层） */
    onDrawEnd?: (mode: DrawShapeMode, geometry: ShapeGeometry) => void;
    /** 顶点拖拽结束（可能是已保存图形，也可能是未提交草稿） */
    onModifyEnd?: (uuid: string, geometry: ShapeGeometry) => void;
    /** 编辑模式下按下 Esc：交由上层决定是否弹确认退出 */
    onEscapeKey?: () => void;
}

export class MapDrawController {
    private getMap: () => Map | null;
    private callbacks: MapDrawControllerCallbacks;

    private renderLayer: VectorLayer<VectorSource>;
    private renderSource: VectorSource;
    /** 仅承载"原始顶点"要素，供 Modify/Snap 使用；与渲染层分离，避免平滑密线参与命中 */
    private editLayer: VectorLayer<VectorSource>;
    private editSource: VectorSource;
    private draw: Draw | null = null;
    private modify: Modify;
    private snap: Snap;
    private map: Map | null = null;
    private editingUuid: string | null = null;
    private escHandler: ((e: KeyboardEvent) => void) | null = null;

    /** 编辑模式（创建路径/区域后进入）：本人全部图形可悬停拖顶点再编辑 */
    private bulkMode = false;
    /** 编辑模式归属用户，只接管该用户的图形 */
    private bulkUserId: string | null = null;
    /** 编辑模式下当前悬停显示控制线的图形 */
    private hoverUuid: string | null = null;
    private hoverListenerKey: EventsKey | null = null;
    /** 正在拖拽顶点时不切换悬停目标 */
    private modifying = false;
    /** 草稿自增序号，保证连续绘制的多个草稿 uuid 唯一 */
    private draftSeq = 0;

    /**
     * 图形类型显隐（图层面板"船长笔记"控制）。
     * 隐藏后渲染要素使用空样式（同时不可见、不可被命中检测），
     * 框选也会跳过；正在绘制的草稿与正在顶点编辑的图形不受影响。
     */
    private typeHidden: Record<MapShapeType, boolean> = { path: false, region: false };

    readonly activeMode: Ref<DrawShapeMode | null> = ref(null);
    /** 是否正在编辑某个图形的顶点 */
    readonly editingShapeUuid: Ref<string | null> = ref(null);
    /** 是否处于编辑模式（供菜单/外部判断） */
    readonly shapeEditMode = ref(false);

    constructor(getMap: () => Map | null, callbacks: MapDrawControllerCallbacks = {}) {
        this.getMap = getMap;
        this.callbacks = callbacks;

        this.renderSource = new VectorSource({ wrapX: false });
        this.renderLayer = new VectorLayer({
            source: this.renderSource,
            zIndex: 50,
        });

        this.editSource = new VectorSource({ wrapX: false });
        this.editLayer = new VectorLayer({
            source: this.editSource,
            zIndex: 51,
        });

        // hitDetection 限定到 editLayer：只有当前编辑、被赋予可见控制线样式的原始几何可被拖动
        // pixelTolerance 调大到触屏友好：手指悬停/按在线条或区域边缘附近就能抓住顶点与线段
        this.modify = new Modify({
            source: this.editSource,
            hitDetection: this.editLayer,
            pixelTolerance: 22,
            style: () => createVertexHandleStyles(),
        });
        this.modify.setActive(false);
        /** 
         * 顶点拖拽过程中的几何变化监听（拖拽结束后解绑）；不能用 new Map（与 ol/Map 同名冲突）
         **/
        const modifyChangeKeys: Record<string, EventsKey> = {};
        this.modify.on('modifystart', (evt) => {
            this.modifying = true;
            evt.features.forEach((feature) => {
                if (!feature.get('editable')) return;
                const uuid = feature.get('shapeUuid') as string | undefined;
                const geometry = feature.getGeometry();
                if (!uuid || !geometry || modifyChangeKeys[uuid]) return;
                // 拖动顶点的全过程实时同步真实样式渲染（颜色/粗细/虚线/平滑曲线随顶点即时变化）
                modifyChangeKeys[uuid] = geometry.on('change', () => {
                    this.syncRenderGeometryFromEdit(feature as OLFeature<Geometry>);
                });
            });
        });
        this.modify.on('modifyend', (evt) => {
            evt.features.forEach((feature) => {
                if (!feature.get('editable')) return;
                const uuid = feature.get('shapeUuid') as string;
                // 解绑拖拽过程监听
                const key = modifyChangeKeys[uuid];
                if (key) {
                    unByKey(key);
                    delete modifyChangeKeys[uuid];
                }
                const geometry = extractRawGeometry(feature.getGeometry() as SimpleGeometry);
                if (!uuid || !geometry) return;
                const shapeType = feature.get('shapeType') as MapShapeType;
                const style = (feature.get('shapeStyle') || null) as ShapeStyle | null;
                this.refreshRenderFeature(uuid, geometry, style, shapeType);
                this.callbacks.onModifyEnd?.(uuid, geometry);
            });
            // 延后复位，避免同一轮事件末尾的 pointermove 立刻切走悬停目标
            setTimeout(() => { this.modifying = false; }, 0);
        });

        this.snap = new Snap({ source: this.editSource });
        this.snap.setActive(false);
    }

    /** 
     * 地图初始化后挂载
     */
    attach(): void {
        const map = this.getMap();
        if (!map || this.map) return;
        this.map = map;
        map.addLayer(this.renderLayer);
        map.addLayer(this.editLayer);
        map.addInteraction(this.modify);
        map.addInteraction(this.snap);

        this.escHandler = (e: KeyboardEvent) => {
            if (e.key !== 'Escape') return;
            if (this.activeMode.value) {
                this.cancelDraw();
            } else if (this.editingUuid) {
                this.endEditVertices();
            } else if (this.bulkMode) {
                // 编辑模式退出需要上层检查未提交草稿/未保存修改并弹确认
                this.callbacks.onEscapeKey?.();
            }
        };
        document.addEventListener('keydown', this.escHandler);
    }

    detach(): void {
        if (this.escHandler) {
            document.removeEventListener('keydown', this.escHandler);
            this.escHandler = null;
        }
        this.unbindHoverPointer();
        this.stopDrawInteraction();
        if (this.map) {
            this.map.removeInteraction(this.snap);
            this.map.removeInteraction(this.modify);
            this.map.removeLayer(this.editLayer);
            this.map.removeLayer(this.renderLayer);
        }
        this.map = null;
    }

    getLayer(): VectorLayer<VectorSource> {
        return this.renderLayer;
    }

    /** 
     * 查询某类图形当前是否可见
     */
    isTypeVisible(type: MapShapeType): boolean {
        return !this.typeHidden[type];
    }

    /**
     * 设置路径/区域图层显隐（图层面板"船长笔记"开关）。
     * 隐藏：渲染要素与编辑模式触控带都换成空样式，不渲染也不可命中；
     * 显示：按要素保存的 shapeStyle 还原。
     * 未提交草稿、正在顶点编辑/悬停拖点的图形不参与切换。
     */
    setTypeVisibility(type: MapShapeType, visible: boolean): void {
        this.typeHidden[type] = !visible;
        this.renderSource.forEachFeature(feature => {
            const uuid = feature.get('shapeUuid') as string | undefined;
            if (!uuid || feature.get('shapeType') !== type) return;
            if (isDraftUuid(uuid) || uuid === this.editingUuid || uuid === this.hoverUuid) return;
            const style = (feature.get('shapeStyle') || {}) as ShapeStyle;
            feature.setStyle(visible ? createShapeOlStyle(type, style) : INVISIBLE_STYLE);
        });
        this.editSource.forEachFeature(feature => {
            const uuid = feature.get('shapeUuid') as string | undefined;
            if (!uuid || feature.get('shapeType') !== type) return;
            if (uuid === this.editingUuid || uuid === this.hoverUuid) return;
            const style = (feature.get('shapeStyle') || {}) as ShapeStyle;
            feature.setStyle(visible ? createHitAreaStyle(style.fillColor, type) : INVISIBLE_STYLE);
        });
    }

    isActive(): boolean {
        return this.activeMode.value !== null;
    }

    /** 
     * 进入绘制模式
     */
    startDraw(mode: DrawShapeMode): void {
        const map = this.getMap();
        if (!map) return;
        this.attach();
        if (this.activeMode.value === mode) {
            this.cancelDraw();
            return;
        }
        this.stopDrawInteraction();
        this.endEditVertices();
        // 编辑模式下笔尖交给 Draw，临时关掉顶点拖拽，避免画线时误抓已有图形
        if (this.bulkMode) this.modify.setActive(false);

        this.draw = new Draw({
            source: this.renderSource,
            type: mode === 'path' ? 'LineString' : 'Polygon',
            style: createDrawStyle(mode),
            stopClick: true,
        });
        this.draw.on('drawend', (evt) => {
            // Draw 会自动把成品 feature 放进 renderSource，这里移除，改由成对的草稿图形承载
            const drawnFeature = evt.feature;
            setTimeout(() => {
                if (this.renderSource.hasFeature(drawnFeature)) this.renderSource.removeFeature(drawnFeature);
            }, 0);

            const raw = extractRawGeometry(drawnFeature.getGeometry() as SimpleGeometry);
            this.stopDrawInteraction();
            if (!raw) return;

            this.upsertDraft(mode, raw, this.bulkUserId);
            this.callbacks.onDrawEnd?.(mode, raw);
        });
        map.addInteraction(this.draw);
        // 编辑模式下 editSource 含全部图形，吸附会让画线被大量顶点干扰，故只在单图形编辑时吸附
        this.snap.setActive(!this.bulkMode);
        this.activeMode.value = mode;
    }

    /** 
     * 取消当前绘制（Esc / 再次点击按钮）
     */
    cancelDraw(): void {
        if (this.draw) {
            this.draw.abortDrawing();
        }
        this.stopDrawInteraction();
        // 尚未确认的草稿只有在 drawend 之后才存在；取消绘制按钮时不删除已完成待保存的草稿，
        // 草稿的删除由样式弹窗取消时显式调用 removeDraft()
    }

    private stopDrawInteraction(): void {
        if (this.draw && this.map) {
            this.map.removeInteraction(this.draw);
            this.draw.dispose();
        }
        this.draw = null;
        this.activeMode.value = null;
        if (this.bulkMode) {
            // 画完一笔后恢复悬停拖顶点；编辑模式不启用吸附
            this.modify.setActive(true);
            this.snap.setActive(false);
        } else {
            this.snap.setActive(this.editingUuid !== null);
        }
    }

    /* ----------------------------- 图形要素管理 ----------------------------- */

    private renderFeatureId(uuid: string): string {
        return `${uuid}::render`;
    }

    private findRenderFeature(uuid: string): OLFeature<Geometry> | undefined {
        return this.renderSource.getFeatureById(this.renderFeatureId(uuid)) as OLFeature<Geometry> | undefined;
    }

    private findEditFeature(uuid: string): OLFeature<Geometry> | undefined {
        return this.editSource.getFeatureById(uuid) as OLFeature<Geometry> | undefined;
    }

    private removePair(uuid: string): void {
        const render = this.findRenderFeature(uuid);
        if (render) this.renderSource.removeFeature(render);
        const edit = this.findEditFeature(uuid);
        if (edit) this.editSource.removeFeature(edit);
        if (this.hoverUuid === uuid) this.hoverUuid = null;
    }

    private addPair(shape: MapShape): void {
        const raw = parseShapeGeometry(shape);
        if (!raw) return;
        const style = parseShapeStyle(shape);

        // 渲染层只放平滑后的密线；原始顶点几何挂在属性上，进入顶点编辑时才据此建 edit 要素
        const renderFeature = new Feature({ geometry: buildRenderGeometry(raw, style) });
        renderFeature.setId(this.renderFeatureId(shape.uuid));
        renderFeature.set('shapeUuid', shape.uuid);
        renderFeature.set('shapeType', shape.shapeType);
        renderFeature.set('userId', shape.userId ?? null);
        renderFeature.set('shapeStyle', style);
        renderFeature.set('rawGeometry', raw);
        renderFeature.setStyle(createShapeOlStyle(shape.shapeType, style));
        // 图层面板隐藏了该类型时立即应用空样式（未提交草稿始终保持可见）
        if (!isDraftUuid(shape.uuid) && this.typeHidden[shape.shapeType]) {
            renderFeature.setStyle(INVISIBLE_STYLE);
        }
        this.renderSource.addFeature(renderFeature);

        if (this.editingUuid === shape.uuid) {
            // 图形在编辑中被整体替换（如保存后回灌），用最新原始几何重建编辑要素
            this.beginEditVertices(shape.uuid);
        } else if (this.bulkMode && shape.userId && shape.userId === this.bulkUserId) {
            // 编辑模式：本人图形（含刚画的草稿、保存回灌）同步挂一份透明触控带，供悬停拖顶点
            this.addBulkEditFeature(shape.uuid, raw, shape.shapeType, style);
        }
    }

    /** 
     * 编辑模式下为单个图形挂透明触控带 edit 要素（已存在则先重建）
     */
    private addBulkEditFeature(uuid: string, raw: ShapeGeometry, shapeType: MapShapeType, style: ShapeStyle): void {
        const existing = this.findEditFeature(uuid);
        if (existing) this.editSource.removeFeature(existing);
        const editFeature = new Feature({ geometry: buildEditGeometry(raw) });
        editFeature.setId(uuid);
        editFeature.set('editable', true);
        editFeature.set('bulk', true);
        editFeature.set('shapeUuid', uuid);
        editFeature.set('shapeType', shapeType);
        editFeature.set('shapeStyle', style);
        editFeature.setStyle(createHitAreaStyle(style.fillColor, shapeType));
        // 图层隐藏时触控带一并停用，避免悬停仍可拖动不可见图形
        if (this.typeHidden[shapeType]) editFeature.setStyle(INVISIBLE_STYLE);
        this.editSource.addFeature(editFeature);
    }

    /** 
     * 新增或更新一个已保存图形（uuid 变化用于保存草稿时把 draft 替换掉）
     */
    upsertShape(shape: MapShape): void {
        this.removePair(shape.uuid);
        this.addPair(shape);
    }

    /**
     * 绘制刚结束的待保存草稿（样式为默认）。
     * 每次绘制都生成唯一草稿 uuid，编辑模式下可连续保留多个未提交图形。
     * 返回新草稿 uuid。
     */
    upsertDraft(mode: DrawShapeMode, raw: ShapeGeometry, userId?: string | null): string {
        const draftStyle: ShapeStyle = mode === 'region'
            ? { color: DEFAULT_REGION_COLOR, opacity: DEFAULT_LINE_OPACITY, width: 4, dashed: false, smoothed: false, fillColor: DEFAULT_REGION_COLOR, fillOpacity: DEFAULT_FILL_OPACITY }
            : { color: DEFAULT_PATH_COLOR, opacity: DEFAULT_LINE_OPACITY, width: 4, dashed: false, smoothed: false };
        const draftUuid = `${DRAFT_SHAPE_UUID}#${++this.draftSeq}`;
        const draft = {
            uuid: draftUuid,
            userId: userId ?? null,
            shapeType: mode,
            geometry: JSON.stringify(raw),
            style: JSON.stringify(draftStyle),
        } as unknown as MapShape;
        this.addPair(draft);
        return draftUuid;
    }

    /** 
     * 删除草稿：传 uuid 只删指定草稿，不传则清空全部未提交草稿
     */
    removeDraft(uuid?: string): void {
        if (uuid) {
            this.removePair(uuid);
            return;
        }
        this.getDraftUuids().forEach(draftUuid => this.removePair(draftUuid));
    }

    /** 当前地图上全部未提交草稿 uuid */
    getDraftUuids(): string[] {
        return this.renderSource.getFeatures()
            .map(f => f.get('shapeUuid') as string)
            .filter(uuid => isDraftUuid(uuid));
    }

    removeShape(uuid: string): void {
        if (this.editingUuid === uuid) this.endEditVertices();
        this.removePair(uuid);
    }

    clearShapes(): void {
        // 编辑模式下不清空模式本身：外部会紧接着 upsertShape 重建，触控带随之重建
        if (!this.bulkMode) this.endEditVertices();
        this.hoverUuid = null;
        this.editSource.clear();
        this.renderSource.clear();
    }

    getShapeUuids(): string[] {
        return this.renderSource.getFeatures()
            .map(f => f.get('shapeUuid') as string)
            .filter((v, i, arr) => !!v && arr.indexOf(v) === i);
    }

    /** 仅更新指定草稿的样式（提交弹窗实时预览） */
    previewDraftStyle(draftUuid: string, mode: DrawShapeMode, raw: ShapeGeometry, style: ShapeStyle): void {
        const render = this.findRenderFeature(draftUuid);
        if (render) {
            render.setGeometry(buildRenderGeometry(raw, style));
            render.set('rawGeometry', raw);
            render.set('shapeStyle', style);
            render.setStyle(createShapeOlStyle(mode, style));
        }
        // 编辑模式下该草稿的触控带几何也同步，避免控制线停留在旧顶点上
        const edit = this.findEditFeature(draftUuid);
        if (edit) {
            edit.setGeometry(buildEditGeometry(raw));
            edit.set('shapeStyle', style);
        }
    }

    private refreshRenderFeature(uuid: string, raw: ShapeGeometry, style: ShapeStyle | null, shapeType: MapShapeType): void {
        const render = this.findRenderFeature(uuid);
        if (render) {
            render.setGeometry(buildRenderGeometry(raw, style || undefined));
            render.set('rawGeometry', raw);
            render.set('shapeStyle', style);
            render.set('shapeType', shapeType);
            // 顶点编辑期间渲染层也保持真实样式，白色虚线控制线由上层 editLayer 叠加
            render.setStyle(createShapeOlStyle(shapeType, style));
        }
    }

    /**
     * 顶点拖拽过程中的实时同步：只更新渲染几何（含平滑密线），
     * 使图形自身的颜色/粗细/虚线/填充随顶点即时变化；不触发保存回调。
     */
    private syncRenderGeometryFromEdit(feature: OLFeature<Geometry>): void {
        const uuid = feature.get('shapeUuid') as string | undefined;
        if (!uuid) return;
        const geometry = extractRawGeometry(feature.getGeometry() as SimpleGeometry);
        if (!geometry) return;
        const shapeType = feature.get('shapeType') as MapShapeType;
        const style = (feature.get('shapeStyle') || null) as ShapeStyle | null;
        const render = this.findRenderFeature(uuid);
        if (render) {
            render.setGeometry(buildRenderGeometry(geometry, style || undefined));
            render.set('rawGeometry', geometry);
        }
    }

    /* ------------------------------- 顶点编辑 ------------------------------- */

    beginEditVertices(uuid: string): boolean {
        const render = this.findRenderFeature(uuid);
        if (!render) return false;
        const raw = render.get('rawGeometry') as ShapeGeometry | undefined;
        if (!raw) return false;
        this.endEditVertices();

        const shapeType = render.get('shapeType') as MapShapeType;
        const style = (render.get('shapeStyle') || null) as ShapeStyle | null;

        // 编辑模式下该图形已有一份触控带 edit 要素，先移除再换成常显控制线
        const bulkEdit = this.findEditFeature(uuid);
        if (bulkEdit) this.editSource.removeFeature(bulkEdit);
        if (this.hoverUuid === uuid) this.hoverUuid = null;

        // editSource 平时为空，进入编辑才放入一个原始顶点要素交给 Modify/Snap
        const editFeature = new Feature({ geometry: buildEditGeometry(raw) });
        editFeature.setId(uuid);
        editFeature.set('editable', true);
        editFeature.set('bulk', false);
        editFeature.set('shapeUuid', uuid);
        editFeature.set('shapeType', shapeType);
        editFeature.set('shapeStyle', style);
        editFeature.setStyle(createEditOlStyle(style, shapeType));
        this.editSource.addFeature(editFeature);

        // 渲染层保持真实样式（颜色/粗细/虚线/填充/平滑），与白色虚线控制线叠加显示
        render.setGeometry(buildRenderGeometry(raw, style || undefined));
        render.setStyle(createShapeOlStyle(shapeType, style));

        this.editingUuid = uuid;
        this.editingShapeUuid.value = uuid;
        this.modify.setActive(true);
        this.snap.setActive(true);
        return true;
    }

    endEditVertices(): void {
        if (this.editingUuid) {
            const uuid = this.editingUuid;
            const edit = this.findEditFeature(uuid);
            const render = this.findRenderFeature(uuid);
            if (edit && render) {
                const shapeType = edit.get('shapeType') as MapShapeType;
                const style = (edit.get('shapeStyle') || null) as ShapeStyle | null;
                render.setStyle(createShapeOlStyle(shapeType, style));
                // 仍处于编辑模式：补回触控带，让该图形继续可悬停编辑
                if (this.bulkMode) {
                    const raw = render.get('rawGeometry') as ShapeGeometry | undefined;
                    if (raw) this.addBulkEditFeature(uuid, raw, shapeType, style || {});
                }
            } else if (edit) {
                this.editSource.removeFeature(edit);
            }
            if (!edit && this.bulkMode && render) {
                // 兜底：edit 要素缺失但 render 仍在，按 render 属性补触控带
                const raw = render.get('rawGeometry') as ShapeGeometry | undefined;
                const style = (render.get('shapeStyle') || null) as ShapeStyle | null;
                if (raw) this.addBulkEditFeature(uuid, raw, render.get('shapeType') as MapShapeType, style || {});
            }
        }
        this.editingUuid = null;
        this.editingShapeUuid.value = null;
        if (this.bulkMode) {
            if (!this.activeMode.value) this.modify.setActive(true);
            this.snap.setActive(false);
        } else if (!this.activeMode.value) {
            this.modify.setActive(false);
            this.snap.setActive(false);
        }
    }

    /** 
     * 读取编辑特征当前的原始经纬度几何（编辑模式下触控带要素同样可读）
     */
    getEditingGeometry(uuid: string): ShapeGeometry | null {
        const edit = this.findEditFeature(uuid);
        if (!edit) return null;
        return extractRawGeometry(edit.getGeometry() as SimpleGeometry);
    }

    /* ------------------------------ 编辑模式 ------------------------------ */

    isBulkEditing(): boolean {
        return this.bulkMode;
    }

    /**
     * 进入/退出编辑模式。
     * 进入后：本人在地图上的全部图形（含未提交草稿）各挂一份透明触控带，
     * 鼠标悬停时显示原始顶点控制线并可直接拖拽，画新图形期间自动临时让位给 Draw。
     */
    setEditMode(active: boolean, userId?: string | null): void {
        const map = this.getMap();
        if (!map) return;
        this.attach();

        if (active) {
            this.bulkMode = true;
            this.bulkUserId = userId || null;
            // 若正处在单图形顶点编辑，先收尾（bulkMode 已置真，会自动补回触控带）
            this.endEditVertices();

            // 为地图上每个本人图形补触控带（已保存图形与未提交草稿统一按 render 上的归属判断）
            this.renderSource.getFeatures().forEach(renderFeature => {
                const uuid = renderFeature.get('shapeUuid') as string | undefined;
                if (!uuid || renderFeature.get('userId') !== this.bulkUserId) return;
                if (this.findEditFeature(uuid)) return;
                const raw = renderFeature.get('rawGeometry') as ShapeGeometry | undefined;
                if (!raw) return;
                const shapeType = renderFeature.get('shapeType') as MapShapeType;
                const style = (renderFeature.get('shapeStyle') || null) as ShapeStyle | null;
                this.addBulkEditFeature(uuid, raw, shapeType, style || {});
            });

            this.shapeEditMode.value = true;
            if (!this.activeMode.value) this.modify.setActive(true);
            this.snap.setActive(false);
            this.bindHoverPointer();
            return;
        }

        // 退出：先关模式标记，再收尾单图形编辑（此时不会补触控带），最后清掉所有 bulk 要素
        this.unbindHoverPointer();
        this.bulkMode = false;
        this.bulkUserId = null;
        this.hoverUuid = null;
        this.shapeEditMode.value = false;
        this.endEditVertices();

        const bulkFeatures = this.editSource.getFeatures()
            .filter(f => f.get('bulk') === true);
        bulkFeatures.forEach(f => this.editSource.removeFeature(f));

        if (!this.activeMode.value && !this.editingUuid) {
            this.modify.setActive(false);
            this.snap.setActive(false);
        }
    }

    private bindHoverPointer(): void {
        const map = this.map;
        if (!map || this.hoverListenerKey) return;
        this.hoverListenerKey = map.on('pointermove', (evt) => {
            if (!this.bulkMode || this.activeMode.value || this.editingUuid || this.modifying) {
                return;
            }
            let hitUuid: string | null = null;
            map.forEachFeatureAtPixel(evt.pixel, (feature) => {
                if (feature.get('bulk') === true) {
                    hitUuid = feature.get('shapeUuid') as string;
                    return true;
                }
                return false;
            }, { layerFilter: layer => layer === this.editLayer, hitTolerance: 12 });
            this.setHover(hitUuid);
        });
    }

    private unbindHoverPointer(): void {
        if (this.hoverListenerKey) {
            unByKey(this.hoverListenerKey);
            this.hoverListenerKey = null;
        }
    }

    /** 
     * 悬停目标切换：命中的图形显示白色控制顶点线，移出后还原为透明触控带
     */
    private setHover(uuid: string | null): void {
        if (uuid === this.hoverUuid) return;

        if (this.hoverUuid) {
            const oldEdit = this.findEditFeature(this.hoverUuid);
            if (oldEdit) {
                const shapeType = oldEdit.get('shapeType') as MapShapeType;
                const style = (oldEdit.get('shapeStyle') || null) as ShapeStyle | null;
                oldEdit.setStyle(createHitAreaStyle(style?.fillColor, shapeType));
            }
        }

        this.hoverUuid = uuid;

        if (uuid) {
            const edit = this.findEditFeature(uuid);
            if (edit) {
                const shapeType = edit.get('shapeType') as MapShapeType;
                const style = (edit.get('shapeStyle') || null) as ShapeStyle | null;
                edit.setStyle(createEditOlStyle(style, shapeType));
            }
        }
    }

    getShapeStyle(uuid: string): ShapeStyle {
        const edit = this.findEditFeature(uuid);
        if (edit) return (edit.get('shapeStyle') || {}) as ShapeStyle;
        const render = this.findRenderFeature(uuid);
        return (render?.get('shapeStyle') || {}) as ShapeStyle;
    }

    /** 
     * 获取图形渲染要素的空间范围，用于定位/聚焦
     */
    getShapeExtent(uuid: string): number[] | null {
        const render = this.findRenderFeature(uuid);
        const geometry = render?.getGeometry();
        return geometry ? geometry.getExtent() : null;
    }

    /** 
     * 判断像素命中的图形（render feature），返回 shapeUuid
     */
    forEachShapeAtPixel(pixel: number[], callback: (uuid: string, shapeType: MapShapeType) => void): void {
        const map = this.getMap();
        if (!map) return;
        map.forEachFeatureAtPixel(pixel, (feature) => {
            const uuid = feature.get('shapeUuid') as string | undefined;
            if (uuid) {
                const shapeType = feature.get('shapeType') as MapShapeType;
                // 图层面板隐藏的类型不可被右键/单击命中
                if (this.typeHidden[shapeType]) return false;
                callback(uuid, shapeType);
                return true;
            }
            return false;
        }, { layerFilter: layer => layer === this.renderLayer, hitTolerance: 6 });
    }

    /** 
     * 取出图形的渲染要素（框选后统一平移要直接操作它）
     */
    getRenderFeature(uuid: string): OLFeature<Geometry> | null {
        return (this.findRenderFeature(uuid) as OLFeature<Geometry>) || null;
    }

    /** 
     * 遍历与给定投影范围相交的图形（框选用）
     */
    forEachShapeInExtent(extent: number[], callback: (uuid: string, shapeType: MapShapeType) => void): void {
        this.renderSource.forEachFeatureIntersectingExtent(extent, (feature) => {
            const uuid = feature.get('shapeUuid') as string | undefined;
            if (!uuid) return;
            const shapeType = feature.get('shapeType') as MapShapeType;
            // 框选同样跳过被图层面板隐藏的类型
            if (this.typeHidden[shapeType]) return;
            callback(uuid, shapeType);
        });
    }

    /**
     * 框选整体平移后同步原始顶点几何：渲染密线已被 Translate 挪走，
     * 这里把原始经纬度顶点在投影坐标下平移同一个 dx/dy，再重建渲染几何，
     * 保证平滑曲线/闭合环与画面一致。
     */
    applyShapeTranslation(uuid: string, dx: number, dy: number): ShapeGeometry | null {
        const render = this.findRenderFeature(uuid);
        if (!render) return null;
        const raw = render.get('rawGeometry') as ShapeGeometry | undefined;
        if (!raw) return null;

        const shiftLonLat = (coord: number[]): number[] => {
            const [x, y] = fromLonLat([coord[0], coord[1]]);
            return toLonLat([x + dx, y + dy]);
        };

        const shifted: ShapeGeometry = raw.type === 'LineString'
            ? {
                type: 'LineString',
                coordinates: (raw.coordinates as number[][]).map(shiftLonLat),
            }
            : {
                type: 'Polygon',
                coordinates: (raw.coordinates as number[][][]).map(ring => ring.map(shiftLonLat)),
            };

        const shapeType = render.get('shapeType') as MapShapeType;
        const style = (render.get('shapeStyle') || null) as ShapeStyle | null;
        this.refreshRenderFeature(uuid, shifted, style, shapeType);

        // 若该图形正处于顶点编辑，控制线要素也要一起挪，避免编辑态几何错位
        const edit = this.findEditFeature(uuid);
        if (edit) edit.setGeometry(buildEditGeometry(shifted));

        return shifted;
    }

    dispose(): void {
        this.detach();
        this.editSource.clear();
        this.renderSource.clear();
    }
}
