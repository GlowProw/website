<script setup lang="ts">
import {Item, Items, Material} from "glow-prow-data";
import {computed} from "vue";
import ItemIconWidget from "@/components/snbWidget/itemIconWidget.vue";
import ItemSlotBase from "@/components/snbWidget/ItemSlotBase.vue";
import ItemName from "@/components/snbWidget/itemName.vue";
import ItemMaterials from "@/components/snbWidget/itemMaterials.vue";
import {useNoticeStore} from "~/stores/noticeStore";
import {useI18n} from "vue-i18n";
import HorizontalScrollList from "@/components/HorizontalScrollList.vue";
import {useDisplay} from "vuetify/framework";
import PerksWidget from "@/components/snbWidget/perksWidget.vue";

const props = defineProps<{ id: string }>(),
    notice = useNoticeStore(),
    {t} = useI18n(),
    {width, mobile} = useDisplay(),
    items = computed(() => Object.values(Items)
        .filter((i: Item) => i.type == 'shipUpgrade' && i.id.indexOf(props.id) >= 0)
        .reverse()
    )

let totalMaterials = computed(() => items.value.reduce((acc, item) => {
  const result = new Map<Material, number>();

  items.value.forEach(item => {
    if (item.required) {
      item.required.forEach((value, key) => {
        result.set(key, (result.get(key) || 0) + value);
      });
    }
  });

  return {
    required: result
  };
}, {} as Record<string, number>))

/**
 * 复制所有材料链接
 */
const copyToAllShipUpgradeMaterials = async () => {
  try {
    const nowUrl = new URL(window.location.href)
    const shareUrl = `${nowUrl.origin}${nowUrl.pathname}#total-materials`
    await navigator.clipboard.writeText(shareUrl)

    notice.success('ok')
  } catch (err) {
    console.error('复制失败:', err)
  }
}
</script>

<template>
  <div class="mb-10">
    <slot></slot>
  </div>
  <v-row class="ga-6 mb-2" justify="center">
    <HorizontalScrollList :is-indicator="false">
      <template v-for="(i, index) in items" :key="index">
        <v-card variant="text" :width="width / 3" min-width="400" max-width="800">
          <v-row>
            <v-col cols="2">
              <v-card class="bg-transparent" width="80">
                <ItemSlotBase size="80px">
                  <ItemIconWidget :id="i.id"></ItemIconWidget>
                </ItemSlotBase>
                <div class="mt-1 text-center">
                  <ItemName :id="i.id"></ItemName>
                </div>
              </v-card>
            </v-col>
            <v-col>
              <ItemMaterials :data="i" :isTitle="false" :isRawMaterials="false"></ItemMaterials>
            </v-col>
          </v-row>
        </v-card>
        <v-divider vertical></v-divider>
      </template>
    </HorizontalScrollList>
  </v-row>

  <v-row class="mb-2 mt-3" justify="center" id="total-materials">
    <v-col>
      <v-divider>
        <b>所有升级部件合计材料</b>
        <v-btn class="ml-2" icon density="compact" @click="copyToAllShipUpgradeMaterials">
          <v-icon size="15">mdi-share-variant-outline</v-icon>
        </v-btn>
      </v-divider>
    </v-col>
  </v-row>
  <v-row class="mb-2 mt-3" justify="center">
    <v-col>
      <ItemMaterials :data="totalMaterials" class="mt-n12" :isTitle="false"></ItemMaterials>
    </v-col>
  </v-row>
</template>

<style scoped lang="less">

</style>
