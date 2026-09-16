<script setup lang="ts">

import ShipIconWidget from "@/components/snbWidget/shipIconWidget.vue";
import CommoditieIconWidget from "@/components/snbWidget/commoditieIconWidget.vue";
import TreasureMapIconWidget from "@/components/snbWidget/treasureMapIconWidget.vue";
import ItemSlotBase from "@/components/snbWidget/ItemSlotBase.vue";
import ItemIconWidget from "@/components/snbWidget/itemIconWidget.vue";
import NpcIconWidget from "@/components/snbWidget/npcIconWidget.vue";
import MapLocationIconWidget from "@/components/snbWidget/mapLocationIconWidget.vue";
import UltimateIconWidget from "@/components/snbWidget/ultimateIconWidget.vue";
import MaterialIconWidget from "@/components/snbWidget/materialIconWidget.vue";
import CosmeticIconWidget from "@/components/snbWidget/cosmeticIconWidget.vue";
import ModIconWidget from "@/components/snbWidget/modIconWidget.vue";
import SetIconWidget from "@/components/snbWidget/setIconWidget.vue";
import EmpireSkillIconWidget from "@/components/snbWidget/empireSkillIconWidget.vue";

import ShipName from "@/components/snbWidget/shipName.vue";
import ItemName from "@/components/snbWidget/itemName.vue";
import CommoditieName from "@/components/snbWidget/commoditieName.vue";
import MaterialName from "@/components/snbWidget/materialName.vue";
import UltimateName from "@/components/snbWidget/ultimateName.vue";
import CosmeticName from "@/components/snbWidget/cosmeticName.vue";
import ModName from "@/components/snbWidget/modName.vue";
import SetName from "@/components/snbWidget/setName.vue";
import TreasureMapName from "@/components/snbWidget/treasureMapName.vue";
import MapLocationName from "@/components/snbWidget/mapLocationName.vue";
import NpcName from "@/components/snbWidget/npcName.vue";
import EmpireSkillName from "@/components/snbWidget/empireSkillName.vue";

import {
  Items,
  Ships,
  Ultimates,
  Modifications,
  Cosmetics,
  Sets,
  Materials,
  Commodities,
  EmpireSkills,
  TreasureMaps,
  MapLocations,
  Npcs,
} from "glow-prow-data";
import {computed, ref} from "vue";
import {useI18n} from "vue-i18n";
import {useRouter} from "vue-router";
import {useAppStore} from "~/stores/appStore";
import {getCurrentSeason, storage} from "@/assets/sripts";
import HorizontalScrollList from "./HorizontalScrollList.vue";
import AffixContainerView from "./AffixContainerView.vue";

const
    router = useRouter(),
    appStore = useAppStore(),
    {t} = useI18n()

// 内存单例缓存，避免多次重新过滤
const memorySeasonCache = new Map<string, { categories: Record<string, any[]>; all: any[] }>()

const filterSeasonCategory = (collection: any[], seasonId: string) => {
  return collection.filter((i: any) => {
    if (i.bySeason?.id == seasonId) return true
    if (i.firstAppearingSeason?.id == seasonId) return true
    if (i.season?.id == seasonId || i.season == seasonId) return true
    if (i.event?.bySeason?.id == seasonId) return true
    if (Array.isArray(i.event?.bySeasons) && i.event.bySeasons.some((s: any) => s?.id == seasonId)) return true
    return false
  })
}

const getOrComputeSeasonData = (seasonId: string) => {
  if (!seasonId) return { categories: {}, all: [] }

  // 优先从内存缓存获取
  if (memorySeasonCache.has(seasonId)) {
    return memorySeasonCache.get(seasonId)!
  }

  // 从会话存储获取
  const sessionKey = `new_season_codex_ids_${seasonId}`
  const sessionRes = storage.session.get(sessionKey)

  const rawCollections: Record<string, any> = {
    items: Items,
    ships: Ships,
    ultimates: Ultimates,
    modifications: Modifications,
    cosmetics: Cosmetics,
    sets: Sets,
    materials: Materials,
    commodities: Commodities,
    empireSkills: EmpireSkills,
    treasureMaps: TreasureMaps,
    mapLocations: MapLocations,
    npcs: Npcs,
  }

  let categoryMap: Record<string, any[]> = {}
  let allList: any[] = []

  if (sessionRes.code === 0 && sessionRes.data?.value) {
    const cachedIds: Record<string, string[]> = sessionRes.data.value
    for (const [key, col] of Object.entries(rawCollections)) {
      const ids = cachedIds[key] || []
      const items = ids.map(id => col[id] || Object.values(col).find((x: any) => x.id === id)).filter(Boolean)
      categoryMap[key] = items
      allList = allList.concat(items)
    }
  } else {
    // 会话未命中则过滤一次并写入会话缓存
    const idMapToSave: Record<string, string[]> = {}
    for (const [key, col] of Object.entries(rawCollections)) {
      const list = Object.values(col)
      const filtered = filterSeasonCategory(list, seasonId)
      categoryMap[key] = filtered
      idMapToSave[key] = filtered.map((x: any) => x.id)
      allList = allList.concat(filtered)
    }
    storage.session.set(sessionKey, idMapToSave)
  }

  const result = { categories: categoryMap, all: allList }
  memorySeasonCache.set(seasonId, result)
  return result
}

