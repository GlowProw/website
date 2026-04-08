<script setup lang="ts">

import {useI18n} from"vue-i18n";
import I18nMembersWidget from"@/components/i18nMembersWidget.vue";
import AffixBoxHasTitleView from"@/components/AffixBoxHasTitleView.vue";
import HtmlLink from"@/components/HtmlLink.vue";
import DevMembersWidget from"@/components/DevMembersWidget.vue";

const {t} = useI18n()
</script>

<template>
  <v-row>
    <v-row>
      <v-col cols="12" lg="8">
        <v-col cols="12" lg="12">
          <AffixBoxHasTitleView>
            <p>{{ t('about.disclaimer') }}</p>
            <h1 class="mt-5 opacity-60 pa-0 text-caption" style="text-wrap: auto">
              {{ t('about.manifesto.p1') }}
              <br><br>
              {{ t('about.manifesto.title') }}
              <br>
              {{ t('about.manifesto.p2') }}
              <br><br>
              {{ t('about.manifesto.p3') }}
              <br><br>
              {{ t('about.manifesto.p4') }}
            </h1>
            <p v-html="t('about.thanks')"></p>
            <template v-slot:title>
              {{ t('about.title') }}
            </template>
          </AffixBoxHasTitleView>
        </v-col>
        <v-col cols="12" lg="12">
          <AffixBoxHasTitleView>
            <p class="mb-5 text-caption opacity-60">{{ t('about.openSourceContribution') }}</p>

            <ul class="open-source-list">
              <li>
                {{ t('about.osList.main') }}
                <div class="text-caption opacity-60">
                  <p>
                    <HtmlLink href="https://github.com/GlowProw/website"></HtmlLink>
                  </p>
                  <p>
                    <HtmlLink href="https://github.com/GlowProw/website?tab=MIT-1-ov-file"></HtmlLink>
                  </p>
                </div>

                <div class="mt-3">
                  <DevMembersWidget :size="30" reop="website"></DevMembersWidget>
                </div>
              </li>
              <li>
                {{ t('about.osList.data') }}
                <div class="text-caption opacity-60">
                  <p class="w-100">
                    <HtmlLink href="https://github.com/GlowProw/glow-prow-data"></HtmlLink>
                  </p>
                  <p class="w-100">
                    <HtmlLink href="https://github.com/GlowProw/glow-prow-data?tab=AGPL-3.0-1-ov-file"></HtmlLink>
                  </p>
                </div>

                <div class="mt-3">
                  <DevMembersWidget :size="30" reop="glow-prow-data"></DevMembersWidget>
                </div>
              </li>
              <li>
                {{ t('about.osList.assets') }}
                <div class="text-caption opacity-60">
                  <p class="w-100">
                    <HtmlLink href="https://github.com/GlowProw/glow-prow-assets"></HtmlLink>
                  </p>
                  <p class="w-100">
                    <HtmlLink href="https://github.com/GlowProw/glow-prow-assets?tab=AGPL-3.0-1-ov-file"></HtmlLink>
                  </p>
                </div>

                <div class="mt-3">
                  <DevMembersWidget :size="30" reop="glow-prow-assets"></DevMembersWidget>
                </div>
              </li>
              <li>
                {{ t('about.osList.translations') }}
                <div class="text-caption opacity-60">
                  <p class="w-100">
                    <HtmlLink href="https://github.com/GlowProw/glow-prow-data-languages"></HtmlLink>
                  </p>
                  <p class="w-100">
                    <HtmlLink href="https://github.com/GlowProw/glow-prow-data-languages?tab=AGPL-3.0-1-ov-file"></HtmlLink>
                  </p>
                </div>

                <div class="mt-3">
                  <DevMembersWidget :size="30" reop="glow-prow-data-languages"></DevMembersWidget>
                </div>
              </li>
            </ul>
            <template v-slot:title>
              {{ t('about.openSourceTitle') }}
            </template>
          </AffixBoxHasTitleView>
        </v-col>
      </v-col>
      <v-col cols="12" lg="4">
        <v-col cols="12" lg="12">
          <AffixBoxHasTitleView>
            <p class="opacity-80 mb-3">{{ t('about.developersHonor') }}</p>
            <DevMembersWidget :size="40"></DevMembersWidget>

            <template v-slot:title>
              <span class="d-block mb-5">🎉</span>{{ t('about.developersTitle') }}
            </template>
          </AffixBoxHasTitleView>
        </v-col>
        <v-col cols="12" lg="12">
          <AffixBoxHasTitleView>
            <p class="opacity-80 mb-3">{{ t('about.translatorsHonor') }}</p>
            <I18nMembersWidget :size="40"></I18nMembersWidget>
            <template v-slot:title>
              <span class="d-block mb-5">🎉</span> {{ t('about.translatorsTitle') }}
            </template>
          </AffixBoxHasTitleView>
        </v-col>
        <v-col cols="12" lg="12">
          <AffixBoxHasTitleView>
            <p class="opacity-80 mb-3">{{ t('about.contactHonor') }}</p>
            <div class="pa-0">
              <p>
                <HtmlLink href="mailto:glow-prow@cabbagelol.net"></HtmlLink>
              </p>
              <p>
                <HtmlLink href="https://cabbagelol.net"></HtmlLink>
              </p>
            </div>
            <template v-slot:title>
              <span class="d-block mb-5">📮</span> {{ t('about.contactTitle') }}
            </template>
          </AffixBoxHasTitleView>
        </v-col>
      </v-col>
    </v-row>

  </v-row>
</template>

<style scoped lang="less">
* {
  h1 {
    font-size: 3rem;
    margin: 20px 0;
    padding: 20px 20px;
  }

  h3 {
    margin: 20px 0;
    font-size: 2rem;
  }

  ul, ol {
    margin-left: 30px;

    li {
      margin-bottom: 20px;
    }
  }
}
</style>
