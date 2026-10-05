<script setup lang="ts">
import {onMounted, ref} from "vue";
import {useAuthStore} from "~/stores/userAccountStore";
import {useI18n} from "vue-i18n";

import UserAvatar from "@/components/UserAvatar.vue";
import AffixBoxHasTitleView from "@/components/AffixBoxHasTitleView.vue";

const authStore = useAuthStore(),
    {t} = useI18n()

let userAccountData = ref<any>({})

onMounted(() => {
  getUserAccount()
})

const getUserAccount = async () => {
  userAccountData.value = authStore.user || {};
}

defineOptions({
  name: 'AccountProfilePicture'
})
</script>

<template>
  <div>
    <!-- 顶部标题 S -->
    <div class="mb-6">
      <p class="text-caption opacity-60 mt-1">
        {{ t('account.profile-picture.description') }}
      </p>
    </div>
    <!-- 顶部标题 E -->

    <v-row>
      <!-- 头像服务说明卡片 S -->
      <v-col cols="12" lg="5">
        <AffixBoxHasTitleView>
          <div class="d-flex align-center mb-4">
            <div>
              <h3 class="text-body-1 font-weight-bold">{{ t('account.profile-picture.serviceTitle') }}</h3>
              <p class="text-caption opacity-60">{{ t('account.profile-picture.serviceSubtitle') }}</p>
            </div>
          </div>

          <v-alert
              v-if="userAccountData && userAccountData?.email"
              type="info"
              variant="tonal"
              density="compact"
              class="mb-4 text-caption">
            {{ t('account.profile-picture.associatedEmailNotification', {email: userAccountData?.email}) }}
          </v-alert>

          <p class="text-caption opacity-70 mb-5">
            {{ t('account.profile-picture.serviceDesc') }}
          </p>

          <div class="d-flex align-center ga-2">
            <v-btn
                color="amber"
                variant="tonal"
                size="small"
                prepend-icon="mdi-open-in-new"
                :href="userAccountData?.userAvatar ? 'https://gravatar.com/connect/' : 'https://gravatar.com/connect/?gravatar_from=signup'"
                target="_blank">
              {{ t('account.profile-picture.goToGravatar') }}
            </v-btn>
          </div>

          <template v-slot:title>
            {{ t('account.profile-picture.title') }}
          </template>
        </AffixBoxHasTitleView>
      </v-col>
      <!-- 头像服务说明卡片 E -->

      <!-- 多尺寸预览卡片 S -->
      <v-col cols="12" lg="7">
        <AffixBoxHasTitleView>
          <p class="text-caption opacity-60 mb-4">
            {{ t('account.profile-picture.previewDesc') }}
          </p>

          <v-row align="end" class="ga-3">
            <v-col cols="auto" v-for="size in [120, 80, 56, 40, 28]" :key="size">
              <div class="text-center">
                <v-card border rounded="lg" class="pa-1 d-inline-block bg-surface mb-2">
                  <UserAvatar :src="userAccountData.userAvatar" v-if="userAccountData.userAvatar" :size="size"></UserAvatar>
                  <v-avatar v-else :size="size">
                    <v-icon icon="mdi-account" :size="size * 0.6"></v-icon>
                  </v-avatar>
                </v-card>
                <div class="text-caption opacity-50 font-weight-bold">{{ size }}px</div>
              </div>
            </v-col>
          </v-row>

          <template v-slot:title>
            {{ t('account.profile-picture.previewTitle') }}
          </template>
        </AffixBoxHasTitleView>
      </v-col>
      <!-- 多尺寸预览卡片 E -->
    </v-row>
  </div>
</template>

<style scoped lang="less">
</style>
