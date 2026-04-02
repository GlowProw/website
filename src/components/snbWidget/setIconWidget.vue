<script lang="ts">
export default { name: 'SetIconWidget' }
</script>

<script setup lang="ts">
import {useRoute, useRouter} from "vue-router";
import {useI18n} from "vue-i18n";
import {computed, onMounted, type Ref, ref, watch} from "vue";
import {useI18nUtils} from "@/assets/sripts/i18n_util";
import {useIntersectionObserver} from "@/assets/sripts/intersection_observer";
import {useAssetsStore} from "~/stores/assetsStore";
import {Sets, Set} from "glow-prow-data";
import {rarity} from "@/assets/sripts/index";

import Loading from "../Loading.vue";
import {useAppStore} from "~/stores/appStore";
import {useCDNAssetsServiceStore} from "~/stores/cdnAssetsStore";
import {use_tooltip_follow} from "@/assets/sripts/use_tooltip_follow";
import SetCardDetail from "@/components/snbWidget/setCardDetail.vue";

const
    {tooltipPos, onMouseMove, onMouseEnter} = use_tooltip_follow(),
    {asString, sanitizeString} = useI18nUtils(),
    {raritys} = useAssetsStore(),
    {currentService: currentImageService} = useCDNAssetsServiceStore(),

    {t} = useI18n(),
    route = useRoute(),
    router = useRouter(),
    props = withDefaults(defineProps<{
      id: string,
      isOpenDetail?: boolean,
      isOpenNewWindow?: boolean,
      isShowOpenDetail?: boolean,
      isShowTooltip?: boolean,
      padding?: number,
      margin?: number
    }>(), {
      id: 'culverin1',
      isOpenDetail: true,
      isOpenNewWindow: false,
      isShowOpenDetail: true,
      isShowTooltip: true,
      padding: 0,
      margin: 1,
    }),
    appStore = useAppStore(),
    sets = Sets;

let setCardData = ref({
      icon: '',
    }),
    i: Ref<any> = ref(Set),
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
  i.value = sets[props.id] || null

  setCardData.value.icon = currentImageService.url({
    'skull-and-bones-tools': {
      id: `${props.id}Set`,
      category: 'vanities'
    },
    'glow-prow': {
      id: props.id,
      category: 'sets'
    },
    'local-test': {
      id: props.id,
      category: 'sets'
    },
  });
}

const {targetElement, isVisible} = useIntersectionObserver({
  threshold: .7,
})
</script>

<template>
  <v-tooltip
      v-if="i && i?.id"
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
          ref="targetElement"
          width="100%"
          v-bind="activatorProps"
          @mousemove="onMouseMove"
          @mouseenter="onMouseEnter"
          :to="isOpenDetail ? `/codex/set/${i.id}` : ''"
          :target="isOpenNewWindow ? '_blank' : '_self'"
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
              referrerpolicy="no-referrer"
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
    <SetCardDetail
        :id="props.id"
        :is-show-open-detail="props.isShowOpenDetail"
    />
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
    z-index: 40;
    border-radius: inherit;
  }
}
</style>
