<script setup lang="ts">
import {computed} from "vue";
import {useI18nUtils} from "@/assets/sripts/i18n_util";
import {useRouter} from "vue-router";
import {EmpireSkills} from "glow-prow-data";

import EmpireSkillName from "@/components/snbWidget/empireSkillName.vue";
import EmpireSkillDescription from "@/components/snbWidget/empireSkillDescription.vue";
import FactionIconWidget from "@/components/snbWidget/factionIconWidget.vue";
import ItemSlotBase from "@/components/snbWidget/ItemSlotBase.vue";
import BtnWidget from "@/components/snbWidget/btnWidget.vue";

const props = withDefaults(defineProps<{
  id: string,
  isShowDescription?: boolean,
  isShowOpenDetail?: boolean,
  isWidget?: boolean,
}>(), {
  isShowDescription: true,
  isShowOpenDetail: true,
  isWidget: false,
});

const {t} = useI18nUtils();
const router = useRouter();

const skill = computed(() => EmpireSkills[props.id]);

defineOptions({
  name: "EmpireSkillCardDetail"
});
</script>

<template>
  <v-card class="demo-reel bg-black" flat border v-if="skill">
    <div class="demo-reel-header pa-6 position-relative">
      <div class="d-flex align-center mb-2" v-if="skill.type">
        <ItemSlotBase size="22px" :padding="0" class="d-inline-flex mr-2">
          <FactionIconWidget :name="skill.type" size="22px"></FactionIconWidget>
        </ItemSlotBase>
        <span class="text-caption text-grey">{{ t(`snb.factions.${skill.type}.name`) }}</span>
      </div>

      <h2 class="font-weight-bold text-amber">
        <EmpireSkillName :id="props.id"></EmpireSkillName>
      </h2>
      <p class="text-caption text-grey mb-1">{{ props.id }}</p>

      <div class="mt-2 text-caption opacity-70" v-if="skill.stage">
        {{ t('empireSkillSimulation.stage', {num: skill.stage}) }}
      </div>
    </div>

    <div class="demo-reel-content background-flavor overflow-auto pa-6">
      <template v-if="isShowDescription">
        <div class="mb-4 description">
          <EmpireSkillDescription :id="props.id" />
        </div>
      </template>

      <v-divider v-if="isShowOpenDetail" class="my-4"></v-divider>

      <v-card-actions class="pa-0" v-if="isShowOpenDetail">
        <BtnWidget @action-complete="router.push(`/codex/empireSkill/${props.id}`)">
          {{ t('codex.empireSkills.lookDetail') }}
        </BtnWidget>
      </v-card-actions>
    </div>
  </v-card>
</template>

<style scoped lang="less">
@import "@/assets/styles/demo-reel";
</style>
