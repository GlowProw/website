<script setup lang="ts">
import {computed, onMounted, type Ref, ref, watch} from "vue";
import {useI18n} from "vue-i18n";
import {useRouter} from "vue-router";
import {rarity} from "@/assets/sripts/index";
import {Npc, Npcs} from "glow-prow-data";
import {useCDNAssetsServiceStore} from "~/stores/cdnAssetsStore";

import LightRays from "@/components/LightRays.vue";
import BtnWidget from "@/components/snbWidget/btnWidget.vue";
import NpcName from "@/components/snbWidget/npcName.vue";

const props = withDefaults(defineProps<{
  id?: string,
  data?: Npc,
  isShowOpenDetail?: boolean,
  isWidget?: boolean,
}>(), {
  id: '',
  data: null,
  isShowOpenDetail: true,
  isWidget: false,
})

const {t} = useI18n()
const router = useRouter()
const {currentService: currentImageService} = useCDNAssetsServiceStore()

const rarityColorConfig = rarity.color
const npcs = Npcs
const npcDictionaries = {
  "vendor": ['vendor-rempahWarrior', 'vendor-overseasSmuggler'],
  "trader": ['rempahTrader', 'rogueTrader'],
  "cache": ['warehouse', 'cache'],
  "theHelm": ['managerOfLePontMuet', 'helmLiaison']
}

const npcsCardData = ref({
  icon: '',
})
const i: Ref<Npc | null> = ref(null)

const onReady = async () => {
  i.value = (npcs as any)[props?.data?.key || props?.id || ''] || null

  if (i.value) {
    npcsCardData.value.icon = currentImageService.url({
      id: i.value.id,
      category: 'npcs'
    }, 'glow-prow')
  }
}

watch(() => props.id, () => {
  onReady()
})

watch(() => props.data, () => {
  onReady()
}, {deep: true})

onMounted(() => {
  onReady()
})

defineOptions({
  name: 'NpcCardDetail'
})
</script>

<template>
  <v-card border class="demo-reel bg-black" flat v-if="i && i.id">
    <div :style="`background-color: color-mix(in srgb, hsl(from ${rarityColorConfig[ (npcs as any)[i.id]?.rarity || '' ]} h s l) 10%, #000)`"
         class="demo-reel-header pa-10 position-relative">
      <div class="v-skeleton-loader__bone v-skeleton-loader__image opacity-30 position-absolute left-0 top-0 w-100 h-100"></div>

      <h1 class="material-card-name font-weight-bold w-66">
        <NpcName :data="i"></NpcName>
      </h1>
      <p class="mb-1 mt-2">{{ i.id }}</p>

      <div class="d-flex ga-2 mt-3" v-if="(npcs as any)[i.id] && (npcs as any)[i.id].category">
        <template v-for="cat in (npcs as any)[i.id].category">
          <v-chip inline
                  class="badge-flavor text-center text-black"
                  v-if="(npcDictionaries as any)['job'] && !(npcDictionaries as any)['job'].includes(cat)">
            {{ t(`codex.types.${cat}`) }}
          </v-chip>
        </template>
      </div>

      <div class="right-show-image pointer-events-none position-absolute w-33">
        <v-img :src="npcsCardData.icon" class="npc-mirror-image"></v-img>
      </div>

      <template v-if="(i as any).rarity">
        <LightRays
            :distortion="0"
            :follow-mouse="false"
            :light-spread="10"
            :mouse-influence="0"
            :noise-amount="0"
            :ray-length="10"
            :rays-color="rarityColorConfig[(i as any).rarity]"
            :rays-speed="2"
            class="w-100 h-100 pointer-events-none position-absolute top-0 right-0"
            quality="low"
            rays-origin="top-right"
        />
      </template>
    </div>
    <div class="demo-reel-content pl-10 pr-10 background-flavor overflow-auto">
      <BtnWidget v-if="isShowOpenDetail"
                 class="mt-1"
                 @action-complete="router.push(`/codex/npc/${i.key}`)">
        {{ t('codex.npc.lookDetail') }}
      </BtnWidget>
    </div>
  </v-card>
</template>

<style lang="less" scoped>
@import "@/assets/styles/demo-reel";

.npc-mirror-image {
  position: absolute;
  right: 0;
  transform: scaleX(-1);
  width: 80px;
}
</style>
