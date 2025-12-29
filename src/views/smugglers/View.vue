<script setup lang="ts">

import Silk from "@/components/Silk.vue";
import {useI18n} from "vue-i18n";
import {onMounted, ref} from "vue";
import {apis} from "@/assets/sripts/index";
import {ApiError} from "@/assets/types/Api";
import {useNoticeStore} from "~/stores/noticeStore";

import SmugglersReportShowItemWidget from "@/components/SmugglersReportShowItemWidget.vue";
import Textarea from "@/components/textarea/index.vue";
import HorizontalScrollList from "@/components/HorizontalScrollList.vue";
import TimeView from "@/components/TimeView.vue";
import Time from "@/components/Time.vue";
import ItemSlotBase from "@/components/snbWidget/ItemSlotBase.vue";
import NpcIconWidget from "@/components/snbWidget/npcIconWidget.vue";
import AffixBoxHasTitleView from "@/components/AffixBoxHasTitleView.vue";
import EmptyView from "@/components/EmptyView.vue";

const {t} = useI18n(),
    notice = useNoticeStore()

let smugglersData = ref({}),
    commentData = ref({}),
    browseLoading = ref(false),
    browsePagination = ref({
      page: 1,
      pageSize: 6
    })

onMounted(() => {
  getSmugglersData()
})

/**
 * 获取当前时间周报
 */
const getSmugglersData = async () => {
  try {
    browseLoading.value = true

    const result = await apis.smugglersApi().getRangeTimeReport(),
        d = result.data;

    smugglersData.value = d.data[0];
    await getSmugglersComment(smugglersData.value.id)
  } catch (e) {
    if (e instanceof ApiError) {
      notice.error(t(`basic.tips.${e.code}`, {
        context: e.code
      }))
    }
    console.error(e)
  } finally {
    browseLoading.value = false
  }
}

/**
 * 获取周报评论
 */
const getSmugglersComment = async (reportId: string) => {
  try {
    if (!reportId) return

    browseLoading.value = true

    const result = await apis.smugglersApi().getReportComments(reportId),
        d = result.data;

    commentData.value = d.data.data;
  } catch (e) {
    if (e instanceof ApiError) {
      notice.error(t(`basic.tips.${e.code}`, {
        context: e.code
      }))
    }
    console.error(e)
  } finally {
    browseLoading.value = false
  }
}
</script>

<template>
  <v-card height="200px">
    <template v-slot:image>
      <Silk
          :speed="3"
          :scale=".7"
          :color="'#1c1c1c'"
          :noise-intensity="0.1"
          :rotation="-.6"
          class="bg-black">
      </Silk>
    </template>
    <template v-slot:default>
      <v-container class="pa-2 mt-4 position-relative">
        <v-breadcrumbs>
          <v-breadcrumbs-item to="/">{{ t('portal.title') }}</v-breadcrumbs-item>
          <v-breadcrumbs-divider></v-breadcrumbs-divider>
          <v-breadcrumbs-item>{{ t('smugglersReport.title') }}</v-breadcrumbs-item>
        </v-breadcrumbs>

        <div class="position-absolute top-0 right-0 opacity-10 pt-10 d-flex ga-2">
          <v-icon icon="mdi-trophy-award" size="120"></v-icon>
        </div>
      </v-container>
    </template>
  </v-card>
  <v-divider></v-divider>

  <v-container>
    <v-row>
      <v-col cols="12" lg="3">
        <ItemSlotBase size="99px">
          <NpcIconWidget id="smugglersNetwork-sainteAnne"></NpcIconWidget>
        </ItemSlotBase>

        <v-row>
          <v-col cols="12" sm="6" lg="12">
            <div class="mt-10">
              <p class="text-amber mb-2 text-h5">{{ t('smugglersReport.title') }}</p>
              <q class="opacity-60 quote">
                {{ t('smugglersReport.description') }}
              </q>
            </div>
          </v-col>

          <template v-if="smugglersData.id">
            <v-col cols="auto" sm="6" lg="12">
              <div class="mt-10 opacity-60">
                <p><b class="d-block mb-3">{{ smugglersData.title ?? 'N/A' }}</b></p>
                <p>开始:
                  <TimeView :time="smugglersData.startTime">
                    <Time :time="smugglersData.startTime"></Time>
                  </TimeView>
                </p>
                <p>结束:
                  <TimeView :time="smugglersData.endTime">
                    <Time :time="smugglersData.endTime"></Time>
                  </TimeView>
                </p>
              </div>
            </v-col>
          </template>
        </v-row>
      </v-col>
      <v-col cols="12" lg="9">
        <AffixBoxHasTitleView>
          <v-card variant="text" min-height="450">
            <SmugglersReportShowItemWidget :data="smugglersData.content"></SmugglersReportShowItemWidget>
          </v-card>
          <template v-slot:title>走私物品</template>
        </AffixBoxHasTitleView>
      </v-col>
    </v-row>
  </v-container>
  <v-divider></v-divider>
  <v-container>
    <v-row>
      <v-col>
        <p class="text-h5 text-amber">奖赏家们</p>
        <p class="opacity-60 text-caption mt-1 mb-3">来看下奖赏家们如何评价</p>
      </v-col>
      <v-col cols="auto">
        <v-btn to="/account/smugglersReport" target="_blank">
          成为鉴赏家
        </v-btn>
      </v-col>
    </v-row>


    <HorizontalScrollList v-if="commentData.length > 0">
      <v-card
          v-for="(i, index) in commentData" :key="index"
          tile
          variant="text">
        <v-row no-gutters>
          <!--          <v-col cols="auto" class="mr-2">-->
          <!--            <v-card class="p-2 d-flex align-center justify-center" border width="30" height="30" tile>-->
          <!--              推-->
          <!--            </v-card>-->
          <!--          </v-col>-->
          <v-col>
            <v-card border class="py-5 px-10"
                    width="550px"
                    height="200px">
              <b>{{ i.username }}</b>
              <div class="text-caption">
                <TimeView :time="i.createdTime">
                  <Time :time="i.createdTime"></Time>
                </TimeView>
              </div>

              <Textarea
                  readonly
                  class="opacity-60 mt-2"
                  :value="i.content" v-if="i.content" min-height="30"></Textarea>
            </v-card>
          </v-col>
        </v-row>
      </v-card>
    </HorizontalScrollList>
    <EmptyView v-else></EmptyView>
  </v-container>
</template>

<style scoped lang="less">
.quote {
  line-height: 1.8;
  quotes: "\"" "\"";
}
</style>
