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
          <v-icon icon="mdi-robot" size="120"></v-icon>
          <v-img width="120" height="120" class="text-white" src="@/assets/images/apps/qqBot/icon-qqchat.svg"/>
        </div>
      </v-container>
    </template>
  </v-card>

  <v-divider></v-divider>

  <v-container class="py-8">
    <v-row>
      <v-col cols="12" lg="6">
        <v-row>
          <v-col>
          </v-col>
        </v-row>

        <p class="text-subtitle-1 text-medium-emphasis">
          {{ t('apps.qqBot.description') }} <br/>
          {{ t('apps.qqBot.features.command.description') }}
        </p>
      </v-col>
      <v-spacer></v-spacer>
      <v-col cols="12" lg="auto">
        <div class="d-flex ga-2 align-center mt-3">
          <v-chip inline
                  v-for="(tag, tagIndex) in appApps.getAppData(id).tags"
                  :key="tagIndex"
                  class="badge-flavor text-center text-black">{{ tag }}
          </v-chip>
          <v-divider vertical inset></v-divider>
          <v-chip inline
                  class="badge-flavor text-center text-black">{{ t(`apps.qqBot.features.assembly.title`) }}
          </v-chip>
          <v-chip inline
                  class="badge-flavor text-center text-black">{{ t(`apps.qqBot.features.codex.title`) }}
          </v-chip>
        </div>
      </v-col>
    </v-row>
  </v-container>

  <div class="bg-black">
    <v-container class="py-10">
      <QQBotBannerWidget :is-show-detail="false"/>
    </v-container>
  </div>

  <v-container class="mt-10">
    <QQBotShowcaseWidget/>
  </v-container>
</template>

<script setup lang="ts">
import Silk from "@/components/Silk.vue";
import {useI18n} from "vue-i18n";
import {appApps} from "@/assets/sripts/index";
import {ref} from "vue";

import QQBotBannerWidget from "@/components/QQBotBannerWidget.vue";
import QQBotShowcaseWidget from "@/components/QQBotShowcaseWidget.vue";

const {t} = useI18n();
let id = ref('qqBot');
</script>

<style scoped lang="less">
.header-card {
  :deep(.v-card__image) {
    background-color: black;
  }
}
</style>
