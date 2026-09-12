<script setup lang="ts">
import {useI18n} from "vue-i18n";
import {useRoute, useRouter} from "vue-router";
import {onMounted, ref, type Ref, watch} from "vue";

import ItemSlotBase from "@/components/snbWidget/ItemSlotBase.vue";
import FactionIconWidget from "@/components/snbWidget/factionIconWidget.vue";

import {Materials, Npc, Npcs} from "glow-prow-data";

import {useI18nUtils} from "@/assets/sripts/i18n_util";
import TimeView from "@/components/TimeView.vue";
import Time from "@/components/Time.vue"
import {rarity, storage} from "@/assets/sripts";
import WeaponModificationWidget from "@/components/snbWidget/weaponModificationWidget.vue";
import CommentWidget from "@/components/CommentWidget.vue";
import LikeWidget from "@/components/LikeWidget.vue";
import {useAuthStore} from "~/stores/userAccountStore";
import {useHead} from "@unhead/vue";
import {useI18nReadName} from "@/assets/sripts/i18n_read_name";
import ShareWidget from "@/components/ShareWidget.vue";
import BySeasonWidget from "@/components/BySeasonCardWidget.vue";
import ByObtainableWidget from "@/components/ByObtainableWidget.vue";
import ByWorldEventWidget from "@/components/ByWorldEventWidget.vue";
import ItemNameRarity from "@/components/snbWidget/itemNameRarity.vue";
import NpcName from "@/components/snbWidget/npcName.vue";
import AffixContainerView from "@/components/AffixContainerView.vue";
import NpcIconWidget from "@/components/snbWidget/npcIconWidget.vue";
import ItemName from "@/components/snbWidget/itemName.vue";
import ItemIconWidget from "@/components/snbWidget/itemIconWidget.vue";
import MaterialIconWidget from "@/components/snbWidget/materialIconWidget.vue";
import MaterialName from "@/components/snbWidget/materialName.vue";

import {useCDNAssetsServiceStore} from "~/stores/cdnAssetsStore";
import VerticalScrollList from "@/components/VerticalScrollList.vue";
import {useAppStore} from "~/stores/appStore";

const
    {t, messages} = useI18n(),
    router = useRouter(),
    route = useRoute(),
    appStore = useAppStore(),
    authStore = useAuthStore(),
    {asArray, asString, sanitizeString} = useI18nUtils(),
    i18nReadName = useI18nReadName(),
    cdnStore = useCDNAssetsServiceStore(),

    // 数据
    npcs: any = Npcs

let npcDetailData: Ref<any> = ref(null),

    rarityColorConfig = rarity.color,

    // 页面元信息 (meta)
    head: Ref<any> = ref({
      title: t(route.meta.title as string),
      titleTemplate: `%s | ${t('name')}`,
      meta: [
        {name: 'description', content: ''},
        {name: 'keywords', content: t(route.meta.keywords as string)},
        {property: 'og:type', content: 'website'},
        {property: 'og:title', content: `%s | ${t('name')}`},
        {property: 'og:description', content: ''},
        {property: 'og:site_name', content: t('name')},
      ]
    })

useHead(head)

watch(() => route.path, (value) => {
  onReady()
})

onMounted(() => {
  onReady()
})

const onReady = () => {
  const {id} = route.params;

  if (!id) {
    router.push('/')
    return;
  }

  if (!npcs[id as string]) {
    setInterval(() => router.push({name: 'NotFound'}), 1000)
    return;
  }

  npcDetailData.value = npcs[id as string];

  const headData = i18nReadName.npc(id as string),
      headName = headData.name(npcDetailData.value?.location),
      headDescription = headData.description()

  head.value.titleTemplate = `${headName} - ${head.value.titleTemplate}`

  const imageUrl = cdnStore.currentService.url({
    id: npcDetailData.value.id,
    category: 'npcs'
  }, 'glow-prow');

  head.value.meta = [
    {name: 'description', content: headDescription},
    {
      name: 'keywords', content: t(route.meta.keywords as string, {
        keywords: Object.keys(messages.value).map(lang => {
          return headData.keysName.map((key: any) => i18nReadName.getValue(messages.value[lang], key)).filter((i: any) => i != null)
        }).concat([id as string]) + `,${t('home.meta.keywords')}`
      })
    },
    {property: 'og:type', content: 'website'},
    {property: 'og:title', content: `${headName} | ${t('name')}`},
    {property: 'og:description', content: headDescription},
    {property: 'og:image', content: imageUrl},
    {property: 'og:url', content: window.location.href},
    {property: 'og:site_name', content: t('name')},
    {name: 'twitter:card', content: 'summary_large_image'},
    {name: 'twitter:title', content: `${headName} | ${t('name')}`},
    {name: 'twitter:description', content: headDescription},
    {name: 'twitter:image', content: imageUrl}
  ]

  onCodexHistory()
}

