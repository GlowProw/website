<script setup lang="ts">
import EmptyView from "../EmptyView.vue";
import {useI18n} from "vue-i18n";
import {onUnmounted, ref, watch} from "vue";
import {useRoute} from "vue-router";
import PerksName from "./perksName.vue";
import PerkDescription from "@/components/snbWidget/perksDescription.vue";
import PerkIcon from "@/components/snbWidget/perkIcon.vue";
import {resolvePerkKeys} from "@/components/snbWidget/perkResolver";
import {useAppStore} from "~/stores/appStore";

const {locale} = useI18n(),
    appStore = useAppStore(),
    route = useRoute(),
    props = withDefaults(defineProps<{ data: any }>(), {
      data: null
    }),
    unwatch = watch(
        () => locale.value,
        async () => {
        },
        {immediate: true}
    )

// 引用词条名称组件实例列表
let perksNameRef = ref(null)

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
            no-gutters
            style="width: calc(100% + 18px * 2);margin: 0 0 0 -20px"
            class="bg-black title-long-flavor py-2 pl-10">
          <template v-for="iconKey in resolvePerkKeys(p)" :key="iconKey">
            <v-col cols="auto" class="mr-2">
              <PerkIcon :id="iconKey" :size="25" :isBorder="false"></PerkIcon>
            </v-col>
          </template>
          <v-col cols="auto" v-show="perksNameRef && !perksNameRef[pIndex].isTitleEmpty">
            <v-row no-gutters class="d-flex text-pre-wrap font-weight-bold align-center">
              <v-col>
                <b class="text-amber">
                  <PerksName ref="perksNameRef" :id="p"></PerksName>
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
