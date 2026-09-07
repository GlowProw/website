<script setup lang="ts">
import {computed} from 'vue';
import {useI18n} from 'vue-i18n';
import type {Mastery} from 'glow-prow-data';
import type {NodeRequirementItem} from '@/assets/sripts/use_mastery_controller';
import RhombusWidget from '@/components/snbWidget/rhombusWidget.vue';
import MaterialName from "@/components/snbWidget/materialName.vue";

const {t} = useI18n();

const props = defineProps<{
  node: Mastery | null;
  mobile: boolean;
  regularPointsSpent: number;
  isNodeActive: (id: string) => boolean;
  isNodeAvailable: (id: string) => boolean;
  getNodeState: (id: string) => 'active' | 'available' | 'locked';
  getNodeStateColor: (state: string) => string;
  getNodeStateText: (state: string) => string;
  getCategoryColor: (category?: string) => string;
  getSkillName: (key: string, id?: string) => string;
  getSkillDesc: (key: string, id?: string) => string;
  getNodeRequirementItems?: (keyOrId: string) => NodeRequirementItem[];
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'toggle-activation', id: string): void;
  (e: 'locate-node', id: string): void;
}>();

const requirementItems = computed<NodeRequirementItem[]>(() => {
  if (!props.node) return [];
  if (props.getNodeRequirementItems) {
    return props.getNodeRequirementItems(props.node.key || props.node.id);
  }
  if (!props.node.requisite) return [];
  return props.node.requisite.map(reqId => ({
    key: reqId,
    id: reqId,
    name: props.getSkillName(reqId),
    isActive: props.isNodeActive(reqId),
    isRequisite: true,
    isConnectedActive: false,
  }));
});
</script>

<template>
  <v-card
      v-if="node"
      border
      elevation="12"
      :width="mobile ? 'calc(100% - 50px)' : 450"
      :style="{
        'top': mobile ? '130px' : '70px'
      }"
      class="skill-tree-container-cardInfo overflow-y-auto">
    <template v-slot:title>
      <span class="text-amber text-h5">{{ getSkillName(node.id, node.key) }}</span>
      <div
          class="mb-1 d-flex align-center text-caption my-2 ga-2"
          v-if="node.category"
          :title="node.category">
        <v-chip size="x-small" variant="tonal" :style="{ color: getCategoryColor(node.category) }">
          {{ node.category }}
        </v-chip>
        <v-chip v-if="node.role" size="x-small" variant="tonal">
          {{ node.role }}
        </v-chip>
      </div>
    </template>

    <template v-slot:append>
      <v-btn variant="tonal" icon @click="emit('close')">
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </template>

    <!-- 效果说明 -->
    <div class="skill-tree-title px-10 mx-n6 py-2 text-amber-lighten-4">{{ t('mastery.card.effects') }}</div>
    <div class="py-2 px-5 mb-5 text-pre-line text-body-2">
      {{ getSkillDesc(node.id, node.key) }}
    </div>

    <!-- 前置依赖需求 -->
    <div class="skill-tree-title px-10 mx-n6 py-2 text-amber-lighten-4">{{ t('mastery.card.requirements') }}</div>
    <div class="py-2 px-5 mb-5">
      <template v-if="requirementItems.length > 0">
        <p class="mb-2 text-caption opacity-70">
          {{ t('mastery.card.reqConnected') }}
        </p>
        <div>
          <v-row
              no-gutters
              v-for="item in requirementItems"
              :key="item.key"
              align="center"
              class="my-2">
            <v-col cols="auto" class="d-flex justify-center align-center mr-2">
              <RhombusWidget
                  :size="6"
                  :solid="item.isActive"
                  :activate="item.isActive"
              ></RhombusWidget>
            </v-col>
            <v-col @click="emit('locate-node', item.id || item.key)" class="cursor-pointer d-flex align-center flex-wrap ga-1">
              <span
                  class="text-caption u"
                  :class="{'text-success': item.isActive, 'opacity-70': !item.isActive}">
                {{ item.name }}
              </span>
              <v-chip
                  v-if="item.isConnectedActive"
                  size="x-small"
                  color="success"
                  variant="tonal"
                  class="ml-1"
                  density="compact">
                {{ t('mastery.card.connectedActive') }}
              </v-chip>
            </v-col>
          </v-row>
        </div>
      </template>
      <div v-else class="text-caption opacity-60">
        {{ t('mastery.card.noRequisites') }}
      </div>
    </div>

    <!-- 节点其他信息 -->
    <div class="skill-tree-title px-10 mx-n6 py-2 text-amber-lighten-4">{{ t('mastery.card.other') }}</div>
    <div class="py-2 mx-5 mb-4">
      <v-text-field
          :value="node.skill || node.id"
          hide-details
          readonly
          variant="underlined"
          density="compact">
        <template v-slot:append-inner>
          <v-icon size="18">mdi-identifier</v-icon>
        </template>
      </v-text-field>

      <v-text-field
          :value="node.key"
          hide-details
          readonly
          variant="underlined"
          density="compact">
        <template v-slot:append-inner>
          <v-icon size="18">mdi-key</v-icon>
        </template>
      </v-text-field>

