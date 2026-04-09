<script setup lang="ts">
import {nodeViewProps, NodeViewWrapper} from "@tiptap/vue-3";

import ItemSlotBase from "@/components/snbWidget/ItemSlotBase.vue";
import UltimateIconWidget from "@/components/snbWidget/ultimateIconWidget.vue";
import UltimateName from "@/components/snbWidget/ultimateName.vue";

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
                  class="ultimate-icon">
      <UltimateIconWidget :id="node.attrs.id" :padding="0" class="ma-0"></UltimateIconWidget>
    </ItemSlotBase>
    <u class="u ship-name text-no-wrap">
      <UltimateName :id="node.attrs.id"></UltimateName>
    </u>
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

  .ultimate-icon {
    position: relative;
    top: 7px;
  }

  > .ultimate-name {
    position: relative;
    top: auto;
    left: auto;
    width: auto;
    height: auto;
    z-index: 1;
  }
}
</style>
