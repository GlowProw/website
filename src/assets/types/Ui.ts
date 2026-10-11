/**
 * 纯视觉 / 通用 UI 组件的内部类型
 */
import type {CSSProperties} from "vue";

// DateRangePicker.vue

export type DateRangePickerMode = 'date' | 'month' | 'year';

export interface DateRangePickerProps {
  modelValue?: string | string[] | null;
  mode?: DateRangePickerMode;
  allowModeSwitch?: boolean;
  availableModes?: DateRangePickerMode[];
  disableFuture?: boolean;
  disablePast?: boolean;
  min?: string | Date | number | null;
  max?: string | Date | number | null;
  placeholder?: string;
  label?: string;
  clearable?: boolean;
  disabled?: boolean;
  readonly?: boolean;
  density?: 'default' | 'comfortable' | 'compact';
  variant?: any;
  valueFormat?: 'iso' | 'formatted' | 'array';
  dialogTitle?: string;
}

export interface CalendarCell {
  dateStr: string;
  dayNumber: number;
  year: number;
  month: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isDisabled: boolean;
  isStart: boolean;
  isEnd: boolean;
  isInRange: boolean;
  isHoverEnd: boolean;
}

export interface MonthCell {
  monthStr: string;
  monthNumber: number;
  name: string;
  isDisabled: boolean;
  isStart: boolean;
  isEnd: boolean;
  isInRange: boolean;
}

export interface YearCell {
  year: number;
  isDisabled: boolean;
  isStart: boolean;
  isEnd: boolean;
  isInRange: boolean;
}

// 常用快捷区间选项
export interface PresetOption {
  key: string;
  label: string;
  handler: () => void;
  visible: boolean;
}

// LightRays.vue

export type RaysOrigin =
    | 'top-center'
    | 'top-left'
    | 'top-right'
    | 'right'
    | 'left'
    | 'bottom-center'
    | 'bottom-right'
    | 'bottom-left';

export interface LightRaysProps {
  raysOrigin?: RaysOrigin;
  raysColor?: string;
  raysSpeed?: number;
  lightSpread?: number;
  rayLength?: number;
  pulsating?: boolean;
  fadeDistance?: number;
  saturation?: number;
  followMouse?: boolean;
  mouseInfluence?: number;
  noiseAmount?: number;
  distortion?: number;
  className?: string;
  quality?: 'low' | 'medium' | 'high';
  fixedSize?: { width: number; height: number } | null;
}

export interface MousePosition {
  x: number;
  y: number;
}

export interface AnchorAndDirection {
  anchor: [number, number];
  dir: [number, number];
}

export interface WebGLUniforms {
  iTime: { value: number };
  iResolution: { value: [number, number] };
  rayPos: { value: [number, number] };
  rayDir: { value: [number, number] };
  raysColor: { value: [number, number, number] };
  raysSpeed: { value: number };
  lightSpread: { value: number };
  rayLength: { value: number };
  pulsating: { value: number };
  fadeDistance: { value: number };
  saturation: { value: number };
  mousePos: { value: [number, number] };
  mouseInfluence: { value: number };
  noiseAmount: { value: number };
  distortion: { value: number };
}

// SpotlightCard.vue

export interface Position {
  x: number;
  y: number;
}

export interface SpotlightCardProps {
  className?: string;
  spotlightColor?: string;
}

// BaseScrollList.vue / HorizontalScrollList.vue / VerticalScrollList.vue

export interface ScrollListProps {
  direction?: 'horizontal' | 'vertical'
  btnSize?: number
  isIndicator?: boolean
  gap?: number
  showControls?: boolean
  showScrollIndicator?: boolean
  hideScrollbar?: boolean
  scrollStep?: number
  prevButtonAriaLabel?: string
  nextButtonAriaLabel?: string
  leftButtonAriaLabel?: string
  rightButtonAriaLabel?: string
  wheelScroll?: boolean
  dragSensitivity?: number
  useRAF?: boolean
  useShiftKey?: boolean
  wheelSensitivity?: number
  forceDraggable?: boolean
  isFollowScreenCenter?: boolean
  followScreenSafeDistance?: number
  height?: string | number
  maxHeight?: string | number
  width?: string | number
}

