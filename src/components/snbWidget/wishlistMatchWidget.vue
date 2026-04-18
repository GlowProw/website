<script setup lang="ts">
import {computed} from "vue";
import {useI18nUtils} from "@/assets/sripts/i18n_util";
import {useWishlistStore} from "~/stores/wishlistStore";
import PerksName from "@/components/snbWidget/perksName.vue";
import ModName from "./modName.vue";

const props = defineProps<{
  id: string;
}>();

const {t} = useI18nUtils();
const wishlistStore = useWishlistStore();

const wishlistMatch = computed(() => {
  if (!props.id) return null;
  const itemMatch = wishlistStore.getMatchForItem(props.id);
  const modMatch = wishlistStore.getMatchForMod(props.id);

  if (!itemMatch && !modMatch) return null;

  const combinedRules = new Set<any>();
  const combinedNames = new Set<string>();

  if (itemMatch) {
    itemMatch.rules.forEach(r => combinedRules.add(r));
    itemMatch.wishlistNames.forEach(n => combinedNames.add(n));
  }
  if (modMatch) {
    modMatch.rules.forEach(r => combinedRules.add(r));
    modMatch.wishlistNames.forEach(n => combinedNames.add(n));
  }

  return {
    matched: true,
    rules: Array.from(combinedRules),
    wishlistNames: Array.from(combinedNames)
  };
});

defineOptions({
  name: "WishlistMatchWidget"
});
</script>

<template>
  <div class="d-flex flex-column ga-2 mt-2" v-if="wishlistMatch">
    <v-card variant="tonal" class="pa-3" border
            v-for="(rule, index) in wishlistMatch.rules" :key="index">
      <div class="d-flex flex-wrap text-amber ga-1 text-amber font-weight-bold">
        <div v-for="name in wishlistMatch.wishlistNames" :key="name">
          {{ name }}
        </div>
      </div>

      <div v-if="rule.notes" class="text-caption opacity-60 text-pre-wrap">
        {{ t('setting.wishlist.notes') }}: {{ rule.notes }}
      </div>

      <div v-if="rule.tags" class="text-caption opacity-60 text-pre-wrap">
        <span class="mr-2">tag:</span>
        <div class="d-inline-flex ga-2">
          <span v-for="(tag, tagIndex) in rule.tags" :key="tagIndex">{{ tag }}</span>
        </div>
      </div>

      <div class="mt-2 flex-wrap">
        <div v-if="rule.mods && rule.mods.length > 0" class="d-flex align-center ga-2">
          <div class="singe-line">{{ t('setting.wishlist.mod') }}:</div>
          <div class="d-flex align-center flex-wrap ga-1">
            <template v-for="mod in rule.mods" :key="mod">
              <u class="u">
                <span v-if="mod.split('.')[0]">{{ t(`assembly.modification.${mod.split('.')[0]}`) }}:</span>
                <ModName :id="mod.includes('.') ? mod.split('.')[1] : mod"></ModName>
              </u>
            </template>
          </div>
        </div>

        <div v-if="rule.perks && rule.perks.length > 0" class="d-flex align-center ga-2">
          <div class="singe-line">{{ t('setting.wishlist.perk') }}:</div>
          <div class="d-flex align-center flex-wrap ga-1">
            <template v-for="perk in rule.perks" :key="perk">
              <u class="u">
                <PerksName :id="perk"></PerksName>
              </u>
            </template>
          </div>
        </div>
      </div>
    </v-card>
  </div>
</template>

<style scoped lang="less">
@import "@/assets/styles/link";
</style>
