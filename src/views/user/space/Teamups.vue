<template>
  <div class="position-relative">
    <div v-if="userTeamUpData.data && userTeamUpData.data.length > 0">
      <v-card
          v-for="(i, index) in userTeamUpData.data"
          :key="i.id || index"
          class="mb-2 pa-3 pl-4">
        <v-row align="center">
          <v-col cols="12">
            <div class="font-weight-bold text-h5 text-amber">{{ i.description }}</div>
            <v-row class="text-body-1 opacity-60">
              <v-col cols="auto" v-if="i.createdTime">
                <TimeView :time="i.createdTime"></TimeView>
              </v-col>
              <v-col cols="auto" v-if="i.player">
                {{ i.player }}
              </v-col>
              <v-col cols="auto" v-if="i.tags && i.tags.length">
                <v-chip density="compact" v-for="(tag, tIdx) in i.tags" :key="tIdx">
                  {{ tag }}
                </v-chip>
              </v-col>
            </v-row>
          </v-col>
        </v-row>
      </v-card>
    </div>

    <div class="text-center py-10" v-else-if="!loading">
      <EmptyView></EmptyView>
    </div>

    <v-overlay v-model="loading" contained class="d-flex justify-center align-center">
      <Loading size="50"></Loading>
    </v-overlay>
  </div>
</template>

<script setup lang="ts">
import {inject, onMounted, ref, watch, Ref} from 'vue';
import {useI18n} from 'vue-i18n';
import {apis} from '@/assets/sripts';
import {useNoticeStore} from '~/stores/noticeStore';
import {handleApiError} from '@/assets/sripts/error_handler';
import {ResultData} from '@/assets/types';

import TimeView from '@/components/TimeView.vue';
import EmptyView from '@/components/EmptyView.vue';
import Loading from '@/components/Loading.vue';

const {t} = useI18n();
const notice = useNoticeStore();

const spaceContext = inject<{
  targetUserId: Ref<string>;
  spaceBlocked: Ref<boolean>;
}>('spaceContext');

const loading = ref(false);
const userTeamUpData = ref<ResultData<any[]>>({
  code: '0',
  data: [],
});
const spacePagination = ref({
  page: 1,
  pageSize: 10,
});

const getUserTeamUpsData = async () => {
  const uid = spaceContext?.targetUserId?.value;
  if (!uid || spaceContext?.spaceBlocked?.value) return;

  try {
    loading.value = true;
    const result = await apis.userApi().getUserTeamups(uid, spacePagination.value);
    userTeamUpData.value = result.data?.data || {code: '0', data: []};
  } catch (e) {
    handleApiError(e, notice, t, {component: 'UserSpaceTeamups'});
  } finally {
    loading.value = false;
  }
};

watch(() => spaceContext?.targetUserId?.value, (newUid) => {
  if (newUid) {
    getUserTeamUpsData();
  }
});

watch(() => spaceContext?.spaceBlocked?.value, (blocked) => {
  if (!blocked) {
    getUserTeamUpsData();
  }
});

onMounted(() => {
  getUserTeamUpsData();
});

defineOptions({
  name: 'SpaceTeamups',
});
</script>
