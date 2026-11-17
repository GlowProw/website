<script setup lang="ts">
import {useIconGlobalStyle} from "@/assets/sripts/use_icon_global_style";
import {Quests, Questlog} from "glow-prow-data";
import {rarity} from "@/assets/sripts/index";
import {computed} from "vue";
import {useAppStore} from "~/stores/appStore";
import QuestCardDetail from "@/components/snbWidget/questCardDetail.vue";
import ItemCardTooltip from "@/components/snbWidget/itemCardTooltip.vue";

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
    questMap = Quests as Record<string, Questlog>,

    // 稀有度
    rarityColorConfig = rarity.color;

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
  <ItemCardTooltip
      v-if="quest"
      :disabled="!props.isShowTooltip">
    <template v-slot:activator="{ props: activatorProps }">
      <v-card
          v-bind="activatorProps"
          :to="isOpenDetail ? `/quest/${id}` : ''"
          :target="isOpenNewWindow ? '_blank' : '_self'"
          :style="`background: hsl(from ${rarityColorConfig[(quest as any)?.rarity || '']} h s calc(l * .2)); aspect-ratio: 1 / 1;`"
          width="100%"
          height="100%"
          variant="text"
          class="border"
          :class="[
              'prohibit-drag',
              'd-flex flex-column align-center justify-center',
              `ma-${computedMargin}`,
              `pa-${computedPadding}`,
          ]">
        <div class="d-flex align-center justify-center w-100 h-100 overflow-hidden">
          <v-icon class="w-100 h-100" size="2.5rem">mdi-script-text-outline</v-icon>
        </div>
      </v-card>
    </template>
    <QuestCardDetail
        :id="props.id"
        :is-show-open-detail="props.isShowOpenDetail"
    />
  </ItemCardTooltip>
</template>

<style scoped lang="less">
@import "@/assets/styles/demo-reel";
</style>
