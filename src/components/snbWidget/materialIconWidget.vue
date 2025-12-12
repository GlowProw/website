<script setup lang="ts">
import {onMounted, type Ref, ref, watch} from "vue";
import {useI18n} from "vue-i18n";
import {useAssetsStore} from "~/stores/assetsStore";
import {number, rarity} from "@/assets/sripts/index";
import {Material, Materials} from "glow-prow-data";

import ItemSlotBase from "@/components/snbWidget/ItemSlotBase.vue";
import Loading from "@/components/Loading.vue";
import FactionIconWidget from "@/components/snbWidget/factionIconWidget.vue";
import LightRays from "@/components/LightRays.vue";
import BtnWidget from "@/components/snbWidget/btnWidget.vue";
import MaterialName from "@/components/snbWidget/materialName.vue";
import MaterialNameRarity from "@/components/snbWidget/materialNameRarity.vue";
import router from "~/router";

const props = withDefaults(defineProps<{
      id: string | undefined,
      isShowOpenDetail?: boolean,
      isOpenDetail?: boolean,
      isShowTooltip?: boolean,
      imageType?: string,
      size?: string | number,
      padding?: number,
      margin?: number
    }>(), {
      isShowOpenDetail: true,
      isOpenDetail: true,
      isShowTooltip: true,
      size: 20,
      padding: 1,
      margin: 1
    }),
    {t} = useI18n(),
    {materials: materialsAssets, raritys: raritysAssets} = useAssetsStore(),
    materials = Materials,
    rarityColorConfig = rarity.color

let src = ref(''),
    materialsCardData = ref({
      icon: '',
    }),
    i: Ref<Material | null> = ref(null)

watch(() => props.id, () => {
  onReady()
})

onMounted(() => {
  onReady()
})

const onReady = async () => {
  i.value = materials[props.id] || null

  if (materialsAssets[props.id])
    materialsCardData.value.icon = materialsAssets[props.id]
  else
    materialsCardData.value.icon = `https://skullandbonestools.de/api/imagesservice?src=materials%2F${props.id}&width=128`
}
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
      class="material-card"
      content-class="pa-0"
      target="cursor">
    <template v-slot:activator="{ props: activatorProps }">
      <v-card
          ref="targetElement"
          width="100%"
          v-bind="activatorProps"
          :color="`hsl(from ${rarityColorConfig[i?.rarity]} h s calc(l * .15))`"
          :to="isOpenDetail ? `/codex/material/${i?.id}` : null"
          :class="[
              'prohibit-drag',
              `ma-${props.margin}`,
              `pa-${props.padding}`,
          ]">
        <template v-slot:image v-if="i.rarity">
          <v-img :src="raritysAssets[`item-rarity-${i?.rarity}`]" width="100%" height="100%" class="opacity-30 prohibit-drag"/>
        </template>

        <div class="d-flex justify-center align-center h-100">
          <v-img
              class="prohibit-drag"
              :src="materialsCardData.icon">
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
      <div class="demo-reel-header pa-10 position-relative"
           :style="`background-color: color-mix(in srgb, hsl(from ${rarityColorConfig[ materials[i.id]?.rarity || '' ]} h s l) 10%, #000)`">
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
        <BtnWidget @action-complete="router.push(`/codex/material/${i.id}`)"
                   class="mt-1"
                   v-if="isShowOpenDetail">
          {{ t('codex.material.lookDetail') }}
        </BtnWidget>
      </div>
    </v-card>
  </v-tooltip>
</template>

<style scoped lang="less">
@import "@/assets/styles/demo-reel";

.material-card {
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

  .material-mirror-image {
    transform: scaleX(-1)
  }

  .material-card-name {
    line-height: 1.2 !important;
  }
}
</style>
