<script setup lang="ts">
import {computed, onMounted, type Ref, ref, watch} from "vue";
import {useI18n} from "vue-i18n";
import {useRouter} from "vue-router";
import {Material, Materials} from "glow-prow-data";
import {rarity} from "@/assets/sripts/index";
import {useCDNAssetsServiceStore} from "~/stores/cdnAssetsStore";

import ItemSlotBase from "@/components/snbWidget/ItemSlotBase.vue";
import Loading from "@/components/Loading.vue";
import FactionIconWidget from "@/components/snbWidget/factionIconWidget.vue";
import LightRays from "@/components/LightRays.vue";
import BtnWidget from "@/components/snbWidget/btnWidget.vue";
import MaterialName from "@/components/snbWidget/materialName.vue";
import MaterialNameRarity from "@/components/snbWidget/materialNameRarity.vue";
import MaterialDescription from "@/components/snbWidget/materialDescription.vue";

const props = withDefaults(defineProps<{
  id: string,
  isShowOpenDetail?: boolean,
  isShowDescription?: boolean,
  isWidget?: boolean,
}>(), {
  id: 'iron_ore',
  isShowOpenDetail: true,
  isShowDescription: true,
  isWidget: false,
})

const {t} = useI18n()
const router = useRouter()
const {currentService: currentImageService} = useCDNAssetsServiceStore()

const rarityColorConfig = rarity.color
const materials = Materials

const materialsCardData = ref({
  icon: '',
}) as Ref<{ icon: null | string }>
const i: Ref<Material | null> = ref(null)
const materialDescription = ref(null)

const onReady = async () => {
  i.value = (materials as any)[props.id] || null

  materialsCardData.value.icon = currentImageService.url({
    id: props.id,
    category: 'materials'
  })
}

watch(() => props.id, () => {
  onReady()
})

onMounted(() => {
  onReady()
})

defineOptions({
  name: 'MaterialCardDetail'
})
</script>

<template>
  <v-card class="demo-reel bg-black" flat border v-if="i && i.id">
    <div class="demo-reel-header pa-10 position-relative"
         :style="`background-color: color-mix(in srgb, hsl(from ${rarityColorConfig[ (materials as any)[i.id]?.rarity || '' ]} h s l) 10%, #000)`">
      <div class="v-skeleton-loader__bone v-skeleton-loader__image opacity-30 position-absolute left-0 top-0 w-100 h-100"></div>

      <h1 class="material-card-name font-weight-bold w-66">
        <ItemSlotBase size="28px" class="mb-2" :padding="0" v-if="i.faction">
          <FactionIconWidget class="d-inline-flex" :name="i.faction.id" v-if="i.faction"></FactionIconWidget>
        </ItemSlotBase>
        <MaterialNameRarity :id="i.id">
          <MaterialName :id="i.id"></MaterialName>
        </MaterialNameRarity>
      </h1>
      <p class="mb-1 mt-2">{{ i.id }}</p>

      <div class="d-flex ga-2 mt-3">
        <v-chip inline
                :to="`/codex/materials?category=${i.category}`"
                class="badge-flavor text-center text-black" v-if="i.category">
          {{ t(`codex.categorys.${i.category}`) }}
        </v-chip>
        <v-chip class="badge-flavor text-center tag-badge text-black"
                :to="`/codex/materials?rarity=${i.rarity}`"
                v-if="i.rarity">{{ t(`codex.raritys.${i.rarity}`) }}
        </v-chip>
      </div>
      <div class="right-show-image pointer-events-none position-absolute w-33">
        <v-img :src="materialsCardData.icon" class="material-mirror-image"></v-img>
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
    <div class="demo-reel-content background-flavor overflow-auto">
      <template v-if="isShowDescription">
        <div :class="materialDescription && (materialDescription as any).isHasDescription ? 'mb-5 px-6 description' : ''">
          <MaterialDescription ref="materialDescription" :id="props.id"></MaterialDescription>
        </div>
      </template>
    </div>
    <v-divider v-if="isShowOpenDetail"></v-divider>
    <div class="demo-reel-content pl-10 pr-10 background-flavor overflow-auto"
         v-if="isShowOpenDetail">
      <BtnWidget @action-complete="router.push(`/codex/material/${i.id}`)"
                 class="mt-1">
        {{ t('codex.material.lookDetail') }}
      </BtnWidget>
    </div>
  </v-card>
</template>

<style scoped lang="less">
@import "@/assets/styles/demo-reel";

.material-mirror-image {
  transform: scaleX(-1)
}

.material-card-name {
  line-height: 1.2 !important;
}
</style>
