<script setup lang="ts">
import {onMounted, type Ref, ref, watch} from "vue";
import {useI18n} from "vue-i18n";
import {useRouter} from "vue-router";
import {Cosmetic, Cosmetics} from "glow-prow-data";
import {rarity} from "@/assets/sripts/index";
import {useCDNAssetsServiceStore} from "~/stores/cdnAssetsStore";

import LightRays from "../LightRays.vue"
import CosmeticName from "@/components/snbWidget/cosmeticName.vue";
import BtnWidget from "@/components/snbWidget/btnWidget.vue";
import FactionIconWidget from "@/components/snbWidget/factionIconWidget.vue";
import CosmeticPiecesTagWidget from "@/components/snbWidget/cosmeticPiecesTagWidget.vue";
import CosmeticEffectTagWidget from "@/components/snbWidget/cosmeticEffectTagWidget.vue";
import CosmeticDescription from "@/components/snbWidget/cosmeticDescription.vue";

const props = withDefaults(defineProps<{
  id: string,
  isShowOpenDetail?: boolean,
  isShowDescription?: boolean,
  isWidget?: boolean,
}>(), {
  id: 'culverin1',
  isShowOpenDetail: true,
  isShowDescription: true,
  isWidget: false,
})

const {t} = useI18n()
const router = useRouter()
const {currentService: currentImageService} = useCDNAssetsServiceStore()

const rarityColorConfig = rarity.color
const cosmeticsValue = Cosmetics

let cosmeticCardData = ref({
  icon: '',
})
const i: Ref<any> = ref(Cosmetic.fromRawData({}))
const cosmeticDescription: Ref<any> = ref(null)

const onReady = async () => {
  i.value = cosmeticsValue[props.id] || null

  cosmeticCardData.value.icon = currentImageService.url({
    id: props.id,
    category: 'vanities'
  });
}

watch(() => props.id, () => {
  onReady()
})

onMounted(() => {
  onReady()
})

defineOptions({
  name: 'CosmeticCardDetail'
})
</script>

<template>
  <v-card class="demo-reel bg-black" flat border v-if="i && i.id">
    <div class="demo-reel-header pa-10 position-relative" :class="[
                  `cosmetic-card-header-rarity-${i?.rarity}`
              ]">
      <div class="v-skeleton-loader__bone v-skeleton-loader__image opacity-30 position-absolute left-0 top-0 w-100 h-100"></div>

      <h1 class="font-weight-bold">
        <v-card variant="text" width="30" height="30" class="mb-2" v-if="i.faction">
          <FactionIconWidget class="bg-red d-inline-flex" size="30px" :name="i.faction.id" v-if="i.faction"></FactionIconWidget>
        </v-card>
        <CosmeticName :id="i.id"></CosmeticName>
      </h1>
      <p class="mb-1">{{ i.id }}</p>

      <div class="d-flex ga-2 align-center mt-3">
        <v-chip class="badge-flavor text-center tag-badge text-black"
                v-if="i.type">
          {{ t(`codex.types.${i.type}`) }}
        </v-chip>
        <CosmeticPiecesTagWidget :pieces="i.pieces"></CosmeticPiecesTagWidget>
        <CosmeticEffectTagWidget :effect="i.effect"></CosmeticEffectTagWidget>
      </div>

      <div class="right-show-image pointer-events-none position-absolute w-33" v-if="isWidget">
        <v-img :src="cosmeticCardData.icon" class="cosmetic-mirror-image"></v-img>
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
        <div :class="cosmeticDescription && cosmeticDescription.isHasDescription ? 'mb-5 px-6 description' : ''">
          <CosmeticDescription ref="cosmeticDescription" :id="props.id"></CosmeticDescription>
        </div>
      </template>
    </div>
    <v-divider v-if="isShowOpenDetail"></v-divider>
    <div class="demo-reel-content pl-10 pr-10 background-flavor overflow-auto"
         v-if="isShowOpenDetail">
      <BtnWidget @action-complete="router.push(`/codex/cosmetic/${i.id}`)"
                 class="mt-1">
        {{ t('codex.cosmetic.lookDetail') }}
      </BtnWidget>
    </div>
  </v-card>
</template>

<style scoped lang="less">
@import "@/assets/styles/demo-reel";

.cosmetic-mirror-image {
  transform: scaleX(-1);
}
</style>
