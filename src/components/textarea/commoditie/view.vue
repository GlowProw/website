<script setup lang="ts">
import {nodeViewProps, NodeViewWrapper} from "@tiptap/vue-3";

import ItemSlotBase from "@/components/snbWidget/ItemSlotBase.vue";
import CommoditieIconWidget from "@/components/snbWidget/commoditieIconWidget.vue";
import CommoditieNameRarity from "@/components/snbWidget/commoditieNameRarity.vue";
import CommoditieName from "@/components/snbWidget/commoditieName.vue";

const props = defineProps(nodeViewProps)
</script>

<template>
  <node-view-wrapper :as="'span'" class="ultimate-span-box">
    <ItemSlotBase size="30px"
                  :is-auto-size="false"
                  :is-auto-margin="false"
                  :is-auto-padding="false"
                  :padding="0"
                  :margin="0"
                  class="item-icon">
      <CommoditieIconWidget :id="node.attrs.id" :padding="0" :margin="0" class="ma-0"></CommoditieIconWidget>
    </ItemSlotBase>
    <CommoditieNameRarity :id="node.attrs.id" class="item-name text-no-wrap">
      <u class="u">
        <CommoditieName :id="node.attrs.id"></CommoditieName>
      </u>
    </CommoditieNameRarity>
  </node-view-wrapper>
</template>

<style scoped lang="less">
@import "@/assets/styles/link";

.ultimate-span-box {
  position: relative;
  display: inline-flex;
  width: auto;
  height: inherit;
  align-items: baseline;
  gap: 2px;

  .item-icon {
    position: relative;
    top: 7px;
  }

  > .item-name {
    position: relative;
    top: auto;
    left: auto;
    width: auto;
    height: auto;
    z-index: 1;
  }
}
</style>
