<script setup lang="ts">
import {onMounted, type Ref, ref, computed} from "vue";
import {useI18n} from "vue-i18n";
import {EmpireSkills} from "glow-prow-data";
import {useRoute, useRouter} from "vue-router";
import ItemSlotBase from "@/components/snbWidget/ItemSlotBase.vue";
import {storage} from "@/assets/sripts";
import EmpireSkillIconWidget from "@/components/snbWidget/empireSkillIconWidget.vue";
import EmpireSkillName from "@/components/snbWidget/empireSkillName.vue";
import EmpireSkillDescription from "@/components/snbWidget/empireSkillDescription.vue";
import FactionIconWidget from "@/components/snbWidget/factionIconWidget.vue";
import CommentWidget from "@/components/CommentWidget.vue";
import LikeWidget from "@/components/LikeWidget.vue";
import {useAuthStore} from "~/stores/userAccountStore";
import {useHead} from "@unhead/vue";
import {useI18nReadName} from "@/assets/sripts/i18n_read_name";
import ShareWidget from "@/components/ShareWidget.vue";
import BySeasonWidget from "@/components/BySeasonCardWidget.vue";
import {useCDNAssetsServiceStore} from "~/stores/cdnAssetsStore";
import VerticalScrollList from "@/components/VerticalScrollList.vue";
import AffixContainerView from "@/components/AffixContainerView.vue";
import HtmlLink from "@/components/HtmlLink.vue";

const {t, messages} = useI18n(),
    i18nReadName = useI18nReadName(),
    router = useRouter(),
    route = useRoute(),
    authStore = useAuthStore(),
    cdnStore = useCDNAssetsServiceStore();

let empireSkillDetailPageData = ref({
      loading: false,
    }),
    empireSkillDetailData: Ref<any> = ref(null),
    head: Ref<any> = ref({
      title: t(route.meta.title as string || 'codex.empireSkill.title'),
      titleTemplate: `%s | ${t('name')}`,
      meta: [
        {name: 'description', content: ''},
        {name: 'keywords', content: t(route.meta.keywords as string || 'codex.empireSkill.meta.keywords')},
        {property: 'og:type', content: 'website'},
        {property: 'og:title', content: `%s | ${t('name')}`},
        {property: 'og:description', content: ''},
        {property: 'og:site_name', content: t('name')},
      ]
    });

useHead(head);

onMounted(() => {
  const id = Array.isArray(route.params.id) ? route.params.id[0] : route.params.id;

  if (!id || id === 'root' || !EmpireSkills[id as string]) {
    router.push('/codex/empireSkills');
    return;
  }

  empireSkillDetailPageData.value.loading = true;
  empireSkillDetailData.value = EmpireSkills[id as string];

  const headData = i18nReadName.empireSkill(id as string),
      headName = headData.name(),
      headDescription = headData.description();

  head.value.titleTemplate = `${headName} - ${head.value.titleTemplate}`;

  const imageUrl = cdnStore.currentService.url({
    id: id as string,
    category: 'empireSkills'
  });

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
  ];

  onCodexHistory(id as string);
  empireSkillDetailPageData.value.loading = false;
});

const realRequisites = computed(() => {
  return (empireSkillDetailData.value?.requisite || []).filter((req: string) => req && req !== 'root');
});

const onCodexHistory = (id: string) => {
  let name = 'codex.history';
  const d = storage.session.get(name);
  storage.session.set(name, {
    ...d?.data?.value || {},
    [id]: {
      id,
      category: 'empireSkill',
      time: new Date().getTime()
    }
  });
};
</script>

