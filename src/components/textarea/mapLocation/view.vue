<script setup lang="ts">
import {nodeViewProps, NodeViewWrapper} from "@tiptap/vue-3";

import ItemSlotBase from "@/components/snbWidget/ItemSlotBase.vue";
import MapLocationIconWidget from "@/components/snbWidget/mapLocationIconWidget.vue";
import MapLocationName from "@/components/snbWidget/mapLocationName.vue";

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
      <MapLocationIconWidget :id="node.attrs.id" :padding="0" :margin="0" class="ma-0"></MapLocationIconWidget>
    </ItemSlotBase>
    <div class="item-name text-no-wrap">
      <u class="u text-amber">
        <MapLocationName :id="node.attrs.id"></MapLocationName>
      </u>
    </div>
  </node-view-wrapper>
</template>

<style scoped lang="less">
@import "@/assets/styles/link";

.ultimate-span-box {
  position: relative;
  display: inline-flex;
  align-items: center;
  vertical-align: middle;
  gap: 4px;
  line-height: 1;

  .item-icon {
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  > .item-name {
    display: inline-flex;
    align-items: center;
    line-height: inherit;
    z-index: 1;
  }
}
</style>
