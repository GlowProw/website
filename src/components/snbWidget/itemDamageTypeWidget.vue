<script setup lang="ts">
import {computed, nextTick, onMounted, Ref, ref, watch} from "vue";

import {useI18nUtils} from "@/assets/sripts/i18n_util";

import EmptyView from "../EmptyView.vue";
import ItemSlotBase from "./ItemSlotBase.vue";
import {Item} from "glow-prow-data";
import DamageIconWidget from "@/components/snbWidget/damageIconWidget.vue";
import PerkIcon from "@/components/snbWidget/perkIcon.vue";
import {resolvePerkKeys} from "@/components/snbWidget/perkResolver";
import type {ItemDamageTypeSize} from "@/assets/types/Codex";

const props = withDefaults(defineProps<{ data: Item | any, iconType?: "aggressivity" | "armor" , sizeType?: ItemDamageTypeSize, size?: number }>(), {
      data: null,
      sizeType: 'default',
      size: 15,
    }),
    {sanitizeString} = useI18nUtils()

// 记录各伤害图标的显示状态
let damageRefStatus: Ref<boolean[]> = ref([]),
    damageIconImages: Ref<any[]> = ref([]),
    isEmpty = computed(() => {
      return damageRefStatus.value.filter((i: any) => i).length <= 0 && perkIconKeys.value.length <= 0
    })

// 伤害属性别名字典映射
const damageDictionaries: Record<string, string> = {
  "fire": "burning",
  "blast": "explosive",
  "combustion": "explosive",
}

// 基础伤害元素类型集合
const VALID_DAMAGE_ELEMENTS = new Set([
  'burning',
  'electric',
  'explosive',
  'fire',
  'flooding',
  'piercing',
  'tearing',
  'toxic',
  'armor',
])

// 缓存待渲染的词条效果指示图标列表
const perkIconKeys = ref<string[]>([])

onMounted(() => {
  onReady()
})

// 监听物品数据变化并重新计算图标
watch(() => props.data, () => onReady(), {deep: true})

/**
 * 刷新计算伤害类型与词条指示图标
 */
const onReady = () => {
  nextTick(() => {
    damageIconImages.value = []
    damageRefStatus.value = []
    perkIconKeys.value = []

    if (props.data && props.data.perks) {
      const renderedDamageKeys = new Set<string>()

      props.data.perks.forEach((i: any) => {
        const key = sanitizeString(i).cleaned
        damageIconImages.value.push({key})

        const base = key.replace(/\d+$/, '')
        const mapped = damageDictionaries[key] || damageDictionaries[base] || base
        if (VALID_DAMAGE_ELEMENTS.has(mapped)) {
          renderedDamageKeys.add(mapped === 'fire' ? 'burning' : mapped)
        }
      })

      // 提取所有词条效果指示图标，并过滤掉已由伤害组件渲染的重复项
      const allIcons = props.data.perks.flatMap((id: string) => resolvePerkKeys(id))
      perkIconKeys.value = Array.from(new Set(
          allIcons.filter((k: string) => !renderedDamageKeys.has(k))
      ))
    }
  })
}

/**
 * 接收子组件图标渲染状态回调
 *
 * @param isRendered 是否成功渲染
 * @param index 索引序号
 */
const setDamageRef = (isRendered: boolean, index: number) => {
  damageRefStatus.value[index] = isRendered;
}

defineOptions({
  name: 'ItemDamageTypeWidget'
})
</script>

<template>
  <!-- 默认模式 S -->
  <template v-if="sizeType == 'default'">
    <v-card class="bg-transparent d-flex ga-3" elevation="0">
      <template
          v-for="(i, index) in damageIconImages"
          :key="'dmg-' + index">
        <div v-show="damageRefStatus[index]">
          <ItemSlotBase
              padding="1"
              class="mr-1 d-flex justify-center align-center card-flavor">
            <DamageIconWidget
                :id="i.key"
                :iconType="iconType"
                @readEnd="(d: boolean) => setDamageRef(d, index)"
                size="35"></DamageIconWidget>
          </ItemSlotBase>
        </div>
      </template>

      <template
          v-for="(key, idx) in perkIconKeys"
          :key="'perk-' + idx">
        <ItemSlotBase
            padding="1"
            class="mr-1 d-flex justify-center align-center card-flavor">
          <PerkIcon :id="key" :size="35"></PerkIcon>
        </ItemSlotBase>
      </template>
    </v-card>

    <template v-if="isEmpty">
      <v-card class="bg-transparent background-flavor" border>
        <EmptyView></EmptyView>
      </v-card>
    </template>
  </template>
  <!-- 默认模式 E -->

  <!-- 迷你模式 S -->
  <template v-else-if="sizeType == 'mini'">
    <v-card
        class="bg-transparent d-flex ga-1"
        elevation="0"
        v-if="damageIconImages.length > 0 || perkIconKeys.length > 0">
      <template
          v-for="(i, index) in damageIconImages"
          :key="'dmg-' + index">
        <div v-show="damageRefStatus[index]">
          <ItemSlotBase
              padding="0"
              :size="size + 15"
              class="bg-transparent d-flex justify-center align-center card-flavor">
            <DamageIconWidget
                @readEnd="(d: boolean) => setDamageRef(d, index)"
                :id="i.key"
                :iconType="iconType"
                :isBorder="false"
                :size="size"></DamageIconWidget>
          </ItemSlotBase>
        </div>
      </template>

      <template
          v-for="(key, idx) in perkIconKeys"
          :key="'perk-' + idx">
        <ItemSlotBase
            padding="0"
            :size="size + 15"
            class="bg-transparent d-flex justify-center align-center card-flavor">
          <PerkIcon :id="key" :size="size" :isBorder="false"></PerkIcon>
        </ItemSlotBase>
      </template>
    </v-card>
  </template>
  <!-- 迷你模式 E -->
</template>

<style scoped lang="less">

</style>
