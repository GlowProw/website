<script setup lang="ts">
import {computed} from "vue";
import ItemSlotBase from "@/components/snbWidget/ItemSlotBase.vue";
import ShipIconWidget from "@/components/snbWidget/shipIconWidget.vue";
import ShipName from "@/components/snbWidget/shipName.vue";
import {Ships} from "glow-prow-data";
import {Ship} from "glow-prow-data/src/entity/Ships.ts";
import {useI18nUtils} from "@/assets/sripts/i18n_util";

const props = defineProps<{ id: string }>(),
    {sanitizeString} = useI18nUtils(),
    ships = computed(() => Object.values(Ships)
        .filter((i: Ship) => i.id.indexOf(sanitizeString(props.id).cleaned.replaceAll('Upgrade', '')) >= 0)
    )
</script>

<template>
  <div class="mb-10">
    <slot></slot>
  </div>
  <v-row class="ga-6 mb-2" justify="center">
    <v-card v-for="(i, index) in ships" :key="index" class="bg-transparent" width="80">
      <ItemSlotBase size="80px">
        <ShipIconWidget :id="i.id"></ShipIconWidget>
      </ItemSlotBase>
      <div class="mt-1 text-center">
        <ShipName :id="i.id"></ShipName>
      </div>
    </v-card>
  </v-row>
</template>

<style scoped lang="less">

</style>
