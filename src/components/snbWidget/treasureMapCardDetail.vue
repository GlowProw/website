<script setup lang="ts">
import {onMounted, type Ref, ref, watch} from "vue";
import {useI18n} from "vue-i18n";
import {useRouter} from "vue-router";
import {TreasureMap, TreasureMaps} from "glow-prow-data";
import {rarity} from "@/assets/sripts/index";
import {useCDNAssetsServiceStore} from "~/stores/cdnAssetsStore";

import LightRays from "../LightRays.vue"
import BtnWidget from "@/components/snbWidget/btnWidget.vue";
import TreasureMapName from "@/components/snbWidget/treasureMapName.vue";

const props = withDefaults(defineProps<{
  id: string,
  isShowOpenDetail?: boolean,
  isWidget?: boolean,
}>(), {
  id: '',
  isShowOpenDetail: true,
  isWidget: false,
})

const {t} = useI18n()
const router = useRouter()
const {currentService: currentImageService} = useCDNAssetsServiceStore()

const rarityColorConfig = rarity.color
const treasureMapsValue = TreasureMaps

let treasureMapsCardData = ref({
  icon: '',
})
const i: Ref<TreasureMap | null> = ref(null)

const onReady = async () => {
  i.value = (treasureMapsValue as any)[props.id] || null

  const category = `treasureMaps/${i.value?.category}`
  treasureMapsCardData.value.icon = currentImageService.url({
    'glow-prow': {
      id: props.id,
      category: category || 'AUTO_treasureMaps'
    },
    'glow-prow-zh-cn': {
      id: props.id,
      category: category || 'AUTO_treasureMaps'
    },
    'local-test': {
      id: props.id,
      category: category || 'AUTO_treasureMaps'
    }
  })
}

watch(() => props.id, () => {
  onReady()
})

onMounted(() => {
  onReady()
})

defineOptions({
  name: 'TreasureMapCardDetail'
})
</script>

<template>
  <v-card class="demo-reel bg-black" flat border v-if="i && i.id">
    <div class="demo-reel-header pa-10 position-relative"
         :style="`background-color: color-mix(in srgb, hsl(from ${rarityColorConfig[ (treasureMapsValue as any)[i.id]?.rarity || '' ]} h s l) 10%, #000)`">
      <div class="v-skeleton-loader__bone v-skeleton-loader__image opacity-30 position-absolute left-0 top-0 w-100 h-100"></div>

      <h1 class="treasure-card-name card-name font-weight-bold w-66">
        <TreasureMapName :data="i"></TreasureMapName>
      </h1>
      <p class="card-id mb-1 mt-2">{{ i.id }}</p>

      <div class="card-chip d-flex ga-2 mt-3">
        <v-chip inline
                :to="`/codex/treasureMaps?type=${i.type}`"
                class="badge-flavor text-center text-black" v-if="i.type">{{ t(`codex.types.${i.type}`) }}
        </v-chip>
        <v-chip class="badge-flavor text-center tag-badge text-black"
                :to="`/codex/treasureMaps?category=${i.category}`"
                v-if="i.category">{{ t(`codex.treasureMap.categorys.${i.category}`) }}
        </v-chip>
        <v-chip class="badge-flavor text-center tag-badge text-black"
                :to="`/codex/treasureMaps?rarity=${i.rarity}`"
                v-if="i.rarity">{{ t(`codex.raritys.${i.rarity}`) }}
        </v-chip>
      </div>
      <div class="right-show-image pointer-events-none position-absolute w-50">
        <v-img :src="treasureMapsCardData.icon" class="treasure-mirror-image"></v-img>
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
    <div class="demo-reel-content pl-10 pr-10 background-flavor overflow-auto"
         v-if="isShowOpenDetail">
      <BtnWidget @action-complete="router.push(`/codex/treasureMap/${i.id}`)"
                 class="mt-1">
        {{ t('codex.treasureMap.lookDetail') }}
      </BtnWidget>
    </div>
  </v-card>
</template>

<style scoped lang="less">
@import "@/assets/styles/demo-reel";

.right-show-image {
  transform: scale(1.5) translateX(calc(-50% + 70px)) translateY(calc(20%)) !important;
  top: 0 !important;
  right: 0 !important;
  mask-image: linear-gradient(to right, #00000000 0%, black 80%);
}
</style>
