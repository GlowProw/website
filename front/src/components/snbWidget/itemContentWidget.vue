<script setup lang="ts">
import {Cosmetics, Item, Items} from "glow-prow-data";
import {onMounted, ref, watch} from "vue";
import ItemSlotBase from "@/components/snbWidget/ItemSlotBase.vue";
import ItemIconWidget from "@/components/snbWidget/itemIconWidget.vue";
import ItemName from "@/components/snbWidget/itemName.vue";
import CosmeticIconWidget from "@/components/snbWidget/cosmeticIconWidget.vue";
import CosmeticName from "@/components/snbWidget/cosmeticName.vue"

const props = withDefaults(defineProps<{ data: Item | any }>(), {
      data: null
    }),
    items = Items,
    cosmetics = Cosmetics

let contents = ref([])

watch(() => props.data, () => {
  onReady()
})

onMounted(() => {
  onReady()
})

const onReady = () => {
  if (!props.data)
    return

  let id = props.data.id;

  contents.value = [
    ...filterByObtainable(Object.values(items), id).map(i => {
      return {...i, _type: 'item'}
    }),
    ...filterByObtainable(Object.values(cosmetics), id).map(i => {
      return {...i, _type: 'cosmetic'}
    })
  ]
}

const filterByObtainable = (items: any[], targetId: string) => {
  return items.filter(item => {
    if (!item.obtainable) return false;

    const obtainable = item.obtainable;

    if (typeof obtainable === 'string') {
      return obtainable === targetId;
    }

    if (obtainable && typeof obtainable === 'object' && 'id' in obtainable) {
      return obtainable.id === targetId;
    }

    if (Array.isArray(obtainable)) {
      const flatArray = obtainable.flat();
      return flatArray.some(element => {
        if (typeof element === 'string') {
          return element === targetId;
        } else if (element && typeof element === 'object' && 'id' in element) {
          return element.id === targetId;
        }
        return false;
      });
    }

    return false;
  });
};

</script>

<template>
  <div v-if="contents.length > 0">
    <slot></slot>
    <v-row align="end" justify="center" class="d-flex ga-2 mt-2">
      <v-col cols="auto" v-for="(i,index) in contents" :key="index">
        <div class="text-center">
          <template v-if="i._type == 'item'">
            <ItemSlotBase size="50px" :padding="0" class="mx-auto mb-2">
              <ItemIconWidget :id="i.id" :padding="1"></ItemIconWidget>
            </ItemSlotBase>
            <ItemName :data="i"></ItemName>
          </template>
          <template v-if="i._type == 'cosmetic'">
            <v-badge :offset-y="0" color="#000">
              <template v-slot:badge>
                <v-icon size="15">mdi-brush-variant</v-icon>
              </template>
              <ItemSlotBase size="50px" :padding="0" class="mx-auto mb-2">
                <CosmeticIconWidget :id="i.id" :margin="1"></CosmeticIconWidget>
              </ItemSlotBase>
            </v-badge>
            <div>
              <CosmeticName :id="i.id" :grade="null"></CosmeticName>
            </div>
          </template>
        </div>
      </v-col>
    </v-row>
  </div>
</template>

<style scoped lang="less">

</style>
