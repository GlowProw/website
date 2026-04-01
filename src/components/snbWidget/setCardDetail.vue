<script setup lang="ts">
import {onMounted, type Ref, ref, watch} from "vue";
import {useI18n} from "vue-i18n";
import {useRouter} from "vue-router";
import {Sets, Set} from "glow-prow-data";
import {rarity} from "@/assets/sripts/index";
import {useCDNAssetsServiceStore} from "~/stores/cdnAssetsStore";

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
    <div class="demo-reel-header pa-10 position-relative" :class="[`set-card-header-rarity-${i?.rarity}`]">
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
      <BtnWidget @action-complete="router.push(`/codex/set/${i.id}`)"
                 class="mt-1">
        {{ t('codex.set.lookDetail') }}
      </BtnWidget>
    </div>
  </v-card>
</template>

<style scoped lang="less">
@import "@/assets/styles/demo-reel";

.set-mirror-image {
  transform: scaleX(-1);
}
</style>
