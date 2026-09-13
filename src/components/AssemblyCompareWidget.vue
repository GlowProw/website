<script setup lang="ts">
import {onMounted, watch} from "vue";
import {useI18n} from "vue-i18n";
import {storeToRefs} from "pinia";
import {useAssemblyCompareStore, MAX_COMPARE_COUNT, type CompareEntry} from "~/stores/assemblyCompareStore";
import AssemblyDataInfoResultWidget from "@/components/AssemblyDataInfoResultWidget.vue";
import EmptyView from "@/components/EmptyView.vue";
import UserAvatar from "@/components/UserAvatar.vue";
import ShipIconWidget from "@/components/snbWidget/shipIconWidget.vue";
import ItemSlotBase from "@/components/snbWidget/ItemSlotBase.vue";
import Time from "@/components/Time.vue";
import Loading from "@/components/Loading.vue";
import HorizontalScrollList from "@/components/HorizontalScrollList.vue";

const props = withDefaults(defineProps<{
  baseAssembly?: any,
  targetAssembly?: any,
  baseTitle?: string,
  targetTitle?: string,
}>(), {
  baseAssembly: null,
  targetAssembly: null,
  baseTitle: '',
  targetTitle: '',
});

const emit = defineEmits(['swap', 'update:baseAssembly', 'update:targetAssembly']);
const {t} = useI18n();

// 使用配装对比专属状态机
const compareStore = useAssemblyCompareStore();
const {
  compareList,
  targetIndex,
  benchmarkResult,
  isMaxReached,
  compareCount
} = storeToRefs(compareStore);

const {
  getEntryAssemblyData,
  initCompare,
  addCompareEntry,
  removeCompareEntry,
  setTargetIndex,
  setEntryItem,
  clearEntry,
  searchAssemblies,
  selectAssembly,
} = compareStore;

// 初始化处理
onMounted(() => {
  initCompare(props.baseAssembly, props.targetAssembly, props.baseTitle, props.targetTitle);
});

watch(() => props.baseAssembly, (val) => {
  if (val && compareList.value.length > 0 && !compareList.value[0].item) {
    setEntryItem(0, val, props.baseTitle);
  }
}, {deep: true});

watch(() => props.targetAssembly, (val) => {
  if (val && compareList.value.length > 1 && !compareList.value[1].item) {
    setEntryItem(1, val, props.targetTitle);
  }
}, {deep: true});

/**
 * 解析配装中的船只 ID
 */
const getShipIdFromItem = (item: any): string | null => {
  if (!item) return null;
  const asm = item.assembly?.data || item.assembly || item;
  const slot = asm?.shipSlot;
  if (!slot) return null;
  return typeof slot === 'string' ? slot : slot.id || null;
};

/**
 * 回车确认触发搜索
 */
const onEnter = (idx: number, entry: CompareEntry) => {
  if (entry.item) return;
  searchAssemblies(idx);
};

/**
 * 使用传入的 baseAssembly
 */
const useBaseAssembly = (idx: number) => {
  if (!props.baseAssembly) return;
  setEntryItem(idx, props.baseAssembly, props.baseTitle);
};
</script>

