<script setup lang="ts">

import EmptyView from "../EmptyView.vue";
import {useI18n} from "vue-i18n";
import {onUnmounted, ref, watch} from "vue";
import {useRoute} from "vue-router";
import PerksName from "./perksName.vue";
import PerkDescription from "@/components/snbWidget/perksDescription.vue";

const {locale} = useI18n(),
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

let perksNameRef = ref(null)

onUnmounted(() => unwatch())

defineOptions({
  name: "PerksWidget"
})
</script>

<template>
  <v-card class="bg-translate" variant="text" border>
    <template v-if="props.data.perks && props.data.perks.length > 0">
      <div v-for="(p, pIndex) in props.data.perks" :key="pIndex" class="mb-3">
        <!-- 词条标题 S -->
        <v-row no-gutters
               style="width: calc(100% + 18px * 2);margin: 0 0 0 -20px"
               class="bg-black title-long-flavor py-2 pl-10 "
               v-show="perksNameRef && !perksNameRef[pIndex].isTitleEmpty">
          <v-col cols="11">
            <v-row no-gutters class="d-flex text-pre-wrap font-weight-bold">
              <v-col>
                <b class="text-amber">
                  <PerksName ref="perksNameRef" :id="p"></PerksName>
                </b>
                <template v-if="route.query.debug">
                  - {{ p }}
                </template>
              </v-col>
              <v-col cols="auto">
                <v-icon icon="mdi-identifier" v-tooltip="p"></v-icon>
              </v-col>
            </v-row>
          </v-col>
          <v-spacer></v-spacer>
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
</template>

<style scoped lang="less">

</style>
