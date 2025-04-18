<script setup lang="ts" name="Home">
import { useDark } from '@vueuse/core'
const isDark = useDark()
</script>

<template>
    <div class="home">
        <img v-if="isDark" src="../assets/logo_dark.png" />
        <img v-else src="../assets/logo.png" />
    </div>
</template>

<style scoped>
img{
    width: 800px;
    height: 100%;
    object-fit: cover;
}
.home{
    position: absolute;
    top: 20%;
    left: 25%;
    transform: translate(-50%、 -50%);
    text-align: center;
    font-size: xx-large;
}
</style>