<script setup lang="ts">
import {computed, onMounted, ref} from "vue";
import {useI18n} from "vue-i18n";
import {useMessagesApi} from "@/assets/sripts/api/messages_service";
import {useAuthStore} from "~/stores/userAccountStore";
import type {UserAttr} from "@/assets/types/User";
import AffixBoxHasTitleView from "@/components/AffixBoxHasTitleView.vue";

const {t} = useI18n();
const auth = useAuthStore();
const messagesApi = useMessagesApi();

const userAccountData = ref<{ attr: Partial<UserAttr> }>({attr: {}});
const saveStatus = ref<'idle' | 'saving' | 'saved'>('idle');

const attr = computed(() => userAccountData.value.attr || {});

onMounted(async () => {
  try {
    // 直接从 auth store 里拿 — account/info 接口的 attr 字段
    const rawAttr = (auth.user as any)?.attr || {};
    userAccountData.value.attr = typeof rawAttr === 'string' ? JSON.parse(rawAttr || '{}') : {dmEnabled: true, notifyMessage: true, notifyReply: true, notifyLike: true, ...rawAttr};
  } catch (e) {
    console.warn('[MessagesSettings] 加载用户信息失败:', e);
    userAccountData.value.attr = {dmEnabled: true, notifyMessage: true, notifyReply: true, notifyLike: true};
  }
});

const saveSettings = async () => {
  saveStatus.value = 'saving';
  try {
    await messagesApi.updateSettings({
      dmEnabled: userAccountData.value.attr.dmEnabled,
      notifyMessage: userAccountData.value.attr.notifyMessage,
      notifyReply: userAccountData.value.attr.notifyReply,
      notifyLike: userAccountData.value.attr.notifyLike,
    });
    saveStatus.value = 'saved';
    setTimeout(() => {
      saveStatus.value = 'idle';
    }, 2000);
  } catch (e) {
    console.warn('[MessagesSettings] 保存失败:', e);
    saveStatus.value = 'idle';
  }
};

defineOptions({
  name: 'AccountMessagesSettings'
});
</script>

<template>
  <AffixBoxHasTitleView class="mx-auto max-w-700">
    <div class="text-caption text-grey">{{ t('account.messages.settings.subtitle') }}</div>

    <div>
      <!-- 私信开关 -->
      <v-list density="compact" class="bg-transparent">
        <v-list-item class="px-6 py-4">
          <v-list-item-title class="text-body-2 font-weight-medium">
            {{ t('account.information.form.dmEnabled.name') }}
          </v-list-item-title>
          <v-list-item-subtitle>
            {{ t('account.information.form.dmEnabled.description') }}
          </v-list-item-subtitle>
          <template v-slot:append>
            <v-switch
                v-model="userAccountData.attr.dmEnabled"
                inset color="amber">
            </v-switch>
          </template>
        </v-list-item>

        <v-divider></v-divider>

        <!-- 通知提醒 -->
        <template v-if="attr.dmEnabled !== false">
          <v-list-item class="px-6 py-4">
            <v-list-item-title class="text-body-2 font-weight-medium">
              {{ t('account.information.form.notifyMessage.name') }}
            </v-list-item-title>
            <v-list-item-subtitle>
              {{ t('account.messages.settings.notifyMessageDesc') }}
            </v-list-item-subtitle>
            <template v-slot:append>
              <v-switch v-model="userAccountData.attr.notifyMessage" inset color="amber"></v-switch>
            </template>
          </v-list-item>

          <v-list-item class="px-6 py-4">
            <v-list-item-title class="text-body-2 font-weight-medium">
              {{ t('account.information.form.notifyReply.name') }}
            </v-list-item-title>
            <v-list-item-subtitle>
              {{ t('account.messages.settings.notifyReplyDesc') }}
            </v-list-item-subtitle>
            <template v-slot:append>
              <v-switch v-model="userAccountData.attr.notifyReply" inset color="amber"></v-switch>
            </template>
          </v-list-item>

          <v-list-item class="px-6 py-4">
            <v-list-item-title class="text-body-2 font-weight-medium">
              {{ t('account.information.form.notifyLike.name') }}
            </v-list-item-title>
            <v-list-item-subtitle>
              {{ t('account.messages.settings.notifyLikeDesc') }}
            </v-list-item-subtitle>
            <template v-slot:append>
              <v-switch v-model="userAccountData.attr.notifyLike" inset color="amber"></v-switch>
            </template>
          </v-list-item>
        </template>

        <v-list-item v-else class="px-6 py-6 text-center text-caption text-grey">
          {{ t('account.messages.settings.dmDisabledHint') }}
        </v-list-item>
      </v-list>
    </div>

    <v-card-actions class="pa-4 d-flex justify-end gap-2">
      <span v-if="saveStatus === 'saved'" class="text-green text-caption mr-2">已保存</span>
      <v-btn
          v-if="saveStatus !== 'idle'"
          disabled
          variant="tonal" color="amber">
        {{ saveStatus === 'saving' ? '保存中...' : '已保存' }}
      </v-btn>
      <v-btn
          v-else
          color="amber"
          variant="tonal"
          @click="saveSettings">
        {{ t('account.messages.settings.save') }}
      </v-btn>
    </v-card-actions>

    <template v-slot:title>
      {{ t('account.messages.settings.title') }}
    </template>
  </AffixBoxHasTitleView>
</template>
