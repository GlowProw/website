<script setup lang="ts">
import { useIconGlobalStyle } from "@/assets/sripts/useIconGlobalStyle";

import {computed, onMounted, ref, useSlots, watch} from "vue";
import {useI18n} from "vue-i18n";
import Loading from "@/components/Loading.vue";
import {useCDNAssetsServiceStore} from "~/stores/cdnAssetsStore";
import {useTooltipFollow} from "@/assets/sripts/use_tooltip_follow";
import ModCardDetail from "@/components/snbWidget/modCardDetail.vue";
import {useAppStore} from "~/stores/appStore";
import {useRouter} from "vue-router";

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
    {tooltipPos, onMouseMove, onMouseEnter} = useTooltipFollow();



let modsData = ref({
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

  modsData.value.icon = currentImageService.url({
    id: props.id,
    category: 'modifications'
  });
}

defineOptions({
  name: "ModIconWidget"
})

const { useIconImagePadding, useIconImageMargin } = useIconGlobalStyle();
const computedPadding = useIconImagePadding(props.padding);
const computedMargin = useIconImageMargin(props.margin);
</script>

<template>
  <v-tooltip v-model="modsData.model"
             min-width="450"
             max-width="450"
             interactive
             :disabled="!props.isShowTooltip"
             :offset="[40, 0]"
             location="right top"
             content-class="pa-0 bg-transparent"
             :target="[tooltipPos.x, tooltipPos.y]">
    <template v-slot:activator="{ props: activatorProps }">
      <v-card
          @mousemove="onMouseMove"
          @mouseenter="onMouseEnter"
          :to="isOpenDetail ? `/codex/modification/${id}` : ''"
          :target="isOpenNewWindow ? '_blank' : '_self'"
          width="100%"
          v-bind="activatorProps"
          :class="[
          'prohibit-drag',
          `ma-${computedMargin}`,
          `pa-${computedPadding}`,
      ]">
        <template v-if="modsData.icon">
          <v-img :src="modsData.icon"
                 class="pointer-events-none">
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
        </template>
        <template v-else>
          <v-img class="error text-center">
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
        </template>
      </v-card>
    </template>

    <ModCardDetail
        :id="props.id"
        :is-show-description="props.isShowDescription"
        :is-show-open-detail="props.isShowOpenDetail">
      <template v-slot:description>
        <slot name="description"></slot>
      </template>
    </ModCardDetail>
  </v-tooltip>
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
