<script setup lang="ts">
import {nodeViewProps, NodeViewWrapper} from "@tiptap/vue-3";
import {useI18n} from "vue-i18n";
import {useI18nUtils} from "@/assets/sripts/i18n_util";

import ItemSlotBase from "@/components/snbWidget/ItemSlotBase.vue";
import ItemIconWidget from "@/components/snbWidget/itemIconWidget.vue";
import ItemNameRarity from "@/components/snbWidget/itemNameRarity.vue"
import ItemName from "@/components/snbWidget/itemName.vue";
import {Items} from "glow-prow-data";

const props = defineProps(nodeViewProps);
const
    {t} = useI18n(),
    {asString, sanitizeString} = useI18nUtils()
</script>

<template>
  <node-view-wrapper>
    <v-card border class="my-3 bg-black">
      <v-img :src="props.node.attrs.src" max-height="400"></v-img>
    </v-card>
  </node-view-wrapper>
</template>

<style scoped lang="less">

</style>
