<script setup lang="ts">
import {computed} from "vue";
import {nodeViewProps, NodeViewWrapper} from "@tiptap/vue-3";
import {normalizeVideoUrl} from "./index";

const props = defineProps(nodeViewProps)

const embedSrc = computed(() => {
    const result = normalizeVideoUrl(props.node.attrs.src || '')
    return result.ok ? result.url : ''
})
</script>

<template>
  <node-view-wrapper class="video-view-wrapper">
    <v-card v-if="embedSrc" border class="my-1 bg-black video-card">
      <!-- sandbox 不授予 allow-top-navigation，防止嵌入页劫持顶层跳转 -->
      <iframe :src="embedSrc" class="border-0 w-100 h-100"
              allow="fullscreen; picture-in-picture"
              allowfullscreen
              sandbox="allow-scripts allow-same-origin allow-popups allow-presentation allow-forms allow-fullscreen"
              referrerpolicy="no-referrer-when-downgrade"
              style="min-height: 400px"></iframe>
    </v-card>

    <div v-else class="video-invalid my-1">
      <v-card variant="tonal" class="w-100 pa-4 d-flex align-center ga-3 border-dashed" color="error">
        <v-icon icon="mdi-video-off-outline" size="24" color="error"></v-icon>
        <div class="text-truncate">
          <div class="text-caption text-grey">Unsupported video link</div>
          <a :href="props.node.attrs.src" class="text-body-2 font-weight-bold text-error"
             target="_blank" rel="noopener noreferrer">{{ props.node.attrs.src }}</a>
        </div>
      </v-card>
    </div>

    <div class="video-placeholder d-none">
      <v-card variant="tonal" class="w-100 pa-4 d-flex align-center ga-3 border-dashed">
        <v-icon icon="mdi-video-outline" size="24" color="amber"></v-icon>
        <div class="text-truncate">
          <div class="text-caption text-grey">Video Link</div>
          <div class="text-body-2 font-weight-bold">{{ props.node.attrs.src }}</div>
        </div>
      </v-card>
    </div>
    <div class="video-textized d-none">
      <v-icon icon="mdi-video-outline" size="16" color="amber" class="mr-1"></v-icon>
      <a :href="props.node.attrs.src" class="text-caption text-amber opacity-80" target="_blank" rel="noopener noreferrer">{{ props.node.attrs.src }}</a>
    </div>
  </node-view-wrapper>
</template>

<style lang="less">
.is-capturing {
  .video-card {
    display: none !important;
  }
  .video-placeholder {
    display: flex !important;
  }
}

.is-textized {
  .video-card {
    display: none !important;
  }
  .video-placeholder {
    display: none !important;
  }
  .video-textized {
    display: inline-flex !important;
    align-items: center;
  }
}
</style>

<style scoped lang="less">

</style>
