<script setup lang="ts">
/**
 * 赛季图鉴明细弹窗
 * 左侧展示赛季汇总卡片，右侧按图鉴类型分组列出该赛季的全部可收集条目
 */
import {type Component, computed, ref, watch} from 'vue'
import {useI18n} from 'vue-i18n'
import {Apis} from '@/assets/sripts/api'
import {getCodexDetailPath} from '@/assets/sripts/codex_detail'
import type {PublicSeasonItems} from '@/assets/types/Statistics'
import type {SeasonItemsDialogProps} from '@/assets/types/Ui'
import ItemSlotBase from '@/components/snbWidget/ItemSlotBase.vue'
import ItemIconWidget from '@/components/snbWidget/itemIconWidget.vue'
import ShipIconWidget from '@/components/snbWidget/shipIconWidget.vue'
import CommoditieIconWidget from '@/components/snbWidget/commoditieIconWidget.vue'
import UltimateIconWidget from '@/components/snbWidget/ultimateIconWidget.vue'
import ModIconWidget from '@/components/snbWidget/modIconWidget.vue'
import MaterialIconWidget from '@/components/snbWidget/materialIconWidget.vue'
import CosmeticIconWidget from '@/components/snbWidget/cosmeticIconWidget.vue'
import SetIconWidget from '@/components/snbWidget/setIconWidget.vue'
import TreasureMapIconWidget from '@/components/snbWidget/treasureMapIconWidget.vue'
import MapLocationIconWidget from '@/components/snbWidget/mapLocationIconWidget.vue'
import NpcIconWidget from '@/components/snbWidget/npcIconWidget.vue'
import EmpireSkillIconWidget from '@/components/snbWidget/empireSkillIconWidget.vue'
import MasteryIconWidget from '@/components/snbWidget/masteryIconWidget.vue'
import SeasonName from '@/components/snbWidget/seasonName.vue'
import SeasonViewWidget from '@/components/SeasonViewWidget.vue'
import Loading from '@/components/Loading.vue'
import AffixContainerView from "@/components/AffixContainerView.vue";

const props = defineProps<SeasonItemsDialogProps>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const {t, te} = useI18n(),
    statsApi = Apis.publicStatsApi(),
    loading = ref(false),
    items = ref<PublicSeasonItems | null>(null)

// 图鉴类型与图标组件的对应关系
const iconWidgets: Record<string, Component> = {
  item: ItemIconWidget,
  ship: ShipIconWidget,
  commoditie: CommoditieIconWidget,
  ultimate: UltimateIconWidget,
  mod: ModIconWidget,
  modification: ModIconWidget,
  material: MaterialIconWidget,
  cosmetic: CosmeticIconWidget,
  set: SetIconWidget,
  treasureMap: TreasureMapIconWidget,
  mapLocation: MapLocationIconWidget,
  npc: NpcIconWidget,
  empireSkill: EmpireSkillIconWidget,
  mastery: MasteryIconWidget
}

/**
 * 加载当前赛季的图鉴条目
 */
const onLoad = async () => {
  if (!props.season) return
  loading.value = true
  items.value = null
  try {
    items.value = await statsApi.getSeasonItems(props.season.season)
  } finally {
    loading.value = false
  }
}

// 弹窗打开时才请求条目，关闭后不保留数据
watch(() => [props.modelValue, props.season?.season], ([open]) => {
  if (open) onLoad()
  else items.value = null
}, {immediate: true})

/**
 * 图鉴种类名称，缺失翻译时回退原始标识
 * @param kind 图鉴种类
 */
const kindName = (kind: string): string => {
  const path = `account.collectionStats.kinds.${kind}`
  return te(path) ? t(path) : kind
}

/**
 * 赛季起始日期展示
 * @param startDate 起始日期
 */
const formatDate = (startDate: string | null): string => {
  if (!startDate) return '-'
  const date = new Date(startDate)
  if (Number.isNaN(date.getTime())) return startDate
  return date.toLocaleDateString()
}

