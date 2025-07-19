<script setup lang="ts">
import {useI18n} from "vue-i18n";

const {t} = useI18n()
</script>

<template>
  <div class="background-flavor">
    <v-container class="">
      <v-divider class="ma-0"></v-divider>
      <footer class="mt-10">
        <v-row>
          <v-col cols="12" sm="12" md="6" lg="6">
            <b class="btn-flavor mb-5">{{ t('name') }}</b>
            <p>为碧海黑帆提供社区服务，公益提供</p>
          </v-col>
          <v-col cols="12" sm="12" md="6" lg="6">
            <v-row>
              <v-col cols="12" sm="12" md="6" lg="4">
                <b>服务</b>
                <ul>
                  <li>组队寻求</li>
                </ul>
              </v-col>
              <v-col cols="12" sm="12" md="6" lg="4">
                <b>社区</b>
                <ul>
                  <li>碧海黑帆吧</li>
                </ul>
              </v-col>
              <v-col cols="12" sm="12" md="6" lg="4">
                <b>联系</b>
                <ul>
                  <li><a href="/about">关于</a></li>
                  <li><a href="#">帮助我们翻译</a></li>
                </ul>
              </v-col>
            </v-row>
          </v-col>
        </v-row>
      </footer>
    </v-container>
  </div>
</template>

<style scoped>

</style>
