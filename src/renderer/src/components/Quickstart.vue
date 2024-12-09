<script lang="ts" setup name="Quickstart">

</script>

<template>
<el-row style="height: 20px;" />
    <el-row justify="space-between">
        <el-col :span="3" />
        <el-col :span="18">
            <div style="width: 380px;">
                <img src="../assets/icon.png" />
            </div>
            当前版本：1.0.0-alpha.3<br />
            项目地址：<a href="https://github.com/Asendaushoe/EasyPublish">https://github.com/Asendaushoe/EasyPublish</a><br />
            这个快速开始让我吃了，去项目页看吧。
        </el-col>
        <el-col :span="3" />
    </el-row>
</template>

<style scope>
img{
    width: 100%;
    height: 100%;
    object-fit: cover;
}
</style>