<script setup lang="ts">

import AdViewListWidget from "@/components/ads/AdViewListWidget.vue";
import AdManageBtn from "@/components/ads/AdManageBtn.vue";
import AffixBoxHasTitleView from "@/components/AffixBoxHasTitleView.vue";
</script>

<template>
  <v-row>
    <v-col cols="4">
      <AffixBoxHasTitleView>
        <p class="text-caption">网站为热爱发电，我们向玩家提供公益服务，并开源项目；为了持续性提供服务，需要玩家们对投入广告进行触发</p>

        <ul>
          <li>
            <p class="text-caption mt-3">当然我们提供广告管理以及一键关闭功能，减少网站阅读困难</p>
          </li>
          <li>
            <p class="text-caption mt-3">广告使用第三方，你可以前往第三方广告管理cookie隐私问题</p>
          </li>
        </ul>

        <v-row align="center" class="mt-2" no-gutters>
          <v-col>
            总开关
          </v-col>
          <v-col cols="auto">
            <AdManageBtn></AdManageBtn>
          </v-col>
        </v-row>
        <template v-slot:title>
          广告
        </template>
      </AffixBoxHasTitleView>
    </v-col>
    <v-col>
      <AffixBoxHasTitleView>
        <AdViewListWidget></AdViewListWidget>

        <template v-slot:title>
          排除列表
        </template>
      </AffixBoxHasTitleView>
    </v-col>
  </v-row>
</template>

<style scoped lang="less">

</style>
