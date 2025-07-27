<script>
import {nodeViewProps, NodeViewWrapper} from "@tiptap/vue-3";
import ShipIconWidget from "../../snbWidget/shipIconWidget.vue";
import ItemSlotBase from "../../snbWidget/ItemSlotBase.vue";

export default {
  props: nodeViewProps,
  components: {
    ItemSlotBase,
    ShipWidget: ShipIconWidget,
    NodeViewWrapper
  },
}
</script>

<template>
  <node-view-wrapper ref="shipRoot" :as="'span'" class="ship-icon">
    <ShipWidget :id="node.attrs.id" :padding="0"></ShipWidget>
  </node-view-wrapper>
</template>

<style scoped lang="less">
.ship-icon {
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