<template>
  <div class="w-100 bg-black pa-4">
    <HorizontalScrollList
        :is-indicator="false"
        :use-shift-key="false"
        :is-follow-screen-center="true">
      <div
          v-for="(entry, idx) in compareList"
          :key="entry.id"
          class="compare-col"
          :class="{ 'is-benchmark-target': targetIndex === idx }">
        <div class="compare-card">
          <div class="compare-card-header d-flex align-center justify-space-between mb-2">
            <!-- 单选框：设置为对比目标 -->
            <div
                class="benchmark-radio-wrapper d-flex align-center cursor-pointer"
                @click="setTargetIndex(idx)"
            >
              <v-icon
                  :icon="targetIndex === idx ? 'mdi-radiobox-marked' : 'mdi-radiobox-blank'"
                  :color="targetIndex === idx ? 'amber' : 'grey'"
                  size="20"
                  class="mr-1"
              ></v-icon>
              <span
                  class="text-caption font-weight-bold"
                  :class="targetIndex === idx ? 'text-amber' : 'text-medium-emphasis'"
              >
                  {{ t('assembly.compare.targetBenchmark') }}
                </span>
            </div>

            <!-- 方案序号 & 移除按钮 -->
            <div class="d-flex align-center ga-1">
              <span class="text-caption opacity-60">#{{ idx + 1 }}</span>
              <v-btn
                  v-if="compareList.length > 1"
                  icon="mdi-close"
                  size="x-small"
                  variant="text"
                  color="grey"
                  :title="t('assembly.compare.removeCompare')"
                  @click="removeCompareEntry(idx)"
              ></v-btn>
            </div>
          </div>

          <!-- 搜索 -->
          <div class="d-flex align-center ga-2 mb-3">
            <div class="flex-grow-1 position-relative">
              <v-menu
                  v-model="entry.menuOpen"
                  :close-on-content-click="true"
                  location="bottom start"
                  max-height="380"
                  offset="6"
                  :disabled="!!entry.item">
                <template v-slot:activator="{ props: menuProps }">
                  <v-text-field
                      v-bind="!entry.item ? menuProps : {}"
                      v-model="entry.keyword"
                      density="compact"
                      variant="outlined"
                      hide-details
                      clearable
                      :readonly="!!entry.item"
                      prepend-inner-icon="mdi-magnify"
                      :placeholder="t('assembly.compare.searchPlaceholder')"
                      @click:clear="clearEntry(idx)"
                      @keydown.enter="onEnter(idx, entry)"
                      @click:prepend-inner="onEnter(idx, entry)">
                    <template v-slot:append-inner v-if="!entry.item">
                      <v-btn
                          size="x-small"
                          variant="tonal"
                          color="amber"
                          :loading="entry.searchLoading"
                          @click.stop="onEnter(idx, entry)">
                        {{ t('basic.button.search') }}
                      </v-btn>
                    </template>
                  </v-text-field>
                </template>

                <!-- 搜索结果下拉列表 -->
                <v-card width="376" max-width="376" class="border" elevation="8">
                  <v-list density="compact" lines="two">
                    <v-list-subheader class="font-weight-bold text-caption text-amber">
                      {{ t('assembly.compare.selectPrompt') }}
                    </v-list-subheader>

                    <div v-if="entry.searchLoading" class="pa-4 text-center">
                      <Loading size="32"></Loading>
                    </div>

                    <template v-else-if="entry.searchResults.length > 0">
                      <v-list-item
                          v-for="resItem in entry.searchResults"
                          :key="resItem.uuid"
                          link
                          @click="selectAssembly(idx, resItem)"
                      >
                        <template v-slot:prepend>
                          <ItemSlotBase size="36px" class="mr-2">
                            <ShipIconWidget
                                v-if="getShipIdFromItem(resItem)"
                                :id="getShipIdFromItem(resItem)!"
                            ></ShipIconWidget>
                            <v-icon v-else icon="mdi-ferry"></v-icon>
                          </ItemSlotBase>
                        </template>

                        <v-list-item-title class="font-weight-bold text-amber singe-line">
                          {{ resItem.name || 'none' }}
                        </v-list-item-title>

                        <v-list-item-subtitle class="d-flex align-center ga-2 text-caption">
                            <span v-if="resItem.username" class="d-flex align-center ga-1">
                              <UserAvatar v-if="resItem.userAvatar" :src="resItem.userAvatar" size="14"></UserAvatar>
                              {{ resItem.username }}
                            </span>
                          <span class="opacity-60" v-if="resItem.createdTime">
                              <Time :time="resItem.createdTime"></Time>
                            </span>
                          <v-chip size="x-small" density="compact" color="red" v-if="resItem.likes">
                            <v-icon start size="12" icon="mdi-heart"></v-icon>
                            {{ resItem.likes }}
                          </v-chip>
                        </v-list-item-subtitle>
                      </v-list-item>
                    </template>

                    <div v-else class="pa-4 text-center text-caption text-medium-emphasis">
                      {{ t('assembly.compare.noResults') }}
                    </div>
                  </v-list>
                </v-card>
              </v-menu>
            </div>
          </div>

          <!-- 配装数据详情视图 -->
          <div class="position-relative compare-content-box">
            <v-overlay
                :model-value="entry.loading"
                contained
                scrim
                class="align-center justify-center rounded-lg">
              <Loading size="60"></Loading>
            </v-overlay>

            <template v-if="getEntryAssemblyData(entry)">
              <AssemblyDataInfoResultWidget
                  :assembly-data="getEntryAssemblyData(entry)"
                  :target-result="targetIndex !== idx ? benchmarkResult : null"
                  :is-disabled-move-title="true"
                  :is-col-one="true"
                  :readonly="true"
              ></AssemblyDataInfoResultWidget>
            </template>
            <template v-else>
              <v-card variant="text" class="pa-6 text-center border-dashed">
                <EmptyView>
                  <template v-slot:title>
                    {{ t('assembly.compare.selectPrompt') }}
                  </template>
                </EmptyView>
                <div class="mt-3 d-flex justify-center ga-2" v-if="props.baseAssembly">
                  <v-btn
                      color="amber"
                      variant="tonal"
                      size="small"
                      @click="useBaseAssembly(idx)">
                    {{ t('assembly.compare.useCurrent') }}
                  </v-btn>
                </div>
              </v-card>
            </template>
          </div>
        </div>
      </div>

      <!-- 添加卡片 -->
      <div
          v-if="!isMaxReached"
          class="compare-add-col d-flex justify-center h-100">
        <v-card
            variant="text"
            class="add-compare-card d-flex flex-column align-center justify-start py-16 rounded-lg cursor-pointer h-100"
            @click="addCompareEntry()">
          <v-icon icon="mdi-plus-circle-outline" size="48" color="amber" class="mb-2"></v-icon>
          <span class="text-subtitle-2 font-weight-bold text-amber">
              {{ t('assembly.compare.addCompare') }}
            </span>
          <span class="text-caption text-medium-emphasis mt-1">
              ({{ compareCount }} / {{ MAX_COMPARE_COUNT }})
            </span>
        </v-card>
      </div>
    </HorizontalScrollList>
  </div>
</template>

<style scoped lang="less">
.compare-col {
  flex: 0 0 400px;
  width: 400px;
  min-width: 400px;
  max-width: 400px;
  box-sizing: border-box;
}

.compare-card {
  box-sizing: border-box;
}

.benchmark-radio-wrapper {
  user-select: none;
}

.compare-content-box {
  min-height: 280px;
}

.compare-add-col {
  flex: 0 0 160px;
  width: 160px;
  min-width: 160px;
}

.add-compare-card {
  width: 100%;
  border-style: dashed !important;
  border-color: rgba(255, 193, 7, 0.3) !important;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 193, 7, 0.05);
    border-color: rgba(255, 193, 7, 0.6) !important;
  }
}
</style>
