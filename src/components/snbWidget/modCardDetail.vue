<script setup lang="ts">
import {onMounted, ref, watch} from "vue";
import {useI18n} from "vue-i18n";
import {useRouter} from "vue-router";
import {Modifications} from "glow-prow-data";
import {useCDNAssetsServiceStore} from "~/stores/cdnAssetsStore";

import ModName from "@/components/snbWidget/modName.vue";
import ModDescription from "@/components/snbWidget/modDescription.vue";
import BtnWidget from "@/components/snbWidget/btnWidget.vue";

const props = withDefaults(defineProps<{
  id: string,
  isShowDescription?: boolean,
  isShowOpenDetail?: boolean,
  isWidget?: boolean,
}>(), {
  id: 'dhow',
  isShowDescription: true,
  isShowOpenDetail: true,
  isWidget: false,
})

const {t} = useI18n()
const router = useRouter()
const {currentService: currentImageService} = useCDNAssetsServiceStore()

const modifications = Modifications
const i = ref<any>(null)
const modsData = ref({
  icon: '',
})

const onReady = async () => {
  i.value = modifications[props.id] || {}

  modsData.value.icon = currentImageService.url({
    id: props.id,
    category: 'modifications'
  });
}

watch(() => props.id, () => {
  onReady()
})

onMounted(() => {
  onReady()
})

defineOptions({
  name: "ModCardDetail"
})
</script>

<template>
  <v-card class="demo-reel bg-black" flat border v-if="i">
    <div class="demo-reel-header pa-10 position-relative">
      <h1 class="font-weight-bold">
        <ModName v-if="i?.id" :id="i.id" :grade="i.grade"></ModName>
      </h1>
      <p class="mb-1">{{ props.id }}</p>

      <v-img :src="modsData.icon" class="prohibit-drag right-show-image position-absolute w-33"></v-img>
    </div>
    <div class="demo-reel-content background-flavor overflow-auto">
      <template v-if="isShowDescription">
        <div class="mb-5 px-6">
          <slot name="description"></slot>
        </div>
      </template>
      <template v-if="isShowDescription && i && i.id">
        <div class="mb-5 px-6 description">
          <ModDescription :id="props.id" :grade="i.grade" :variants="i.variants"></ModDescription>
        </div>
      </template>
    </div>
    <v-divider v-if="isShowOpenDetail"></v-divider>
    <v-card-actions class="pa-5 pt-0"
                    v-if="isShowOpenDetail">
      <BtnWidget @action-complete="router.push(`/codex/modification/${props.id}`)"
                 class="mt-1 ml-1">
        {{ t('codex.modifications.lookDetail') }}
      </BtnWidget>
    </v-card-actions>
  </v-card>
</template>

<style scoped lang="less">
@import "@/assets/styles/demo-reel";
</style>
