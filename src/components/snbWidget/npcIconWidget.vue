<script lang="ts" setup>
import {useRoute, useRouter} from "vue-router";
import {useI18n} from "vue-i18n";
import {computed, onMounted, type Ref, ref, watch} from "vue";
import {useI18nUtils} from "@/assets/sripts/i18n_util";
import {useIntersectionObserver} from "@/assets/sripts/intersection_observer";
import {rarity} from "@/assets/sripts/index";
import {useAssetsStore} from "~/stores/assetsStore";

import {useCDNAssetsServiceStore} from "~/stores/cdnAssetsStore";
import NpcCardDetail from "@/components/snbWidget/npcCardDetail.vue";
import ItemCardTooltip from "@/components/snbWidget/itemCardTooltip.vue";
import {useAppStore} from "~/stores/appStore";
import {Npc, Npcs} from "glow-prow-data";
import {useIconGlobalStyle} from "@/assets/sripts/use_icon_global_style";
import Loading from "@/components/Loading.vue";

const
    {asString, sanitizeString} = useI18nUtils(),
    route = useRoute(),
    router = useRouter(),
    appStore = useAppStore(),
    {t} = useI18n(),
    {raritys: raritysAssets} = useAssetsStore(),
    cdnStore = useCDNAssetsServiceStore(),
    {currentService: currentImageService} = cdnStore,
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
      margin: 0
    }),
    npcs: any = Npcs,

    // 稀有度
    rarityColorConfig = rarity.color;

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

  if (!i.value) return

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
  })
}

// 切换图片服务后重新解析图标地址
watch(() => cdnStore.selectedService, () => {
  onReady()
})

const {targetElement, isVisible} = useIntersectionObserver({
  threshold: .7,
})

const {useIconImagePadding, useIconImageMargin} = useIconGlobalStyle();
const computedPadding = useIconImagePadding(props.padding);
const computedMargin = useIconImageMargin(props.margin);

defineOptions({
  name: 'NpcIconWidget'
})
</script>

<template>
  <ItemCardTooltip
      v-if="i && i.id"
      :disabled="!props.isShowTooltip">
    <template v-slot:activator="{ props: activatorProps }">
      <v-card
          ref="targetElement"
          :class="[
              'prohibit-drag',
              `ma-${computedMargin}`,
              `pa-${computedPadding}`,
          ]"
          :to="isOpenDetail ? `/codex/npc/${i.key}` : ''"
          :target="isOpenNewWindow ? '_blank' : '_self'"
          :style="`background: hsl(from ${rarityColorConfig[(i as any)?.rarity || '']} h s calc(l * .2)); aspect-ratio: 1 / 1;`"
          v-bind="activatorProps"
          width="100%"
          height="100%"
          variant="text"
          class="border">
        <div class="d-flex align-center justify-center w-100 h-100">
          <v-img
              :src="npcsCardData.icon"
              aspect-ratio="1"
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
              <div class="d-flex justify-center align-center h-100 opacity-60">
                <Loading size="30px" min-size="10px" max-size="50px"/>
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
  </ItemCardTooltip>
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
