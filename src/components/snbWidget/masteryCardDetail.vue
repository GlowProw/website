<script setup lang="ts">
import {computed} from "vue";
import {useI18nUtils} from "@/assets/sripts/i18n_util";
import {useRouter} from "vue-router";
import {Masterys} from "glow-prow-data";
import {useI18nReadName} from "@/assets/sripts/i18n_read_name";

import LightRays from "../LightRays.vue";
import BtnWidget from "@/components/snbWidget/btnWidget.vue";
import MasteryName from "@/components/snbWidget/masteryName.vue";
import MasteryDescription from "@/components/snbWidget/masteryDescription.vue";

const props = withDefaults(defineProps<{
  id: string,
  isShowOpenDetail?: boolean,
  isShowDescription?: boolean,
  isWidget?: boolean,
}>(), {
  isShowOpenDetail: true,
  isShowDescription: true,
  isWidget: false,
})

const {t} = useI18nUtils()
const router = useRouter()
const {mastery} = useI18nReadName()

// 查找节点数据
const nodeData = computed(() => {
  const rawId = props.id;
  for (const tree of Object.values(Masterys)) {
    if (tree && (tree as any).nodes) {
      if ((tree as any).nodes[rawId]) {
        return (tree as any).nodes[rawId];
      }
      for (const node of Object.values((tree as any).nodes)) {
        if ((node as any).key === rawId || (node as any).id === rawId) {
          return node;
        }
      }
    }
  }
  return null;
});

const category = computed(() => nodeData.value?.category || 'default');
const role = computed(() => nodeData.value?.role || '');
const season = computed(() => nodeData.value?.season || '');
const skillId = computed(() => nodeData.value?.id || props.id);

// 类别对应的色彩
const categoryColor = computed(() => {
  switch (category.value) {
    case 'offensive':
      return '#c9414a';
    case 'defensive':
      return '#3e7295';
    case 'impetus':
      return '#9a7f2c';
    default:
      return '#3a8240';
  }
});

defineOptions({
  name: 'MasteryCardDetail'
})
</script>

<template>
  <v-card class="demo-reel bg-black" flat border v-if="nodeData">
    <div class="demo-reel-header pa-10 position-relative"
         :style="`background-color: color-mix(in srgb, ${categoryColor} 10%, #000)`">
      <div class="v-skeleton-loader__bone v-skeleton-loader__image opacity-30 position-absolute left-0 top-0 w-100 h-100"></div>

      <div class="d-flex align-start ga-4">
        <div class="flex-grow-1">
          <h1 class="mastery-card-name card-name font-weight-bold text-h5">
            <MasteryName :id="skillId"/>
          </h1>
          <p class="card-id mb-1 mt-1 font-monospace">{{ skillId }}</p>
        </div>
      </div>

      <div class="card-chip d-flex ga-2 mt-3">
        <v-chip inline
                class="badge-flavor text-center text-black"
                v-if="category">{{ category }}
        </v-chip>
        <v-chip inline
                class="badge-flavor text-center text-black"
                v-if="role">{{ role }}
        </v-chip>
        <v-chip inline
                class="badge-flavor text-center text-black"
                v-if="season">{{ season }}
        </v-chip>
      </div>

      <LightRays
          rays-origin="top-right"
          quality="low"
          :rays-color="categoryColor"
          :rays-speed="2"
          :light-spread="10"
          :ray-length="10"
          :follow-mouse="false"
          :mouse-influence="0"
          :noise-amount="0"
          :distortion="0"
          class="w-100 h-100 pointer-events-none position-absolute top-0 right-0"
      />
    </div>

    <div :class="{'demo-reel-content': !isWidget}" class="background-flavor overflow-auto">
      <template v-if="isShowDescription">
        <div class="mb-5 px-6 description">
          <MasteryDescription :id="skillId"/>
        </div>
      </template>
      <div v-if="nodeData?.cost" class="px-6 mb-4 text-caption opacity-70">
        {{
          nodeData.role === 'seasonalPerk'
              ? `${t('mastery.card.perkCost')}: ${nodeData.cost}`
              : `${t('mastery.card.pointCost')}: ${nodeData.cost}`
        }}
      </div>
    </div>

    <v-divider v-if="isShowOpenDetail"></v-divider>
    <div :class="{'demo-reel-content': !isWidget}" class="pl-10 pr-10 background-flavor overflow-auto"
         v-if="isShowOpenDetail">
      <BtnWidget @action-complete="router.push(`/codex/mastery/${skillId}`)"
                 class="mt-1">
        {{ t('codex.mastery.lookDetail') }}
      </BtnWidget>
    </div>
  </v-card>
</template>

<style scoped lang="less">
@import "@/assets/styles/demo-reel";

.mastery-card-name {
  line-height: 1.2 !important;
  font-size: 1rem;
}
</style>
