<script setup lang="ts">
import RhombusWidget from "@/components/snbWidget/rhombusWidget.vue";
import {Item} from "glow-prow-data/src/entity/Items.ts";
import {computed, onMounted, ref, toRaw, watch} from "vue";
import type {Rarity} from "glow-prow-data/src/types/Rarity";
import {Modifications} from "glow-prow-data";
import {useI18n} from "vue-i18n";
import EmptyView from "@/components/EmptyView.vue";
import ModName from "@/components/snbWidget/modName.vue";
import ModDescription from "@/components/snbWidget/modDescription.vue";
import BtnWidget from "@/components/snbWidget/btnWidget.vue";
import {useI18nUtils} from "@/assets/sripts/i18n_util";
import ModIconWidget from "@/components/snbWidget/modIconWidget.vue";

type WeaponModificationSize = '3' | '5' | '6' | '8'
type WeaponModConfigType = Record<Rarity, any>;

// 插槽卡槽设定
// 按照等级来决定卡槽类型和数量
const weaponModConfig: WeaponModConfigType = {
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
    },
    modStyleConfig = {
      'basic': 'rgba(208,255,208,0.14)',
      'advanced': 'rgba(187,220,255,0.14)',
      'special': 'rgba(249,235,255,0.14)'
    }

const modImages = import.meta.glob('@glow-prow-assets/modifications/*.*', {eager: true});
const props = withDefaults(defineProps<{
      size?: WeaponModificationSize | string | number,
      readonly?: boolean,
      data: Item | any,
      disabled?: boolean,
      type?: string,
      modelValue?: Array<any> | Item | any
    }>(), {
      readonly: false,
      size: 6,
      disabled: false,
      item: null,
    }),
    {t, te} = useI18n(),
    {sanitizeString} = useI18nUtils(),
    modifications = Modifications,
    isHasBasicSlot = computed(() => {
      return props.modelValue.filter(i => i.type == 'basic').length > 0
    }),
    isHasAdvancedSlot = computed(() => {
      return props.modelValue.filter(i => i.type == 'advanced').length > 0
    }),
    isHasSpecialSlot = computed(() => {
      return props.modelValue.filter(i => i.type == 'special').length > 0
    }),
    emit = defineEmits(['update:modelValue'])

let show = ref(false),
    modIconImages = ref({}),
    // 可用模组列表
    availableModulesData = ref<Record<string, any[]>>({})

watch(() => props.data, (data: Item) => {
  if (data) {
    emit('update:modelValue',
        weaponModConfig[props.data.rarity || 'common'].slotType.map((i) => {
          return {
            type: i,
            value: null
          }
        })
    )
  }

  availableModulesData.value = onCategorizeByGrade(modifications)
})

watch(() => props.modelValue, () => {
  availableModulesData.value = onCategorizeByGrade(modifications);
}, {deep: true});

onMounted(() => {
  onReady()

  // 当无值时，初始
  if (!props.modelValue)
    emit('update:modelValue',
        weaponModConfig[props.data.rarity || 'common'].slotType.map((i) => {
          return {
            type: i,
            value: null
          }
        })
    )
})

const onReady = () => {
  const imageMap = {};
  for (const path in modImages) {
    const key = path.split('/').pop()
        ?.toString()
        .replace('.webp', '')
        .replace('.png', '');
    imageMap[key] = modImages[path].default;
  }
  modIconImages.value = imageMap;

  availableModulesData.value = onCategorizeByGrade(modifications)
}

/**
 * 初始化分类表
 * 以grade创建
 * @param modificationsRaw
 */
const onCategorizeByGrade = (modificationsRaw): Record<string, any[]> => {
  const result = {};

  if (!props.data?.type) return result;

  // 获取已安装模组的damageType集合
  const installedDamageTypes = new Set(
      props.modelValue
          ?.filter(mod => mod.value?.damageType)
          .map(mod => mod.value.damageType)
  );

  // 获取武器的perks
  const weaponPerks = props.data.perks?.map(i => sanitizeString(i).cleaned) || [];
  weaponPerks.forEach(perk => installedDamageTypes.add(perk));

  Object.values(modificationsRaw).forEach(item => {
    // 检查武器类型是否匹配
    const hasMatchingVariant = item.variants.some(variant =>
        variant.itemType.includes(props.data.type)
    );
    if (!hasMatchingVariant) return;

    // 检查requiredDamageType要求
    if (item.requiredDamageType) {
      // 如果模组有requiredDamageType，但已安装模组中没有匹配的damageType，则跳过
      if (!installedDamageTypes.has(item.requiredDamageType)) {
        return;
      }
    }

    // 按grade分类
    if (!result[item.grade]) {
      result[item.grade] = [];
    }
    result[item.grade].push(item);
  });

  return result;
}

