<script setup lang="ts">
import { computed } from 'vue';
import type { PaginationResult } from '@/assets/types/Pagination';

/**
 * 统一分页组件
 * 用法一（直接传后端 pagination 对象）：
 * 
 *   <PaginationBar v-model:page="query.page" :pagination="resp.pagination" @change="loadList" />
 * 用法二（自行统计总数，如前端切片/非标准接口）：
 *   <PaginationBar v-model:page="page" :total="total" :page-size="pageSize" @change="loadList" />
 *   <PaginationBar v-model:page="page" :total-pages="totalPages" />
 */
const props = withDefaults(defineProps<{
    page: number | string;
    // 后端返回的完整分页信息
    pagination?: PaginationResult | null;
    // 数据总条数
    total?: number | string | null;
    // 每页条数（与 total 搭配计算总页数）
    pageSize?: number | string | null;
    // 直接指定总页数（前端切片分页时使用，优先级最高）
    totalPages?: number | string | null;
    density?: 'default' | 'comfortable' | 'compact';
    // 页码按钮最多同时显示几个（含首尾与省略号）
    totalVisible?: number | string;
}>(), {
    pagination: null,
    total: null,
    pageSize: null,
    totalPages: null,
    density: 'comfortable',
    totalVisible: 7,
});

const emit = defineEmits<{
    (e: 'update:page', value: number): void;
    (e: 'change', page: number): void;
}>();

/** 
 * 总页数：优先显式传入，其次读后端 pagination，最后用 total/pageSize 计算
 */
const pages = computed<number>(() => {
    if (props.totalPages !== null && props.totalPages !== undefined && props.totalPages !== '') {
        return Number(props.totalPages) || 0;
    }
    if (props.pagination) {
        return Number(props.pagination.totalPages) || 0;
    }
    const total = Number(props.total) || 0;
    const size = Number(props.pageSize) || 0;
    return size > 0 ? Math.ceil(total / size) : 0;
});

/** 
 * 内容不足两页时整个组件不渲染
 */
const visible = computed<boolean>(() => pages.value > 1);

const onPageUpdate = (value: number): void => {
    const page = value ?? 1;
    emit('update:page', page);
    emit('change', page);
};
</script>

<template>
  <div v-if="visible" class="d-flex justify-center">
    <v-pagination
        :model-value="Number(page) || 1"
        :length="pages"
        :total-visible="Number(totalVisible)"
        :density="density"
        active-color="amber"
        rounded="circle"
        variant="tonal"
        @update:model-value="onPageUpdate"
    ></v-pagination>
  </div>
</template>
