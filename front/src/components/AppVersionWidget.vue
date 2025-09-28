<script lang="ts" setup>
import {onMounted, ref} from "vue";
import {http} from "@/assets/sripts/index";
import EmptyView from "@/components/EmptyView.vue";
import MarkdownIt from 'markdown-it';
import Loading from "@/components/Loading.vue";

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true
});

let loading = ref(true),
    showVersionIndex = ref(0),
    versionData = ref({})

onMounted(() => {
  getVersionData()
})

const getVersionData = async () => {
  try {
    loading.value = true
    const result = await http.request('https://glow-prow-blog.cabbagelol.net/versions-data.json')

    if (result.itemData) {
      versionData.value = result.itemData;
      console.log(result.itemData)
      showVersionIndex.value = result.itemData?.latestPosts?.length - 1 || 0;
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="app-version read-view">
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
