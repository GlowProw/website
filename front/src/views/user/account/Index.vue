<script setup lang="ts">

import {useAuthStore} from "@/../stores";
import Silk from "@/components/Silk.vue";
import {useI18n} from "vue-i18n";
import EmptyView from "@/components/EmptyView.vue";
import {useRouter} from "vue-router";

const authStore = useAuthStore(),
    router = useRouter(),
    {t} = useI18n()

const logout = () => {
  authStore.logout()

  router.push('/')
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
              <v-btn @click="logout" v-if="authStore.isLogin">登出</v-btn>
            </v-toolbar-items>
          </v-toolbar>
        </v-container>
      </template>
    </v-card>
    <v-divider></v-divider>

    <v-container class="pt-0 pb-0" v-if="authStore.isLogin">
      <v-layout>
        <v-navigation-drawer class="bg-transparent">
          <v-list nav>
            <v-list-item prepend-icon="mdi-account" title="账户信息" to="/account/information" link></v-list-item>
            <v-divider class="mb-1"></v-divider>
            <v-list-item title="我的配装" to="/account/assemblys" link></v-list-item>
            <v-list-item title="我的评论" to="/account/comments" link></v-list-item>
            <v-list-item title="我的组队" to="/account/teamups" link></v-list-item>
          </v-list>
        </v-navigation-drawer>

        <v-main height="100vh">
          <div class="pa-5">
            <router-view></router-view>
          </div>
        </v-main>
      </v-layout>
    </v-container>

    <div v-if="!authStore.isLogin">
      <EmptyView></EmptyView>
    </div>
  </v-app>
</template>

<style scoped>

</style>
