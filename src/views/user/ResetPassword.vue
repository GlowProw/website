<script setup lang="ts">
import {onMounted, ref, Ref} from "vue";
import {useRoute, useRouter} from "vue-router";
import {useI18n} from "vue-i18n";
import {useNoticeStore} from "~/stores/noticeStore";
import {useDisplay} from "vuetify/framework";
import {apis} from "@/assets/sripts";
import {useRules} from "@/assets/sripts/rules_user"
import {ResetPasswordParams} from "@/assets/types/User";
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
  <div>
    <div class="reset-window">
      <v-row dense class="h-screen">
        <v-col cols="12" lg="7" :class="{'d-none': mobile || sm}" class="position-relative overflow-hidden">
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
        <v-col cols="12" lg="5" class="bg-black">
          <v-card dense variant="text" class="reset-card mt-16 px-8">
            <v-breadcrumbs class="ml-n3">
              <v-breadcrumbs-item to="/">{{ t('portal.title') }}</v-breadcrumbs-item>
              <v-breadcrumbs-divider></v-breadcrumbs-divider>
              <v-breadcrumbs-item>{{ t('resetPassword.title') }}</v-breadcrumbs-item>
            </v-breadcrumbs>

            <p class="py-2 text-body-2 text-grey">
              {{ t('resetPassword.description') }}
            </p>

            <v-row class="py-2">
              <v-col>
                <v-text-field v-model="form.username"
                              variant="solo-filled"
                              :rules="rules.username"
                              name="username"
                              prepend-inner-icon="mdi-account-key"
                              :label="t('resetPassword.form.username')"
                              class="mb-2"></v-text-field>

                <v-text-field v-model="form.code"
                              variant="solo-filled"
                              :rules="rules.code"
                              name="code"
                              prepend-inner-icon="mdi-numeric-6-box"
                              :label="t('resetPassword.form.code')"
                              maxlength="6"
                              class="mb-2"></v-text-field>

                <v-text-field v-model="form.newPassword"
                              :rules="rules.password"
                              name="newPassword"
                              :type="passwordVisible ? 'text' : 'password'"
                              variant="solo-filled"
                              prepend-inner-icon="mdi-lock-reset"
                              :label="t('resetPassword.form.newPassword')">
                  <template v-slot:append-inner>
                    <v-icon
                      :icon="passwordVisible ? 'mdi-eye-off' : 'mdi-eye'"
                      class="cursor-pointer"
                      @click="passwordVisible = !passwordVisible"
                    />
                  </template>
                </v-text-field>
              </v-col>
            </v-row>

            <div class="py-2">
              <v-btn class="bg-amber" @click="onReset" size="50" block :loading="loading"
                     :disabled="!form.username || form.code.length !== 6 || !form.newPassword" variant="flat">
                {{ t('resetPassword.form.submit') }}
              </v-btn>

              <v-btn class="mt-2" to="/account/signin" size="50" block variant="text">
                {{ t('basic.button.cancel') }}
              </v-btn>
            </div>
          </v-card>
        </v-col>
      </v-row>
    </div>
  </div>
</template>

<style scoped lang="less">
@import "@/assets/styles/link";

.reset-window {
  min-height: 100vh;
}
</style>
