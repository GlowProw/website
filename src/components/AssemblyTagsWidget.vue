<script setup lang="ts">
import {useI18n} from "vue-i18n";
import {onMounted, ref, toRaw, watch} from "vue";
import {useRoute} from "vue-router";

import {Seasons, Ships} from "glow-prow-data";
import {Items} from "glow-prow-data/src/entity/Items.ts";
import ItemSlotBase from "@/components/snbWidget/ItemSlotBase.vue";
import DamageIconWidget from "@/components/snbWidget/damageIconWidget.vue";

const poops = withDefaults(defineProps<{ readonly?: boolean, tags: string[], class?: string }>(), {
      readonly: false,
      tags: () => [],
      class: ''
    }),
    route = useRoute(),
    ships = Ships,
    items: Items = Items,
    {t} = useI18n()

let publishData = ref({
      tags: []
    }),
    selectedChips = ref([]),
    tagsConfig = {
      seasons: Object.keys(Seasons),
      archeTypes: ['dps', 'tank', 'support'],
      difficultyOfAcquisitions: ['simple', 'medium', 'difficulties'],
      damageTypes: [
        'explosive',
        'flooding',
        'fire',
        'tearing',
        'piercing',
        'electric',
        'lifesteal',
        'toxic',
        'repair',
      ]
    };

const emit = defineEmits(['change'])

watch(() => poops.tags, (value) => {
  publishData.value.tags = value;
}, {
  deep: true,
})

onMounted(() => {
  publishData.value.tags = poops.tags;
})

/**
 * 处理标签难度
 */
const onTagsDifficultyOfAcquisition = (value: string) => {
  if (value == null) {
    let index = publishData.value.tags.findIndex(i => i.indexOf('difficultyOfAcquisition_') >= 0)
    publishData.value.tags.splice(index, 1)
    return;
  }

  if (publishData.value.tags.filter(i => i.indexOf('difficultyOfAcquisition_') >= 0)) {
    let index = publishData.value.tags.findIndex(i => i.indexOf('difficultyOfAcquisition_') >= 0)
    publishData.value.tags.splice(index, 1)
  }

  publishData.value.tags.splice(publishData.value.tags.length + 1, 0, `difficultyOfAcquisition_${value}`)
}

/**
 * 处理tab事件
 * @param data
 */
const onUpdateTags = (data: any) => {
  publishData.value.tags = [...new Set([...selectedChips.value, ...data])];

  emit('change', toRaw(publishData.value.tags))
}
</script>

<template>
  <v-chip-group
      v-model="publishData.tags"
      :value="publishData.tags"
      :class="poops.class"
      @update:modelValue="onUpdateTags"
      column
      multiple>
    <div class="mt-3 w-100">
      <p class="title-long-flavor bg-black ml-n1 pl-3 pt-2 pb-2 w-100">配装适用模式</p>
      <div class="mt-3 d-flex ga-2" :class="[readonly ? 'readonly' : '']">
        <v-chip filter size="small" color="primary"
                v-for="(i, index) in ['pvp', 'pve']"
                :key="index"
                :value="i">{{ i.toUpperCase() }}
        </v-chip>
      </div>
    </div>

    <div class="mt-3 w-100">
      <p class="title-long-flavor bg-black ml-n1 pl-3 pt-2 pb-2 w-100">配装组队</p>
      <div class="mt-3 d-flex ga-2" :class="[readonly ? 'readonly' : '']">
        <v-chip size="small" color="primary"
                v-for="(i, index) in ['singlePlayer', 'multiPlayer']"
                :key="index"
                :value="`teamFormationMethod_${i}`">
          {{ t(`assembly.tags.teamFormationMethods.${i}`) }}
        </v-chip>
      </div>
    </div>

    <div class="mt-3 w-100">
      <p class="title-long-flavor bg-black ml-n1 pl-3 pt-2 pb-2 w-100">适用赛季</p>
      <div class="mt-3 ga-2" :class="[readonly ? 'readonly' : '']">
        <v-chip filter size="small" color="primary"
                v-for="(i, index) in tagsConfig.seasons"
                :key="index"
                :value="`season_${i}`">{{ t(`snb.seasons.${i}`) }}</v-chip>
      </div>
    </div>

    <div class="mt-3">
      <p class="title-long-flavor bg-black ml-n1 pl-3 pt-2 pb-2 w-100">伤害类型</p>
      <div class="mt-3 ga-2" :class="[readonly ? 'readonly' : '']">
        <v-chip filter size="small" color="primary"
                v-for="(i, index) in tagsConfig.damageTypes"
                :key="index"
                :value="`damageType_${i}`">
          <DamageIconWidget :id="i" size="20px" class="mr-1" :is-border="false"></DamageIconWidget>
          {{ t(`assembly.tags.damageTypes.${i}`) }}
        </v-chip>
      </div>
    </div>

    <div class="mt-3 w-100">
      <p class="title-long-flavor bg-black ml-n1 pl-3 pt-2 pb-2 w-100">船只定位</p>
      <div class="mt-3 d-flex ga-2" :class="[readonly ? 'readonly' : '']">
        <v-chip filter size="small" color="primary"
                v-for="(i, index) in tagsConfig.archeTypes"
                :key="index"
                :value="`archetype_${i}`">{{ t(`assembly.tags.archetypes.${i}`) }}</v-chip>
      </div>
    </div>
  </v-chip-group>
</template>

<style scoped lang="less">
.readonly {
  position: relative;

  &:after {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    z-index: 100;
    width: 100%;
    height: 100%;
  }
}
</style>
