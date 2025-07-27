<script setup lang="ts">
import {nextTick, onMounted, ref, watch} from "vue";
import {useHttpToken} from "../../assets/sripts/httpUtil";
import {api, http} from "../../assets/sripts";
import AssemblyShowWidget from "../../components/AssemblyShowWidget.vue";
import AssemblyTouring from "../../components/AssemblyTouring.vue";
import {useI18n} from "vue-i18n";

const httpToken = useHttpToken(),
    {t} = useI18n()

const list = ref({});
const widgetRefs = ref([]);

let pagination = ref({
  page: 1
})

onMounted(() => {
  getBrowseList();
});

/**
 * 获取配装列表
 */
const getBrowseList = async () => {
  const result = await http.get(api['assembly_list']);
  const d = result.data;

  if (d.error) return;

  list.value = d.data;
};

watch(list, (newList) => {
  if (newList && newList.data.length > 0) {
    nextTick(() => {
      widgetRefs.value.forEach((widget, index) => {
        if (widget?.onLoadJson) {
          widget.onLoadJson(newList.data[index].data);
        }
      });
    });
  }
}, {deep: true});
</script>

<template>
  <v-breadcrumbs class="pt-5">
    <v-container class="pa-0">
      <v-breadcrumbs-item to="/">{{ t('portal.title') }}</v-breadcrumbs-item>
      <v-breadcrumbs-divider></v-breadcrumbs-divider>
      <v-breadcrumbs-item to="/assembly">{{ t('assembly.title') }}</v-breadcrumbs-item>
      <v-breadcrumbs-divider></v-breadcrumbs-divider>
      <v-breadcrumbs-item>{{ t('assembly.browse.title') }}</v-breadcrumbs-item>
    </v-container>
  </v-breadcrumbs>
  <v-divider></v-divider>
  <v-container>
    <v-row>
      <v-spacer></v-spacer>
      <v-col cols="auto">
        <v-btn to="/assembly/workshop">创建配装</v-btn>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12">
        <v-row>
          <v-col cols="6" v-for="(item, index) in list.data" :key="index" class="card-flavor">
            <v-row class="pt-5 pl-5 pr-5">
              <v-col>
                <p class="font-weight-bold">{{ item.name }} - {{ item.username }}</p>
                <p class="opacity-80">{{ item.description }}</p>
              </v-col>
              <v-col cols="auto">
                <v-btn>
                  赞
                </v-btn>
              </v-col>
            </v-row>
            <v-card class="card-flavor" :to="`/assembly/browse/${item.uuid}/detail`">
              <AssemblyTouring>
                <AssemblyShowWidget
                    class="card-flavor mb-5 ml-n10 mr-n10"
                    :readonly="true"
                    :ref="(el) => { if (el) widgetRefs[index] = el }">
                  <template v-slot:image>
                    <v-img
                        style="position: relative;z-index: 2;"
                        class=" workshop-ships-show-image pointer-events-none"
                        src="/Users/cabbagelol/Desktop/835f1991017f393b685a275d9a342e56.jpeg"
                        width="100%"/>
                  </template>
                </AssemblyShowWidget>
              </AssemblyTouring>
            </v-card>
          </v-col>
        </v-row>
      </v-col>
    </v-row>

    <v-pagination
        v-if="list.pagination"
        v-model="pagination.page"
        :length="list.pagination.totalPages"
        class="my-4"
    ></v-pagination>
  </v-container>
</template>

<style scoped lang="less">
</style>
