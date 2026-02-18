<script setup lang="ts">

import ItemName from "@/components/snbWidget/itemName.vue";
import {computed} from "vue";
import {Cosmetic, Cosmetics, Item, Items, Material, Npc} from "glow-prow-data";
import {useI18n} from "vue-i18n";
import EmptyView from "@/components/EmptyView.vue";
import {useI18nUtils} from "@/assets/sripts/i18n_util";

const props = withDefaults(
        defineProps<{ data: Item | Material | Cosmetic, byType: string }>(),
        {
          byType: ''
        }
    ),
    {t, tm} = useI18n(),
    {asString} = useI18nUtils(),
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
const filterByObtainable = (d: Item | Material | Cosmetic | Npc | null | undefined): any[] => {
  // 返回检查
  if (!d?.id) return [];

  const obtainable = d.obtainable || d.location;

  // 处理字符串类型的 obtainable
  if (typeof obtainable === 'string') {
    return [{
      id: obtainable,
    }];
  }

  // 处理对象类型的 obtainable（包含 id 属性）
  if (obtainable && obtainable._typeStringName == 'item') {
    return [{
      id: obtainable.id,
      to: `/item/${obtainable.id}`,
    }];
  }

  // 处理数组类型的 obtainable
  if (Array.isArray(obtainable)) {
    return obtainable.flat().reduce<any[]>((acc, element) => {
      // 处理字符串元素
      if (typeof element === 'string') {
        acc.push({
          id: element,
          to: `/map/view?key=${element}`,
        })
      }

      // 处理对象元素（包含 id 属性）
      else if (obtainable && obtainable._typeStringName == 'item') {
        const item = items[element.id];

        if (item) {
          acc.push({
            id: element.id,
            to: `/item/${element.id}`,
          })
        }
      } else if (obtainable && obtainable._typeStringName == 'cosmetics') {
        const cosmetic = cosmetics[element.id];

        if (cosmetic) {
          acc.push({
            id: element.id,
            to: `/cosmetic/${element.id}`,
          })
        }
      }

      return acc;
    }, [])
  }

  return [];
};

const tip = (o) => {
  return asString([
    `snb.mapLocations.${o.id}.name`,
    `snb.locations.${o.id}`,
  ], {
    variable: i18nAdditionalAttr,
    backRawKey: true
  })
}
</script>

<template>
  <p class="text-no-wrap font-weight-bold mb-2 mt-2">{{ t('codex.item.obtainable') }}</p>
  <v-chip-group class="" :column="true">
    <v-chip v-for="(o,oIndex) in obtainable"
            class="mb-1 mr-1 py-2 "
            exact
            pill
            replace
            :key="oIndex"
            :to="o.to">
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
  //white-space: break-spaces;
  max-width: 150px;
}
</style>
