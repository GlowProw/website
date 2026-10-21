<script setup lang="ts">
import {computed} from "vue";
import {storeToRefs} from "pinia";
import {useAuthStore} from "~/stores/userAccountStore";
import {useI18n} from "vue-i18n";
import {useRoute, useRouter} from "vue-router";
import ItemSlotBase from "@/components/snbWidget/ItemSlotBase.vue";
import {useMessagesUnreadStore} from "~/stores/messagesUnreadStore";
import {useMessagesDrawerStore} from "~/stores/messagesDrawerStore";
import {useAppStore} from "~/stores/appStore";
import {storage} from "@/assets/sripts";
import languagesConfig, {DEFAULT_LANG, SUPPORTED_LANGS} from "@/config/languages";
import type {HeaderAccountType} from "@/assets/types/User";
import UserAvatar from "@/components/UserAvatar.vue";

const authStore = useAuthStore(),
    {t, locale} = useI18n(),
    route = useRoute(),
    router = useRouter(),
    props = defineProps<{ type: HeaderAccountType }>()

// 未读数统一由全局状态机轮询，多个 HeaderAccount 实例共享同一份数据、同一个定时器
const unreadStore = useMessagesUnreadStore();
const {unreadCount} = storeToRefs(unreadStore);
unreadStore.start();

// 全局私信侧边抽屉
const messagesDrawerStore = useMessagesDrawerStore();
const appStore = useAppStore();

/**
 * 打开私信侧边抽屉
 */
const openMessagesDrawer = (): void => {
  appStore.headerDrawer = false;
  messagesDrawerStore.setOpen(true);
};

const languages = languagesConfig.child;
const currentLang = computed(() => locale.value || DEFAULT_LANG);

// 语言切换逻辑与设置页 i18nWidget 保持一致：落本地、换 locale、替换路由语言前缀
const onChangeLang = (targetLang: string): void => {
  if (!targetLang || targetLang === locale.value) return;

  storage.local.set('lang', {value: targetLang});
  locale.value = targetLang;

  const currentPath = route.path || '/';
  const langRegex = new RegExp('^/(' + SUPPORTED_LANGS.join('|') + ')');
  const cleanPath = currentPath.replace(langRegex, '') || '';
  const newPath = `/${targetLang}${cleanPath.startsWith('/') ? cleanPath : (cleanPath ? '/' + cleanPath : '')}`;

  const newQuery = {...route.query};
  delete newQuery.lang;

  router.replace({
    path: newPath,
    query: newQuery,
    hash: route.hash,
  }).catch(() => {
  });
};

/**
 * 退出登录并返回首页
 */
const onLogout = (): void => {
  authStore.logout();
  router.push('/').catch(() => {
  });
};

// 当前登录用户的专属个人空间地址
const userSpaceRoute = computed(() => {
  const uid = authStore.user?.userId;
  return uid ? `/space/${uid}` : '/space';
});
</script>

