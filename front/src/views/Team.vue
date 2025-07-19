<script setup lang="ts">
import {useAuthStore} from "../../stores";
import {onMounted, ref} from "vue";
import {useRouter} from "vue-router";
import EmptyView from "../components/EmptyView.vue";
import {api, http, ws} from "../assets/sripts";
import TimeView from "../components/TimeView.vue";
import {useI18n} from "vue-i18n";
import type {VForm} from "vuetify/components";
import Banner from "../components/Banner.vue";
import Loading from "../components/Loading.vue";

const authStore = useAuthStore(),
    router = useRouter(),
    {t} = useI18n();

interface Teams {
  username: string
  expiresAt: number
  createdAt: number
  description: string
}

enum getTeamsType {
  none,
  load
}

const isSessionReconnection = ref(false)

let teams: Teams[] = ref([]),
    messages: string[] = ref([]),

    // 发布
    pushForm = ref<VForm | null>(null),
    pushConfig = {
      rules: {
        player: [
          v => !!v || 'Name is required',
          v => (v && v.length <= 10) || 'Name must be 10 characters or less',
        ],
      },
      tags: [
        {label: t('teamUp.tags.pve'), value: 'pve'},
        {label: t('teamUp.tags.pvp'), value: 'pvp'},
        {label: t('teamUp.tags.timeWander'), value: 'timeWander'},
        {label: t('teamUp.tags.plotTask'), value: 'plotTask'},
        {label: t('teamUp.tags.sideQuest'), value: 'sideQuest'},
        {label: t('teamUp.tags.reward'), value: 'reward'},
        {label: t('teamUp.tags.other'), value: 'other'}
      ],
      time: [
        {value: 10, label: t('teamUp.time.minutes', {count: 10})},
        {value: 30, label: t('teamUp.time.minutes', {count: 30})},
        {value: 60, label: t('teamUp.time.minutes', {count: 60})},
        {value: 120, label: t('teamUp.time.minutes', {count: 120})},
        {value: 60 * 24, label: t('teamUp.time.day', {count: 1})}
      ]
    },
    pushModel = ref(false),
    pushLoading = ref(false),
    player = ref(''),
    description = ref(''),
    tags = ref([]),
    expiresAt: number = ref(60),

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
const getTeams = async (type: getTeamsType = getTeamsType.none) => {
  let _teams = teams;
  return new Promise<P>(async resolve => {
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

      if (d.error == 1) {
        throw Error(d.code)
      }

      switch (type) {
        case 0:
        case getTeamsType.none:
          _teams.value = d.data;
          break;
        case 1:
        case getTeamsType.load:
          _teams.value.push(...d.data)
          break;
      }
      resolve(_teams.value);
    } catch (e) {
      if (e instanceof Error)
        messages.value.push(t(`basic.tips.${e.response.data.code.replace('.', '_')}`))
      else
        console.error(e)
    } finally {
      setTimeout(() => {
        teamsLoading.value = false
      }, 1000)
      // teamsLoading.value = false;
    }
  })
}

/**
 * 虚拟列表加载
 */
const onTeamLoad = async ({done}) => {
  await getTeams('load')
  done('ok')
}

/**
 * 发布
 */
const pushTeamInfo = async () => {
  try {
    if (!pushForm.value) return
    const {valid} = await pushForm.value.validate();

    if (!valid) return;

    const _expiresAt = Date.now() + expiresAt.value * 60 * 1000;
    console.log('_expiresAt', _expiresAt)

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
    ws.client.send(JSON.stringify(message));

    pushLoading.value = false;
    pushModel.value = false;
  } finally {

  }
}

/**
 * 取消发布
 */
const onDeleTeamUp = async (id) => {
  if (!id) return;

  const message = {
    type: 'cancel_team_up',
    payload: {
      id
    }
  };

  ws.client.send(JSON.stringify(message));
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

    messages.value.push(t(`teamUp.copyPlayerSuccess`))
  } catch (err) {
    console.error('复制失败:', err)
  }
}

/**
 * WebSocket
 */
