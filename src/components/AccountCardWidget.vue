<script setup lang="ts">
import {onMounted, ref, watch} from "vue";
import {apis} from "@/assets/sripts/index";
import {ApiError} from "@/assets/types/Api";
import {useI18n} from "vue-i18n";
import {useNoticeStore} from "~/stores/noticeStore";
import Silk from "@/components/Silk.vue";
import Textarea from "@/components/textarea/index.vue";
import PrivilegesTagWidget from "@/components/PrivilegesTagWidget.vue";
import UserAvatar from "@/components/UserAvatar.vue";

const props = withDefaults(defineProps<{ id: string | null }>(), {id: null}),
    notice = useNoticeStore(),
    {t} = useI18n()

let loading = ref(false),
    userInfoData = ref({})

watch(() => props.id, (value) => {
  if (value)
    getUserInfo()
}, {deep: true})

onMounted(() => {
  getUserInfo()
})

/**
 * 获取用户数据
 */
const getUserInfo = async () => {
  try {
    if (!props.id)
      return;

    loading.value = true

    const result = await apis.userApi().getUserInfo(<string>props.id),
        d = result.data

    userInfoData.value = d.data;
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
</script>

<template>
  <v-menu content-class="pa-0"
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
      <div class="mt-5 px-5">
        <router-link
            :to="`/space/${userInfoData.userId || id}`">
          <v-row align="center">
            <v-col cols="auto" v-if="userInfoData.userAvatar">
              <v-card>
                <UserAvatar size="25" :src="userInfoData.userAvatar"></UserAvatar>
              </v-card>
            </v-col>
            <v-col>
              <div class="text-h5 text-amber">{{ userInfoData.username }}</div>
            </v-col>
          </v-row>
        </router-link>

        <PrivilegesTagWidget :data="userInfoData.privilege" v-if="userInfoData.privilege" class="mb-3 mt-1" ></PrivilegesTagWidget>

        <Textarea
            readonly
            class="text-caption opacity-60"
            min-height="120"
            :value="userInfoData?.attr?.introduction"></Textarea>

        <v-btn class="mt-6" variant="tonal" :to="`/space/${userInfoData.userId || id}`" block>
          {{ t('basic.button.go') }}
        </v-btn>
      </div>
    </v-card>
  </v-menu>
</template>

<style scoped lang="less">

</style>
