<script setup lang="ts">
import {nodeViewProps, NodeViewWrapper} from "@tiptap/vue-3";
import {useI18n} from "vue-i18n";

import ItemSlotBase from "@/components/snbWidget/ItemSlotBase.vue";
import ModIconWidget from "@/components/snbWidget/modIconWidget.vue";
import ModName from "@/components/snbWidget/modName.vue";

const props = defineProps(nodeViewProps)
</script>

<template>
  <node-view-wrapper :as="'span'" class="mod-span-box">
    <ItemSlotBase size="30px"
                  :is-auto-size="false"
                  :is-auto-margin="false"
                  :is-auto-padding="false"
                  :padding="0"
                  :margin="0"
                  class="mod-icon">
      <ModIconWidget :id="node.attrs.id"></ModIconWidget>
    </ItemSlotBase>
    <u class="u ship-name text-no-wrap">
      <ModName :id="node.attrs.id" :grade="node.attrs.grade"></ModName>
    </u>
  </node-view-wrapper>
</template>

<style scoped lang="less">
@import "@/assets/styles/link";

.mod-span-box {
  position: relative;
  display: inline-flex;
  width: auto;
  height: inherit;
  align-items: baseline;
  gap: 2px;

  .mod-icon {
    position: relative;
    top: 7px;
  }

  > .mod-name {
    position: relative;
    top: auto;
    left: auto;
    width: auto;
    height: auto;
    z-index: 1;
  }
}
</style>
