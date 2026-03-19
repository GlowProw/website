<script setup lang="ts">
import { Item } from "glow-prow-data";
import ItemIconWidget from "@/components/snbWidget/itemIconWidget.vue";
import ItemSlotBase from "@/components/snbWidget/ItemSlotBase.vue";
import ItemName from "@/components/snbWidget/itemName.vue";
import {computed} from "vue";

const props = defineProps<{ data: Item }>();

const AMMUNITION_MAP = {
  culverin: ['cannonballs'],
  demicannon: ['cannonballs'],
  longGun: ['cannonballs'],
  mortar: ['mortarBombs'],
  rocket: ['rockets'],
  ballista: ['ballistaBolts'],
  seaFire: ['oilCanisters'],
  bombard: ['bombardBombs'],
  torpedo: ['torpedoes'],
} as const;

// 使用计算属性获取弹药类型，提高可读性和性能
const ammunitionType = computed(() => {
  const itemType = props.data?.type;
  return itemType && AMMUNITION_MAP[itemType as keyof typeof AMMUNITION_MAP]?.[0];
});

const showAmmunition = computed(() => !!ammunitionType.value);
</script>

<template>
  <div v-if="showAmmunition" class="d-flex align-center ga-2 single-line">
    <ItemSlotBase size="20px" :padding="0">
      <ItemIconWidget :id="ammunitionType" :margin="0" />
    </ItemSlotBase>
    <ItemName :id="ammunitionType" />
  </div>
</template>

<style scoped lang="less">
</style>
