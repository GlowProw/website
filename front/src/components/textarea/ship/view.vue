<script setup lang="ts">
import {nodeViewProps, NodeViewWrapper} from "@tiptap/vue-3";
import ShipIconWidget from "../../snbWidget/shipIconWidget.vue";
import {useI18n} from "vue-i18n";
import ItemSlotBase from "../../snbWidget/ItemSlotBase.vue";
import ItemNameRarity from "../../snbWidget/itemNameRarity.vue";

const props = defineProps(nodeViewProps);
const {t} = useI18n();
</script>

<template>
  <NodeViewWrapper ref="shipRoot" as="span" class="ship-span-box">
    <ItemSlotBase size="25px" :padding="0" class="ship-icon">
      <ShipIconWidget :id="props.node.attrs.id" :padding="0" />
    </ItemSlotBase>
    <ItemNameRarity :id="props.node.attrs.id">
      <u class="ship-name text-no-wrap">{{ t(`snb.ships.${props.node.attrs.id}.name`) }}</u>
    </ItemNameRarity>
  </NodeViewWrapper>
</template>

<style scoped lang="less">
.ship-span-box {
  position: relative;
  display: inline-flex;
  width: auto;
  height: 25px;
  align-items: baseline;
  gap: 1px;

  .ship-icon {
    position: relative;
    top: 6px;
  }

  > .ship-name {
    position: relative;
    top: auto;
    left: auto;
    width: auto;
    height: auto;
    z-index: 1;
  }
}
</style>
