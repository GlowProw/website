<script setup lang="ts">
import {inject, onMounted, type Ref, ref, watch} from "vue";
import {useI18n} from "vue-i18n";
import {useRouter} from "vue-router";
import {Sets, Set} from "glow-prow-data";
import {rarity} from "@/assets/sripts/index";
import {useCDNAssetsServiceStore} from "~/stores/cdnAssetsStore";

import Banner from "@/components/Banner.vue";
import LightRays from "../LightRays.vue"
import BtnWidget from "@/components/snbWidget/btnWidget.vue";
import FactionIconWidget from "@/components/snbWidget/factionIconWidget.vue";
import SetName from "@/components/snbWidget/setName.vue";

const props = withDefaults(defineProps<{
  id: string,
  isShowOpenDetail?: boolean,
  isWidget?: boolean,
}>(), {
  id: 'culverin1',
  isShowOpenDetail: true,
  isWidget: false,
})

const {t} = useI18n()
const router = useRouter()
const {currentService: currentImageService} = useCDNAssetsServiceStore()

// 注入外层提示框固定上下文
const cardTooltipContext = inject<{
  isPinned: Ref<boolean>;
  togglePin: () => void;
  setPinned: (val: boolean) => void;
} | null>('itemCardTooltipContext', null);

const rarityColorConfig = rarity.color
const setsValue = Sets

let setCardData = ref({
  icon: '',
})
const i: Ref<any> = ref(Set)

const onReady = async () => {
  i.value = setsValue[props.id] || null

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

watch(() => props.id, () => {
  onReady()
})

onMounted(() => {
  onReady()
})

defineOptions({
  name: 'SetCardDetail'
})
</script>

<template>
  <v-card class="demo-reel bg-black" flat border v-if="i && i?.id">
    <Banner class="demo-reel-header pa-10" :class="[`set-card-header-rarity-${i?.rarity}`]">
      <div class="v-skeleton-loader__bone v-skeleton-loader__image opacity-30 position-absolute left-0 top-0 w-100 h-100"></div>

      <h1 class="font-weight-bold">
        <FactionIconWidget class="bg-red d-inline-flex" :name="i.faction.id" size="28px" v-if="i.faction"></FactionIconWidget>
        <SetName :id="i.id"></SetName>
      </h1>
      <p class="mb-1">{{ i.id }}</p>

      <div class="right-show-image pointer-events-none position-absolute w-33" v-if="isWidget">
        <v-img :src="setCardData.icon" class="set-mirror-image"></v-img>
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
    </Banner>
    <v-divider v-if="isShowOpenDetail" opacity=".06"></v-divider>
    <v-card-actions class="demo-reel-content px-10 py-5 overflow-auto d-flex align-center ga-2" v-if="isShowOpenDetail">
      <BtnWidget hotkey-action="openItemDetail" @action-complete="router.push(`/codex/set/${i.id}`)">
        {{ t('codex.set.lookDetail') }}
      </BtnWidget>
      <BtnWidget
          v-if="cardTooltipContext"
          hotkey-action="pinCardTooltip"
          :color="cardTooltipContext.isPinned.value ? 'var(--main-color)' : undefined"
          :icon="cardTooltipContext.isPinned.value ? 'mdi-pin-off-outline' : 'mdi-pin-outline'"
          @action-complete="cardTooltipContext.togglePin">
        {{ cardTooltipContext.isPinned.value ? t('codex.item.unpinCard') : t('codex.item.pinCard') }}
      </BtnWidget>
    </v-card-actions>
  </v-card>
</template>

<style scoped lang="less">
@import "@/assets/styles/demo-reel";

.set-mirror-image {
  transform: scaleX(-1);
}
</style>
