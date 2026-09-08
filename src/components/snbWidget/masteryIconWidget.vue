<script setup lang="ts">
import {computed, ref, watch} from "vue";
import {useAppStore} from "~/stores/appStore";
import {useCDNAssetsServiceStore} from "~/stores/cdnAssetsStore";
import {useTooltipFollow} from "@/assets/sripts/use_tooltip_follow";
import {use_icon_global_Style} from "@/assets/sripts/use_icon_global_Style";
import {Masterys} from "glow-prow-data";
import MasteryCardDetail from "./masteryCardDetail.vue";
import Loading from "../Loading.vue";
import {rarity} from "@/assets/sripts/index";

const props = withDefaults(defineProps<{
  id?: string,
  category?: string,
  role?: string,
  size?: number | string,
  withBackground?: boolean,
  isShowOpenDetail?: boolean,
  isOpenDetail?: boolean,
  isOpenNewWindow?: boolean,
  isShowTooltip?: boolean,
  margin?: number,
  padding?: number,
}>(), {
  withBackground: false,
  isShowOpenDetail: true,
  isOpenDetail: true,
  isOpenNewWindow: false,
  isShowTooltip: true,
  margin: 0,
  padding: 0,
});

const appStore = useAppStore();
const cdnStore = useCDNAssetsServiceStore();
const {tooltipPos, onMouseMove, onMouseEnter} = useTooltipFollow();
const {useIconImagePadding, useIconImageMargin} = use_icon_global_Style();

const isDirectFallback = ref(false);
const isImgError = ref(false),
    rarityColorConfig = rarity.color;

// 建立专精技能全局索引以加速查找
const masteryNodesMap: Record<string, any> = {};
for (const tree of Object.values(Masterys)) {
  if (tree && (tree as any).nodes) {
    for (const node of Object.values((tree as any).nodes)) {
      if ((node as any).id) masteryNodesMap[(node as any).id] = node;
      if ((node as any).key) masteryNodesMap[(node as any).key] = node;
      if ((node as any).skill) masteryNodesMap[(node as any).skill] = node;
    }
  }
}

// 根据 ID 或 name 解析节点元数据
const nodeData = computed(() => {
  if (props.id && masteryNodesMap[props.id]) {
    return masteryNodesMap[props.id];
  }
  return null;
});

const effectiveCategory = computed(() => {
  return props.category || nodeData.value?.category || 'default';
});

const effectiveRole = computed(() => {
  return props.role || nodeData.value?.role || 'buff';
});

const effectiveSkill = computed(() => {
  return nodeData.value?.skill || nodeData.value?.id || props.id || '';
});

const effectiveId = computed(() => {
  return nodeData.value?.id || props.id || '';
});

const primaryUrl = computed(() => {
  const rawSkill = effectiveSkill.value;
  if (!rawSkill) return '';
  const skill = typeof rawSkill === 'object' && rawSkill !== null
      ? ((rawSkill as any)?.id || (rawSkill as any)?.key || (rawSkill as any)?.skill || '')
      : String(rawSkill);
  if (!skill) return '';

  return cdnStore.currentService.url({
    'glow-prow': {
      id: skill,
      category: 'mastery'
    },
    'glow-prow-zh-cn': {
      id: skill,
      category: 'mastery'
    },
    'local-test': {
      id: skill,
      category: 'mastery'
    }
  });
});

const directStaticUrl = computed(() => {
  const rawSkill = effectiveSkill.value;
  if (!rawSkill) return '';
  const skill = typeof rawSkill === 'object' && rawSkill !== null
      ? ((rawSkill as any)?.id || (rawSkill as any)?.key || (rawSkill as any)?.skill || '')
      : String(rawSkill);
  if (!skill) return '';
  return `https://assets.glow-prow.top/mastery/${skill}.webp`;
});

const iconUrl = computed(() => {
  if (isDirectFallback.value) {
    return directStaticUrl.value;
  }
  return primaryUrl.value || directStaticUrl.value;
});

const onImageError = () => {
  if (!isDirectFallback.value) {
    isDirectFallback.value = true;
  } else {
    isImgError.value = true;
  }
};

watch(() => effectiveSkill.value, () => {
  isDirectFallback.value = false;
  isImgError.value = false;
});

const bgGradientClass = computed(() => {
  if (!props.withBackground) return '';
  if (effectiveRole.value === 'seasonalPerk') return 'bg-gradient-seasonal';
  switch (effectiveCategory.value) {
    case 'defensive':
      return 'bg-gradient-defensive';
    case 'offensive':
      return 'bg-gradient-offensive';
    case 'impetus':
      return 'bg-gradient-impetus';
    default:
      return 'bg-gradient-default';
  }
});

const containerStyle = computed(() => {
  if (props.size !== undefined && props.size !== null && props.size !== '') {
    const s = String(props.size).trim();
    const sizeVal = isNaN(Number(s)) ? s : `${s}px`;
    return {
      width: sizeVal,
      height: sizeVal,
      minWidth: sizeVal,
      minHeight: sizeVal,
    };
  }
  return {
    width: '100%',
    height: '100%',
  };
});

