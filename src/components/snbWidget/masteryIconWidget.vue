<script setup lang="ts">
import {computed, ref, watch} from "vue";
import {useAppStore} from "~/stores/appStore";
import {useAssetsStore} from "~/stores/assetsStore";
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
  margin: 1,
  padding: 1,
});

const appStore = useAppStore();
const {serializationMap} = useAssetsStore();
const {tooltipPos, onMouseMove, onMouseEnter} = useTooltipFollow();
const {useIconImagePadding, useIconImageMargin} = use_icon_global_Style();

// @ts-ignore
const masteryImages = import.meta.glob('@glow-prow-assets/mastery/*.webp', {eager: true});
// @ts-ignore
const infoImages = import.meta.glob('@glow-prow-assets/mastery/information/*.webp', {eager: true});

const masteryMap = serializationMap(masteryImages);
const infoMap = serializationMap(infoImages);

// 根据 ID 或 name 解析节点元数据
const nodeData = computed(() => {
  if (props.id) {
    for (const tree of Object.values(Masterys)) {
      if (tree && (tree as any).nodes && (tree as any).nodes[props.id]) {
        return (tree as any).nodes[props.id];
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
  return props.name || nodeData.value?.skill || props.id || '';
});

const effectiveId = computed(() => {
  return props.id || nodeData.value?.id || '';
});

const iconUrl = computed(() => {
  const skill = effectiveSkill.value;
  if (!skill) return '';
  const raw = masteryMap[skill] || infoMap[skill];
  if (typeof raw === 'object' && raw?.default) return raw.default;
  if (typeof raw === 'string') return raw;
  return '';
});

const bgGradientClass = computed(() => {
  if (!props.withBackground) return '';
  switch (effectiveCategory.value) {
    case 'defensive': return 'bg-gradient-defensive';
    case 'offensive': return 'bg-gradient-offensive';
    case 'impetus': return 'bg-gradient-impetus';
    default: return 'bg-gradient-default';
  }
});

const computedSize = computed(() => {
  if (!props.size) return undefined;
  return typeof props.size === 'number' ? `${props.size}px` : props.size;
});

const computedPadding = useIconImagePadding(props.padding);
const computedMargin = useIconImageMargin(props.margin);

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
      <component
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
            `ma-${computedMargin}`,
            `pa-${computedPadding}`,
            {
              'cursor-pointer': isOpenDetail,
              'with-bg': withBackground,
              'shape-diamond': withBackground && effectiveRole === 'seasonalPerk',
              'shape-circle': withBackground && effectiveRole !== 'seasonalPerk',
            }
          ]"
          :style="{
            width: computedSize,
            height: computedSize,
          }"
      >
        <v-img
            v-if="iconUrl"
            :src="iconUrl"
            class="pointer-events-none w-100 h-100"
            contain
        ></v-img>
        <v-icon v-else size="20" color="amber">mdi-flare</v-icon>
      </component>
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
        `ma-${computedMargin}`,
        `pa-${computedPadding}`,
        {
          'cursor-pointer': isOpenDetail,
          'with-bg': withBackground,
          'shape-diamond': withBackground && effectiveRole === 'seasonalPerk',
          'shape-circle': withBackground && effectiveRole !== 'seasonalPerk',
        }
      ]"
      :style="{
        width: computedSize,
        height: computedSize,
      }"
  >
    <v-img
        v-if="iconUrl"
        :src="iconUrl"
        class="pointer-events-none w-100 h-100"
        contain
    ></v-img>
    <v-icon v-else size="20" color="amber">mdi-flare</v-icon>
  </component>
</template>

<style scoped lang="less">
.mastery-icon-container {
  overflow: hidden;
  user-select: none;
  transition: transform 0.2s ease, filter 0.2s ease;

  &.with-bg {
    border: 1px solid rgba(255, 255, 255, 0.2);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);

    &:hover {
      transform: scale(1.08);
      filter: brightness(1.15);
      border-color: rgba(255, 215, 0, 0.6);
    }
  }

  &.shape-circle {
    border-radius: 50%;
  }

  &.shape-diamond {
    border-radius: 12%;
    transform: rotate(0deg);
  }
}

.bg-gradient-defensive {
  background: linear-gradient(180deg,rgba(0,0,0,.38),rgba(0,0,0,.16) 24%,transparent 50%),radial-gradient(circle at 50% 50%,transparent 46%,rgba(0,0,0,.2) 70%,rgba(0,0,0,.58) 100%),linear-gradient(180deg,#142c44,#254d6b 56%,#3e7295) !important;
}

.bg-gradient-offensive {
  background: linear-gradient(180deg,rgba(0,0,0,.38),rgba(0,0,0,.16) 24%,transparent 50%),radial-gradient(circle at 50% 50%,transparent 46%,rgba(0,0,0,.2) 70%,rgba(0,0,0,.58) 100%),linear-gradient(180deg,#3f121c,#6d2030 56%,#9b3345) !important;
}

.bg-gradient-impetus {
  background: linear-gradient(180deg,rgba(0,0,0,.38),rgba(0,0,0,.16) 24%,transparent 50%),radial-gradient(circle at 50% 50%,transparent 46%,rgba(0,0,0,.2) 70%,rgba(0,0,0,.58) 100%),linear-gradient(180deg,#4e4017,#856c28 56%,#9a7f2c) !important;
}

.bg-gradient-default {
  background: linear-gradient(180deg,rgba(0,0,0,.38),rgba(0,0,0,.16) 24%,transparent 50%),radial-gradient(circle at 50% 50%,transparent 46%,rgba(0,0,0,.2) 70%,rgba(0,0,0,.58) 100%),linear-gradient(180deg,#0f2f16,#1f5a24 56%,#3a8240) !important;
}
</style>
