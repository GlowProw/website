<script setup lang="ts">
import {ref} from "vue";
import axios from "axios";
import {useAuthStore} from '../../../stores'
import {useRouter} from "vue-router";

const authStore = useAuthStore(),
    router = useRouter();

let username = ref('cabbagelol'),
    password = ref('zsezse');

const onLogin = async () => {
  const result = await axios.post('http://localhost:3000/api/login', {
        username: username.value,
        password: password.value,
      }),
      d = result.data;

  if (d.code == 0) {
    authStore.setAccountToken(d.data)
    router.push('/')
  }
}
</script>

<template>
  <v-container class="mt-10">
    <v-card dense variant="elevated" class="mt-10 pa-5">
      <v-row>
        <v-col>
          <v-text-field v-model="username"></v-text-field>
          <v-text-field v-model="password"></v-text-field>

          <v-btn @click="onLogin" variant="flat">登陆</v-btn>
          <v-btn to="/account/register" variant="text">注册</v-btn>
        </v-col>
      </v-row>
    </v-card>
  </v-container>
</template>

<style scoped>

</style>
