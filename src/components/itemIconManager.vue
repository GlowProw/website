<script setup lang="ts">
import {useI18n} from "vue-i18n";
import ItemSlotBase from "@/components/snbWidget/ItemSlotBase.vue";
import ItemIconWidget from "@/components/snbWidget/itemIconWidget.vue";
import {computed, onMounted, Ref, ref} from "vue";
import {useAppStore} from "~/stores/appStore";
import {Item, Items} from "glow-prow-data";
import ItemName from "@/components/snbWidget/itemName.vue";

const {t} = useI18n()
const appStore = useAppStore(),
    items = Items

interface sizeConfig {
  size: number | string
  box: {
    margin: number,
    padding: number,
  },
  icon: {
    margin: number,
    padding: number,
  },
}

let iconId = ref('culverin1'),
    sizes: Ref<any, sizeConfig[]> = ref([
      // {
      //   size: 30,
      //   box: {
      //     margin: 0,
      //     padding: 0,
      //   },
      //   icon: {
      //     margin: 0,
      //     padding: 0,
      //   },
      // },
      // {
      //   size: 40,
      //   box: {
      //     margin: 0,
      //     padding: 0,
      //   },
      //   icon: {
      //     margin: 0,
      //     padding: 0,
      //   },
      // },
      // {
      //   size: 45,
      //   box: {
      //     margin: 0,
      //     padding: 1,
      //   },
      //   icon: {
      //     margin: 0,
      //     padding: 0,
      //   },
      // },
      // {
      //   size: 48,
      //   box: {
      //     margin: 0,
      //     padding: 1,
      //   },
      //   icon: {
      //     margin: 0,
      //     padding: 0,
      //   },
      // },
      // <-- 过于小
      {
        size: 50,
        box: {
          margin: 0,
          padding: 1,
        },
        icon: {
          margin: 1,
          padding: 0,
        },
      },
      {
        size: 60,
        box: {
          margin: 0,
          padding: 1,
        },
        icon: {
          margin: 1,
          padding: 0,
        },
      },
      {
        size: 90,
        box: {
          margin: 0,
          padding: 1,
        },
        icon: {
          margin: 1,
          padding: 0,
        },
      },
      {
        size: 99,
        box: {
          margin: 1,
          padding: 1,
        },
        icon: {
          margin: 1,
          padding: 0,
        },
      },
      {
        size: 110,
        box: {
          margin: 1,
          padding: 1,
        },
        icon: {
          margin: 1,
          padding: 0,
        },
      },
      {
        size: 120,
        box: {
          margin: 1,
          padding: 1,
        },
        icon: {
          margin: 1,
          padding: 0,
        },
      },
      {
        size: 130,
        box: {
          margin: 1,
          padding: 1,
        },
        icon: {
          margin: 1,
          padding: 0,
        },
      },
      {
        size: 150,
        box: {
          margin: 1,
          padding: 1,
        },
        icon: {
          margin: 1,
          padding: 0,
        },
      }
    ]),
    getItemOnlyIds = computed(() => Object.values(items).map((i: Item) => i.id)),
    itemIsOpenNewWindow = ref(false)

const openNewWindow = computed({
  get: () => appStore.itemOpenNewWindow,
  set: (value) => appStore.toggleItemOpenNewWindow(value)
})

const getIconSize = computed({
  get: () => appStore.iconSize || sizes.value[2],
  set: (value) => appStore.setIconSize(value)
})

const getItemRaw = (item: any) => item.raw

onMounted(() => {
  itemIsOpenNewWindow.value = openNewWindow.value
})
</script>

<template>
  <v-card :variant="'text'">
    <v-row>
      <v-col>
        <v-select v-model="iconId" tile hide-details class="text-center" :density="'compact'" :items="getItemOnlyIds">
          <template v-slot:item="{props, item}">
            <v-list-item v-bind="props">
              <template v-slot:title>
                <ItemName :id="item.raw"></ItemName>
              </template>
            </v-list-item>
          </template>
          <template v-slot:selection="{ item }">
            <ItemName :id="getItemRaw(item)"></ItemName>
          </template>
        </v-select>

        <div class="mt-5 opacity-60">
          <p class="text-caption">{{ t('setting.routine.itemIconSizeDesc') }}</p>
        </div>
      </v-col>
      <v-col cols="auto" class="py-3 d-flex justify-center">
        <ItemSlotBase :size="`${getIconSize.size}px`"
                      :margin="getIconSize?.box?.margin"
                      :padding="getIconSize?.box?.padding">
          <ItemIconWidget :id="iconId"
                          :margin="getIconSize?.icon?.margin"
                          :padding="getIconSize?.icon?.padding"></ItemIconWidget>
        </ItemSlotBase>
      </v-col>
    </v-row>
  </v-card>

  <v-select
      class="mt-4"
      density="compact"
      tile
      hide-details
      v-model="getIconSize"
      item-value="value"
      :items="sizes">
    <template v-slot:selection="{ item }">
      <v-list-item>
        <template v-slot:title>
          {{ (item as any).raw.size }}
        </template>
      </v-list-item>
    </template>
    <template v-slot:item="{item,props}">
      <v-list-item v-bind="props">
        <template v-slot:title>
          {{ item.raw.size }}
        </template>
      </v-list-item>
    </template>
  </v-select>

  <div>
    <v-row align="center">
      <v-col>{{ t('setting.routine.itemOpenNewWindowTitle') }}</v-col>
      <v-col cols="auto">
        <v-switch hide-details hide-spin-buttons inset v-model="openNewWindow"></v-switch>
      </v-col>
    </v-row>

    <div class="mt-0 opacity-60">
      <p class="text-caption">{{ t('setting.routine.itemOpenNewWindowDesc') }}</p>
    </div>
  </div>
</template>

<style scoped lang="less">

</style>
