<script lang="ts" setup>
import {computed, onMounted, ref, type Ref, watch} from "vue";
import {useI18n} from "vue-i18n";
import {useRoute, useRouter} from "vue-router";
import {useHead} from "@unhead/vue";
import {Questlog, Quests} from "glow-prow-data";

import ItemSlotBase from "@/components/snbWidget/ItemSlotBase.vue";
import QuestIconWidget from "@/components/snbWidget/questIconWidget.vue";
import QuestName from "@/components/snbWidget/questName.vue";
import QuestDescription from "@/components/snbWidget/questDescription.vue";
import CommentWidget from "@/components/CommentWidget.vue";
import LikeWidget from "@/components/LikeWidget.vue";
import ShareWidget from "@/components/ShareWidget.vue";
import TimeView from "@/components/TimeView.vue";
import AffixContainerView from "@/components/AffixContainerView.vue";
import VerticalScrollList from "@/components/VerticalScrollList.vue";

import {storage, storageCollect} from "@/assets/sripts";
import {useAuthStore} from "~/stores/userAccountStore";
import {useAppStore} from "~/stores/appStore";
import BySeasonWidget from "@/components/BySeasonCardWidget.vue";
import ByStorylineWidget from "@/components/ByStorylineWidget.vue";
import QuestPrerequisitesWidget from "@/components/snbWidget/questPrerequisitesWidget.vue";
import QuestSubsequentWidget from "@/components/snbWidget/questSubsequentWidget.vue";
import {useI18nReadName} from "@/assets/sripts/i18n_read_name";

const {t, messages} = useI18n(),
    router = useRouter(),
    route = useRoute(),
    appStore = useAppStore(),
    authStore = useAuthStore(),
    i18nReadName = useI18nReadName(),
    allQuestsMap = Quests as Record<string, Questlog>;

let questDetailData: Ref<Questlog | null> = ref(null),
    isCollect = ref(false),

    getCollectStatus = computed(() => {
      if (!questDetailData.value || !questDetailData.value.id) return false;
      isCollect.value = !isCollect.value;
      return !!storageCollect.get(questDetailData.value.id, 'quest').data;
    }),

    // 页面元信息 (meta)
    head: Ref<any> = ref({
      title: t(route.meta.title as string || 'quest.title'),
      titleTemplate: `%s | ${t('name')}`,
      meta: [
        {name: 'description', content: ''},
        {name: 'keywords', content: t(route.meta.keywords as string || 'quest.meta.keywords')},
        {property: 'og:type', content: 'website'},
        {property: 'og:title', content: `%s | ${t('name')}`},
        {property: 'og:description', content: ''},
        {property: 'og:site_name', content: t('name')},
      ]
    });

useHead(head);

watch(() => route.path, () => {
  onReady();
});

onMounted(() => {
  onReady();
});

const onReady = () => {
  const {id} = route.params;

  if (!id) {
    router.push('/quest');
    return;
  }

  const rawId = Array.isArray(id) ? id[0] : id;
  const quest = allQuestsMap[rawId];

  if (!quest) {
    router.push({name: 'NotFound'});
    return;
  }

  questDetailData.value = quest;

  const headData = i18nReadName.quest(quest.id),
      headName = headData.name() as string,
      headDescription = headData.description() as string;

  head.value.titleTemplate = `${headName} - ${head.value.titleTemplate}`;

  head.value.meta = [
    {name: 'description', content: headDescription},
    {
      name: 'keywords', content: t(route.meta.keywords as string || 'quest.meta.keywords', {
        keywords: Object.keys(messages.value).map(lang => {
          return headData.keysName.map((key: any) => i18nReadName.getValue(messages.value[lang], key)).filter((i: any) => i != null);
        }).concat([quest.id, quest.category]) + `,${t('home.meta.keywords')}`
      })
    },
    {property: 'og:type', content: 'website'},
    {property: 'og:title', content: `${headName} | ${t('name')}`},
    {property: 'og:description', content: headDescription},
    {property: 'og:url', content: window.location.href},
    {property: 'og:site_name', content: t('name')},
    {name: 'twitter:card', content: 'summary'},
    {name: 'twitter:title', content: `${headName} | ${t('name')}`},
    {name: 'twitter:description', content: headDescription},
  ];

  onCodexHistory();
};

