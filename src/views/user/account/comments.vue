<script setup lang="ts">

import {onMounted, ref} from "vue";
import {apis} from "@/assets/sripts/index";

import Loading from "@/components/Loading.vue";
import ItemSlotBase from "@/components/snbWidget/ItemSlotBase.vue";
import ShipIconWidget from "@/components/snbWidget/shipIconWidget.vue";
import ItemIconWidget from "@/components/snbWidget/itemIconWidget.vue";
import EmptyView from "@/components/EmptyView.vue";
import {ApiError} from "@/assets/types/Api";
import {useNoticeStore} from "~/stores/noticeStore";

const notice = useNoticeStore()

let loading = ref(false),
    userCommentData = ref({})

onMounted(() => {
  getMyCommentsData()
})

/**
 * 获取账户相关配装信息
 */
const getMyCommentsData = async () => {
  try {
    loading.value = true;

    const result = await apis.userApi().getUserComments(),
        d = result.data

    userCommentData.value = d.data;
  } catch (e) {
    if (e instanceof ApiError) {
      notice.error(t(`basic.tips.${e.code}`, {
        context: e.code
      }))
    }
    console.error(e)
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="position-relative">
    <v-overlay :model-value="loading" contained>
      <Loading></Loading>
    </v-overlay>

    <v-card v-for="(i,index) in userCommentData.data" :key="index" class="mb-2 pa-2 pl-4" v-if="userCommentData.data && userCommentData.data.length > 0">
      <v-row align="center">
        <div class="pa-3">
          <template v-if="i.targetType == 'item'">
            <ItemSlotBase size="80px">
              <ItemIconWidget :id="i.targetId"></ItemIconWidget>
            </ItemSlotBase>
          </template>
          <template v-else-if="i.targetType == 'ship'">
            <ItemSlotBase size="80px">
              <ShipIconWidget :id="i.targetId"></ShipIconWidget>
            </ItemSlotBase>
          </template>
        </div>
        <v-col>
          <p class="text-body-1" v-html="i.content"></p>
        </v-col>
        <v-spacer></v-spacer>
        <v-col cols="auto">
          <div class="d-flex ga-2">
            <v-btn :to="`/codex/${i.targetType}/${i.targetId}`" target="_blank" icon="mdi-open-in-new"></v-btn>
          </div>
        </v-col>
      </v-row>
    </v-card>
    <div class="text-center" v-else>
      <EmptyView></EmptyView>
    </div>
  </div>
</template>

<style scoped lang="less">

</style>