export interface ScrollState {
  scrollPosition: number
  scrollLeft: number
  scrollTop: number
  canScrollPrev: boolean
  canScrollNext: boolean
  canScrollLeft: boolean
  canScrollRight: boolean
  canScrollUp: boolean
  canScrollDown: boolean
  maxScroll: number
  canScroll: boolean
  canScrollHorizontally: boolean
  canScrollVertically: boolean
}

export interface HorizontalScrollListProps extends Omit<ScrollListProps, 'direction'> {}

export interface VerticalScrollListProps extends Omit<ScrollListProps, 'direction'> {
  topButtonAriaLabel?: string
  bottomButtonAriaLabel?: string
}

// ShinyText.vue
export interface ShinyTextProps {
  text: string;
  disabled?: boolean;
  speed?: number;
  className?: string;
}

// Silk.vue
export interface SilkProps {
  speed?: number;
  scale?: number;
  color?: string;
  noiseIntensity?: number;
  rotation?: number;
  className?: string;
  style?: CSSProperties;
}

// Noise.vue
export interface NoiseProps {
  patternRefreshInterval?: number;
  patternAlpha?: number;
  mixBlendMode?: string;
}

// textarea/index.vue
export interface ToolbarItem {
  list?: any

  [key: string]: any
}

// AffixBoxHasTitleView.vue
export interface AffixBoxHasTitleViewProps {
  disabled?: boolean
  disabledTitle?: boolean
  offsetTop?: number
  offsetBottom?: number
}

// AffixContainerView.vue
export interface AffixContainerViewProps {
  offsetTop?: number
  offsetBottom?: number
  disabled?: boolean
  // 简单的 sticky bottom 吸底模式
  affixBottom?: boolean
}

// AffixView.vue
export interface AffixViewProps {
  direction?: 'left' | 'right'
  offsetTop?: number
  offsetBottom?: number
  affixBgClass?: string
  disabled?: boolean
}

// SwipeDrawer.vue
export interface SwipeDrawerProps {
  // 是否展开，配合 v-model 使用
  modelValue: boolean
  // 抽屉从哪一侧滑出，收起手势方向随之改变
  side?: 'left' | 'right'
  // 面板宽度
  width?: string
  // 面板最大宽度
  maxWidth?: string
  // 点击遮罩是否关闭
  closeOnOverlay?: boolean
  // 打开时是否禁用 window 滚动，默认 true
  lockScroll?: boolean
  // 边缘起手热区宽度（px），鼠标按住或触摸该区域向关闭方向滑动可收起
  edgeWidth?: number
}

// CountUp.vue

export interface CountUpProps {
  to: number;
  from?: number;
  direction?: 'up' | 'down';
  delay?: number;
  duration?: number;
  className?: string;
  startWhen?: boolean;
  separator?: string;
  onStart?: () => void;
  onEnd?: () => void;
}

// CountdownWidget.vue

export interface CountdownWidgetProps {
  target?: string | number | Date | null;
  startAt?: string | number | Date | null;
  status?: string;
  interval?: number;
  showPrefix?: boolean;
  showSeconds?: boolean;
  tag?: string;
  className?: string;
}

// HalfScreenBannerText.vue

export interface HalfScreenBannerTextProps {
  title?: string;
  subtitle?: string;
  name?: string;
}

// ImageMagnifyingGlass.vue

export interface ImageMagnifyingGlassProps {
  scale?: number
  lensSize?: number
  position?: 'top-right' | 'bottom-right' | 'top-left' | 'bottom-left'
  zoomViewBorder?: boolean
}
