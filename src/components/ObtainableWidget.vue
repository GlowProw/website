<script setup lang="ts">

import ItemName from "@/components/snbWidget/itemName.vue";
import {computed} from "vue";
import {Commodity, Cosmetic, Cosmetics, Item, Items, Material, Npc} from "glow-prow-data";
import {useI18n} from "vue-i18n";
import EmptyView from "@/components/EmptyView.vue";
import {useI18nUtils} from "@/assets/sripts/i18n_util";
import ItemIconWidget from "@/components/snbWidget/itemIconWidget.vue";
import ItemSlotBase from "@/components/snbWidget/ItemSlotBase.vue";

const props = withDefaults(
        defineProps<{ data: Item | Material | Commodity | Cosmetic, byType: string }>(),
        {
          byType: ''
        }
    ),
    {t, tm} = useI18n(),
    {asString, sanitizeString} = useI18nUtils(),
    items = Items,
    cosmetics = Cosmetics

let obtainable = computed(() => {
      return filterByObtainable(props.data)
    }),
    seasonI18nMap = computed(() => {
      return tm('snb.seasons')
    }),
    i18nAdditionalAttr = computed(() => {
      return {
        ...seasonI18nMap.value
      }
    })

/**
 * 处理数据
 * @param d
 */
const filterByObtainable = (d: Item | Material | Cosmetic | Npc | null | undefined | any): any[] => {
  // 返回检查
  if (!d?.id) return [];

  const obtainable: any | any[] = d?.obtainable || d?.location || [];

  // 物品
  if (obtainable && obtainable._typeStringName == 'Item') {
    return [{
      id: obtainable.id,
      type: obtainable._typeStringName,
      to: `/codex/item/${obtainable.id}`,
    }];
  }

  // 地点
  else if (obtainable && obtainable._typeStringName == 'MapLocation') {
    return [{
      id: obtainable.id,
      type: obtainable._typeStringName,
      to: `/codex/map/view?key=${obtainable.id}`,
    }];
  }

  // 兜底方案
  // 处理字符串类型的 obtainable
  else if (typeof obtainable === 'string') {
    return [{
      id: obtainable,
    }];
  }

  // 处理数组类型的 obtainable
  if (Array.isArray(obtainable)) {
    return obtainable.flat().reduce<any[]>((acc, element) => {
      // 物品
      if (element && element._typeStringName == 'Item') {
        const item = items[element.id];

        if (item) {
          acc.push({
            id: element.id,
            type: element._typeStringName,
            to: `/codex/item/${element.id}`,
          })
        }
      }
      // 化妆品
      else if (element && element._typeStringName == 'Cosmetics') {
        const cosmetic = cosmetics[element.id];

        if (cosmetic) {
          acc.push({
            id: element.id,
            type: element._typeStringName,
            to: `/codex/cosmetic/${element.id}`,
          })
        }
      }
      // 地点
      else if (element && element._typeStringName == 'MapLocation') {
        return [{
          id: element.id,
          type: element._typeStringName,
          to: `/codex/map/view?key=${element.id}`,
        }];
      }
      // 兜底
      else if (typeof element === 'string') {
        acc.push({
          id: element,
        })
      }

      return acc;
    }, [])
  }

  return [];
};

const tip = (o) => {
  return asString([
    `snb.items.${o.id}.name`,
    `snb.items.${sanitizeString(o.id).cleaned}.name`,
    `snb.mapLocations.${o.id}.name`,
    `snb.locations.${o.id}`,
  ], {
    variable: i18nAdditionalAttr,
    backRawKey: true
  })
}
</script>

<template>
  <p class="text-no-wrap font-weight-bold mb-2 mt-2">
    <slot></slot>
  </p>
  <v-chip-group class="" :column="true">
    <v-chip v-for="(o,oIndex) in obtainable"
            class="mb-1 mr-1 py-2 "
            exact
            pill
            replace
            target="_blank"
            :key="oIndex"
            :to="o.to">

      <ItemSlotBase size="26px" class="mr-1" v-if="o && o.type=='Item'">
        <ItemIconWidget :margin="0" :id="o.id"  :is-open-new-window="false" :is-open-detail="false" :is-show-open-detail="flase"></ItemIconWidget>
      </ItemSlotBase>

      <template v-if="o.item">
        <ItemName :id="o.item.id"></ItemName>
      </template>
      <template v-else>
        <div class="singe-line w-100 multiline-chip obtainable-item" v-tooltip="tip(o)">
          {{ tip(o) }}
        </div>
      </template>
    </v-chip>
  </v-chip-group>
  <EmptyView v-if="obtainable.length <= 0"></EmptyView>
</template>

<style scoped lang="less">
@import "@/assets/styles/text.less";

.obtainable-item {
  max-width: 200px;
}
</style>
