<script setup lang="ts">

import {useI18n} from "vue-i18n";
import {computed, onMounted, Ref, ref, watch} from "vue";
import {Cosmetics} from "glow-prow-data";
import {useRoute} from "vue-router";
import {useAuthStore} from "~/stores/userAccountStore";
import ItemSlotBase from "@/components/snbWidget/ItemSlotBase.vue";
import CommentWidget from "@/components/CommentWidget.vue";
import BySeasonWidget from "@/components/BySeasonCardWidget.vue";
import LikeWidget from "@/components/LikeWidget.vue";
import CosmeticName from "@/components/snbWidget/cosmeticName.vue";
import CosmeticIconWidget from "@/components/snbWidget/cosmeticIconWidget.vue";
import CosmeticDescription from "@/components/snbWidget/cosmeticDescription.vue";
import Time from "@/components/Time.vue";
import TimeView from "@/components/TimeView.vue";
import ByObtainableWidget from "@/components/ByObtainableWidget.vue";
import AffixContainerView from "@/components/AffixContainerView.vue";
import {storage, getAppUrl} from "@/assets/sripts/index";
import SetIconWidget from "@/components/snbWidget/setIconWidget.vue";
import CosmeticPiecesTagWidget from "@/components/snbWidget/cosmeticPiecesTagWidget.vue";
import CosmeticEffectTagWidget from "@/components/snbWidget/cosmeticEffectTagWidget.vue";
import ByWorldEventWidget from "@/components/ByWorldEventWidget.vue";
import {useI18nReadName} from "@/assets/sripts/i18n_read_name";
import {useHead} from "@unhead/vue";
import ShareWidget from "@/components/ShareWidget.vue";

import {useCDNAssetsServiceStore} from "~/stores/cdnAssetsStore";
import VerticalScrollList from "@/components/VerticalScrollList.vue";
import {useAppStore} from "~/stores/appStore";

const {t, messages} = useI18n(),
    route = useRoute(),
    appStore = useAppStore(),
    authStore = useAuthStore(),
    i18nReadName = useI18nReadName(),
    cdnStore = useCDNAssetsServiceStore(),
    cosmetics: any = Cosmetics

const
    id = computed(() => (route.params.id as string) || ''),
    cosmeticDetailData = computed(() => (id.value ? cosmetics[id.value] : {})),

    headTitle = computed(() => {
      if (!id.value || !cosmetics[id.value]) return t(route.meta?.title as string || 'codex.cosmetic.title');
      const headData = i18nReadName.cosmetic(id.value);
      const headName = headData.name();
      return headName ? `${headName} - ${t(route.meta?.title as string || 'codex.cosmetic.title')}` : t(route.meta?.title as string || 'codex.cosmetic.title');
    }),

    headDescription = computed(() => {
      if (!id.value || !cosmetics[id.value]) return '';
      const headData = i18nReadName.cosmetic(id.value);
      return (headData.description() as string) || '';
    });

useHead({
  title: headTitle,
  titleTemplate: `%s | ${t('name')}`,
  meta: computed(() => {
    if (!id.value || !cosmetics[id.value]) return [];
    const headData = i18nReadName.cosmetic(id.value);
    const headName = headData.name();
    const desc = headData.description() || '';
    const imageUrl = cdnStore.currentService.image.url({
      id: id.value,
      category: 'vanities'
    });

    return [
      {name: 'description', content: desc},
      {
        name: 'keywords', content: t(route.meta?.keywords as string || '', {
          keywords: Object.keys(messages.value).map(lang => {
            return headData.keysName.map(key => i18nReadName.getValue(messages.value[lang], key)).filter(i => i != null)
          }).concat([id.value]) + `,${t('home.meta.keywords')}`
        })
      },
      {property: 'og:type', content: 'website'},
      {property: 'og:title', content: `${headName} | ${t('name')}`},
      {property: 'og:description', content: desc},
      {property: 'og:image', content: imageUrl},
      {property: 'og:url', content: typeof window !== 'undefined' ? window.location.href : getAppUrl(route.fullPath || route.path)},
      {property: 'og:site_name', content: t('name')},
      {name: 'twitter:card', content: 'summary_large_image'},
      {name: 'twitter:title', content: `${headName} | ${t('name')}`},
      {name: 'twitter:description', content: desc},
      {name: 'twitter:image', content: imageUrl}
    ];
  })
})

onMounted(() => {
  if (typeof window !== 'undefined' && id.value) {
    onCodexHistory()
  }
})

const onCodexHistory = () => {
  const {id} = route.params;

  let name = 'codex.history'

  const d = storage.session.get(name)

  storage.session.set(name, {
    ...d?.data?.value || {},
    [id as string]: {
      id,
      category: 'cosmetic',
      time: new Date().getTime()
    }
  })
}
</script>

