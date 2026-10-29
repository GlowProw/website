<script setup lang="ts">
import {computed, onMounted, type Ref, ref, watch} from "vue";
import {Enemy, Enemies} from "glow-prow-data";
import {useIconGlobalStyle} from "@/assets/sripts/use_icon_global_style";
import {useCDNAssetsServiceStore} from "~/stores/cdnAssetsStore";
import {useAppStore} from "~/stores/appStore";
import Loading from "@/components/Loading.vue";
import ItemCardTooltip from "@/components/snbWidget/itemCardTooltip.vue";
import EnemiesCardDetail from "@/components/snbWidget/enemiesCardDetail.vue";

const appStore = useAppStore(),
    cdnStore = useCDNAssetsServiceStore(),
    enemies: any = Enemies,
    props = withDefaults(defineProps<{
      data?: Enemy,
      id?: string,
      isShowOpenDetail?: boolean,
      isOpenDetail?: boolean,
      isOpenNewWindow?: boolean,
      isShowTooltip?: boolean,
      padding?: number,
      margin?: number
    }>(), {
      isShowOpenDetail: true,
      isOpenDetail: true,
      isOpenNewWindow: false,
      isShowTooltip: true,
      padding: 0,
      margin: 1
    })

let enemiesCardData = ref({
      icon: ''
    }),
    i: Ref<Enemy | null> = ref(null),

    isOpenNewWindow = computed({
      get: () => appStore.itemOpenNewWindow || props.isOpenNewWindow,
      set: (value) => appStore.toggleItemOpenNewWindow(value)
    })

watch(() => props.id, () => {
  onReady()
})

watch(() => props.data, () => {
  onReady()
}, {deep: true})

watch(() => cdnStore.selectedService, () => {
  onSetIcon()
})

onMounted(() => {
  onReady()
})

const onReady = () => {
  i.value = enemies[props?.data?.key || props?.data?.id || props?.id || ''] || null
  onSetIcon()
}

const onSetIcon = () => {
  if (!i.value) {
    enemiesCardData.value.icon = ''
    return
  }
  // 敌人自身没有独立图标时退回所属类型的图标
  const iconId = i.value.icon || i.value.type
  enemiesCardData.value.icon = cdnStore.currentService.image.url({
    'glow-prow': {
      id: iconId,
      category: 'enemies'
    },
    'glow-prow-zh-cn': {
      id: iconId,
      category: 'enemies'
    },
    'local-test': {
      id: iconId,
      category: 'enemies'
    },
  })
}

const getType = (i: any) => i?.type
const getCategory = (i: any) => i?.category

const {useIconImagePadding, useIconImageMargin} = useIconGlobalStyle();
const computedPadding = useIconImagePadding(props.padding);
const computedMargin = useIconImageMargin(props.margin);

defineExpose({
  getType,
  getCategory
})

defineOptions({
  name: "EnemiesIconWidget"
})
</script>

<template>
  <ItemCardTooltip v-if="i && i.id" :disabled="!props.isShowTooltip">
    <template v-slot:activator="{ props: activatorProps }">
      <v-card
          width="100%"
          v-bind="activatorProps"
          :to="isOpenDetail ? `/codex/enemy/${i.key}` : ''"
          :target="isOpenNewWindow ? '_blank' : '_self'"
          :class="[
              'prohibit-drag',
              `ma-${computedMargin}`,
              `pa-${computedPadding}`
          ]">
        <div class="d-flex align-center justify-center h-100 pa-lg-5">
          <v-img
              referrerpolicy="no-referrer"
              class="prohibit-drag"
              :src="enemiesCardData.icon">
            <template v-slot:error>
              <div class="fill-height repeating-gradient d-flex justify-center align-center h-100">
                <v-icon icon="mdi-help" class="opacity-30"></v-icon>
              </div>
            </template>
            <template v-slot:placeholder>
              <div class="d-flex justify-center align-center h-100">
                <Loading size="40"/>
              </div>
            </template>
          </v-img>
        </div>
      </v-card>
    </template>
    <EnemiesCardDetail
        :id="i.key"
        :is-show-open-detail="props.isShowOpenDetail"/>
  </ItemCardTooltip>
</template>

<style scoped lang="less">
@import "@/assets/styles/demo-reel";
</style>
