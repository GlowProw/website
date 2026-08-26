<script lang="ts">
export default {name: 'NpcIconWidget'}
</script>

<script lang="ts" setup>
import {useRoute, useRouter} from "vue-router";
import {useI18n} from "vue-i18n";
import {computed, onMounted, type Ref, ref, watch} from "vue";
import {useI18nUtils} from "@/assets/sripts/i18n_util";
import {useIntersectionObserver} from "@/assets/sripts/intersection_observer";
import {rarity} from "@/assets/sripts/index";
import {useAssetsStore} from "~/stores/assetsStore";

import {useCDNAssetsServiceStore} from "~/stores/cdnAssetsStore";
import {useTooltipFollow} from "@/assets/sripts/use_tooltip_follow";
import NpcCardDetail from "@/components/snbWidget/npcCardDetail.vue";
import {useAppStore} from "~/stores/appStore";
import {Npc, Npcs} from "glow-prow-data";
import {use_icon_global_Style} from "@/assets/sripts/use_icon_global_Style";
import Loading from "@/components/Loading.vue";

const
    {asString, sanitizeString} = useI18nUtils(),
    route = useRoute(),
    router = useRouter(),
    appStore = useAppStore(),
    {t} = useI18n(),
    {raritys: raritysAssets} = useAssetsStore(),
    {currentService: currentImageService} = useCDNAssetsServiceStore(),
    {tooltipPos, onMouseMove, onMouseEnter} = useTooltipFollow(),
    props = withDefaults(defineProps<{
      data?: Npc,
      id?: string,
      isShowOpenDetail?: boolean,
      isOpenDetail?: boolean,
      isOpenNewWindow?: boolean,
      isShowTooltip?: boolean,
      padding?: number,
      margin?: number
    }>(), {
      data: null,
      isShowOpenDetail: true,
      isOpenDetail: true,
      isOpenNewWindow: false,
      isShowTooltip: true,
      padding: 0,
      margin: 1
    }),
    npcs: any = Npcs;

let npcsCardData = ref({
      icon: '',
    }),
    i: Ref<Npc | null> = ref(null),

    isOpenNewWindow = computed({
      get: () => appStore.itemOpenNewWindow || props.isOpenNewWindow,
      set: (value) => appStore.toggleItemOpenNewWindow(value)
    })

watch(() => props.id, () => {
  onReady()
})

watch(() => props.data, () => {
  onReady()
}, {deep: true})

onMounted(() => {
  onReady()
})

const onReady = async () => {
  i.value = npcs[props?.data?.key || props?.id] || null

  npcsCardData.value.icon = currentImageService.url({
    'glow-prow':{
      id: i.value.id,
      category: 'npcs',
    },
    'glow-prow-zh-cn': {
      id: i.value.id,
      category: 'npcs',
    },
    'local-test': {
      id: i.value.id,
      category: 'npcs',
    },
  }, 'glow-prow')
}

const {targetElement, isVisible} = useIntersectionObserver({
  threshold: .7,
})

const {useIconImagePadding, useIconImageMargin} = use_icon_global_Style();
const computedPadding = useIconImagePadding(props.padding);
const computedMargin = useIconImageMargin(props.margin);
</script>

<template>
  <v-tooltip
      v-if="i && i.id"
      :disabled="!props.isShowTooltip"
      :offset="[40, 0]"
      scroll-strategy="close"
      transition="opacity 300ms ease-in"
      class="npc-card"
      content-class="pa-0 bg-transparent"
      interactive
      location="right top"
      max-width="450"
      min-width="450"
      :target="[tooltipPos.x, tooltipPos.y]">
    <template v-slot:activator="{ props: activatorProps }">
      <v-card
          @mousemove="onMouseMove"
          @mouseenter="onMouseEnter"
          ref="targetElement"
          :class="[
              'prohibit-drag',
              `ma-${computedMargin}`,
              `pa-${computedPadding}`,
          ]"
          :to="isOpenDetail ? `/codex/npc/${i.key}` : ''"
          :target="isOpenNewWindow ? '_blank' : '_self'"
          v-bind="activatorProps"
          width="100%">
        <div class="d-flex align-center justify-center h-100">
          <v-img
              :src="npcsCardData.icon"
              width="50%"
              height="50%"
              referrerpolicy="no-referrer"
              class="prohibit-drag">
            <template v-slot:error>
              <div class="fill-height repeating-gradient d-flex justify-center align-center h-100">
                <v-icon class="opacity-30" icon="mdi-help"></v-icon>
              </div>
            </template>
            <template v-slot:placeholder>
              <div class="d-flex justify-center align-center h-100">
                <Loading size="40"/>
              </div>
            </template>
          </v-img>
        </div>
      </v-card>
    </template>
    <NpcCardDetail
        :id="props.id"
        :data="props.data"
        :is-show-open-detail="props.isShowOpenDetail"
    />
  </v-tooltip>
</template>

<style lang="less" scoped>
@import "@/assets/styles/demo-reel";

.npc-card {
  &::after {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 40;
    border-radius: inherit;
  }

  .npc-mirror-image {
    position: absolute;
    right: 0;
    transform: scaleX(-1);
    width: 80px;
  }

  .npc-location-card-name {
    line-height: 1.2 !important;
  }
}
</style>
