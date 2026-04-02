<template>
  <v-card
      v-if="adName && adIdSwitchStatus.value && isGlobalAdEnabled"
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
        :clientId="adClient.toString()"
        :slotId="ads[adName]?.slot.toString()"
        :format="ads[adName]?.adFormat || 'autorelaxed'"
        :adStyle="ads[adName]?.style || ''"
        :fullWidthResponsive="ads[adName]?.fullWidthResponsive || ''">
    </Adsense>
  </v-card>
</template>

<script setup lang="ts">
import {computed, onMounted, ref, watch} from 'vue';
import {storage_account} from "@/assets/sripts/index";
import {GoogleAdProps} from "@/assets/types";
import {useI18n} from "vue-i18n";
import Adsense from 'vue3-google-adsense/src/Adsense.vue'
import {ads, adClient} from "~/public/config/ad";

const props = withDefaults(defineProps<GoogleAdProps>(), {
      class: '',
      id: '',
    }),
    {t} = useI18n(),
    adName = ref<string | number>(props.id);

// 当前广告开关状态
const adIdSwitchStatus = ref({type: 'google', value: true}),
    isGlobalAdEnabled = computed<boolean>(() => {
      return storage_account.getConfigurationItem('ad', 'google.switch', {defaultValue: true}) !== false;
    }),
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
