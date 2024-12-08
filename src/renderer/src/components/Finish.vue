<script setup lang="ts" name="Finish">
    import { defineProps, onMounted, ref } from "vue"
    import { useRouter } from 'vue-router'

    const props = defineProps<{id: number}>()
    const router = useRouter()

    const src = ref('')

    function toSite() {
        router.push({
            name: 'site',
            params: {id: props.id}
        })
    }

    async function loadData() {
        src.value = await window.api.GetSiteSrc(props.id)
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
                <el-button @click="toSite" type="primary" plain>返回</el-button>
            </div>
        </template>
    </el-result>
</template>

<style scoped>
</style>