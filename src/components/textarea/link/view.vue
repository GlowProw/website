<script setup lang="ts">
import {nodeViewProps, NodeViewWrapper} from "@tiptap/vue-3";
import {useI18n} from "vue-i18n";
import HtmlLink from "@/components/HtmlLink.vue";

const props = defineProps(nodeViewProps)
const {t} = useI18n()
</script>

<template>
  <NodeViewWrapper ref="linkRoot" as="span">
    <HtmlLink
        :is-open="false"
        :text="props.node.attrs.text"
        :href="props.node.attrs.href"></HtmlLink>
  </NodeViewWrapper>
</template>

<style scoped lang="less">
</style>
