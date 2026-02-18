<script setup lang="ts">

import {computed, onMounted, ref, useSlots, watch} from "vue";
import {useI18n} from "vue-i18n";
import Loading from "@/components/Loading.vue";
import {useAppStore} from "~/stores/appStore";
import {useCDNAssetsServiceStore} from "~/stores/cdnAssetsStore";
import BtnWidget from "@/components/snbWidget/btnWidget.vue";
import {useRouter} from "vue-router";
import ModName from "@/components/snbWidget/modName.vue";
import {Modifications} from "glow-prow-data";

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
    router = useRouter(),
    slots = useSlots(),
    appStore = useAppStore(),

    {t} = useI18n(),
    {currentService: currentImageService} = useCDNAssetsServiceStore(),

    modifications = Modifications

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
  i.value = modifications[props.id] || {}

  modsData.value.icon = currentImageService.url({
    id: props.id,
    category: 'modifications'
  });
}
</script>

<template>
  <v-tooltip v-model="modsData.model"
             min-width="450"
             max-width="450"
             interactive
             :disabled="!props.isShowTooltip"
             :offset="[40, 0]"
             location="right top"
             content-class="pa-0" target="cursor">
    <template v-slot:activator="{ props: activatorProps }">
      <v-card
          :to="isOpenDetail ? `/codex/mod/${id}` : ''"
          :target="isOpenNewWindow ? '_blank' : '_self'"
          target="_blank"
          width="100%"
          v-bind="activatorProps"
          :class="[
          'prohibit-drag',
          `ma-${props.margin}`,
          `pa-${props.padding}`,
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

    <v-card class="demo-reel bg-black" flat border>
      <div class="demo-reel-header pa-10 position-relative">
        <h1 class="font-weight-bold">
          <ModName v-if="i?.id" :id="i.id" :grade="i.grade"></ModName>
        </h1>
        <p class="mb-1">{{ props.id }}</p>

        <v-img :src="modsData.icon" class="prohibit-drag right-show-image position-absolute w-33"></v-img>
      </div>
      <div class="demo-reel-content background-flavor overflow-auto">
        <template v-if="isShowDescription">
          <div class="mb-2 pa-5 description">
            <slot name="description"></slot>
          </div>
        </template>
      </div>
      <v-divider></v-divider>
      <v-card-actions class="pa-5 pt-0">
        <BtnWidget @action-complete="router.push(`/codex/ship/${props.id}`)"
                   class="mt-1 ml-1"
                   v-if="isShowOpenDetail">
          {{ t('codex.modifications.lookDetail') }}
        </BtnWidget>
      </v-card-actions>
    </v-card>
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

.description {
  font-size: 18px;
}
</style>
