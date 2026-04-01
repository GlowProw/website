<script setup lang="ts">
import {Ultimate, Ultimates} from "glow-prow-data"
import {computed, onMounted, type Ref, ref} from "vue";
import {useAppStore} from "~/stores/appStore";
import {useTooltipFollow} from "@/assets/sripts/useTooltipFollow";
import BtnWidget from "@/components/snbWidget/btnWidget.vue";
import LightRays from "@/components/LightRays.vue";
import {rarity} from "@/assets/sripts/index";
import {useRouter} from "vue-router";
import {useI18n} from "vue-i18n";
import UltimateName from "@/components/snbWidget/ultimateName.vue";
import {useCDNAssetsServiceStore} from "~/stores/cdnAssetsStore";

const props = withDefaults(defineProps<{
      id: string,
      isShowOpenDetail?: boolean,
      isOpenDetail?: boolean,
      isOpenNewWindow?: boolean,
      isShowTooltip?: boolean,
      margin?: number,
      padding?: number
    }>(), {
      id: 'dhow',
      isShowOpenDetail: true,
      isOpenDetail: true,
      isOpenNewWindow: false,
      isShowTooltip: true,
      margin: 1,
      padding: 1
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
              `ma-${props.margin}`,
              `pa-${props.padding}`,
          ]">
        <v-img :src="ultimatesData.icon" class="pointer-events-none"></v-img>
      </v-card>
    </template>
    <v-card class="demo-reel bg-black" flat border>
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
        <div class="right-show-image pointer-events-none position-absolute w-50">
          <v-img :src="ultimatesData.icon" class="treasure-mirror-image"></v-img>
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
      <div class="demo-reel-content pl-10 pr-10 background-flavor overflow-auto"
           v-if="isShowOpenDetail">
        <BtnWidget @action-complete="router.push(`/codex/treasureMap/${i.id}`)"
                   class="mt-1">
          {{ t('codex.ultimate.lookDetail') }}
        </BtnWidget>
      </div>
    </v-card>
  </v-tooltip>
</template>

<style scoped lang="less">
@import "@/assets/styles/demo-reel";
</style>
