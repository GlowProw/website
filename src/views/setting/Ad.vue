<script setup lang="ts">
import AdViewListWidget from "@/components/ads/AdViewListWidget.vue";
import AdManageBtn from "@/components/ads/AdManageBtn.vue";
import AffixBoxHasTitleView from "@/components/AffixBoxHasTitleView.vue";
import {useI18n} from "vue-i18n";
import AffixContainerView from "@/components/AffixContainerView.vue";

const {t} = useI18n();
</script>

<template>
  <v-row>
    <v-col cols="12" lg="4">
      <AffixContainerView>
        <AffixBoxHasTitleView :offset-top="0">
          <p>{{ t('setting.ad.description1') }}</p>

          <ul>
            <li>
              <p class="opacity-60 mt-3">{{ t('setting.ad.description2') }}</p>
            </li>
            <li>
              <p class="opacity-60 mt-3">{{ t('setting.ad.description3') }}</p>
            </li>
          </ul>

          <v-row align="center" class="mt-2" no-gutters>
            <v-col>
              <u class="u">{{ t('setting.ad.mainSwitch') }}</u>
            </v-col>
            <v-col cols="auto">
              <AdManageBtn></AdManageBtn>
            </v-col>
          </v-row>
          <template v-slot:title>
            {{ t('setting.ad.title') }}
          </template>
        </AffixBoxHasTitleView>
      </AffixContainerView>
    </v-col>
    <v-col cols="12" lg="8">
      <AffixBoxHasTitleView>
        <AdViewListWidget></AdViewListWidget>

        <template v-slot:title>
          {{ t('setting.ad.excludeList') }}
        </template>
      </AffixBoxHasTitleView>
    </v-col>
  </v-row>
</template>

<style scoped lang="less">

</style>
