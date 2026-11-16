<script setup lang="ts">
import {useIconGlobalStyle} from "@/assets/sripts/use_icon_global_style";
import {Ultimate, Ultimates} from "glow-prow-data"
import {computed, onMounted, type Ref, ref} from "vue";
import {useAppStore} from "~/stores/appStore";
import {rarity} from "@/assets/sripts/index";
import {useRouter} from "vue-router";
import {useI18nUtils} from "@/assets/sripts/i18n_util";
import {useCDNAssetsServiceStore} from "~/stores/cdnAssetsStore";
import UltimateCardDetail from "@/components/snbWidget/ultimateCardDetail.vue";
import ItemCardTooltip from "@/components/snbWidget/itemCardTooltip.vue";

const props = withDefaults(defineProps<{
      id: string,
      isShowOpenDetail?: boolean,
      isOpenDetail?: boolean,
      isOpenNewWindow?: boolean,
      isShowTooltip?: boolean,
      margin?: number,
      padding?: number
    }>(), {
      id: 'dhow',
      isShowOpenDetail: true,
      isOpenDetail: true,
      isOpenNewWindow: false,
      isShowTooltip: true,
      margin: 1,
      padding: 1
    }),
    {t} = useI18nUtils(),
    router = useRouter(),
    {currentService: currentImageService} = useCDNAssetsServiceStore(),
    appStore = useAppStore(),
    ultimatesMap = Ultimates,

    // 稀有度
    rarityColorConfig = rarity.color

let ultimatesData = ref({
      icon: '',
    }),
    i: Ref<Ultimate | null> = ref(null),
    isOpenNewWindow = computed({
      get: () => appStore.itemOpenNewWindow || props.isOpenNewWindow,
      set: (value) => appStore.toggleItemOpenNewWindow(value)
    })

onMounted(() => {
  onReady()
})

const onReady = async () => {
  i.value = ultimatesMap[props.id] || null

  ultimatesData.value.icon = currentImageService.url({
    'skull-and-bones-tools': {
      id: props.id,
      type: i.value.type,
      category: 'ultimate'
    },
    'glow-prow': {
      id: props.id,
      category: 'ultimates'
    },
    'glow-prow-zh-cn': {
      id: props.id,
      category: 'ultimates'
    },
    'local-test': {
      id: props.id,
      category: 'ultimates'
    }
  })
}

defineOptions({
  name: "UltimateIconWidget"
})

const {useIconImagePadding, useIconImageMargin} = useIconGlobalStyle();
const computedPadding = useIconImagePadding(props.padding);
const computedMargin = useIconImageMargin(props.margin);
</script>

<template>
  <ItemCardTooltip
      v-if="i && i.id"
      :disabled="!props.isShowTooltip">
    <template v-slot:activator="{ props: activatorProps }">
      <v-card
          v-bind="activatorProps"
          :to="isOpenDetail ? `/codex/ultimate/${id}` : ''"
          :target="isOpenNewWindow ? '_blank' : '_self'"
          :style="`background: hsl(from ${rarityColorConfig[i?.rarity]} h s calc(l * .2))`"
          width="100%"
          variant="text"
          class="border"
          :class="[
              'prohibit-drag',
              `ma-${computedMargin}`,
              `pa-${computedPadding}`,
          ]">
        <v-img :src="ultimatesData.icon"
               referrerpolicy="no-referrer"
               class="pointer-events-none prohibit-drag">
          <template v-slot:error>
            <div class="fill-height repeating-gradient d-flex justify-center align-center h-100">
              <v-icon icon="mdi-help" class="opacity-30"></v-icon>
            </div>
          </template>
          <template v-slot:placeholder>
            <div class="d-flex justify-center align-center h-100 opacity-60">
              <Loading size="30px" min-size="10px" max-size="50px"/>
            </div>
          </template>
        </v-img>
      </v-card>
    </template>
    <UltimateCardDetail
        :id="props.id"
        :is-show-open-detail="props.isShowOpenDetail"
    />
  </ItemCardTooltip>
</template>

<style scoped lang="less">
@import "@/assets/styles/demo-reel";
</style>
