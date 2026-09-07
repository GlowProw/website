<script setup lang="ts">
import {computed, ref, watch} from "vue";
import {useAppStore} from "~/stores/appStore";
import {useCDNAssetsServiceStore} from "~/stores/cdnAssetsStore";
import {useTooltipFollow} from "@/assets/sripts/use_tooltip_follow";
import {use_icon_global_Style} from "@/assets/sripts/use_icon_global_Style";
import {Masterys} from "glow-prow-data";
import MasteryCardDetail from "./masteryCardDetail.vue";

const props = withDefaults(defineProps<{
  id?: string,
  name?: string,
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
const {currentService: currentImageService} = useCDNAssetsServiceStore();
const {tooltipPos, onMouseMove, onMouseEnter} = useTooltipFollow();
const {useIconImagePadding, useIconImageMargin} = use_icon_global_Style();

const isCdnApiError = ref(false);

// 根据 ID 或 name 解析节点元数据
const nodeData = computed(() => {
  if (props.id) {
    for (const tree of Object.values(Masterys)) {
      if (tree && (tree as any).nodes) {
        if ((tree as any).nodes[props.id]) {
          return (tree as any).nodes[props.id];
        }
        for (const node of Object.values((tree as any).nodes)) {
          if ((node as any).key === props.id || (node as any).id === props.id || (node as any).skill === props.id) {
            return node;
          }
        }
      }
    }
  }
  if (props.name) {
    for (const tree of Object.values(Masterys)) {
      if (tree && (tree as any).nodes) {
        for (const node of Object.values((tree as any).nodes)) {
          if ((node as any).id === props.name || (node as any).key === props.name || (node as any).skill === props.name) {
            return node;
          }
        }
      }
    }
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
  return props.name || nodeData.value?.skill || nodeData.value?.id || props.id || '';
});

const effectiveId = computed(() => {
  return props.id || nodeData.value?.key || nodeData.value?.id || '';
});

const cdnUrl = computed(() => {
  const rawSkill = effectiveSkill.value;
  if (!rawSkill) return '';
  const skill = typeof rawSkill === 'object' ? ((rawSkill as any)?.skill || (rawSkill as any)?.id || '') : String(rawSkill);
  if (!skill) return '';
  return currentImageService.url({
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
  const skill = effectiveSkill.value;
  if (!skill) return '';
  return `https://assets.glow-prow.top/mastery/${skill}.webp`;
});

const iconUrl = computed(() => {
  if (isCdnApiError.value) {
    return directStaticUrl.value;
  }
  return cdnUrl.value || directStaticUrl.value;
});

const onImageError = () => {
  if (!isCdnApiError.value) {
    isCdnApiError.value = true;
  }
};

watch(() => effectiveSkill.value, () => {
  isCdnApiError.value = false;
});

const bgGradientClass = computed(() => {
  if (!props.withBackground) return '';
  if (effectiveRole.value === 'seasonalPerk') return 'bg-gradient-seasonal';
  switch (effectiveCategory.value) {
    case 'defensive': return 'bg-gradient-defensive';
    case 'offensive': return 'bg-gradient-offensive';
    case 'impetus': return 'bg-gradient-impetus';
    default: return 'bg-gradient-default';
  }
});

const computedSize = computed(() => {
  if (props.size !== undefined && props.size !== null && props.size !== '') {
    const s = String(props.size).trim();
    return isNaN(Number(s)) ? s : `${s}px`;
  }
  return '100%';
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
  if (!computedSize.value) return 18;
  const num = parseFloat(computedSize.value);
  if (isNaN(num)) return 18;
  return Math.max(10, Math.min(24, Math.round(num * 0.75)));
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
          :is="isOpenDetail && effectiveId ? 'router-link' : 'div'"
          :to="isOpenDetail && effectiveId ? `/codex/mastery/${effectiveId}` : undefined"
          :target="isOpenNewWindow ? '_blank' : '_self'"
          v-bind="activatorProps"
          @mousemove="onMouseMove"
          @mouseenter="onMouseEnter"
          :class="[
            'mastery-icon-container',
            'd-inline-flex align-center justify-center position-relative text-decoration-none',
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
          :style="{
            width: computedSize,
            height: computedSize,
            minWidth: computedSize,
            minHeight: computedSize,
            maxWidth: computedSize,
            maxHeight: computedSize,
            flexShrink: 0,
          }">
        <v-img
            v-if="iconUrl"
            :src="iconUrl"
            @error="onImageError"
            :width="computedSize"
            :height="computedSize"
            aspect-ratio="1"
            class="pointer-events-none w-100 h-100"
            contain>
          <template v-slot:placeholder>
            <div class="d-flex align-center justify-center fill-height">
              <v-icon :size="fallbackIconSize" color="amber" class="opacity-40">mdi-flare</v-icon>
            </div>
          </template>
        </v-img>
        <v-icon v-else :size="fallbackIconSize" color="amber">mdi-flare</v-icon>
      </v-card>
    </template>
    <MasteryCardDetail
        :id="effectiveId"
        :is-show-open-detail="props.isShowOpenDetail"
    />
  </v-tooltip>

  <component
      :is="isOpenDetail && effectiveId ? 'router-link' : 'div'"
      :to="isOpenDetail && effectiveId ? `/codex/mastery/${effectiveId}` : undefined"
      :target="isOpenNewWindow ? '_blank' : '_self'"
      v-else
      :class="[
        'mastery-icon-container',
        'd-inline-flex align-center justify-center position-relative text-decoration-none',
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
      :style="{
        width: computedSize,
        height: computedSize,
        minWidth: computedSize,
        minHeight: computedSize,
        maxWidth: computedSize,
        maxHeight: computedSize,
        flexShrink: 0,
      }">
    <v-img
        v-if="iconUrl"
        :src="iconUrl"
        @error="onImageError"
        :width="computedSize"
        :height="computedSize"
        aspect-ratio="1"
        class="pointer-events-none w-100 h-100"
        contain>
      <template v-slot:placeholder>
        <div class="d-flex align-center justify-center fill-height">
          <v-icon :size="fallbackIconSize" color="amber" class="opacity-40">mdi-flare</v-icon>
        </div>
      </template>
    </v-img>
    <v-icon v-else :size="fallbackIconSize" color="amber">mdi-flare</v-icon>
  </component>
</template>

<style scoped lang="less">
.mastery-icon-container {
}
</style>
