<script setup lang="ts">
import {useIconGlobalStyle} from "@/assets/sripts/use_icon_global_style";
import {Quests, Questlog} from "glow-prow-data";
import {computed} from "vue";
import {useAppStore} from "~/stores/appStore";
import {useTooltipFollow} from "@/assets/sripts/use_tooltip_follow";
import QuestCardDetail from "@/components/snbWidget/questCardDetail.vue";

const props = withDefaults(defineProps<{
      id: string,
      isShowOpenDetail?: boolean,
      isOpenDetail?: boolean,
      isOpenNewWindow?: boolean,
      isShowTooltip?: boolean,
      margin?: number,
      padding?: number,
      size?: string
    }>(), {
      isShowOpenDetail: true,
      isOpenDetail: true,
      isOpenNewWindow: false,
      isShowTooltip: true,
      margin: 1,
      padding: 1
    }),
    appStore = useAppStore(),
    {tooltipPos, onMouseMove, onMouseEnter} = useTooltipFollow(),
    questMap = Quests as Record<string, Questlog>;

let quest = computed(() => questMap[props.id] || null),
    isOpenNewWindow = computed({
      get: () => appStore.itemOpenNewWindow || props.isOpenNewWindow,
      set: (value) => appStore.toggleItemOpenNewWindow(value)
    });

defineOptions({
  name: "QuestIconWidget"
});

const {useIconImagePadding, useIconImageMargin} = useIconGlobalStyle();
const computedPadding = useIconImagePadding(props.padding);
const computedMargin = useIconImageMargin(props.margin);
</script>

<template>
  <v-tooltip
      v-if="quest"
      :disabled="!props.isShowTooltip"
      min-width="450"
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
          v-bind="activatorProps"
          :to="isOpenDetail ? `/quest/${id}` : ''"
          :target="isOpenNewWindow ? '_blank' : '_self'"
          width="100%"
          height="100%"
          :class="[
              'prohibit-drag pa-2',
              'd-flex flex-column align-center justify-center',
              `ma-${computedMargin}`,
              `pa-${computedPadding}`,
          ]">
        <v-icon size="42">mdi-script-text-outline</v-icon>
      </v-card>
    </template>
    <QuestCardDetail
        :id="props.id"
        :is-show-open-detail="props.isShowOpenDetail"
    />
  </v-tooltip>
</template>

<style scoped lang="less">
@import "@/assets/styles/demo-reel";
</style>
