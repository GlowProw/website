<script setup lang="ts">
import {useI18n} from "vue-i18n";
import {computed} from "vue";

const
    {t} = useI18n(),
    emit = defineEmits(['clickMenuItem'])

const props = defineProps({
  menuConfig: {
    type: Object,
    default: () => ({
      width: 320,
      menu: [
        {
          "label": "codex.itemMenu.ship",
          "value": [],
          "category": "ship"
        },
        {
          "label": "codex.itemMenu.item",
          "menus": [
            {
              "value": ['culverin', 'demicannon', 'bombard', 'longGun', 'torpedo'],
              "category": "item"
            },
            {
              "value": ['mortar', 'rocket', 'springloader'],
              "category": "item"
            },
            {
              "value": ['shipUpgrade'],
              "category": "item"
            },
            {
              "value": ['majorFurniture', 'offensiveFurniture', 'utilityFurniture'],
              "category": "item"
            },
            {
              "value": ['armor'],
              "category": "item"
            },
            {
              "value": ['consumable'],
              "category": "item"
            },
            {
              "value": ['tool', 'chest'],
              "category": "item"
            }
          ]
        },
        {
          "label": "codex.itemMenu.material",
          "value": [],
          "category": "material"
        },
        {
          "label": "codex.itemMenu.commoditie",
          "value": [],
          "category": "commoditie"
        },
        {
          "label": "codex.itemMenu.cosmetic",
          "menus": [
            {
              "value": ['firework'],
              "category": "cosmetic"
            },
            {
              "divider": true
            },
            {
              "value": ['emote'],
              "category": "cosmetic"
            },
            {
              "value": ['bodyCosmetics', 'hand', 'hair', 'facialHair', 'eyeColor'],
              "category": "cosmetic"
            },
            {
              "value": ['aura'],
              "category": "cosmetic"
            },
            {
              "divider": true
            },
            {
              "value": ['sailsEmblem', 'hull', 'sailsColor', 'crowsNest', 'trophy', 'wheel', 'sailsPattern', 'helmDecor',
                'ornaments', 'figureHead', 'nameplate'],
              "category": "cosmetic"
            },
            {
              "value": ['pet', 'crewLook'],
              "category": "cosmetic"
            },
            {
              "value": ['shipSkin', 'armorSkin', 'culverinWeaponSkin', 'demicannonWeaponSkin', 'longGunWeaponSkin', 'ballistaWeaponSkin', 'torpedoWeaponSkin'],
              "category": "cosmetic"
            }
          ]
        },
        {
          "label": "codex.itemMenu.set",
          "value": [],
          "category": "set"
        },
        {
          "label": "codex.itemMenu.treasureMap",
          "value": [],
          "category": "treasureMap"
        },
        {
          "label": "codex.itemMenu.mapLocation",
          "value": [],
          "category": "mapLocation"
        },
        {
          "divider": true
        },
        {
          "label": "codex.itemMenu.ultimate",
          "value": [],
          "category": "ultimate"
        },
        {
          "label": "codex.itemMenu.modification",
          "value": [],
          "category": "modification"
        },
        {
          "divider": true
        },
        {
          "label": "codex.itemMenu.customData",
          "menus": [
            {
              "label": "codex.itemMenu.assembly",
              "category": "assembly"
            },
            {
              "label": "codex.itemMenu.mastery",
              "category": "mastery"
            },
            {
              "label": "codex.itemMenu.wheel",
              "category": "wheel"
            },
            {
              "label": "codex.itemMenu.shipyard",
              "category": "shipyard"
            }
          ]
        }
      ]
    })
  },
  visibleCategories: {
    type: Array as () => string[],
    default: () => []
  }
})

/**
 * 按可见分类过滤菜单配置，并清理首尾与连续的分隔线
 */
