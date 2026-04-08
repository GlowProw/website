<script lang="ts">
export default {name: 'CosmeticIconWidget'}
</script>

<script setup lang="ts">
import {useRouter} from "vue-router";
import {useI18n} from "vue-i18n";
import Loading from "../Loading.vue";
import {computed, onMounted, type Ref, ref, UnwrapRef, watch} from "vue";
import {useIntersectionObserver} from "@/assets/sripts/intersection_observer";
import {useAssetsStore} from "~/stores/assetsStore";
import {Cosmetic, Cosmetics} from "glow-prow-data";
import {useAppStore} from "~/stores/appStore";
import {useCDNAssetsServiceStore} from "~/stores/cdnAssetsStore";
import {useTooltipFollow} from "@/assets/sripts/use_tooltip_follow";
import CosmeticCardDetail from "@/components/snbWidget/cosmeticCardDetail.vue";

const {raritys} = useAssetsStore(),
    {currentService: currentImageService} = useCDNAssetsServiceStore(),

    {t} = useI18n(),
    router = useRouter(),
    {tooltipPos, onMouseMove, onMouseEnter} = useTooltipFollow(),
    props = withDefaults(defineProps<{
      id: string,
      isShowOpenDetail?: boolean,
      isOpenDetail?: boolean,
      isOpenNewWindow?: boolean,
      isShowDescription?: boolean,
      isShowTooltip?: boolean,
      padding?: number,
      margin?: number
    }>(), {
      id: 'culverin1',
      isShowOpenDetail: true,
      isOpenDetail: true,
      isOpenNewWindow: false,
      isShowDescription: true,
      isShowTooltip: true,
      padding: 0,
      margin: 1,
    }),
    appStore = useAppStore(),
    cosmetics = Cosmetics;



let cosmeticCardData = ref({
      icon: '',
    }),
    i: Ref<UnwrapRef<Cosmetic> | Cosmetic> = ref(Cosmetic.fromRawData({})),
    isOpenNewWindow = computed({
      get: () => appStore.itemOpenNewWindow || props.isOpenNewWindow,
      set: (value) => appStore.toggleItemOpenNewWindow(value)
    })

watch(() => props.id, () => {
  onReady()
})

onMounted(() => {
  onReady()
})

const onReady = async () => {
  i.value = cosmetics[props.id] || null

  cosmeticCardData.value.icon = currentImageService.url({
    id: props.id,
    category: 'vanities'
  });
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
      location="right top"
      min-width="450"
      max-width="450"
      interactive
      content-class="pa-0 bg-transparent"
      :target="[tooltipPos.x, tooltipPos.y]">
    <template v-slot:activator="{ props: activatorProps }">
      <v-card
          @mousemove="onMouseMove"
          @mouseenter="onMouseEnter"
          ref="targetElement"
          width="100%"
          v-bind="activatorProps"
          :to="isOpenDetail ? `/codex/cosmetic/${i.id}` : ''"
          :target="isOpenNewWindow ? '_blank' : '_self'"
          :class="[
              'prohibit-drag',
              `ma-${props.margin}`,
              `pa-${props.padding}`,
              `cosmetic-card-header-rarity-${i.rarity}`
          ]">
        <template v-slot:image v-if="i.rarity">
          <v-img :src="raritys[`cosmetic-rarity-${i.rarity}`]" width="100%" height="100%" class="opacity-30 prohibit-drag"/>
        </template>

        <div class="d-flex align-center justify-center h-100">
          <v-img
              referrerpolicy="no-referrer"
              class="prohibit-drag"
              :src="cosmeticCardData.icon">
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
    <CosmeticCardDetail
        :id="props.id"
        :is-show-description="props.isShowDescription"
        :is-show-open-detail="props.isShowOpenDetail"
    />
  </v-tooltip>
</template>

<style scoped lang="less">
@import "@/assets/styles/demo-reel";

.cosmetic-mirror-image {
  transform: scaleX(-1);
}

.cosmetic-card {
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
}
</style>