<!--      <v-text-field-->
<!--          :value="node.category"-->
<!--          hide-details-->
<!--          readonly-->
<!--          variant="underlined"-->
<!--          density="compact">-->
<!--        <template v-slot:append-inner>-->
<!--          <span class="singe-line mr-1">{{ t('mastery.card.category') }}</span>-->
<!--          <v-icon size="18">mdi-shape</v-icon>-->
<!--        </template>-->
<!--      </v-text-field>-->

<!--      <v-text-field-->
<!--          :value="node.role"-->
<!--          hide-details-->
<!--          readonly-->
<!--          variant="underlined"-->
<!--          density="compact">-->
<!--        <template v-slot:append-inner>-->
<!--          <span class="singe-line mr-1">{{ t('mastery.card.role') }}</span>-->
<!--          <v-icon size="18">mdi-star-circle</v-icon>-->
<!--        </template>-->
<!--      </v-text-field>-->

      <v-text-field
          v-if="node.cost !== undefined"
          :value="node.cost"
          hide-details
          readonly
          variant="underlined"
          density="compact">
        <template v-slot:append-inner>
          <span class="singe-line mr-1">{{ t('mastery.card.cost') }}</span>
          <v-icon size="18">mdi-counter</v-icon>
        </template>
      </v-text-field>
    </div>

    <!-- 底部操作按钮栏 -->
    <v-divider></v-divider>
    <div class="node-card-actions">
      <!-- 赛季特长单选操作 -->
      <template v-if="node.role === 'seasonalPerk'">
        <v-row align="center" no-gutters class="pa-2">
          <v-col class="text-left px-2 text-body-2">
            <template v-if="regularPointsSpent < node.cost">
              <span class="opacity-60 text-caption">
                {{ t('mastery.card.perkPointsRequired', {spent: regularPointsSpent, cost: node.cost}) }}
              </span>
            </template>
            <template v-else-if="isNodeActive(node.id)">
              <span class="text-success font-weight-bold d-flex align-center">
                <v-icon size="16" class="mr-1 text-success">mdi-check-circle</v-icon>
                {{ t('mastery.card.perkActiveOne') }}
              </span>
            </template>
            <template v-else>
              <span class="text-amber font-weight-medium text-caption d-flex align-center">
                <v-icon size="16" class="mr-1 text-amber">mdi-radiobox-blank</v-icon>
                {{ t('mastery.card.perkSelectOne') }}
              </span>
            </template>
          </v-col>
          <v-col cols="auto">
            <v-btn
                v-if="regularPointsSpent >= node.cost"
                size="small"
                :color="isNodeActive(node.key) ? 'error' : 'amber'"
                :variant="isNodeActive(node.key) ? 'tonal' : 'elevated'"
                @click="emit('toggle-activation', node.key)"
                class="font-weight-bold">
              <v-icon start size="16">{{ isNodeActive(node.key) ? 'mdi-close-circle' : 'mdi-check' }}</v-icon>
              {{ isNodeActive(node.key) ? t('mastery.card.deselectThisPerk') : t('mastery.card.selectThisPerk') }}
            </v-btn>
            <v-chip v-else size="small" variant="outlined" class="opacity-50">
              {{ t('mastery.card.statusLocked') }}
            </v-chip>
          </v-col>
        </v-row>
      </template>

      <!-- 常规节点加退点操作 -->
      <template v-else>
        <v-row align="center" no-gutters>
          <v-col class="text-center px-2 text-body-2">
            <template v-if="isNodeActive(node.key)">
              <span class="text-success font-weight-bold">{{ t('mastery.card.statusActive') }}</span>
            </template>
            <template v-else-if="isNodeAvailable(node.key)">
              <span class="text-amber font-weight-bold">{{ t('mastery.card.statusAvailable') }}</span>
            </template>
            <template v-else>
              <span class="opacity-50 text-caption">{{ t('mastery.card.statusLocked') }}</span>
            </template>
          </v-col>
          <v-divider vertical></v-divider>
          <v-col cols="auto">
            <v-btn
                size="50"
                elevation="0"
                :disabled="isNodeActive(node.key) || !isNodeAvailable(node.key)"
                @click="emit('toggle-activation', node.key)"
                tile
                block
                :title="t('mastery.card.investPoint')">
              <v-icon :color="isNodeActive(node.key) || !isNodeAvailable(node.key) ? 'default' : 'amber'">mdi-plus</v-icon>
            </v-btn>
          </v-col>
          <v-divider vertical inset></v-divider>
          <v-col cols="auto">
            <v-btn
                size="50"
                elevation="0"
                :disabled="!isNodeActive(node.key)"
                @click="emit('toggle-activation', node.key)"
                tile
                block
                :title="t('mastery.card.refundPoint')">
              <v-icon :color="isNodeActive(node.key) ? 'error' : 'default'">mdi-minus</v-icon>
            </v-btn>
          </v-col>
        </v-row>
      </template>
    </div>
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
