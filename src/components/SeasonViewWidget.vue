<script setup lang="ts">
import {useAssetsStore} from "~/stores/assetsStore";
import {computed, nextTick, onMounted, ref, watch} from "vue";
import {useI18n} from "vue-i18n";
import {useDisplay} from "vuetify/framework";
import {Season} from "glow-prow-data/src/entity/Seasons";

const seasonVideos = import.meta.glob('@/assets/videos/*.*', {eager: true}),
    seasonImages = import.meta.glob('@/assets/images/snb/season/*.*', {eager: true})

const {serializationMap} = useAssetsStore(),
    {t} = useI18n(),
    {mobile} = useDisplay(),
    props = defineProps<{ data: Season | unknown }>()

let images = ref({}),
    currentSeasonBannerAddress = ref('release'),
    bySeasonId = computed(() => {
      return props.data?.id || props.data?.id || 'release'
    }),
    currentSeasonFormat = computed(() => {
      return extractFileFormat(currentSeasonBannerAddress.value)
    })

watch(() => props.data, () => {
  updateSeason()
})

onMounted(() => {
  images.value = serializationMap({...seasonVideos, ...seasonImages})

  updateSeason()
})

/**
 * 文件格式
 * @param url
 */
const extractFileFormat = (url: string): string | null => {
  const match = url.match(/\.([a-zA-Z0-9]+)(?:[\?#]|$)/)
  return match ? match[1].toLowerCase() : null;
}

const updateSeason = () => {
  nextTick(() => {
    currentSeasonBannerAddress.value = images.value[bySeasonId.value]
  })
}

</script>

<template>
  <div class="card-enlargement-flavor w-100">
    <template v-if="currentSeasonBannerAddress">
      <template v-if="currentSeasonFormat == 'mp4'">
        <video autoplay playsinline
               class="w-100 by-season-content"
               muted loop type="video/mp4"
               :src="currentSeasonBannerAddress"></video>
      </template>
      <template v-else-if="currentSeasonFormat == 'png'">
        <v-img
            cover
            class="w-100 by-season-content"
            :src="currentSeasonBannerAddress"></v-img>
      </template>
    </template>
    <v-img v-else-if="!currentSeasonBannerAddress || !data || !data?.id"
           cover
           class="w-100 h-100 d-block by-season-content"
           min-width="400"
           min-height="250"
           src="@/assets/images/snb/season/release.png"></v-img>
  </div>
</template>

<style scoped lang="less">
</style>
