<script>
import {nodeViewProps, NodeViewWrapper} from "@tiptap/vue-3";
import ItemIconWidget from "../../snbWidget/itemIconWidget.vue";
import ItemSlotBase from "../../snbWidget/ItemSlotBase.vue";

export default {
  props: nodeViewProps,
  components: {
    ItemSlotBase,
    ItemIconWidget,
    NodeViewWrapper
  },
}
</script>

<template>
  <node-view-wrapper ref="emoteRoot" :as="'span'" class="item-icon">
    <ItemIconWidget :id="node.attrs.id" :padding="0" class="ma-0"></ItemIconWidget>
  </node-view-wrapper>
</template>

<style scoped lang="less">
.item-icon {
  position: relative;
  display: inline-flex;
  width: 25px;
  height: 25px;

  > * {
    position: absolute;
    top: 6px;
    left: 0;
    width: 25px;
    height: 25px;
  }
}
</style>
