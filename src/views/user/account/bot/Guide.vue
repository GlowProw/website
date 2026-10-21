<script setup lang="ts">
import {onMounted, ref} from "vue";
import {useI18n} from "vue-i18n";
import {useRouter} from "vue-router";
import {apis} from "@/assets/sripts";
import {useNoticeStore} from "~/stores/noticeStore";
import {handleApiError} from "@/assets/sripts/error_handler";
import type {BotInstanceOption, BotPlatformOption} from "@/assets/types/Bot";
import AffixBoxHasTitleView from "@/components/AffixBoxHasTitleView.vue";
import AffixContainerView from "@/components/AffixContainerView.vue";

const {t} = useI18n(),
    router = useRouter(),
    notice = useNoticeStore(),
    platforms = ref<BotPlatformOption[]>([]),
    bots = ref<BotInstanceOption[]>([]),
    form = ref({
      platform: 'qq',
      botId: null as number | null,
      groupNumber: ''
    }),
    bindCode = ref(''),
    bindTtl = ref(0),
    codeDialog = ref(false),
    botJoined = ref<boolean | null>(null),
    loading = ref(false),
    noAccess = ref(false),
    submitting = ref(false)

defineOptions({
  name: 'AccountBotGuide'
})

/**
 * 机器人下拉项展示名称
 * @param item 机器人记录
 */
const onBotTitle = (item: BotInstanceOption) => item.displayId
    ? `${item.name} (${t('account.bot.display.qq')}: ${item.displayId})`
    : `${item.name} (${t('account.bot.display.appid')}: ${item.platformBotId})`

/**
 * 载入平台与机器人列表
 */
const onLoad = async () => {
  loading.value = true
  try {
    const platformResult = await apis.botApi().getPlatforms()

    platforms.value = platformResult.data?.data || []
    if (platforms.value.length > 0) {
      form.value.platform = platforms.value[0].value
    }

    await onLoadBots()
  } catch (e) {
    if ((e as any)?.code === 'bot.subscriptionRequired') {
      noAccess.value = true
    } else {
      handleApiError(e, notice, t, {component: 'BotGuide'})
    }
  } finally {
    loading.value = false
  }
}

/**
 * 按当前平台载入机器人
 */
const onLoadBots = async () => {
  const result = await apis.botApi().getBots(form.value.platform)

  bots.value = result.data?.data || []
  form.value.botId = bots.value[0]?.id || null
}

/**
 * 生成群绑定验证码
 */
const onCreateBindCode = async () => {
  if (!form.value.botId || !form.value.groupNumber) {
    notice.error(t('account.bot.guide.formInvalid'))
    return
  }
  submitting.value = true
  try {
    const result = await apis.botApi().createBindCode({
      botId: form.value.botId,
      groupNumber: form.value.groupNumber.trim()
    })

    bindCode.value = result.data?.data?.code || ''
    bindTtl.value = result.data?.data?.ttlMinutes || 30
    botJoined.value = result.data?.data?.botJoined ?? null
    codeDialog.value = true
    // notice.success(t('account.bot.guide.codeCreated'))
  } catch (e) {
    handleApiError(e, notice, t, {component: 'BotGuide'})
  } finally {
    submitting.value = false
  }
}

/**
 * 复制验证码
 */
const onCopyCode = async () => {
  try {

    await navigator.clipboard.writeText(`/群组绑定 ${bindCode.value}`)

    notice.success(t('basic.tips.copySuccess'), {mode: 'minimal'})

  } catch {
    notice.error(t('basic.tips.copyFailed'))
  }
}

/**
 * 绑定完成后刷新状态并进入管理
 */
const onCheckBound = async () => {
  try {
    const result = await apis.botApi().getStatus()

    if ((result.data?.data?.groups || 0) > 0) {

      notice.success(t('account.bot.guide.bound'), {mode: 'minimal'})
      codeDialog.value = false

      await router.push({name: 'AccountBotManage'})

    } else {
      notice.info(t('account.bot.guide.notYet'))
    }
  } catch (e) {
    handleApiError(e, notice, t, {component: 'BotGuide'})
  }
}

onMounted(onLoad)
</script>

