<script setup lang="ts">
import {useAuthStore} from "~/stores/userAccountStore";
import {useI18n} from "vue-i18n";

type HeaderAccountType = 'header-drawer' | 'header'

const authStore = useAuthStore(),
    {t} = useI18n(),
    props = defineProps<{ type: HeaderAccountType }>()
</script>

<template>
  <div>
    <template v-if="type == 'header'">
      <div class="hidden-sm">
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
              <v-img :src="authStore.user.userAvatar" v-if="authStore.user.userAvatar"></v-img>
              <span v-else>{{ authStore.currentUser[0].toUpperCase() || 'U' }}</span>
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
          <v-btn block variant="tonal" to="/account/signin">
            {{ t('signin.title') }}
          </v-btn>
        </v-col>
      </v-row>
    </template>
  </div>
</template>

<style scoped>
</style>
