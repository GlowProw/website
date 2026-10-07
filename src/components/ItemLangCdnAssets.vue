<script setup lang="ts">
import {useI18n} from "vue-i18n";
import {useAppStore} from "~/stores/appStore";
import {useNoticeStore} from "~/stores/noticeStore";
import {CDN_LANG_SOURCES, clearRemoteLangCache} from "@/assets/sripts/remote_i18n";

const {t} = useI18n();
const appStore = useAppStore();

const cdnLangOptions = CDN_LANG_SOURCES.map((s, idx) => ({
  name: s.label,
  value: s.key,
  subtitle: s.baseUrl,
  idx
}));

const onUpdateLangCdn = (value: any) => {
  const key = typeof value === 'string' ? value : value?.value;
  if (!key) return;

  const oldSource = appStore.cdnLangSource;
  appStore.setCdnLangSource(key);

  clearRemoteLangCache(oldSource);
};
</script>

<template>
  <v-card :variant="'text'">
    <div>
      <v-row align="center">
        <v-col cols="12">
          {{ t('setting.routine.langCdnTitle') }}
          <div class="mt-2 opacity-60">
            <p class="text-caption">{{ t('setting.routine.langCdnDesc') }}</p>
          </div>
        </v-col>
        <v-col cols="12">
          <v-select :value="appStore.cdnLangSource" :items="cdnLangOptions" @update:modelValue="onUpdateLangCdn">
            <template v-slot:item="{props, item}">
              <v-list-item v-bind="props" :title="item.raw.name"></v-list-item>
            </template>
            <template v-slot:selection="{item}">
              {{ item.raw.name }}
            </template>
          </v-select>
        </v-col>
      </v-row>
    </div>
  </v-card>
</template>

<style scoped lang="less">

</style>
