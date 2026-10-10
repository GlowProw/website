<script setup lang="ts">
import {useI18n} from "vue-i18n";
import AffixBoxHasTitleView from "@/components/AffixBoxHasTitleView.vue";
import MessagesPanel from "@/components/messages/MessagesPanel.vue";

const {t} = useI18n();

defineOptions({
  name: 'AccountMessages'
});
</script>

<template>
  <AffixBoxHasTitleView>
    <MessagesPanel></MessagesPanel>

    <template v-slot:title>
      {{ t('account.messages.title') }}
    </template>
  </AffixBoxHasTitleView>
</template>
