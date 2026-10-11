<template>
  <div class="position-relative">
    <v-row v-if="userAssemblysData.data && userAssemblysData.data.length > 0" class="mr-lg-10">
      <v-col cols="12" md="6" lg="6" v-for="(i, index) in userAssemblysData.data" :key="i.uuid || index">
        <AssemblyTempCard :item="i" />
      </v-col>
    </v-row>

    <div class="text-center py-10" v-else-if="!loading">
      <EmptyView></EmptyView>
    </div>

    <!-- 分页 S -->
    <PaginationBar
        v-if="userAssemblysData.pagination"
        v-model:page="spacePagination.page"
        :pagination="userAssemblysData.pagination"
        class="mt-8"
        @change="getUserAssemblysData" />
    <!-- 分页 E -->

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
import {AssemblyListResult} from '@/assets/types';

import AssemblyTempCard from '@/components/AssemblyTempCard.vue';
import EmptyView from '@/components/EmptyView.vue';
import Loading from '@/components/Loading.vue';
import PaginationBar from '@/components/PaginationBar.vue';

const {t} = useI18n();
const notice = useNoticeStore();

const spaceContext = inject<{
  targetUserId: Ref<string>;
  spaceBlocked: Ref<boolean>;
}>('spaceContext');

const loading = ref(false);
const userAssemblysData = ref<AssemblyListResult>({
  code: '0',
  data: [],
});
const spacePagination = ref({
  page: 1,
  pageSize: 10,
});

const getUserAssemblysData = async () => {
  const uid = spaceContext?.targetUserId?.value;
  if (!uid || spaceContext?.spaceBlocked?.value) return;

  try {
    loading.value = true;
    const result = await apis.userApi().getUserAssemblys(uid, spacePagination.value);
    userAssemblysData.value = result.data?.data || {code: '0', data: []};
  } catch (e) {
    handleApiError(e, notice, t, {component: 'UserSpaceAssemblys'});
  } finally {
    loading.value = false;
  }
};

watch(() => spaceContext?.targetUserId?.value, (newUid) => {
  if (newUid) {
    spacePagination.value.page = 1;
    getUserAssemblysData();
  }
});

watch(() => spaceContext?.spaceBlocked?.value, (blocked) => {
  if (!blocked) {
    getUserAssemblysData();
  }
});

onMounted(() => {
  getUserAssemblysData();
});

defineOptions({
  name: 'SpaceAssemblys',
});
</script>
