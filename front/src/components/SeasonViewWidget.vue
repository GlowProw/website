<script setup lang="ts">
import {useAssetsStore} from "~/stores/assetsStore";
import {computed, nextTick, onMounted, ref, watch} from "vue";
import {useI18n} from "vue-i18n";
import {useDisplay} from "vuetify/framework";
import {Season} from "glow-prow-data/src/entity/Seasons";

const seasonVideos = import.meta.glob('@/assets/videos/*', {eager: true}),
    seasonImages = import.meta.glob('@/assets/images/snb/season/*', {eager: true});


const {serializationMap} = useAssetsStore(),
    {t} = useI18n(),
    {mobile} = useDisplay(),
    props = defineProps<{ data: Season }>()

let images = ref({}),
    currentSeasonBannerAddress = ref('release'),
    bySeasonId = computed(() => {
      return props.data?.id || props.data?.id || 'release'
    }),
    currentSeasonFormat = computed(() => currentSeasonBannerAddress.value.toString().split('.')[1])

watch(() => props.data, () => {
  updateSeason()
})

onMounted(() => {
  images.value = serializationMap({...seasonVideos, ...seasonImages})

  updateSeason()
})

const updateSeason = () => {
  nextTick(() => {
    currentSeasonBannerAddress.value = images.value[bySeasonId.value]
  })
}

</script>

<template>
  <div class="card-enlargement-flavor">
    <template v-if="currentSeasonBannerAddress">
      <video autoplay playsinline
             v-if="currentSeasonFormat == 'mp4'"
             class="w-100 by-season-content"
             muted loop type="video/mp4"
             :src="currentSeasonBannerAddress"></video>
      <v-img v-else-if="currentSeasonFormat == 'png'"
             cover
             class="w-100 by-season-content"
             :src="currentSeasonBannerAddress"></v-img>
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
