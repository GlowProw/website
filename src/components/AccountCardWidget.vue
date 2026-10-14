<script setup lang="ts">
import {computed, ref, watch} from "vue";
import {apis, sessionUserInfo} from "@/assets/sripts/index";
import {useI18n} from "vue-i18n";
import {useNoticeStore} from "~/stores/noticeStore";
import {handleApiError} from "@/assets/sripts/error_handler";

import Silk from "@/components/Silk.vue";
import Textarea from "@/components/textarea/index.vue";
import RolesTagWidget from "@/components/RolesTagWidget.vue";
import UserAvatar from "@/components/UserAvatar.vue";
import {AccountCardWidgetProps, SpaceUserResult} from "@/assets/types/User";
import {useAuthStore} from "~/stores/userAccountStore";

const props = withDefaults(defineProps<AccountCardWidgetProps>(), {id: null}),
    notice = useNoticeStore(),
    authStore = useAuthStore(),
    {t} = useI18n()

let loading = ref(false),
    model = ref(false),
    userInfoData = ref<Partial<SpaceUserResult>>({});

watch(() => model.value, (value) => {
  if (value)
    getUserInfo()
})

watch(() => props.id, (value) => {
  if (value)
    getUserInfo()
}, {deep: true})

/**
 * 获取用户数据
 */
const getUserInfo = async () => {
  try {
    if (!props.id)
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

const userInfo = computed(() => userInfoData.value as any)

defineOptions({
  name: 'AccountCardWidget'
})
</script>

<template>
  <v-menu content-class="pa-0"
          v-model="model"
          class="bg-transparent"
          :offset="[15, 0]"
          open-on-click>
    <template v-slot:activator="{ props }">
      <div class="bg-transparent d-flex ga-2 align-center"
           v-bind="props">
        <slot></slot>
      </div>
    </template>
    <v-card border class="overflow-hidden" min-width="400" max-width="600" min-height="200">
      <v-card height="180px" variant="text" class="mt-n5 mx-n10">
        <Silk
            :speed="4"
            :scale="1.2"
            :color="'#1c1c1c'"
            :noise-intensity="0.1"
            :rotation="-.6"
            class="bg-black"></Silk>
      </v-card>

      <v-divider></v-divider>
      <div class="mx-auto mt-n14 " v-if="userInfo.userAvatar">
        <UserAvatar size="100" :src="userInfo.userAvatar" class="mx-auto rounded-circle border overflow-hidden"></UserAvatar>
      </div>

      <v-card-text class="px-6">
        <router-link variant="text"
                     class="px-0 h-auto"
                     :to="`/space/${userInfo.userId || id}`">
          <div class="text-amber text-center">
            <p class="text-h5 u">{{ userInfo.username }}</p>
            <RolesTagWidget :data="userInfo.role" v-if="userInfo.role" class="mt-2"></RolesTagWidget>
          </div>

          <Textarea
              readonly
              class="text-caption opacity-60 mt-3 w-100"
              min-height="120"
              :value="userInfo.attr?.introduction || '🚢 🌊🌊🌊'"></Textarea>
        </router-link>
      </v-card-text>

      <v-divider></v-divider>

      <v-card-actions class="px-2">
        <v-spacer></v-spacer>
        <v-btn variant="flat"
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
  </v-menu>
</template>

<style scoped lang="less">

</style>
