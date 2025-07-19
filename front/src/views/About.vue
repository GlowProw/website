<script setup lang="ts">

import Footer from "../components/Footer.vue";
import {useI18n} from "vue-i18n";

const {t} = useI18n()
</script>

<template>
  <v-app class="background-flavor mt-10 about">
    <div class="background-img-flavor fill-height">
      <v-container class="mt-10">
        <h1 class="btn-flavor">关于我</h1>
        <p>闪光船首的命名，是为社区提供便民服务，永远指引前方</p>
        <v-divider class="mt-5 mb-5"></v-divider>
        <v-row>
          <v-col sm="12" lg="4">
            <h3 class="btn-flavor">作者</h3>
            <ul>
              <li>@Cabbagelol</li>
            </ul>
          </v-col>
          <v-col sm="12" lg="4">
            <h3 class="btn-flavor">翻译成员</h3>
            <ul>
              <li>@Cabbagelol</li>
            </ul>
          </v-col>
          <v-col sm="12" lg="4">
            <h3 class="btn-flavor">来源协议</h3>
            <ul>
              <li>闪耀船首主程序，包含前端程序/后端程序，遵循MIT协议</li>
              <li>闪耀船首数据，碧海黑帆物品/日历等数据，遵循MIT协议</li>
              <li>闪耀船首翻译数据</li>
            </ul>
          </v-col>
        </v-row>

        <h3 class="btn-flavor">其他项目</h3>
        <ul>
          <li><a target="_blank" href="https://bfban-app.cabbagelol.net/">BFBAN APP应用</a></li>
          <li><a target="_blank" href="https://hll-gun-calc.app-document.cabbagelol.net/">人间地狱火炮计算器</a></li>
          <li><a target="_blank" href="https://rank.bfvrobot.net">战地风云社区天梯</a></li>
          <li><a target="_blank" href="https://fremnant-2-dlc-origin-bow.cabbagelol.net">遗迹2起源弓解密计算器</a></li>
        </ul>
      </v-container>
    </div>
  </v-app>
  <Footer></Footer>
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
