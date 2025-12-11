<!--
- 配置图标
- 单独使用在配置视图图标，解决字体图标无法截取问题
-->

<template>
  <component :is="iconComponent" v-bind="$attrs" :class="props.class"/>
</template>

<script setup lang="ts">
import {computed, h} from 'vue'
import {mdiAccount, mdiBlockHelper, mdiLink, mdiTableFurniture,} from '@mdi/js'

const props = defineProps<{
  name: string
  class?: string,
  size?: string | number
  color?: string
  rotate?: number
  flip?: 'horizontal' | 'vertical' | 'both'
}>()

// 图标映射
const iconMap: Record<string, string> = {
  link: mdiLink,
  account: mdiAccount,
  blockHelper: mdiBlockHelper,
  tableFurniture: mdiTableFurniture
}

const iconComponent = computed(() => {
  const iconPath = iconMap[props.name] || mdiAccount

  return h('svg', {
    viewBox: '0 0 24 24',
    width: props.size || 24,
    height: props.size || 24,
    style: {
      color: props.color,
      transform: getTransform(),
    },
    innerHTML: `<path d="${iconPath}" fill="currentColor"/>`
  })
})

function getTransform() {
  const transforms = []

  if (props.rotate) {
    transforms.push(`rotate(${props.rotate}deg)`)
  }

  if (props.flip) {
    if (props.flip === 'horizontal') {
      transforms.push('scaleX(-1)')
    } else if (props.flip === 'vertical') {
      transforms.push('scaleY(-1)')
    } else if (props.flip === 'both') {
      transforms.push('scale(-1, -1)')
    }
  }

  return transforms.join(' ') || undefined
}
</script>

<style scoped>
svg {
  display: inline-block;
  vertical-align: middle;
  transition: transform 0.3s ease;
}
</style>
