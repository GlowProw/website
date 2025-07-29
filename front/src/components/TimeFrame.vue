<script setup lang="ts">
import {computed, ref} from "vue";

const dialog = ref(false);
const startDate = ref<string | null>(null);
const endDate = ref<string | null>(null);

const emit = defineEmits(['update:modelValue'])

const endDateMin = computed(() => {
      return startDate.value || new Date().toISOString().substr(0, 10);
    }),
    startDateMax = computed(() => {
      return endDate.value || new Date().toISOString().substr(0, 10);
    }),
    // 验证
    isRangeValid = computed(() => {
      if (!startDate.value || !endDate.value) return false;
      return new Date(endDate.value) >= new Date(startDate.value);
    });

/**
 * 重置选择
 */
const resetSelection = () => {
  startDate.value = null;
  endDate.value = null;
  dialog.value = false;
  updateEvent()
};

/**
 * 确认选择
 */
const confirmSelection = () => {
  if (isRangeValid.value) {
    dialog.value = false;
    updateEvent()
  }
};

const updateEvent = () => {
  const startTime = startDate.value ? new Date(startDate.value).toISOString() : null,
      endTIme = endDate.value ? new Date(endDate.value).toISOString() : null;

  emit('update:modelValue', startTime || endTIme ? `${startTime},${endTIme}` : null)
}
</script>

<template>
  <v-text-field
      :value="startDate && endDate ? `${new Date(startDate).toLocaleString()} - ${new Date(endDate).toLocaleString()}` : ''"
      readonly
      placeholder="请选择日期范围"
      @click.stop="dialog = true"
      prepend-inner-icon="mdi-calendar-range"
      clearable
      @click:clear="resetSelection"
  ></v-text-field>

  <v-dialog v-model="dialog" max-width="700px" persistent>
    <v-card-title class="d-flex justify-space-between align-center">
      <span>选择日期范围</span>
      <v-btn icon @click="dialog = false">
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </v-card-title>
    <v-card>
      <v-card-text>
        <v-row justify="center" class="mt-4">
          <v-col cols="12" sm="6">
            <v-date-picker
                v-model="startDate"
                :max="startDateMax"
                title="开始日期"
                hide-weekdays
                hide-header
                full-width
            ></v-date-picker>
          </v-col>

          <v-col cols="12" sm="6">
            <v-date-picker
                v-model="endDate"
                :min="endDateMin"
                title="结束日期"
                hide-weekdays
                hide-header
                full-width
            ></v-date-picker>
          </v-col>
        </v-row>

        <v-alert
            v-if="startDate && endDate && !isRangeValid"
            type="error"
            dense
            class="mt-4"
        >
          结束日期不能早于开始日期
        </v-alert>
      </v-card-text>

      <v-divider></v-divider>
    </v-card>
    <v-card-actions class="pa-4">
      <v-spacer></v-spacer>
      <v-btn text @click="resetSelection">重置</v-btn>
      <v-btn
          color="primary"
          :disabled="!isRangeValid"
          @click="confirmSelection">
        确定
      </v-btn>
    </v-card-actions>
  </v-dialog>
</template>

<style scoped lang="less">
/* 响应式调整 */
@media (max-width: 600px) {
  .v-picker {
    width: 100%;
  }
}
</style>