<template>
  <div>
    <template v-if="type == 'header'">
      <div class="hidden-sm d-flex align-center ga-1">
        <!-- 头像菜单 -->
        <v-menu v-if="authStore.isLogin"
                open-on-hover
                :open-on-click="false"
                location="bottom end"
                :close-on-content-click="true">
          <template v-slot:activator="{ props: menuProps }">
            <v-icon-btn
                class="rounded-circle"
                :to="{ name: 'AccountInformation' }"
                v-bind="menuProps">
              <UserAvatar :src="authStore.user.userAvatar" v-if="authStore.user.userAvatar" :size="40"></UserAvatar>
              <v-avatar color="grey-darken-2" size="40" v-else>
                <span>{{ authStore.currentUser[0].toUpperCase() || 'U' }}</span>
              </v-avatar>
            </v-icon-btn>
          </template>

          <v-list min-width="260" class="pa-1" border rounded="lg">
            <v-list-item :to="{ name: 'AccountInformation' }"
                         prepend-icon="mdi-account-circle-outline" rounded="lg">
              <v-list-item-title>{{ t('header.accountMenu.personalCenter') }}</v-list-item-title>
            </v-list-item>

            <v-list-item :to="userSpaceRoute"
                         prepend-icon="mdi-dock-window" rounded="lg">
              <v-list-item-title>{{ t('header.accountMenu.userSpace') }}</v-list-item-title>
            </v-list-item>

            <v-list-item :to="{ name: 'AccountDataCenter' }"
                         prepend-icon="mdi-creation" rounded="lg">
              <v-list-item-title>{{ t('header.accountMenu.creatorCenter') }}</v-list-item-title>
            </v-list-item>

            <v-list-item :to="{ name: 'AccountMessages' }"
                         prepend-icon="mdi-message-text-outline" rounded="lg">
              <v-list-item-title>{{ t('header.accountMenu.messageCenter') }}</v-list-item-title>
              <template v-slot:append v-if="unreadCount > 0">
                <span class="unread-badge">{{ unreadCount > 99 ? '99+' : unreadCount }}</span>
              </template>
            </v-list-item>

            <v-list-item :to="{ name: 'AccountCheckin' }"
                         prepend-icon="mdi-calendar-check-outline" rounded="lg">
              <v-list-item-title>{{ t('header.accountMenu.signin') }}</v-list-item-title>
            </v-list-item>

            <v-list-item :to="{ path: '/account/orders' }"
                         prepend-icon="mdi-receipt-text-outline" rounded="lg">
              <v-list-item-title>{{ t('header.accountMenu.orders') }}</v-list-item-title>
            </v-list-item>

            <v-list-item :to="{ path: '/account/security' }"
                         prepend-icon="mdi-shield-lock-outline" rounded="lg">
              <v-list-item-title>{{ t('header.accountMenu.security') }}</v-list-item-title>
            </v-list-item>

            <v-list-item :to="{ path: '/setting/subscriptions' }"
                         prepend-icon="mdi-crown-outline" rounded="lg">
              <v-list-item-title>{{ t('header.accountMenu.subscriptions') }}</v-list-item-title>
            </v-list-item>

            <v-divider class="my-1"></v-divider>

            <!-- 切换语言 S -->
            <v-menu open-on-hover :open-on-click="false" location="left top">
              <template v-slot:activator="{ props: subProps }">
                <v-list-item v-bind="subProps" prepend-icon="mdi-translate" rounded="lg">
                  <v-list-item-title>{{ t('header.accountMenu.switchLanguage') }}</v-list-item-title>
                  <template v-slot:append>
                    <v-icon icon="mdi-chevron-right" size="small" class="opacity-60"></v-icon>
                  </template>
                </v-list-item>
              </template>
              <v-list density="compact" min-width="170" class="pa-1" border rounded="lg">
                <v-list-item v-for="langItem in languages"
                             :key="langItem.value"
                             rounded="lg"
                             @click="onChangeLang(langItem.value)">
                  <v-list-item-title>{{ langItem.label }}</v-list-item-title>
                  <template v-slot:append>
                    <v-icon v-if="langItem.value === currentLang"
                            icon="mdi-check" size="small" color="amber"></v-icon>
                  </template>
                </v-list-item>
              </v-list>
            </v-menu>
            <!-- 切换语言 E -->

            <v-divider class="my-1"></v-divider>

            <v-list-item prepend-icon="mdi-logout"
                         color="error" rounded="lg"
                         @click="onLogout">
              <v-list-item-title>{{ t('header.accountMenu.logout') }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>

        <v-btn block variant="text" to="/account/signin" v-else>
          {{ t('signin.title') }}
        </v-btn>

        <!-- 私信入口 -->
        <v-btn icon v-if="authStore.isLogin"
               :aria-label="t('header.accountMenu.messageCenter')"
               @click="openMessagesDrawer">
          <v-badge v-if="unreadCount > 0" :content="unreadCount > 99 ? '99+' : unreadCount" color="red" floating dot>
            <v-icon icon="mdi-message-outline"></v-icon>
          </v-badge>
          <v-icon v-else icon="mdi-message-outline"></v-icon>
        </v-btn>
      </div>
    </template>

    <template v-if="type == 'header-drawer'">
      <template v-if="authStore.isLogin">
        <router-link to="/account/information">
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

        <!-- 移动端私信入口 -->
        <v-list-item @click="openMessagesDrawer">
          <v-list-item-title>{{ t('header.accountMenu.messageCenter') }}</v-list-item-title>
          <template v-slot:prepend>
            <v-icon icon="mdi-message-outline"></v-icon>
          </template>
          <template v-slot:append v-if="unreadCount > 0">
            <span class="unread-badge">{{ unreadCount > 99 ? '99+' : unreadCount }}</span>
          </template>
        </v-list-item>
      </template>

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
.unread-badge {
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 9px;
  background: rgb(var(--v-theme-error));
  color: #fff;
  font-size: 11px;
  line-height: 18px;
  text-align: center;
}
</style>