const onCodexHistory = () => {
  if (!questDetailData.value?.id) return;
  const id = questDetailData.value.id;

  let name = 'codex.history';
  const d = storage.session.get(name);

  storage.session.set(name, {
    ...d?.data?.value || {},
    [id]: {
      id,
      category: 'quest',
      time: new Date().getTime()
    }
  });
};

const onStarQuest = (data: Questlog) => {
  isCollect.value = !isCollect.value;

  if (isCollect.value)
    return storageCollect.delete(data.id, 'quest');

  storageCollect.updata(
      {collectTime: new Date().getTime()},
      'quest',
      data.id
  );
};

defineOptions({
  name: "QuestDetailPage"
});
</script>

<template>
  <v-breadcrumbs>
    <v-container class="pa-0">
      <v-breadcrumbs-item to="/">{{ t('portal.title') }}</v-breadcrumbs-item>
      <v-breadcrumbs-divider></v-breadcrumbs-divider>
      <v-breadcrumbs-item to="/codex">{{ t('codex.title') }}</v-breadcrumbs-item>
      <v-breadcrumbs-divider></v-breadcrumbs-divider>
      <v-breadcrumbs-item to="/quest">{{ t('quest.title') }}</v-breadcrumbs-item>
      <v-breadcrumbs-divider></v-breadcrumbs-divider>
      <v-breadcrumbs-item>{{ t('quest.detailTitle') }}</v-breadcrumbs-item>
    </v-container>
  </v-breadcrumbs>
  <v-divider></v-divider>

  <div v-if="questDetailData && questDetailData.id" class="item-detail quest-detail">
    <!-- 头部横幅 -->
    <div class="item-detail-header background-dot-grid">
      <v-container class="position-relative">
        <v-row class="mt-5">
          <v-col cols="8">
            <h1 class="text-amber text-h2 singe-line">
              <QuestName :id="questDetailData.id"/>
            </h1>
            <p class="mt-2 mb-3">
              <v-icon icon="mdi-identifier" class="mr-1"/>
              {{ questDetailData.id || 'none' }}
            </p>

            <div class="mt-5 d-flex ga-2">
              <v-chip :to="`/quest?category=${questDetailData.category}`"
                      class="badge-flavor text-center tag-badge text-black"
                      color="amber"
                      variant="flat"
                      v-if="questDetailData.category">
                {{ t(`snb.quests.${questDetailData.category}.name`) || questDetailData.category }}
              </v-chip>
            </div>
          </v-col>
          <v-spacer></v-spacer>
          <v-col cols="auto">
            <div class="d-flex ga-2">
              <v-btn v-if="authStore.isLogin" border>
                <LikeWidget :isShowCount="true" :targetId="questDetailData.id" targetType="quest">
                  <template v-slot:activate>
                    <v-icon icon="mdi-thumb-up"></v-icon>
                  </template>
                  <template v-slot:unActivate>
                    <v-icon icon="mdi-thumb-up-outline"></v-icon>
                  </template>
                </LikeWidget>
              </v-btn>

              <ShareWidget :target-id="questDetailData.id" type="quest"/>
            </div>
          </v-col>
        </v-row>
      </v-container>
    </div>

    <!-- 主体内容 -->
    <div class="background-flavor">
      <v-container>
        <v-row>
          <!-- 左侧主体 -->
          <v-col cols="12" lg="8" md="8" order="2" order-sm="1" sm="12">
            <v-row>
              <div>
                <ItemSlotBase :id="questDetailData.id" size="130px">
                  <QuestIconWidget :id="questDetailData.id" :isOpenDetail="false" :isShowOpenDetail="false" :isShowTooltip="false"/>
                </ItemSlotBase>
              </div>
              <v-col>
                <p class="text-pre-wrap mb-4">
                  <QuestDescription :id="questDetailData.id"/>
                </p>
              </v-col>
            </v-row>
            <v-divider class="mt-10 mb-6"></v-divider>

            <!-- 基本属性字段 -->
            <v-row>
              <v-col cols="12" lg="6" sm="12" xl="6">
                <template v-if="appStore.isDebug">
                  {{ questDetailData }}
                </template>
                <template v-if="questDetailData.id">
                  <v-text-field :value="questDetailData.id" density="compact" hide-details readonly variant="underlined">
                    <template v-slot:append-inner>
                      <p class="text-no-wrap">ID</p>
                    </template>
                  </v-text-field>
                </template>
                <template v-if="questDetailData.category">
                  <v-text-field :value="t(`snb.quests.${questDetailData.category}.name`) || questDetailData.category" density="compact" hide-details readonly variant="underlined">
                    <template v-slot:append-inner>
                      <p class="text-no-wrap">{{ t('quest.category') }}</p>
                    </template>
                  </v-text-field>
                </template>
              </v-col>
              <v-col cols="12" lg="12" sm="12" xl="12">
                <ByStorylineWidget :data="questDetailData" />
              </v-col>
            </v-row>

            <!-- 前置任务 -->
            <v-col cols="12" class="pa-0">
              <QuestPrerequisitesWidget :id="questDetailData.id">
                <v-divider>{{ t('quest.prerequisites') }}</v-divider>
              </QuestPrerequisitesWidget>
            </v-col>

            <!-- 后续任务 -->
            <v-col cols="12" class="pa-0">
              <QuestSubsequentWidget :id="questDetailData.id">
                <v-divider>{{ t('quest.subsequentQuests') }}</v-divider>
              </QuestSubsequentWidget>
            </v-col>

            <!-- 评论区 -->
            <template v-if="questDetailData.id">
              <v-divider class="mt-8 mb-4">{{ t('comment.title') }}</v-divider>
              <CommentWidget :id="questDetailData.id" placeholder="" type="quest"></CommentWidget>
            </template>
          </v-col>

          <!-- 右侧固定侧边栏 -->
          <v-col cols="12" lg="4" md="4" order="1" order-sm="2" sm="12">
            <BySeasonWidget :data="questDetailData"></BySeasonWidget>

            <AffixContainerView :offsetTop="80">
              <VerticalScrollList :force-draggable="false" :is-indicator="false" height="calc(100vh - 120px)">
                <v-text-field v-if="questDetailData.dateAdded" density="compact" hide-details readonly variant="underlined">
                  <template v-slot:prepend-inner>
                    <TimeView :time="questDetailData.dateAdded" class="singe-line"/>
                  </template>
                  <template v-slot:append-inner>
                    <p class="text-no-wrap">{{ t('codex.ship.dateAdded') }}</p>
                  </template>
                </v-text-field>
                <v-text-field v-if="questDetailData.lastUpdated" density="compact" hide-details readonly variant="underlined">
                  <template v-slot:prepend-inner>
                    <TimeView :time="questDetailData.lastUpdated" class="singe-line"/>
                  </template>
                  <template v-slot:append-inner>
                    <p class="text-no-wrap">{{ t('codex.ship.lastUpdated') }}</p>
                  </template>
                </v-text-field>
              </VerticalScrollList>
            </AffixContainerView>
          </v-col>
        </v-row>
      </v-container>
    </div>
  </div>
</template>

<style lang="less" scoped>
.item-detail {
  .item-detail-header {
    background-color: #000;
    position: relative;
    padding-bottom: 40px;
    min-height: 320px;

    &:before {
      content: "";
      position: absolute;
      z-index: 0;
      bottom: 0;
      left: 0;
      width: 100%;
      height: 0;
      padding: 10% 0 0;
      background: url(@/assets/images/portal-banner-background.png) 50% 0 no-repeat;
      background-size: cover;
    }
  }

  .quest-link-card {
    background-color: #161616;
    transition: all 0.2s ease;

    &:hover {
      border-color: var(--main-color, #ffc107);
      background-color: #202020;
      transform: translateX(4px);
    }
  }
}
</style>