/**
 * 确认
 */
const onConfirm = () => {
  if (!show.value) return;

  show.value = !show.value;
  emit('update:modelValue',
      toRaw(props.modelValue)
  )
}

/**
 * 拖拽开始事件
 * @param event 拖拽事件
 * @param modItem 模组数据
 */
const onDragStart = (event: DragEvent, modItem: any) => {
  event.dataTransfer?.setData('application/json', JSON.stringify(modItem));
}

/**
 * 拖拽放置事件
 * @param event 拖拽事件
 * @param slotIndex 卡槽索引
 */
const onDrop = (event: DragEvent, slotIndex: number) => {
  event.preventDefault();
  const data = event.dataTransfer?.getData('application/json');
  if (data) {
    const modItem = JSON.parse(data);

    // 检查模组类型是否匹配卡槽类型
    if (modItem.grade === props.modelValue[slotIndex].type) {
      props.modelValue[slotIndex].value = modItem;
    } else {
      console.warn('模组类型与卡槽不匹配');
    }
  }
}

/**
 * 拖拽悬停事件
 * @param event 拖拽事件
 */
const onDragOver = (event: DragEvent) => {
  event.preventDefault();
}

/**
 * 移除模组
 * @param slotIndex 卡槽索引
 */
const removeModification = (slotIndex: number) => {
  props.modelValue[slotIndex].value = null;
}

/**
 * 百分化
 * @param data
 */
const onPercentage = (data: []): [number, number] => {
  return [Math.ceil(data[0] * 100), Math.ceil(data[1] * 100)]
}

/**
 * 检查按照插槽的类型，决定可显示按照类型模组
 * @param type
 */
const isHasShowSlot = (type: string) => {
  switch (type) {
    case 'basic':
      return isHasBasicSlot.value
    case 'advanced':
      return isHasAdvancedSlot.value
    case 'special':
      return isHasSpecialSlot.value
  }
}

defineExpose({
  weaponModConfig,
  modStyleConfig
})
</script>

