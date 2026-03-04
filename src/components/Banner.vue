<script setup lang="ts">

</script>

<template>
  <div class="banner">
    <div class="banner-looping-video">
      <video autoplay playsinline
             muted loop type="video/mp4"
             src="@/assets/videos/oathsOfWar.mp4"></video>
    </div>

    <v-container class="banner-top">
      <div class="title">
        <slot name="title"></slot>
      </div>

      <slot></slot>
    </v-container>
  </div>
</template>

<style scoped lang="less">
.banner {
  min-height: 50px;
  overflow: hidden;
  position: relative;

  .banner-looping-video {

    &:after {
      content: "";
      position: absolute;
      width: 100%;
      height: 100%;
      background: #000;
      opacity: .5;
    }

    video {
      position: absolute;
      z-index: 0;
      left: 50%;
      top: 50%;
      width: 100%;
      transform: translate(-50%, -50%);
      min-width: 100%;
      height: auto;
      min-height: 100%;
      pointer-events: visible;
    }
  }

  &:before {
    content: "";
    position: absolute;
    z-index: 1;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 0;
    padding: 10% 0 0;
    background: url(@/assets/images/portal-banner-background.png) 50% 0 no-repeat;
    background-size: cover;
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
