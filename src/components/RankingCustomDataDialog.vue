<script setup lang="ts">
import {computed, ref, watch} from 'vue';
import {useI18n} from 'vue-i18n';
import {apis} from '@/assets/sripts/index';
import {useAuthStore} from '~/stores/userAccountStore';
import {useNoticeStore} from '~/stores/noticeStore';
import Loading from '@/components/Loading.vue';

interface CustomDataPayload {
  id: string;
  category: string;
  name?: string;
  assemblyUuid?: string;
}

const props = defineProps<{
  modelValue: boolean;
  category: string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'select', payload: CustomDataPayload): void;
}>();

const {t} = useI18n();
const authStore = useAuthStore();
const noticeStore = useNoticeStore();

// 当前选中的 Tab（'uuid' 或 'my'）
const activeTab = ref<'uuid' | 'my'>('uuid');

// 手动输入的 UUID
const inputUuid = ref('');

// 手动输入的名称（选填）
const inputName = ref('');

// 用户自己的数据列表加载状态
const loadingMyData = ref(false);

// 用户自己的数据列表
const myDataList = ref<Array<{ uuid: string; name: string; assemblyUuid?: string; updatedTime?: string }>>([]);

// 分类对应的大标题文案与图标配置
const categoryMeta = computed(() => {
  switch (props.category) {
    case 'mastery':
      return {
        title: t('codex.itemMenu.mastery') || '精通',
        icon: 'mdi-star-circle-outline',
        color: 'amber',
        placeholder: '例如: 1852038472910482944 或 UUID',
        namePlaceholder: '例如: 暴风骤雨级雷击舰的精通',
      };
    case 'wheel':
      return {
        title: t('codex.itemMenu.wheel') || '轮盘',
        icon: 'mdi-ship-wheel',
        color: 'amber',
        placeholder: '例如: 1852038472910482944 或 UUID',
        namePlaceholder: '例如: 暴风骤雨轮盘',
      };
    case 'shipyard':
      return {
        title: t('codex.itemMenu.shipyard') || '船厂',
        icon: 'mdi-ferry',
        color: 'amber',
        placeholder: '例如: 1852038472910482944 或 UUID',
        namePlaceholder: '例如: 暴风骤雨船厂',
      };
    case 'assembly':
    default:
      return {
        title: t('codex.itemMenu.assembly') || '配装',
        icon: 'mdi-package-variant-closed',
        color: 'amber',
        placeholder: '例如: 1852038472910482944 或 UUID',
        namePlaceholder: '例如: 暴风骤雨级雷击舰',
      };
  }
});

/**
 * 监听弹窗打开状态，重置表单并适时加载个人数据
 */
watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    inputUuid.value = '';
    inputName.value = '';
    if (activeTab.value === 'my') {
      fetchMyData();
    }
  }
});

/**
 * 监听 Tab 切换
 */
watch(activeTab, (tab) => {
  if (tab === 'my' && props.modelValue) {
    fetchMyData();
  }
});

/**
 * 获取当前登录用户拥有的对应资源列表
 */
const fetchMyData = async () => {
  if (!authStore.isLogin) {
    myDataList.value = [];
    return;
  }

  try {
    loadingMyData.value = true;
    const res = await apis.userApi().getMeCustomData({
      category: props.category,
      page: 1,
      pageSize: 50,
    });
    const d = res.data;
    if (d.error === 0 && d.data) {
      myDataList.value = d.data.list || [];
    } else {
      myDataList.value = [];
    }
  } catch (e: any) {
    myDataList.value = [];
  } finally {
    loadingMyData.value = false;
  }
};

/**
 * 确认手动输入 UUID 选入
 */
const onSubmitUuid = () => {
  const val = inputUuid.value.trim();
  if (!val) {
    noticeStore.warning(t('rankingDesignedItems.workshop.uuidRequired') || '请输入有效的 UUID');
    return;
  }

  const customName = inputName.value.trim() || `${categoryMeta.value.title} ${val.slice(-4)}`;

  emit('select', {
    id: val,
    category: props.category,
    name: customName,
    assemblyUuid: props.category === 'assembly' ? val : undefined,
  });
  emit('update:modelValue', false);
};

/**
 * 从列表中选入指定项
 * @param item 数据项
 */
const onSelectMyItem = (item: { uuid: string; name: string; assemblyUuid?: string }) => {
  if (!item.uuid) return;
  emit('select', {
    id: item.uuid,
    category: props.category,
    name: item.name,
    assemblyUuid: item.assemblyUuid || (props.category === 'assembly' ? item.uuid : undefined),
  });
  emit('update:modelValue', false);
};

/**
 * 关闭弹窗
 */
const onClose = () => {
  emit('update:modelValue', false);
};

/**
 * 格式化日期展示
 * @param dateStr 时间字符串
 */
const formatDate = (dateStr?: string) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString();
};
</script>

