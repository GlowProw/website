<script setup lang="ts">
import {useI18n} from "vue-i18n";
import {useRoute, useRouter} from "vue-router";
import {computed, onMounted, ref, type Ref, watch} from "vue";

import ItemSlotBase from "@/components/snbWidget/ItemSlotBase.vue";
import FactionIconWidget from "@/components/snbWidget/factionIconWidget.vue";

import {Commodities, Cosmetics, Items, Materials, Npc, Npcs} from "glow-prow-data";

import {useI18nUtils} from "@/assets/sripts/i18n_util";
import TimeView from "@/components/TimeView.vue";
import Time from "@/components/Time.vue"
import {rarity, storage, getAppUrl} from "@/assets/sripts";
import CommentWidget from "@/components/CommentWidget.vue";
import LikeWidget from "@/components/LikeWidget.vue";
import {useAuthStore} from "~/stores/userAccountStore";
import {useHead} from "@unhead/vue";
import {useI18nReadName} from "@/assets/sripts/i18n_read_name";
import ShareWidget from "@/components/ShareWidget.vue";
import CollectionToggle from "@/components/CollectionToggle.vue";
import {useCodexDetailHotkeys} from "@/assets/sripts/codex_detail_hotkeys";
import CodexItemStatsCard from "@/components/CodexItemStatsCard.vue";
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
import CosmeticIconWidget from "@/components/snbWidget/cosmeticIconWidget.vue";
import CosmeticName from "@/components/snbWidget/cosmeticName.vue";
import CommoditieIconWidget from "@/components/snbWidget/commoditieIconWidget.vue";
import CommoditieName from "@/components/snbWidget/commoditieName.vue";

import {useCDNAssetsServiceStore} from "~/stores/cdnAssetsStore";
import VerticalScrollList from "@/components/VerticalScrollList.vue";
import {useAppStore} from "~/stores/appStore";
import Banner from "@/components/Banner.vue";

const
    {t, te, messages} = useI18n(),
    router = useRouter(),
    route = useRoute(),
    appStore = useAppStore(),
    authStore = useAuthStore(),
    {asArray, asString, sanitizeString} = useI18nUtils(),
    i18nReadName = useI18nReadName(),
    cdnStore = useCDNAssetsServiceStore(),
    npcs: any = Npcs,
    rarityColorConfig = rarity.color;

/**
 * 从槽位数据项提取物品唯一标识
 *
 * @param entry 槽位元素项（字符串标识或带 id 的对象）
 */
const getSlotItemId = (entry: any): string => {
  if (!entry) return '';
  if (typeof entry === 'string') return entry;
  return entry.id || '';
};

/**
 * 判断条目所属图鉴类型，用于分发对应图标与名称部件
 *
 * @param itemId 物品标识
 */
const resolveSlotItemType = (itemId: string): 'item' | 'material' | 'cosmetic' | 'commodity' => {
  if ((Items as Record<string, any>)[itemId]) return 'item';
  if ((Materials as Record<string, any>)[itemId]) return 'material';
  if ((Cosmetics as Record<string, any>)[itemId]) return 'cosmetic';
  if ((Commodities as Record<string, any>)[itemId]) return 'commodity';
  return 'item';
};

/**
 * 获取槽位对应的标题多语言文本
 *
 * @param slotKey 槽位键名
 */
const getSlotTitle = (slotKey: string): string => {
  const i18nKey = `codex.npc.slots.${slotKey}`;
  if (te(i18nKey)) {
    return t(i18nKey);
  }
  if (slotKey === 'container') {
    return t('codex.item.contentsTitle');
  }
  if (slotKey === 'worker') {
    return t('codex.npc.workerTitle');
  }
  return slotKey;
};

const id = computed(() => {
  const paramId = route.params.id;
  return Array.isArray(paramId) ? paramId[0] : paramId;
});

const npcDetailData = computed(() => {
  if (!id.value) return null;
  return npcs[id.value] || null;
});

