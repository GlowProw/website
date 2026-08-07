<script setup lang="ts">
import {onMounted, ref, Ref} from "vue";
import {useRoute, useRouter} from "vue-router";
import {useI18n} from "vue-i18n";
import {useNoticeStore} from "~/stores/noticeStore";
import {apis} from "@/assets/sripts";
import {ApiError} from "@/assets/types/Api";
import {useRules} from "@/assets/sripts/rules_user"
import {ResetPasswordParams} from "@/assets/types/User";
import {handleApiError} from "@/assets/sripts/error_handler";

const router = useRouter(),
    route = useRoute(),
    notice = useNoticeStore(),
    {t} = useI18n(),
    rules = useRules()

let loading: Ref<boolean> = ref(false),
    form = ref<ResetPasswordParams>({
      username: '',
      code: '',
      newPassword: ''
    }),
    passwordVisible = ref(false)

onMounted(() => {
  if (route.query.username) {
    form.value.username = route.query.username as string;
  }
})

/**
 * 重置密码
 */
const onReset = async () => {
  try {
    loading.value = true;

    await apis.userApi().resetPassword({
      username: form.value.username,
      code: form.value.code,
      newPassword: form.value.newPassword
    });

    notice.success(t('basic.tips.resetPassword.ok'))

    setTimeout(() => {
      router.push('/account/signin')
    }, 1500)
  } catch (e) {
    handleApiError(e, notice, t, { component: 'ResetPassword', tPrefix: 'basic.tips.resetPassword' })
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="background-img-flavor">
    <v-container class="mt-10 reset-password">
      <v-card dense flat class="mt-10 reset-card card-enlargement-flavor">
        <h1 class="pl-8 pt-5 pb-5 background-flavor">{{ t('resetPassword.title') }}</h1>

        <p class="px-8 mt-5 text-body-2 text-grey">
          {{ t('resetPassword.description') }}
        </p>

        <v-card border class="bg-black mx-8 my-3">
          <v-row class="pa-8">
            <v-col>
              <v-text-field v-model="form.username"
                            variant="solo-filled"
                            :rules="rules.username"
                            prepend-inner-icon="mdi-account"
                            :label="t('resetPassword.form.username')"
                            class="mb-2"></v-text-field>

              <v-text-field v-model="form.code"
                            variant="solo-filled"
                            :rules="rules.code"
                            prepend-inner-icon="mdi-numeric-6-box"
                            :label="t('resetPassword.form.code')"
                            max-length="6"
                            class="mb-2"></v-text-field>

              <v-text-field v-model="form.newPassword"
                            :rules="rules.password"
                            :type="passwordVisible ? 'text' : 'password'"
                            variant="solo-filled"
                            prepend-inner-icon="mdi-lock-reset"
                            :label="t('resetPassword.form.newPassword')"
                            clearable>
                <template v-slot:append v-if="form.newPassword">
                  <v-checkbox hide-details density="compact" v-model="passwordVisible"></v-checkbox>
                </template>
              </v-text-field>
            </v-col>
          </v-row>
        </v-card>

        <v-card-actions class="mt-5 mx-6 mb-8">
          <v-btn class="bg-amber" @click="onReset" size="50" block :loading="loading"
                 :disabled="!form.username || form.code.length !== 6 || !form.newPassword" variant="flat">
            {{ t('resetPassword.form.submit') }}
          </v-btn>

          <v-btn class="mt-2" to="/account/signin" size="50" block variant="text">
            {{ t('basic.button.cancel') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-container>
  </div>
</template>

<style scoped lang="less">
.reset-password {
  h1 {
    color: var(--main-color);
  }

  .reset-card {
    max-width: 500px;
    margin: 30px auto;
  }
}
</style>
