<script setup lang="ts">

import Footer from "@/components/Footer.vue";
import {useI18n} from "vue-i18n";
import Header from "@/components/Header.vue";
import I18nMembersWidget from "@/components/i18nMembersWidget.vue";

const {t} = useI18n()
</script>

<template>
  <v-app class="background-flavor mt-10 about">
    <Header></Header>
    <div class="background-img-flavor">
      <v-container class="pt-10 pb-10">
        <h1 class="btn-flavor">关于</h1>
      </v-container>
    </div>
    <v-divider></v-divider>
    <div class="fill-height bg-black">
      <v-container>
        <v-row class="mb-5">
          <v-col cols="12" class="mb-5">
            <p>这个应用程序遵循MIT开源协议，程序不隶属于碧海黑帆以及ubisoft集团。</p>
            <p class="mt-5">闪光船首的命名蕴意作为船头点亮前方迷雾，为社区玩家提供服务，永恒指引前方</p>
            <p>同时感谢@SkullAndBonesTools/SkullAndBonesData项目提供了数据源，这使得Glow Prow能开发此项目</p>
          </v-col>
          <v-col cols="12" sm="12" md="6" lg="4">
            <h3 class="btn-flavor">作者</h3>
            <ul>
              <li>@Cabbagelol</li>
            </ul>
          </v-col>
          <v-col cols="12" sm="12" md="6" lg="4">
            <h3 class="btn-flavor">翻译成员</h3>
            <p class="opacity-80 mb-3">表彰杰出翻译成员，感谢为程序进行翻译工作成员</p>
            <I18nMembersWidget :size="40"></I18nMembersWidget>
          </v-col>
          <v-col cols="12" sm="12" md="6" lg="4">
            <h3 class="btn-flavor">开源</h3>
            <ul>
              <li>闪耀船首主程序，包含前端程序/后端程序，遵循MIT协议</li>
              <li>闪耀船首数据，碧海黑帆物品/日历等数据，遵循MIT协议</li>
              <li>闪耀船首资源，碧海黑帆图片材料资源，遵循MIT协议</li>
              <li>闪耀船首翻译数据</li>
            </ul>
          </v-col>
          <v-col cols="12" sm="12" md="6" lg="4">
            <h3 class="btn-flavor">联系</h3>
            <p class="opacity-80 mb-2">通过下方可供联系方式找到我(不需广告/SEO需求)</p>
            <ul>
              <li>qwqpwp@qq.com</li>
              <li>nickmiku@gmail.net</li>
              <li>https://cabbagelol.net</li>
            </ul>
          </v-col>
        </v-row>

        <v-divider></v-divider>

        <h3 class="btn-flavor">其他项目</h3>
        <ul>
          <li><a target="_blank" href="https://bfban-app.cabbagelol.net/">BFBAN APP应用</a></li>
          <li><a target="_blank" href="https://hll-gun-calc.app-document.cabbagelol.net/">人间地狱火炮计算器</a></li>
          <li><a target="_blank" href="https://rank.bfvrobot.net">战地风云社区天梯</a></li>
          <li><a target="_blank" href="https://fremnant-2-dlc-origin-bow.cabbagelol.net">遗迹2起源弓解密计算器</a></li>
        </ul>
      </v-container>
    </div>
    <Footer></Footer>
  </v-app>
</template>

<style scoped lang="less">
.about {
  h1 {
    font-size: 3rem;
    margin: 20px 0;
    padding: 20px 20px;
  }

  h3 {
    margin: 20px 0;
    font-size: 2rem;
  }

  ul {
    margin-left: 30px;
  }
}
</style>