const computedPadding = useIconImagePadding(props.padding, 0);
const computedMargin = useIconImageMargin(props.margin, 0);

const computedPaddingClass = computed(() => {
  const p = computedPadding.value;
  return (p !== undefined && p !== null && p > 0) ? `pa-${p}` : '';
});

const computedMarginClass = computed(() => {
  const m = computedMargin.value;
  return (m !== undefined && m !== null && m > 0) ? `ma-${m}` : '';
});

const fallbackIconSize = computed(() => {
  if (props.size !== undefined && props.size !== null && props.size !== '') {
    const num = parseFloat(String(props.size));
    if (!isNaN(num)) {
      return Math.max(12, Math.min(36, Math.round(num * 0.6)));
    }
  }
  return 24;
});

const isOpenNewWindow = computed({
  get: () => appStore.itemOpenNewWindow || props.isOpenNewWindow,
  set: (value) => appStore.toggleItemOpenNewWindow(value)
});

defineOptions({
  name: "MasteryIconWidget"
});
</script>

<template>
  <v-tooltip
      v-if="effectiveId && isShowTooltip"
      min-width="420"
      max-width="450"
      interactive
      :offset="[30, 10]"
      location="right top"
      content-class="pa-0 bg-transparent"
      :target="[tooltipPos.x, tooltipPos.y]">
    <template v-slot:activator="{ props: activatorProps }">
      <v-card
          @mousemove="onMouseMove"
          @mouseenter="onMouseEnter"
          ref="targetElement"
          width="100%"
          height="100%"
          v-bind="activatorProps"
          :to="isOpenDetail ? `/codex/mapLocation/${props?.id}` : ''"
          :target="isOpenNewWindow ? '_blank' : '_self'"
          :class="[
              'prohibit-drag',
              `ma-${computedMargin}`,
              `pa-${computedPadding}`,
          ]">
        <div class="d-flex align-center justify-center w-100 h-100 position-relative">
          <v-img
              v-if="iconUrl && !isImgError"
              :src="iconUrl"
              @error="onImageError"
              referrerpolicy="no-referrer"
              class="pointer-events-none prohibit-drag w-100 h-100"
              aspect-ratio="1"
              contain>
            <template v-slot:error>
              <div class="d-flex align-center justify-center w-100 h-100">
                <v-icon :size="fallbackIconSize" icon="mdi-transit-connection-variant" class="opacity-40 text-amber"></v-icon>
              </div>
            </template>
            <template v-slot:placeholder>
              <div class="d-flex align-center justify-center w-100 h-100">
                <Loading :size="fallbackIconSize"/>
              </div>
            </template>
          </v-img>
          <div v-else class="d-flex align-center justify-center w-100 h-100">
            <v-icon :size="fallbackIconSize" icon="mdi-transit-connection-variant" class="opacity-40 text-amber"></v-icon>
          </div>
        </div>
      </v-card>
    </template>
    <MasteryCardDetail
        :id="effectiveId"
        :is-show-open-detail="props.isShowOpenDetail"
    />
  </v-tooltip>

  <v-card
      v-else
      width="stretch"
      height="stretch"
      variant="tonal"
      color="transparent"
      :to="isOpenDetail && effectiveId ? `/codex/mastery/${effectiveId}` : undefined"
      :target="isOpenNewWindow ? '_blank' : '_self'"
      :class="[
        'mastery-icon-container prohibit-drag',
        'd-flex align-center justify-center position-relative text-decoration-none',
        bgGradientClass,
        computedMarginClass,
        computedPaddingClass,
        {
          'cursor-pointer': isOpenDetail && effectiveId,
          'with-bg': withBackground,
          'shape-diamond': withBackground && effectiveRole === 'seasonalPerk',
          'shape-circle': withBackground && effectiveRole !== 'seasonalPerk',
        }
      ]"
      :style="containerStyle">
    <div class="d-flex align-center justify-center w-100 h-100 position-relative">
      <v-img
          v-if="iconUrl && !isImgError"
          :src="iconUrl"
          @error="onImageError"
          referrerpolicy="no-referrer"
          class="pointer-events-none prohibit-drag w-100 h-100"
          aspect-ratio="1"
          contain>
        <template v-slot:error>
          <div class="d-flex align-center justify-center w-100 h-100">
            <v-icon :size="fallbackIconSize" icon="mdi-transit-connection-variant" class="opacity-40 text-amber"></v-icon>
          </div>
        </template>
        <template v-slot:placeholder>
          <div class="d-flex align-center justify-center w-100 h-100">
            <Loading :size="fallbackIconSize"/>
          </div>
        </template>
      </v-img>
      <div v-else class="d-flex align-center justify-center w-100 h-100">
        <v-icon :size="fallbackIconSize" icon="mdi-transit-connection-variant" class="opacity-40 text-amber"></v-icon>
      </div>
    </div>
  </v-card>
</template>

<style scoped lang="less">
</style>