<template>
  <v-dialog
      :model-value="modelValue"
      max-width="560"
      @update:model-value="emit('update:modelValue', $event)">
    <v-card border class="bg-grey-darken-4 pa-2">
      <!-- 弹窗标题卡片 S -->
      <v-card-title class="py-10 border rounded-lg text-center bg-black mb-4">
        <v-icon size="80" class="mb-2" :color="categoryMeta.color">{{ categoryMeta.icon }}</v-icon>
        <p class="text-h6 font-weight-bold">
          {{ t('rankingDesignedItems.workshop.addDataTitle', { type: categoryMeta.title }) || `添加${categoryMeta.title}数据` }}
        </p>
      </v-card-title>
      <!-- 弹窗标题卡片 E -->

      <v-card-text class="pa-2">
        <!-- 切换 Tab S -->
        <v-tabs
            v-model="activeTab"
            color="amber"
            align-tabs="center"
            density="compact"
            class="mb-4 border-b">
          <v-tab value="uuid">
            <v-icon start size="18">mdi-identifier</v-icon>
            {{ t('rankingDesignedItems.workshop.tabInputUuid') || '输入 UUID' }}
          </v-tab>
          <v-tab value="my">
            <v-icon start size="18">mdi-account-outline</v-icon>
            {{ t('rankingDesignedItems.workshop.tabGetMine') || '获取自己' }}
          </v-tab>
        </v-tabs>
        <!-- 切换 Tab E -->

        <!-- 输入 UUID 板块 S -->
        <div v-if="activeTab === 'uuid'" class="py-2">
          <p class="text-caption text-medium-emphasis mb-3">
            {{ t('rankingDesignedItems.workshop.inputUuidHint') || '填入对应数据记录的雪花 ID 或 UUID' }}
          </p>

          <v-text-field
              v-model="inputUuid"
              label="UUID"
              :placeholder="categoryMeta.placeholder"
              variant="outlined"
              density="comfortable"
              prepend-inner-icon="mdi-link-variant"
              clearable
              autofocus
              class="mb-2"
              @keydown.enter="onSubmitUuid">
          </v-text-field>

          <v-text-field
              v-model="inputName"
              :label="t('basic.name') || '名称（选填）'"
              :placeholder="categoryMeta.namePlaceholder"
              variant="outlined"
              density="comfortable"
              prepend-inner-icon="mdi-format-title"
              clearable
              @keydown.enter="onSubmitUuid">
          </v-text-field>

          <div class="mt-4 text-right">
            <v-btn
                color="amber"
                variant="flat"
                prepend-icon="mdi-check"
                :disabled="!inputUuid.trim()"
                @click="onSubmitUuid">
              {{ t('basic.button.confirm') || '确认添加' }}
            </v-btn>
          </div>
        </div>
        <!-- 输入 UUID 板块 E -->

        <!-- 获取自己板块 S -->
        <div v-else-if="activeTab === 'my'" class="py-2">
          <!-- 未登录提示 -->
          <div v-if="!authStore.isLogin" class="text-center py-8">
            <v-icon size="48" color="grey" class="mb-2">mdi-account-lock-outline</v-icon>
            <p class="text-body-2 text-medium-emphasis mb-4">
              {{ t('rankingDesignedItems.workshop.loginRequired') || '请先登录以获取您账号下的数据' }}
            </p>
            <v-btn color="amber" variant="tonal" to="/user/signin">
              {{ t('account.signIn') || '去登录' }}
            </v-btn>
          </div>

          <!-- 加载中 -->
          <div v-else-if="loadingMyData" class="d-flex justify-center py-8">
            <Loading size="40"></Loading>
          </div>

          <!-- 数据列表 -->
          <div v-else-if="myDataList.length > 0" class="overflow-y-auto" style="max-height: 320px;">
            <v-list density="compact" bg-color="transparent" class="pa-0">
              <v-list-item
                  v-for="item in myDataList"
                  :key="item.uuid"
                  border
                  rounded="lg"
                  class="mb-2 bg-grey-darken-3">
                <template v-slot:prepend>
                  <v-icon size="24" :color="categoryMeta.color" class="mr-2">{{ categoryMeta.icon }}</v-icon>
                </template>

                <v-list-item-title class="font-weight-medium text-body-2">
                  {{ item.name }}
                </v-list-item-title>

                <v-list-item-subtitle class="text-caption text-medium-emphasis mt-1">
                  <span class="mr-3">UUID: {{ item.uuid }}</span>
                  <span v-if="item.updatedTime">{{ formatDate(item.updatedTime) }}</span>
                </v-list-item-subtitle>

                <template v-slot:append>
                  <v-btn
                      size="small"
                      color="amber"
                      variant="tonal"
                      prepend-icon="mdi-plus"
                      @click="onSelectMyItem(item)">
                    {{ t('basic.button.add') || '选入' }}
                  </v-btn>
                </template>
              </v-list-item>
            </v-list>
          </div>

          <!-- 空数据状态 -->
          <div v-else class="text-center py-8 text-medium-emphasis">
            <v-icon size="48" class="mb-2 opacity-50">mdi-inbox-outline</v-icon>
            <p class="text-body-2">{{ t('rankingDesignedItems.workshop.noMyData') || '暂无相关数据记录' }}</p>
          </div>
        </div>
        <!-- 获取自己板块 E -->
      </v-card-text>

      <v-card-actions class="px-4 pb-4">
        <v-spacer></v-spacer>
        <v-btn variant="tonal" color="grey" @click="onClose">
          {{ t('common.close') || '关闭' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped lang="less">
</style>
