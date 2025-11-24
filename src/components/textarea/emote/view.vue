<script>
import {nodeViewProps, NodeViewWrapper} from "@tiptap/vue-3";
import EmoteItem from "@/components/EmoteItem.vue";

export default {
  props: {
    ...nodeViewProps
  },
  components: {
    EmoteItem,
    NodeViewWrapper
  },
}
</script>

<template>
  <node-view-wrapper :as="'span'" class="emote-span-box">
    <EmoteItem class="item-icon" :id="node.attrs.id"></EmoteItem>
  </node-view-wrapper>
</template>

<style scoped lang="less">
.emote-span-box {
  position: relative;
  display: inline-flex;
  width: auto;
  height: 25px;
  align-items: baseline;
  gap: 1px;

  .item-icon {
    position: relative;
  }
}
</style>
