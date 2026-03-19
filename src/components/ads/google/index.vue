<template>
  <v-card
      v-if="adName && adIdSwitchStatus.value"
      min-height="120"
      class="bg-transparent"
      elevation="0"
      :min-width="120 * 2"
      :class="`ad-container w-100 ${ads[adName]?.class} ${props?.class}`"
      :style="[adName && ads[adName] ? ads[adName].style : {}, adContainerStyle]">
    <v-btn icon class="ad-off bg-black" variant="elevated" @click="offAd">
      <v-icon size="20" icon="mdi-close"/>
    </v-btn>

    <Adsense
        v-if="ads[adName]?.slot && adName"
        :client-id="adClient.toString()"
        :slot-id="ads[adName]?.slot.toString()"
        :format="ads[adName]?.adFormat || 'autorelaxed'"
        :ad-style="ads[adName]?.style || ''"
        :full-width-responsive="ads[adName]?.fullWidthResponsive || ''">
    </Adsense>
  </v-card>
</template>

<script setup lang="ts">
import {computed, onMounted, ref, watch} from 'vue';
import {storage_account} from "@/assets/sripts/index";
import {AdConfig, GoogleAdProps} from "@/assets/types";
import {useI18n} from "vue-i18n";
import {useRoute, useRouter} from "vue-router";

const props = withDefaults(defineProps<GoogleAdProps>(), {
      class: 'class',
      id: '',
    }),
    router = useRouter(),
    route = useRoute(),
    {t} = useI18n(),
    adName = ref<string | number>(props.id),
    adClient = "ca-pub-6625226616103631",
    ads: Record<string, AdConfig> = {
      'snb-calendar-up': {
        slot: '7953770612',
        style: "width: 100%;min-height: 150px;",
        class: '',
        adFormat: 'true',
        fullWidthResponsive: 'true'
      },
      'snb-calendar-down': {
        slot: '4014525608',
        style: "width: 100%;min-height: 150px;",
        class: '',
        adFormat: 'true',
        fullWidthResponsive: 'true'
      },
      'assembly-sidebar-browse': {
        slot: '6604763023',
        style: "width: 100%;min-height: 400px;",
        class: '',
        adFormat: 'true',
        fullWidthResponsive: 'true'
      },
      'assembly-browse-up': {
        slot: '1388362267',
        style: "width: 100%;min-height: 150px;",
        class: 'mb-5',
        adFormat: 'true',
        fullWidthResponsive: 'true'
      },
      'assembly-browse-down': {
        slot: '9616404329',
        style: "width: 100%;min-height: 150px;",
        class: 'my-5',
        adFormat: 'true',
        fullWidthResponsive: 'true'
      },
      'assembly-detail-up': {
        slot: '8616115593',
        style: "width: 100%;min-height: 150px;",
        class: 'my-5',
        adFormat: 'true',
        fullWidthResponsive: 'true'
      },
      'assembly-detail-content':{
        slot: '6333300283',
        style: "width: 100%;min-height: 150px;",
        class: 'my-5',
        adFormat: 'true',
        fullWidthResponsive: 'true'
      },
      'codex-up': {
        slot: '4172505952',
        style: "width: 100%;min-height: 150px;",
        class: 'my-5',
        adFormat: 'true',
        fullWidthResponsive: 'true'
      },
      'codex-down': {
        slot: '7002683426',
        style: "width: 100%;min-height: 150px;",
        class: 'my-5',
        adFormat: 'true',
        fullWidthResponsive: 'true'
      }
    };

// 当前广告开关状态
let adIdSwitchStatus = ref({type: 'google', value: true}),
    adContainerStyle = computed(() => {
      return {
        '--ad-fill-content': `"${t('ad.title')}"`,
        '--advertising-text': `"${t('ad.description', {
          id: props.id.toString().toLocaleUpperCase(),
        })}"`
      }
    })

watch(() => props.id, (value) => {
      adName.value = value;
    },
    {immediate: true})


onMounted(() => {
  adIdSwitchStatus.value = storage_account.getConfigurationItem('ad', String(adName.value), {
    defaultValue: {
      type: 'google',
      value: true
    }
  })
})

/**
 * 监听adIdSwitchStatus变化
 */
watch(() => adIdSwitchStatus.value, (value) => {
  if (value === undefined) return
  // 保持原有结构更新
  storage_account.updateConfiguration('ad', String(adName.value), {
    type: 'google',
    value: value.value
  })
})

/**
 * 禁用当前id广告
 */
const offAd = () => {
  const status = false;

  storage_account.updateConfiguration('ad', String(adName.value), {
    type: 'google',
    value: status
  })

  adIdSwitchStatus.value.value = status
};

defineOptions({name: 'GoogleAd'})
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
    width: 30px;
    height: 30px;
    border-radius: 50%;
    overflow: hidden;
    z-index: 10;
  }

  ins {
    position: relative;
    z-index: 5;
    height: 100%;
    display: block;
  }
}

.ad-container:after {
  content: var(--ad-fill-content, "AD");
  text-align: center;
  width: 100%;
  opacity: .4;
  font-size: 1.5rem;
  position: absolute;
  z-index: 0;
  top: calc(50% - 2rem);
}

.ad-container:before {
  content: var(--advertising-text, "Advertising content :P");
  text-align: center;
  width: 100%;
  opacity: .2;
  font-size: .8rem;
  position: absolute;
  z-index: 0;
  top: calc(50% + 5px);
}
</style>
