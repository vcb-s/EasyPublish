<script setup lang="ts" name="Site">
    import { defineProps, onMounted, ref } from "vue"
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
        raw: string
    }
    const isRS = ref<boolean>(false)
    const rstitle = ref<string>('')
    const rsID = ref<number>(0)
    const tableData = ref<Tabledata[]>([])
    const publishInfo = ref<string[]>([])
    const BTLinks = ref<string[]>([])
    const content = ref<string>('')
    const title = ref<string>('')
    const imgsrc = ref<string>('')
    const category = ref<number[]>([2, 21])
    const credit_name = ref<string>('')
    const credit_link = ref<string>('')
    const mediaInfo = ref<string>('')
    const oldLinks = ref<string>('')
    const oldComment = ref<string>('')
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

    //添加Credit信息
    function addCredit() {
        if (credit_link.value == '') return
        let credit = `Image Credit: <a href="${credit_link.value}" rel="noopener" target="_blank">${credit_name.value}</a>\n\n<label`
        content.value = content.value.replace('<label', credit)
    }
    //添加MediaInfo
    function addMediaInfo() {
        if (mediaInfo.value == '') return
        content.value = content.value.replace('请将MediaInfo放置于此', mediaInfo.value)
    }
    //添加旧链
    function addLinks() {
        if (oldLinks.value == '') return
        content.value = content.value.replace('请将旧链放于此', oldLinks.value)
    }
    //添加过往修正
    function addComments() {
        if (oldComment.value == '') return
        content.value = content.value.replace(/(\[box\sstyle="info"\][\s\S]*?重发修正[\s\S]*?\[\/box\])/, '$1\n\n' + oldComment.value)
    }

    //整理BT链接
    function generateLinks() {
        let content: string = ''
        for (let i = 0; i < 6; i++)
            if (BTLinks.value[i] != '' && BTLinks.value[i] != '未找到链接')
                content += `<a href="${BTLinks.value[i]}">${BTLinks.value[i]}</a>\n\n`
        return content
    }
    //复制BT链接
    function copyLinks() {
        window.api.WriteClipboard(generateLinks())
    }

    //RS搜索文章
    async function searchPosts() {
        const result = await window.api.SearchPosts(rstitle.value)
        tableData.value = result
    }

    //RS选择文章
    function handleCurrentChange(val: Tabledata | undefined) {
        if (val) {
            rsID.value = val.id
            let raw = tableData.value.find(item => item.id == rsID.value)!.raw
            let info = raw.match(/<pre[\s\S]*?>[\s]*([\s\S]*?)\s<\/pre>/)
            if (info) {
                mediaInfo.value = info[1]
            }
            let credit = raw.match(/Image\sCredit[\s\S]*?href="([\s\S]*?)"[\s\S]*?>([\s\S]*?)<\/a>/)
            if (credit)
                [,credit_link.value,credit_name.value] = credit
            let links = raw.match(/\[box\sstyle="download"\][\s\S]*?\[\/box\]/g)
            let comments = raw.match(/\[box\sstyle="info"\][\s\S]*?重发修正[\s\S]*?\[\/box\]/g)
            oldComment.value = ''
            oldLinks.value = ''
            if (links) {
                links.forEach((_item, index) => {
                    links[index] = links[index].replace(/(\s)(<a[\s\S]*?<\/a>)(\s)/g, '$1<del>$2</del>$3')
                    oldLinks.value += links[index]
                    if (index < links.length - 1)
                        oldLinks.value += '\n\n'
                });
            }
            if (comments) {
                comments.forEach((_item, index) => {
                    oldComment.value += comments[index]
                    if (index < comments.length - 1)
                        oldComment.value += '\n\n'
                });
            }
            ElMessageBox.confirm('是否立即填入？', '提示', {
                confirmButtonText: '填入',
                cancelButtonText: '取消',
                type: 'info',
            }).then(() => {
                addComments()
                addCredit()
                addLinks()
            })
        }
        else {
            rsID.value = 0
        }
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
        isPublishing.value = true
        if (isRS.value)
            result = await window.api.SiteRSPublish(props.id, rsID.value, title.value, content.value)
        else
            result = await window.api.SitePublish(props.id ,JSON.stringify(category.value), imgsrc.value, title.value, content.value)
        if (result == 'empty')
            ElMessage.error('标题或内容为空')
        else if (result == 'unauthorized') 
            ElMessage.error('认证失败，请检查账号密码')
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
        isPublishing.value = false
    }

    //加载信息
    async function loadData() {
        const result = await window.api.GetSiteInfo(props.id)
        if (result[6] != '') title.value = result[0]
        if (result[7] != '') content.value = result[1]
        if (result[8] != '') imgsrc.value = result[2]
    }
    const loadingBT = ref(true)
    async function loadBT() {
        loadingBT.value = true
        const result = await window.api.GetBTLinks(props.id)
        BTLinks.value = result.slice(0, 6)
        publishInfo.value = []
        publishInfo.value.push('萌番组：' + result[0])
        publishInfo.value.push('Nyaa：' + result[1])
        publishInfo.value.push('Acgrip：' + result[2])
        publishInfo.value.push('动漫花园：' + result[3])
        publishInfo.value.push('Acgnx：' + result[4])
        publishInfo.value.push('末日动漫：' + result[5])
        if (result[6] == 'true')
            content.value = content.value.replace('链接加载中', generateLinks())
        loadingBT.value = false
        ElMessage('加载完成')
    }

    //右键复制事件
    function handleRightClick(str: string) {
        window.api.WriteClipboard(str)
        ElMessage('复制成功')
    }

    onMounted(async () => {
        setscrollbar()
        await loadData()
        loadBT()
    })

