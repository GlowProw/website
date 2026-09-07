<script setup lang="ts">
import {useI18n} from 'vue-i18n';
import RhombusWidget from '@/components/snbWidget/rhombusWidget.vue';
import MaterialIconWidget from '@/components/snbWidget/materialIconWidget.vue';
import ItemSlotBase from '@/components/snbWidget/ItemSlotBase.vue';
import FactionIconWidget from '@/components/snbWidget/factionIconWidget.vue';
import MaterialName from '@/components/snbWidget/materialName.vue';
import HtmlLink from '@/components/HtmlLink.vue';
import Time from '@/components/Time.vue';
import TimeView from '@/components/TimeView.vue';
import {number} from '@/assets/sripts/index';

const props = defineProps<{
  modelValue: boolean;
  selectedKey: string | null;
  skills: Record<string, any>;
  skillPointsInput: Record<string, number>;
  mobile: boolean;
  isDebug?: boolean;
  getIsSkillPointPossible: (key: string) => boolean;
  getNodeCoords?: (key: string) => any;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'move-node', key: string): void;
  (e: 'set-skill-point', key: string, type: 'add' | 'rem'): void;
  (e: 'debug-requisite-changed'): void;
  (e: 'export-debug-config'): void;
}>();

const {t} = useI18n();
</script>

