<script setup lang="ts">
import {useIconGlobalStyle} from "@/assets/sripts/use_icon_global_style";
import {EmpireSkills} from "glow-prow-data";
import {computed} from "vue";
import {useAppStore} from "~/stores/appStore";
import EmpireSkillCardDetail from "@/components/snbWidget/empireSkillCardDetail.vue";
import ItemCardTooltip from "@/components/snbWidget/itemCardTooltip.vue";
import FactionIconWidget from "@/components/snbWidget/factionIconWidget.vue";

const props = withDefaults(defineProps<{
      id: string,
      skillKey?: string,
      isShowOpenDetail?: boolean,
      isOpenDetail?: boolean,
      isOpenNewWindow?: boolean,
      isShowTooltip?: boolean,
      margin?: number,
      padding?: number
    }>(), {
      skillKey: '',
      isShowOpenDetail: true,
      isOpenDetail: true,
      isOpenNewWindow: false,
      isShowTooltip: true,
      margin: 1,
      padding: 1
    }),
    appStore = useAppStore(),
    skillsMap = EmpireSkills;

/**
 * 技能唯一键，同一技能在不同阵营共享同一 id，需要按键定位
 */
const skillKey = computed(() => {
  if (props.skillKey && skillsMap[props.skillKey]) return props.skillKey
  if (skillsMap[props.id]) return props.id
  const matched = Object.entries(skillsMap).find(([, item]) => item.id === props.id)
  return matched ? matched[0] : props.id
});

let skill = computed(() => skillsMap[skillKey.value] || null),
    isOpenNewWindow = computed({
      get: () => appStore.itemOpenNewWindow || props.isOpenNewWindow,
      set: (value) => appStore.toggleItemOpenNewWindow(value)
    });

defineOptions({
  name: "EmpireSkillIconWidget"
});

const {useIconImagePadding, useIconImageMargin} = useIconGlobalStyle();
const computedPadding = useIconImagePadding(props.padding);
const computedMargin = useIconImageMargin(props.margin);
</script>

<template>
  <ItemCardTooltip
      v-if="skill"
      :disabled="!props.isShowTooltip">
    <template v-slot:activator="{ props: activatorProps }">
      <v-card
          v-bind="activatorProps"
          :to="isOpenDetail ? `/codex/empireSkill/${skillKey}` : ''"
          :target="isOpenNewWindow ? '_blank' : '_self'"
          width="100%"
          :class="[
              'prohibit-drag',
              'd-flex align-center justify-center',
              `ma-${computedMargin}`,
              `pa-${computedPadding}`,
          ]">
        <div class="d-flex align-center justify-center w-100 h-100 overflow-hidden">
          <FactionIconWidget v-if="skill.type" :name="skill.type" />
          <v-icon v-else color="amber" class="w-100 h-100">mdi-school</v-icon>
        </div>
      </v-card>
    </template>
    <EmpireSkillCardDetail
        :id="skillKey"
        :is-show-open-detail="props.isShowOpenDetail"
    />
  </ItemCardTooltip>
</template>

<style scoped lang="less">
@import "@/assets/styles/demo-reel";
</style>
