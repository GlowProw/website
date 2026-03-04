<script setup lang="ts">
import {ref, watch} from 'vue';
import {useI18n} from 'vue-i18n';
import EmptyView from "@/components/EmptyView.vue";

const {t} = useI18n();

interface Props {
  modelValue: any;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  'update:modelValue': [value: any];
}>();

// 本地数据
const localData = ref({
  inSeason: [] as any[],
  weekly: [] as any[],
  common: [] as any[],
});

// 同步外部数据到本地
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    localData.value.inSeason = newValue.inSeason || [];
    localData.value.weekly = newValue.weekly || [];
    localData.value.common = newValue.common || [];
  }
}, {immediate: true});

// 同步本地数据到外部
watch(localData, (newValue) => {
  emit('update:modelValue', {...newValue});
}, {deep: true});


const
    // 物品
    selectedWeeklyItem = ref('culverin1'),
    // 货币
    selectedCurrency = ref('silver'),
    // 货币价值/数量
    selectedWorth = ref(1000);

/**
 * 添加周物品
 */
const addWeeklyItem = () => {
  if (!selectedWeeklyItem.value) {
    return;
  }

  if (!localData.value.weekly.includes(selectedWeeklyItem.value)) {
    localData.value.weekly.push({
      id: selectedWeeklyItem.value,
      currency: selectedCurrency.value,
      worth: selectedWorth.value
    });
  }

  selectedWeeklyItem.value = '';
};

/**
 * 删除周物品
 */
const removeWeeklyItem = (index: number) => {
  localData.value.weekly.splice(index, 1);
};
</script>

<template>
  <div class="smugglers-report-editor">
    <!-- 周物品编辑 -->
    <v-card border>
      <v-card-title class="text-h6 mb-5">本周物品 (Weekly)</v-card-title>
      <v-card-text>
        <v-row class="d-flex align-center mb-4" align="center">
          <v-col>
            <v-text-field
                density="compact"
                label="物品ID"
                v-model="selectedWeeklyItem"
                hide-details
                variant="outlined"></v-text-field>
          </v-col>
          <v-col>
            <v-text-field
                density="compact"
                label="货币"
                v-model="selectedCurrency"
                hide-details
                variant="outlined"></v-text-field>
          </v-col>
          <v-col>
            <v-text-field
                density="compact"
                label="货币"
                v-model="selectedWorth"
                hide-details
                variant="outlined"></v-text-field>
          </v-col>

          <v-col cols="auto">
            <v-btn @click="addWeeklyItem" color="primary" variant="tonal">
              <v-icon>mdi-plus</v-icon>
              添加
            </v-btn>
          </v-col>
        </v-row>

        <!-- 当前周物品列表 -->
        <v-list v-if="localData.weekly.length > 0" class="mb-3">
          <v-list-item v-for="(itemId, index) in localData.weekly" :key="index">
            <v-list-item-title>{{ itemId }}</v-list-item-title>

            <template v-slot:append>
              <v-btn
                  @click="removeWeeklyItem(index)"
                  icon
                  size="small"
                  variant="text"
                  color="error">
                <v-icon>mdi-delete</v-icon>
              </v-btn>
            </template>
          </v-list-item>
        </v-list>

        <EmptyView v-else></EmptyView>
      </v-card-text>
    </v-card>
  </div>
</template>

<script lang="ts">
</script>

<style scoped lang="less">
.smugglers-report-editor {
  .data-preview {
    background: #f5f5f5;
    padding: 16px;
    border-radius: 4px;
    font-size: 12px;
    max-height: 300px;
    overflow-y: auto;
    white-space: pre-wrap;
    word-wrap: break-word;
  }

  .v-list-item {
    border-bottom: 1px solid rgba(0, 0, 0, 0.12);

    &:last-child {
      border-bottom: none;
    }
  }
}
</style>
