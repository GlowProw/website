<script setup lang="ts">
import { useIconGlobalStyle } from "@/assets/sripts/use_icon_global_style";
import {computed, nextTick, onMounted, ref} from "vue";
import {useAssetsStore} from "~/stores/assetsStore";

const props = withDefaults(
        defineProps<{ id: string, iconType?: "aggressivity"| "armor", size?: string | number, isBorder?: boolean, padding?: any, margin?: any }>(),
        {iconType: "armor", isBorder: true}
    ),
    damagesAggressivityImages = import.meta.glob(`@glow-prow-assets/damages/aggressivity/*.*`, {eager: true}),
    damagesArmorImages = import.meta.glob(`@glow-prow-assets/damages/armor/*.*`, {eager: true}),

    emit = defineEmits(['read-end']),
    {serializationMap} = useAssetsStore(),

    // 伤害属性别名字典映射
    damageDictionaries: Record<string, string> = {
      "fire": "burning",
      "blast": "explosive",
      "combustion": "explosive",
    }

// 缓存解析后的图标路径字典
let icons = ref<Record<string, string>>({}),
    images = ref({}),
    normalizedKey = computed(() => {
      const base = props.id.replace(/\d+$/, '');
      return damageDictionaries[props.id] || damageDictionaries[base] || base || props.id;
    }),
    getIcon = computed(() => icons.value[normalizedKey.value]),
    isHasIcon = computed(() => !!getIcon.value)

onMounted(() => {
  onReady()
})

/**
 * 初始化伤害类型图标并通知父组件加载状态
 */
const onReady = () => {
  switch (props.iconType) {
    case "aggressivity":
      images.value = {...images.value, ...damagesAggressivityImages}
      break;
    case "armor":
      images.value = {...images.value,...damagesArmorImages}
      break;
  }

  nextTick(() => {
    icons.value = serializationMap(images.value)

    emit('read-end', isHasIcon.value)
  })
}

defineExpose({
  damageDictionaries,
})

const { useIconImagePadding, useIconImageMargin } = useIconGlobalStyle();
const computedPadding = useIconImagePadding(props.padding);
const computedMargin = useIconImageMargin(props.margin);

defineOptions({
  name: 'DamageIconWidget'
})
</script>

<template>
  <!-- 伤害图标卡片 S -->
  <v-card
      elevation="0"
      class="w-100 h-100 d-flex justify-center align-center bg-transparent prohibit-drag"
      variant="text"
      :border="isBorder">
    <v-img :src="getIcon" :width="size" :height="size"></v-img>
  </v-card>
  <!-- 伤害图标卡片 E -->
</template>

<style scoped lang="less">

</style>
