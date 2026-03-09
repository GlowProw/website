<script lang="ts">
export default {name: 'ObtainableWidget'}
</script>

<script setup lang="ts">

import ItemName from "@/components/snbWidget/itemName.vue";
import {computed} from "vue";
import {Commodity, Cosmetic, Cosmetics, Item, Items, Material, Npc} from "glow-prow-data";
import {useI18n} from "vue-i18n";
import EmptyView from "@/components/EmptyView.vue";
import {useI18nUtils} from "@/assets/sripts/i18n_util";
import ItemIconWidget from "@/components/snbWidget/itemIconWidget.vue";
import ItemSlotBase from "@/components/snbWidget/ItemSlotBase.vue";
import {Ship} from "glow-prow-data/src/entity/Ships";

const props = defineProps<{ data: Item | Ship | Material | Commodity | Cosmetic }>(),
    {t, tm} = useI18n(),
    {asString, sanitizeString} = useI18nUtils()

let blueprint = computed(() => {
      const data = props.data as any;
      return filterByBluePrint(data)
    }),
    seasonI18nMap = computed(() => {
      return (tm as any)('snb.seasons') as any
    }),
    i18nAdditionalAttr = computed(() => {
      const map = seasonI18nMap.value as Record<string, string>

      return Object.entries(map).reduce((acc, [key, value]) => {
        acc[key] = `<u class="spelling time-view time-view-slot singe-line">${value}</u>`
        return acc
      }, {} as Record<string, string>)
    })

/**
 * 处理数据
 * @param d
 */
const filterByBluePrint = (d: Item | Material | Cosmetic | Npc | null | undefined | any): any[] => {
  // 返回检查
  if (!d?.id) return [];

  const bluePrint: any | any[] = d?.blueprint || d?.bluePrint || []; // 兼容新旧命名

  // 地点
  if (bluePrint && bluePrint._typeStringName == 'Locations') {
    return [{
      id: bluePrint.id,
      type: bluePrint._typeStringName,
    }];
  }

  // 兜底方案
  // 处理字符串类型的 bluePrint
  else if (typeof bluePrint === 'string') {
    return [{
      id: bluePrint,
    }];
  }

  // 处理数组类型的 obtainable
  if (Array.isArray(bluePrint)) {
    return bluePrint.flat().reduce<any[]>((acc, element) => {
      // 地点
      if (element && element._typeStringName == 'Locations') {
        acc.push({
          id: element.id,
          type: element._typeStringName,
        })
      }
      // 地图地点
      else if (element && element._typeStringName == 'MapLocation') {
        return [{
          id: element.id,
          type: element._typeStringName,
        }];
      }
      // 兜底
      else if (typeof element === 'string') {
        acc.push({
          id: element,
          type: null,
        })
      }

      return acc;
    }, [])
  }

  return [];
};

/**
 * 获取文本
 * @param o
 */
const getChipText = (o: any) => {
  return asString([
    `snb.mapLocations.${o.id}.name`,
    `snb.locations.${o.id}`,
  ], {
    variable: i18nAdditionalAttr.value,
    backRawKey: true
  })
}
</script>

<template>
  <p class="text-no-wrap font-weight-bold mb-2 mt-2">
    <slot></slot>
  </p>
  <v-chip-group class="" :column="true">
    <v-chip v-for="(o,oIndex) in blueprint"
            class="mb-1 mr-1 py-2 "
            exact
            pill
            replace
            target="_blank"
            :key="oIndex"
            :to="o.to">
      <v-tooltip content-class="pa-0">
        <template v-slot:default>
          <v-card border class="py-3 px-10">
            <span v-html="getChipText(o)"></span>
          </v-card>
        </template>
        <template v-slot:activator="{props}">
          <div class="singe-line w-100 multiline-chip blueprint-item" v-bind="props" v-html="getChipText(o)"></div>
        </template>
      </v-tooltip>
    </v-chip>
  </v-chip-group>
  <EmptyView v-if="blueprint.length <= 0"></EmptyView>
</template>

<style lang="less">
@import "@/assets/styles/text.less";

u.spelling {
  text-decoration: dashed underline;
  cursor: pointer;
}
</style>

<style scoped lang="less">

.blueprint-item {
  max-width: 300px;
}
</style>
