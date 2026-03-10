<script setup lang="ts">
import {onMounted, ref, watch, computed} from "vue";
import {apis, sessionUserInfo} from "@/assets/sripts/index";
import {ApiError} from "@/assets/types/Api";
import {useI18n} from "vue-i18n";
import {useNoticeStore} from "~/stores/noticeStore";

import Silk from "@/components/Silk.vue";
import Textarea from "@/components/textarea/index.vue";
import RolesTagWidget from "@/components/RolesTagWidget.vue";
import UserAvatar from "@/components/UserAvatar.vue";
import {AccountCardWidgetProps} from "@/assets/types/User";

const props = withDefaults(defineProps<AccountCardWidgetProps>(), {id: null}),
    notice = useNoticeStore(),
    {t} = useI18n()

let loading = ref(false),
    model = ref(false),
    userInfoData = ref({})

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
    if (e instanceof ApiError) {
      notice.error(t(`basic.tips.${e.code}`, {
        context: e.code
      }))
    }
    console.error(e)
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
    <v-card border class="py-5 overflow-hidden" min-width="400" max-width="600" min-height="200">
      <v-card height="180px" variant="text" class="mt-n10 mx-n10">
        <Silk
            :speed="4"
            :scale="1.2"
            :color="'#1c1c1c'"
            :noise-intensity="0.1"
            :rotation="-.6"
            class="bg-black"></Silk>
      </v-card>
      <v-divider></v-divider>
      <v-card-text>
        <v-row align="center">
          <v-btn variant="text"
                 class="px-0 h-auto"
                 :to="`/space/${userInfo.userId || id}`">
            <v-row align="center" no-gutters>
              <v-col cols="auto" v-if="userInfo.userAvatar">
                <v-avatar size="50" class="mr-3">
                  <UserAvatar size="50" :src="userInfo.userAvatar"></UserAvatar>
                </v-avatar>
              </v-col>
              <v-col>
                <div class="text-h5 text-amber">{{ userInfo.username }}</div>
              </v-col>
            </v-row>
          </v-btn>

          <RolesTagWidget :data="userInfo.role" v-if="userInfo.role" class="mb-3 mt-1"></RolesTagWidget>

          <Textarea
              readonly
              class="text-caption opacity-60"
              min-height="120"
              :value="userInfo.attr?.introduction"></Textarea>

          <v-btn class="mt-6" variant="tonal" :to="`/space/${userInfo.userId || id}`" block>
            {{ t('space.title') }}
          </v-btn>
        </v-row>
      </v-card-text>
    </v-card>
  </v-menu>
</template>

<style scoped lang="less">

</style>
