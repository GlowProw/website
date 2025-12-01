<script setup lang="ts">
import {computed, onMounted, Ref, ref} from "vue";
import {useBlogApi} from "@/assets/sripts/api/blog_service";

import MarkdownIt from 'markdown-it';

import EmptyView from "@/components/EmptyView.vue";
import Loading from "@/components/Loading.vue";
import {BlogData} from "@/assets/types/Blog";

const md = new MarkdownIt({
      html: true,
      linkify: true,
      typographer: true
    }),
    api = useBlogApi()

let loading: Ref<boolean> = ref(true),
    showBlogIndex: Ref<number> = ref(0),
    blogData: Ref<BlogData> = ref({})

onMounted(() => {
  md.renderer.rules.image = function (tokens, idx, options, env, self) {
    const token = tokens[idx];
    return `<div class="img"><img src="${api.blogBaseUrl}/images/blog/${blogData.value.latestPosts[showBlogIndex.value].slug}/${token.content}" alt="${token.content}" /></div>`;
  };

  getBlogData()
})

let isNext = computed(() => {
      return (showBlogIndex.value + 1) >= Number(blogData.value.totalCount)
    }),
    isPrev = computed(() => {
      return (showBlogIndex.value + 1) <= 1
    })

/**
 * 取得博客信息内容
 */
const getBlogData = async () => {
  try {
    loading.value = true
    const result = await api.blogs(),
        d = result.data

    if (d) {
      blogData.value = d;
      showBlogIndex.value = d?.latestPosts.length - 1;
    }
  } finally {
    loading.value = false
  }
}

/**
 * 处理翻页
 * @param type
 */
const onPage = (type) => {
  switch (type) {
    case 'prev':
      if (showBlogIndex.value <= 0)
        return;
      showBlogIndex.value -= 1
      break;
    case 'next':
      if (showBlogIndex.value > blogData.value.totalCount)
        return;
      showBlogIndex.value += 1
      break;
  }
}
</script>

<template>
  <div class="blog read-view">
    <v-row class="mb-1" align="center">
      <v-col>
        <v-icon>mdi-post-outline</v-icon>: <span class="opacity-60">{{ blogData.totalCount }}</span>
      </v-col>
      <v-spacer></v-spacer>
      <v-col cols="auto">
        <v-btn-group border class="page-btn">
          <v-btn density="compact" @click="onPage('prev')" :disabled="isPrev">
            <v-icon icon="mdi-arrow-left"></v-icon>
          </v-btn>
          <v-btn density="compact" @click="onPage('next')" :disabled="isNext">
            <v-icon icon="mdi-arrow-right"></v-icon>
          </v-btn>
        </v-btn-group>
      </v-col>
    </v-row>
    <div class="position-relative">
      <template v-if="blogData.latestPosts">
        <div class="text-h5 font-weight-bold text-amber mb-2" v-html="blogData.latestPosts[showBlogIndex].title || ''"></div>
        <p class="opacity-80 mb-1">{{ blogData.latestPosts[showBlogIndex].authors.join(',') }}</p>
        <div class="content" v-html="md.render(blogData.latestPosts[showBlogIndex].content || '')"></div>
      </template>
      <EmptyView v-else></EmptyView>
      <v-overlay v-model="loading" class="d-flex justify-center align-center" contained>
        <Loading size="80px"></Loading>
      </v-overlay>
    </div>
  </div>
</template>

<style scoped lang="less">
.page-btn {
  height: 30px !important;
}
</style>

<style lang="less">
@import "../assets/styles/read-view";
</style>
