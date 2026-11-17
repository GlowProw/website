<script setup lang="ts">
import EmptyView from "../EmptyView.vue";
import {useI18n} from "vue-i18n";
import {onUnmounted, ref, watch} from "vue";
import {useRoute} from "vue-router";
import PerksName from "./perksName.vue";
import PerkDescription from "@/components/snbWidget/perksDescription.vue";
import PerkIcon from "@/components/snbWidget/perkIcon.vue";
import {resolvePerkKeys} from "@/assets/sripts/perk_resolver";
import {useAppStore} from "~/stores/appStore";
import {useI18nReadName} from "@/assets/sripts/i18n_read_name";

const {locale} = useI18n(),
    appStore = useAppStore(),
    route = useRoute(),
    props = withDefaults(defineProps<{ data: any }>(), {
      data: null
    }),
    {perk} = useI18nReadName(),
    unwatch = watch(
        () => locale.value,
        async () => {
        },
        {immediate: true}
    )

/**
 * 校验指定词条是否存在有效标题或图标
 * 若两者皆空则隐藏整个黑色标题行
 *
 * @param perkId 词条标识
 */
const hasPerkHeader = (perkId: string): boolean => {
  const iconKeys = resolvePerkKeys(perkId);
  if (iconKeys && iconKeys.length > 0) {
    return true;
  }
  const name = perk(perkId).name();
  return !!(name && name.trim());
};

/**
 * 校验词条标题文本是否非空
 *
 * @param perkId 词条标识
 */
const hasPerkName = (perkId: string): boolean => {
  const name = perk(perkId).name();
  return !!(name && name.trim());
};

onUnmounted(() => unwatch())

defineOptions({
  name: "PerksWidget"
})
</script>

<template>
  <!-- 词条展示容器 S -->
  <v-card class="bg-translate" variant="text" border>
    <template v-if="props.data.perks && props.data.perks.length > 0">
      <div v-for="(p, pIndex) in props.data.perks" :key="pIndex" class="mb-3">
        <!-- 词条标题 S -->
        <v-row
            v-if="hasPerkHeader(p)"
            no-gutters
            style="width: calc(100% + 18px * 2);margin: 0 0 0 -20px"
            class="bg-black title-long-flavor py-2 pl-10">
          <template v-for="iconKey in resolvePerkKeys(p)" :key="iconKey">
            <v-col cols="auto" class="mr-2">
              <PerkIcon :id="iconKey" :size="25" :isBorder="false"></PerkIcon>
            </v-col>
          </template>
          <v-col cols="auto" v-if="hasPerkName(p)">
            <v-row no-gutters class="d-flex text-pre-wrap font-weight-bold align-center">
              <v-col>
                <b class="text-amber">
                  <PerksName :id="p"></PerksName>
                </b>
                <template v-if="appStore.isDebug">
                  - {{ p }}
                </template>
              </v-col>
              <v-col cols="auto">
                <v-icon icon="mdi-identifier" v-tooltip="p"></v-icon>
              </v-col>
            </v-row>
          </v-col>
        </v-row>
        <!-- 词条标题 E -->

        <!-- 词条描述 S -->
        <PerkDescription :data="data" :id="p"></PerkDescription>
        <!-- 词条描述 E -->
      </div>
    </template>
    <template v-else>
      <EmptyView></EmptyView>
    </template>
  </v-card>
  <!-- 词条展示容器 E -->
</template>

<style scoped lang="less">

</style>