<template>
  <!-- 武器扩展模组插槽 -->
  <v-btn block variant="text" size="small" class="pa-0" :disabled="disabled" @click="show = true">
    <RhombusWidget
        :size="size"
        v-for="(i, index) in props.modelValue" :key="index"
        :activate="!!i.value"
    ></RhombusWidget>
  </v-btn>

  <v-dialog v-model="show">
    <v-container>
      <div class="pa-5 card-enlargement-flavor">
        <v-card border class="bg-black pa-4">
          <v-card-title>
            <v-row align="center">
              <h1 class="text-amber">
                模组改装
              </h1>
              <v-spacer></v-spacer>
              <v-btn icon @click="show = false">
                <v-icon icon="mdi-close"/>
              </v-btn>
            </v-row>
          </v-card-title>
          <v-row class="pa-4">
            <!-- 已安装模组 -->
            <v-col cols="12" md="6" lg="6">
              <div class="font-weight-bold mb-2">
                已安装模组
              </div>

              <v-card
                  v-for="(mod, modIndex) in modelValue"
                  :key="modIndex"
                  variant="flat"
                  class="mb-3"
                  border
                  :color="modStyleConfig[mod.type]"
                  @drop="onDrop($event, modIndex)"
                  @dragover="onDragOver"
                  :class="{'slot-highlight': !mod.value}">
                <v-row>
                  <v-col cols="auto" class="mt-2 mb-2 ml-2">
                    <v-img class="ma-2" :src="modIconImages[mod.type]" width="40px" height="40px"/>
                  </v-col>
                  <v-divider vertical opacity=".06"></v-divider>
                  <v-col class="mt-2 mb-2 mr-2">
                    <template v-if="mod.value">
                      <v-row align="stretch">
                        <v-col>
                          <v-card variant="tonal" class="pa-2">
                            <v-row no-gutters>
                              <v-col cols="auto">
                                <v-card width="40px" height="40px" variant="plain" class="mr-2">
                                  <ModIconWidget :id="mod.value.id"></ModIconWidget>
                                </v-card>
                              </v-col>
                              <v-col>
                                <ModName :id="mod.value.id" :grade="mod.value.grade"></ModName>
                                <ModDescription :id="mod.value.id" :variants="mod.value.variants" :grade="mod.value.grade" :type="data.type"></ModDescription>
                              </v-col>
                            </v-row>

                          </v-card>
                        </v-col>
                        <v-divider vertical class="opacity-10"></v-divider>
                        <v-col cols="auto" class="pa-0" v-if="!readonly">
                          <v-btn
                              tile
                              class="mr-1 pr-4 mr-0 h-100"
                              variant="text"
                              @click.stop="removeModification(modIndex)">
                            <v-icon class="">mdi-delete</v-icon>
                          </v-btn>
                        </v-col>
                      </v-row>
                    </template>
                    <template v-else>
                      <div class="text-caption text-grey" v-if="!readonly">
                        拖拽{{ t(`assembly.modification.${mod.type}`) }}模组到此处
                      </div>
                      <div v-else>
                        <EmptyView></EmptyView>
                      </div>
                    </template>
                  </v-col>
                </v-row>
              </v-card>
            </v-col>

            <!-- 可选择模组 -->
            <v-col cols="12" md="6" lg="6" v-if="!readonly">
              <p class="font-weight-bold mb-2">可选择模组</p>

              <v-card border variant="flat" class="overflow-auto bg-transparent">
                <v-expansion-panels variant="accordion" tile class="bg-transparent">
                  <v-expansion-panel
                      v-show="isHasShowSlot(type)"
                      v-for="(mods, type) in availableModulesData"
                      :bg-color="modStyleConfig[type]"
                      :key="type">
                    <template v-slot:title>
                      <v-img class="mr-4" :src="modIconImages[type]" width="40px" height="40px"/>
                      <div class="w-100">{{ t(`assembly.modification.${type}`) }} ({{ mods.length || 0 }})</div>
                    </template>
                    <template v-slot:text>
                      <div style="max-height: 300px;" class="overflow-y-auto">
                        <v-card
                            v-for="(modItem, modItemIndex) in mods"
                            :key="modItemIndex"
                            variant="tonal"
                            class="pa-2 mb-2 cursor-move"
                            draggable="true"
                            @dragstart="onDragStart($event, modItem)">
                          <v-row no-gutters>
                            <v-col cols="auto">
                              <v-card width="40px" height="40px" variant="plain" class="mr-2">
                                <ModIconWidget :id="modItem.id"></ModIconWidget>
                              </v-card>
                            </v-col>
                            <v-col>
                              <ModName :id="modItem.id" :grade="modItem.grade"></ModName>
                              <ModDescription :id="modItem.id" :variants="modItem.variants" :grade="modItem.grade" :type="data.type"></ModDescription>
                            </v-col>
                          </v-row>
                        </v-card>
                      </div>
                    </template>
                  </v-expansion-panel>
                </v-expansion-panels>
              </v-card>
            </v-col>
          </v-row>

          <v-card-actions v-if="!readonly">
            <v-spacer></v-spacer>
            <v-btn @click="show = false">取消</v-btn>
            <v-btn class="bg-amber" @click="onConfirm">
              <BtnWidget
                  :disabled="!show"
                  size="25" keyboard-shortcut="f" class="ml-1"
                  line-color="rgba(83,83,83,0.68)"
                  color="#000"
                  @action-complete="onConfirm">
                确定
              </BtnWidget>
            </v-btn>
          </v-card-actions>
        </v-card>
      </div>
    </v-container>
  </v-dialog>
</template>

<style scoped lang="less">
.slot-highlight {
  transition: all 0.3s;
}

.mod-item {
  cursor: grab;
  transition: all 0.2s;
}

.mod-item:hover {
  background-color: rgba(0, 0, 0, 0.05);
  transform: translateY(-2px);
}

.mod-item:active {
  cursor: grabbing;
}
</style>
