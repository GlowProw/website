<script setup lang="ts">

import {useAuthStore} from "@/../stores";
import Silk from "@/components/Silk.vue";
import {useI18n} from "vue-i18n";
import EmptyView from "@/components/EmptyView.vue";
import {useRoute, useRouter} from "vue-router";
import {onMounted, ref, watch} from "vue";
import {useDisplay} from "vuetify/framework";

const authStore = useAuthStore(),
    router = useRouter(),
    route = useRoute(),
    {t} = useI18n(),
    {width, mobile, md, sm} = useDisplay()

let drawer = ref(true),
    primaryNavMenu = ref('MeAccount'),
    navs = ref({
      'MeAccount': {
        icon: 'mdi-account',
        child: [
          {
            name: '账户信息',
            to: '/account/information',
            primaryValue: 'MeAccount'
          },
          {
            name: '账户头像',
            to: '/account/profile-picture',
            primaryValue: 'MeAccount'
          },
        ]
      },
      'MeDataList': {
        icon: 'mdi-format-list-bulleted-type',
        child: [
          {
            name: '我的配装',
            to: '/account/assemblys',
            primaryValue: 'MeDataList'
          },
          {
            name: '我的评论',
            to: '/account/comments',
            primaryValue: 'MeDataList'
          }, {
            name: '我的组队',
            to: '/account/teamups',
            primaryValue: 'MeDataList'
          }
        ]
      },
    })

watch(() => mobile.value, (value) => {
  drawer.value = !value
})

onMounted(() => {
  Object.values(navs.value).filter(i => {
    i.child.forEach(nav => {
      let primaryValue = nav.primaryValue;
      if (route.name == router.resolve(nav.to).name) {
        primaryNavMenu.value = primaryValue;
      }
    })
  })
})

const logout = () => {
  authStore.logout()

  router.push('/')
}

const onChangeMenu = (key) => {
  if (primaryNavMenu.value == key)
    return

  primaryNavMenu.value = key
  router.push(navs.value[key].child[0].to)
}
</script>

<template>
  <v-app class="mt-10">
    <v-card height="200px">
      <template v-slot:image>
        <Silk
            :speed="3"
            :scale=".7"
            :color="'#1c1c1c'"
            :noise-intensity="0.1"
            :rotation="-.6"
            class="bg-black">
        </Silk>
      </template>
      <template v-slot:append>
        <v-container class="position-relative mt-10">
          <div class="position-absolute top-0 right-0 opacity-10 d-flex ga-2">
            <v-icon icon="mdi-account" size="200"></v-icon>
          </div>
        </v-container>
      </template>
      <template v-slot:text>
        <v-container>
          <v-toolbar class="bg-transparent">
            <template v-if="authStore.isLogin">
              <h1>Hi, {{ authStore.currentUser || 'none' }}</h1>
            </template>
            <template v-else>
              未登陆
            </template>

            <v-spacer></v-spacer>
            <v-toolbar-items>
            </v-toolbar-items>
          </v-toolbar>
        </v-container>
      </template>
    </v-card>

    <v-divider></v-divider>

    <div class="pt-0 pb-0" v-if="authStore.isLogin">
      <v-layout>
        <v-navigation-drawer v-model="drawer"
                             temporary
                             permanent
                             rail
                             class="bg-black"
                             color="var(--v-theme-background)">
          <v-list density="compact"
                  nav
                  v-model="primaryNavMenu">
            <v-list-item
                v-for="(v, key) in navs" :key="key"
                :prepend-icon="v.icon"
                :value="key"
                :class="{
                  'bg-amber': key == primaryNavMenu
                }"
                @click="onChangeMenu(key)"></v-list-item>
          </v-list>
        </v-navigation-drawer>

        <v-navigation-drawer
            v-model="drawer"
            temporary
            permanent
            color="var(--v-theme-background)">
          <v-list class="pa-0">
            <v-list-item v-for="(i, index) in navs[primaryNavMenu].child" :key="index" :title="i.name" :to="i.to" link></v-list-item>
          </v-list>
          <v-divider opacity=".05" class="mt-4 mb-4"></v-divider>
          <div class="ml-4 mr-4">
            <v-btn class=" bg-black" block @click="logout" v-if="authStore.isLogin">登出</v-btn>
          </div>
        </v-navigation-drawer>

        <v-main min-height="80vh">
          <v-toolbar floating collapse v-if="mobile">
            <template v-slot:append>
              <v-btn @click="drawer = !drawer"
                     icon="mdi-menu"
                     class="ml-2 mr-2"></v-btn>
            </template>
          </v-toolbar>

          <v-container :min-width="mobile ? width : null" :class="{'pt-10': mobile}" class="pa-5 w-100 overflow-y-auto overflow-x-auto">
            <router-view></router-view>
          </v-container>
        </v-main>
      </v-layout>
    </div>

    <div v-if="!authStore.isLogin">
      <EmptyView></EmptyView>
    </div>
  </v-app>
</template>

<style scoped>

</style>
