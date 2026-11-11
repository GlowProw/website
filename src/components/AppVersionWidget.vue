<script lang="ts" setup>
import {onMounted, onUnmounted, Ref, ref} from "vue";
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

// 根元素引用与滚动监听
const rootRef = ref<HTMLElement | null>(null);
let observer: IntersectionObserver | null = null;
let hasRequested = false;

onMounted(() => {
  md.renderer.rules.image = function (tokens, idx, options, env, self) {
    let token = tokens[idx],
        src = token.attrs.find(i => i[0] == 'src')[1];
    return `<div class="img img-wrap"><img src="${convertPath(src, api.blogBaseUrl)}" alt="${token.content}" /></div>`;
  };

  // 滚动进可视范围才发起请求
  if (rootRef.value && typeof IntersectionObserver !== 'undefined') {
    observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting && !hasRequested) {
          hasRequested = true;
          getVersionData();
          observer?.disconnect();
          observer = null;
          break;
        }
      }
    }, {
      rootMargin: '100px',
      threshold: 0,
    });
    observer.observe(rootRef.value);
  } else {
    getVersionData();
  }
})

onUnmounted(() => {
  if (observer) {
    observer.disconnect();
    observer = null;
  }
})

/**
 * 转化地址（支持 gif / png / jpg / webp 等所有格式及 pathname / 相对路径等各种写法）
 * @param path
 * @param apiBlogBaseUrl
 */
function convertPath(path: string, apiBlogBaseUrl: string) {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;

  // 去除 Docusaurus 内部特定的 pathname:/// 前缀
  let cleanPath = path.replace(/^pathname:\/\/\/?/, '');

  // 去除相对路径开头的 ../ 或 ./ 以及 static/ 目录层级
  cleanPath = cleanPath.replace(/^(?:\.\.\/|\.\/)*(?:static\/)?/, '');

  // 补齐斜杠前缀保证拼接路径正确
  if (!cleanPath.startsWith('/')) {
    cleanPath = '/' + cleanPath;
  }

  return `${apiBlogBaseUrl}${cleanPath}`;
}

/**
 * 取得版本更新信息
 */
const getVersionData = async () => {
  try {
    loading.value = true
    const result = await api.versions({isUpdateTime: false}),
        d = result.data

    if (d && d.latestPosts) {
      versionData.value = d;
      showVersionIndex.value = d.latestPosts.length ? d.latestPosts.length - 1 : 0;
    }
  } catch (e) {
    console.error('getVersionData error:', e);
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div ref="rootRef" class="app-version read-view">
    <template v-if="versionData.latestPosts">
      <v-row align="center">
        <v-col cols="auto">
          <a :href="`${api.blogBaseUrl}/versions/${versionData.latestPosts[showVersionIndex].slug}`" target="_blank">
            <b class="text-amber">{{ versionData.latestPosts[showVersionIndex].title || '' }}</b>
          </a>
        </v-col>
        <v-col>
          <v-divider thickness="2" opacity=".2"></v-divider>
        </v-col>
      </v-row>
    </template>

    <div class="position-relative">
      <template v-if="versionData.latestPosts">
        <div class="content" v-html="md.render(versionData.latestPosts[showVersionIndex].content || '')"></div>
      </template>
      <EmptyView v-else></EmptyView>
      <v-overlay v-model="loading" class="d-flex justify-center align-center" contained :z-index="10">
        <Loading size="80px"></Loading>
      </v-overlay>
    </div>
  </div>
</template>

<style lang="less">
@import "../assets/styles/read-view";
</style>
