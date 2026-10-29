<script setup lang="ts">
import {computed} from "vue";
import {useI18n} from "vue-i18n";
import {Enemies} from "glow-prow-data";
import EnemiesDescription from "@/components/snbWidget/enemiesDescription.vue";
import {useI18nReadName} from "@/assets/sripts/i18n_read_name";

const props = withDefaults(defineProps<{
  id: string,
  locale?: string,
  // 详情页显示航线编号，卡片里只列状态和描述
  isShowRouteTitle?: boolean
}>(), {
  locale: '',
  isShowRouteTitle: true
})

const {t} = useI18n(),
    {enemy} = useI18nReadName()

const enemyData = computed(() => (Enemies as any)[props.id] || null)
const routes = computed(() => (enemyData.value?.routes || []).filter(Boolean))

/**
 * 每条航线的航行状态一次性整理出来，供模板直接遍历
 */
const routeSections = computed(() => routes.value.map((routeItem: any, index: number) => ({
  id: routeItem.id,
  number: index + 1,
  variants: (routeItem.variants || []).filter(Boolean)
})))

defineOptions({
  name: 'EnemiesDescriptions'
})
</script>

<template>
  <!-- 船队：每条航线的全部航行状态一次性列出，不做点击切换 -->
  <div v-if="routeSections.length">
    <div v-for="routeItem in routeSections" :key="routeItem.id" class="mb-8">
      <v-row class="d-flex align-center flex-wrap ga-2" v-if="props.isShowRouteTitle">
        <v-col class="text-amber u">
          {{ t('codex.enemy.route', {num: routeItem.number}) }}
        </v-col>
      </v-row>

      <div v-for="variant in routeItem.variants" :key="variant.id" class="route-variant mt-2">
        <div class="d-flex align-center ga-1">
          <span>
            {{ enemy(props.id).variantName(variant.id, props.locale) }}
          </span>
        </div>
        <div class="mt-1 opacity-60">
          <EnemiesDescription :id="props.id" :variant-id="variant.id" :locale="props.locale"></EnemiesDescription>
        </div>
      </div>
    </div>
  </div>

  <!-- 非船队敌人：直接使用根描述 -->
  <EnemiesDescription v-else :id="props.id" :locale="props.locale"></EnemiesDescription>
</template>

<style scoped lang="less">
</style>
