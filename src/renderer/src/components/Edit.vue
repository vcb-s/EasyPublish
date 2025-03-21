<script setup lang="ts" name="Edit">
import { toRef, computed } from 'vue'
import { useRoute, RouterView } from 'vue-router'

const page_path = toRef(useRoute(), 'path')

let step = computed<number>(() => {
    if(page_path.value.includes('finish')) return 4
    else if(page_path.value.includes('check')) return 1
    else if(page_path.value.includes('publish')) return 2
    else if(page_path.value.includes('site')) return 3
    else return 0
})

const steps = [
    {
        title: '编辑',
        description: '编辑或上传发布内容'
    },
    {
        title: '复核',
        description: '最终检查发布内容'
    },
    {
        title: '发布',
        description: '自动化发布中'
    },
    {
        title: '主站',
        description: '更新主站内容'
    },
    {
        title: '完成',
        description: '发布完成'
    }
]

</script>

<template>
    <div>
        <el-row style="height: 20px;" />
        <el-row justify="space-between">
            <el-col :span="3" />
            <el-col :span="18">
                <el-steps style="max-width: 1200px" :active="step">
                    <el-step v-for="item in steps" :title="item.title" />
                </el-steps>
            </el-col>
            <el-col :span="3" />
        </el-row>
        <RouterView></RouterView>
    </div>
</template>

<style scoped>

</style>