const headData = computed(() => {
  if (!id.value) return null;
  return i18nReadName.npc(id.value);
});

const headName = computed(() => {
  if (!headData.value) return '';
  return headData.value.name(npcDetailData.value?.location) || '';
});

const headDescription = computed(() => {
  if (!headData.value) return '';
  return (headData.value.description() as string) || '';
});

useCodexDetailHotkeys({
  targetType: 'npc',
  targetId: () => npcDetailData.value?.id || id.value || '',
  targetName: () => headName.value,
  list: () => Object.keys(npcs).map(key => ({id: key})),
})

const imageUrl = computed(() => {
  if (!npcDetailData.value?.id) return '';
  return cdnStore.currentService.image.url({
    id: npcDetailData.value.id,
    category: 'npcs'
  });
});

useHead(() => {
  const currentName = headName.value;
  const currentDesc = headDescription.value;
  const currentId = id.value || '';
  const currentImg = imageUrl.value;

  const titleText = currentName
      ? `${currentName} - ${t(route.meta.title as string || 'codex.npc.title')}`
      : t(route.meta.title as string || 'codex.npc.title');

  return {
    title: titleText,
    titleTemplate: `%s | ${t('name')}`,
    meta: [
      {name: 'description', content: currentDesc},
      {
        name: 'keywords',
        content: t(route.meta.keywords as string || 'codex.npc.meta.keywords', {
          keywords: Object.keys(messages.value).map(lang => {
            return headData.value?.keysName?.map((key: any) => i18nReadName.getValue(messages.value[lang], key)).filter((i: any) => i != null) || [];
          }).concat([currentId]) + `,${t('home.meta.keywords')}`
        })
      },
      {property: 'og:type', content: 'website'},
      {property: 'og:title', content: `${currentName || titleText} | ${t('name')}`},
      {property: 'og:description', content: currentDesc},
      {property: 'og:image', content: currentImg},
      {property: 'og:url', content: typeof window !== 'undefined' ? window.location.href : getAppUrl(route.fullPath || route.path)},
      {property: 'og:site_name', content: t('name')},
      {name: 'twitter:card', content: 'summary_large_image'},
      {name: 'twitter:title', content: `${currentName || titleText} | ${t('name')}`},
      {name: 'twitter:description', content: currentDesc},
      {name: 'twitter:image', content: currentImg}
    ]
  };
});

onMounted(() => {
  if (!id.value) {
    router.push('/');
    return;
  }
  if (!npcDetailData.value) {
    router.push({name: 'NotFound'});
    return;
  }
  onCodexHistory();
});

const onCodexHistory = () => {
  if (typeof window === 'undefined' || !id.value) return;
  let name = 'codex.history';
  const d = storage.session.get(name);
  storage.session.set(name, {
    ...d?.data?.value || {},
    [id.value]: {
      id: id.value,
      category: 'npc',
      time: new Date().getTime()
    }
  });
};
</script>