</script>

<template>
     <div :style="{height: slbHeight}">
        <el-scrollbar style="height: 100%;">
            <el-row>
                <el-col :span="3" />
                <el-col :span="18">
                    <span style="float: left">
                        <el-link :underline="false" @click="toPublish" type="primary"><el-icon><ArrowLeft /></el-icon>上一步</el-link>
                    </span>
                    <span style="float: right">
                        <el-link :underline="false" @click="toFinish" type="primary">跳过<el-icon><ArrowRight /></el-icon></el-link>
                    </span>
                </el-col>
                <el-col :span="3" />
            </el-row>
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
                                @current-change="handleCurrentChange" style="margin-top: 10px;">
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
                            <el-form-item v-if="!isRS" label="主站发布图">
                                <el-input placeholder="选择一张图片，RS项目可留空" v-model="imgsrc">
                                    <template #append>
                                        <el-button @click="loadFile('webp')" v-loading.fullscreen.lock="isLoading">
                                            <el-icon><FolderOpened /></el-icon>
                                        </el-button>
                                    </template>
                                </el-input>
                            </el-form-item>
                            <el-form-item v-if="!isRS" label="分类">
                                <el-select-v2 v-model="category" :options="options"
                                    multiple placeholder="选择类别" style="width: 250px" />
                            </el-form-item>
                        </el-form>
                    </div>
                    <el-collapse>
                        <el-collapse-item title="BT链接">
                            <div v-loading="loadingBT">
                                <el-link :underline="false" @click="loadBT()" type="primary">刷新<el-icon><Refresh /></el-icon></el-link>
                                <el-link :underline="false" @click="copyLinks()" type="primary" style="margin-left: 10px;">复制<el-icon><DocumentCopy /></el-icon></el-link>
                                <p v-for="item in publishInfo" @contextmenu.prevent="handleRightClick(item.split('：')[1])">{{ item }}</p>
                            </div>
                        </el-collapse-item>
                        <el-collapse-item title="填写模板">
                            <h3>Credit信息：</h3>
                            <div>
                                <span>
                                    <span>署名：</span>
                                    <span>
                                        <el-input style="width: 120px;" v-model="credit_name" />
                                    </span>
                                </span>
                                <span>
                                    <span style="margin-left: 20px;">链接：</span>
                                    <span>
                                        <el-input style="width: 320px;" v-model="credit_link" />
                                    </span>
                                </span>
                                <span>
                                    <el-button style="margin-left: 20px;" @click="addCredit()">添加Credit信息</el-button>
                                </span>
                            </div>
                            <h3>MediaInfo:</h3>
                            <div>
                                <el-input
                                    v-model="mediaInfo"
                                    :autosize="{minRows:20}"
                                    type="textarea"
                                    placeholder="请填写MediaInfo"
                                />
                                <el-button style="margin-top: 20px;" @click="addMediaInfo()">添加MediaInfo</el-button>
                            </div>
                            <h3 v-if="isRS">RS旧链：</h3>
                            <div v-if="isRS">
                                <el-input
                                    v-model="oldLinks"
                                    :autosize="{minRows:10}"
                                    type="textarea"
                                    placeholder="请填写旧链"
                                />
                                <el-button style="margin-top: 20px;" @click="addLinks()">添加旧链</el-button>
                            </div>
                            <h3 v-if="isRS">过往修正：</h3>
                            <div v-if="isRS">
                                <el-input
                                    v-model="oldComment"
                                    :autosize="{minRows:10}"
                                    type="textarea"
                                    placeholder="填写过往修正"
                                />
                                <el-button style="margin-top: 20px;" @click="addComments()">添加过往修正</el-button>
                            </div>
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