<template>
  <v-app id="inspire">
    <v-app-bar>
      <v-app-bar-nav-icon @click="drawer = !drawer"></v-app-bar-nav-icon>

      <v-app-bar-title>Application</v-app-bar-title>
    </v-app-bar>

    <v-navigation-drawer
        v-model="drawer"
        temporary
    >
      <!--  -->
    </v-navigation-drawer>

    <v-main class="bg-grey-lighten-2">
      <v-container>
        <v-row no-gutters>
          <v-card
              class="mx-auto ma-2 ml-2 mr-2"
              max-width="calc(33.3% - 16px)"
              v-for="n in achievements" :key="n"
              hover>
            <v-card-item>
              <v-card-title>
                {{n.id}}
              </v-card-title>

              <v-card-subtitle>
                {{n.dateAdded}}
              </v-card-subtitle>
            </v-card-item>

            <v-card-text>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
            </v-card-text>
          </v-card>

<!--          <template v-for="n in 4" :key="n">-->
<!--            <v-col-->
<!--                class="mt-2"-->
<!--                cols="12"-->
<!--            >-->
<!--              <strong>Category {{ n }}</strong>-->
<!--            </v-col>-->

<!--            <v-col-->
<!--                v-for="j in 6"-->
<!--                :key="`${n}${j}`"-->
<!--                cols="6"-->
<!--                md="2"-->
<!--            >-->
<!--              <v-sheet height="150"></v-sheet>-->
<!--            </v-col>-->
<!--          </template>-->
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup>
import { ref } from 'vue'
import {Achievements} from "@skullandbonestools/snbdata";

const achievements = Achievements;

const drawer = ref(null)
</script>

<script>
export default {
  data: () => ({ drawer: null }),
}
</script>
