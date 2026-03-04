<script setup lang="ts">
import {onMounted, ref} from "vue";
import {useI18n} from "vue-i18n";
import {useDisplay} from "vuetify/framework";
import {useAssetsStore} from "~/stores/assetsStore";

import AppCodexNav from "@/assets/sripts/app_codex_nav";
import CodexHistory from "@/components/CodexHistory.vue";

const codexImages = import.meta.glob('@/assets/images/snb/codexIcons/*', {eager: true})

const
    {t} = useI18n(),
    {mobile} = useDisplay(),
    {serializationMap} = useAssetsStore(),
    appCodexNav = new AppCodexNav()

let codexIcons = ref({})

onMounted(() => {
  codexIcons.value = serializationMap(codexImages)
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
          <v-toolbar class="py-0 px-5 bg-transparent">
            <div class="font-weight-bold text-amber text-h5">
              {{ t(i.title) }}
            </div>
            <v-spacer></v-spacer>
          </v-toolbar>

          <v-divider class="mb-5"></v-divider>

          <v-row class="mb-2 px-3 mb-16">
            <v-col cols="12" sm="12" md="4" lg="3" v-for="(n, nIndex) in i.childs" :key="nIndex" v-if="i.childs">
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
