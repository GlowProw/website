<script setup lang="ts">
import {computed, onMounted, Ref, ref} from "vue";
import {useBlogApi} from "@/assets/sripts/api/blog_service";

import MarkdownIt from 'markdown-it';

import EmptyView from "@/components/EmptyView.vue";
import Loading from "@/components/Loading.vue";
import {BlogData} from "@/assets/types/Blog";
import HtmlLink from "@/components/HtmlLink.vue";

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
    const token = tokens[idx],
        src = token.attrs.find(i => i[0] == 'src')[1];
    token.attrJoin('class', 'border');
    return `<div class="img"><img src="${convertPath(src, api.blogBaseUrl)}" alt="${token.content}" /></div>`;
  };

  md.renderer.rules.link_open = function (tokens, idx) {
    const token = tokens[idx],
        href = token.attrs.find(attr => attr[0] === 'href')[1];
    return `<span class="html-link cursor-pointer"><i class="mdi mdi-link icon"></i><a href="${href}" target="_blank" class="u">`;
  };
  md.renderer.rules.link_close = function () {
    return '</a></span>';
  };

  md.renderer.rules.heading_open = (tokens, idx, options, env, self) => {
    const token = tokens[idx];
    if (token.tag === 'h1' || token.tag === 'h2' || token.tag === 'h3' || token.tag === 'h4') {
      token.attrJoin('class', 'u');
    }
    return self.renderToken(tokens, idx, options);
  };

  getBlogData()
})

let isNext = computed(() => {
      return (showBlogIndex.value + 1) >= (blogData.value.latestPosts?.length || 0)
    }),
    isPrev = computed(() => {
      return (showBlogIndex.value + 1) <= 1
    })

/**
 * 转化地址
 * @param path
 * @param apiBlogBaseUrl
 */
function convertPath(path, apiBlogBaseUrl) {
  return path
      .replace(
          /(?:\.\.\/)*static\/images\/blog\/([^/]+)\/([^/]+\.png)/g,
          `${apiBlogBaseUrl}/images/blog/$1/$2`
      )
      .replace(
          /pathname:\/\/\/images\/blog\/([^/]+)\/([^/]+\.png)/g,
          `${apiBlogBaseUrl}/images/blog/$1/$2`
      );
}

/**
 * 取得博客信息内容
 */
const getBlogData = async () => {
  try {
    loading.value = true
    const result = await api.blogs({isUpdateTime: false}),
        d = result.data

    if (d) {
      blogData.value = d;
      showBlogIndex.value = 4;
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
      if (showBlogIndex.value >= (blogData.value.latestPosts?.length || 0) - 1)
        return;
      showBlogIndex.value += 1
      break;
  }
}
</script>

<template>
  <div class="blog read-view">
    <div class="position-relative">
      <template v-if="blogData.latestPosts">
        <v-row align="center" class="mb-2">
          <v-col cols="auto">
            <a :href="`${api.blogBaseUrl}/blog/${blogData.latestPosts[showBlogIndex].slug}`" target="_blank">
              <div class="text-h5 font-weight-bold card-flavor bg-amber" v-html="blogData.latestPosts[showBlogIndex].title || ''"></div>
            </a>
          </v-col>
          <v-col>
            <v-divider thickness="2" opacity=".2"></v-divider>
          </v-col>
          <v-col cols="auto">
            <p class="u opacity-80 mb-1">{{ (blogData.latestPosts[showBlogIndex] as any).authors.join(',') }}</p>
          </v-col>
          <v-divider vertical inset class="mx-2"></v-divider>
          <v-col cols="auto" class="d-flex align-center ga-1 opacity-60">
            <v-icon>mdi-post-outline</v-icon>
            <span>{{ blogData.totalCount }}</span>
          </v-col>
          <v-col cols="auto">
            <v-btn-group border class="page-btn">
              <v-btn density="compact" @click="onPage('prev')" :disabled="isPrev">
                <v-icon icon="mdi-arrow-left"></v-icon>
                <v-card variant="text" max-width="60" class="singe-line" v-if="blogData.latestPosts[showBlogIndex - 1]?.title">{{ blogData.latestPosts[showBlogIndex - 1].title }}</v-card>
              </v-btn>
              <v-btn density="compact" @click="onPage('next')" :disabled="isNext">
                <v-icon icon="mdi-arrow-right"></v-icon>
                <v-card variant="text" max-width="60" class="singe-line" v-if="blogData.latestPosts[showBlogIndex + 1]?.title">{{ blogData.latestPosts[showBlogIndex + 1].title }}</v-card>
              </v-btn>
            </v-btn-group>
          </v-col>
        </v-row>

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
@import "@/assets/styles/read-view";
@import "@/assets/styles/link";

.page-btn {
  height: 30px !important;
}
</style>

