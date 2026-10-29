<script setup lang="ts">
import {computed} from "vue";
import {Commodities, Items, Materials} from "glow-prow-data";

import ItemSlotBase from "@/components/snbWidget/ItemSlotBase.vue";
import ItemIconWidget from "@/components/snbWidget/itemIconWidget.vue";
import ItemName from "@/components/snbWidget/itemName.vue";
import MaterialIconWidget from "@/components/snbWidget/materialIconWidget.vue";
import MaterialName from "@/components/snbWidget/materialName.vue";
import CommoditieIconWidget from "@/components/snbWidget/commoditieIconWidget.vue";
import CommoditieName from "@/components/snbWidget/commoditieName.vue";

/**
 * 掉落 / 召唤物的图标卡片行
 * 排列方式与 ShipUpgradeUseWidget 一致：居中的一排 80px 图标，名称在图标下方居中
 */
const props = withDefaults(defineProps<{
  // {物品 id: 数量}
  entries: Record<string, number> | undefined,
  // 数量为 1 时也显示（召唤消耗必须知道个数）
  isAlwaysShowQuantity?: boolean
}>(), {
  entries: undefined,
  isAlwaysShowQuantity: false
})

/**
 * 掉落物可能来自物品、材料或商品，按数据归属决定图标与名称组件
 * @param itemId 物品 id
 */
const resolveKind = (itemId: string) => {
  if ((Items as any)[itemId]) return 'item';
  if ((Materials as any)[itemId]) return 'material';
  if ((Commodities as any)[itemId]) return 'commodity';
  return '';
};

const list = computed(() =>
    Object.entries(props.entries || {}).map(([id, quantity]) => ({
      id,
      quantity,
      kind: resolveKind(id),
      isShowQuantity: props.isAlwaysShowQuantity || quantity > 1
    }))
);

/**
 * 数据包里还没有的条目，把 camelCase 拆成可读单词兜底展示
 * @param id 物品 id
 */
const humanizeId = (id: string) =>
    id.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/^./, char => char.toUpperCase());

defineOptions({
  name: 'LootEntriesWidget'
})
</script>

<template>
  <v-row class="ga-6 mt-2 mb-2" justify="center">
    <v-card v-for="entry in list" :key="entry.id" class="bg-transparent" width="80">
      <ItemSlotBase size="80px">
        <ItemIconWidget v-if="entry.kind === 'item'" :id="entry.id"></ItemIconWidget>
        <MaterialIconWidget v-else-if="entry.kind === 'material'" :id="entry.id"></MaterialIconWidget>
        <CommoditieIconWidget v-else-if="entry.kind === 'commodity'" :id="entry.id"></CommoditieIconWidget>
        <div v-else class="d-flex justify-center align-center h-100">
          <v-icon icon="mdi-help" class="opacity-30"></v-icon>
        </div>
      </ItemSlotBase>
      <div class="mt-1 text-center">
        <ItemName v-if="entry.kind === 'item'" :id="entry.id"></ItemName>
        <MaterialName v-else-if="entry.kind === 'material'" :id="entry.id"></MaterialName>
        <CommoditieName v-else-if="entry.kind === 'commodity'" :id="entry.id"></CommoditieName>
        <span v-else>{{ humanizeId(entry.id) }}</span>
        <div class="text-caption opacity-70" v-if="entry.isShowQuantity">x{{ entry.quantity }}</div>
      </div>
    </v-card>
  </v-row>
</template>

<style scoped lang="less">

</style>
