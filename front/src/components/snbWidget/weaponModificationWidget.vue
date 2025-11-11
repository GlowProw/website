<script setup lang="ts">
import RhombusWidget from "@/components/snbWidget/rhombusWidget.vue";
import {Item} from "glow-prow-data/src/entity/Items.ts";
import {computed, nextTick, onMounted, ref, toRaw, watch} from "vue";
import type {Rarity} from "glow-prow-data/src/types/Rarity";
import {Modifications} from "glow-prow-data";
import {useI18n} from "vue-i18n";
import EmptyView from "@/components/EmptyView.vue";
import ModName from "@/components/snbWidget/modName.vue";
import ModDescription from "@/components/snbWidget/modDescription.vue";
import BtnWidget from "@/components/snbWidget/btnWidget.vue";
import {useI18nUtils} from "@/assets/sripts/i18n_util";
import ModIconWidget from "@/components/snbWidget/modIconWidget.vue";
import ItemSlotBase from "@/components/snbWidget/ItemSlotBase.vue";

type WeaponModificationSize = '3' | '5' | '6' | '8'
type ModType = 'basic' | 'advanced' | 'special';
type ModCategory = 'all' | ModType;

interface ModSlot {
  type: ModType;
  value: any | null;
}

interface ModItem {
  id: string;
  grade: ModType;
  name?: string;
  description?: string;
  damageType?: string;
  requiredDamageType?: string;
  variants?: any[];
  effects?: string[];
}

const WEAPON_MOD_CONFIG: Record<Rarity, { slotType: ModType[] }> = {
  common: {
    slotType: ['basic', 'basic', 'advanced', 'special']
  },
  uncommon: {
    slotType: ['basic', 'advanced', 'special']
  },
  rare: {
    slotType: ['basic', 'advanced', 'special']
  },
  epic: {
    slotType: ['basic', 'advanced', 'advanced']
  },
  legendary: {
    slotType: ['basic', 'advanced', 'advanced']
  }
};

const MOD_STYLE_CONFIG: Record<ModType, string> = {
  'basic': 'rgba(208,255,208,0.14)',
  'advanced': 'rgba(187,220,255,0.14)',
  'special': 'rgba(249,235,255,0.14)'
};

const MOD_CATEGORIES: { value: ModCategory; label: string }[] = [
  {value: 'all', label: '全部模组'},
  {value: 'basic', label: '基础模组'},
  {value: 'advanced', label: '高级模组'},
  {value: 'special', label: '特殊模组'}
];

const props = withDefaults(defineProps<{
  size?: WeaponModificationSize | string | number,
  readonly?: boolean,
  data: Item | any,
  disabled?: boolean,
  type?: string,
  modelValue?: ModSlot[]
}>(), {
  readonly: false,
  size: 6,
  disabled: false,
});

const {t} = useI18n();
const {sanitizeString} = useI18nUtils();

const show = ref(false);
const modIconImages = ref<Record<string, string>>({});
const availableModulesData = ref<Record<ModType, ModItem[]>>({
  basic: [],
  advanced: [],
  special: []
});
const searchQuery = ref('');
const selectedCategory = ref<ModCategory>('all');
const filteredMods = ref<Record<ModType, ModItem[]>>({
  basic: [],
  advanced: [],
  special: []
});

const isModelValueEmpty = computed(() => {
  return !props.modelValue || props.modelValue.length === 0;
});

const slotStats = computed(() => ({
  basic: props.modelValue?.filter((i: ModSlot) => i.type === 'basic').length || 0,
  advanced: props.modelValue?.filter((i: ModSlot) => i.type === 'advanced').length || 0,
  special: props.modelValue?.filter((i: ModSlot) => i.type === 'special').length || 0
}));

const hasSlot = computed(() => ({
  basic: slotStats.value.basic > 0,
  advanced: slotStats.value.advanced > 0,
  special: slotStats.value.special > 0
}));

const totalAvailableMods = computed(() => {
  return Object.values(filteredMods.value).reduce((total, mods) => total + (mods?.length || 0), 0);
});

// 修复监听器 - 移除箭头函数包装
watch(() => props.data, (data: Item) => {
  if (data) {
    initializeSlots();
  }
  updateAvailableMods();
}, {deep: true});

watch(() => props.modelValue, () => updateAvailableMods(), {deep: true});

watch([searchQuery, selectedCategory], () => updateFilteredMods());

