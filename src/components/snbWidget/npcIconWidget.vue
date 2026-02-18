<script lang="ts" setup>
import {useRoute, useRouter} from "vue-router";
import {useI18n} from "vue-i18n";
import {computed, onMounted, type Ref, ref, watch} from "vue";
import {useI18nUtils} from "@/assets/sripts/i18n_util";
import {useIntersectionObserver} from "@/assets/sripts/intersection_observer";
import {rarity} from "@/assets/sripts/index";
import {useAssetsStore} from "~/stores/assetsStore";

import Loading from "../Loading.vue";
import LightRays from "../LightRays.vue"
import NpcName from "@/components/snbWidget/npcName.vue";
import BtnWidget from "@/components/snbWidget/btnWidget.vue";
import {Npc, Npcs} from "glow-prow-data";
import {useAppStore} from "~/stores/appStore";
import {useCDNAssetsServiceStore} from "~/stores/cdnAssetsStore";

const
    {asString, sanitizeString} = useI18nUtils(),
    route = useRoute(),
    router = useRouter(),
    appStore = useAppStore(),
    {t} = useI18n(),
    {raritys: raritysAssets} = useAssetsStore(),
    {currentService: currentImageService} = useCDNAssetsServiceStore(),
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
    npcs: Npcs = Npcs,
    // 同类图标字典
    npcDictionaries = {
      "vendor": ['vendor-rempahWarrior', 'vendor-overseasSmuggler'],
      "trader": ['rempahTrader', 'rogueTrader'],
      "cache": ['warehouse', 'cache'],
      "theHelm": ['managerOfLePontMuet', 'helmLiaison']
    },

    // 稀有度
    rarityColorConfig = rarity.color

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
    id: i.value!.id,
    category: 'npcs'
  }, 'glow-prow')
}

const {targetElement, isVisible} = useIntersectionObserver({
  threshold: .7,
})
</script>

<template>
  <v-tooltip
      v-if="i && i.id"
      :disabled="!props.isShowTooltip"
      :offset="[40, 0]"
      class="npc-card"
      content-class="pa-0"
      interactive
      location="right top"
      max-width="450"
      min-width="450"
      target="cursor">
    <template v-slot:activator="{ props: activatorProps }">
      <v-card
          ref="targetElement"
          :class="[
              'prohibit-drag',
              `ma-${props.margin}`,
              `pa-${props.padding}`,
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
    <v-card border class="demo-reel bg-black" flat>
      <div :style="`background-color: color-mix(in srgb, hsl(from ${rarityColorConfig[ npcs[i.id]?.rarity || '' ]} h s l) 10%, #000)`"
           class="demo-reel-header pa-10 position-relative">
        <div class="v-skeleton-loader__bone v-skeleton-loader__image opacity-30 position-absolute left-0 top-0 w-100 h-100"></div>

        <h1 class="material-card-name font-weight-bold w-66">
          <NpcName :data="i"></NpcName>
        </h1>
        <p class="mb-1 mt-2">{{ i.id }}</p>

        <div class="d-flex ga-2 align-center mt-3">
          <v-chip class="badge-flavor text-center tag-badge text-black"
                  v-if="i.type"
                  :to="`/codex/items?type=${i.type}`">
            {{ t(`codex.npc.types.${i.type}`) || '' }}
          </v-chip>
          <v-chip class="badge-flavor text-center tag-badge text-black"
                  v-if="Array.isArray(i.category)"
                  v-for="(i, index) in i.category"
                  :key="index">
            {{ t(`codex.npc.categorys.${i}`) }}
          </v-chip>
        </div>

        <div class="right-show-image pointer-events-none position-absolute w-33">
          <v-img :src="npcsCardData.icon" class="npc-mirror-image"></v-img>
        </div>

        <template v-if="i.rarity">
          <LightRays
              id="iconBackRight"
              ref="iconBackRight"
              :distortion="0"
              :follow-mouse="false"
              :light-spread="10"
              :mouse-influence="0"
              :noise-amount="0"
              :ray-length="10"
              :rays-color="rarityColorConfig[i.rarity]"
              :rays-speed="2"
              class="w-100 h-100 pointer-events-none position-absolute top-0 right-0"
              quality="low"
              rays-origin="top-right"
          />
        </template>
      </div>
      <div class="demo-reel-content pl-10 pr-10 background-flavor overflow-auto">
        <BtnWidget v-if="isShowOpenDetail"
                   class="mt-1"
                   @action-complete="router.push(`/codex/npc/${i.key}`)">
          {{ t('codex.npc.lookDetail') }}
        </BtnWidget>
      </div>
    </v-card>
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
