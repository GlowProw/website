<script setup lang="ts">

import {useI18n} from "vue-i18n";
import {onMounted, Ref, ref} from "vue";
import {Modifications} from "glow-prow-data";
import {useRoute} from "vue-router";
import {useAuthStore} from "~/stores/userAccountStore";

import ModName from "@/components/snbWidget/modName.vue";
import Time from "@/components/Time.vue";
import TimeView from "@/components/TimeView.vue";
import ItemSlotBase from "@/components/snbWidget/ItemSlotBase.vue";
import CommentWidget from "@/components/CommentWidget.vue";
import BySeasonWidget from "@/components/BySeasonCardWidget.vue";
import WeaponModificationWidget from "@/components/snbWidget/weaponModificationWidget.vue";
import ModIconWidget from "@/components/snbWidget/modIconWidget.vue";
import ModDescription from "@/components/snbWidget/modDescription.vue";
import LikeWidget from "@/components/LikeWidget.vue";
import {storage} from "@/assets/sripts/index";
import {useHead} from "@unhead/vue";
import {useI18nReadName} from "@/assets/sripts/i18n_read_name";

const {t, messages} = useI18n(),
    route = useRoute(),
    i18nReadName = useI18nReadName(),
    authStore = useAuthStore(),
    mods = Modifications

let modDetailData: Ref<any> = ref({}),

    // meta
    head = ref({
      title: t(route.meta.title as string),
      titleTemplate: `%s | ${t('name')}`,
      meta: [
        {name: 'keywords', content: t(route.meta.keywords as string)},
        {name: 'og:title', content: `%s | ${t('name')}`},
      ]
    })

useHead(head)

onMounted(() => {
  const {id} = route.params

  if (id)
    modDetailData.value = mods[id as string]

  head.value.titleTemplate = `${i18nReadName.modification(id as string).name()} - ${head.value.titleTemplate}`
  head.value.meta = [
    {
      name: 'keywords', content: t(route.meta.keywords as string, {
        keywords: Object.keys(messages.value).map(lang => {
          return i18nReadName.modification(id as string).keys.map(key => i18nReadName.getValue(messages.value[lang], key)).filter(i => i != null)
        }).concat([id as string]) + `,${t('home.meta.keywords')}`
      })
    },
    {name: 'og:title', content: `${t(route.meta.title as string)} | ${t('name')}`},
  ]

  onCodexHistory()
})

