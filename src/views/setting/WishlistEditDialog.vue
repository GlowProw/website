<template>
  <div>
    <v-dialog
        :model-value="modelValue"
        @update:model-value="$emit('update:modelValue', $event)"
        max-width="1200"
        width="90vw"
        scrollable
        persistent
    >
      <v-card class="pa-2 pa-md-4">
        <v-card-title class="d-flex align-center justify-space-between pb-2">
          <span class="text-h6 font-weight-bold">
            {{ isEdit ? t('setting.wishlist.dialogTitleEdit') : t('setting.wishlist.dialogTitleCreate') }}
          </span>
          <v-btn icon variant="text" density="compact" @click="onCancel">
            <v-icon icon="mdi-close"></v-icon>
          </v-btn>
        </v-card-title>

        <!-- Tab 头部 S -->
        <v-tabs v-model="activeTab" color="amber" class="px-3">
          <v-tab value="basic">
            <v-icon icon="mdi-information-outline" class="mr-2"></v-icon>
            {{ t('setting.wishlist.basicTab') }}
          </v-tab>
          <v-tab value="rules">
            <v-icon icon="mdi-format-list-bulleted" class="mr-2"></v-icon>
            {{ t('setting.wishlist.rulesTab') }}
            <v-chip size="x-small" color="amber" class="ml-2">{{ rules.length }}</v-chip>
          </v-tab>
        </v-tabs>
        <!-- Tab 头部 E -->

        <v-divider></v-divider>

        <v-card-text style="max-height: 70vh;" class="pa-3">
          <v-form ref="formRef">
            <v-window v-model="activeTab">
              <!-- Tab 1: 清单基础信息 S -->
              <v-window-item value="basic">
                <div class="pa-2 pa-md-4">
                  <v-row density="compact">
                    <v-col cols="12" md="6">
                      <v-text-field
                          v-model="formData.title"
                          :label="t('setting.wishlist.field_title')"
                          variant="outlined"
                          density="compact"
                          required
                          :rules="[v => !!v || t('setting.wishlist.field_title')]"
                      ></v-text-field>
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-text-field
                          v-model="formData.author"
                          :label="t('setting.wishlist.field_author')"
                          variant="outlined"
                          density="compact"
                          placeholder="e.g. Captain Blackbeard"
                      ></v-text-field>
                    </v-col>
                    <v-col cols="12">
                      <v-textarea
                          v-model="formData.description"
                          :label="t('setting.wishlist.field_description')"
                          variant="outlined"
                          density="compact"
                          rows="3"
                          auto-grow
                          required
                          :rules="[v => !!v || t('setting.wishlist.field_description')]"
                      ></v-textarea>
                    </v-col>
                    <v-col cols="12" md="4">
                      <v-text-field
                          v-model="formData.version"
                          :label="t('setting.wishlist.field_version')"
                          variant="outlined"
                          density="compact"
                          placeholder="1.0.0"
                      ></v-text-field>
                    </v-col>
                    <v-col cols="12" md="8">
                      <v-text-field
                          v-model="formData.authorUrl"
                          :label="t('setting.wishlist.field_authorUrl')"
                          variant="outlined"
                          density="compact"
                          placeholder="https://..."
                      ></v-text-field>
                    </v-col>
                    <v-col cols="12">
                      <v-textarea
                          v-model="updateUrlsText"
                          :label="t('setting.wishlist.field_updateUrls')"
                          variant="outlined"
                          density="compact"
                          rows="3"
                          auto-grow
                          placeholder="https://example.com/wishlist.txt"
                      ></v-textarea>
                    </v-col>
                  </v-row>

                  <!-- 统计预览 -->
                  <div class="d-flex ga-2 mt-2" v-if="isEdit">
                    <v-chip size="small" variant="tonal" color="amber">
                      {{ t('setting.wishlist.rulesCount') }}: {{ rules.length }}
                    </v-chip>
                    <v-chip size="small" variant="tonal" v-if="props.wishlist?.duplicatesRemoved">
                      {{ t('setting.wishlist.duplicatesRemoved', { count: props.wishlist.duplicatesRemoved }) }}
                    </v-chip>
                  </div>
                </div>
              </v-window-item>
              <!-- Tab 1: 清单基础信息 E -->

              <!-- Tab 2: 规则列表 (虚拟列表) S -->
              <v-window-item value="rules">
                <div class="pa-1">
                  <!-- 工具栏 -->
                  <div class="d-flex align-center justify-space-between mb-3">
                    <div class="d-flex align-center ga-2">
                      <span class="font-weight-bold text-subtitle-1">
                        {{ t('setting.wishlist.rulesTitle') }}
                      </span>
                      <v-chip size="small" color="amber" variant="tonal">
                        {{ rules.length }}
                      </v-chip>
                    </div>

                    <!-- 专属物品分类筛选器 (取代共享 FullItemRightClickMenu) S -->
                    <v-menu location="bottom end">
                      <template #activator="{ props: menuProps }">
                        <v-btn
                            color="amber"
                            variant="tonal"
                            size="small"
                            prepend-icon="mdi-plus"
                            v-bind="menuProps"
                        >
                          {{ t('setting.wishlist.addItem') }}
                          <v-icon icon="mdi-menu-down" class="ml-1" size="16"></v-icon>
                        </v-btn>
                      </template>

                      <v-card border width="220">
                        <v-list density="compact" class="py-1">
                          <v-list-subheader class="text-caption font-weight-bold opacity-70">
                            物品分类筛选
                          </v-list-subheader>

                          <v-list-item
                              v-for="cat in itemFilterCategories"
                              :key="cat.id"
                              @click="onSelectFilterCategory(cat)"
                          >
                            <v-list-item-title class="text-body-2">
                              {{ cat.label }}
                            </v-list-item-title>
                          </v-list-item>
                        </v-list>
                      </v-card>
                    </v-menu>
                    <!-- 专属物品分类筛选器 E -->
                  </div>

                  <!-- 虚拟列表容器 -->
                  <div
                      ref="scrollContainerRef"
                      class="virtual-table-container"
                      @scroll="handleScroll"
                  >
                    <table class="virtual-table">
                      <thead>
                      <tr>
                        <th style="width: 50px;">#</th>
                        <th style="min-width: 180px;">{{ t('setting.wishlist.item') }}</th>
                        <th style="min-width: 260px;">{{ t('setting.wishlist.mod') }}</th>
                        <th style="min-width: 160px;">{{ t('setting.wishlist.notes') }}</th>
                        <th style="min-width: 200px;">{{ t('setting.wishlist.tags') }}</th>
                        <th style="width: 110px; text-align: center;">{{ t('setting.wishlist.actions') }}</th>
                      </tr>
                      </thead>
                      <tbody>
                      <!-- 空状态 -->
                      <tr v-if="rules.length === 0">
                        <td colspan="6" class="text-center py-8 opacity-60">
                          {{ t('setting.wishlist.noRules') }}
                        </td>
                      </tr>

                      <!-- 上填充垫片 -->
                      <tr v-if="paddingTop > 0" :style="{ height: `${paddingTop}px` }">
                        <td colspan="6" style="padding: 0; border: none;"></td>
                      </tr>

                      <!-- 可视区域规则行 -->
                      <tr
                          v-for="item in visibleRules"
                          :key="item.realIndex"
                          class="rule-row"
                      >
                        <!-- # 序号 -->
                        <td class="text-caption text-center font-weight-bold opacity-60">
                          {{ item.realIndex + 1 }}
                        </td>

                        <!-- 物品列 -->
                        <td>
                          <div class="d-flex align-center ga-2 py-1">
                            <ItemSlotBase size="32px">
                              <ItemIconWidget :id="item.rule.id" size="32px"></ItemIconWidget>
                            </ItemSlotBase>
                            <div class="d-flex flex-column">
                              <span class="font-weight-medium text-body-2 singe-line" style="max-width: 160px;">
                                <ItemName :id="item.rule.id"></ItemName>
                              </span>
                              <span class="text-caption opacity-40 code-id">{{ item.rule.id }}</span>
                            </div>
                          </div>
                        </td>

                        <!-- 模组列 (包含词条前缀下拉选择) -->
                        <td>
                          <div v-if="checkIsWeapon(item.rule.id)">
                            <div class="d-flex flex-wrap ga-1 align-center">
                              <!-- 单条 Mod 项 (含 Grade 下拉框) -->
                              <div
                                  v-for="(modId, mIdx) in getRuleMods(item.rule)"
                                  :key="mIdx"
                                  class="d-flex align-center ga-1 px-2 py-1 rounded mod-chip"
                              >
                                <!-- Grade 下拉选择框 S -->
                                <select
                                    class="mod-grade-select text-caption font-weight-bold"
                                    :value="getModGrade(modId)"
                                    @change="onChangeModGrade(item.rule, mIdx, $event)"
                                >
                                  <option v-for="g in modGrades" :key="g" :value="g">
                                    {{ t(`assembly.tags.grade.${g}`) }}
                                  </option>
                                </select>
                                <!-- Grade 下拉选择框 E -->

                                <!-- 词条名称 -->
                                <span class="text-caption font-weight-medium">
                                  <ItemName :id="getModPerkKey(modId)"></ItemName>
                                </span>

                                <!-- 删除按钮 -->
                                <v-icon
                                    icon="mdi-close"
                                    size="12"
                                    class="cursor-pointer opacity-60 ml-1 hover-opacity-100"
                                    @click="removeModFromRule(item.rule, mIdx)"
                                ></v-icon>
                              </div>

                              <v-btn
                                  size="x-small"
                                  variant="dashed"
                                  color="amber"
                                  density="compact"
                                  icon
                                  @click="openAddModDialog(item.rule)"
                                  :title="t('setting.wishlist.addMod')"
                              >
                                <v-icon icon="mdi-plus" size="14"></v-icon>
                              </v-btn>
                            </div>
                          </div>
                          <div v-else>
                            <span class="text-caption opacity-40">
                              {{ t('setting.wishlist.regularItem') }}
                            </span>
                          </div>
                        </td>

                        <!-- 备注列 (点击弹出单独文本对话框) -->
                        <td>
                          <div
                              class="notes-cell cursor-pointer pa-1 rounded"
                              @click="openNotesEditDialog(item.realIndex)"
                          >
                            <span v-if="item.rule.notes" class="text-caption text-truncate d-block" style="max-width: 150px;" :title="item.rule.notes">
                              {{ item.rule.notes }}
                            </span>
                            <span v-else class="text-caption opacity-40 font-italic">
                              {{ t('setting.wishlist.notesPlaceholder') }}
                            </span>
                          </div>
                        </td>

                        <!-- 标签列 (回车生成 Chip 标签) -->
                        <td>
                          <div class="d-flex flex-wrap ga-1 align-center">
                            <v-chip
                                v-for="(tag, tIdx) in (item.rule.tags || [])"
                                :key="tIdx"
                                size="x-small"
                                variant="tonal"
                                color="amber"
                                closable
                                @click:close="removeTagFromRule(item.rule, tIdx)"
                            >
                              {{ tag }}
                            </v-chip>

                            <input
                                type="text"
                                class="tag-input text-caption"
                                :placeholder="t('setting.wishlist.tagsPlaceholder')"
                                v-model="tagInputMap[item.realIndex]"
                                @keydown.enter.prevent="addTagFromInput(item.rule, item.realIndex)"
                                @blur="addTagFromInput(item.rule, item.realIndex)"
                            />
                          </div>
                        </td>

                        <!-- 操作列 -->
                        <td>
                          <div class="d-flex align-center justify-center ga-1">
                            <v-btn
                                icon
                                variant="text"
                                density="compact"
                                size="small"
                                :disabled="item.realIndex === 0"
                                @click="moveRule(item.realIndex, -1)"
                            >
                              <v-icon icon="mdi-arrow-up" size="16"></v-icon>
                            </v-btn>
                            <v-btn
                                icon
                                variant="text"
                                density="compact"
                                size="small"
                                :disabled="item.realIndex === rules.length - 1"
                                @click="moveRule(item.realIndex, 1)"
                            >
                              <v-icon icon="mdi-arrow-down" size="16"></v-icon>
                            </v-btn>
                            <v-btn
                                icon
                                variant="text"
                                density="compact"
                                size="small"
                                color="red"
                                @click="removeRule(item.realIndex)"
                            >
                              <v-icon icon="mdi-delete-outline" size="16"></v-icon>
                            </v-btn>
                          </div>
                        </td>
                      </tr>

                      <!-- 下填充垫片 -->
                      <tr v-if="paddingBottom > 0" :style="{ height: `${paddingBottom}px` }">
                        <td colspan="6" style="padding: 0; border: none;"></td>
                      </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </v-window-item>
              <!-- Tab 2: 规则列表 (虚拟列表) E -->
            </v-window>
          </v-form>
        </v-card-text>

        <v-card-actions class="pa-3">
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="onCancel">
            {{ t('basic.button.cancel') }}
          </v-btn>
          <v-btn color="amber" variant="elevated" @click="onSave">
            {{ t('basic.button.submit') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 备注编辑单独弹窗 S -->
    <v-dialog v-model="notesDialog" max-width="500">
      <v-card class="pa-4">
        <v-card-title class="text-subtitle-1 font-weight-bold pb-2">
          {{ t('setting.wishlist.editNotes') }}
        </v-card-title>
        <v-card-text>
          <v-textarea
              v-model="editingNoteText"
              :placeholder="t('setting.wishlist.notesPlaceholder')"
              variant="outlined"
              rows="5"
              auto-grow
              hide-details
          ></v-textarea>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="notesDialog = false">{{ t('basic.button.cancel') }}</v-btn>
          <v-btn color="amber" variant="elevated" @click="saveNotesDialog">{{ t('basic.button.submit') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <!-- 备注编辑单独弹窗 E -->

    <!-- 物品选择器对话框组件 -->
    <ItemView ref="itemViewRef" @finish="onFinishItemSelect" />
    <!-- 模组选择器对话框组件 -->
    <ModView ref="modViewRef" @finish="onFinishModSelect" />
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { v6 as uuidV6 } from 'uuid'
import { Items } from 'glow-prow-data'
import type { WishlistFile, WishlistRule } from '@/assets/types/Wishlist'
import ItemView from '@/components/ItemView.vue'
import ModView from '@/components/ModView.vue'
import ItemSlotBase from '@/components/snbWidget/ItemSlotBase.vue'
import ItemIconWidget from '@/components/snbWidget/itemIconWidget.vue'
import ItemName from '@/components/snbWidget/itemName.vue'

const props = defineProps<{
  modelValue: boolean
  wishlist?: WishlistFile | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'save', wishlist: WishlistFile): void
}>()

const { t } = useI18n()

const formRef = ref<any>(null)
const itemViewRef = ref<InstanceType<typeof ItemView> | null>(null)
const modViewRef = ref<InstanceType<typeof ModView> | null>(null)
const scrollContainerRef = ref<HTMLDivElement | null>(null)

const activeTab = ref('basic')
const isEdit = computed(() => !!props.wishlist && !!props.wishlist.id)

const formData = ref({
  id: '',
  title: '',
  description: '',
  author: '',
  authorUrl: '',
  version: '',
  source: 'custom',
  enabled: true
})

const updateUrlsText = ref('')
const rules = ref<WishlistRule[]>([])
const activeModTargetRule = ref<WishlistRule | null>(null)

// 备注单独编辑对话框状态
const notesDialog = ref(false)
const editingNotesIndex = ref<number | null>(null)
const editingNoteText = ref('')

// 标签临时输入 Map
const tagInputMap = ref<Record<number, string>>({})

// ── 专属物品分类筛选器 ──
interface CategoryFilterItem {
  id: string
  label: string
  category: 'item' | 'material' | 'cosmetic' | 'ultimate' | 'modification' | 'ship'
  tags: string[]
  icon: string
}

const itemFilterCategories: CategoryFilterItem[] = [
  { id: 'all_items', label: '全品类物品 (All Items)', category: 'item', tags: [], icon: 'mdi-cube-outline' },
  { id: 'weapons', label: '武器与护甲', category: 'item', tags: ['culverin', 'demicannon', 'bombard', 'longGun', 'torpedo', 'ballista', 'seaFire', 'mortar', 'rocket', 'springloader', 'armor'], icon: 'mdi-sword-cross' },
  { id: 'upgrades', label: '升级部件', category: 'item', tags: ['shipUpgrade'], icon: 'mdi-arrow-up-bold-box-outline' },
  { id: 'furniture', label: '船只陈设', category: 'item', tags: ['majorFurniture', 'offensiveFurniture', 'utilityFurniture'], icon: 'mdi-sofa-outline' },
  { id: 'consumables', label: '消耗品', category: 'item', tags: ['consumable'], icon: 'mdi-bottle-tonic-outline' },
  { id: 'tools_chests', label: '工具与宝箱', category: 'item', tags: ['tool', 'chest'], icon: 'mdi-treasure-chest' },
  { id: 'materials', label: '材料', category: 'material', tags: [], icon: 'mdi-hexagon-multiple-outline' },
  { id: 'cosmetics', label: '装饰品', category: 'cosmetic', tags: [], icon: 'mdi-palette-outline' },
  { id: 'ultimates', label: '终极技能', category: 'ultimate', tags: [], icon: 'mdi-lightning-bolt-outline' },
  { id: 'modifications', label: '模组', category: 'modification', tags: [], icon: 'mdi-puzzle-outline' },
  { id: 'ships', label: '船只', category: 'ship', tags: [], icon: 'mdi-ship-wheel' },
]

const onSelectFilterCategory = (cat: CategoryFilterItem) => {
  if (cat.category === 'modification') {
    modViewRef.value?.openPanel(cat.tags)
  } else {
    itemViewRef.value?.openPanel(cat.tags, cat.category)
  }
}

// ── 虚拟列表 Rolling Calculation ──
const ROW_HEIGHT = 60
const VIEWPORT_HEIGHT = 450
const BUFFER_COUNT = 4

const scrollTop = ref(0)

const handleScroll = (e: Event) => {
  const target = e.target as HTMLDivElement
  scrollTop.value = target.scrollTop
}

const startIndex = computed(() => {
  return Math.max(0, Math.floor(scrollTop.value / ROW_HEIGHT) - BUFFER_COUNT)
})

const endIndex = computed(() => {
  const count = Math.ceil(VIEWPORT_HEIGHT / ROW_HEIGHT) + BUFFER_COUNT * 2
  return Math.min(rules.value.length, startIndex.value + count)
})

const visibleRules = computed(() => {
  return rules.value.slice(startIndex.value, endIndex.value).map((rule, idx) => ({
    rule,
    realIndex: startIndex.value + idx
  }))
})

const paddingTop = computed(() => startIndex.value * ROW_HEIGHT)
const paddingBottom = computed(() => Math.max(0, (rules.value.length - endIndex.value) * ROW_HEIGHT))

// 武器类型列表
const WEAPON_TYPES = [
  'culverin',
  'demicannon',
  'bombard',
  'longGun',
  'torpedo',
  'ballista',
  'seaFire',
  'mortar',
  'rocket',
  'springloader',
  'auxiliaryWeapons',
  'topDeckWeapons',
  'allDeckWeapons',
  'weapon'
]

// Mod Grade 可选等级
const modGrades = ['basic', 'advanced', 'special', 'mythic']

const checkIsWeapon = (itemId: string): boolean => {
  if (!itemId) return false
  const itemData = (Items as any)[itemId]
  if (!itemData) return false
  return WEAPON_TYPES.includes(itemData.type)
}

/**
 * 从 mod 字符串中提取 Grade（默认为 basic）
 */
const getModGrade = (modId: string): string => {
  if (!modId) return 'basic'
  if (modId.includes('.')) {
    const prefix = modId.split('.')[0]
    if (modGrades.includes(prefix)) return prefix
  }
  return 'basic'
}

/**
 * 从 mod 字符串中提取 Perk Key (去除 Grade 前缀)
 */
const getModPerkKey = (modId: string): string => {
  if (!modId) return ''
  if (modId.includes('.')) {
    return modId.slice(modId.indexOf('.') + 1)
  }
  return modId
}

/**
 * 下拉框修改 Mod Grade 处理
 */
const onChangeModGrade = (rule: WishlistRule, index: number, event: Event) => {
  const newGrade = (event.target as HTMLSelectElement).value
  const mods = getRuleMods(rule)
  const oldModId = mods[index]
  if (!oldModId) return

  const perkKey = getModPerkKey(oldModId)
  const newModId = `${newGrade}.${perkKey}`

  if (rule.mods && rule.mods.includes(oldModId)) {
    const idx = rule.mods.indexOf(oldModId)
    rule.mods[idx] = newModId
  } else if (rule.mods) {
    rule.mods[index] = newModId
  } else {
    rule.mods = [newModId]
  }

  if (rule.perks && rule.perks.includes(oldModId)) {
    const idx = rule.perks.indexOf(oldModId)
    rule.perks[idx] = newModId
  }
}

const getRuleMods = (rule: WishlistRule): string[] => {
  const list: string[] = []
  if (rule.mods && rule.mods.length > 0) {
    list.push(...rule.mods)
  }
  if (rule.perks && rule.perks.length > 0) {
    for (const perk of rule.perks) {
      if (!list.includes(perk)) list.push(perk)
    }
  }
  return list
}

const removeModFromRule = (rule: WishlistRule, index: number) => {
  const mods = getRuleMods(rule)
  const targetModId = mods[index]
  if (!targetModId) return

  if (rule.mods) {
    rule.mods = rule.mods.filter(m => m !== targetModId)
  }
  if (rule.perks) {
    rule.perks = rule.perks.filter(p => p !== targetModId)
  }
}

// ── 备注对话框 ──
const openNotesEditDialog = (index: number) => {
  editingNotesIndex.value = index
  editingNoteText.value = rules.value[index]?.notes || ''
  notesDialog.value = true
}

const saveNotesDialog = () => {
  if (editingNotesIndex.value !== null && rules.value[editingNotesIndex.value]) {
    rules.value[editingNotesIndex.value].notes = editingNoteText.value.trim()
  }
  notesDialog.value = false
  editingNotesIndex.value = null
}

// ── 标签回车 Chip 新增 ──
const addTagFromInput = (rule: WishlistRule, index: number) => {
  const text = tagInputMap.value[index]?.trim()
  if (!text) return

  if (!rule.tags) {
    rule.tags = []
  }
  if (!rule.tags.includes(text)) {
    rule.tags.push(text)
  }
  tagInputMap.value[index] = ''
}

const removeTagFromRule = (rule: WishlistRule, tagIndex: number) => {
  if (rule.tags) {
    rule.tags.splice(tagIndex, 1)
  }
}

// ── 初始化数据 ──
watch(() => props.modelValue, (val) => {
  if (val) {
    activeTab.value = 'basic'
    tagInputMap.value = {}
    scrollTop.value = 0

    if (props.wishlist) {
      formData.value = {
        id: props.wishlist.id || uuidV6(),
        title: props.wishlist.title || '',
        description: props.wishlist.description || '',
        author: props.wishlist.author || '',
        authorUrl: props.wishlist.authorUrl || '',
        version: props.wishlist.version || '',
        source: props.wishlist.source || 'custom',
        enabled: props.wishlist.enabled ?? true
      }
      updateUrlsText.value = props.wishlist.updateUrls ? props.wishlist.updateUrls.join('\n') : ''
      rules.value = props.wishlist.rules ? JSON.parse(JSON.stringify(props.wishlist.rules)) : []
    } else {
      formData.value = {
        id: uuidV6(),
        title: '',
        description: '',
        author: '',
        authorUrl: '',
        version: '1.0.0',
        source: 'custom',
        enabled: true
      }
      updateUrlsText.value = ''
      rules.value = []
    }
  }
})

const onFinishItemSelect = (selectedData: any) => {
  const itemId = typeof selectedData === 'string' ? selectedData : selectedData?.id
  if (!itemId) return

  rules.value.push({
    id: itemId,
    perks: [],
    mods: [],
    notes: '',
    tags: []
  })

  nextTick(() => {
    if (scrollContainerRef.value) {
      scrollContainerRef.value.scrollTop = scrollContainerRef.value.scrollHeight
    }
  })
}

const openAddModDialog = (rule: WishlistRule) => {
  activeModTargetRule.value = rule
  modViewRef.value?.openPanel()
}

const onFinishModSelect = (selectedData: any) => {
  const selectedModId = typeof selectedData === 'string' ? selectedData : selectedData?.id
  if (!selectedModId) return

  const formattedModId = selectedModId.includes('.') ? selectedModId : `basic.${selectedModId}`

  if (activeModTargetRule.value) {
    if (!activeModTargetRule.value.mods) {
      activeModTargetRule.value.mods = []
    }
    if (!activeModTargetRule.value.mods.includes(formattedModId)) {
      activeModTargetRule.value.mods.push(formattedModId)
    }
    activeModTargetRule.value = null
  } else {
    rules.value.push({
      id: formattedModId,
      perks: [],
      mods: [],
      notes: '',
      tags: []
    })
  }
}

const moveRule = (index: number, delta: number) => {
  const targetIndex = index + delta
  if (targetIndex < 0 || targetIndex >= rules.value.length) return
  const temp = rules.value[index]
  rules.value[index] = rules.value[targetIndex]
  rules.value[targetIndex] = temp
}

const removeRule = (index: number) => {
  rules.value.splice(index, 1)
}

const onCancel = () => {
  emit('update:modelValue', false)
}

const onSave = async () => {
  if (formRef.value) {
    const { valid } = await formRef.value.validate()
    if (!valid) {
      activeTab.value = 'basic'
      return
    }
  }

  const updateUrls = updateUrlsText.value
      ? updateUrlsText.value.split(/\r?\n/).map(s => s.trim()).filter(Boolean)
      : undefined

  const savedFile: WishlistFile = {
    id: formData.value.id || uuidV6(),
    title: formData.value.title.trim(),
    description: formData.value.description.trim(),
    author: formData.value.author.trim() || undefined,
    authorUrl: formData.value.authorUrl.trim() || undefined,
    version: formData.value.version.trim() || undefined,
    source: formData.value.source || 'custom',
    enabled: formData.value.enabled,
    importedAt: Date.now(),
    lastUpdatedAt: Date.now(),
    updateUrls: updateUrls && updateUrls.length > 0 ? updateUrls : undefined,
    rules: rules.value
  }

  emit('save', savedFile)
  emit('update:modelValue', false)
}
</script>

<style scoped lang="less">
.virtual-table-container {
  max-height: 480px;
  overflow-y: auto;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  position: relative;
}

.virtual-table {
  width: 100%;
  border-collapse: collapse;

  th {
    position: sticky;
    top: 0;
    background: #1e1e1e;
    z-index: 2;
    padding: 10px 12px;
    font-size: 13px;
    text-align: left;
    border-bottom: 1px solid rgba(255, 255, 255, 0.12);
  }

  td {
    padding: 8px 12px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    height: 60px;
    box-sizing: border-box;
  }
}

.rule-row {
  height: 60px;
  transition: background-color 0.15s ease;

  &:hover {
    background-color: rgba(255, 255, 255, 0.03);
  }
}

.mod-chip {
  background: rgba(255, 179, 0, 0.12);
  border: 1px solid rgba(255, 179, 0, 0.3);
  border-radius: 4px;
}

.mod-grade-select {
  background: rgba(0, 0, 0, 0.3);
  color: var(--main-color, #ffb300);
  border: 1px solid rgba(255, 179, 0, 0.4);
  border-radius: 3px;
  padding: 1px 4px;
  outline: none;
  font-size: 11px;
  cursor: pointer;

  option {
    background: #1e1e1e;
    color: #ffffff;
  }
}

.notes-cell {
  background: rgba(255, 255, 255, 0.03);
  border: 1px dashed rgba(255, 255, 255, 0.15);
  min-height: 32px;
  display: flex;
  align-items: center;

  &:hover {
    background: rgba(255, 255, 255, 0.07);
    border-color: var(--main-color, #ffb300);
  }
}

.tag-input {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 4px;
  color: inherit;
  padding: 2px 8px;
  width: 120px;
  outline: none;

  &:focus {
    border-color: var(--main-color, #ffb300);
  }
}

.code-id {
  font-family: monospace;
  font-size: 11px;
}
</style>
