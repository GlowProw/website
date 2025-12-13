<script setup lang="ts">

import {onMounted, Ref, ref} from "vue";
import {useAuthStore} from "~/stores/userAccountStore";
import {useI18n} from "vue-i18n";

import UserAvatar from "@/components/UserAvatar.vue";

const authStore = useAuthStore(),
    {t} = useI18n()

let userAccountData = ref({})

onMounted(() => {
  getUserAccount()
})

/**
 * 获取账户信息
 */
const getUserAccount = async () => {
  userAccountData.value = authStore.user;
}
</script>

<template>
  <div>
    <div class="font-weight-bold text-h5 ">{{ t('account.profile-picture.title') }}</div>
    <p class="text-caption text-grey opacity-80 mb-10">{{ t('account.profile-picture.description') }} </p>

    <v-row type="flex" align="end">
      <v-col flex="1">
        <a href="https://gravatar.com" target="_blank">
          <svg class="ivu-icon" xmlns="http://www.w3.org/2000/svg" width="22" height="22"
               viewBox="0 0 27 27" role="presentation"
               aria-hidden="true">
            <path
                fill="#fff"
                d="M10.8 2.699v9.45a2.699 2.699 0 005.398 0V5.862a8.101 8.101 0 11-8.423 1.913 2.702 2.702 0 00-3.821-3.821A13.5 13.5 0 1013.499 0 2.699 2.699 0 0010.8 2.699z"></path>
          </svg>
        </a>
      </v-col>
      <v-col>
        <a :href="userAccountData?.userAvatar ? 'https://gravatar.com/connect/' : 'https://gravatar.com/connect/?gravatar_from=signup'"
           target="_blank">
          <Button>
            <Icon type="md-link" size="20"></Icon>
          </Button>
        </a>
      </v-col>
    </v-row>
    <v-row :gutter="5" type="flex" align="top">
      <v-col cols="auto" v-for="(i, index) in [150,80,50,45,30,22]" :key="index">
        <p class="mb-2 font-weight-bold">{{ i }}</p>
        <v-card>
          <UserAvatar :src="userAccountData.userAvatar" v-if="userAccountData.userAvatar" :size="i"></UserAvatar>
        </v-card>
      </v-col>
    </v-row>

    <v-alert class="mt-5" v-if="userAccountData && userAccountData?.email">
      {{ t('account.profile-picture.associatedEmailNotification', {email: userAccountData?.email}) }}
    </v-alert>
  </div>
</template>

<style scoped lang="less">

</style>
