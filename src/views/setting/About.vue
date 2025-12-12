<script setup lang="ts">

import {useI18n} from "vue-i18n";
import I18nMembersWidget from "@/components/i18nMembersWidget.vue";
import AffixBoxHasTitleView from "@/components/AffixBoxHasTitleView.vue";
import HtmlLink from "@/components/HtmlLink.vue";

const {t} = useI18n()
</script>

<template>
  <v-row>
    <v-col cols="12" lg="8">
      <AffixBoxHasTitleView>
        <p>闪耀船首程序以及附属遵循不同协议，主程序以及附属不隶属于碧海黑帆或Ubisoft集团。</p>
        <pre class="mt-5 opacity-60" style="text-wrap: auto">
在无尽的游戏海洋中，每位玩家都是一位独自航行的冒险者。前方是未知的迷雾，身后是探索的轨迹。

闪光船首诞生于此 ——————
它不仅是船头的装饰，更是穿透迷雾的光芒。当您迷茫时，它是照亮前路的灯塔；当您困惑时，它是解读谜题的智慧。

我们相信，每一款游戏都是一个等待探索的世界，每一位玩家都值得最清晰的指引。闪光船首汇聚社区智慧，提炼实用工具，化作永恒星光，陪伴您的每一次航行。
从最初的微光到如今的明灯，我们始终坚守一个信念：为航海者服务，为探索者引路。

加入我们，让您的游戏之旅不再孤单。闪光船首，永远在前方闪光。
        </pre>
        <p>同时感谢 <u>@SkullAndBonesTools/SkullAndBonesData</u> 项目提供原始数据源，这使得闪耀船首得以开发</p>
        <template v-slot:title>
          关于
        </template>
      </AffixBoxHasTitleView>
    </v-col>
    <v-col cols="12" lg="4">
      <AffixBoxHasTitleView>
        <p class="mb-5">为开源贡献🎉，热爱发电</p>

        <ol class="open-source-list">
          <li>
            闪耀船首主程序，包含前端程序/后端程序，遵循MIT协议
            <div class="text-caption opacity-60">
              <p>
                <HtmlLink href="https://github.com/GlowProw/website"></HtmlLink>
              </p>
              <p>
                <HtmlLink href="https://github.com/GlowProw/website?tab=MIT-1-ov-file"></HtmlLink>
              </p>
            </div>
          </li>
          <li>
            闪耀船首数据，碧海黑帆物品/日历等数据，遵循AGPL-3.0协议
            <div class="text-caption opacity-60">
              <p class="w-100 ">
                <HtmlLink href="https://github.com/GlowProw/glow-prow-data-languages"></HtmlLink>
              </p>
              <p class="w-100 ">
                <HtmlLink href="https://github.com/GlowProw/glow-prow-data?tab=AGPL-3.0-1-ov-file"></HtmlLink>
              </p>
            </div>
          </li>
          <li>
            闪耀船首资源，碧海黑帆图片材料资源，遵循AGPL-3.0协议
            <div class="text-caption opacity-60">
              <p class="w-100 ">
                <HtmlLink href="https://github.com/GlowProw/glow-prow-data-assets"></HtmlLink>
              </p>
              <p class="w-100 ">
                <HtmlLink href="https://github.com/GlowProw/glow-prow-assets?tab=AGPL-3.0-1-ov-file"></HtmlLink>
              </p>
            </div>
          </li>
          <li>
            闪耀船首翻译数据，遵循AGPL-3.0协议
            <div class="text-caption opacity-60">
              <p class="w-100 ">
                <HtmlLink href="https://github.com/GlowProw/glow-prow-data-languages"></HtmlLink>
              </p>
              <p class="w-100 ">
                <HtmlLink href="https://github.com/GlowProw/glow-prow-data-languages?tab=AGPL-3.0-1-ov-file"></HtmlLink>
              </p>
            </div>
          </li>
        </ol>
        <template v-slot:title>
          开源
        </template>
      </AffixBoxHasTitleView>
    </v-col>
    <v-col cols="12" lg="4">
      <AffixBoxHasTitleView>
        <p class="opacity-80 mb-3">特此表彰那些无偿参与程序开发的成员, 作为基石开拓先锋</p>

        <ul>
          <li>@Cabbagelol</li>
        </ul>
        <template v-slot:title>
          开发者
        </template>
      </AffixBoxHasTitleView>
    </v-col>
    <v-col cols="12" lg="4">
      <AffixBoxHasTitleView>
        <p class="opacity-80 mb-3">表彰杰出翻译成员，感谢为程序进行翻译工作成员</p>
        <I18nMembersWidget :size="40"></I18nMembersWidget>
        <template v-slot:title>
          翻译成员
        </template>
      </AffixBoxHasTitleView>
    </v-col>
    <v-col cols="12" lg="4">
      <AffixBoxHasTitleView>
        <ul>
          <li>nickmiku+glowprow@gmail.com</li>
          <li>
            <HtmlLink href="https://cabbagelol.net"></HtmlLink>
          </li>
        </ul>
        <template v-slot:title>
          联系
        </template>
      </AffixBoxHasTitleView>
    </v-col>
  </v-row>
</template>

<style scoped lang="less">
* {
  h1 {
    font-size: 3rem;
    margin: 20px 0;
    padding: 20px 20px;
  }

  h3 {
    margin: 20px 0;
    font-size: 2rem;
  }

  ul, ol {
    margin-left: 30px;

    li {
      margin-bottom: 20px;
    }
  }
}
</style>
