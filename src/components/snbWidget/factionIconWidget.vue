<script setup lang="ts">
import {onMounted, type Ref, ref, watch} from "vue";
import {useI18n} from "vue-i18n";
import {useCDNAssetsServiceStore} from "~/stores/cdnAssetsStore";

let src: Ref<string | null> = ref(null)

const props = withDefaults(
        defineProps<{ name: string, size?: string, class?: string }>(),
        {
          size: '20px',
          class: ''
        }
    ),
    {t} = useI18n(),
    {currentService: currentImageService} = useCDNAssetsServiceStore(),

    // 阵营相同图标字典， 规划同类图标
    factionConvertDictionary = {
      "theHelmEmpire": "theHelm",
      "rogues": "pirates"
    }

watch(() => props.name, () => {
  onReady()
})

onMounted(() => {
  onReady()
})

/**
 * 处理阵营图片
 */
const onReady = () => {
  const key = factionConvertDictionary[props.name] || props.name;

  src.value = currentImageService.url({
    id: key,
    category: 'factions'
  }, 'glow-prow')
}

</script>

<template>
  <v-card :class="props.class" class="w-100 h-100"
          variant="flat">
    <v-img :src="src"
           v-if="!!src"
           width="100%"
           height="100%"
           cover>
    </v-img>
    <div class="d-flex justify-center align-center h-100 w-100" v-else>
      <v-icon :size="Number.parseInt(size) / 1.5" class="opacity-30">mdi-help</v-icon>
    </div>
  </v-card>
</template>

<style scoped lang="less">
.faction-icon {
  user-select: none;

  * {
    -webkit-user-drag: none;
  }
}
</style>
