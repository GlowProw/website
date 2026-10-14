<template>
  <v-card height="200px">
    <template v-slot:image>
      <Silk
          :speed="3"
          :scale=".7"
          :color="'#1c1c1c'"
          :noise-intensity="0.1"
          :rotation="-.6"
          class="bg-black">
      </Silk>
    </template>
    <template v-slot:default>
      <v-container class="mt-4 position-relative">
        <v-breadcrumbs>
          <v-breadcrumbs-item to="/">{{ t('portal.title') }}</v-breadcrumbs-item>
          <v-breadcrumbs-divider></v-breadcrumbs-divider>
          <v-breadcrumbs-item to="/apps">{{ t('apps.title') }}</v-breadcrumbs-item>
          <v-breadcrumbs-divider></v-breadcrumbs-divider>
          <v-breadcrumbs-item>{{ t('apps.detail') }}</v-breadcrumbs-item>
        </v-breadcrumbs>

        <div class="position-absolute top-0 right-0 opacity-10 pt-10 d-flex ga-2">
          <v-icon icon="mdi-robot-outline" size="120"></v-icon>
          <v-icon icon="mdi-file-document-multiple-outline" size="120"></v-icon>
        </div>
      </v-container>
    </template>
  </v-card>

  <v-divider></v-divider>

  <v-container class="py-8">
    <v-row>
      <v-col cols="12" lg="6">
        <p class="text-subtitle-1 text-medium-emphasis">
          {{ t('apps.aiSkills.description') }} <br/>
          {{ t('apps.aiSkills.skill.description') }}
        </p>
      </v-col>
      <v-spacer></v-spacer>
      <v-col cols="12" lg="4">
        <div class="d-flex ga-2 align-center flex-wrap">
          <v-chip inline
                  v-for="(tag, tagIndex) in appApps.getAppData(id).tags"
                  :key="tagIndex"
                  class="badge-flavor text-center text-black">{{ tag }}
          </v-chip>
          <div class="text-subtitle-1 font-weight-bold my-1 w-100">
            {{ t('apps.aiSkills.skill.featuresTitle') }}
          </div>
          <v-chip
              v-for="(feature, key) in skillFeatures"
              :key="key"
              inline
              class="badge-flavor text-black">
            {{ feature }}
          </v-chip>
        </div>
      </v-col>
    </v-row>
  </v-container>

  <!-- 技能书下载区 S -->
  <div class="bg-black">
    <v-container class="py-10">
      <div class="d-flex align-center ga-2 mb-6">
        <h3 class="text-h4 font-weight-bold">{{ t('apps.aiSkills.skill.downloadTitle') }}</h3>
      </div>

      <v-row>
        <v-col cols="12" md="6">
          <v-card variant="flat" class="h-100 pa-6 skill-download-card">
            <div class="d-flex align-center ga-3 mb-3">
              <v-avatar color="amber" variant="tonal" size="44" rounded="lg">
                <v-icon icon="mdi-file-code-outline" size="22"/>
              </v-avatar>
              <div class="text-h6 font-weight-bold">{{ t('apps.aiSkills.skill.download') }}</div>
            </div>
            <p class="text-body-2 text-medium-emphasis mb-4">
              {{ t('apps.aiSkills.skill.downloadSubtitle') }}
            </p>
            <v-btn color="amber" variant="flat" block prepend-icon="mdi-download"
                   :href="skillBookUrl" target="_blank">
              {{ t('apps.aiSkills.skill.downloadAction') }}
              <v-chip density="compact" class="ml-2">BETA</v-chip>
            </v-btn>
          </v-card>
        </v-col>

        <v-col cols="12" md="6">
          <v-card variant="flat" class="h-100 pa-6 skill-download-card">
            <div class="d-flex align-center ga-3 mb-3">
              <v-avatar color="amber" variant="tonal" size="44" rounded="lg">
                <v-icon icon="mdi-file-document-outline" size="22"/>
              </v-avatar>
              <div class="text-h6 font-weight-bold">{{ t('apps.aiSkills.skill.downloadSelf') }}</div>
            </div>
            <p class="text-body-2 text-medium-emphasis mb-4">
              {{ t('apps.aiSkills.skill.downloadSelfSubtitle') }}
            </p>
            <v-btn color="amber" variant="flat" block prepend-icon="mdi-download"
                   :href="skillBookSelfUrl" target="_blank">
              {{ t('apps.aiSkills.skill.downloadAction') }}
              <v-chip density="compact" class="ml-2">BETA</v-chip>
            </v-btn>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
  <!-- 技能书下载区 E -->

  <!-- 文档与特性展示区 S -->
  <v-container class="my-10">
    <div class="d-flex align-center ga-2 mb-6">
      <h3 class="text-h5 font-weight-bold">{{ t('apps.aiSkills.skill.docsTitle') }}</h3>
    </div>

    <HorizontalScrollList>
      <div class="d-flex ga-2">
        <v-card border width="460" height="600" variant="flat">
          <v-card-title class="py-16 text-center bg-black mb-4 mx-n5 mt-n5">
            <v-icon size="80">mdi-book-open-page-variant</v-icon>
          </v-card-title>

          <v-card-text>
            <v-alert type="info" variant="tonal" density="compact" class="my-2">
              {{ t('apps.aiSkills.skill.tip') }}
            </v-alert>

            <div class="d-flex flex-column ga-2 gap-3">
              <v-btn variant="tonal" color="amber" size="large" prepend-icon="mdi-book-open-page-variant"
                     block
                     :href="docsUrl" target="_blank">
                {{ t('apps.aiSkills.skill.docs') }}
              </v-btn>
              <v-btn variant="tonal" color="amber" size="large" prepend-icon="mdi-import"
                     block
                     :href="importDocsUrl" target="_blank">
                {{ t('apps.aiSkills.skill.importDocs') }}
              </v-btn>
            </div>
          </v-card-text>
        </v-card>
      </div>
    </HorizontalScrollList>
  </v-container>
  <!-- 文档与特性展示区 E -->
</template>

<script setup lang="ts">
import {computed, ref} from "vue";
import {useI18n} from "vue-i18n";
import {appApps} from "@/assets/sripts/index";

import Silk from "@/components/Silk.vue";
import HorizontalScrollList from "@/components/HorizontalScrollList.vue";

const {t} = useI18n();
let id = ref('aiSkills');

// 特性标签：描述区与展示区共用
const skillFeatures = computed(() => [
  t('apps.aiSkills.skill.features.assembly'),
  t('apps.aiSkills.skill.features.codex'),
  t('apps.aiSkills.skill.features.login'),
]);

const skillBookUrl = 'https://assets.glow-prow.top/skills/glow-prow-配装查询/SKILL.md';
const skillBookSelfUrl = 'https://assets.glow-prow.top/skills/glow-prow-assembly-query-skill.md';
const docsUrl = 'https://blog.glow-prow.top/docs/AI/技能书';
const importDocsUrl = 'https://blog.glow-prow.top/docs/AI/技能书/如何导入';
</script>

<style scoped lang="less">
.skill-download-card {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
}
</style>
