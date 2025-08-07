<script setup lang="ts">

import AssemblyClassificationShowList from "@/components/AssemblyClassificationShowList.vue";
import {ref} from "vue";

let value = ref('')
</script>

<template>
  <v-container class="mt-10">
    <div style="width: 1200px">
<!--      sortBy="rarity"-->
<!--      filterType="culverin"-->

      {{value}}

      <AssemblyClassificationShowList
          v-model="value"
          :tags="['culverin', 'demicannon', 'bombard', 'longGun', 'torpedo','ballista']">
      </AssemblyClassificationShowList>
    </div>
  </v-container>
</template>

<style scoped lang="less">

</style>
