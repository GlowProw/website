<script setup lang="ts">
import {computed, onMounted, type Ref, ref, watch} from "vue";
import {useI18n} from "vue-i18n";
import {useRouter} from "vue-router";
import {Enemy, Enemies} from "glow-prow-data";
import {useCDNAssetsServiceStore} from "~/stores/cdnAssetsStore";
import {useI18nReadName} from "@/assets/sripts/i18n_read_name";

import Banner from "@/components/Banner.vue";
import BtnWidget from "@/components/snbWidget/btnWidget.vue";
import EnemiesDescriptions from "@/components/snbWidget/enemiesDescriptions.vue";

const props = withDefaults(defineProps<{
  id?: string,
  data?: Enemy,
  isShowOpenDetail?: boolean,
  isWidget?: boolean,
}>(), {
  id: '',
  data: null,
  isShowOpenDetail: true,
  isWidget: false,
})

const {t} = useI18n(),
    router = useRouter(),
    cdnStore = useCDNAssetsServiceStore(),
    {enemy} = useI18nReadName(),
    enemies: any = Enemies

const enemiesCardData = ref({
  icon: ''
})
const i: Ref<Enemy | null> = ref(null)

const enemyId = computed(() => i.value?.id || '')

/**
 * 有航线时航线的状态描述由 EnemiesDescriptions 统一列出，因此只看根描述兜底
 */
const hasDescription = computed(() => {
  if (!i.value) return false
  if (((i.value as any).routes || []).length) return true
  return !!enemy(i.value.id).description()
})

const enemyDifficultyDescription = computed(() => {
  if (!enemyId.value) return ''
  return enemy(enemyId.value).difficultyDescription()
})

const onReady = () => {
  i.value = enemies[props?.data?.key || props?.data?.id || props?.id || ''] || null
  if (!i.value) return

  const iconId = i.value.icon || i.value.type
  enemiesCardData.value.icon = cdnStore.currentService.image.url({
    'glow-prow': {
      id: iconId,
      category: 'enemies'
    },
    'glow-prow-zh-cn': {
      id: iconId,
      category: 'enemies'
    },
    'local-test': {
      id: iconId,
      category: 'enemies'
    },
  })
}

watch(() => props.id, () => {
  onReady()
})

watch(() => props.data, () => {
  onReady()
}, {deep: true})

watch(() => cdnStore.selectedService, () => {
  onReady()
})

onMounted(() => {
  onReady()
})

defineOptions({
  name: 'EnemiesCardDetail'
})
</script>

<template>
  <v-card border class="demo-reel bg-black" flat v-if="i && i.id">
    <Banner class="demo-reel-header pa-10">
      <div class="v-skeleton-loader__bone v-skeleton-loader__image opacity-30 position-absolute left-0 top-0 w-100 h-100"></div>

      <h1 class="enemies-card-name font-weight-bold w-66">
        <span :title="enemy(i.id).name()">{{ enemy(i.id).name() }}</span>
      </h1>
      <p class="mb-1 mt-2">{{ i.id }}</p>

      <div class="d-flex flex-wrap ga-2 mt-3">
        <v-chip inline class="badge-flavor text-center text-black" v-if="i.category">
          {{ t(`codex.enemy.categorys.${i.category}`) }}
        </v-chip>
        <v-chip inline class="badge-flavor text-center text-black" v-if="i.type">
          {{ t(`map.types.${i.type}.name`) }}
        </v-chip>
      </div>

      <div class="right-show-image pointer-events-none position-absolute w-33">
        <v-img :src="enemiesCardData.icon" class="enemies-mirror-image"></v-img>
      </div>
    </Banner>

    <v-card-text class="demo-reel-content px-10 py-5" v-if="hasDescription">
      <EnemiesDescriptions :id="i.id"></EnemiesDescriptions>
    </v-card-text>

    <v-card-text class="demo-reel-content px-10 pb-5 pt-0 text-caption opacity-70" v-if="enemyDifficultyDescription">
      <v-icon size="15" class="mr-1">mdi-account-group</v-icon>{{ enemyDifficultyDescription }}
    </v-card-text>

    <v-divider v-if="isShowOpenDetail" opacity=".06"></v-divider>
    <v-card-actions class="demo-reel-content px-10 py-5 overflow-auto" v-if="isShowOpenDetail">
      <BtnWidget hotkey-action="openItemDetail" @action-complete="router.push(`/codex/enemy/${i.key}`)">
        {{ t('codex.enemy.lookDetail') }}
      </BtnWidget>
    </v-card-actions>
  </v-card>
</template>

<style scoped lang="less">
@import "@/assets/styles/demo-reel";

.enemies-mirror-image {
  position: absolute;
  right: 0;
  transform: scaleX(-1);
  width: 80px;
}

.enemies-card-name {
  line-height: 1.2 !important;
}
</style>
