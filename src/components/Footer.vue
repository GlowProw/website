<script setup lang="ts">
import {useI18n} from "vue-i18n";
import I18nWidget from "./i18nWidget.vue";
import ServiceProviderWidget from "@/components/ServiceProviderWidget.vue";
import {appFuns, appNavs} from "@/assets/sripts/index";
import Logo from "@/components/Logo.vue";
import HtmlLink from "@/components/HtmlLink.vue";

const {t} = useI18n()
</script>

<template>
  <div class="footer">
    <v-skeleton-loader type="image" height="2px" :color="`var(--main-color)`" class="opacity-10 overflow-hidden"></v-skeleton-loader>
    <v-container class="pt-0">
      <footer class="mt-10 mb-10">
        <v-row>
          <v-col cols="12" sm="12" md="5" lg="3" order="2" order-sm="2" order-lg="1">
            <Logo size="50" class="ml-n2 mb-2"></Logo>
            <h2>
              {{ t('name') }}
            </h2>
            <p class="mb-3 opacity-80">{{ t('footer.basic.description') }}</p>
            <p class="opacity-60">@2025-{{ new Date().getFullYear() }} {{ t('name') }}</p>
          </v-col>
          <v-col cols="12" sm="12" md="7" lg="9" order="1" order-sm="1" order-lg="2">
            <v-row>
              <v-col cols="12" sm="6" md="6" lg="3">
                <b class="text-amber">{{ t('footer.col1.title') }}</b>
                <ul>
                  <li v-for="(fun, funIndex) in appFuns.list" :key="funIndex" :class="{'opacity-40':!fun.to }">
                    <HtmlLink
                        :is-icon="false"
                        :is-iframe-show="false"
                        :href="fun.to" target="_blank">
                      {{ t(fun.title) }}
                    </HtmlLink>
                  </li>
                  <v-divider class="my-3"></v-divider>
                  <li>
                    <HtmlLink
                        :is-icon="false"
                        :is-iframe-show="false"
                        href="/search" target="_blank">
                      {{ t('search.title') }}
                    </HtmlLink>
                  </li>
                </ul>
              </v-col>
              <v-col cols="12" sm="6" md="6" lg="3">
                <b class="text-amber">{{ t('footer.col2.title') }}</b>

                <ul>
                  <li>
                    <HtmlLink
                        :is-iframe-show="false"
                        target="_blank" href="https://kook.vip/2s0eQP">
                      {{ t('footer.col2.kook') }}
                    </HtmlLink>
                  </li>
                  <li>
                    <HtmlLink
                        :is-iframe-show="false"
                        href="https://tieba.baidu.com/p/9886565445" target="_blank">
                      {{ t('footer.col2.baiduTieBa') }}
                    </HtmlLink>
                  </li>
                  <li>
                    <HtmlLink
                        :is-iframe-show="false"
                        href="https://www.xiaoheihe.cn/app/bbs/link/160752071" target="_blank">
                      {{ t('footer.col2.xiaoheihe') }}
                    </HtmlLink>
                  </li>
                </ul>

                <v-divider class="my-3"></v-divider>

                <ul>
                  <li
                      class="hidden-sm hidden-xs"
                      v-for="(nav, navIndex) in appNavs.list" :key="navIndex">
                    <HtmlLink
                        :is-iframe-show="false"
                        :href="nav.href"
                        target="_blank">
                      {{ t(nav.title) }}
                    </HtmlLink>
                  </li>
                </ul>
              </v-col>
              <v-col cols="12" sm="6" md="6" lg="3">
                <b class="text-amber">{{ t('footer.col3.title') }}</b>
                <ul>
                  <li>
                    <HtmlLink
                        :is-icon="false"
                        :is-iframe-show="false"
                        href="/about" target="_blank">
                      {{ t('about.title') }}
                    </HtmlLink>
                  </li>
                  <li>
                    <HtmlLink
                        :is-icon="false"
                        :is-iframe-show="false"
                        href="https://status.glow-prow.org.cn" target="_blank">
                      {{ t('footer.col3.serviceStatus') }}
                    </HtmlLink>
                  </li>
                  <li>
                    <HtmlLink
                        :is-icon="false"
                        :is-iframe-show="false"
                        href="https://zh.crowdin.com/project/glow-prow" target="_blank">
                      {{ t('footer.col3.translated') }}
                    </HtmlLink>
                  </li>
                  <li>
                    <HtmlLink
                        :is-icon="false"
                        :is-iframe-show="false"
                        href="https://github.com/GlowProw" target="_blank">
                      {{ t('footer.col3.github') }}
                    </HtmlLink>
                  </li>

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
    <v-divider></v-divider>
    <v-container class="pt-5 pb-5">
      <v-row no-gutters align="center">
        <v-col>
          <ServiceProviderWidget></ServiceProviderWidget>
        </v-col>
        <v-col cols="12" lg="auto" class="d-flex ga-2 align-center mt-sm-2 mt-md-2">
          <img src="@/assets/images/logos/betterstack.svg" width="26px" height="30px"/>
          <iframe src="https://status.glow-prow.org.cn/badge?theme=dark"
                  width="190"
                  allow="fullscreen"
                  height="30" frameborder="0" scrolling="no" style="color-scheme: normal"></iframe>
        </v-col>
      </v-row>
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

    li {
      margin-bottom: 5px;
    }
  }
}
</style>
