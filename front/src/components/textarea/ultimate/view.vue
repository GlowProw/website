<script setup lang="ts">
import {nodeViewProps, NodeViewWrapper} from "@tiptap/vue-3";
import {useI18n} from "vue-i18n";
import {useI18nUtils} from "@/assets/sripts/i18n_util";

import ItemSlotBase from "@/components/snbWidget/ItemSlotBase.vue";
import UltimateIconWidget from "@/components/snbWidget/ultimateIconWidget.vue";
import UltimateName from "@/components/snbWidget/ultimateName.vue";

const props = defineProps(nodeViewProps);
const {t} = useI18n(),
    {asString, sanitizeString} = useI18nUtils()
</script>

<template>
  <node-view-wrapper :as="'span'" class="ultimate-span-box">
    <ItemSlotBase size="25px" :padding="0" class="ultimate-icon">
      <UltimateIconWidget :id="node.attrs.id" :padding="0" class="ma-0"></UltimateIconWidget>
    </ItemSlotBase>
    <u class="ship-name text-no-wrap">
      <UltimateName :id="node.attrs.id"></UltimateName>
    </u>
  </node-view-wrapper>
</template>

<style scoped lang="less">
.ultimate-span-box {
  position: relative;
  display: inline-flex;
  width: auto;
  height: 25px;
  align-items: baseline;
  gap: 1px;

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
