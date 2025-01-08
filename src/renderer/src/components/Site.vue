<script setup lang="ts" name="Site">
    import { defineProps, onMounted, ref, reactive } from "vue"
    import { useRouter } from 'vue-router'
    import { Upload, Search } from '@element-plus/icons-vue'

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

    //数据
    type Tabledata = {
        id: number
        title: string
        content: string
    }
    const isRS = ref<boolean>(false)
    const rstitle = ref<string>('')
    const rsID = ref<number>(0)
    const tableData = ref<Tabledata[]>([])
    const publishInfo = ref<string[]>([])
    const content = ref<string>('')
    const title = ref<string>('')
    const imgsrc = ref<string>('')
    const category = ref<number[]>([])
    const options = [
        {
            label: '1080p Full HD',
            value: 2
        },
        {
            label: '作品项目',
            value: 21
        },
        {
            label: '4K UHD',
            value: 3
        },
        {
            label: '720p HD',
            value: 5
        },
        {
            label: '音乐/专题',
            value: 24
        },
    ]

    //RS搜索文章
    async function searchPosts() {
        const result = await window.api.SearchPosts(rstitle.value)
        tableData.value = result
    }

    //RS选择文章
    function handleCurrentChange(val: Tabledata | undefined) {
        rsID.value = val ? val.id : 0
    }

    //上传文件
    const isLoading = ref(false)
    async function readFileContent() {
        isLoading.value = true
        const result = await window.api.ReadFileContent()
        content.value = result
        isLoading.value = false
    }
    async function loadFile(type: string) {
        isLoading.value = true
        imgsrc.value = await window.api.OpenFile(type)
        isLoading.value = false
    }

    //路由跳转
    function toPublish() {
        router.push({
            name: 'publish',
            params: {id: props.id}
        })
    }
    function toFinish() {
        router.push({
            name: 'finish',
            params: {id: props.id}
        })
    }

    //提交发布内容
    const isPublishing = ref(false)
    async function submit() {
        let result: string
        if (isRS)
            result = await window.api.SiteRSPublish(props.id, rsID.value, title.value, content.value)
        else
            result = await window.api.SitePublish(props.id ,JSON.stringify(category.value), imgsrc.value, title.value, content.value)
        if (result == 'empty')
            ElMessage.error('标题或内容为空')
        else if (result == 'unauthorized') 
            ElMessage.error('账号密码错误')
        else if (result == 'failed')
            ElMessage.error('发布失败，详见日志')
        else if (result == 'noSuchFile_webp')
            ElMessage.error('未找到图片文件')
        else if (result == 'success') {
            ElMessage({
                message: '发布成功，即将跳转',
                type: 'success',
                plain: true,
            })
            setTimeout(() => {
                router.push({
                    name: 'finish',
                    params: { id: props.id }
                })
            }, 500);
        }
    }

    //加载信息
    async function loadData() {
        const result = await window.api.GetSiteInfo(props.id)
        publishInfo.value = result.slice(0, 6)
        content.value = result[6]
        title.value = result[7]
    }

    //右键复制事件
    function handleRightClick(str: string) {
        window.api.WriteClipboard(str)
        ElMessage('复制成功')
    }

    onMounted(() => {
        setscrollbar()
        loadData()
    })

</script>

<template>
     <div :style="{height: slbHeight}">
        <el-scrollbar style="height: 100%;">
            <el-row style="height: 20px;" />
            <el-row style="font-size: xx-large; height: 43px; ">
                <el-col :span="3" />
                <el-col :span="18">
                    主站发布
                </el-col>
                <el-col :span="3" />
            </el-row>
            <el-row style="height: 20px;" />
            <el-row justify="space-between">
                <el-col :span="3" />
                <el-col :span="18">
                    <div>
                        <el-form label-width="auto">
                            <el-form-item label="标题">
                                <el-input v-model="title" placeholder="请填写标题"/>
                            </el-form-item>
                            <el-form-item label="主站发布图">
                                <el-input placeholder="选择一张图片，RS项目可留空" v-model="imgsrc">
                                    <template #append>
                                        <el-button @click="loadFile('webp')" v-loading.fullscreen.lock="isLoading">
                                            <el-icon><FolderOpened /></el-icon>
                                        </el-button>
                                    </template>
                                </el-input>
                            </el-form-item>
                            <el-form-item label="分类">
                                <el-select
                                    v-model="category"
                                    multiple
                                    placeholder="选择类别"
                                    style="width: 250px"
                                >
                                    <el-option
                                        v-for="item in options"
                                        :label="item.label"
                                        :value="item.value"
                                    />
                                </el-select>
                            </el-form-item>
                            <el-form-item label="RS选项">
                                <el-checkbox v-model="isRS" label="RS覆盖原帖" />
                            </el-form-item>
                            <el-form-item v-show="isRS" label="选择RS文章">
                                <el-input placeholder="输入标题以进行搜索" v-model="rstitle">
                                    <template #append>
                                        <el-button :icon="Search" @click="searchPosts()" />
                                    </template>
                                </el-input>
                                <el-table :data="tableData" highlight-current-row
                                @current-change="handleCurrentChange">
                                    <el-table-column prop="id" label="ID" width="70" />
                                    <el-table-column label="文章标题">
                                        <template #default="scope">
                                            <el-popover
                                                placement="bottom"
                                                title="文章内容"
                                                :width="800"
                                                trigger="hover"
                                                raw-content
                                            >
                                                <template #reference>
                                                    {{ scope.row.title }}
                                                </template>
                                                <template #default>
                                                    <div v-html="scope.row.content" />
                                                </template>
                                            </el-popover>
                                        </template>
                                    </el-table-column>
                                </el-table>
                            </el-form-item>
                        </el-form>
                    </div>
                    <el-collapse>
                        <el-collapse-item title="BT链接">
                            <p v-for="item in publishInfo" @contextmenu.prevent="handleRightClick(item.split('：')[1])">{{ item }}</p>
                        </el-collapse-item>
                    </el-collapse>
                    <el-row style="height: 20px;" />
                    <span style="font-size: large; font-weight: bold;">主站发布稿</span>
                    <span style="float: right;text-align: right;">
                        <el-button :icon="Upload" 
                        @click="readFileContent()"
                        v-loading.fullscreen.lock="isLoading">
                            选择一个文件
                        </el-button>
                    </span>
                    <el-row style="height: 20px;" />
                    <el-input
                        v-model="content"
                        :autosize="{minRows:20}"
                        type="textarea"
                        placeholder="主站发布稿"
                    />
                </el-col>
                <el-col :span="3" />
            </el-row>
            <el-row style="height: 20px;" />
            <el-row class="title">
                <el-col>
                    <el-button class="btn" @click="toPublish()">
                        上一步
                    </el-button>
                    <el-button class="btn" @click="toFinish()" type="primary" plain>
                        跳过
                    </el-button>  
                    <el-button class="btn" :loading="isPublishing" @click="submit()" type="primary">
                        发布
                    </el-button>  
                </el-col>  
            </el-row>
            <el-row style="height: 20px;" />
        </el-scrollbar>
    </div>
</template>

<style scoped>
.title {
    text-align: center;
    font-size: xx-large;
}

.btn {
    width: 180px;
}
</style>