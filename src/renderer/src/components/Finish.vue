<script setup lang="ts" name="Finish">
    import { onMounted, ref } from "vue"
    import { useRouter } from 'vue-router'

    const props = defineProps<{id: number}>()
    const router = useRouter()

    const src = ref('')
    let type = ''

    function back() {
        router.push({
            name: type == 'quick' ? 'bt_publish' : 'forum_publish',
            params: {id: props.id}
        })
    }

    async function loadData() {
        let msg: Message.Task.TaskID = { id: props.id }
        let taskType: Message.Task.TaskType = JSON.parse(await window.taskAPI.getTaskType(JSON.stringify(msg)))
        type = taskType.type
        let forumLink: Message.Task.ForumLink = JSON.parse(await window.taskAPI.getForumLink(JSON.stringify(msg)))
        if (forumLink.link) src.value = forumLink.link
    }

    onMounted(() => {
        let message: Message.Task.TaskStatus = { id: props.id, step: 'finish' }
        window.taskAPI.setTaskProcess(JSON.stringify(message))
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