<script setup lang="ts">
import {useAuthStore} from "@/../stores";

type HeaderAccountType = 'header-drawer' | 'header'

const authStore = useAuthStore(),
    props = defineProps<{type: HeaderAccountType}>()
</script>

<template>
  <div>
    <template v-if="type == 'header'">
      <div class="hidden-sm">
        <v-btn to="/account/information" density="comfortable" icon class="mr-3" v-if="authStore.isLogin">
          <v-avatar
              color="grey-darken-2"
              size="32">
            {{ authStore.currentUser[0].toUpperCase() || 'U' }}
          </v-avatar>
        </v-btn>
        <v-btn variant="text" to="/account/login" v-else>
          登陆
        </v-btn>
      </div>
    </template>

    <template v-if="type == 'header-drawer'">
      <router-link to="/account/information" v-if="authStore.isLogin">
        <v-row align="center">
          <v-col cols="auto">
            <v-avatar
                color="var(--main-color)"
                class="d-flex justify-center align-center"
                size="32">
              {{ authStore.currentUser[0].toUpperCase() || 'U' }}
            </v-avatar>
          </v-col>
          <v-col>
            {{ authStore.currentUser }}
          </v-col>
        </v-row>
      </router-link>
      <v-row align="center" v-else>
        <v-col cols="auto">
          <v-avatar
              color="var(--main-color)"
              class="d-flex justify-center align-center"
              size="32">
            {{ 'U' }}
          </v-avatar>
        </v-col>
        <v-col>
          登陆
        </v-col>
      </v-row>
    </template>
  </div>
</template>

<style scoped>
</style>