<template>
  <v-row>
    <v-col cols="12" lg="3">
      <AffixContainerView>
        <p class="opacity-60">{{ t('account.bot.guide.subtitle') }}</p>
        <p class="opacity-60 mt-2 mb-4">{{ t('account.bot.guide.intro') }}</p>

        <v-btn variant="text" block border to="/apps/qq-bot" target="_blank">
          {{ t('account.bot.guide.openBotDoc') }}
          <v-icon icon="mdi-open-in-new" size="16" class="ml-1"></v-icon>
        </v-btn>
      </AffixContainerView>
    </v-col>
    <v-col cols="12" lg="9">
      <v-row class="mb-10">
        <v-col cols="12" md="4">
          <div class="step-card">
            <span class="step-index text-h1 text-amber opacity-10">#1</span>
            <p class="step-title text-amber">{{ t('account.bot.guide.step1Title') }}</p>
            <p class="mb-0">{{ t('account.bot.guide.step1Desc') }}</p>
          </div>
        </v-col>
        <v-col cols="12" md="4">
          <div class="step-card">
            <span class="step-index text-h1 text-amber opacity-10">#2</span>
            <p class="step-title text-amber">{{ t('account.bot.guide.step2Title') }}</p>
            <p class="mb-0">{{ t('account.bot.guide.step2Desc') }}</p>
          </div>
        </v-col>
        <v-col cols="12" md="4">
          <div class="step-card">
            <span class="step-index text-h1 text-amber opacity-10">#3</span>
            <p class="step-title text-amber">{{ t('account.bot.guide.step3Title') }}</p>
            <p class="mb-0">{{ t('account.bot.guide.step3Desc') }}</p>
          </div>
        </v-col>
      </v-row>

      <AffixBoxHasTitleView v-if="!noAccess">
        <template v-slot:title>
          {{ t('account.bot.guide.bindTitle') }}
        </template>
        <p class="mb-4">{{ t('account.bot.guide.bindDesc') }}</p>

        <v-row>
          <v-col cols="12" md="6">
            <v-select
                v-model="form.platform"
                :items="platforms"
                item-title="label"
                item-value="value"
                :label="t('account.bot.guide.platform')"
                @update:model-value="onLoadBots"></v-select>
          </v-col>
          <v-col cols="12" md="6">
            <v-select
                v-model="form.botId"
                :items="bots"
                :item-title="onBotTitle"
                item-value="id"
                :label="t('account.bot.guide.bot')"
                variant="filled"
                clearable></v-select>
          </v-col>
          <v-col cols="12" md="6">
            <v-text-field
                type="number"
                v-model="form.groupNumber"
                :label="t('account.bot.guide.groupNumber')"
                variant="filled"
                clearable></v-text-field>
          </v-col>
        </v-row>

        <div class="d-flex mt-4">
          <v-btn color="amber" variant="flat" :loading="submitting" @click="onCreateBindCode">
            {{ t('account.bot.guide.generateCode') }}
          </v-btn>
        </div>
      </AffixBoxHasTitleView>

      <v-dialog v-model="codeDialog" width="520">
        <v-card border>
          <v-card-title class="py-10 text-center bg-black mx-n5">
            <v-icon size="80">mdi-code-tags</v-icon>
            <p>{{ t('account.bot.guide.codeDialogTitle') }}</p>
          </v-card-title>
          <v-divider opacity=".08"></v-divider>
          <v-card-text>
            <p class="mb-3">{{ t('account.bot.guide.codeHint', {minutes: bindTtl}) }}</p>

            <v-text-field readonly hide-spin-buttons hide-details :value="`/群组绑定 ${bindCode}`">
              <template v-slot:append-inner>
                <v-btn variant="text" color="amber" @click="onCopyCode">
                  {{ t('account.bot.guide.copyCommand') }}
                </v-btn>
              </template>
            </v-text-field>

            <v-alert v-if="botJoined === false" variant="tonal" color="orange" density="compact" class="mt-4">
              {{ t('account.bot.guide.botNotJoined') }}
            </v-alert>
            <v-alert v-else-if="botJoined === true" variant="tonal" color="success" density="compact" class="mt-4">
              {{ t('account.bot.guide.botJoined') }}
            </v-alert>


            <p class="text-caption opacity-70 mt-4 mb-0">{{ t('account.bot.guide.codeUsage') }}</p>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn variant="text" @click="codeDialog = false">{{ t('basic.button.close') }}</v-btn>
            <v-btn variant="tonal" color="amber" @click="onCheckBound">
              {{ t('account.bot.guide.checkBound') }}
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <AffixBoxHasTitleView class="mt-10">
        <template v-slot:title>
          {{ t('account.bot.guide.usageTitle') }}
        </template>

        <v-row>
          <v-col cols="12" md="6">
            <p class="mb-2">{{ t('account.bot.noAccess') }}</p>
            <router-link :to="{name: 'PortalSettingSubscriptions'}">
              {{ t('account.bot.subscribeNow') }}
            </router-link>
          </v-col>
        </v-row>
      </AffixBoxHasTitleView>
    </v-col>
  </v-row>
</template>

<style scoped lang="less">
@import "@/assets/styles/link";

.step-card {
  position: relative;
  height: 100%;
  padding: 50px 18px 0 18px;

  .step-index {
    position: absolute;
    left: 0;
    top: -40px;
  }

  .step-title {
    font-weight: 600;
    margin-bottom: 4px;
  }
}
</style>
