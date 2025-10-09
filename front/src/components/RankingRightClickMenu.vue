<script setup lang="ts">
import {useI18n} from "vue-i18n";

const
    {t} = useI18n(),
    emit = defineEmits(['clickMenuItem']),
    menuConfig = {
      width: 320,
      menu: [
        {
          "label": "物品",
          "menus": [
            {
              "value": ['culverin', 'demicannon', 'bombard', 'longGun', 'torpedo'],
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
          "label": "材料",
          "value": [],
          "category": "material"
        },
        {
          "label": "装饰品",
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
          "divider": true
        },
        {
          "label": "终极技能",
          "value": [],
          "category": "ultimate"
        },
        {
          "label": "模组",
          "value": [],
          "category": "modification"
        },
        {
          "divider": true
        },
        {
          "label": "配装数据",
          "menus": [
            {
              "label": "配装",
              "category": "1"
            },
            {
              "label": "轮盘",
              "category": "wheel"
            },
            {
              "label": "船仓",
              "category": "w2"
            },
          ]
        }
      ]
    }

const onClickMenu = (tags = [], category) => {
  emit('clickMenuItem', {
    tags,
    category,
  })
}
</script>

<template>
  <v-menu location="bottom right" :width="menuConfig.width">
    <template v-slot:activator="{ props }">
      <div v-bind="props">
        <slot></slot>
      </div>
    </template>

    <v-list :width="menuConfig.width" density="compact">
      <template v-for="(root, rootIndex) in menuConfig.menu" :key="rootIndex">
        <template v-if="!root.divider">
          <v-list-item
              @click="root.value ? onClickMenu(
                                root.value || [],
                                root.category
                            ) : null">

            {{ root.label }}

            <!-- right icon S -->
            <template v-slot:append v-if="root.menus">
              <v-icon icon="mdi-menu-right"></v-icon>
            </template>
            <template v-slot:append v-else-if="!root.menus">
              <v-icon>mdi-open-in-new</v-icon>
            </template>

            <template v-if="root.menus">
              <v-menu :open-on-focus="false" :width="menuConfig.width" activator="parent" open-on-hover submenu>
                <v-list>
                  <template v-for="(i, iIndex) in root.menus" :key="iIndex">
                    <template v-if="!i.divider">
                      <v-list-item link>
                        <v-list-item-title
                            @click="onClickMenu(
                                i.value,
                                i.category
                            )">
                          <span v-for="(tr, trIndex) in i.value" :key="trIndex">
                            <template v-if="trIndex != 0">,</template>{{ t(`displayCabinet.type.${tr}`) }}
                          </span>
                        </v-list-item-title>
                      </v-list-item>
                    </template>

                    <template v-else-if="i.divider">
                      <v-divider class="my-2"></v-divider>
                    </template>
                  </template>
                </v-list>
              </v-menu>
            </template>
          </v-list-item>
        </template>

        <template v-else-if="root.divider">
          <v-divider class="my-2"></v-divider>
        </template>
      </template>
    </v-list>
  </v-menu>
</template>

<style scoped lang="less">

</style>
