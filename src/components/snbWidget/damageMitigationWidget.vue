<script setup lang="ts">

import ItemSlotBase from "@/components/snbWidget/ItemSlotBase.vue";
import DamageIconWidget from "@/components/snbWidget/damageIconWidget.vue";
import {Item} from "glow-prow-data";
import {useI18n} from "vue-i18n";
import {computed} from "vue";

const props = withDefaults(
        defineProps<{ data: Item, direction?: 'vertical' | 'horizontal', type: 'armor' | 'aggressivity', isForciblyIcon?: boolean }>(),
        {
          type: 'armor',
          direction: 'vertical',
          isForciblyIcon: false,
        }
    ),
    {t} = useI18n(),
    dictionary = {
      "aggressivity": {},
      "armor": {
        "explosive": 0,
        "flooding": 0,
        "fire": 0,
        "piercing": 0,
        "electric": 0,
        "toxic": 0
      }
    }

let damageMitigation = computed(() => {
  // 获取实际数据
  const actualData = props.data?.damageMitigation || {}

  if (props.type === 'armor') {
    const armorKeys = Object.keys(dictionary.armor)

    if (props.isForciblyIcon) {
      // 强制显示图标时，合并实际数据和字典数据，优先使用实际数据
      return armorKeys.map(key => {
        // 如果实际数据中有这个键，使用实际数据，否则使用字典的默认值
        const value = key in actualData ? actualData[key] : dictionary.armor[key]
        return [key, value]
      })
    } else {
      // 非强制显示时，只返回实际数据中存在的键
      return armorKeys
          .filter(key => key in actualData)
          .map(key => [key, actualData[key]])
    }
  } else {
    // aggressivity 类型的处理
    if (props.isForciblyIcon) {
      // 强制显示图标时，如果实际数据为空，返回空数组（因为 aggressivity 的字典是空的）
      return Object.keys(actualData).length > 0 ? Object.entries(actualData) : []
    } else {
      return Object.entries(actualData)
    }
  }
})

let armor = computed(() => {
  return props.data?.armor || 0
})

let filteredDamageMitigation = computed(() => {
  if (!damageMitigation.value) return []
  return damageMitigation.value.filter(([_, dmValue]) => (dmValue as any) >= 0)
})

/**
 * 计算是否应该显示某个伤害类型
 * @param dmKey
 * @param dmValue
 */
const shouldShowDamageType = (dmKey: string, dmValue: any) => {
  // 类型为 armor 时，只显示字典中定义的键
  if (props.type === 'armor') {
    if (!(dmKey in dictionary.armor)) {
      return false
    }
  }

  if (props.isForciblyIcon) {
    return true
  }
  return (dmValue as any) >= 0
}

defineOptions({
  name: 'DamageMitigationWidget'
})
</script>

<template>
  <template v-if="direction == 'vertical'">
    <v-text-field :value="armor"
                  v-if="armor || isForciblyIcon"
                  readonly
                  hide-details
                  class="mb-4"
                  variant="underlined"
                  density="compact">
      <template v-slot:append-inner>
        <p class="text-no-wrap">{{ t(`assembly.tags.damageTypes.armor`) }}</p>
      </template>
      <template v-slot:append>
        <ItemSlotBase size="30px" :padding="0">
          <DamageIconWidget id="armor" :iconType="type"></DamageIconWidget>
        </ItemSlotBase>
      </template>
    </v-text-field>

    <v-text-field :value="`${(dmValue * 100).toFixed(0)}%`"
                  v-for="([dmKey,dmValue]) in filteredDamageMitigation"
                  :key="dmKey"
                  readonly
                  hide-details
                  variant="underlined"
                  density="compact">
      <template v-slot:append-inner>
        <p class="text-no-wrap">{{ t(`assembly.tags.damageTypes.${dmKey}`) }}</p>
      </template>
      <template v-slot:append>
        <ItemSlotBase size="30px" :padding="0">
          <DamageIconWidget :id="dmKey" :iconType="type"></DamageIconWidget>
        </ItemSlotBase>
      </template>
    </v-text-field>
  </template>

  <template v-else-if="direction == 'horizontal'">
    <v-row>
      <v-col cols="auto" class="pa-2" v-if="armor || isForciblyIcon">
        <v-card variant="text">
          <ItemSlotBase size="30px" :padding="0" class="bg-transparent">
            <DamageIconWidget id="armor" :iconType="type" :is-border="false"></DamageIconWidget>
          </ItemSlotBase>
          <p class="text-no-wrap text-caption text-center">{{ armor }}</p>
        </v-card>
      </v-col>

      <v-divider v-if="(armor || isForciblyIcon) && damageMitigation.length > 0"
                 vertical inset :thickness="2" opacity=".3" class="my-5"></v-divider>

      <template
          v-for="([dmKey,dmValue]) in damageMitigation"
          :key="dmKey">
        <v-col
            v-if="shouldShowDamageType(dmKey, dmValue)"
            cols="auto"
            class="pa-2">
          <v-card variant="text">
            <ItemSlotBase size="30px" :padding="0" class="bg-transparent">
              <DamageIconWidget :id="dmKey" :iconType="type" :is-border="false"></DamageIconWidget>
            </ItemSlotBase>
            <p class="text-no-wrap text-caption text-center">{{ `${(dmValue * 100).toFixed(0)}%` }}</p>
          </v-card>
        </v-col>
      </template>
    </v-row>
  </template>
</template>

<style scoped lang="less">

</style>
