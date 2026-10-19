<script setup lang="ts">
import {computed, ref, watch} from "vue";
import {useI18n} from "vue-i18n";
import {Commodities, Items, Materials} from "glow-prow-data";
import ItemSlotBase from "@/components/snbWidget/ItemSlotBase.vue";
import ItemIconWidget from "@/components/snbWidget/itemIconWidget.vue";

const {t} = useI18n();

const props = withDefaults(defineProps<{
  data: any;
  activeCategory?: string;
  categories?: string[];
}>(), {
  data: () => ({}),
  activeCategory: 'weekly',
  categories: undefined
});

const emit = defineEmits<{
  'update:activeCategory': [value: string];
}>();

// 当前激活的分类标识
const currentTab = ref(props.activeCategory || 'weekly');

// 监听外部传入的激活分类变化
watch(() => props.activeCategory, (val) => {
  if (val && val !== currentTab.value) {
    currentTab.value = val;
  }
});

// 监听内部激活分类变化并向外抛出事件
watch(currentTab, (val) => {
  emit('update:activeCategory', val);
});

// 计算当前可展示的分类标签列表
const availableTabs = computed(() => {
  const categoryMeta: Record<string, string> = {
    weekly: t('smugglersReport.weekly'),
    inSeason: t('smugglersReport.inSeason'),
    common: t('smugglersReport.common')
  };

  if (props.categories && props.categories.length > 0) {
    return props.categories.map(k => ({
      key: k,
      title: categoryMeta[k] || k
    }));
  }

  const tabs = [
    { key: 'weekly', title: categoryMeta.weekly }
  ];

  if (props.data?.inSeason && Array.isArray(props.data.inSeason) && props.data.inSeason.length > 0) {
    tabs.push({ key: 'inSeason', title: categoryMeta.inSeason });
  }

  if (props.data?.common && Array.isArray(props.data.common) && props.data.common.length > 0) {
    tabs.push({ key: 'common', title: categoryMeta.common });
  }

  return tabs;
});

// 确保当前选中的分类存在于可用列表中
watch(availableTabs, (tabs) => {
  if (!tabs.some(tabItem => tabItem.key === currentTab.value)) {
    currentTab.value = 'weekly';
  }
}, {immediate: true});

/**
 * 转换并填充指定分类的物品数据为固定30格网格
 * @param rawList 原始物品列表
 * @returns 填充后的展示数据数组
 */
const formatItemList = (rawList: any[] = []) => {
  const list = (rawList || []).map((i: any) => {
    if (!i) return null;
    const {id: key, ...o} = i;
    const d: any = {...o};
    if (key in Items) d.data = Items[key as keyof typeof Items];
    if (key in Materials) d.data = Materials[key as keyof typeof Materials];
    if (key in Commodities) d.data = Commodities[key as keyof typeof Commodities];
    return d;
  });

  const supplementLength = Math.max(0, 30 - list.length);
  const supplementData: any[] = Array.from({length: supplementLength}, () => null);
  return list.concat(supplementData);
};

// 当前选中分类的物品展示网格数据
const currentDisplayItems = computed(() => {
  const raw = props.data?.[currentTab.value] || [];
  return formatItemList(raw);
});

defineOptions({
  name: 'SmugglersReportShowItemWidget'
});
</script>

<template>
  <div class="smugglers-report-show-widget">
    <v-tabs
        v-model="currentTab"
        height="40"
        class="text-amber font-weight-bold"
        :show-arrows="true">
      <v-tab
          v-for="tab in availableTabs"
          :key="tab.key"
          :value="tab.key"
          class="text-h6">
        {{ tab.title }}
      </v-tab>
    </v-tabs>
    <v-divider thickness="2" class="mb-5"></v-divider>

    <v-row class="justify-start">
      <v-col
          cols="auto"
          v-for="(i, index) in currentDisplayItems"
          :key="index">
        <ItemSlotBase size="99px" class="d-flex justify-center align-center">
          <template v-if="i && i.data">
            <ItemIconWidget :id="i.data.id" v-if="i.data._typeStringName == 'Item'"></ItemIconWidget>
            <ItemIconWidget :id="i.data.id" v-else></ItemIconWidget>
          </template>

          <template v-else>
            <v-icon class="opacity-20" size="30">mdi-help</v-icon>
          </template>
        </ItemSlotBase>
      </v-col>
    </v-row>
  </div>
</template>

<style scoped lang="less">
.smugglers-report-show-widget {
  width: 100%;
}
</style>
