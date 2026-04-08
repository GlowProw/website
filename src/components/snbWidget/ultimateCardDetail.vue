<script setup lang="ts">
import {onMounted, type Ref, ref, watch} from "vue";
import {useI18n} from "vue-i18n";
import {useRouter} from "vue-router";
import {Ultimate, Ultimates} from "glow-prow-data";
import {rarity} from "@/assets/sripts/index";
import {useCDNAssetsServiceStore} from "~/stores/cdnAssetsStore";

import LightRays from "../LightRays.vue"
import BtnWidget from "@/components/snbWidget/btnWidget.vue";
import UltimateName from "@/components/snbWidget/ultimateName.vue";
import ShipUpgradedDescription from "@/components/snbWidget/shipUpgradedDescription.vue";
import ItemDescription from "@/components/snbWidget/itemDescription.vue";
import UltimateDescription from "@/components/snbWidget/ultimateDescription.vue";

const props = withDefaults(defineProps<{
  id: string,
  isShowOpenDetail?: boolean,
  isShowDescription?: boolean,
  isWidget?: boolean,
}>(), {
  id: 'dhow',
  isShowOpenDetail: true,
  isShowDescription: true,
  isWidget: false,
})

const {t} = useI18n()
const router = useRouter()
const {currentService: currentImageService} = useCDNAssetsServiceStore()

const rarityColorConfig = rarity.color
const ultimatesMap = Ultimates

let ultimatesData = ref({
  icon: '',
})
const i: Ref<Ultimate | null> = ref(null)

const onReady = async () => {
  i.value = ultimatesMap[props.id] || null

  ultimatesData.value.icon = currentImageService.url({
    id: props.id,
    category: 'ultimates'
  })
}

watch(() => props.id, () => {
  onReady()
})

onMounted(() => {
  onReady()
})

defineOptions({
  name: 'UltimateCardDetail'
})
</script>

<template>
  <v-card class="demo-reel bg-black" flat border v-if="i && i.id">
    <div class="demo-reel-header pa-10 position-relative"
         :style="`background-color: color-mix(in srgb, hsl(from ${rarityColorConfig[ i?.rarity || '' ]} h s l) 10%, #000)`">
      <div class="v-skeleton-loader__bone v-skeleton-loader__image opacity-30 position-absolute left-0 top-0 w-100 h-100"></div>

      <h1 class="treasure-card-name card-name font-weight-bold w-66">
        <UltimateName :id="i.id"></UltimateName>
      </h1>
      <p class="card-id mb-1 mt-2">{{ i.id }}</p>

      <div class="card-chip d-flex ga-2 mt-3">
        <v-chip inline
                :to="`/codex/ultimates?type=${i.type}`"
                class="badge-flavor text-center text-black" v-if="i.type">{{ t(`codex.types.${i.type}`) }}
        </v-chip>
        <v-chip inline
                :to="`/codex/ultimates?type=${i.rarity}`"
                class="badge-flavor text-center text-black" v-if="i.rarity">{{ t(`codex.raritys.${i.rarity}`) }}
        </v-chip>
      </div>
      <div class="right-show-image pointer-events-none position-absolute w-50" v-if="isWidget">
        <v-img :src="ultimatesData.icon" class="treasure-mirror-image"></v-img>
      </div>

      <template v-if="i.rarity">
        <LightRays
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
    <div :class="{'demo-reel-content': !isWidget}" class="background-flavor overflow-auto">
      <template v-if="isShowDescription">
        <div class="mb-5 px-6 description">
          <UltimateDescription :id="i.id"></UltimateDescription>
        </div>
      </template>
    </div>
    <v-divider v-if="isShowOpenDetail"></v-divider>
    <div :class="{'demo-reel-content': !isWidget}" class="pl-10 pr-10 background-flavor overflow-auto"
         v-if="isShowOpenDetail">
      <BtnWidget @action-complete="router.push(`/codex/ultimate/${i.id}`)"
                 class="mt-1">
        {{ t('codex.ultimate.lookDetail') }}
      </BtnWidget>
    </div>
  </v-card>
</template>

<style scoped lang="less">
@import "@/assets/styles/demo-reel";
</style>
