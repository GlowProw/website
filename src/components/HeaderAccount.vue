<script setup lang="ts">
import {storeToRefs} from "pinia";
import {useAuthStore} from "~/stores/userAccountStore";
import {useI18n} from "vue-i18n";
import ItemSlotBase from "@/components/snbWidget/ItemSlotBase.vue";
import {useMessagesUnreadStore} from "~/stores/messagesUnreadStore";

type HeaderAccountType = 'header-drawer' | 'header'

const authStore = useAuthStore(),
    {t} = useI18n(),
    props = defineProps<{ type: HeaderAccountType }>()

// 未读数统一由全局状态机轮询，多个 HeaderAccount 实例共享同一份数据、同一个定时器
const unreadStore = useMessagesUnreadStore();
const {unreadCount} = storeToRefs(unreadStore);
unreadStore.start();
</script>

<template>
  <div>
    <template v-if="type == 'header'">
      <div class="hidden-sm d-flex align-center">
        <v-btn to="/account/information" density="comfortable" icon class="mr-3" v-if="authStore.isLogin">
          <v-avatar
              color="grey-darken-2"
              size="32">
            <v-img :src="authStore.user.userAvatar" v-if="authStore.user.userAvatar"></v-img>
            <span v-else>{{ authStore.currentUser[0].toUpperCase() || 'U' }}</span>
          </v-avatar>
        </v-btn>
        <v-btn block variant="text" to="/account/signin" v-else>
          {{ t('signin.title') }}
        </v-btn>

        <!-- 私信入口 -->
        <v-btn to="/account/messages" density="comfortable" icon class="mr-2" v-if="authStore.isLogin">
          <v-badge v-if="unreadCount > 0" :content="unreadCount > 99 ? '99+' : unreadCount" color="red" floating dot>
            <v-icon icon="mdi-message-outline"></v-icon>
          </v-badge>
          <v-icon v-else icon="mdi-message-outline"></v-icon>
        </v-btn>
      </div>
    </template>

    <template v-if="type == 'header-drawer'">
      <router-link to="/account/information" v-if="authStore.isLogin">
        <v-list-item link href="/account">
          <span class="u">{{ authStore.currentUser }}</span>
          <template v-slot:prepend>
            <ItemSlotBase size="40px" class="mr-2 d-flex align-center justify-center">
              <v-img :src="authStore.user.userAvatar" v-if="authStore.user.userAvatar"></v-img>
              <span v-else>{{ authStore.currentUser[0].toUpperCase() || 'U' }}</span>
            </ItemSlotBase>
          </template>
        </v-list-item>
      </router-link>
      <template v-else>
        <v-list-item link href="/account/signin" target="_blank">
          {{ t('signin.title') }}
          <template v-slot:prepend>
            <ItemSlotBase size="40px" class="mr-2 d-flex align-center justify-center">
              <v-icon icon="mdi-open-in-new" size="25"></v-icon>
            </ItemSlotBase>
          </template>
        </v-list-item>
      </template>
    </template>
  </div>
</template>

<style scoped>
</style>
