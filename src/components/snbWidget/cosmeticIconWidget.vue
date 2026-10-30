<script setup lang="ts">
import { useIconGlobalStyle } from "@/assets/sripts/use_icon_global_style";
import {useRouter} from "vue-router";
import {useI18n} from "vue-i18n";
import Loading from "../Loading.vue";
import {computed, onMounted, type Ref, ref, UnwrapRef, watch} from "vue";
import {useIntersectionObserver} from "@/assets/sripts/intersection_observer";
import {useAssetsStore} from "~/stores/assetsStore";
import {Cosmetic, Cosmetics} from "glow-prow-data";
import {useAppStore} from "~/stores/appStore";
import {useCDNAssetsServiceStore} from "~/stores/cdnAssetsStore";
import CosmeticCardDetail from "@/components/snbWidget/cosmeticCardDetail.vue";
import ItemCardTooltip from "@/components/snbWidget/itemCardTooltip.vue";

const {raritys} = useAssetsStore(),
    {currentService: currentImageService} = useCDNAssetsServiceStore(),

    {t} = useI18n(),
    router = useRouter(),
    props = withDefaults(defineProps<{
      id: string,
      isShowOpenDetail?: boolean,
      isOpenDetail?: boolean,
      isOpenNewWindow?: boolean,
      isShowDescription?: boolean,
      isShowTooltip?: boolean,
      padding?: number,
      margin?: number
    }>(), {
      id: 'culverin1',
      isShowOpenDetail: true,
      isOpenDetail: true,
      isOpenNewWindow: false,
      isShowDescription: true,
      isShowTooltip: true,
      padding: 0,
      margin: 1,
    }),
    appStore = useAppStore(),
    cosmetics = Cosmetics;



let cosmeticCardData = ref({
      icon: '',
      fallbackIcon: '',
    }),
    // 是否已切换到远端回退地址
    isIconFallback = ref(false),
    // 回退地址也失败时只显示占位图标
    isIconError = ref(false),
    i: Ref<UnwrapRef<Cosmetic> | Cosmetic> = ref(Cosmetic.fromRawData({})),
    isOpenNewWindow = computed({
      get: () => appStore.itemOpenNewWindow || props.isOpenNewWindow,
      set: (value) => appStore.toggleItemOpenNewWindow(value)
    })

// 当前实际使用的图片地址，首选当前服务，失败后改用远端
const displayIcon = computed(() => isIconFallback.value
    ? cosmeticCardData.value.fallbackIcon
    : cosmeticCardData.value.icon)

/**
 * 当前服务加载失败时回退到远端资源
 * 本地资源代理未启动、或本地尚未收录新装扮时，图标仍能正常显示
 */
const onIconError = () => {
  const {icon, fallbackIcon} = cosmeticCardData.value
  if (!isIconFallback.value && fallbackIcon && fallbackIcon !== icon) {
    isIconFallback.value = true
    return
  }
  isIconError.value = true
}

watch(() => props.id, () => {
  onReady()
})

onMounted(() => {
  onReady()
})

const onReady = async () => {
  i.value = cosmetics[props.id] || null

  // 同一个 id 切换时重置回退状态，避免沿用上一个条目的失败结果
  isIconFallback.value = false
  isIconError.value = false

  const params = {
    'skull-and-bones-tools': {
      id: props.id,
      type: i.value?.type,
      category: 'cosmetic'
    },
    'glow-prow': {
      id: props.id,
      category: 'vanities'
    },
    'glow-prow-zh-cn': {
      id: props.id,
      category: 'vanities'
    },
    'local-test': {
      id: props.id,
      category: 'vanities'
    },
  }

  cosmeticCardData.value.icon = currentImageService.url(params)
  // 远端资源作为兜底，DEV 下当前服务是本地代理，代理未启动时也能拿到图片
  cosmeticCardData.value.fallbackIcon = currentImageService.url(params, 'glow-prow')
}

const {targetElement, isVisible} = useIntersectionObserver({
  threshold: .7,
})

const { useIconImagePadding, useIconImageMargin } = useIconGlobalStyle();
const computedPadding = useIconImagePadding(props.padding);
const computedMargin = useIconImageMargin(props.margin);

defineOptions({
  name: 'CosmeticIconWidget'
})
</script>

<template>
  <ItemCardTooltip
      v-if="i && i.id"
      :disabled="!props.isShowTooltip">
    <template v-slot:activator="{ props: activatorProps }">
      <v-card
          ref="targetElement"
          width="100%"
          v-bind="activatorProps"
          :to="isOpenDetail ? `/codex/cosmetic/${i.id}` : ''"
          :target="isOpenNewWindow ? '_blank' : '_self'"
          :class="[
              'prohibit-drag',
              `ma-${computedMargin}`,
              `pa-${computedPadding}`,
              `cosmetic-card-header-rarity-${i.rarity}`
          ]">
        <template v-slot:image v-if="i.rarity">
          <v-img :src="raritys[`cosmetic-rarity-${i.rarity}`]" width="100%" height="100%" class="opacity-30 prohibit-drag"/>
        </template>

        <div class="d-flex align-center justify-center h-100">
          <v-img
              v-if="displayIcon && !isIconError"
              referrerpolicy="no-referrer"
              class="prohibit-drag"
              :src="displayIcon"
              @error="onIconError">
            <template v-slot:placeholder>
              <div class="d-flex justify-center align-center h-100">
                <Loading size="40"/>
              </div>
            </template>
          </v-img>
          <div v-else class="fill-height repeating-gradient d-flex justify-center align-center h-100">
            <v-icon icon="mdi-help" class="opacity-30"></v-icon>
          </div>
        </div>
      </v-card>
    </template>
    <CosmeticCardDetail
        :id="props.id"
        :is-show-description="props.isShowDescription"
        :is-show-open-detail="props.isShowOpenDetail"
    />
  </ItemCardTooltip>
</template>

<style scoped lang="less">
@import "@/assets/styles/demo-reel";

.cosmetic-mirror-image {
  transform: scaleX(-1);
}

.cosmetic-card {
  &::after {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 40;
    border-radius: inherit;
  }
}
</style>
