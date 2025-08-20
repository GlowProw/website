<template>
    <span class="privilege-tag-box">
      <span v-for="(p_item, pIndex) in tags" :key="pIndex">
        <v-chip :type="tagType" :size="size" :color="p_item.class" class="tag"
                :title="t('basic.privilege.' + p_item.value)">
          {{ t('basic.privilege.' + p_item.value) }}
        </v-chip>
      </span>
    </span>
</template>

<script setup lang="ts">

import {onMounted, ref, watch} from "vue";
import privileges from "@/../public/config/privilege.json"
import {useI18n} from "vue-i18n";

const {t} = useI18n()

const props = defineProps({
  data: {
    type: [Array, String],
    default: () => []
  },
  size: {
    type: String,
    default: 'default'
  },
  tagType: {
    type: String,
    default: 'border'
  }
})

let tags = ref([])

onMounted(() => {
  update(props.data)
})

watch(() => props.data, (value) => {
  update(value)
})

const update = (userPrivileges: string[] = []) => {
  if (!userPrivileges) return [];
  tags.value = privileges.child.filter(i => {
    return userPrivileges.includes(i.value);
  });
}

</script>

<style lang="less" scoped>
.privilege-tag-box {
  user-select: none;

  .tag {
    cursor: pointer;
  }
}
</style>
