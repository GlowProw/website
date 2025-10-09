<script setup lang="ts">
import {nodeViewProps, NodeViewWrapper} from "@tiptap/vue-3";
import {useI18n} from "vue-i18n";
import {useI18nUtils} from "@/assets/sripts/i18n_util";

const props = defineProps(nodeViewProps);
const
    {t} = useI18n(),
    {asString, sanitizeString} = useI18nUtils()
</script>

<template>
  <node-view-wrapper>
    <v-card border class="my-3 bg-black">
      <iframe :src="props.node.attrs.src" class="border-0 w-100 h-100"
              style="min-height: 400px"></iframe>
    </v-card>
  </node-view-wrapper>
</template>

<style scoped lang="less">

</style>
