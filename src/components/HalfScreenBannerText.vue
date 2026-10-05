<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import ShinyText from '@/components/ShinyText.vue';

interface Props {
  title?: string;
  subtitle?: string;
  name?: string;
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  subtitle: '',
  name: ''
});

const { t, te } = useI18n();

const appName = computed(() => {
  return props.name || (te('name') ? t('name') : '闪耀船首');
});

const displayTitle = computed(() => {
  if (props.title) {
    return props.title.replace(/\{\s*name\s*\}/g, appName.value);
  }
  if (te('signin.banner.title')) {
    return t('signin.banner.title', { name: appName.value });
  }
  return `加入 ${appName.value}，免费向你提供扩展服务`;
});

const displaySubtitle = computed(() => {
  if (props.subtitle) return props.subtitle;
  if (te('signin.banner.subtitle')) {
    return t('signin.banner.subtitle');
  }
  return '为碧海黑帆开发工具集，你只差一步，注册即可使用';
});

defineOptions({
  name: 'HalfScreenBannerText'
})
</script>

<template>
  <div class="half-screen-banner-text pa-10 px-16 h-100 d-flex flex-column justify-center position-relative" style="z-index: 10;">
    <slot name="title" :title="displayTitle">
      <h1 class="text-h1 font-weight-bold">
        <ShinyText :text="displayTitle"></ShinyText>
      </h1>
    </slot>
    <slot name="subtitle" :subtitle="displaySubtitle">
      <p class="text-h4 mt-5 opacity-60">
        {{ displaySubtitle }}
      </p>
    </slot>
    <slot></slot>
  </div>
</template>

<style scoped lang="less">
.half-screen-banner-text {
  user-select: none;
}
</style>
