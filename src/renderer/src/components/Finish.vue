<script setup lang="ts" name="Finish">
    import { defineProps, onMounted, ref } from "vue"
    import { useRouter } from 'vue-router'

    const props = defineProps<{id: number}>()
    const router = useRouter()

    const src = ref('')
    let type = false

    function back() {
        router.push({
            name: type ? 'publish' : 'site',
            params: {id: props.id}
        })
    }

    async function loadData() {
        src.value = await window.api.GetSiteSrc(props.id)
        const {status} = await window.api.OpenTask(props.id)
        type = status == 'quick'
    }

    onMounted(() => {
        loadData()
    })

</script>

<template>
    <el-row style="height: 30px;" />
    <el-result
        icon="success"
        title="发布完成"
        sub-title="返回上一步或打开主站发布链接"
    >
        <template #extra>
            <div v-if="src != ''">
                <el-link :href="src" type="primary">{{ src }}</el-link>
                <el-row style="height: 20px;" />
            </div>
            <div>
                <el-button @click="back" type="primary" plain>返回</el-button>
            </div>
        </template>
    </el-result>
</template>

<style scoped>
</style>