<template>
  <v-breadcrumbs density="compact" class="ma-0 pa-0 bg-black">
    <v-container>
      <v-breadcrumbs-item to="/">{{ t('portal.title') }}</v-breadcrumbs-item>
      <v-breadcrumbs-divider></v-breadcrumbs-divider>
      <v-breadcrumbs-item to="/codex">{{ t('codex.title') }}</v-breadcrumbs-item>
      <v-breadcrumbs-divider></v-breadcrumbs-divider>
      <v-breadcrumbs-item to="/codex/npcs">{{ t('codex.npcs.title') }}</v-breadcrumbs-item>
      <v-breadcrumbs-divider></v-breadcrumbs-divider>
      <v-breadcrumbs-item>{{ t('codex.npc.title') }}</v-breadcrumbs-item>
    </v-container>
  </v-breadcrumbs>
  <v-divider opacity=".01"></v-divider>
  <div class="npc-detail" v-if="npcDetailData && npcDetailData.id">
    <Banner class="npc-detail-header">
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
                {{ t(`codex.npc.types.${npcDetailData.type}`) }}
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
                <LikeWidget targetType="npc"
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

              <CollectionToggle target-type="npc" :target-id="npcDetailData.id"></CollectionToggle>
              <ShareWidget type="npc" :target-id="npcDetailData.id" />
            </div>
          </v-col>
        </v-row>
      </v-container>
    </Banner>
    <div class="background-flavor">
      <v-container>
        <v-row>
          <v-col cols="12" sm="12" md="8" lg="8" order="2" order-sm="1">
            <v-row>
              <div>
                <ItemSlotBase size="130px">
                  <NpcIconWidget :data="npcDetailData" :isOpenDetail="false" :isShowOpenDetail="false"></NpcIconWidget>
                </ItemSlotBase>
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
              <!-- NPC 功能卡槽 S -->
              <template v-for="(slotData, slotKey) in (npcDetailData?.slots || {})" :key="slotKey">
                <v-col
                    cols="12"
                    sm="12"
                    lg="12"
                    xl="12"
                    v-if="slotData && typeof slotData === 'object' && Array.isArray((slotData as any).data) && (slotData as any).data.length > 0">
                  <v-divider>{{ getSlotTitle(String(slotKey)) }}</v-divider>

                  <v-row align="end" justify="center" class="d-flex ga-2 mt-2">
                    <v-col
                        cols="auto"
                        v-for="(entry, index) in (slotData as any).data"
                        :key="index">
                      <div class="text-center" v-if="getSlotItemId(entry)">
                        <ItemSlotBase size="50px" :padding="0" class="mx-auto mb-2">
                          <template v-if="resolveSlotItemType(getSlotItemId(entry)) === 'material'">
                            <MaterialIconWidget :id="getSlotItemId(entry)" :padding="1"></MaterialIconWidget>
                          </template>
                          <template v-else-if="resolveSlotItemType(getSlotItemId(entry)) === 'cosmetic'">
                            <CosmeticIconWidget :id="getSlotItemId(entry)" :padding="1"></CosmeticIconWidget>
                          </template>
                          <template v-else-if="resolveSlotItemType(getSlotItemId(entry)) === 'commodity'">
                            <CommoditieIconWidget :id="getSlotItemId(entry)" :padding="1"></CommoditieIconWidget>
                          </template>
                          <template v-else>
                            <ItemIconWidget :id="getSlotItemId(entry)" :padding="1"></ItemIconWidget>
                          </template>
                        </ItemSlotBase>

                        <template v-if="resolveSlotItemType(getSlotItemId(entry)) === 'material'">
                          <MaterialName :id="getSlotItemId(entry)"></MaterialName>
                        </template>
                        <template v-else-if="resolveSlotItemType(getSlotItemId(entry)) === 'cosmetic'">
                          <CosmeticName :id="getSlotItemId(entry)"></CosmeticName>
                        </template>
                        <template v-else-if="resolveSlotItemType(getSlotItemId(entry)) === 'commodity'">
                          <CommoditieName :id="getSlotItemId(entry)"></CommoditieName>
                        </template>
                        <template v-else>
                          <ItemName :id="getSlotItemId(entry)"></ItemName>
                        </template>
                      </div>
                    </v-col>
                  </v-row>
                </v-col>
              </template>
              <!-- NPC 功能卡槽 E -->
            </v-row>

            <template v-if="npcDetailData.id">
              <div class="mt-10">
                <CommentWidget :id="npcDetailData.id" type="npc" placeholder=""></CommentWidget>
              </div>
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
                    {{ t('map.locations') }}
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
                    </TimeView>
                  </template>
                  <template v-slot:append-inner>
                    <p class="text-no-wrap">{{ t('codex.ship.lastUpdated') }}</p>
                  </template>
                </v-text-field>

                <CodexItemStatsCard v-if="npcDetailData?.id || id" target-type="npc" :target-id="npcDetailData?.id || id" class="mt-4"></CodexItemStatsCard>
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
  }
}
</style>
