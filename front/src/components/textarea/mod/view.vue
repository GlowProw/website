<script setup lang="ts">
import {nodeViewProps, NodeViewWrapper} from "@tiptap/vue-3";
import {useI18n} from "vue-i18n";
import {useI18nUtils} from "@/assets/sripts/i18nUtil";

import ItemSlotBase from "@/components/snbWidget/ItemSlotBase.vue";
import ModIconWidget from "@/components/snbWidget/modIconWidget.vue";

const props = defineProps(nodeViewProps);
const {t} = useI18n(),
    {asString, sanitizeString} = useI18nUtils()
</script>

<template>
  <node-view-wrapper :as="'span'" class="mod-span-box">
    <ItemSlotBase size="25px" :padding="0" class="mod-icon">
      <ModIconWidget :id="node.attrs.id"></ModIconWidget>
    </ItemSlotBase>
    <u class="ship-name text-no-wrap">{{ t(`snb.modifications.${node.attrs.id}.name`) }}</u>
  </node-view-wrapper>
</template>

<style scoped lang="less">
.mod-span-box {
  position: relative;
  display: inline-flex;
  width: auto;
  height: 25px;
  align-items: baseline;
  gap: 1px;

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
