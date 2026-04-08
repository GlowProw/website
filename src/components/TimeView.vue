<script setup lang="ts">
import {onMounted, ref, watch} from 'vue';
import {useI18n} from 'vue-i18n';
import Time from "@/components/Time.vue";

interface TimeMap {
  primitive: string;
  primitiveDateString: string;
  conversionDate: string;
  conversionLocalDate: string;
  timeFormatName: string;
  localeDateString: string;
}

const props = withDefaults(defineProps<{
  time?: string | number | Date;
  trigger?: string;
}>(), {
  trigger: 'click'
});

const {t} = useI18n();

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

const loadData = () => {
  if (props.time) {
    const cleanedTime = onTime(props.time);
    timeMap.value = {
      primitive: cleanedTime,
      primitiveDateString: toDateString(cleanedTime),
      conversionDate: new Date(cleanedTime).toLocaleDateString(),
      conversionLocalDate: toLocaleString(new Date(cleanedTime).getTime()),
      timeFormatName: getTimeFormatName(),
      localeDateString: toLocaleDateString(cleanedTime)
    };
  }
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
      class="position-absolute"
      target="cursor"
      scroll-strategy="close"
      transition="scale-transition"
      location="bottom start"
      content-class="pa-0 bg-transparent">
    <template v-slot:activator="{ props }">
      <u v-bind="props" class="spelling time-view singe-line time-view-slot">
        <Time :time="time" />
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
  cursor: pointer;
}

.time-view-form {
  padding-top: 10px;
}
</style>