<template>
  <v-breadcrumbs>
    <v-container class="pa-0">
      <v-breadcrumbs-item to="/">{{ t('portal.title') }}</v-breadcrumbs-item>
      <v-breadcrumbs-divider></v-breadcrumbs-divider>
      <v-breadcrumbs-item to="/codex">{{ t('codex.title') }}</v-breadcrumbs-item>
      <v-breadcrumbs-divider></v-breadcrumbs-divider>
      <v-breadcrumbs-item to="/codex/cosmetics">{{ t('codex.cosmetics.title') }}</v-breadcrumbs-item>
      <v-breadcrumbs-divider></v-breadcrumbs-divider>
      <v-breadcrumbs-item>{{ t('codex.cosmetic.title') }}</v-breadcrumbs-item>
    </v-container>
  </v-breadcrumbs>
  <v-divider></v-divider>
  <div class="cosmetic-detail">
    <div class="cosmetic-detail-header background-dot-grid">
      <v-container class="position-relative">
        <v-row class="mt-5">
          <v-col cols="8">
            <h1 class="text-amber text-h2 singe-line">
              <CosmeticName :id="cosmeticDetailData.id" :isRarity="false"></CosmeticName>
            </h1>
            <p class="mt-2 mb-3">
              <v-icon icon="mdi-identifier"/>
              {{ cosmeticDetailData.id || 'none' }}
            </p>

            <div class="mt-5 d-flex flex-wrap ga-2 align-center">
              <v-chip class="badge-flavor text-center tag-badge text-black"
                      v-if="cosmeticDetailData.type">
                {{ t(`codex.types.${cosmeticDetailData.type}`) }}
              </v-chip>
              <CosmeticPiecesTagWidget :pieces="cosmeticDetailData.pieces"></CosmeticPiecesTagWidget>
              <CosmeticEffectTagWidget :effect="cosmeticDetailData.effect"></CosmeticEffectTagWidget>
            </div>
          </v-col>
          <v-spacer></v-spacer>
          <v-col cols="auto">
            <div class="d-flex ga-2">
              <v-btn v-if="authStore.isLogin" border>
                <LikeWidget targetType="cosmetic"
                            :isShowCount="true"
                            :targetId="cosmeticDetailData.id">
                  <template v-slot:activate>
                    <v-icon icon="mdi-thumb-up"></v-icon>
                  </template>
                  <template v-slot:unActivate>
                    <v-icon icon="mdi-thumb-up-outline"></v-icon>
                  </template>
                </LikeWidget>
              </v-btn>

              <ShareWidget type="cosmetic" :target-id="cosmeticDetailData.id" />
            </div>
          </v-col>
        </v-row>
      </v-container>
    </div>
    <div class="background-flavor">
      <v-container>
        <v-row>
          <v-col cols="12" sm="12" md="8" lg="8" order="2" order-sm="1">
            <v-row>
              <v-col cols="auto" class="d-flex align-end ga-2">
                <ItemSlotBase size="130px" class="d-flex justify-center align-center">
                  <CosmeticIconWidget
                      size="110"
                      :id="cosmeticDetailData.id" :isOpenDetail="false" :isShowOpenDetail="false"></CosmeticIconWidget>
                </ItemSlotBase>

                <ItemSlotBase size="60px" v-if="cosmeticDetailData?.set && cosmeticDetailData.set.id">
                  <SetIconWidget :id="cosmeticDetailData?.set.id"></SetIconWidget>
                </ItemSlotBase>
              </v-col>
              <v-col>
                <CosmeticDescription :id="cosmeticDetailData.id"></CosmeticDescription>
              </v-col>
            </v-row>
            <v-divider class="mt-10 mb-6"></v-divider>

            <v-row class="mb-5">
              <v-col cols="12" sm="12" lg="6" xl="6">
                <template v-if="appStore.isDebug">
                  {{ cosmeticDetailData }}
                </template>
                <template v-if="cosmeticDetailData.id">
                  <v-text-field :value="cosmeticDetailData.id" readonly
                                hide-details
                                variant="underlined" density="compact">
                    <template v-slot:append-inner>
                      <p class="text-no-wrap">ID</p>
                    </template>
                  </v-text-field>
                </template>
              </v-col>
            </v-row>

            <template v-if="cosmeticDetailData.id">
              <v-divider>{{ t('comment.title') }}</v-divider>
              <CommentWidget :id="cosmeticDetailData.id" type="cosmetic" placeholder=""></CommentWidget>
            </template>
          </v-col>
          <v-col cols="12" sm="12" md="4" lg="4" order="1" order-sm="2">
            <BySeasonWidget :data="cosmeticDetailData.firstAppearingSeason || cosmeticDetailData.bySeason"></BySeasonWidget>

            <AffixContainerView :offsetTop="80">
              <VerticalScrollList :force-draggable="false" :is-indicator="false" height="calc(100vh - 120px)">

                <template v-if="cosmeticDetailData.worldEvent">
                  <ByWorldEventWidget :data="cosmeticDetailData"></ByWorldEventWidget>
                </template>
                <template v-if="cosmeticDetailData.obtainable">
                  <ByObtainableWidget :data="cosmeticDetailData" byType="cosmetic">
                    {{ t('codex.item.obtainable') }}
                  </ByObtainableWidget>
                </template>

                <v-text-field readonly
                              hide-details
                              v-if="cosmeticDetailData.dateAdded"
                              variant="underlined" density="compact">
                  <template v-slot:prepend-inner>
                    <TimeView :time="cosmeticDetailData.dateAdded" class="singe-line">
                    </TimeView>
                  </template>
                  <template v-slot:append-inner>
                    <p class="text-no-wrap">{{ t('codex.ship.dateAdded') }}</p>
                  </template>
                </v-text-field>
                <v-text-field readonly
                              hide-details
                              v-if="cosmeticDetailData.lastUpdated"
                              variant="underlined" density="compact">
                  <template v-slot:prepend-inner>
                    <TimeView :time="cosmeticDetailData.lastUpdated" class="singe-line">
                    </TimeView>
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

<style scoped lang="less">
.cosmetic-detail {
  .cosmetic-detail-header {
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

    .cosmetic-detail-header-img {
      position: absolute;
      right: 20px;
      bottom: -120px;
      width: 300px;
      min-height: 300px;
    }
  }
}
</style>
