<script setup lang="ts">
import {useAuthStore} from "../../stores";
import {onMounted, ref} from "vue";
import {useRouter} from "vue-router";
import EmptyView from "../components/EmptyView.vue";
import {api, http, ws} from "../assets/sripts";
import TimeView from "../components/TimeView.vue";
import {useI18n} from "vue-i18n";

const authStore = useAuthStore(),
    $t = useI18n(),
    router = useRouter();

interface Teams {
  username: string
  expiresAt: number
  createdAt: number
  description: string
}

const isSessionReconnection = ref(false)

let teams: Teams[] = ref([]),
    messages: string[] = ref([]),

    // 发布
    pushLoading = ref(false),
    player = ref(''),
    description = ref(''),
    tags = ref([]),
    expiresAt = ref(10),

    // 检索
    teamsLoading = ref(false),
    filtering = ref({
      sortBy: 'expires',
      keyword: ''
    })

onMounted(async () => {
  await initWss();
  await getTeams();
})

/**
 * 获取组队列表
 */
const getTeams = async () => {
  try {
    teamsLoading.value = true;

    const result = await http.get(api['teamups'], {
          params: Object.fromEntries(
              Object.entries(filtering.value).filter(([_, value]) =>
                  value !== null && value !== undefined && value !== ''
              )
          ),
        }),
        d = result.data;

    if (d.code == 0) {
      teams.value = d.data;
    }

  } finally {
    teamsLoading.value = false;
  }
}

/**
 * 发布
 */
const pushTeamInfo = async () => {
  try {
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
    pushLoading.value = true;
    ws.send(JSON.stringify(message));
    pushLoading.value = false;
  } finally {
    onCleanPushInfo()
  }
}

/**
 * 清楚发布信息
 */
const onCleanPushInfo = () => {
  player.value = ''
  description.value = ''
  tags.value = []
}

const onSearch = async () => {
  await getTeams();
}

const onTeamSortBy = async () => {
  await getTeams();
}

/**
 * 复制文本
 */
const copyToClipboard = async (content: string) => {
  if (!content) return

  try {
    await navigator.clipboard.writeText(content)
  } catch (err) {
    console.error('复制失败:', err)
  }
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
        let _remainingTime = 0;
        switch (data.code) {
          case 'teamUp.anonymous.rateLimit':
            _remainingTime = data.remainingTime
            break;
          case 'teamUp.account.rateLimit':
            _remainingTime = Math.ceil(data.remainingTime / 1000 / 60)
            break;
        }

        messages.value.push($t(`basic.tips.${data.code}`, {remainingTime: _remainingTime}))
        break;
      case 'auth_failed':
        messages.value.push($t(`basic.tips.${data.code}`, {remainingTime: _remainingTime}))

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
  <v-container class="mt-10 team">
    <v-row class="mt-10">
      <v-col>
        <v-btn @click="getTeams" :loading="teamsLoading" variant="elevated">刷新</v-btn>
      </v-col>
      <v-spacer></v-spacer>
      <v-col cols="3">
        <v-select v-model="filtering.sortBy"
                  @update:modelValue="onTeamSortBy"
                  density="compact"
                  label="排序"
                  item-title="label"
                  item-value="value"
                  :items="[{value: 'recent', label:'按过期时间 (默认)'},{value: 'expires', label:'按最近发布'}]">
        </v-select>
      </v-col>
      <v-col>
        <v-text-field placeholder="搜索" density="compact" v-model="filtering.keyword">
          <template v-slot:append-inner>
            <v-btn density="compact" :disabled="!filtering.keyword" icon @click="onSearch">
              <v-icon icon="mdi-search-web"></v-icon>
            </v-btn>
          </template>
        </v-text-field>
      </v-col>
    </v-row>

    <template v-if="teams.length > 0">
      <div class="mt-5">
        <template v-for="(i, index) in teams" :key="index">
          <v-card card border class="mb-2">
            <v-row class="pa-5">
              <v-col cols="1">
                <v-avatar color="#000" icon="mdi-user" class="mr-2" size="70">
                  <v-icon
                      icon="mdi-access-point"
                      size="50"
                  ></v-icon>
                </v-avatar>
              </v-col>
              <v-col cols="11">
                <div class="mb-2">
                  <v-row justify="end">
                    <v-col>
                      <b class="mr-3 username">{{ i.username.toString().toUpperCase() }}</b>
                      <v-badge
                          v-for="(t,tIndex) in i.tags"
                          :key="tIndex"
                          color="info"
                          :content="t"
                          inline
                      ></v-badge>
                    </v-col>
                    <v-spacer></v-spacer>
                    <v-col align="right">
                      <b>发布时间 </b>
                      <TimeView :time="i.createdAt">
                        {{ new Date(i.createdAt * 1000).toLocaleString() }}
                      </TimeView>
                    </v-col>
                  </v-row>
                </div>
                <p class="mb-2 font-weight-light">{{ i.description }}</p>
              </v-col>
            </v-row>
            <v-divider class="mt-0 mb-5"></v-divider>
            <v-row class="pl-5 pr-5">
              <v-col>
                <v-text-field width="300" placeholder="玩家id" density="compact" :value="i.player">
                  <template v-slot:append>
                    <v-btn @click="copyToClipboard(i.player)">复制</v-btn>
                  </template>
                </v-text-field>
              </v-col>
              <v-spacer></v-spacer>
            </v-row>
          </v-card>
        </template>
      </div>
    </template>
    <template v-if="teams.length > 0 && teamsLoading">
      <v-progress-circular
          :size="50"
          color="primary"
          indeterminate
      ></v-progress-circular>
    </template>
    <template v-else-if="teams.length <= 0">
      <v-card card border class="mt-5">
        <EmptyView></EmptyView>
      </v-card>
    </template>

    <v-card class="pa-5 mt-10">
      <v-row>
        <v-col>
          <v-text-field v-model="player" variant="filled" density="compact" placeholder="游戏id"></v-text-field>
        </v-col>
        <v-col cols="3">
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
      <v-btn @click="pushTeamInfo" :loading="pushLoading">发布</v-btn>
    </v-card>

    <!-- 会话重连 S -->
    <v-dialog max-width="500">
      <template v-slot:default="{ isActive }">
        <v-card title="Dialog">
          <v-card-text>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
          </v-card-text>

          <v-card-actions>
            <v-spacer></v-spacer>

            <v-btn
                block
                text="Close Dialog"
                @click="isActive.value = false"
            ></v-btn>
          </v-card-actions>
        </v-card>
      </template>
    </v-dialog>
  </v-container>

  <v-snackbar-queue v-model="messages"></v-snackbar-queue>
</template>

<style scoped>
.team {
  .username {
    font-size: 20px;
  }
}
</style>
