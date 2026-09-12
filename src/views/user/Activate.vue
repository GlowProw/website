<script setup lang="ts">
import {Ref, ref, onMounted} from "vue";
import {useRoute, useRouter} from "vue-router";
import {useI18n} from "vue-i18n";
import {useNoticeStore} from "~/stores/noticeStore";
import {apis} from "@/assets/sripts";
import {ApiError} from "@/assets/types/Api";

const router = useRouter(),
    route = useRoute(),
    noticeStore = useNoticeStore(),
    {t} = useI18n()

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
    // 若两者都存在时是否自动提交？
    // 也许让用户主动点击以查看执行状态更好。
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
      noticeStore.error(t('basic.tips.activate.resend.error', { context: e }))
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
      noticeStore.error(t('basic.tips.activate.error', { context: e }))
    }
  } finally {
    activateLoading.value = false;
  }
}
</script>

<template>
  <div class="background-img-flavor">
    <v-container class="mt-10 activate">
      <v-card dense flat class="mt-10 activate-card card-enlargement-mask-flavor">
        <h1 class="pl-8 pt-5 pb-5 background-flavor">{{ t('activate.title') }}</h1>

        <v-row class="pa-8">
          <v-col>
            <p class="mb-4 opacity-80">{{ t('activate.description') }}</p>

            <v-text-field v-model="activateForm.username"
                          variant="solo-filled"
                          :label="t('activate.form.username.name')"
                          :placeholder="t('activate.form.username.placeholder')"
                          class="mb-2"></v-text-field>

            <v-text-field v-model="activateForm.code"
                          variant="solo-filled"
                          :label="t('activate.form.code.name')"
                          :placeholder="t('activate.form.code.placeholder')"
                          max-length="6"></v-text-field>
          </v-col>
        </v-row>

        <div class="mt-10 ml-8 mr-8">
          <v-btn class="bg-amber" @click="onActivate" size="50" block :loading="activateLoading" :disabled="!activateForm.username || activateForm.code.length !== 6" variant="flat">
            {{ t('activate.submit') }}
          </v-btn>

          <v-btn class="mt-2" variant="text" size="50" block @click="onResendCode" :loading="resendLoading" :disabled="resendCooldown > 0">
            {{ resendCooldown > 0 ? `${t('activate.resendCode')} (${resendCooldown}s)` : t('activate.resendCode') }}
          </v-btn>

          <v-btn class="mt-2 mb-5" to="/account/signin" size="50" block variant="text">
            {{ t('activate.backToSignin') }}
          </v-btn>
        </div>
      </v-card>
    </v-container>
  </div>
</template>

<style scoped lang="less">
.activate {
  h1 {
    color: var(--main-color);
  }

  .activate-card {
    max-width: 500px;
    margin: 30px auto;
  }
}
</style>
