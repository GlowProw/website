<script setup lang="ts">
import {ref} from "vue";
import {useI18n} from "vue-i18n";
import {number} from "@/assets/sripts";
import StylizedLineBackground from "@/components/StylizedLineBackground.vue";

const {t} = useI18n();

const props = withDefaults(defineProps<{
  isShowDetail?: boolean;
  border?: boolean;
  layout?: 'horizontal' | 'vertical' | 'auto';
}>(), {
  isShowDetail: false,
  border: true,
  layout: 'auto'
});

const model = ref(false);

defineOptions({name: "QQBotBannerWidget"});
</script>

<template>
  <div class="qq-bot-banner-card">
      <div class="">
        <v-row align="center">
          <v-col :cols="12" :md="props.layout === 'vertical' ? 12 : 7" :lg="props.layout === 'vertical' ? 12 : 7">
            <div class="d-flex align-center ga-3 mb-2">
              <router-link to="/apps/qq-bot">
                <h1 class="text-h2 font-weight-bold text-amber mb-0">
                  {{ t('apps.qqBot.name') }}
                </h1>
              </router-link>
            </div>

            <div class="my-3">
              <div class="d-flex flex-wrap align-center text-h5 text-md-h4">
                <u class="u">@{{ t('name') }}</u>
                <v-icon icon="mdi-slash-forward" color="var(--main-color)" class="mx-1"/>
                <span class="font-weight-medium">{ {{ t('apps.qqBot.commandPlaceholder') }} }</span>
              </div>
              <p class="mt-2 text-body-1 opacity-60 mb-0">
                {{ t('apps.qqBot.invokeFeature') }}
              </p>
            </div>
          </v-col>

          <v-col :cols="12" :md="props.layout === 'vertical' ? 12 : 5" :lg="props.layout === 'vertical' ? 12 : 5">
            <div class="d-flex flex-column ga-3">
              <v-row>
                <v-col>
                  <v-btn
                      variant="tonal"
                      block
                      size="large"
                      color="var(--main-color)"
                      prepend-icon="mdi-robot-excited-outline"
                      @click="model = true">
                    {{ t('apps.qqBot.addBot') }}
                  </v-btn>
                </v-col>
                <v-col>
                  <v-btn
                      variant="tonal"
                      block
                      size="large"
                      href="https://blog.glow-prow.top/docs/qqBot/"
                      target="_new">
                    {{ t('apps.qqBot.docs') }}
                  </v-btn>
                </v-col>
              </v-row>
            </div>

            <v-dialog v-model="model" max-width="680">
              <v-card border class="mx-auto bg-grey-darken-4">
                <v-card-title class="py-8 text-center bg-black mb-2 position-relative">
                  <v-icon size="99">mdi-robot-outline</v-icon>
                  <v-btn
                      icon="mdi-close"
                      size="small"
                      variant="text"
                      class="position-absolute top-0 right-0 ma-2"
                      @click="model = false"/>
                </v-card-title>
                <v-card-text class="py-3 px-6 px-md-10">
                  <p class="mb-4 text-center text-body-1 font-weight-medium">
                    {{ t('apps.qqBot.dialog.description') }}
                  </p>
                  <v-row align="end" class="mb-4">
                    <v-col cols="12" sm="4" class="text-center">
                      <v-btn
                          border
                          block
                          href="https://bot.q.qq.com/s/v4A7C5CJ9Y"
                          target="_blank"
                          class="bg-amber text-black font-weight-bold">
                        {{ t('apps.qqBot.dialog.linkButton') }}
                      </v-btn>
                      <p class="mt-2 mx-2 text-caption opacity-60">{{ t('apps.qqBot.dialog.linkDesc') }}</p>
                      <p class="mt-1 text-caption font-weight-bold">{{ t('apps.qqBot.dialog.accountIdentifier') }}</p>
                    </v-col>
                    <v-col cols="12" sm="4" class="text-center">
                      <p class="u text-amber text-h5 font-mono mb-0">3889974138</p>
                      <p class="mt-2 mx-2 text-caption opacity-60">{{ t('apps.qqBot.dialog.qqIdDesc') }}</p>
                      <p class="mt-1 text-caption font-weight-bold">{{ t('apps.qqBot.dialog.accountIdentifier') }}</p>
                    </v-col>
                    <v-col cols="12" sm="4" class="text-center">
                      <v-card border class="mx-auto pa-1 bg-white d-inline-flex">
                        <v-img src="@/assets/images/app-qq-bot-qr.png" width="100"/>
                      </v-card>
                      <p class="mt-2 text-caption font-weight-bold mb-0">{{ t('apps.qqBot.dialog.qrCode') }}</p>
                    </v-col>
                  </v-row>

                  <v-row style="margin-top: -60px" class="opacity-10 d-none d-sm-flex" dense>
                    <v-col cols="4" class="text-center">
                      <h5 class="text-h1 opacity-60">{{ number.intToRoman(1) }}</h5>
                    </v-col>
                    <v-col cols="4" class="text-center">
                      <h5 class="text-h1 opacity-60">{{ number.intToRoman(2) }}</h5>
                    </v-col>
                    <v-col cols="4" class="text-center">
                      <h5 class="text-h1 opacity-60">{{ number.intToRoman(3) }}</h5>
                    </v-col>
                  </v-row>

                  <v-divider class="my-4"/>
                  <div class="my-3">
                    <p class="mb-2 font-weight-bold">{{ t('apps.qqBot.dialog.tipsTitle') }}</p>
                    <ul class="text-caption opacity-70 pl-4">
                      <li>{{ t('apps.qqBot.dialog.tip1') }}</li>
                      <li>{{ t('apps.qqBot.dialog.tip2') }}</li>
                      <li>{{ t('apps.qqBot.dialog.tip3') }}</li>
                      <li>{{ t('apps.qqBot.dialog.tip4') }}</li>
                    </ul>
                  </div>
                </v-card-text>
              </v-card>
            </v-dialog>
          </v-col>
        </v-row>
      </div>
  </div>
</template>

<style scoped lang="less">
.qq-bot-banner-card {
  position: relative;
}
</style>