const currentSeasonData = computed(() => {
  const seasonId = getCurrentSeason()?.id || ''
  return getOrComputeSeasonData(seasonId)
})

// 选中的分类：默认 null（全选/展示全部）
const selectedCategory = ref<string | null>(null)

const getIconSize = computed({
  get: () => appStore.iconSize,
  set: (value) => appStore.setIconSize(value)
})

const codexCategories = computed(() => {
  const seasonId = getCurrentSeason()?.id || ''
  const categories = currentSeasonData.value.categories
  const list = [
    { name: 'items', title: 'codex.items.title', to: `/codex/items?season=${seasonId}`, count: (categories.items || []).length, list: categories.items || [] },
    { name: 'ships', title: 'codex.ships.title', to: `/codex/ships?season=${seasonId}`, count: (categories.ships || []).length, list: categories.ships || [] },
    { name: 'ultimates', title: 'codex.ultimates.title', to: `/codex/ultimates?season=${seasonId}`, count: (categories.ultimates || []).length, list: categories.ultimates || [] },
    { name: 'modifications', title: 'codex.modifications.title', to: `/codex/modifications?season=${seasonId}`, count: (categories.modifications || []).length, list: categories.modifications || [] },
    { name: 'cosmetics', title: 'codex.cosmetics.title', to: `/codex/cosmetics?season=${seasonId}`, count: (categories.cosmetics || []).length, list: categories.cosmetics || [] },
    { name: 'sets', title: 'codex.sets.title', to: `/codex/sets?season=${seasonId}`, count: (categories.sets || []).length, list: categories.sets || [] },
    { name: 'materials', title: 'codex.materials.title', to: `/codex/materials?season=${seasonId}`, count: (categories.materials || []).length, list: categories.materials || [] },
    { name: 'commodities', title: 'codex.commodities.title', to: `/codex/commodities?season=${seasonId}`, count: (categories.commodities || []).length, list: categories.commodities || [] },
    { name: 'empireSkills', title: 'codex.empireSkills.title', to: `/codex/empireSkills?season=${seasonId}`, count: (categories.empireSkills || []).length, list: categories.empireSkills || [] },
    { name: 'treasureMaps', title: 'codex.treasureMaps.title', to: `/codex/treasureMaps?season=${seasonId}`, count: (categories.treasureMaps || []).length, list: categories.treasureMaps || [] },
    { name: 'mapLocations', title: 'codex.mapLocations.title', to: `/codex/mapLocations?season=${seasonId}`, count: (categories.mapLocations || []).length, list: categories.mapLocations || [] },
    { name: 'npcs', title: 'codex.npcs.title', to: `/codex/npcs?season=${seasonId}`, count: (categories.npcs || []).length, list: categories.npcs || [] },
  ]
  const withItems = list.filter(item => item.count > 0)
  return withItems.length > 0 ? withItems : list
})

// 单击分类：若再次点击同一个则取消（重置为全选状态），若点击另一个则切换
const onSelectCategory = (name: string) => {
  if (selectedCategory.value === name) {
    selectedCategory.value = null
  } else {
    selectedCategory.value = name
  }
}

// 判定 Chip 是否处于高亮/激活样式（默认全选时所有 chip 均高亮，选中单个时仅高亮当前）
const isChipActive = (catName: string) => {
  return selectedCategory.value === null || selectedCategory.value === catName
}

const onNavigate = (to: string) => {
  if (to) {
    router.push(to)
  }
}

const displayItems = computed(() => {
  if (!selectedCategory.value) {
    return currentSeasonData.value.all
  }
  return currentSeasonData.value.categories[selectedCategory.value] || []
})
</script>

