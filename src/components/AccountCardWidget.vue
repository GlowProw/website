<script setup lang="ts">
import {computed, ref, watch} from "vue";
import {apis, sessionUserInfo} from "@/assets/sripts/index";
import {useI18n} from "vue-i18n";
import {useNoticeStore} from "~/stores/noticeStore";
import {handleApiError} from "@/assets/sripts/error_handler";

import Silk from "@/components/Silk.vue";
import RolesTagWidget from "@/components/RolesTagWidget.vue";
import UserAvatar from "@/components/UserAvatar.vue";
import AccountAchievementWidget from "@/components/AccountAchievementWidget.vue";
import Textarea from "@/components/textarea/index.vue";
import {AccountCardWidgetProps, SpaceUserResult} from "@/assets/types/User";
import {useAuthStore} from "~/stores/userAccountStore";
import {useTooltipFollow} from "@/assets/sripts/use_tooltip_follow";
import Banner from "@/components/Banner.vue";

const props = withDefaults(defineProps<AccountCardWidgetProps>(), {id: null}),
    notice = useNoticeStore(),
    authStore = useAuthStore(),
    {t} = useI18n(),
    {tooltipPos, onMouseMove, onMouseEnter} = useTooltipFollow()

let loading = ref(false),
    model = ref(false),
    userInfoData = ref<Partial<SpaceUserResult>>({});

/**
 * 获取用户数据
 */
const getUserInfo = async () => {
  try {
    if (!props.id || loading.value)
      return;

    loading.value = true

    const sessionUserData = sessionUserInfo.getUserInfoItem('user', props.id)

    // 读取会话数据
    if (sessionUserData.id) {
      userInfoData.value = sessionUserData
      return
    }

    const result = await apis.userApi().getUserInfo(<string>props.id),
        d = result.data

    userInfoData.value = d.data;

    sessionUserInfo.updateConfiguration('user', props.id, d.data)
  } catch (e) {
    handleApiError(e, notice, t, {component: 'AccountCardWidget'})
  } finally {
    loading.value = false
  }
}

// 仅当用户 hover 展开气泡卡片且未拉取过时，才请求用户信息
watch(() => model.value, (value) => {
  if (value && userInfoData.value.id == null) {
    getUserInfo();
  }
});

const userInfo = computed(() => userInfoData.value as any);

defineOptions({
  name: 'AccountCardWidget',
});
</script>

<template>
  <v-tooltip v-model="model"
             scroll-strategy="close"
             transition="opacity 300ms ease-in"
             location="right top"
             min-width="450"
             max-width="450"
             interactive
             class="item-card"
             content-class="pa-0 bg-transparent"
             :offset="[50,0]"
             :target="[tooltipPos.x, tooltipPos.y]">
    <template v-slot:activator="{ props }">
      <div class="bg-transparent d-flex ga-2 align-center"
           @mousemove="onMouseMove"
           @mouseenter="onMouseEnter"
           v-bind="props">
        <slot></slot>
      </div>
    </template>
    <v-card v-if="model"
            class="border border-opacity-0 overflow-hidden elevation-24"
            elevation="24"
            min-width="400"
            max-width="600"
            min-height="200">
      <Banner>
        <v-card height="260px" variant="text" class="mt-n5 mx-n10">
          <template v-slot:image>
            <Silk
                :speed="4"
                :scale=".7"
                :color="'#1c1c1c'"
                :noise-intensity="0.1"
                :rotation="-.6"
                class="bg-black"></Silk>
          </template>

          <div class="mx-auto mt-16">
            <UserAvatar :size="100" :src="userInfo.userAvatar" class="d-block mx-auto rounded-circle"></UserAvatar>

            <router-link variant="text"
                         class="px-0 h-auto"
                         :to="`/space/${userInfo.userId || id}`">
              <div class="text-center">
                <p class="text-h4 u">{{ userInfo.username || t('assembly.anonymous') }}</p>
              </div>
            </router-link>
          </div>
        </v-card>
      </Banner>

      <v-divider opacity=".06"></v-divider>

      <v-card-text class="pt-10 pb-6 px-10 background-flavor">
        <div class="w-100 mb-6 text-body-2 text-medium-emphasis text-break" style="white-space: pre-wrap;">
          <Textarea readonly min-height="auto" :value="userInfo.attr?.introduction || '🚢 🌊🌊🌊'"></Textarea>
        </div>

        <AccountAchievementWidget v-if="userInfo.userId || id"
                                  :user-id="String(userInfo.userId || id)"/>

        <RolesTagWidget :data="userInfo.role" v-if="userInfo.role" class="mt-6"></RolesTagWidget>
      </v-card-text>

      <v-card-actions class="px-2 bg-black">
        <v-spacer></v-spacer>
        <v-btn variant="tonal"
               class="px-5"
               :to="`/space/${userInfo.userId || id}`">
          {{ t('space.title') }}
        </v-btn>

        <!-- 发私信入口 S -->
        <v-btn variant="tonal"
               class="px-5"
               :v-tooltip="t('space.sendMessage')"
               v-if="authStore.isLogin && (userInfoData?.attr?.dmEnabled !== false)"
               :to="`/account/messages?peerId=${userInfo.userId || id}`">
          <v-icon>mdi-message-outline</v-icon>
        </v-btn>
        <!-- 发私信入口 E -->
      </v-card-actions>
    </v-card>
  </v-tooltip>
</template>

<style scoped lang="less">

</style>
