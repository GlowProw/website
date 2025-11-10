<script setup lang="ts">

import ItemName from "@/components/snbWidget/itemName.vue";
import {computed} from "vue";
import {Cosmetic, Cosmetics, Item, Items, Material} from "glow-prow-data";
import {useI18n} from "vue-i18n";
import EmptyView from "@/components/EmptyView.vue";

const props = withDefaults(
        defineProps<{ data: Item | Material | Cosmetic, byType: string }>(),
        {
          byType: ''
        }
    ),
    {t, tm} = useI18n(),
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
const filterByObtainable = (d: Item | Material | Cosmetic | null | undefined): ObtainableLink[] => {
  // 返回检查
  if (!d?.id) return [];

  const {obtainable} = d;

  // 处理字符串类型的 obtainable
  if (typeof obtainable === 'string') {
    return [{
      id: obtainable,
      to: `/codex/${props.byType}/obtainable/${obtainable}`
    }];
  }

  // 处理对象类型的 obtainable（包含 id 属性）
  if (obtainable && typeof obtainable === 'object' && 'id' in obtainable) {
    return [{
      id: obtainable.id,
      to: `/codex/${props.byType}/${obtainable.id}`,
      item: items[obtainable.id]
    }];
  }

  // 处理数组类型的 obtainable
  if (Array.isArray(obtainable)) {
    return obtainable.flat().reduce<ObtainableLink[]>((acc, element) => {
      // 处理字符串元素
      if (typeof element === 'string') {
        acc.push({
          id: element,
          // to: `/codex/${props.byType}/obtainable/${element}`
        });
      }
      // 处理对象元素（包含 id 属性）
      else if (element && typeof element === 'object' && 'id' in element) {
        const item = items[element.id] || cosmetics[element.id];

        if (item) {
          const itemType = items[element.id] ? 'item' : 'cosmetics';
          acc.push({
            id: element.id,
            to: `/codex/${itemType}/${element.id}`,
            item
          });
        }
      }

      return acc;
    }, []);
  }

  return [];
};

</script>

<template>
  <p class="text-no-wrap font-weight-bold mb-2 mt-2">{{ t('codex.item.obtainable') }}</p>
  <v-chip v-for="(o,oIndex) in obtainable"
          class="d-inline-flex mb-1 mr-1 py-2 obtainable-item"
          exact
          :key="oIndex"
          :to="o.to">
    <template v-if="o.item">
      <ItemName :id="o.item.id"></ItemName>
    </template>
    <template v-else>
      {{
        t(`snb.locations.${o.id}`, {...i18nAdditionalAttr})
      }}
    </template>
  </v-chip>
  <EmptyView v-if="obtainable.length <= 0"></EmptyView>
</template>

<style scoped lang="less">
.obtainable-item {
  white-space: break-spaces;
}
</style>
