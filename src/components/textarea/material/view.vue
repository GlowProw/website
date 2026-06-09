<script setup lang="ts">
import {nodeViewProps, NodeViewWrapper} from "@tiptap/vue-3";

import ItemSlotBase from "@/components/snbWidget/ItemSlotBase.vue";
import MaterialIconWidget from "@/components/snbWidget/materialIconWidget.vue";
import MaterialNameRarity from "@/components/snbWidget/materialNameRarity.vue"
import MaterialName from "@/components/snbWidget/materialName.vue";
import {Materials} from "glow-prow-data";

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
      <MaterialIconWidget :id="node.attrs.id" :padding="0" :margin="0" class="ma-0"></MaterialIconWidget>
    </ItemSlotBase>
    <MaterialNameRarity :id="node.attrs.id" class="item-name text-no-wrap">
      <u class="u">
        <MaterialName :id="node.attrs.id"></MaterialName>
      </u>
    </MaterialNameRarity>
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