const onCodexHistory = () => {
  const {id} = route.params;

  let name = 'codex.history'

  const d = storage.session.get(name)

  storage.session.set(name, {
    ...d?.data?.value || {},
    [id as string]: {
      id,
      category: 'npc',
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
      <v-breadcrumbs-item to="/codex/npcs">{{ t('codex.npcs.title') }}</v-breadcrumbs-item>
      <v-breadcrumbs-divider></v-breadcrumbs-divider>
      <v-breadcrumbs-item>{{ t('codex.npc.title') }}</v-breadcrumbs-item>
    </v-container>
  </v-breadcrumbs>
  <v-divider></v-divider>
  <div class="npc-detail" v-if="npcDetailData && npcDetailData.id">
    <div class="npc-detail-header background-dot-grid">
      <v-container class="position-relative">
        <v-row class="mt-5">
          <v-col cols="8">
            <h1 class="text-amber text-h2 singe-line">
              <NpcName :data="npcDetailData"></NpcName>
            </h1>
            <p class="mt-2 mb-3">
              <v-icon icon="mdi-identifier"/>
              {{ npcDetailData.id || 'none' }}
            </p>

            <div class="mt-5 d-flex ga-2">
              <v-chip class="badge-flavor text-center tag-badge text-black"
                      v-if="npcDetailData.type"
                      :to="`/codex/npcs?type=${npcDetailData.type}`">
                {{ t(`codex.npc.types.${npcDetailData.type}`) || '' }}
              </v-chip>
              <template v-if="Array.isArray(npcDetailData.category)">
                <v-chip class="badge-flavor text-center tag-badge text-black"
                        v-for="(i, index) in npcDetailData.category"
                        :key="index">
                  {{ t(`codex.npc.categorys.${i}`) }}
                </v-chip>
              </template>
            </div>
          </v-col>
          <v-spacer></v-spacer>
          <v-col cols="auto">
            <div class="d-flex ga-2">
              <v-btn v-if="authStore.isLogin" border>
                <LikeWidget targetType="item"
                            :isShowCount="true"
                            :targetId="npcDetailData.id">
                  <template v-slot:activate>
                    <v-icon icon="mdi-thumb-up"></v-icon>
                  </template>
                  <template v-slot:unActivate>
                    <v-icon icon="mdi-thumb-up-outline"></v-icon>
                  </template>
                </LikeWidget>
              </v-btn>

              <ShareWidget type="npc" :target-id="npcDetailData.id" />
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
              <div>
                <ItemSlotBase size="130px">
                  <NpcIconWidget :data="npcDetailData" :isOpenDetail="false" :isShowOpenDetail="false"></NpcIconWidget>
                </ItemSlotBase>
                <WeaponModificationWidget :data="npcDetailData"></WeaponModificationWidget>
              </div>
              <v-col>
                <p class="text-pre-wrap mb-4">
                  <span v-for="(i ,index) in asArray([
                      `snb.items.${npcDetailData.id}.description`,
                      `snb.items.${npcDetailData.id}.description.general`,
                      `snb.items.${sanitizeString(npcDetailData.id).cleaned}.description.general`
                    ])" :key="index">
                    {{ i }}
                  </span>
                </p>
              </v-col>
            </v-row>
            <v-divider class="mt-10 mb-6"></v-divider>

            <v-row class="mb-3">
              <v-col cols="12" sm="12" lg="6" xl="6">
                <template v-if="appStore.isDebug">
                  {{ npcDetailData }}
                </template>
                <template v-if="npcDetailData.id">
                  <v-text-field :value="npcDetailData.id" readonly
                                hide-details
                                variant="underlined" density="compact">
                    <template v-slot:append-inner>
                      <p class="text-no-wrap">ID</p>
                    </template>
                  </v-text-field>
                </template>
              </v-col>
              <v-col cols="12" sm="12" lg="12" xl="12" v-if="npcDetailData.slots?.container">
                <v-divider>{{ t('codex.item.contentsTitle') }}</v-divider>

                <v-row align="end" justify="center" class="d-flex ga-2 mt-2">
                  <v-col cols="auto" v-for="(i,index) in npcDetailData.slots?.container?.data" :key="index">
                    <div class="text-center">
                      <ItemSlotBase size="50px" :padding="0" class="mx-auto mb-2">
                        <ItemIconWidget :id="i.id" :padding="1"></ItemIconWidget>
                      </ItemSlotBase>
                      <ItemName :data="i"></ItemName>
                    </div>
                  </v-col>
                </v-row>
              </v-col>
              <v-col cols="12" sm="12" lg="12" xl="12" v-if="npcDetailData.slots?.worker">
                <v-divider>{{ t('codex.npc.workerTitle') }}</v-divider>

                <v-row align="end" justify="center" class="d-flex ga-2 mt-2">
                  <v-col cols="auto" v-for="(i,index) in npcDetailData.slots?.worker?.data" :key="index">
                    <div class="text-center" v-if="i && i.id">
                      <ItemSlotBase size="50px" :padding="0" class="mx-auto mb-2">
                        <MaterialIconWidget :id="i.id" :padding="1"></MaterialIconWidget>
                      </ItemSlotBase>
                      <MaterialName :id="i.id"></MaterialName>
                    </div>
                  </v-col>
                </v-row>
              </v-col>
            </v-row>

            <template v-if="npcDetailData.id">
              <v-divider>{{ t('comment.title') }}</v-divider>
              <CommentWidget :id="npcDetailData.id" type="npc" placeholder=""></CommentWidget>
            </template>
          </v-col>
          <v-col cols="12" sm="12" md="4" lg="4" order="1" order-sm="2">
            <BySeasonWidget :data="npcDetailData"></BySeasonWidget>

            <AffixContainerView :offsetTop="80">
              <VerticalScrollList :force-draggable="false" :is-indicator="false" height="calc(100vh - 120px)">

                <template v-if="npcDetailData.worldEvent">
                  <ByWorldEventWidget :data="npcDetailData"></ByWorldEventWidget>
                </template>
                <template v-if="npcDetailData.obtainable || npcDetailData.location">
                  <ByObtainableWidget :data="npcDetailData" byType="item">
                    {{ t('codex.item.obtainable') }}
                  </ByObtainableWidget>
                </template>
                <template v-if="npcDetailData.faction">
                  <v-text-field
                      :value="t(`snb.factions.${npcDetailData.faction.id}.name`)"
                      readonly
                      hide-details
                      variant="underlined" density="compact">
                    <template v-slot:prepend-inner>
                      <ItemSlotBase size="25px" class="d-flex justify-center align-center mb-2" :padding="0">
                        <FactionIconWidget :name="npcDetailData.faction.id"
                                           size="25px"></FactionIconWidget>
                      </ItemSlotBase>
                    </template>
                    <template v-slot:append-inner>
                      <p class="text-no-wrap">{{ t('codex.item.faction') }}</p>
                    </template>
                  </v-text-field>
                </template>
                <template v-if="npcDetailData.rarity">
                  <v-text-field readonly
                                hide-details
                                variant="underlined" density="compact">
                    <template v-slot:prepend>
                      <v-badge dot inline :color="rarityColorConfig[npcDetailData.rarity]" class="ma-1 pt-0"></v-badge>
                    </template>
                    <template v-slot:prepend-inner>
                      <ItemNameRarity :id="npcDetailData.id">
                        <router-link :to="`/codex/item/rarity/${npcDetailData.rarity}`" class="text-no-wrap">
                          {{ t(`codex.raritys.${npcDetailData.rarity}`) || 'none' }}
                        </router-link>
                      </ItemNameRarity>
                    </template>
                    <template v-slot:append-inner>
                      <p class="text-no-wrap">{{ t('codex.item.rarity') }}</p>
                    </template>
                  </v-text-field>
                </template>

                <v-text-field readonly
                              hide-details
                              v-if="npcDetailData.dateAdded"
                              variant="underlined" density="compact">
                  <template v-slot:prepend-inner>
                    <TimeView :time="npcDetailData.dateAdded" class="singe-line">
                      <Time :time="npcDetailData.dateAdded"></Time>
                    </TimeView>
                  </template>
                  <template v-slot:append-inner>
                    <p class="text-no-wrap">{{ t('codex.ship.dateAdded') }}</p>
                  </template>
                </v-text-field>
                <v-text-field readonly
                              hide-details
                              v-if="npcDetailData.lastUpdated"
                              variant="underlined" density="compact">
                  <template v-slot:prepend-inner>
                    <TimeView :time="npcDetailData.lastUpdated" class="singe-line">
                      <Time :time="npcDetailData.lastUpdated"></Time>
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
.npc-detail {
  .npc-detail-header {
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

    .npc-detail-header-img {
      position: absolute;
      right: 20px;
      bottom: -120px;
      width: 300px;
      min-height: 300px;
    }
  }
}
</style>
