<script setup lang="ts" name="Check">
    import { onMounted, ref, computed } from "vue"
    import { Edit, RefreshRight, Upload } from '@element-plus/icons-vue'
    import { marked } from 'marked'
    import bbobHTML from '@bbob/html'
    import presetHTML5 from '@bbob/preset-html5'
    import { useRouter } from 'vue-router'

    const props = defineProps<{id: number}>()
    const router = useRouter()

    //设置滚动条区域高度
    const slbHeight = ref('')
    const clientHeight = ref(0)
    function setHeight() {
        clientHeight.value =  document.documentElement.clientHeight;
        slbHeight.value = clientHeight.value - 137 + 'px';
    }
    function setscrollbar() {
        setHeight()
        window.onresize = setHeight
    }

    //设置展示内容
    const empty = '<div style="height: 200px; align-items: center; display: flex; font-size: xx-large; justify-content: center;"><div>无内容</div></div>';
    const html = ref('')
    const md = ref('')
    const bbcode = ref('')
    const title = ref('')
    const html_rendered = computed(() => {
        if (html.value == '') return empty
        else return html.value
    })
    const md_rendered = computed(() => {
        if (md.value == '') return empty
        else return marked.parse(md.value, { async: false })

    })
    const bbcode_rendered = computed(() => {
        if (bbcode.value == '') return empty
        let value = bbcode.value.replace(/\n/g, '<br/>')
        return bbobHTML(value, presetHTML5())
    })
    const fileType = ref('html')
    const isRender = ref('true')
    const type = computed<number>(()=>{
        if (fileType.value == 'html' && isRender.value == 'true') return 1
        if (fileType.value == 'html' && isRender.value == 'false') return 2
        if (fileType.value == 'md' && isRender.value == 'true') return 3
        if (fileType.value == 'md' && isRender.value == 'false') return 4
        if (fileType.value == 'bbcode' && isRender.value == 'true') return 5
        if (fileType.value == 'bbcode' && isRender.value == 'false') return 6
        return 0
    })

    //获取任务信息
    async function loadData() {
        let msg: Message.Task.TaskID = { id: props.id }
        const result = JSON.parse(await window.taskAPI.getContent(JSON.stringify(msg)))
        html.value = result.html
        md.value = result.md
        bbcode.value = result.bbcode
        title.value = result.title
    }

    //保存文件内容
    async function saveContent() {
        let content: string
        if (fileType.value == 'html') content = html.value
        else if (fileType.value == 'md') content = md.value
        else content = bbcode.value
        let msg: Message.Task.ModifiedContent = {
            id: props.id,
            type: fileType.value,
            content
        }
        window.taskAPI.saveContent(JSON.stringify(msg))
    }
    //保存标题
    async function saveTitle() {
        let msg: Message.Task.ModifiedTitle = { 
            id: props.id, 
            title: title.value 
        }
        window.taskAPI.saveTitle(JSON.stringify(msg))
    }

    //导出文件内容
    async function exportContent() {
        let msg: Message.Task.ContentType = {
            id: props.id,
            type: fileType.value
        }
        window.taskAPI.exportContent(JSON.stringify(msg))
    }

    //跳转
    function back() {
        router.push({
            name: 'edit',
            params: {id: props.id}
        })
    }
    function next() {
        router.push({
            name: 'bt_publish',
            params: {id: props.id}
        })
    }

    onMounted(() => {
        setscrollbar()
        let message: Message.Task.TaskStatus = { id: props.id, step: 'check' }
        window.taskAPI.setTaskProcess(JSON.stringify(message))
        loadData()
    })

</script>

<template>
    <div :style="{height: slbHeight}">
        <el-scrollbar style="height: 100%;">
            <el-row>
                <el-col :span="3" />
                <el-col :span="18">
                    <span style="float: left">
                        <el-link :underline="false" @click="back" type="primary"><el-icon><ArrowLeft /></el-icon>上一步</el-link>
                    </span>
                    <span style="float: right">
                        <el-link :underline="false" @click="next" type="primary">下一步<el-icon><ArrowRight /></el-icon></el-link>
                    </span>
                </el-col>
                <el-col :span="3" />
            </el-row>
            <el-row style="height: 20px;" />
            <el-row style="font-size: xx-large; height: 43px; ">
                <el-col :span="3" />
                <el-col :span="18">
                    复核发布内容
                </el-col>
                <el-col :span="3" />
            </el-row>
            <el-row style="height: 20px;" />
            <el-row justify="space-between">
                <el-col :span="3" />
                <el-col :span="18">
                    <div>
                        <span>
                            <el-radio-group v-model="fileType">
                                <el-radio-button label="Html" value="html" />
                                <el-radio-button label="Markdown" value="md" />
                                <el-radio-button label="BBCode" value="bbcode" />
                            </el-radio-group>
                        </span>
                        <span style="margin-left: 20px;">
                            <el-radio-group v-model="isRender">
                                <el-radio-button label="预览" value="true" />
                                <el-radio-button label="源码" value="false" />
                            </el-radio-group>
                        </span>
                        <span>
                            <el-button-group style="float: right;text-align: right;">
                                <el-tooltip content="保存" placement="top">
                                    <el-button @click="saveContent()" type="primary" :icon="Edit" plain />
                                </el-tooltip>
                                <el-tooltip content="重新加载" placement="top">
                                    <el-button @click="loadData()" type="primary" :icon="RefreshRight" plain />
                                </el-tooltip>
                                <el-tooltip content="导出" placement="top">
                                    <el-button @click="exportContent()" type="primary" :icon="Upload" plain />
                                </el-tooltip>
                            </el-button-group>
                        </span>
                    </div>
                    <el-input v-model="title" style="margin-top: 20px;" maxlength="128" show-word-limit @blur="saveTitle"/>
                </el-col>
                <el-col :span="3" />
            </el-row>
            <el-row style="height: 20px;" />
            <el-row justify="space-between">
                <el-col :span="3" />
                <el-col :span="18">
                    <div class="container" v-if="type == 1">
                        <div v-html="html_rendered"></div>
                    </div>
                    <div v-if="type==2">
                        <el-input
                            v-model="html"
                            :autosize="{minRows:10}"
                            type="textarea"
                            placeholder="未找到html文件"
                        />
                    </div>
                    <div class="container" v-if="type == 3">
                        <div v-html="md_rendered"></div>
                    </div>
                    <div v-if="type==4">
                        <el-input
                            v-model="md"
                            :autosize="{minRows:10}"
                            type="textarea"
                            placeholder="未找到md文件"
                        />
                    </div>
                    <div class="container" v-if="type==5">
                        <div v-html="bbcode_rendered"></div>
                    </div>
                    <div v-if="type==6">
                        <el-input
                            v-model="bbcode"
                            :autosize="{minRows:10}"
                            type="textarea"
                            placeholder="未找到bbcode文件"
                        />
                    </div>
                </el-col>
                <el-col :span="3" />
            </el-row>
            <el-row style="height: 20px;" />
            <el-row class="title">
                <el-col>
                    <el-button class="btn" @click="back" type="primary" plain>
                        上一步
                    </el-button>
                    <el-button class="btn" @click="next" type="primary">
                        下一步
                    </el-button>  
                </el-col>  
            </el-row>
            <el-row style="height: 20px;" />
        </el-scrollbar>
    </div>
</template>

<style scoped>

.container {
    padding: 10px;
    background-color: var(--el-fill-color-light);
    border-radius: 5px;
    border-color: var(--el-fill-color-dark);
    border-style: solid;
}

.btn {
    width: 180px;
}

.title {
    text-align: center;
    font-size: xx-large;
}

</style>