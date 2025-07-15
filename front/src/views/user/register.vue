<script setup lang="ts">
import {ref} from "vue";
import axios from "axios";
import {useRouter} from "vue-router";

const router = useRouter();

let username = ref(''),
    password = ref('');

const onRegister = async () => {
  const result = await axios.post('http://localhost:3000/api/register', {
        username: username.value,
        password: password.value,
      }),
      d = result.data;

  if (d.code == 0) {
    router.push('/account/login')
  }
}
</script>

<template>
  <v-container class="mt-10">
    <v-card dense variant="flat" class="mt-10 pa-5">
      <v-row>
        <v-col>
          <v-text-field v-model="username" placeholder="帐号"></v-text-field>
          <v-text-field v-model="password" placeholder="输入密码"></v-text-field>
          <v-btn @click="onRegister">注册</v-btn>
        </v-col>
      </v-row>
    </v-card>
  </v-container>
</template>

<style scoped>

</style>
