<script setup lang="ts">

import {useAuthStore} from "../../stores";
import {onMounted, ref} from "vue";
import axios from "axios";
import {useRouter} from "vue-router";

const authStore = useAuthStore(),
    router = useRouter(),
    ws = new WebSocket(`ws://localhost:3001`);

interface Teams {
  username: string
  expiresAt: number
  createdAt: number
  description: string
}

const teams:Teams[] = ref([])
const player = ref('')
const description = ref('')
const tags = ref([])
const expiresAt = ref(10)

const isSessionReconnection = ref(false)

onMounted(() => {
  getTeams();
  initWss();
})

/**
 * 获取组队列表
 */
const getTeams = async () => {
  let sortBy = 'expires'
  const result = await axios.get(`http://localhost:3000/api/teamups?sortBy=${sortBy}`),
      d = result.data;

  if (d.code == 0) {
    teams.value = d.data;
  }
}

/**
 * 发布
 */
const pushTeamInfo = async () => {
  const _expiresAt = Date.now() + parseInt(expiresAt.value) * 60 * 1000;

  const message = {
    type: 'publish_team_up',
    payload: {
      player: player.value,
      description: description.value,
      tags: tags.value,
      expiresAt: _expiresAt
    }
  };

  ws.send(JSON.stringify(message));
}

/**
 * WebSocket
 */
const initWss = () => {
  ws.onopen = function (event) {
    if (authStore.isLogin) {
      ws.send(JSON.stringify({type: 'authenticate', payload: {token: authStore.user.token}}));
    }
  };

  ws.onmessage = function (event) {
    const data = JSON.parse(event.data);
    teams.value = []

    switch (data.type) {
      case 'new_team_up':
      case 'team_up_expired':
        getTeams()
        break;
      case 'publish_rate_limit':
        break;
      case 'auth_failed':
        authStore.logout()
        router.push('/account/login')
        break;
      case 'error':
        console.error(data.message)
        break;
    }
    //
    // if (data.type === 'new_team_up') {
    //   // 当有新组队发布时，重新获取列表以确保排序和筛选是最新的
    //   getTeams();
    // } else if (data.type === 'team_up_expired') {
    //   // 当组队过期或取消时，重新获取列表
    //   getTeams();
    // } else if (data.type === 'publish_rate_limit') {
    //   // publishMessageDiv.className = 'error-message';
    //   // publishMessageDiv.textContent = data.payload.message;
    // } else if (data.type === 'auth_failed') {
    //   // loginMessageDiv.className = 'error-message';
    //   // loginMessageDiv.textContent = data.message + " 请重新登录。";
    //   // clearAuthData(); // 清除无效的 Token
    //   router.push('/account/login')
    // } else if (data.type === 'error') {
    //
    // }
  };

  ws.onclose = function (event) {
    isSessionReconnection.value = true;
    console.warn(event)
  };

  ws.onerror = function (error) {
    isSessionReconnection.value = true;
    console.error(error)
  };
}
</script>

<template>
  <v-container class="mt-10">
    <v-card card border>
      <div v-for="(i, index) in teams" :key="index">
        <v-card class="pa-5" tile>
          <v-row>
            <v-col cols="1">
              <v-avatar color="#000" icon="mdi-user" class="mr-2" size="70"></v-avatar>
            </v-col>
            <v-col cols="11">
              <div class="mb-2">
                <v-row>
                  <v-col>
                    <b>{{ i.username }}</b>
                  </v-col>
                  <v-spacer></v-spacer>
                  <v-col align-self="end">
                    {{ i.expiresAt }}
                    {{ i.createdAt }}
                  </v-col>
                </v-row>
              </div>
              <p class="mb-2 font-weight-light">{{ i.description }}</p>
              <v-row>
                <v-col>
                  <v-text-field width="300" placeholder="玩家id" density="compact" :value="i.player">
                    <template v-slot:append>
                      <v-btn>复制</v-btn>
                    </template>
                  </v-text-field>
                </v-col>
                <v-spacer></v-spacer>
              </v-row>
            </v-col>
          </v-row>

        </v-card>
      </div>
    </v-card>


    <v-card class="pa-5 mt-10">
      <v-row>
        <v-col>
          <v-text-field v-model="player" variant="filled" density="compact" placeholder="游戏id"></v-text-field>
        </v-col>
        <v-col>
          <v-select density="compact"
                    v-model="expiresAt"
                    label="愿意等待时间"
                    item-title="label"
                    item-value="value"
                    :items="[{value: 10, label:'10分钟'},{value: 30, label:'30分钟'},{value: 60, label:'60分钟'}]">
          </v-select>
        </v-col>
        <v-col>
          <v-combobox
              label="标签"
              chips
              multiple
              density="compact"
              v-model="tags"
              :items="['PVP', 'PVE', '世界游荡', '剧情任务', '悬赏', '其他']"
          ></v-combobox>
        </v-col>
        <v-spacer></v-spacer>
      </v-row>
      <v-textarea placeholder="组队描述，也可以放置你的语音频道" v-model="description"></v-textarea>
      <v-btn @click="pushTeamInfo">发布</v-btn>
    </v-card>

    <!-- 会话重连 S -->
    <v-dialog max-width="500">
      <template v-slot:activator="{ props: isSessionReconnection }">
        <v-btn
            v-bind="isSessionReconnection"
            color="surface-variant"
            text="Open Dialog"
            variant="flat"
        ></v-btn>
      </template>

      <template v-slot:default="{ isActive }">
        <v-card title="Dialog">
          <v-card-text>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
          </v-card-text>

          <v-card-actions>
            <v-spacer></v-spacer>

            <v-btn
                text="Close Dialog"
                @click="isActive.value = false"
            ></v-btn>
          </v-card-actions>
        </v-card>
      </template>
    </v-dialog>
  </v-container>
</template>

<style scoped>

</style>
