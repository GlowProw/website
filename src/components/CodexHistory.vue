<script setup lang="ts">
import UltimateIconWidget from "@/components/snbWidget/ultimateIconWidget.vue";
import MapLocationIconWidget from "@/components/snbWidget/mapLocationIconWidget.vue";
import MaterialIconWidget from "@/components/snbWidget/materialIconWidget.vue";
import TreasureMapIconWidget from "@/components/snbWidget/treasureMapIconWidget.vue";
import CosmeticIconWidget from "@/components/snbWidget/cosmeticIconWidget.vue";
import CommoditieIconWidget from "@/components/snbWidget/commoditieIconWidget.vue";
import ItemSlotBase from "@/components/snbWidget/ItemSlotBase.vue";
import ShipIconWidget from "@/components/snbWidget/shipIconWidget.vue";
import ItemIconWidget from "@/components/snbWidget/itemIconWidget.vue";
import ModIconWidget from "@/components/snbWidget/modIconWidget.vue";
import NpcIconWidget from "@/components/snbWidget/npcIconWidget.vue";
import EmpireSkillIconWidget from "@/components/snbWidget/empireSkillIconWidget.vue";
import MasteryIconWidget from "@/components/snbWidget/masteryIconWidget.vue";
import QuestIconWidget from "@/components/snbWidget/questIconWidget.vue";
import EnemiesIconWidget from "@/components/snbWidget/enemiesIconWidget.vue";
import SetIconWidget from "@/components/snbWidget/setIconWidget.vue";
import {onMounted, ref} from "vue";
import {storage} from "@/assets/sripts/index";
import {getCodexDetailPath} from "@/assets/sripts/codex_detail";
import {useI18n} from "vue-i18n";
import type {CodexHistoryProps} from "@/assets/types/Ui";

const {t} = useI18n();

const props = withDefaults(defineProps<CodexHistoryProps>(), {
  isShowHeader: true,
  isShowEmpty: false,
  selectedId: ''
});

let codexHistorys = ref<any[]>([]);

onMounted(() => {
  getCodexHistory();
});

/**
 * 获取历史记录
 */
const getCodexHistory = () => {
  let name = 'codex.history';

  const d = storage.session.get(name);

  if (d.code == 0)
    codexHistorys.value = Object.values(d.data.value);
};

/**
 * 清理历史
 */
const onCleaningHistory = () => {
  let name = 'codex.history';

  codexHistorys.value = [];
  return storage.session.rem(name);
};

/**
 * 生成浏览记录对应的详情页地址
 * @param item 浏览记录
 */
const detailPath = (item: any) => getCodexDetailPath(item.category, item.id)
</script>

<template>
  <div class="w-100 mb-10" v-if="codexHistorys.length > 0">
    <v-toolbar class="py-0 px-5 bg-transparent" v-if="isShowHeader">
      <v-row align="center">
        <v-col cols="auto" class="font-weight-bold text-amber">
          <v-icon>mdi-history</v-icon>
        </v-col>
        <v-col class="text-amber">
          <v-divider opacity=".2" thickness="2">
            {{ t('codex.cabinetHistoryTitle') }}
            ({{ codexHistorys.length || 0 }})
          </v-divider>
        </v-col>
        <v-col cols="auto">
          <v-btn density="compact" icon="mdi-delete" @click="onCleaningHistory" v-if="codexHistorys.length >= 0"></v-btn>
        </v-col>
      </v-row>
    </v-toolbar>

    <v-row>
      <v-col cols="auto" v-for="(i, index) in codexHistorys" :key="index">
        <router-link :to="detailPath(i)" class=" ">
          <ItemSlotBase size="99px" class="codex-history-link" :class="{'codex-history-link--selected': props.selectedId === i.id}">
            <ShipIconWidget :id="i.id" v-if="i.category == 'ship'"></ShipIconWidget>
            <ItemIconWidget :id="i.id" v-if="i.category == 'item'"></ItemIconWidget>
            <CommoditieIconWidget :id="i.id" v-if="i.category == 'commoditie'"></CommoditieIconWidget>
            <UltimateIconWidget :id="i.id" v-if="i.category == 'ultimate'"></UltimateIconWidget>
            <MaterialIconWidget :id="i.id" v-if="i.category == 'material'"></MaterialIconWidget>
            <MapLocationIconWidget :id="i.id" v-if="i.category == 'mapLocation'"></MapLocationIconWidget>
            <TreasureMapIconWidget :id="i.id" v-if="i.category == 'treasureMap'"></TreasureMapIconWidget>
            <SetIconWidget :id="i.id" v-if="i.category == 'set'"></SetIconWidget>
            <CosmeticIconWidget :id="i.id" v-if="i.category == 'cosmetic'"></CosmeticIconWidget>
            <ModIconWidget :id="i.id" v-if="i.category == 'modification'"></ModIconWidget>
            <NpcIconWidget :id="i.id" v-if="i.category == 'npc'"></NpcIconWidget>
            <EmpireSkillIconWidget :id="i.id" v-if="i.category == 'empireSkill'"></EmpireSkillIconWidget>
            <MasteryIconWidget :id="i.id" v-if="i.category == 'mastery'"></MasteryIconWidget>
            <QuestIconWidget :id="i.id" v-if="i.category == 'quest'"></QuestIconWidget>
            <EnemiesIconWidget :id="i.id" v-if="i.category == 'enemy'"></EnemiesIconWidget>
          </ItemSlotBase>
        </router-link>
      </v-col>
    </v-row>
  </div>

  <div v-else-if="isShowEmpty" class="text-center text-medium-emphasis pa-8">
    <v-icon icon="mdi-history" size="48" class="mb-3"/>
    <p>{{ t('codex.cabinetHistoryEmpty') }}</p>
  </div>
</template>

<style scoped lang="less">
@import "@/assets/styles";

.codex-history-link--selected {
  outline: 2px solid rgb(var(--main-color));
  outline-offset: 2px;
  border-radius: 4px;
}
</style>
