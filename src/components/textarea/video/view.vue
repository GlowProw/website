<script setup lang="ts">
import {nodeViewProps, NodeViewWrapper} from "@tiptap/vue-3";
import {useI18n} from "vue-i18n";
import {useI18nUtils} from "@/assets/sripts/i18n_util";

const props = defineProps(nodeViewProps)
</script>

<template>
  <node-view-wrapper class="video-view-wrapper">
    <v-card border class="my-1 bg-black video-card">
      <iframe :src="props.node.attrs.src" class="border-0 w-100 h-100"
              allow="fullscreen"
              style="min-height: 400px"></iframe>
    </v-card>
    <div class="video-placeholder d-none">
      <v-card variant="tonal" class="w-100 pa-4 d-flex align-center ga-3 border-dashed">
        <v-icon icon="mdi-video-outline" size="24" color="amber"></v-icon>
        <div class="text-truncate">
          <div class="text-caption text-grey">Video Link</div>
          <div class="text-body-2 font-weight-bold">{{ props.node.attrs.src }}</div>
        </div>
      </v-card>
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
</style>

<style scoped lang="less">

</style>
