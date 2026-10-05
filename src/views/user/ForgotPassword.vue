<script setup lang="ts">
import {Ref, ref} from "vue";
import {useRouter, useRoute} from "vue-router";
import {useI18n} from "vue-i18n";
import {useNoticeStore} from "~/stores/noticeStore";
import {useDisplay} from "vuetify/framework";

import {useRules} from "@/assets/sripts/rules_user"
import {apis} from "@/assets/sripts";
import {ForgotPasswordParams} from "@/assets/types/User";
import {handleApiError} from "@/assets/sripts/error_handler";
import Silk from "@/components/Silk.vue";
import HalfScreenBannerText from "@/components/HalfScreenBannerText.vue";

const router = useRouter(),
    route = useRoute(),
    notice = useNoticeStore(),
    {t} = useI18n(),
    rules = useRules(),
    {mobile, sm} = useDisplay()

let loading: Ref<boolean> = ref(false),
    form: Ref<ForgotPasswordParams> = ref({
      identifier: '',
      email: ''
    })

/**
 * 请求重置码
 */
const onSubmit = async () => {
  try {
    loading.value = true;
    const result = await apis.userApi().forgotPassword({
      identifier: form.value.identifier,
      email: form.value.email
    })

    notice.success(t('basic.tips.forgotPassword.ok'))

    // 跳转到重置密码页面，携带用户名作为提示
    setTimeout(() => {
      router.push({
        path: '/account/reset-password',
        query: {username: form.value.identifier}
      })
    }, 1500)
  } catch (e) {
    handleApiError(e, notice, t, { component: 'ForgotPassword', tPrefix: 'basic.tips.forgotPassword' })
  } finally {
    loading.value = false;
  }
}

const onBack = () => {
  router.push('/account/signin')
}
</script>

<template>
  <div>
    <div class="forgot-window">
      <v-row dense class="h-screen">
        <v-col cols="12" lg="6" :class="{'d-none': mobile || sm}" class="position-relative overflow-hidden">
         <HalfScreenBannerText></HalfScreenBannerText>
          <Silk
              :speed="3"
              :scale=".7"
              :color="'#1c1c1c'"
              :noise-intensity="0.1"
              :rotation="-.2"
              class="bg-black">
          </Silk>
        </v-col>
        <v-col cols="12" lg="6" class="bg-black">
          <v-card dense variant="text" class="forgot-card mt-16 px-8">
            <v-breadcrumbs class="ml-n3">
              <v-breadcrumbs-item to="/">{{ t('portal.title') }}</v-breadcrumbs-item>
              <v-breadcrumbs-divider></v-breadcrumbs-divider>
              <v-breadcrumbs-item>{{ t('forgotPassword.title') }}</v-breadcrumbs-item>
            </v-breadcrumbs>

            <p class="py-2 text-body-2 text-grey">
              {{ t('forgotPassword.description') }}
            </p>

            <v-row class="py-2">
              <v-col>
                <v-text-field v-model="form.identifier"
                              :rules="rules.username"
                              name="identifier"
                              variant="solo-filled"
                              prepend-inner-icon="mdi-account-key"
                              :label="t('forgotPassword.form.identifier')"
                              placeholder="Username / ID"
                              class="mb-2"></v-text-field>

                <v-text-field v-model="form.email"
                              :rules="rules.email"
                              name="email"
                              variant="solo-filled"
                              prepend-inner-icon="mdi-email"
                              :label="t('forgotPassword.form.email')"
                              placeholder="Email"></v-text-field>
              </v-col>
            </v-row>

            <div class="py-2">
              <v-btn class="bg-amber" @click="onSubmit" size="50" block :loading="loading" :disabled="!form.identifier || !form.email" variant="flat">
                {{ t('forgotPassword.form.submit') }}
              </v-btn>

              <v-btn class="mt-2" @click="onBack" size="50" block variant="text">{{ t('basic.button.cancel') }}</v-btn>
            </div>
          </v-card>
        </v-col>
      </v-row>
    </div>
  </div>
</template>

<style scoped lang="less">
@import "@/assets/styles/link";

.forgot-window {
  min-height: 100vh;
}
</style>
