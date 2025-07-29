<script setup lang="ts">
import {nodeViewProps, NodeViewWrapper} from "@tiptap/vue-3";
import {useI18n} from "vue-i18n";
import {useI18nUtils} from "../../../assets/sripts/i18nUtil";

import ItemSlotBase from "../../snbWidget/ItemSlotBase.vue";
import ItemIconWidget from "../../snbWidget/itemIconWidget.vue";

const props = defineProps(nodeViewProps);
const {t} = useI18n(),
    {asString, sanitizeString} = useI18nUtils()
</script>

<template>
  <node-view-wrapper :as="'span'" class="item-span-box">
    <ItemSlotBase size="25px" :padding="0" class="item-icon">
      <ItemIconWidget :id="node.attrs.id" :padding="0" class="ma-0"></ItemIconWidget>
    </ItemSlotBase>
    <u class="item-name text-no-wrap">{{
        asString([
          `snb.items.${node.attrs.id}.name`,
          `snb.items.${sanitizeString(node.attrs.id).cleaned}.name`
        ])
      }}</u>
  </node-view-wrapper>
</template>

<style scoped lang="less">
.item-span-box {
  position: relative;
  display: inline-flex;
  width: auto;
  height: 25px;
  align-items: baseline;
  gap: 1px;

  .item-icon {
    position: relative;
    top: 5px;
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