<template>
  <v-card
      v-show="modelValue && selectedKey && skills[selectedKey]"
      border
      elevation="12"
      :width="mobile ? 'calc(100% - 50px)' : 450"
      :style="{
        'top': mobile ? '130px' : '70px'
      }"
      class="skill-tree-container-cardInfo overflow-y-auto">
    <template v-slot:title>
      <div
          class="mb-1 d-flex align-center text-caption my-2 mr-2"
          v-if="selectedKey && skills[selectedKey] && skills[selectedKey].type"
          :title="t(`snb.empireSkills.${selectedKey}.name`)">
        <ItemSlotBase size="20px" :padding="0" class="d-inline-flex">
          <FactionIconWidget :name="skills[selectedKey].type" size="20px"></FactionIconWidget>
        </ItemSlotBase>
        <span class="ml-2">{{ t(`snb.factions.${skills[selectedKey].type}.name`) }}</span>
      </div>
      <span class="text-amber font-weight-bold" v-if="selectedKey">
        {{ t(`snb.empireSkills.${skills[selectedKey] && skills[selectedKey].id}.name`) }}
      </span>
      <template v-if="selectedKey && (skillPointsInput[selectedKey] || 0) > 1">
        <span class="font-weight-bold ml-1">
          {{ number.intToRoman(skillPointsInput[selectedKey] || 0) }}
        </span>
      </template>
    </template>

    <template v-slot:append>
      <v-btn variant="tonal" icon @click="emit('update:modelValue', false)">
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </template>

    <!-- 效果说明 -->
    <div class="skill-tree-title px-10 mx-n6 py-2 text-amber-lighten-4">
      {{ t('empireSkillSimulation.effects') }}
      <template v-if="selectedKey && skills[selectedKey] && skills[selectedKey].stage > 1">
        ({{ skills[selectedKey].stage }})
      </template>
    </div>
    <div class="py-2 px-5 mb-5 text-pre-line text-body-2">
      <template v-if="selectedKey && skills[selectedKey] && skills[selectedKey].stage && skills[selectedKey].stage > 1">
        <template v-if="!skillPointsInput[selectedKey]">
          <!-- 未选择模拟，预览所有 -->
          <p class="opacity-60 mb-1" v-for="(to, toIndex) in skills[selectedKey].stage" :key="toIndex">
            {{ number.intToRoman(to) }}: {{ t(`snb.empireSkills.${skills[selectedKey] && skills[selectedKey].id}.effects.${to}`, {...skills[selectedKey].attr, faction: t(`snb.factions.${skills[selectedKey].type}.name`)}) || t('empireSkillSimulation.effectsNotContent') }}
          </p>
        </template>
        <template v-else>
          <!-- 选择模拟，预览对应 -->
          {{ t(`snb.empireSkills.${skills[selectedKey] && skills[selectedKey].id}.effects.${skillPointsInput[selectedKey] || '1'}`, {...skills[selectedKey].attr, faction: t(`snb.factions.${skills[selectedKey].type}.name`)}) }}
        </template>
      </template>
      <template v-else-if="selectedKey && skills[selectedKey] && skills[selectedKey].stage && skills[selectedKey].stage == 1">
        {{ t(`snb.empireSkills.${skills[selectedKey] && skills[selectedKey].id}.effects.general`, {...skills[selectedKey].attr, faction: t(`snb.factions.${skills[selectedKey].type}.name`)}) || t('empireSkillSimulation.effectsNotContent') }}
      </template>
    </div>

    <!-- 升级前置需求 -->
    <div class="skill-tree-title px-10 mx-n6 py-2 text-amber-lighten-4">{{ t('empireSkillSimulation.requirements') }}</div>
    <div class="py-2 px-5 mb-5">
      <template v-if="selectedKey && skills[selectedKey] && (skills[selectedKey].requisite || []).filter((r: string) => r !== 'root').length > 0">
        <p class="mb-1 text-caption opacity-70">需拥有以下所有升级</p>
        <v-row
            no-gutters
            v-for="(i, index) in skills[selectedKey].requisite.filter((r: string) => r !== 'root')"
            :key="index"
            align="center"
            class="my-1"
        >
          <v-col cols="auto" class="d-flex justify-center align-center mr-2">
            <RhombusWidget size="6" :solid="!!skillPointsInput[skills[i]?.id || i]" :activate="!!skillPointsInput[skills[i]?.id || i]"></RhombusWidget>
          </v-col>
          <v-col @click="emit('move-node', skills[i]?.key || i)">
            <HtmlLink class="cursor-pointer" :is-icon="false" :is-iframe-show="false">
              {{ t(`snb.empireSkills.${skills[i]?.id || i}.name`) }}
            </HtmlLink>
          </v-col>
        </v-row>
      </template>
      <div v-else class="text-caption opacity-60">
        无前置升级需求（起始节点）
      </div>
    </div>

    <!-- 升级消耗需求 -->
    <div class="skill-tree-title px-10 mx-n6 py-2 text-amber-lighten-4">{{ t('empireSkillSimulation.requiredCost') }}</div>
    <div class="py-2">
      <div v-if="selectedKey && skills[selectedKey] && skills[selectedKey].requiredCost">
        <v-list density="compact" nav class="pt-0 bg-transparent">
          <v-list-item v-for="(i, costKey) in skills[selectedKey].requiredCost" :key="costKey" class="pt-0">
            <v-row no-gutters align="center">
              <v-col class="d-flex justify-start align-center">
                <ItemSlotBase :size="`30px`" :padding="0">
                  <MaterialIconWidget :id="String(costKey)" item-type="items"></MaterialIconWidget>
                </ItemSlotBase>
                <span class="ml-2">
                  <HtmlLink :is-icon="false" :is-iframe-show="false" :href="`/codex/material/${costKey}`">
                    <MaterialName :id="String(costKey)"></MaterialName>
                  </HtmlLink>
                </span>
              </v-col>
              <v-col class="d-flex justify-end">
                <v-breadcrumbs :items="i" class="pa-0 ma-0">
                  <template v-slot:divider>
                    <v-icon icon="mdi-chevron-right"></v-icon>
                  </template>
                </v-breadcrumbs>
              </v-col>
            </v-row>
          </v-list-item>
        </v-list>
      </div>
    </div>

    <!-- 其他属性 -->
    <div class="skill-tree-title px-10 mx-n6 py-2 text-amber-lighten-4">{{ t('empireSkillSimulation.other') }}</div>
    <div class="py-2 mx-5 mb-2">
      <v-text-field :value="skills[selectedKey]?.id" hide-details readonly variant="underlined" density="compact">
        <template v-slot:append-inner>
          <v-icon>mdi-identifier</v-icon>
        </template>
      </v-text-field>

      <v-row no-gutters class="mt-2" align="center">
        <v-col cols="auto" class="mr-2 text-caption opacity-70">
          <v-icon icon="mdi-calendar-range" size="19"></v-icon>
          {{ t('empireSkillSimulation.lastUpdated') }}
        </v-col>
        <v-spacer></v-spacer>
        <v-col class="text-right">
          <TimeView :time="skills[selectedKey]?.lastUpdated" v-if="skills[selectedKey]?.lastUpdated">
            <Time :time="skills[selectedKey]?.lastUpdated"></Time>
          </TimeView>
        </v-col>
      </v-row>

      <v-row no-gutters class="mt-2" align="center">
        <v-col cols="auto" class="mr-2 text-caption opacity-70">
          <v-icon icon="mdi-calendar-range" size="19"></v-icon>
          {{ t('empireSkillSimulation.dateAdded') }}
        </v-col>
        <v-spacer></v-spacer>
        <v-col class="text-right">
          <TimeView :time="skills[selectedKey]?.dateAdded" v-if="skills[selectedKey]?.dateAdded">
            <Time :time="skills[selectedKey]?.dateAdded"></Time>
          </TimeView>
        </v-col>
      </v-row>
    </div>

    <!-- 底部操作按钮栏 -->
    <v-divider></v-divider>
    <div class="node-card-actions">
      <v-row align="center" no-gutters>
        <v-col class="text-center">
          <template v-if="skillPointsInput[selectedKey]">
            {{ t('empireSkillSimulation.stage', {num: skillPointsInput[selectedKey] || '0'}) }}
          </template>
          <template v-else>
            未激活
          </template>
        </v-col>
        <v-divider vertical></v-divider>
        <v-col cols="auto">
          <v-btn
              size="50"
              elevation="0"
              :disabled="!getIsSkillPointPossible(selectedKey)"
              @click="emit('set-skill-point', selectedKey, 'add')"
              tile
              block
              title="提升等级"
          >
            <v-icon color="amber">mdi-plus</v-icon>
          </v-btn>
        </v-col>
        <v-divider vertical inset></v-divider>
        <v-col cols="auto">
          <v-btn
              size="50"
              elevation="0"
              :disabled="!skillPointsInput[selectedKey]"
              @click="emit('set-skill-point', selectedKey, 'rem')"
              tile
              block
              title="降低等级"
          >
            <v-icon color="error">mdi-minus</v-icon>
          </v-btn>
        </v-col>
      </v-row>
    </div>

    <!-- Debug 模式额外控制 -->
    <template v-if="isDebug && selectedKey">
      <v-divider></v-divider>
      <div class="skill-tree-title px-10 mx-n6 py-2 text-error d-flex align-center justify-space-between">
        <span>DEBUG 调试编辑</span>
        <v-btn size="x-small" variant="tonal" color="error" @click="emit('export-debug-config')">导出所有节点</v-btn>
      </div>
      <div class="py-2 px-5 text-caption">
        <div class="mb-2">
          <strong>节点位置 (X, Y):</strong>
          <span class="font-monospace ml-2">
            {{ Math.round(getNodeCoords?.(selectedKey)?.y || 0) }}, {{ Math.round(getNodeCoords?.(selectedKey)?.x || 0) }}
          </span>
        </div>
        <div class="mb-1"><strong>前置条件列表 (Requisite):</strong></div>
        <v-combobox
            v-if="skills[selectedKey]"
            v-model="skills[selectedKey].requisite"
            multiple
            chips
            closable-chips
            density="compact"
            variant="outlined"
            hide-details
            placeholder="添加前置节点KEY"
            @update:modelValue="emit('debug-requisite-changed')"
        ></v-combobox>
      </div>
    </template>
  </v-card>
</template>

<style scoped lang="less">
.skill-tree-container-cardInfo {
  background-color: hsl(from rgb(var(--v-theme-background)) h s l / .8);
  backdrop-filter: blur(20px);
  position: absolute;
  z-index: 100;
  right: 20px;
  top: 70px;
  max-height: calc(100vh - 120px);

  .skill-tree-title {
    marker: none;
    background-color: hsl(from #000 h s l / .3);
  }
}

.node-card-actions {
  background-color: hsl(from #000 h s l / .2);
}
</style>
