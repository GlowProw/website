<script setup lang="ts">
import {use_icon_global_Style} from "@/assets/sripts/use_icon_global_Style";
import {EmpireSkills} from "glow-prow-data";
import {computed, onMounted, ref, watch} from "vue";
import {useAppStore} from "~/stores/appStore";
import {useTooltipFollow} from "@/assets/sripts/use_tooltip_follow";
import {useCDNAssetsServiceStore} from "~/stores/cdnAssetsStore";
import EmpireSkillCardDetail from "@/components/snbWidget/empireSkillCardDetail.vue";
import FactionIconWidget from "@/components/snbWidget/factionIconWidget.vue";

const props = withDefaults(defineProps<{
      id: string,
      isShowOpenDetail?: boolean,
      isOpenDetail?: boolean,
      isOpenNewWindow?: boolean,
      isShowTooltip?: boolean,
      margin?: number,
      padding?: number
    }>(), {
      isShowOpenDetail: true,
      isOpenDetail: true,
      isOpenNewWindow: false,
      isShowTooltip: true,
      margin: 1,
      padding: 1
    }),
    {currentService: currentImageService} = useCDNAssetsServiceStore(),
    appStore = useAppStore(),
    {tooltipPos, onMouseMove, onMouseEnter} = useTooltipFollow(),
    skillsMap = EmpireSkills;

let iconSrc = ref(''),
    imgError = ref(false),
    skill = computed(() => skillsMap[props.id] || null),
    isOpenNewWindow = computed({
      get: () => appStore.itemOpenNewWindow || props.isOpenNewWindow,
      set: (value) => appStore.toggleItemOpenNewWindow(value)
    });

watch(() => props.id, () => {
  onReady();
});

onMounted(() => {
  onReady();
});

const onReady = async () => {
  imgError.value = false;
  iconSrc.value = currentImageService.url({
    'glow-prow': {
      id: props.id,
      category: 'empireSkills'
    },
    'glow-prow-zh-cn': {
      id: props.id,
      category: 'empireSkills'
    },
    'local-test': {
      id: props.id,
      category: 'empireSkills'
    }
  });
};

defineOptions({
  name: "EmpireSkillIconWidget"
});

const {useIconImagePadding, useIconImageMargin} = use_icon_global_Style();
const computedPadding = useIconImagePadding(props.padding);
const computedMargin = useIconImageMargin(props.margin);
</script>

<template>
  <v-tooltip
      v-if="skill"
      :disabled="!props.isShowTooltip"
      min-width="450"
      max-width="450"
      interactive
      :offset="[30, 10]"
      location="right top"
      content-class="pa-0 bg-transparent"
      :target="[tooltipPos.x, tooltipPos.y]">
    <template v-slot:activator="{ props: activatorProps }">
      <v-card
          @mousemove="onMouseMove"
          @mouseenter="onMouseEnter"
          v-bind="activatorProps"
          :to="isOpenDetail ? `/codex/empireSkill/${id}` : ''"
          :target="isOpenNewWindow ? '_blank' : '_self'"
          width="100%"
          height="100%"
          :class="[
              'prohibit-drag',
              'd-flex align-center justify-center',
              `ma-${computedMargin}`,
              `pa-${computedPadding}`,
          ]">
        <v-img
            v-if="iconSrc && !imgError"
            :src="iconSrc"
            @error="imgError = true"
            class="pointer-events-none w-100 h-100"
            cover
        ></v-img>
        <div v-else-if="skill.type" class="w-100 h-100 d-flex align-center justify-center">
          <FactionIconWidget :name="skill.type" size="100%" />
        </div>
        <div v-else class="w-100 h-100 d-flex align-center justify-center">
          <v-icon size="36" color="amber">mdi-school</v-icon>
        </div>
      </v-card>
    </template>
    <EmpireSkillCardDetail
        :id="props.id"
        :is-show-open-detail="props.isShowOpenDetail"
    />
  </v-tooltip>
</template>

<style scoped lang="less">
@import "@/assets/styles/demo-reel";
</style>
