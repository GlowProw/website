<template>
  <node-view-wrapper class="lang-view-wrapper " :data-lang="node.attrs.lang">
    <span class="lang-badge text-caption opacity-20" contenteditable="false" v-if="editor.isEditable || props.forceShowAllLang">&lt;{{ langName }}&gt;</span>
    <node-view-content class="lang-content" />
    <span class="lang-badge text-caption opacity-20" contenteditable="false" v-if="editor.isEditable || props.forceShowAllLang">&lt;/{{ langName }}&gt;</span>
  </node-view-wrapper>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { NodeViewWrapper, NodeViewContent, nodeViewProps } from '@tiptap/vue-3'
import languagesConfig from '@/config/languages'

const props = defineProps(nodeViewProps)

const langName = computed(() => {
   const lang = languagesConfig.child.find((item: any) => item.value === props.node.attrs.lang)
   return lang ? lang.label : props.node.attrs.lang
})
</script>

<style scoped lang="less">
.lang-view-wrapper {
  position: relative;
}

.lang-badge {
  user-select: none;
}

.lang-content {
  min-height: 1.5em;
}
</style>
