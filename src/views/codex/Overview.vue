<script setup lang="ts">
import {computed, onMounted, ref} from "vue";
import {useI18n} from "vue-i18n";
import {useAssetsStore} from "~/stores/assetsStore";

import AppCodexNav from "@/assets/sripts/app_codex_nav";
import CodexHistory from "@/components/CodexHistory.vue";
import {useRoute} from "vue-router";
import {useHead} from "@unhead/vue";
import {getAppUrl} from "@/assets/sripts";

const codexImages = import.meta.glob('@/assets/images/snb/codexIcons/*', {eager: true})

const
    {t} = useI18n(),
    route = useRoute(),
    {serializationMap} = useAssetsStore(),
    appCodexNav = new AppCodexNav(),
    codexIcons = serializationMap(codexImages);

useHead(() => {
  const titleText = t(route.meta.title as string || 'codex.title');
  const descText = t('codex.meta.description') || t('apps.meta.description');
  return {
    title: titleText,
    titleTemplate: `%s | ${t('name')}`,
    meta: [
      {name: 'description', content: descText},
      {
        name: 'keywords',
        content: (t(route.meta.keywords as string || 'codex.meta.keywords') + ',' + t('home.meta.keywords'))
      },
      {property: 'og:title', content: `${titleText} | ${t('name')}`},
      {property: 'og:description', content: descText},
      {property: 'og:type', content: 'website'},
      {property: 'og:url', content: typeof window !== 'undefined' ? window.location.href : getAppUrl(route.fullPath || route.path)},
      {property: 'og:site_name', content: t('name')},
      {name: 'twitter:card', content: 'summary'},
      {name: 'twitter:title', content: `${titleText} | ${t('name')}`},
      {name: 'twitter:description', content: descText}
    ]
  };
});
</script>

<template>
  <div class="mb-10 overview">
    <v-row class="fill-height" no-gutters>
      <!-- 游览历史 S -->
      <CodexHistory></CodexHistory>
      <!-- 游览历史 E -->

      <div class="w-100">
        <template v-for="(i, index) in appCodexNav.codex" :key="index">
          <v-row class="py-0 px-5" align="center">
            <v-col cols="auto" class="font-weight-bold text-amber text-h5">
              {{ t(i.title) }}
            </v-col>
            <v-col>
              <v-divider opacity=".2" thickness="2"></v-divider>
            </v-col>
          </v-row>

          <v-row class="mb-2 pb-3 mb-10 mx-1">
            <v-col cols="12" sm="12" md="4" lg="4" v-for="(n, nIndex) in i.children" :key="nIndex" v-if="i.children">
              <router-link :to="n.to" class="codex-overview-item">
                <div class="card-flavor px-0 py-1">
                  <v-card class="card-enlargement-mask-flavor card px-8 py-5">
                    <v-img :src="codexIcons[n.value]" height="100"></v-img>
                  </v-card>
                </div>
                <div class="mt-2 text-center font-weight-bold name">{{ t(n.title) }}</div>
              </router-link>
            </v-col>
          </v-row>
        </template>
      </div>
    </v-row>
  </div>
</template>

<style scoped lang="less">
.codex-overview-item .card {
  background-size: calc(100% - 12px) calc(100% - 8px);
  background-position: center;
  background-color: black;
}

.codex-overview-item:hover .card {
  background-color: var(--main-color);
}
</style>
