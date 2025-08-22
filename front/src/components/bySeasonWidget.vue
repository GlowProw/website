<script setup lang="ts">
import {useItemAssetsStore} from "~/stores/itemAssetsStore";
import {computed, onMounted, ref} from "vue";
import {Item, Ship} from "glow-prow-data";
import {useI18n} from "vue-i18n";
import {useDisplay} from "vuetify/framework";

const seasonImages = import.meta.glob('@/assets/videos/*', {eager: true});

const {serializationMap} = useItemAssetsStore(),
    {t} = useI18n(),
    {mobile} = useDisplay(),
    props = defineProps<{ data: Item | Ship }>()

let images = ref({}),
    currentSeasonBanner = computed(() => {
      return images.value[props.data?.bySeason?.id || 'release']
    })

onMounted(() => {
  images.value = serializationMap(seasonImages)
})

</script>

<template>
  <v-card class="by-season-card mb-4 bg-transparent" :class="{'by-season-n-top': !mobile}">
    <template v-slot:image>
      <div class="card-enlargement-flavor">
        <video autoplay playsinline
               class="w-100 by-season-content"
               v-if="currentSeasonBanner"
               muted loop type="video/mp4"
               :src="currentSeasonBanner"></video>
        <v-img v-else-if="!currentSeasonBanner || !data?.bySeason || !data?.bySeason?.id"
               cover
               class="w-100 h-100 d-block by-season-content"
               min-width="400"
               min-height="250"
               src="@/assets/images/snb/season/release.png"></v-img>
      </div>
    </template>
    <v-card class="card-enlargement-flavor by-season-footer-context" :to="`/display-cabinet/item/season/${data?.bySeason?.id || 'release'}`">
      <v-text-field :value="t(`snb.seasons.${data?.bySeason?.id || 'release'}`) || 'none'"
                    readonly
                    tile
                    hide-details
                    class="bg-transparent"
                    variant="solo-filled">
        <template v-slot:prepend>
          <p class="text-no-wrap pl-4">{{ t('displayCabinet.item.bySeason.prepend') }}</p>
        </template>
        <template v-slot:append-inner>
          <p class="text-no-wrap">{{ t('displayCabinet.item.bySeason.append') }}</p>
        </template>
      </v-text-field>
    </v-card>
  </v-card>
</template>

<style scoped lang="less">
.by-season-card {
}

.by-season-footer-context {
  margin-top: 150px;
}

.by-season-content {
  transform: scale(1.2) translateY(-10%)
}

.by-season-n-top {
  margin-top: -200px;
}
</style>