const initWss = () => {
  ws.client.onopen = function (event: any) {
    if (authStore.isLogin) {
      ws.client.send(
          JSON.stringify(
              {
                type: 'authenticate', payload: {token: authStore.user.token}
              }
          )
      );
    }
  };

  ws.client.onmessage = function (event: any) {
    const data = JSON.parse(event.data);
    teams.value = []

    console.log('ws', data);

    if (data.code)
      data.code = data.code.replaceAll('.', '_');

    switch (data.type) {
      case 'new_team_up':
        messages.value.push(t('basic.tips.teamUp_pushSuccess'));
        onCleanPushInfo();
        getTeams();
        break;
      case 'cancel_team_up':
        getTeams();
        break;
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
            _remainingTime = Math.ceil((data.remainingTime) / 1000 / 60)
            break;
        }

        messages.value.push(t(`basic.tips.${data.code}`, {remainingTime: _remainingTime}))

        pushLoading.value = false;
        pushModel.value = false;

        getTeams();
        break;
      case 'auth_failed':
        messages.value.push(t(`basic.tips.${data.code}`))

        authStore.logout()
        router.push('/account/login')

        getTeams();
        break;
      case 'error':
        console.error(data.message)
        messages.value.push(t(`basic.tips.${'teamUp.error'.replaceAll('.', '_')}`, {
          context: data.message
        }))
        break;
    }
  };

  ws.client.onclose = function (event: any) {
    console.warn(event)
    messages.value.push(t(`basic.tips.${'teamUp.error'.replaceAll('.', '_')}`, {
      context: 'client -> close'
    }))
  };

  ws.client.onerror = function (error: any) {
    console.error(error)
    messages.value.push(t(`basic.tips.${'teamUp.error'.replaceAll('.', '_')}`, {
      context: 'client -> error'
    }))
  };
}
</script>

