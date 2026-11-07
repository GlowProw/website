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
  align-items: center;
  vertical-align: middle;
  gap: 1px;
  line-height: 1;

  .item-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
}
</style>
