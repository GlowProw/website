<script setup lang="ts">
import {useIconGlobalStyle} from "@/assets/sripts/use_icon_global_style";

import {computed, onMounted, ref, watch} from "vue";
import Loading from "@/components/Loading.vue";
import {useCDNAssetsServiceStore} from "~/stores/cdnAssetsStore";
import ModCardDetail from "@/components/snbWidget/modCardDetail.vue";
import ItemCardTooltip from "@/components/snbWidget/itemCardTooltip.vue";
import ItemSlotCard from "@/components/snbWidget/ItemSlotCard.vue";
import {useAppStore} from "~/stores/appStore";
import {Modifications} from "glow-prow-data";
import {rarity} from "@/assets/sripts/index";

const props = withDefaults(defineProps<{
      id: string,
      isOpenDetail?: boolean,
      isOpenNewWindow?: boolean,
      isShowDescription?: boolean,
      isShowTooltip?: boolean,
      isShowOpenDetail?: boolean,
      margin?: number,
      padding?: number
    }>(), {
      id: 'dhow',
      isOpenDetail: true,
      isOpenNewWindow: false,
      isShowDescription: true,
      isShowTooltip: true,
      isShowOpenDetail: true,
      margin: 1,
      padding: 1
    }),
    appStore = useAppStore(),

    {currentService: currentImageService} = useCDNAssetsServiceStore(),

    mods = Modifications,

    // 稀有度
    rarityColorConfig = rarity.color;


let i = ref(null),
    modsData = ref({
      icon: '',
      model: false,
      panel: {}
    }),
    isOpenNewWindow = computed({
      get: () => appStore.itemOpenNewWindow || props.isOpenNewWindow,
      set: (value) => appStore.toggleItemOpenNewWindow(value)
    })

watch(() => props.id, () => {
  onReady()
})

onMounted(() => {
  onReady()
})

const onReady = async () => {
  i.value = mods[props.id]
  modsData.value.icon = currentImageService.url({
    'skull-and-bones-tools': {
      id: props.id,
      type: i.value.grade,
      category: 'modification'
    },
    'glow-prow': {
      id: props.id,
      category: 'modifications'
    },
    'glow-prow-zh-cn': {
      id: props.id,
      category: 'modifications'
    },
    'local-test': {
      id: props.id,
      category: 'modifications'
    },
  });
}

defineOptions({
  name: "ModIconWidget"
})

const {useIconImagePadding, useIconImageMargin} = useIconGlobalStyle();
const computedPadding = useIconImagePadding(props.padding);
const computedMargin = useIconImageMargin(props.margin);
</script>

<template>
  <ItemCardTooltip :disabled="!props.isShowTooltip">
    <template v-slot:activator="{ props: activatorProps }">
      <ItemSlotCard
          v-bind="activatorProps"
          :to="isOpenDetail ? `/codex/modification/${id}` : ''"
          :target="isOpenNewWindow ? '_blank' : '_self'"
          :rarity="(i as any)?.rarity || ''"
          :padding="props.padding"
          :margin="props.margin">
        <template v-if="modsData.icon">
          <v-img
              :src="modsData.icon"
              aspect-ratio="1"
              referrerpolicy="no-referrer"
              class="pointer-events-none prohibit-drag w-100 h-100">
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
        </template>
        <template v-else>
          <v-img
              aspect-ratio="1"
              class="error text-center w-100 h-100"
              referrerpolicy="no-referrer">
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
        </template>
      </ItemSlotCard>
    </template>

    <ModCardDetail
        :id="props.id"
        :is-show-description="props.isShowDescription"
        :is-show-open-detail="props.isShowOpenDetail">
      <template v-slot:description v-if="$slots.description">
        <slot name="description"></slot>
      </template>
    </ModCardDetail>
  </ItemCardTooltip>
</template>

<style scoped lang="less">
@import "@/assets/styles/demo-reel";

.error {
  background-color: #d500002b !important;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
}
</style>
