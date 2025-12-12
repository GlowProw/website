<template>
  <v-card
      border
      v-if="adId && adIdSwitchStatus.value"
      min-height="120"
      :min-width="120 * 2"
      :class="`ad-container w-100 ${ads[adId]?.class} ${props?.class}`"
      :style="adId && ads[adId] ? ads[adId].style : {}">
    <v-btn icon class="ad-off" variant="tonal" @click="offAd">
      <v-icon size="20" icon="mdi-close"/>
    </v-btn>

<!--    <Adsense-->
<!--        v-if="ads[adId] && adId"-->
<!--        :client-id="adClient.toString()"-->
<!--        :slot-id="adId.toString()"-->
<!--        :format="ads[adId]?.adFormat || ''"-->
<!--        :ad-style="ads[adId]?.style || ''"-->
<!--        :full-width-responsive="ads[adId]?.fullWidthResponsive || ''">-->
<!--    </Adsense>-->
  </v-card>
</template>

<script setup lang="ts">
import {onMounted, ref, watch} from 'vue';
import {useRoute, useRouter} from 'vue-router';
import {storage_account} from "@/assets/sripts/index";

interface AdConfig {
  name?: string;
  style?: string;
  class?: string;
  adFormat?: string;
  fullWidthResponsive?: string;
}

interface Props {
  id?: number | string;
}

const props = withDefaults(defineProps<Props>(), {
  class: 'class',
  id: '',
})

const route = useRoute()
const router = useRouter()

const adId = ref<string | number>(props.id)
const adClient = "ca-pub-6625226616103631";

const ads: Record<string, AdConfig> = {
  'none1': {
    style: "width: 100%;min-height: 80px;",
    class: '',
    adFormat: 'true',
    fullWidthResponsive: 'true'
  },
  'none2': {
    name: 'right',
    style: "width: 100%;min-height: 300px;margin-bottom: 10px;",
    class: '',
    adFormat: 'true',
    fullWidthResponsive: 'true'
  },
  'none3': {
    style: "width: 100%;min-height: 200px;",
    class: '',
    adFormat: 'autorelaxed',
    fullWidthResponsive: 'true'
  },
};

// 当前广告开关状态
let adIdSwitchStatus = ref({type: 'google', value: true})

watch(() => props.id, (value) => {
      adId.value = value;
    },
    {immediate: true})


onMounted(() => {
  adIdSwitchStatus.value = storage_account.getConfigurationItem('ad', adId.value, {
    defaultValue: {
      type: 'google',
      value: true
    }
  })
})

/**
 * 禁用当前id广告
 */
const offAd = () => {
  const status = false;

  storage_account.updateConfiguration('ad', adId.value, {
    type: 'google',
    value: status
  })

  adIdSwitchStatus.value.value = status
};
</script>

<style lang="less">
.ad-container:hover,
.ad-container:active,
.ad-container:focus {
  .ad-off {
    display: flex;
  }
}

.ad-container {
  position: relative;

  .ad-off {
    position: absolute;
    top: 5px;
    right: 5px;
    display: none;
    cursor: pointer;
    justify-content: center;
    align-items: center;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    overflow: hidden;
    z-index: 10;

    & * {
      opacity: .5;
    }
  }

  ins {
    position: relative;
    z-index: 5;
    height: 100%;
    display: block;
  }
}

.ad-container:after {
  content: "AD";
  text-align: center;
  width: 100%;
  opacity: .4;
  font-size: 1.5rem;
  position: absolute;
  z-index: 0;
  top: calc(50% - 1.5rem);
}

.ad-container:before {
  content: "Advertising content";
  text-align: center;
  width: 100%;
  opacity: .2;
  font-size: .8rem;
  position: absolute;
  z-index: 0;
  top: calc(50% + 5px);
}
</style>
