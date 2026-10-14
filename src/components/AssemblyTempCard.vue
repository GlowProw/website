<template>
  <v-card class="card-enlargement-mask-flavor pa-5">
    <v-row class="pt-2 px-1">
      <v-col>
        <router-link :to="`/assembly/browse/${item.uuid}/detail`">
          <div :title="String(item.name || 'none')" class="text-amber text-h4 mb-1 font-weight-bold singe-line">
            {{ item.name || 'none' }}
          </div>
        </router-link>
        <v-row>
          <v-col cols="auto">
            <AccountCardWidget :id="item.userId">
              <div class="d-flex align-center">
                <v-card v-if="item.userAvatar" class="mr-1">
                  <UserAvatar size="20" :src="item.userAvatar"></UserAvatar>
                </v-card>
                <span class="u">{{ item.username || t('assembly.anonymous') }}</span>
              </div>
            </AccountCardWidget>
          </v-col>

          <v-spacer></v-spacer>

          <v-col cols="auto" class="d-flex ga-1">
            <v-chip density="compact" variant="text" :disabled="!!item.isLiked" v-if="showLikes">
              <v-icon color="red">{{ (item.likes || 0) <= 0 ? 'mdi-heart-outline' : 'mdi-heart' }}</v-icon>
              <span class="ml-1 text-red-accent-4">{{ item.likes || 0 }}</span>
            </v-chip>

            <v-divider vertical inset opacity=".5" thickness="1"></v-divider>

            <v-chip density="compact" variant="text">
              <v-icon color="blue-grey-lighten-3">{{ (item.browseCount || 0) <= 0 ? 'mdi-eye-outline' : 'mdi-eye' }}</v-icon>
              <span class="ml-1 text-blue-grey-lighten-3">{{ item.browseCount || 0 }}</span>
            </v-chip>
          </v-col>
        </v-row>
      </v-col>
    </v-row>

    <v-hover v-slot="{ isHovering, props: hoverProps }">
      <div v-bind="hoverProps" class="position-relative">
        <AssemblyTouring>
          <AssemblyWidget
              class="card-flavor mb-5 ml-n10 mr-n10"
              :readonly="true"
              :perfect-display="perfectDisplay"
              ref="assemblyWidgetRef">
          </AssemblyWidget>
        </AssemblyTouring>
        <router-link :to="`/assembly/browse/${item.uuid}/detail`" target="_blank">
          <v-overlay scrim="#000" contained class="d-flex justify-center align-center" :model-value="!!isHovering">
            <v-icon icon="mdi-open-in-new" size="30"></v-icon>
          </v-overlay>
        </router-link>
      </div>
    </v-hover>

    <slot name="actions"></slot>
  </v-card>
</template>

<script setup lang="ts">
import {nextTick, onMounted, ref, watch} from 'vue';
import {useI18n} from 'vue-i18n';
import AccountCardWidget from '@/components/AccountCardWidget.vue';
import UserAvatar from '@/components/UserAvatar.vue';
import AssemblyWidget from '@/components/AssemblyWidget.vue';
import AssemblyTouring from '@/components/AssemblyTouring.vue';

const props = withDefaults(defineProps<{
  item: any;
  showLikes?: boolean;
  perfectDisplay?: boolean;
}>(), {
  showLikes: true,
  perfectDisplay: true,
});

const {t} = useI18n();
const assemblyWidgetRef = ref<any>(null);

const loadData = () => {
  if (assemblyWidgetRef.value?.onLoad && props.item) {
    assemblyWidgetRef.value
        .setSetting({
          assemblyUseVersion: props.item?.attr?.assemblyUseVersion,
          isShowItemName: props.item?.attr?.isShowItemName,
        })
        .onLoad(props.item?.assembly || {});
  }
};

onMounted(() => {
  nextTick(() => {
    requestAnimationFrame(() => {
      loadData();
    });
  });
});

watch(() => props.item, () => {
  nextTick(() => {
    requestAnimationFrame(() => {
      loadData();
    });
  });
}, {deep: true});

defineExpose({
  assemblyWidgetRef,
  loadData,
});

defineOptions({
  name: 'AssemblyTempCard',
});
</script>