<template>
  <v-breadcrumbs>
  <v-container class="pa-0">
      <v-breadcrumbs-item to="/codex/">{{ t('codex.title') }}</v-breadcrumbs-item>
      <v-breadcrumbs-divider></v-breadcrumbs-divider>
      <v-breadcrumbs-item to="/codex/empireSkills">{{ t('codex.empireSkills.title') }}</v-breadcrumbs-item>
      <v-breadcrumbs-divider></v-breadcrumbs-divider>
      <v-breadcrumbs-item>{{ t('codex.empireSkill.title') }}</v-breadcrumbs-item>
    </v-container>
  </v-breadcrumbs>
  <v-divider></v-divider>

  <div class="empire-skill-detail" v-if="empireSkillDetailData && !empireSkillDetailPageData.loading">
    <div class="empire-skill-detail-header background-dot-grid">
      <v-container class="position-relative">
        <v-row class="mt-5" align="center">
          <v-col>
            <h1 class="text-amber text-h3 font-weight-bold">
              <EmpireSkillName :id="empireSkillDetailData.id"></EmpireSkillName>
            </h1>
            <p class="mt-2 mb-3 text-caption text-grey">
              <v-icon icon="mdi-identifier" size="small"/>
              {{ empireSkillDetailData.id }}
            </p>

            <v-chip class="badge-flavor text-center tag-badge text-black" v-if="empireSkillDetailData.stage">
              {{ t('empireSkillSimulation.stage', {num: empireSkillDetailData.stage}) }}
            </v-chip>
          </v-col>
          <v-spacer></v-spacer>
          <v-col cols="auto">
            <v-btn class="mr-2">
              <LikeWidget v-if="authStore.isLogin"
                          targetType="empireSkill"
                          :isShowCount="true"
                          :targetId="empireSkillDetailData.id">
                <template v-slot:activate>
                  <v-icon icon="mdi-thumb-up"></v-icon>
                </template>
                <template v-slot:unActivate>
                  <v-icon icon="mdi-thumb-up-outline"></v-icon>
                </template>
              </LikeWidget>
            </v-btn>
            <ShareWidget type="empireSkill" :target-id="empireSkillDetailData.id" />
          </v-col>
        </v-row>
      </v-container>
    </div>

    <div class="background-flavor py-6">
      <v-container>
        <v-row>
          <v-col cols="12" sm="12" md="8" lg="8" order="2" order-sm="1">
            <v-row class="mb-6">
              <v-col cols="auto">
                <ItemSlotBase size="120px" class="mr-3">
                  <EmpireSkillIconWidget :id="empireSkillDetailData.id"
                                         :isOpenDetail="false"
                                         :isShowOpenDetail="false"
                                         :isShowTooltip="false"
                                         class="pa-2"></EmpireSkillIconWidget>
                </ItemSlotBase>
              </v-col>
              <v-col>
                <h3 class="text-amber text-subtitle-1 mb-2">{{ t('empireSkillSimulation.effects') }}</h3>
                <div class="text-pre-wrap">
                  <EmpireSkillDescription :id="empireSkillDetailData.id" />
                </div>
              </v-col>
            </v-row>

            <!-- Prerequisites / Requisites -->
            <template v-if="realRequisites.length > 0">
              <v-divider class="my-6"></v-divider>
              <h3 class="text-amber text-subtitle-1 mb-3">{{ t('empireSkillSimulation.requirements') }}</h3>
              <v-list density="compact" class="bg-transparent pa-0">
                <v-list-item v-for="req in realRequisites" :key="req" class="px-0">
                  <v-row no-gutters align="center">
                    <v-col cols="auto" class="mr-2">
                      <ItemSlotBase size="28px" :padding="0">
                        <EmpireSkillIconWidget :id="req" :isShowTooltip="true" :isOpenDetail="true" size="28px" />
                      </ItemSlotBase>
                    </v-col>
                    <v-col>
                      <router-link :to="`/codex/empireSkill/${req}`" class="text-amber text-decoration-none">
                        <EmpireSkillName :id="req" />
                      </router-link>
                    </v-col>
                  </v-row>
                </v-list-item>
              </v-list>
            </template>

            <!-- Required Cost -->
            <template v-if="empireSkillDetailData.requiredCost && Object.keys(empireSkillDetailData.requiredCost).length > 0">
              <v-divider class="my-6"></v-divider>
              <h3 class="text-amber text-subtitle-1 mb-3">{{ t('empireSkillSimulation.requiredCost') }}</h3>
              <v-table density="compact" class="bg-transparent border">
                <thead>
                  <tr>
                    <th>{{ t('empireSkillSimulation.stage', {num: '#'}) }}</th>
                    <th v-for="(vals, costKey) in empireSkillDetailData.requiredCost" :key="costKey">
                      {{ costKey }}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="stageIdx in empireSkillDetailData.stage || 1" :key="stageIdx">
                    <td>{{ t('empireSkillSimulation.stage', {num: stageIdx}) }}</td>
                    <td v-for="(vals, costKey) in empireSkillDetailData.requiredCost" :key="costKey">
                      {{ vals[stageIdx - 1] ?? '-' }}
                    </td>
                  </tr>
                </tbody>
              </v-table>
            </template>

            <!-- Comments -->
            <v-divider class="my-8">{{ t('comment.title') }}</v-divider>
            <CommentWidget :id="empireSkillDetailData.id" type="empireSkill" placeholder=""></CommentWidget>
          </v-col>

          <!-- Sidebar Info -->
          <v-col cols="12" sm="12" md="4" lg="4" order="1" order-sm="2">
            <BySeasonWidget :data="empireSkillDetailData" v-if="empireSkillDetailData.bySeason"></BySeasonWidget>

            <AffixContainerView :offsetTop="80">
              <VerticalScrollList :force-draggable="false" :is-indicator="false" height="calc(100vh - 120px)">
                <v-text-field :value="empireSkillDetailData.id" readonly
                              hide-details
                              variant="underlined" density="compact">
                  <template v-slot:append-inner>
                    <p class="text-no-wrap">ID</p>
                  </template>
                </v-text-field>

                <v-text-field :value="t(`snb.factions.${empireSkillDetailData.type}.name`)" readonly
                              hide-details
                              v-if="empireSkillDetailData.type"
                              variant="underlined" density="compact">
                  <template v-slot:append-inner>
                    <p class="text-no-wrap">阵营</p>
                  </template>
                </v-text-field>

                <v-text-field :value="empireSkillDetailData.stage || 1" readonly
                              hide-details
                              variant="underlined" density="compact">
                  <template v-slot:append-inner>
                    <p class="text-no-wrap">阶级数</p>
                  </template>
                </v-text-field>

                <v-text-field :value="empireSkillDetailData.dateAdded ? new Date(empireSkillDetailData.dateAdded).toLocaleDateString() : '-'" readonly
                              hide-details
                              variant="underlined" density="compact">
                  <template v-slot:append-inner>
                    <p class="text-no-wrap">添加日期</p>
                  </template>
                </v-text-field>

                <v-text-field :value="empireSkillDetailData.lastUpdated ? new Date(empireSkillDetailData.lastUpdated).toLocaleDateString() : '-'" readonly
                              hide-details
                              variant="underlined" density="compact">
                  <template v-slot:append-inner>
                    <p class="text-no-wrap">更新日期</p>
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
.empire-skill-detail {
  min-height: 80vh;
}
.empire-skill-detail-header {
  padding-bottom: 24px;
}
</style>
