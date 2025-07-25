<script setup lang="ts">
import {useI18n} from "vue-i18n";
import I18nWidget from "./i18nWidget.vue";

const {t} = useI18n()
</script>

<template>
  <div class="background-flavor footer">
    <v-divider class="ma-0"></v-divider>
    <v-container class="pt-0">
      <footer class="mt-10 mb-10">
        <v-row>
          <v-col cols="12" sm="12" md="5" lg="5">
            <b class="btn-flavor mb-5">{{ t('name') }}</b>
            <p>{{ t('footer.basic.description') }}</p>
          </v-col>
          <v-col cols="12" sm="12" md="7" lg="7">
            <v-row>
              <v-col cols="12" sm="12" md="6" lg="3">
                <b>服务</b>
                <ul>
                  <li>组队寻求</li>
                </ul>
              </v-col>
              <v-col cols="12" sm="12" md="6" lg="3">
                <b>社区</b>
                <ul>
                  <li>碧海黑帆吧</li>
                </ul>
              </v-col>
              <v-col cols="12" sm="12" md="6" lg="3">
                <b>联系</b>
                <ul>
                  <li><a href="/about">关于</a></li>
                  <li><a href="#">帮助我们翻译</a></li>
                </ul>
              </v-col>
              <v-col cols="12" sm="12" md="6" lg="3">
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
  background-color: #0e0e0e;
}
</style>
