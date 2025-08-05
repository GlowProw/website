<script setup lang="ts">
import WeaponModificationIconSlotWidget from "@/components/snbWidget/weaponModificationIconSlotWidget.vue";
import {Item} from "glow-prow-data/src/entity/Items.ts";
import {onMounted, ref, toRaw, watch} from "vue";
import type {Rarity} from "glow-prow-data/src/types/Rarity";
import {Modifications} from "glow-prow-data";
import {useI18n} from "vue-i18n";
import EmptyView from "@/components/EmptyView.vue";

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
    slotType: ['basic', 'advanced', 'special']
  },
  legendary: {
    slotType: ['basic', 'advanced', 'special']
  }
}

const modImages = import.meta.glob('@glow-prow-assets/modifications/*.*', {eager: true});
const props = withDefaults(defineProps<{
      size?: WeaponModificationSize | string | number,
      readonly?: boolean,
      data: Item | any,
      disabled?: boolean,
      type?: string,
      modelValue: Array | Item | any
    }>(), {
      readonly: false,
      size: 6,
      disabled: false,
      item: null,
    }),
    {t, te} = useI18n(),
    emit = defineEmits(['update:modelValue'])

let show = ref(false),
    modIconImages = ref({}),
    // 可用模组列表
    availableModulesData = ref<Record<string, any[]>>({}),
    // 武器插槽模组
    weaponModSlots = ref<Array<{ type: string, value: any | null }>>([])

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
})

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

  availableModulesData.value = onCategorizeByGrade(Modifications)
}

/**
 * 初始化分类表
 * 以grade创建
 * @param data
 */
const onCategorizeByGrade = (data): Record<string, any[]> => {
  const result: Record<string, any[]> = {};

  Object.values(data).forEach((item: any) => {
    if (props.type) {
      const hasMatchingVariant = item.variants?.some((variant: any) =>
          variant.itemType?.includes(props.type)
      );

      if (!hasMatchingVariant) return; // 不匹配则跳过
    }

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
</script>

<template>
  <!-- 武器扩展模组插槽 -->
  <v-btn block variant="text" size="small" class="pa-0" :disabled="disabled" @click="show = true">
    <WeaponModificationIconSlotWidget
        :size="size"
        v-for="(i, index) in props.modelValue" :key="index"
        :activate="!!i.value"
    ></WeaponModificationIconSlotWidget>
  </v-btn>

  <v-dialog v-model="show">
    <v-container>
      <div class="pa-5 card-enlargement-flavor">
        <v-card border class="bg-black pa-4">
          <v-card-title>
            <v-row align="center">
              <h1 class="text-amber">
                模组
              </h1>
              <v-spacer></v-spacer>
              <v-btn icon @click="show = false">
                <v-icon icon="mdi-close"/>
              </v-btn>
            </v-row>
          </v-card-title>
          <v-row class="pa-4">
            <v-col cols="6">
              <div class="font-weight-bold mb-1">
                已安装模组
              </div>

              <v-card
                  v-for="(mod, modIndex) in modelValue"
                  :key="modIndex"
                  variant="flat"
                  class="mb-3"
                  @drop="onDrop($event, modIndex)"
                  @dragover="onDragOver"
                  :class="{'slot-highlight': !mod.value}">
                <v-row>
                  <v-col cols="auto" class="mt-2 mb-2 ml-2">
                    <v-img class="ma-2" :src="modIconImages[mod.type]" width="40px" height="40px"/>
                  </v-col>
                  <v-divider vertical></v-divider>
                  <v-col class="mt-2 mb-2 mr-2">
                    <template v-if="mod.value">
                      <v-row align="stretch">
                        <v-col>
                          <v-card variant="tonal" class="pa-2 d-flex align-center">
                            <v-img class="mr-4" :src="modIconImages[mod.value.id]" width="40px" height="40px"/>
                            <div class="w-100">{{ t(`snb.modifications.${mod.value.id}.name`) }}</div>
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
                        拖拽{{ mod.type }}模组到此处
                      </div>
                      <div v-else>
                        <EmptyView></EmptyView>
                      </div>
                    </template>
                  </v-col>
                </v-row>
              </v-card>
            </v-col>
            <v-col cols="6" v-if="!readonly">
              <p class="font-weight-bold mb-1">可选择模组</p>

              <div class="overflow-auto" style="max-height: calc(100vh - 350px);">
                <v-expansion-panels variant="accordion">
                  <v-expansion-panel
                      v-for="(mods, title) in availableModulesData"
                      :key="title">
                    <template v-slot:title>
                      <v-img class="mr-4" :src="modIconImages[title]" width="40px" height="40px"/>
                      <div class="w-100">{{ title }}</div>
                    </template>
                    <template v-slot:text>
                      <v-card
                          v-for="(modItem, modItemIndex) in mods"
                          :key="modItemIndex"
                          variant="tonal"
                          class="pa-2 mb-2"
                          draggable="true"
                          @dragstart="onDragStart($event, modItem)">
                        <v-row>
                          <v-col cols="auto">
                            <v-img class="ma-2" :src="modIconImages[modItem.id]" width="40px" height="40px"/>
                          </v-col>
                          <v-col>
                            <b :class="`grade-${modItem.grade}-title`">{{ t(`snb.modifications.${modItem.id}.name`) }}</b>
                            <div v-for="(v, vIndex) in modItem.variants" :key="vIndex" :class="`grade-${modItem.grade}-description`" class="opacity-50 description">
                              <template v-if="te(`snb.modifications.${modItem.id}.description`)">
                                {{
                                  t(`snb.modifications.${modItem.id}.description`, {
                                    __: onPercentage(v.range)
                                  })
                                }}
                              </template>
                            </div>
                          </v-col>
                        </v-row>
                      </v-card>
                    </template>
                  </v-expansion-panel>
                </v-expansion-panels>
              </div>
            </v-col>
          </v-row>

          <v-card-actions v-if="!readonly">
            <v-btn class="bg-amber" @click="onConfirm">确定</v-btn>
            <v-btn @click="show = false">取消</v-btn>
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
