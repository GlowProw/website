<script setup lang="ts">
import {onMounted, ref, useSlots, watch} from 'vue';
import {useI18n} from 'vue-i18n';
import Time from "@/components/Time.vue";
import {useTooltipFollow} from "@/assets/sripts/use_tooltip_follow";
import type {TimeMap} from "@/assets/types/Codex";

const props = withDefaults(defineProps<{
  time?: string | number | Date;
  trigger?: string;
}>(), {
  trigger: 'click'
});

const {t} = useI18n();
const slots = useSlots(),
    {tooltipPos, onMouseMove, onMouseEnter} = useTooltipFollow();

const timeMap = ref<TimeMap | null>(null);
const primitiveValue = ref('primitive');

const options: Intl.DateTimeFormatOptions = {
  hour: 'numeric',
  minute: 'numeric',
  second: 'numeric',
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
};

const onTime = (time: string | number | Date) => {
  return time.toString()
      .replaceAll('\n', ' ')
      .replaceAll('&nbsp;', ' ');
};

const toLocaleString = (unixTimestamp: number) => {
  const date = new Date(unixTimestamp);
  return date.toLocaleString();
};

const getTimeFormatName = () => {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
};

const toLocaleDateString = (time: string | number | Date) => {
  const date = new Date(time);
  return date.toLocaleDateString(undefined, options);
};

const toDateString = (time: string | number | Date) => {
  const date = new Date(time);
  return date.toDateString();
};

/**
 * 解析并加载时间多维度展示结构
 */
const loadData = () => {
  if (!props.time) {
    timeMap.value = null;
    return;
  }
  const cleanedTime = onTime(props.time);
  const numVal = Number(cleanedTime);
  const parsedVal = !isNaN(numVal) && cleanedTime.trim() !== '' ? numVal : cleanedTime;
  const date = new Date(parsedVal);
  if (isNaN(date.getTime())) {
    timeMap.value = null;
    return;
  }
  timeMap.value = {
    primitive: cleanedTime,
    primitiveDateString: date.toDateString(),
    conversionDate: date.toLocaleDateString(),
    conversionLocalDate: date.toLocaleString(),
    timeFormatName: getTimeFormatName(),
    localeDateString: date.toLocaleDateString(undefined, options)
  };
};

watch(() => props.time, () => {
  loadData();
}, {immediate: true});

onMounted(() => {
  loadData();
});
</script>

<template>
  <v-tooltip
      scroll-strategy="close"
      transition="opacity 300ms ease-in"
      location="right top"
      min-width="450"
      max-width="450"
      interactive
      class="item-card"
      content-class="pa-0 bg-transparent"
      :offset="[100,0]"
      :target="[tooltipPos.x, tooltipPos.y]">
    <template v-slot:activator="{ props }">
      <u v-bind="props" class="spelling time-view singe-line time-view-slot"
         @mousemove="onMouseMove"
         @mouseenter="onMouseEnter">
        <slot></slot>
        <Time :time="time"/>
      </u>
    </template>

    <v-card border min-width="500" v-if="time && timeMap">
      <v-card-title class="py-10 text-center bg-black mb-4 mx-n5 mt-n5">
        <v-icon size="80">mdi-clock-time-eight-outline</v-icon>
      </v-card-title>

      <div class="pa-4">
        <div>
          <v-select
              v-model="primitiveValue"
              :label="t('detail.dateView.primitive')"
              :items="[
              { title: t('detail.dateView.primitives.primitive'), value: 'primitive', subtitle: timeMap.primitive },
              { title: t('detail.dateView.primitives.primitiveDateString'), value: 'primitiveDateString', subtitle: timeMap.primitiveDateString }
            ]"
              item-title="title"
              item-value="value"
              hide-details
              density="compact"
              variant="outlined">
            <template v-slot:item="{ props, item }">
              <v-list-item v-bind="props" :subtitle="item.raw.subtitle"></v-list-item>
            </template>
            <template v-slot:selection="{ item }">
              <v-text-field :model-value="item.raw.subtitle" readonly hide-details density="compact" variant="plain" class="mt-n1">
                {{ item.title }}
              </v-text-field>
            </template>
          </v-select>

          <v-alert variant="tonal" density="compact" class="mb-2 mt-2" icon="mdi-information-outline">
            {{ t('detail.dateView.primitiveDescription') }}
          </v-alert>
        </div>

        <div class="mb-8">
          <label class="text-subtitle-2 ml-1">{{ t('detail.dateView.localTimeZoneName') }}</label>
          <div class="mt-1">
            <v-chip variant="tonal" size="small">{{ timeMap.timeFormatName }}</v-chip>
          </div>
        </div>

        <div class="mb-2">
          <v-text-field
              :label="t('detail.dateView.localeTime')"
              :model-value="timeMap.localeDateString"
              readonly
              hide-details
              density="compact"
              variant="outlined"
          ></v-text-field>

          <v-alert variant="tonal" density="compact" class="mb-2 mt-2" icon="mdi-information-outline">
            {{ t('detail.dateView.localeTimeDescription') }}
          </v-alert>
        </div>
      </div>
    </v-card>
  </v-tooltip>
</template>

<style scoped lang="less">
.time-view-slot:hover {
  padding: 1px 6px !important;
  margin: -1px -6px;
  border-radius: 5px;
  background: #0000000a;
}

u.spelling {
  text-decoration: dashed underline;
  text-decoration-thickness: 2px;
  text-decoration-color: rgba(255, 255, 255, 0.3);
  text-decoration-skip-ink: auto;
  text-underline-offset: 3px;
  cursor: pointer;
}

.time-view-form {
  padding-top: 10px;
}
</style>