<template>
  <v-card class="bg-black">
    <HorizontalScrollList :is-indicator="false" :use-shift-key="false">
      <div class="ga-2 d-flex align-center py-1">
        <v-chip
            v-for="cat in codexCategories"
            :key="cat.name"
            class="badge-flavor text-center tag-badge cursor-pointer category-chip"
            :class="[
              isChipActive(cat.name)
                ? 'is-selected-category bg-amber text-black'
                : 'bg-black text-white'
            ]"
            @click="onSelectCategory(cat.name)">
          <span class="category-chip-label">{{ t(cat.title) }} {{ cat.count || 0 }}</span>
          <v-icon
              icon="mdi-open-in-new"
              size="14"
              class="ml-1 opacity-60 codex-to-icon"
              :title="t(cat.title)"
              @click.stop="onNavigate(cat.to)"
          ></v-icon>
        </v-chip>
      </div>
    </HorizontalScrollList>
  </v-card>

  <v-row no-gutters>
    <v-col cols="auto" v-for="(i,index) in displayItems" :key="index" class="d-flex align-center">
      <ItemSlotBase :size="`${Math.min(Math.max(getIconSize.size, 50), 60)}px`" :padding="0" :margin="0" class="bg-transparent">
        <ShipIconWidget :id="i.id" v-if="i._typeStringName == 'Ship'"></ShipIconWidget>
        <ItemIconWidget :id="i.id" v-if="i._typeStringName == 'Item'"></ItemIconWidget>
        <CommoditieIconWidget :id="i.id" v-if="i._typeStringName == 'Commoditie' || i._typeStringName == 'Commodity'"></CommoditieIconWidget>
        <UltimateIconWidget :id="i.id" v-if="i._typeStringName == 'Ultimate'"></UltimateIconWidget>
        <MaterialIconWidget :id="i.id" v-if="i._typeStringName == 'Material'"></MaterialIconWidget>
        <MapLocationIconWidget :id="i.id" v-if="i._typeStringName == 'MapLocation'"></MapLocationIconWidget>
        <TreasureMapIconWidget :id="i.id" v-if="i._typeStringName == 'TreasureMap'"></TreasureMapIconWidget>
        <CosmeticIconWidget :id="i.id" v-if="i._typeStringName == 'Cosmetic'"></CosmeticIconWidget>
        <NpcIconWidget :id="i.id" v-if="i._typeStringName == 'Npc'"></NpcIconWidget>
        <ModIconWidget :id="i.id" v-if="i._typeStringName == 'Modification'"></ModIconWidget>
        <SetIconWidget :id="i.id" v-if="i._typeStringName == 'Set'"></SetIconWidget>
        <EmpireSkillIconWidget :id="i.id" v-if="i._typeStringName == 'EmpireSkill'"></EmpireSkillIconWidget>
      </ItemSlotBase>

      <ItemName :id="i.id" v-if="i._typeStringName == 'Item'"></ItemName>
      <ShipName :id="i.id" v-if="i._typeStringName == 'Ship'"></ShipName>
      <CommoditieName :id="i.id" v-if="i._typeStringName == 'Commoditie' || i._typeStringName == 'Commodity'"></CommoditieName>
      <UltimateName :id="i.id" v-if="i._typeStringName == 'Ultimate'"></UltimateName>
      <MaterialName :id="i.id" v-if="i._typeStringName == 'Material'"></MaterialName>
      <MapLocationName :id="i.id" v-if="i._typeStringName == 'MapLocation'"></MapLocationName>
      <TreasureMapName :id="i.id" v-if="i._typeStringName == 'TreasureMap'"></TreasureMapName>
      <CosmeticName :id="i.id" v-if="i._typeStringName == 'Cosmetic'"></CosmeticName>
      <NpcName :id="i.id" v-if="i._typeStringName == 'Npc'"></NpcName>
      <ModName :id="i.id" v-if="i._typeStringName == 'Modification'"></ModName>
      <SetName :id="i.id" v-if="i._typeStringName == 'Set'"></SetName>
      <EmpireSkillName :id="i.id" v-if="i._typeStringName == 'EmpireSkill'"></EmpireSkillName>
    </v-col>
    <v-col cols="12" v-if="displayItems.length === 0" class="py-8 text-center text-medium-emphasis text-caption">
      {{ t('basic.empty') }}
    </v-col>
  </v-row>
</template>

<style scoped lang="less">
.category-chip {
  user-select: none;
  transition: all 0.2s ease;
}

.category-chip-label {
  pointer-events: none;
}

.codex-to-icon {
  cursor: pointer;
  transition: opacity 0.2s ease, transform 0.2s ease;

  &:hover {
    opacity: 1 !important;
    transform: scale(1.2);
  }
}
</style>
