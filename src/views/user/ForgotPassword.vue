<script setup lang="ts">
import {Ref, ref} from "vue";
import {useRouter} from "vue-router";
import {useI18n} from "vue-i18n";
import {useNoticeStore} from "~/stores/noticeStore";

import {useRules} from "@/assets/sripts/rules_user"
import {apis} from "@/assets/sripts";
import {ApiError} from "@/assets/types/Api";
import {ForgotPasswordParams} from "@/assets/types/User";

const router = useRouter(),
    notice = useNoticeStore(),
    {t} = useI18n(),
    rules = useRules()

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
    if (e instanceof ApiError) {
      notice.error(t(`basic.tips.forgotPassword.${e.code}`, {
        context: e.code
      }))
    }
    console.error(e)
  } finally {
    loading.value = false;
  }
}

const onBack = () => {
  router.push('/account/signin')
}
</script>

<template>
  <div class="background-img-flavor">
    <v-container class="mt-10 forgot-password">
      <v-card dense flat class="mt-10 forgot-card card-enlargement-flavor">
        <h1 class="pl-8 pt-5 pb-5 background-flavor">{{ t('forgotPassword.title') }}</h1>

        <p class="px-8 mt-5 text-body-2 text-grey">
          {{ t('forgotPassword.description') }}
        </p>

        <v-card border class="bg-black mx-8 my-3">
          <v-row class="pa-8">
            <v-col>
              <v-text-field v-slot:label
                            v-model="form.identifier"
                            :rules="rules.username"
                            variant="solo-filled"
                            prepend-inner-icon="mdi-account"
                            :label="t('forgotPassword.form.identifier')"
                            placeholder="Username / ID"></v-text-field>

              <v-text-field v-model="form.email"
                            :rules="rules.email"
                            variant="solo-filled"
                            prepend-inner-icon="mdi-email"
                            :label="t('forgotPassword.form.email')"
                            placeholder="Email"></v-text-field>
            </v-col>
          </v-row>
        </v-card>

        <v-card-actions class="mt-5 mx-6 mb-8">
          <v-btn class="bg-amber" @click="onSubmit" size="50" block :loading="loading" :disabled="!form.identifier || !form.email" variant="flat">
            {{ t('forgotPassword.form.submit') }}
          </v-btn>

          <v-btn class="mt-2" @click="onBack" size="50" block variant="text">
            {{ t('basic.button.cancel') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-container>
  </div>
</template>

<style scoped lang="less">
.forgot-password {
  h1 {
    color: var(--main-color);
  }

  .forgot-card {
    max-width: 500px;
    margin: 30px auto;
  }
}
</style>
