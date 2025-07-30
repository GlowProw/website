<script setup lang="ts">
import {useI18n} from "vue-i18n";
import I18nWidget from "./i18nWidget.vue";

const {t} = useI18n()
</script>

<template>
  <div class="footer">
    <v-skeleton-loader type="image" height="2px" :color="`var(--main-color)`" class="opacity-10 overflow-hidden"></v-skeleton-loader>
    <v-container class="pt-0">
      <footer class="mt-10 mb-10">
        <v-row>
          <v-col cols="12" sm="12" md="5" lg="4" order="2" order-sm="2" order-lg="1">
            <h2 class="mb-5">{{ t('name') }}</h2>
            <p class="mt-2 opacity-80">{{ t('footer.basic.description') }}</p>
            <p class="opacity-60">@2025-{{new Date().getFullYear()}} Glow Prow</p>
          </v-col>
          <v-col cols="12" sm="12" md="7" lg="8" order="1" order-sm="1" order-lg="2">
            <v-row>
              <v-col cols="12" sm="6" md="6" lg="3">
                <b class="text-amber">服务</b>
                <ul>
                  <li><router-link to="/team">组队寻求</router-link> </li>
                  <li><router-link to="/calendar">日历</router-link></li>
                  <li><router-link to="/display-cabinet">展示馆</router-link></li>
                  <li><router-link to="/assembly">配装厂</router-link></li>
                  <li><router-link to="/maps">地图</router-link></li>
                </ul>
              </v-col>
              <v-col cols="12" sm="6" md="6" lg="3">
                <b class="text-amber">社区</b>
                <ul>
                  <li>碧海黑帆吧</li>
                </ul>
              </v-col>
              <v-col cols="12" sm="6" md="6" lg="3">
                <b class="text-amber">联系</b>
                <ul>
                  <li><a href="/about">关于</a></li>
                  <li><a href="#">帮助我们翻译</a></li>
                </ul>
              </v-col>
              <v-col cols="12" sm="6" md="6" lg="3">
                <I18nWidget/>
              </v-col>
            </v-row>
          </v-col>
        </v-row>
      </footer>
    </v-container>
  </div>
</template>

<style scoped>
.footer {
  background-color: hsl(from var(--main-color) h s calc(l * 0.03));

  b {
    font-size: 20px;
  }

  ul {
    margin-top: 15px;
    list-style-type: none;
    font-size: 14px;
  }
}
</style>
