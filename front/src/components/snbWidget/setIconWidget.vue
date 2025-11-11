<script setup lang="ts">
import {useRoute, useRouter} from "vue-router";
import {useI18n} from "vue-i18n";
import Loading from "../Loading.vue";
import LightRays from "../LightRays.vue"
import {onMounted, type Ref, ref, watch} from "vue";
import {useI18nUtils} from "@/assets/sripts/i18n_util";
import {useIntersectionObserver} from "@/assets/sripts/intersection_observer";
import {useAssetsStore} from "~/stores/assetsStore";
import CosmeticName from "@/components/snbWidget/cosmeticName.vue";
import BtnWidget from "@/components/snbWidget/btnWidget.vue";
import {Sets} from "glow-prow-data";
import FactionIconWidget from "@/components/snbWidget/factionIconWidget.vue";
import {rarity} from "@/assets/sripts/index";
import SetName from "@/components/snbWidget/setName.vue";

const
    {asString, sanitizeString} = useI18nUtils(),
    {items, raritys, cosmetic: assetsCosmetics} = useAssetsStore(),
    {t} = useI18n(),
    route = useRoute(),
    router = useRouter(),
    props = withDefaults(defineProps<{
      id: string,
      isShowOpenDetail?: boolean,
      isOpenDetail?: boolean,
      isShowTooltip?: boolean,
      padding?: number,
      margin?: number
    }>(), {
      id: 'culverin1',
      isShowOpenDetail: true,
      isOpenDetail: true,
      isShowTooltip: true,
      padding: 0,
      margin: 1,
    }),
    sets = Sets

let setCardData = ref({
      icon: '',
    }),
    i: Ref<Set> = ref(null),

    // 稀有度
    rarityColorConfig = rarity.color


watch(() => props.id, () => {
  onReady()
})

onMounted(() => {
  onReady()
})

const onReady = async () => {
  i.value = sets[props.id] || null
  setCardData.value.icon = `https://skullandbonestools.de/api/imagesservice?src=vanities%2F${props.id}Set&width=256`

  // if (assetsCosmetics && assetsCosmetics[props.id])
  //   setCardData.value.icon = assetsCosmetics[props.id] || ''
  // else {
  //   setCardData.value.icon = `https://skullandbonestools.de/api/imagesservice?src=vanities%2F${props.id}&width=256`
  // }
}

const {targetElement, isVisible} = useIntersectionObserver({
  threshold: .7,
});
</script>

<template>
  <v-tooltip
      v-if="i && i.id"
      :disabled="!props.isShowTooltip"
      :offset="[40, 0]"
      location="right top"
      min-width="450"
      max-width="450"
      interactive
      content-class="pa-0"
      target="cursor">
    <template v-slot:activator="{ props: activatorProps }">
      <v-card
          ref="targetElement"
          width="100%"
          v-bind="activatorProps"
          :to="isOpenDetail ? `/codex/set/${i.id}` : null"
          :class="[
              'prohibit-drag',
              `ma-${props.margin}`,
              `pa-${props.padding}`,
              `set-card-header-rarity-${i.rarity}`
          ]">
        <template v-slot:image v-if="i.rarity">
          <v-img :src="raritys[`set-rarity-${i.rarity}`]" width="100%" height="100%" class="opacity-30 prohibit-drag"/>
        </template>

        <div class="d-flex align-center justify-center h-100">
          <v-img
              class="prohibit-drag"
              :src="setCardData.icon">
            <template v-slot:error>
              <div class="fill-height repeating-gradient d-flex justify-center align-center h-100">
                <v-icon icon="mdi-help" class="opacity-30"></v-icon>
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
    <v-card class="demo-reel bg-black" flat border>
      <div class="demo-reel-header pa-10 position-relative" :class="[
                    `set-card-header-rarity-${i?.rarity}`
                ]">
        <div class="v-skeleton-loader__bone v-skeleton-loader__image opacity-30 position-absolute left-0 top-0 w-100 h-100"></div>

        <h1 class="font-weight-bold">
          <FactionIconWidget class="bg-red d-inline-flex" :name="i.faction.id" size="28px" v-if="i.faction"></FactionIconWidget>
          <SetName :id="i.id"></SetName>
        </h1>
        <p class="mb-1">{{ i.id }}</p>

        <div class="right-show-image pointer-events-none position-absolute w-33">
          <v-img :src="setCardData.icon" class="set-mirror-image"></v-img>
        </div>

        <template v-if="i.rarity">
          <LightRays
              id="iconBackRight"
              ref="iconBackRight"
              rays-origin="top-right"
              quality="low"
              :rays-color="rarityColorConfig[i.rarity]"
              :rays-speed="2"
              :light-spread="10"
              :ray-length="10"
              :follow-mouse="false"
              :mouse-influence="0"
              :noise-amount="0"
              :distortion="0"
              class="w-100 h-100 pointer-events-none position-absolute top-0 right-0"
          />
        </template>
      </div>
      <div class="demo-reel-content pl-10 pr-10 background-flavor overflow-auto">
        <BtnWidget @action-complete="router.push(`/codex/set/${i.id}`)"
                   class="mt-1"
                   v-if="isShowOpenDetail">
          {{ t('codex.set.lookDetail') }}
        </BtnWidget>
      </div>
    </v-card>
  </v-tooltip>
</template>

<style scoped lang="less">
@import "@/assets/styles/demo-reel";

.set-mirror-image {
  transform: scaleX(-1);
}

.set-card {
  &::after {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 200;
    border-radius: inherit;
  }
}
</style>