onMounted(() => {
  initializeResources();

  if (isModelValueEmpty.value) {
    nextTick(initializeSlots);
  }
});

const initializeResources = () => {
  loadModImages();
  updateAvailableMods();
};

const loadModImages = () => {
  const modImages = import.meta.glob('@/assets/images/snb/modTypeIcons/*.*', {eager: true});
  const imageMap: Record<string, string> = {};

  for (const path in modImages) {
    const key = path.split('/').pop()
        ?.toString()
        .replace('.webp', '')
        .replace('.png', '') || '';
    if (modImages[path] && typeof modImages[path] === 'object' && 'default' in modImages[path]) {
      imageMap[key] = (modImages[path] as any).default;
    }
  }
  modIconImages.value = imageMap;
};

const initializeSlots = () => {
  const rarity = props.data?.rarity || 'common';
  const slotTypes = WEAPON_MOD_CONFIG[rarity as Rarity]?.slotType || WEAPON_MOD_CONFIG.common.slotType;

  emit('update:modelValue',
      slotTypes.map((type: ModType) => ({
        type,
        value: null
      }))
  );
};

const updateAvailableMods = () => {
  availableModulesData.value = categorizeModificationsByGrade(Modifications);
  updateFilteredMods();
};

const updateFilteredMods = () => {
  const result: Record<ModType, ModItem[]> = {
    basic: [],
    advanced: [],
    special: []
  };

  Object.entries(availableModulesData.value).forEach(([grade, mods]) => {
    const modType = grade as ModType;

    // 分类筛选
    if (selectedCategory.value !== 'all' && selectedCategory.value !== modType) {
      return;
    }

    // 搜索筛选
    const filtered = (mods || []).filter(mod =>
        matchesSearchQuery(mod, searchQuery.value)
    );

    if (filtered.length > 0) {
      result[modType] = filtered;
    }
  });

  filteredMods.value = result;
};

const matchesSearchQuery = (mod: ModItem, query: string): boolean => {
  if (!query.trim()) return true;

  const searchTerm = query.toLowerCase();

  // 搜索模组名称和ID
  if (
      t(`snb.modifications.${mod.id}.name`)?.toLowerCase().includes(searchTerm) ||
      mod.id?.toLowerCase().includes(searchTerm)
  ) {
    return true;
  }

  // 搜索效果关键词
  if (mod.effects?.some((effect: string) =>
      effect.toLowerCase().includes(searchTerm)
  )) {
    return true;
  }

  // 搜索伤害类型
  if (mod.damageType?.toLowerCase().includes(searchTerm)) {
    return true;
  }

  return false;
};

const categorizeModificationsByGrade = (modificationsRaw: any): Record<ModType, ModItem[]> => {
  const result: Record<ModType, ModItem[]> = {
    basic: [],
    advanced: [],
    special: []
  };

  if (!props.data?.type) return result;

  // 获取已安装模组的damageType集合
  const installedDamageTypes = new Set(
      props.modelValue
          ?.filter((mod: ModSlot) => mod.value?.damageType)
          .map((mod: ModSlot) => mod.value.damageType)
  );

  // 获取武器的perks
  const weaponPerks = props.data.perks?.map((i: any) => sanitizeString(i).cleaned) || [];
  weaponPerks.forEach(perk => installedDamageTypes.add(perk));

  // // 检查武器是否包含指定的修复类perks
  // const hasRepairPerks = weaponPerks.some((perk: string) =>
  //     ['repairBlast', 'repairBomb', 'repair', 'repair2'].includes(perk)
  // );

  Object.values(modificationsRaw).forEach((item: any) => {
    // 检查武器类型是否匹配
    const hasMatchingVariant = item.variants?.some((variant: any) =>
        variant.itemType?.includes(props.data.type)
    );
    if (!hasMatchingVariant) return;

    // 检查requiredDamageType要求
    if (item.requiredDamageType) {
      if (!installedDamageTypes.has(item.requiredDamageType)) {
        return;
      }
    }

    // 按grade分类
    const grade = item.grade as ModType;
    if (grade && result[grade]) {
      result[grade].push(item);
    }
  });

  return result;
};

const onConfirm = () => {
  if (!show.value) return;

  show.value = false;
  emit('update:modelValue', toRaw(props.modelValue));
};

const onDragStart = (event: DragEvent, modItem: ModItem) => {
  if (event.dataTransfer) {
    event.dataTransfer.setData('application/json', JSON.stringify(modItem));
  }
};

