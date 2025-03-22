<script setup lang="ts" name="Check">
    import { defineProps, onMounted, ref, computed } from "vue"
    import { Edit, RefreshRight } from '@element-plus/icons-vue'
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
        slbHeight.value = clientHeight.value - 117 + 'px';
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
        else return marked.parse(md.value)

    })
    const bbcode_rendered = computed(() => {
        if (bbcode.value == '') return empty
        let value = bbcode.value.replace(/\n/g, '<br/>')
        return bbobHTML(value, presetHTML5())
    })
    const file_type = ref('html')
    const isRender = ref('true')
    const type = computed<number>(()=>{
        if (file_type.value == 'html' && isRender.value == 'true') return 1
        if (file_type.value == 'html' && isRender.value == 'false') return 2
        if (file_type.value == 'md' && isRender.value == 'true') return 3
        if (file_type.value == 'md' && isRender.value == 'false') return 4
        if (file_type.value == 'bbcode' && isRender.value == 'true') return 5
        if (file_type.value == 'bbcode' && isRender.value == 'false') return 6
        return 0
    })

    //获取任务信息
    async function getTaskInfo() {
        const result = await window.api.CheckTask(props.id)
        html.value = result.html
        md.value = result.md
        bbcode.value = result.bbcode
        title.value = result.title
    }

    //保存文件内容
    async function saveFileContent() {
        let content: string
        if (file_type.value == 'html') content = html.value
        else if (file_type.value == 'md') content = md.value
        else content = bbcode.value
        let result = await window.api.SaveFileContent(props.id, file_type.value, content, title.value)
        if (result)
            ElMessage({
                message: '保存成功',
                type: 'success',
                plain: true,
            })
        else
            ElMessage.error('保存失败')
    }

    //跳转
    function toCreate() {
        router.push({
            name: 'create',
            params: {id: props.id}
        })
    }
    function toPublish() {
        router.push({
            name: 'publish',
            params: {id: props.id}
        })
    }

    onMounted(() => {
        setscrollbar()
        getTaskInfo()
    })

</script>

<template>
    <div :style="{height: slbHeight}">
        <el-scrollbar style="height: 100%;">
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
                            <el-radio-group v-model="file_type">
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
                                    <el-button @click="saveFileContent()" type="primary" :icon="Edit" plain />
                                </el-tooltip>
                                <el-tooltip content="重新加载" placement="top">
                                    <el-button @click="getTaskInfo()" type="primary" :icon="RefreshRight" plain />
                                </el-tooltip>
                            </el-button-group>
                        </span>
                    </div>
                    <el-input v-model="title" style="margin-top: 20px;" />
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
                    <el-button class="btn" @click="toCreate()" type="primary" plain>
                        上一步
                    </el-button>
                    <el-button class="btn" @click="toPublish()" type="primary">
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