/**
 * 获取图鉴类型对应的图标组件，未知类型不渲染图标
 * @param targetType 图鉴类型
 */
const iconOf = (targetType: string): Component | undefined => iconWidgets[targetType]

/**
 * 条目所属赛季的展示总数
 */
const totalEntries = computed(() => items.value?.entries || props.season?.entries || 0)

/**
 * 关闭弹窗
 */
const onClose = () => emit('update:modelValue', false)

defineOptions({
  name: 'SeasonItemsDialog'
})
</script>

<template>
  <v-dialog
      :model-value="modelValue"
      :eager="true"
      @update:model-value="emit('update:modelValue', $event)"
      scrollable>
    <v-card v-if="modelValue && season" border
            rounded="lg"
            class="season-items-dialog v-container pa-0">
      <v-card-text class="">
        <v-row>
          <v-col cols="12" md="4" lg="3">
            <AffixContainerView :offset-top="0">
              <v-card variant="text" height="auto" class="my-2">
                <SeasonViewWidget :data="{id: season.season}"></SeasonViewWidget>
              </v-card>

              <div class="text-h6 font-weight-bold">
                <SeasonName :id="season.season"></SeasonName>
              </div>
              <div class="text-caption opacity-60 mb-3">
                {{ t('statistics.season.startDate') }}: {{ formatDate(season.startDate) }}
              </div>

              <v-row density="compact" class="mb-2">
                <v-col cols="6" class="text-body-2">
                  {{ t('statistics.season.entriesCount') }}: <b>{{ season.entries.toLocaleString() }}</b>
                </v-col>
                <v-col cols="6" class="text-body-2 text-right">
                  <u class="u">{{ t('statistics.season.collectedCount') }}: {{ season.collected.toLocaleString() }}</u>
                </v-col>
              </v-row>

              <v-row class="d-flex flex-wrap ga-0">
                <v-col cols="12" v-for="item in season.byType" :key="item.targetType">
                  <v-row align="center" density="compact">
                    <v-col cols="auto" class="text-body-2 singe-line">{{ kindName(item.targetType) }}</v-col>
                    <v-col>
                      <v-divider></v-divider>
                    </v-col>
                    <v-col cols="auto" class="text-body-2">
                      <u class="u">{{ item.count.toLocaleString() }}</u>
                    </v-col>
                  </v-row>
                </v-col>
              </v-row>
            </AffixContainerView>
          </v-col>

          <v-col cols="12" md="8" lg="9">
            <div v-if="loading" class="w-100">
              <Loading size="50" class="mx-auto"></Loading>
            </div>

            <div v-else-if="items?.groups.length">
              <div v-for="group in items.groups" :key="group.targetType" class="mb-4">
                <AffixContainerView :offset-top="0">
                  <v-row class="d-flex align-center mb-2">
                    <v-col cols="auto" class="singe-line">{{ kindName(group.targetType) }}</v-col>
                    <v-col>
                      <v-divider></v-divider>
                    </v-col>
                    <v-col cols="auto" class="opacity-60">{{ group.items.length }}</v-col>
                  </v-row>
                </AffixContainerView>

                <v-row density="compact">
                  <v-col cols="auto" v-for="entry in group.items" :key="entry.id">
                    <router-link :to="getCodexDetailPath(group.targetType, entry.id)" class="d-block">
                      <ItemSlotBase size="76px">
                        <component :is="iconOf(group.targetType)" :id="entry.id" v-if="iconOf(group.targetType)"/>
                      </ItemSlotBase>
                    </router-link>
                  </v-col>
                </v-row>
              </div>
            </div>

            <div v-else class="text-center opacity-40 py-10 text-caption">
              {{ t('statistics.common.noData') }}
            </div>
          </v-col>
        </v-row>
      </v-card-text>

      <v-divider></v-divider>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn variant="tonal" @click="onClose">{{ t('basic.button.close') }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped lang="less">
.season-items-dialog {
}
</style>
