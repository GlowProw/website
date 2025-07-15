<script setup lang="ts">
import {useAuthStore} from "../../stores";

const authStore = useAuthStore()
</script>

<template>
  <header>
    <v-layout>
      <v-app-bar
          class="header"
          density="compact"
          translate="yes"
          :absolute="true"
          flat>
        <v-app-bar-title to="/">
          <v-btn to="/">
            闪光船首
          </v-btn>
        </v-app-bar-title>

        <v-avatar
            class="hidden-md-and-up"
            color="grey-darken-1"
            size="32"
        ></v-avatar>

        <v-spacer></v-spacer>


        <v-btn to="/account/home" v-if="authStore.isLogin">
          <v-avatar
              class="hidden-sm-and-down"
              color="grey-darken-2"
              size="32">
            {{ authStore.currentUser[0] || 'U' }}
          </v-avatar>
        </v-btn>
        <v-btn variant="text" to="/account/login" v-else>
          登陆
        </v-btn>

      </v-app-bar>
      <slot name="default"></slot>
    </v-layout>
  </header>
</template>

<style scoped>
@import "../assets/styles/header.css";
</style>