const onCodexHistory = () => {
  const {id} = route.params;

  let name = 'codex.history'

  const d = storage.session.get(name)

  storage.session.set(name, {
    ...d?.data?.value || {},
    [id as string]: {
      id,
      category: 'modification',
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
      <v-breadcrumbs-item to="/codex/modifications">{{ t('codex.modifications.title') }}</v-breadcrumbs-item>
      <v-breadcrumbs-divider></v-breadcrumbs-divider>
      <v-breadcrumbs-item>{{ t('codex.modification.title') }}</v-breadcrumbs-item>
    </v-container>
  </v-breadcrumbs>
  <v-divider></v-divider>
  <div class="cosmetic-detail">
    <div class="cosmetic-detail-header background-dot-grid">
      <v-container class="position-relative">
        <v-row class="mt-5">
          <v-col cols="8">
            <h1 class="text-amber text-h2 singe-line">
              <ModName :id="modDetailData.id" :grade="modDetailData.grade"></ModName>
            </h1>
            <p class="mt-2 mb-3">
              <v-icon icon="mdi-identifier"/>
              {{ modDetailData.id || 'none' }}
            </p>

            <div class="mt-5 d-flex ga-2">
              <v-chip class="badge-flavor text-center tag-badge text-black" v-if="modDetailData.grade">
                {{ t(`assembly.tags.grade.${modDetailData.grade}`) }}
              </v-chip>
              <v-chip class="badge-flavor text-center tag-badge text-black" v-if="modDetailData.effectType">
                {{ t(`codex.modification.effectType.${modDetailData.effectType}`) }}
              </v-chip>
              <v-chip class="badge-flavor text-center tag-badge text-black" v-if="modDetailData.damageType">
                {{ t(`assembly.tags.damageTypes.${modDetailData.damageType}`) }}
              </v-chip>
            </div>
          </v-col>
          <v-spacer></v-spacer>
          <v-col cols="auto">
            <div class="d-flex ga-2">
              <v-btn v-if="authStore.isLogin">
                <LikeWidget targetType="mod"
                            :isShowCount="true"
                            :targetId="modDetailData.id">
                  <template v-slot:activate>
                    <v-icon icon="mdi-thumb-up"></v-icon>
                  </template>
                  <template v-slot:unActivate>
                    <v-icon icon="mdi-thumb-up-outline"></v-icon>
                  </template>
                </LikeWidget>
              </v-btn>

              <v-btn>{{ t('codex.share.title') }}</v-btn>
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
                  <ModIconWidget :id="modDetailData.id" :isOpenDetail="false" :isShowOpenDetail="false"></ModIconWidget>
                </ItemSlotBase>
                <WeaponModificationWidget :data="modDetailData"></WeaponModificationWidget>
              </div>
              <v-col>
                <div v-for="(i,index) in modDetailData.variants" :key="index" class="mb-8">
                  <div class="d-flex ga-2">
                    <v-chip class="badge-flavor text-center tag-badge text-black"
                            :to="`/codex/items?type=${tag}`"
                            target="_blank"
                            v-for="(tag, tagIndex) in i.itemType" :key="tagIndex">
                      {{ t(`codex.types.${tag}`) }}
                    </v-chip>
                  </div>
                  <div class="mt-3">
                    <ModDescription class="opacity-50" :id="modDetailData.id" :variants="modDetailData.variants" :grade="modDetailData.grade" :type="i.itemType[0]"></ModDescription>
                  </div>
                </div>
              </v-col>
            </v-row>
            <v-divider class="mt-10 mb-6"></v-divider>

            <v-row class="mb-5">
              <v-col cols="12" sm="12" lg="6" xl="6">
                <template v-if="route.query.debug">
                  {{ modDetailData }}
                </template>
                <template v-if="modDetailData.id">
                  <v-text-field :value="modDetailData.id" readonly
                                hide-details
                                variant="underlined" density="compact">
                    <template v-slot:append-inner>
                      <p class="text-no-wrap">ID</p>
                    </template>
                  </v-text-field>
                </template>
              </v-col>
            </v-row>

            <template v-if="modDetailData.id">
              <v-divider>{{ t('comment.title') }}</v-divider>
              <CommentWidget :id="modDetailData.id" type="mod" placeholder=""></CommentWidget>
            </template>
          </v-col>
          <v-col cols="12" sm="12" md="4" lg="4" order="1" order-sm="2">
            <BySeasonWidget :data="modDetailData"></BySeasonWidget>

            <v-row no-gutters align="center" class="mt-2">
              <v-col cols="auto">
                <v-icon icon="mdi-calendar-range" class="mr-3"></v-icon>
              </v-col>
              <v-col>
                <TimeView class="mt-1" :time="modDetailData.dateAdded">
                  <Time :time="modDetailData.dateAdded"/>
                </TimeView>
              </v-col>
              <v-col cols="auto">
                <p class="text-no-wrap">{{ t('codex.item.dateAdded') }}</p>
              </v-col>
            </v-row>

            <v-row no-gutters align="center" class="mt-2">
              <v-col cols="auto">
                <v-icon icon="mdi-calendar-range" class="mr-3"></v-icon>
              </v-col>
              <v-col>
                <TimeView class="mt-1" :time="modDetailData.lastUpdated">
                  <Time :time="modDetailData.lastUpdated"/>
                </TimeView>
              </v-col>
              <v-col cols="auto">
                <p class="text-no-wrap">{{ t('codex.item.lastUpdated') }}</p>
              </v-col>
            </v-row>
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

  .raw-list {
    list-style-type: none !important;
  }
}
</style>
