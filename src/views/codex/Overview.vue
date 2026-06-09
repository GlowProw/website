<script setup lang="ts">
import {onMounted, ref} from "vue";
import {useI18n} from "vue-i18n";
import {useAssetsStore} from "~/stores/assetsStore";

import AppCodexNav from "@/assets/sripts/app_codex_nav";
import CodexHistory from "@/components/CodexHistory.vue";
import {useRoute} from "vue-router";
import {useHead} from "@unhead/vue";

const codexImages = import.meta.glob('@/assets/images/snb/codexIcons/*', {eager: true})

const
    {t} = useI18n(),
    route = useRoute(),
    {serializationMap} = useAssetsStore(),
    appCodexNav = new AppCodexNav()

let codexIcons = ref({}),

    // meta
    head = ref({
      title: t(route.meta.title as string),
      titleTemplate: `%s | ${t('name')}`,
      meta: [
        {name: 'keywords', content: t(route.meta.keywords as string)},
        {name: 'og:title', content: `%s | ${t('name')}`},
      ]
    })

useHead(head)

onMounted(() => {
  codexIcons.value = serializationMap(codexImages)

  head.value.titleTemplate = `${t('codex.title')} - ${head.value.titleTemplate}`
  head.value.meta = [
    {
      name: 'keywords', content: t(route.meta.keywords as string + ',' + t('home.meta.keywords'))
    },
    {name: 'og:title', content: `${t(route.meta.title as string)} | ${t('name')}`},
  ]
})

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
                  <v-card class="card-enlargement-flavor card px-8 py-5">
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
