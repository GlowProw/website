<script setup lang="ts">

</script>

<template>
  <div data-v-658031d5="" class="v-input v-input--horizontal v-input--density-compact v-theme--dark v-locale--is-ltr v-input--readonly v-text-field v-input--plain-underlined"><!---->
    <div class="v-field__prepend mt-2 mr-4">
      <slot name="prepend"></slot>
    </div>
    <div class="v-input__control">
      <div class="v-field v-field--appended v-field--no-label v-field--variant-underlined v-theme--dark v-locale--is-ltr">
        <div class="v-field__overlay"></div>
        <div class="v-field__loader">
          <div class="v-progress-linear v-theme--dark v-locale--is-ltr" role="progressbar" aria-hidden="true" aria-valuemin="0" aria-valuemax="100" style="top: 0px; height: 0px; --v-progress-linear-height: 2px;"><!---->
            <div class="v-progress-linear__background"></div>
            <div class="v-progress-linear__buffer" style="width: 0%;"></div>
            <div class="v-progress-linear__indeterminate">
              <div class="v-progress-linear__indeterminate long"></div>
              <div class="v-progress-linear__indeterminate short"></div>
            </div>
          </div>
        </div>
        <div class="v-field__field">
          <slot name="default"/>
        </div>
        <div class="v-field__append-inner">
          <slot name="append-inner"></slot>
        </div>
        <div class="v-field__outline"></div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="less">

</style>