const filteredMenuConfig = computed(() => {
  const config = props.menuConfig;
  if (!props.visibleCategories || props.visibleCategories.length === 0) {
    return config;
  }

  const visibleCats = props.visibleCategories;
  const newMenu = [];

  for (const root of config.menu) {
    if (root.divider) {
      newMenu.push(root);
      continue;
    }

    if (root.menus) {
      const filteredMenus = [];
      for (const m of root.menus) {
        if (m.divider) {
          filteredMenus.push(m);
        } else if (m.category && visibleCats.includes(m.category)) {
          filteredMenus.push(m);
        }
      }

      const cleanMenus = filteredMenus.filter((m, i, arr) => {
        if (m.divider) {
          if (i === 0 || i === arr.length - 1) return false;
          if (arr[i - 1].divider) return false;
        }
        return true;
      });

      if (cleanMenus.length > 0) {
        newMenu.push({...root, menus: cleanMenus});
      }
    } else {
      if (root.category && visibleCats.includes(root.category)) {
        newMenu.push(root);
      }
    }
  }

  const cleanMenu = newMenu.filter((m, i, arr) => {
    if (m.divider) {
      if (i === 0 || i === arr.length - 1) return false;
      if (arr[i - 1].divider) return false;
    }
    return true;
  });

  return {
    ...config,
    menu: cleanMenu
  };
});

/**
 * 向外抛出菜单项点击事件
 * @param tags 物品类型标签集合
 * @param category 菜单项分类标识
 */
const onClickMenu = (tags: string[] = [], category?: string) => {
  emit('clickMenuItem', {
    tags,
    category,
  })
}
</script>

<template>
  <v-menu location="bottom end" :offset="[10, 20]" :width="filteredMenuConfig.width">
    <template v-slot:activator="{ props }">
      <div v-bind="props" class="cursor-pointer">
        <slot v-bind="props"></slot>
      </div>
    </template>

    <v-list :width="filteredMenuConfig.width"
            class="overflow-x-hidden pa-1"
            border rounded="lg">
      <template v-for="(root, rootIndex) in filteredMenuConfig.menu" :key="rootIndex">
        <template v-if="!root.divider">
          <!-- 无子菜单的项整行可点击；有子菜单的项由内嵌 submenu 悬停/点击展开 -->
          <v-list-item
              rounded="lg"
              :link="!root.menus"
              @click="root.menus ? null : onClickMenu(root.value || [], root.category)">

            {{ t(root.label) }}

            <!-- 右侧箭头图标 开始 -->
            <template v-slot:append v-if="root.menus">
              <v-icon icon="mdi-menu-right"></v-icon>
            </template>

            <template v-if="root.menus">
              <v-menu :open-on-focus="false"
                      open-on-hover
                      :offset="[-15, 5]"
                      :width="filteredMenuConfig.width"
                      activator="parent"
                      submenu>
                <v-list class="overflow-x-hidden pa-1" border rounded="lg">
                  <template v-for="(i, iIndex) in root.menus" :key="iIndex">
                    <template v-if="!i.divider">
                      <v-list-item link rounded="lg" @click="onClickMenu(i.value || [], i.category)">
                        <v-list-item-title>
                          <!-- 优先展示多语言标签，否则拼接类型名 -->
                          <template v-if="i.label">{{ t(i.label) }}</template>
                          <template v-else>
                                <span v-for="(tr, trIndex) in (i.value || [])" :key="trIndex">
                                  <template v-if="trIndex != 0">,</template>{{ t(`codex.types.${tr}`) }}
                                </span>
                          </template>
                        </v-list-item-title>
                      </v-list-item>
                    </template>

                    <template v-else>
                      <v-divider class="my-2"></v-divider>
                    </template>
                  </template>
                </v-list>
              </v-menu>
            </template>
          </v-list-item>
        </template>

        <template v-else>
          <v-divider class="my-2"></v-divider>
        </template>
      </template>
    </v-list>
  </v-menu>
</template>

<style scoped lang="less">

</style>
