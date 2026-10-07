<script setup lang="ts">

</script>

<template>
  <div class="banner">
    <div class="banner-bottom-block"></div>

    <slot></slot>
  </div>
</template>

<style scoped lang="less">
.banner {
  min-height: 50px;
  overflow: revert;
  position: relative;

  .banner-bottom-block {
    pointer-events: none;
    position: absolute;
    z-index: 20;
    bottom: 0;
    left: 0;
    right: 0;
    transform: translateY(50px);
    height: 140px;
    background: url(@/assets/images/portal-banner-background.png) 50% 0 repeat-x;
    background-clip: revert-layer;
    background-size: 1000px;
    -webkit-mask-image: linear-gradient(to top, transparent 0%, black 40%);
    mask-image: linear-gradient(to top, transparent 0%, black 40%);
  }

  .banner-top {
    overflow: hidden;
    min-height: 400px;
    display: flex;
    align-self: end;
    flex-direction: column;
    align-items: center;

    .title {
      flex: 1;
      z-index: 3;
      text-align: center;
      margin-top: 200px;
    }
  }
}

@media screen and (max-width: 980px) {
  .banner {
    .banner-looping-video {
      video {
        opacity: .7;
        width: auto;
        height: 100% !important;
      }
    }

    .title {
      margin-top: 100px !important;
      margin-bottom: 50px;
    }
  }
}
</style>
