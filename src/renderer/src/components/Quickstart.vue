<script lang="ts" setup name="Quickstart">
import { useDark } from '@vueuse/core'
const isDark = useDark()
</script>

<template>
<div style="margin-left: 20px;">
    <div style="width: 500px;">
        <img v-if="isDark" src="../assets/logo_dark.png" />
        <img v-else src="../assets/logo.png" />
    </div>
    <br />
    当前版本：1.4.1<br />
    项目地址：<a href="https://github.com/vcb-s/EasyPublish">https://github.com/vcb-s/EasyPublish</a><br />
    这个快速开始让我吃了，去项目页看吧。
</div>
</template>

<style scoped>
img{
    width: 100%;
    height: 100%;
    object-fit: cover;
}
</style>