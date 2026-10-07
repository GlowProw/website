<script setup lang="ts">
import {onMounted, ref, Ref} from "vue";
import {useRoute, useRouter} from "vue-router";
import {useI18n} from "vue-i18n";
import {useNoticeStore} from "~/stores/noticeStore";
import {useDisplay} from "vuetify/framework";
import {apis} from "@/assets/sripts";
import {ApiError} from "@/assets/types/Api";
import Silk from "@/components/Silk.vue";

const router = useRouter(),
    route = useRoute(),
    noticeStore = useNoticeStore(),
    {t} = useI18n(),
    {mobile, sm} = useDisplay()

let activateLoading: Ref<boolean> = ref(false),
    resendLoading: Ref<boolean> = ref(false),
    resendCooldown: Ref<number> = ref(0),
    activateForm = ref({
      username: '',
      code: ''
    })

onMounted(() => {
  if (route.query.username) {
    activateForm.value.username = route.query.username as string;
  }
  if (route.query.code) {
    activateForm.value.code = route.query.code as string;
  }
})

/**
 * 重新发送激活邮件
 */
const onResendCode = async () => {
  if (resendCooldown.value > 0) return;

  try {
    if (!activateForm.value.username) {
      noticeStore.error(t('activate.form.username.notEmpty'))
      return
    }

    resendLoading.value = true;
    const result = await apis.userApi().resendActivationCode(activateForm.value.username);
    noticeStore.success(t(`basic.tips.${result.code}`))

    // 开始冷却
    resendCooldown.value = 60;
    const timer = setInterval(() => {
      resendCooldown.value--;
      if (resendCooldown.value <= 0) {
        clearInterval(timer);
      }
    }, 1000);
  } catch (e) {
    if (e instanceof ApiError) {
      noticeStore.error(t(`basic.tips.${e.code}`, {
        context: e.code
      }))
    } else {
      noticeStore.error(t('basic.tips.activate.resend.error', {context: e}))
    }
  } finally {
    resendLoading.value = false;
  }
}

/**
 * 激活账户
 */
const onActivate = async () => {
  try {
    activateLoading.value = true;

    await apis.userApi().activate({
      username: activateForm.value.username,
      code: activateForm.value.code
    });

    noticeStore.success(t('basic.tips.activate.ok'))

    setTimeout(() => {
      router.push('/account/signin')
    }, 1500)
  } catch (e) {
    if (e instanceof ApiError) {
      noticeStore.error(t(`basic.tips.activate.${e.code}`, {
        context: e.code
      }))
    } else {
      noticeStore.error(t('basic.tips.activate.error', {context: e}))
    }
  } finally {
    activateLoading.value = false;
  }
}
</script>

<template>
  <div>
    <div class="activate-window">
      <v-row dense class="h-screen">
        <v-col cols="12" lg="6" :class="{'d-none': mobile || sm}" class="position-relative overflow-hidden">
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
          <v-card dense variant="text" class="activate-card mt-16 px-8">
            <v-breadcrumbs class="ml-n3">
              <v-breadcrumbs-item to="/">{{ t('portal.title') }}</v-breadcrumbs-item>
              <v-breadcrumbs-divider></v-breadcrumbs-divider>
              <v-breadcrumbs-item>{{ t('activate.title') }}</v-breadcrumbs-item>
            </v-breadcrumbs>

            <p class="py-2 text-body-2 text-grey">
              {{ t('activate.description') }}
            </p>

            <v-row class="py-2">
              <v-col>
                <v-text-field v-model="activateForm.username"
                              variant="solo-filled"
                              name="username"
                              prepend-inner-icon="mdi-account-key"
                              :label="t('activate.form.username.name')"
                              :placeholder="t('activate.form.username.placeholder')"
                              class="mb-2"></v-text-field>

                <v-text-field v-model="activateForm.code"
                              variant="solo-filled"
                              name="code"
                              prepend-inner-icon="mdi-numeric-6-box"
                              :label="t('activate.form.code.name')"
                              :placeholder="t('activate.form.code.placeholder')"
                              maxlength="6"></v-text-field>
              </v-col>
            </v-row>

            <div class="py-2">
              <v-btn class="bg-amber" @click="onActivate" size="50" block :loading="activateLoading"
                     :disabled="!activateForm.username || activateForm.code.length !== 6" variant="flat">
                {{ t('activate.submit') }}
              </v-btn>

              <v-btn class="mt-2" variant="tonal" size="50" block @click="onResendCode" :loading="resendLoading" :disabled="resendCooldown > 0">
                {{ resendCooldown > 0 ? `${t('activate.resendCode')} (${resendCooldown}s)` : t('activate.resendCode') }}
              </v-btn>

              <v-btn class="mt-2" to="/account/signin" size="50" block variant="text">
                {{ t('activate.backToSignin') }}
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

.activate-window {
  min-height: 100vh;
}
</style>
