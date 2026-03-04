<script lang="ts" setup>
import {onMounted, Ref, ref} from "vue";
import {VersionData} from "@/assets/types/Blog";

import MarkdownIt from 'markdown-it';

import EmptyView from "@/components/EmptyView.vue";
import Loading from "@/components/Loading.vue";
import {useBlogApi} from "@/assets/sripts/api/blog_service";

const md = new MarkdownIt({
      html: true,
      linkify: true,
      typographer: true
    }),
    api = useBlogApi()

let loading = ref(true),
    showVersionIndex = ref(0),
    versionData: Ref<VersionData> = ref({})

onMounted(() => {
  getVersionData()
})

/**
 * 取得版本更新信息
 */
const getVersionData = async () => {
  try {
    loading.value = true
    const result = await api.versions(),
        d = result.data

    if (d) {
      versionData.value = d;
      showVersionIndex.value = d?.latestPosts?.length - 1 || 0;
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="app-version read-view">
    <template v-if="versionData.latestPosts">
      <b class="text-amber">{{ versionData.latestPosts[showVersionIndex].slug || '' }}</b>
    </template>

    <div class="position-relative">
      <template v-if="versionData.latestPosts">
        <div class="content" v-html="md.render(versionData.latestPosts[showVersionIndex].content || '')"></div>
      </template>
      <EmptyView v-else></EmptyView>
      <v-overlay v-model="loading" class="d-flex justify-center align-center" contained>
        <Loading size="80px"></Loading>
      </v-overlay>
    </div>
  </div>
</template>

<style lang="less">
@import "../assets/styles/read-view";
</style>
