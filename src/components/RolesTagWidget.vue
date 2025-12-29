<template>
    <span class="privilege-tag-box d-flex ga-2">
      <span v-for="(p_item, pIndex) in tags" :key="pIndex">
        <v-chip :type="tagType" :size="size"
                :color="p_item.class"
                :density="density"
                class="tag"
                :title="t('basic.privilege.' + p_item.value)">
          {{ t('basic.privilege.' + p_item.value) }}
        </v-chip>
      </span>
    </span>
</template>

<script setup lang="ts">
import {onMounted, ref, watch} from "vue";
import privileges from "~/public/config/role.json"
import {useI18n} from "vue-i18n";

const {t} = useI18n()

const props = withDefaults(defineProps<{ data: [] | string, density?: string | any | null, size?: string, tagType?: string }>(), {
  density: 'default',
  size: 'default',
  tagType: 'border'
})

let tags = ref([])

watch(() => props.data, (value) => {
  if (value)
    onUpdateTag(value)
})

onMounted(() => {
  onUpdateTag(props.data)
})

/**
 * 更新身份令牌
 * @param userPrivileges
 */
const onUpdateTag = (userPrivileges?: [] | string) => {
  if (!userPrivileges) return [];
  tags.value = privileges.child.filter(i => {
    return userPrivileges.includes(i.value)
  })
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