const onDrop = (event: DragEvent, slotIndex: number) => {
  event.preventDefault();
  const data = event.dataTransfer?.getData('application/json');

  if (data && props.modelValue) {
    try {
      const modItem = JSON.parse(data) as ModItem;

      // 检查模组类型是否匹配卡槽类型
      if (modItem.grade === props.modelValue[slotIndex].type) {
        props.modelValue[slotIndex].value = modItem;
      } else {
        console.warn('模组类型与卡槽不匹配');
      }
    } catch (error) {
      console.error('解析拖拽数据失败:', error);
    }
  }
};

const onDragOver = (event: DragEvent) => {
  event.preventDefault();
};

const removeModification = (slotIndex: number) => {
  if (props.modelValue) {
    props.modelValue[slotIndex].value = null;
  }
};

const clearSearch = () => {
  searchQuery.value = '';
};

const getSlotDisplayName = (type: ModType): string => {
  return t(`assembly.modification.${type}`);
};

const emit = defineEmits<{
  'update:modelValue': [value: ModSlot[]]
}>();

defineExpose({
  weaponModConfig: WEAPON_MOD_CONFIG,
  modStyleConfig: MOD_STYLE_CONFIG
});
</script>

<template>
  <!-- 武器扩展模组插槽 -->
  <v-btn
      block
      variant="text"
      size="small"
      class="pa-0"
      :disabled="disabled"
      @click="show = true"
  >
    <RhombusWidget
        v-for="(i, index) in props.modelValue"
        :key="index"
        :size="size"
        :activate="!!i?.value"
    />
  </v-btn>

  <v-dialog v-model="show" scrollable>
    <v-container class="pa-0">
      <v-card border class="bg-black py-2 px-4 modification-dialog">
        <v-card-title class="d-flex align-center">
          <h1 class="text-amber">
            模组改装
          </h1>
          <v-spacer/>
          <v-btn icon @click="show = false">
            <v-icon icon="mdi-close"/>
          </v-btn>
        </v-card-title>

        <v-row class="pa-4">
          <!-- 已安装模组 -->
          <v-col cols="12" md="6" lg="6">
            <div class="font-weight-bold mb-3 d-flex align-center">
              <span>已安装模组</span>
            </div>

            <v-card
                v-for="(mod, modIndex) in modelValue"
                :key="modIndex"
                variant="flat"
                class="mb-3 mod-slot"
                border
                :color="MOD_STYLE_CONFIG[mod.type]"
                @drop="onDrop($event, modIndex)"
                @dragover="onDragOver"
                :class="{ 'slot-highlight': !mod.value }"
            >
              <v-row align="center" no-gutters>
                <v-col cols="auto" class="pa-3">
                  <v-img
                      :src="modIconImages[mod.type]"
                      width="40"
                      height="40"
                  />
                </v-col>
                <v-divider vertical opacity=".06"/>
                <v-col class="pa-3">
                  <template v-if="mod.value">
                    <v-card variant="tonal" class="pa-2">
                      <v-row align="center" no-gutters>
                        <v-col cols="auto">
                          <ItemSlotBase size="40px" class="mr-2" :padding="0">
                            <ModIconWidget
                                :id="mod.value.id"
                                :padding="0"
                                :margin="0"
                            />
                          </ItemSlotBase>
                        </v-col>
                        <v-col>
                          <ModName
                              :id="mod.value.id"
                              :grade="mod.value.grade"
                          />
                          <ModDescription
                              :id="mod.value.id"
                              :variants="mod.value.variants"
                              :grade="mod.value.grade"
                              :type="data.type"
                          />
                        </v-col>
                      </v-row>
                    </v-card>
                  </template>
                  <template v-else>
                    <div class="text-caption text-grey" v-if="!readonly">
                      拖拽{{ getSlotDisplayName(mod.type) }}模组到此处
                    </div>
                    <EmptyView v-else/>
                  </template>
                </v-col>
                <v-col cols="auto" v-if="!readonly && mod.value">
                  <v-btn
                      icon
                      variant="text"
                      size="small"
                      @click.stop="removeModification(modIndex)"
                      class="mr-2"
                  >
                    <v-icon>mdi-delete</v-icon>
                  </v-btn>
                </v-col>
              </v-row>
            </v-card>
          </v-col>

          <!-- 可选择模组 -->
          <v-col cols="12" md="6" lg="6" v-if="!readonly">
            <div class="d-flex align-center mb-2">
              <p class="font-weight-bold ma-0">可选择模组</p>
              <v-chip size="small" variant="tonal" class="ml-2">
                {{ totalAvailableMods }} 个
              </v-chip>
            </div>

            <!-- 搜索和筛选 -->
            <v-card border variant="flat" class="mb-4 bg-transparent">
              <v-row no-gutters align="center">
                <v-col cols="12" sm="6" class="pr-sm-2">
                  <v-text-field
                      v-model="searchQuery"
                      density="compact"
                      variant="outlined"
                      placeholder="搜索模组名称、效果..."
                      prepend-inner-icon="mdi-magnify"
                      hide-details
                      clearable
                      @click:clear="clearSearch"
                  />
                </v-col>
                <v-col cols="12" sm="6" class="pl-sm-2 mt-2 mt-sm-0">
                  <v-select
                      v-model="selectedCategory"
                      :items="MOD_CATEGORIES"
                      item-value="value"
                      item-title="label"
                      density="compact"
                      variant="outlined"
                      hide-details
                  />
                </v-col>
              </v-row>
            </v-card>

            <v-card border variant="flat" class="overflow-auto bg-transparent mod-list">
              <v-expansion-panels variant="accordion" tile class="bg-transparent">
                <v-expansion-panel
                    v-for="(mods, type) in filteredMods"
                    :key="type"
                    :bg-color="MOD_STYLE_CONFIG[type as ModType]"
                >
                  <template v-slot:title>
                    <v-row class="d-flex align-center justify-start w-100">
                      <v-col cols="auto">
                        <v-img
                            :src="modIconImages[type]"
                            width="40"
                            height="40"
                            class="mr-4"
                        />
                      </v-col>
                      <v-col class="flex-grow-1">
                        {{ t(`assembly.modification.${type}`) }}
                        <v-chip size="x-small" variant="tonal" class="ml-1">
                          {{ mods?.length || 0 }}
                        </v-chip>
                      </v-col>
                    </v-row>
                  </template>
                  <template v-slot:text>
                    <div>
                      <v-card
                          v-for="(modItem, modItemIndex) in mods"
                          :key="modItemIndex"
                          variant="tonal"
                          class="pa-2 mb-2 mod-item"
                          draggable="true"
                          @dragstart="onDragStart($event, modItem)">
                        <v-row no-gutters>
                          <v-col cols="auto">
                            <ItemSlotBase size="40px" class="mr-2" :padding="0">
                              <ModIconWidget
                                  :id="modItem.id"
                                  :padding="0"
                                  :margin="0"
                              />
                            </ItemSlotBase>
                          </v-col>
                          <v-col>
                            <ModName
                                :id="modItem.id"
                                :grade="modItem.grade"
                            />
                            <ModDescription
                                :id="modItem.id"
                                :variants="modItem.variants"
                                :grade="modItem.grade"
                                :type="data.type"
                            />
                          </v-col>
                        </v-row>
                      </v-card>

                      <v-alert
                          v-if="!mods || mods.length === 0"
                          variant="tonal"
                          color="grey"
                          class="text-center"
                      >
                        未找到匹配的模组
                      </v-alert>
                    </div>
                  </template>
                </v-expansion-panel>
              </v-expansion-panels>
            </v-card>
          </v-col>
        </v-row>

        <v-card-actions v-if="!readonly">
          <v-spacer/>
          <v-btn @click="show = false">取消</v-btn>
          <v-btn class="bg-amber" @click="onConfirm">
            <BtnWidget
                :disabled="!show"
                size="25"
                keyboard-shortcut="f"
                class="ml-1"
                line-color="rgba(83,83,83,0.68)"
                color="#000"
                @action-complete="onConfirm"
            >
              确定
            </BtnWidget>
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-container>
  </v-dialog>
</template>

<style scoped lang="less">
.modification-dialog {
  max-height: 95vh;
}

.slot-highlight {
  transition: all 0.3s;
}

.mod-item {
  cursor: grab;
  transition: all 0.2s ease;

  &:hover {
    background-color: rgba(255, 255, 255, 0.05);
  }

  &:active {
    cursor: grabbing;
    transform: translateY(0);
  }
}

.mod-slot {
  transition: all 0.3s ease;
}

.mod-list {
  max-height: calc(80vh - 200px);
  overflow-y: auto;
}
</style>