<template>
  <div class="background-img-flavor fill-height">
    <Banner>
      <template v-slot:title>
        <h1>{{ t('teamUp.title') }}</h1>
      </template>
    </Banner>

    <v-container class="team">
      <v-row>
        <v-col cols="12" lg="6">
          <router-link to="/">
            <v-icon icon="mdi-home" class="mr-5"></v-icon>
          </router-link>

          <v-btn @click="pushModel = true" class="btn-flavor mr-1" variant="elevated">
            <v-icon icon="mdi-plus"></v-icon>
            发布组队
          </v-btn>

          <v-btn @click="getTeams" class="btn-flavor" variant="elevated">
            <v-icon :class="[
                teamsLoading ?  'spin-icon-load' : ''
            ]" icon="mdi-refresh" size="20"/>
          </v-btn>
        </v-col>
        <v-spacer></v-spacer>
        <v-col cols="12" lg="3">
          <v-select v-model="filtering.sortBy"
                    @update:modelValue="onTeamSortBy"
                    density="comfortable"
                    label="排序"
                    item-title="label"
                    item-value="value"
                    :items="[{value: 'recent', label:'按过期时间 (默认)'},{value: 'expires', label:'按最近发布'}]">
          </v-select>
        </v-col>
        <v-col cols="12" lg="3">
          <v-text-field placeholder="搜索" density="comfortable" v-model="filtering.keyword">
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
          <v-infinite-scroll :items="teams.value"
                             mode="manual"
                             @load="onTeamLoad">
            <template v-for="(i, index) in teams" :key="index">
              <v-card card border class="card-flavor">
                <v-row class="pa-5">
                  <v-col cols="3" sm="2" md="1" lg="1">
                    <v-avatar class="mr-2 team-icon" size="70">
                      <v-icon
                          icon="mdi-access-point"
                          size="50"
                      ></v-icon>
                    </v-avatar>
                  </v-col>
                  <v-col cols="9" sm="9" md="11" lg="11">
                    <div class="mb-2">
                      <v-row justify="end">
                        <v-col>
                          <b class="mr-3 username">
                            <template v-if="i.username">
                              {{ i.username || t('teamUp.emptyUsername') }}
                            </template>
                            <template v-else>
                              {{ t('teamUp.emptyUsername') }}
                            </template>
                          </b>
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
                    <p class="mb-2 font-weight-light">{{ i.description || t('teamUp.emptyDescription') }}</p>
                  </v-col>
                </v-row>
                <v-divider class="mt-0 mb-5"></v-divider>
                <v-row class="pl-5 pr-5">
                  <v-col>
                    <v-text-field langth="10" width="300" :placeholder="t('teamUp.form.player')" density="compact"
                                  :value="i.player || t('teamUp.emptyPlayer')">
                      <template v-slot:append>
                        <v-btn @click="copyToClipboard(i.player)">{{ t('teamUp.copyPlayerBtn') }}</v-btn>
                      </template>
                    </v-text-field>
                  </v-col>
                  <v-spacer></v-spacer>
                  <v-col align="right">
                    <v-btn class="btn-flavor" @click="onDeleTeamUp(i.id)" v-if="authStore.isLogin && authStore.user.userId == i.userId">
                      删除
                    </v-btn>
                  </v-col>
                </v-row>
              </v-card>
            </template>
            <template v-slot:loading>
              <v-btn density="comfortable" icon>
                <Loading :size="42"></Loading>
              </v-btn>
            </template>
            <template v-slot:load-more="{ props }">
              <v-btn
                  icon="mdi-refresh"
                  size="small"
                  variant="text"
                  v-bind="props"
              ></v-btn>
            </template>
          </v-infinite-scroll>
        </div>
      </template>
      <template v-else-if="teams.length <= 0">
        <v-card card border class="mt-5">
          <EmptyView></EmptyView>
        </v-card>
      </template>


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

      <v-fab
          :app="true"
          location="right bottom"
          size="large"
          @click="pushModel = true"
          icon>
        <v-icon>mdi-plus</v-icon>

        <v-dialog
            location="bottom"
            v-model="pushModel"
            width="100%">
          <v-container>
            <v-card class="team pa-5 mt-10">

              <v-form ref="pushForm">
                <v-row>
                  <v-col>
                    <div v-if="authStore.isLogin">
                      {{
                        t("teamUp.pushLoginInfo", {
                          username: `<a href="/account/login" class="username">${authStore.currentUser}</a>`
                      })
                      }}
                    </div>
                    <div v-else>
                      <p v-html='t("teamUp.pushLoginInfo", {
                  username: `<a href="/account/login" class="username">${t("teamUp.emptyUsername")}</a>`
                  })'></p>
                    </div>
                  </v-col>
                </v-row>

                <v-row>
                  <v-col cols="12" lg="3">
                    <v-text-field v-model="player"
                                  variant="filled"
                                  density="compact"
                                  :rules="pushConfig.rules.player"
                                  :placeholder="t('teamUp.form.player')"></v-text-field>
                  </v-col>
                  <v-col cols="12" lg="3">
                    <v-select density="compact"
                              v-model="expiresAt"
                              :label="t('teamUp.form.time')"
                              item-title="label"
                              item-value="value"
                              :items="pushConfig.time">
                    </v-select>
                  </v-col>
                  <v-col cols="12" lg="6">
                    <v-combobox
                        label="标签"
                        chips
                        multiple
                        density="compact"
                        v-model="tags"
                        clearable
                        item-title="label"
                        item-value="value"
                        :hide-no-data="true"
                        :items="pushConfig.tags"></v-combobox>
                  </v-col>
                  <v-spacer></v-spacer>
                </v-row>
                <v-textarea :placeholder="t('teamUp.form.descriptionPlaceholder')" v-model="description"></v-textarea>

                <v-row>
                  <v-spacer></v-spacer>
                  <v-btn-group>
                    <v-btn @click="pushTeamInfo" color="#000" :loading="pushLoading">发布</v-btn>
                    <v-btn variant="text" @click="pushModel = false">取消</v-btn>
                  </v-btn-group>
                </v-row>
              </v-form>
            </v-card>
          </v-container>
        </v-dialog>
      </v-fab>
    </v-container>

    <v-snackbar-queue v-model="messages"></v-snackbar-queue>
  </div>
</template>

<style scoped lang="less">
.team {
  .team-icon {
    background-color: var(--main-color) !important;
  }

  .username {
    color: var(--main-color) !important;
    font-size: 20px;
  }
}
</style>

<style>
.team .username {
  color: var(--main-color) !important;
}
</style>
