<script setup lang="ts">
import { useIconGlobalStyle } from "@/assets/sripts/useIconGlobalStyle";
import {Ultimate, Ultimates} from "glow-prow-data"
import {computed, onMounted, type Ref, ref} from "vue";
import {useAppStore} from "~/stores/appStore";
import {useTooltipFollow} from "@/assets/sripts/use_tooltip_follow";
import {rarity} from "@/assets/sripts/index";
import {useRouter} from "vue-router";
import {useI18n} from "vue-i18n";
import {useCDNAssetsServiceStore} from "~/stores/cdnAssetsStore";
import UltimateCardDetail from "@/components/snbWidget/ultimateCardDetail.vue";

const props = withDefaults(defineProps<{
      id: string,
      isShowOpenDetail?: boolean,
      isOpenDetail?: boolean,
      isOpenNewWindow?: boolean,
      isShowTooltip?: boolean,
      margin?: number,
      padding?: number,
      isEager?: boolean
    }>(), {
      id: 'dhow',
      isShowOpenDetail: true,
      isOpenDetail: true,
      isOpenNewWindow: false,
      isShowTooltip: true,
      margin: 1,
      padding: 1,
      isEager: false
    }),
    {t} = useI18n(),
    router = useRouter(),
    {currentService: currentImageService} = useCDNAssetsServiceStore(),
    appStore = useAppStore(),
    {tooltipPos, onMouseMove, onMouseEnter} = useTooltipFollow(),
    ultimatesMap = Ultimates,

    // 稀有度
    rarityColorConfig = rarity.color

let ultimatesData = ref({
      icon: '',
    }),
    i: Ref<Ultimate | null> = ref(null),
    isOpenNewWindow = computed({
      get: () => appStore.itemOpenNewWindow || props.isOpenNewWindow,
      set: (value) => appStore.toggleItemOpenNewWindow(value)
    })

onMounted(() => {
  onReady()
})

const onReady = async () => {
  i.value = ultimatesMap[props.id] || null

  ultimatesData.value.icon = currentImageService.url({
    id: props.id,
    category: 'ultimates'
  })
}

defineOptions({
  name: "UltimateIconWidget"
})

const { useIconImagePadding, useIconImageMargin } = useIconGlobalStyle();
const computedPadding = useIconImagePadding(props.padding);
const computedMargin = useIconImageMargin(props.margin);
</script>

<template>
  <v-tooltip
      v-if="i && i.id"
      :disabled="!props.isShowTooltip"
      min-width="450"
      max-width="450"
      interactive
      :offset="[30,10]"
      location="right top"
      content-class="pa-0 bg-transparent"
      :target="[tooltipPos.x, tooltipPos.y]">
    <template v-slot:activator="{ props: activatorProps }">
      <v-card
          @mousemove="onMouseMove"
          @mouseenter="onMouseEnter"
          v-bind="activatorProps"
          :to="isOpenDetail ? `/codex/ultimate/${id}` : ''"
          :target="isOpenNewWindow ? '_blank' : '_self'"
          width="100%"
          :class="[
              'prohibit-drag',
              `ma-${computedMargin}`,
              `pa-${computedPadding}`,
          ]">
        <v-img :src="ultimatesData.icon" :eager="props.isEager" class="pointer-events-none"></v-img>
      </v-card>
    </template>
    <UltimateCardDetail
        :id="props.id"
        :is-show-open-detail="props.isShowOpenDetail"
    />
  </v-tooltip>
</template>

<style scoped lang="less">
@import "@/assets/styles/demo-reel";
</style>
