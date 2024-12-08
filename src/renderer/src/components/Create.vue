<script setup lang="ts" name="Create">
    import { defineProps, onMounted, ref, reactive, computed } from "vue"
    import type { PublishConfig } from '../index.d.ts'
    import { useRouter } from 'vue-router'
    import type { FormInstance, FormRules } from 'element-plus'

    const props = defineProps<{id: number}>()
    const router = useRouter()

    //设置表单
    const createForm_file = ref()
    const type = ref(true)
    interface ruleForm {
        type: string,
        name: string,
        torrent: string,
        Name_Ch: string,
        Name_En: string,
        Name_Jp: string,
        information: string,
        bit: string,
        resolution: string,
        encoding: string,
        torrent_type: string,
        note: string[],
        category_bangumi: string,
        category_nyaa: string,
        tag: string[],
        path_md: string,
        path_html: string,
        path_bbcode: string, 
        title: string,
        completed?: boolean,
        remake?: boolean
    }
    const config = reactive<ruleForm>({
        type: "file",
        name: "",
        torrent: "",
        Name_Ch: "",
        Name_En: "",
        Name_Jp: "",
        information: '',
        bit: "",
        resolution: "",
        encoding: "",
        torrent_type: "",
        note: [],
        category_bangumi: "",
        category_nyaa: "",
        tag: [],
        path_md: '',
        path_html: '',
        path_bbcode: '',
        title: '',
    })
    const rules = reactive<FormRules<ruleForm>>({
        Name_Ch: [{
            required: true,
            message: '请输入中文标题',
            trigger: 'change'
        }],
        Name_Jp: [{
            required: true,
            message: '请输入日语标题',
            trigger: 'change'
        }],
        Name_En: [{
            required: true,
            message: '请输入英文标题',
            trigger: 'change'
        }],
        bit: [{
            required: true,
            message: '请选择成片位深',
            trigger: 'change'
        }],
        resolution: [{
            required: true,
            message: '请选择成片分辨率',
            trigger: 'change'
        }],
        encoding: [{
            required: true,
            message: '请输选择成片编码格式',
            trigger: 'change'
        }],
        torrent_type: [{
            required: true,
            message: '请选择成片类型',
            trigger: 'change'
        }],
        category_bangumi: [{
            required: true,
            message: '请设置Bangumi分类',
            trigger: 'change'
        }],
        category_nyaa: [{
            required: true,
            message: '请设置Nyaa分类',
            trigger: 'change'
        }],
        information: [{
            required: false,
            message: '请填写Nyaa Information，默认https://vcb-s.com/archives/138',
            trigger: 'change'
        }],
        path_md: [{
            required: true,
            message: '请选择Nyaa描述文件',
            trigger: 'change'
        }],
        path_bbcode: [{
            message: '请选择Acgrip描述文件',
            trigger: 'change'
        }],
        path_html: [{
            required: true,
            message: '请选择Bangumi描述文件',
            trigger: 'change'
        }],
        torrent: [{
            required: true,
            message: '请选择种子文件',
            trigger: 'change'
        }],
        title: [{
            required: true,
            message: '请填写标题',
            trigger: 'change'
        }],
    })
    //设置位深
    const bitOptions = ref([
        {
            label: '10-bit',
            value: '10-bit'
        },
        {
            label: '8-bit',
            value: '8-bit'
        }
    ])
    const isAddingBitOption = ref(false)
    const newBitOption = ref('')
    const onAddBitOption = () => {  isAddingBitOption.value = true  }
    const onConfirmBitOption = () => {
        if (newBitOption.value) {
            bitOptions.value.push({
            label: newBitOption.value,
            value: newBitOption.value,
            })
            clearBitOption()
        }
    }
    const clearBitOption = () => {
        newBitOption.value = ''
        isAddingBitOption.value = false
    }
    //设置分辨率
    const resolutionOptions = ref([
        {
            label: '1080p',
            value: '1080p'
        },
        {
            label: '720p',
            value: '720p'
        }
    ])
    const isAddingResolutionOption = ref(false)
    const newResolutionOption = ref('')
    const onAddResolutionOption = () => {    isAddingBitOption.value = true    }
    const onConfirmResolutionOption = () => {
    if (newBitOption.value) {
        bitOptions.value.push({
        label: newBitOption.value,
        value: newBitOption.value,
        })
        clearBitOption()
    }
    }
    const clearResolutionOption = () => {
        newBitOption.value = ''
        isAddingBitOption.value = false
    }
    //设置Bangumi分类
    const BangumiOptions = [
        {
            label: '合集',
            value: '54967e14ff43b99e284d0bf7'
        },
        {
            label: '剧场版',
            value: '549cc9369310bc7d04cddf9f'
        },
        {
            label: '动画',
            value: '549ef207fe682f7549f1ea90'
        },
        {
            label: '其他',
            value: '549ef250fe682f7549f1ea91'
        },
    ]
    //设置Nyaa分类
    const NyaaOptions = [
        {
            label: 'Anime - English-translated',
            value: '1_2'
        },
        {
            label: 'Anime - Non-English-translated',
            value: '1_3'
        },
        {
            label: 'Anime - Raw',
            value: '1_4'
        },
        {
            label: 'Live Action - English-translated',
            value: '4_1'
        },
        {
            label: 'Live Action - Non-English-translated',
            value: '4_3'
        },
        {
            label: 'Live Action - Raw',
            value: '4_4'
        },
    ]
    //设置Bangumi标签
    const isSearching = ref(false)
    let suggestedBangumiTags =  ref<{label:string, value:string}[]>([])
    let inputBangumiTags= ref<{label:string, value:string}[]>([])
    const BangumiTags = computed(() => {
        return inputBangumiTags.value.concat(suggestedBangumiTags.value)
    })
    async function getBangumiTags() {
        const {data, status} = await window.api.GetBangumiTags(config.title)
        if (status == 200) {
            suggestedBangumiTags.value = []
            for (const item of data) {
                if (item.type != 'misc') suggestedBangumiTags.value.push({label: item.name, value: item._id})
            }
        }
        else if (status == 0) {
            ElMessage.error('请求Bangumi标签建议错误，错误信息详见日志')
        } 
        else {
            ElMessage.error(`获取Bangumi标签建议失败，错误代码:${status}`)
        }
    }
    const searchBangumiTags = async (query: string) =>{
        const {data, status} = await window.api.SearchBangumiTags(query)
        if (status == 200) {
            inputBangumiTags.value = []
            if (data.success) {
                for (const item of data.tag) {
                    if (item.type != 'misc') inputBangumiTags.value.push({label: item.name, value: item._id})
                }
            }
        } 
        else if (status == 0) {
            ElMessage.error('请求Bangumi标签建议错误，错误信息详见日志')
        } 
        else {
            ElMessage.error(`获取Bangumi标签建议失败，错误代码:${status}`)
        }
    }

    //打开文件
    const isLoading = ref(false)
    async function loadFile(type: string) {
        isLoading.value = true
        const file = await window.api.OpenFile(type)
        if (type == 'torrent') config.torrent = file
        else if (type == 'md') config.path_md = file
        else if (type == 'html') config.path_html = file
        else if (type == 'bbcode') config.path_bbcode = file
        isLoading.value = false
    }

    //从文件创建
    const isCreating = ref(false)
    async function createWithFile(formEl : FormInstance | undefined ) {
        if (!formEl) return
        isCreating.value = true
        await formEl.validate(async (valid, _fields) => {
            if (valid) {
                let publishConfig: PublishConfig = {
                    type: 'file',
                    name: '',
                    torrent: config.torrent,
                    information: config.information,
                    category_bangumi: config.category_bangumi,
                    category_nyaa: config.category_nyaa,
                    tag: config.tag,
                    completed: config.completed,
                    remake: config.remake,
                    title: config.title,
                    content: {
                        path_md: config.path_md,
                        path_html: config.path_html,
                        path_bbcode: config.path_bbcode,
                        path_site: '',
                    }
                }
                let result = await window.api.CreateWithFile(props.id, JSON.stringify(publishConfig))
                if (result.includes("success")) {
                    ElMessage({
                        message: '创建成功，即将跳转',
                        type: 'success',
                        plain: true,
                    })
                    setTimeout(() => {
                        router.push({
                            name: 'check',
                            params: { id: props.id }
                        })
                    }, 500);
                } 
                else if (result == "noSuchFile_md") {
                    ElMessage.error("未找到md文件")
                } 
                else if (result == "noSuchFile_html") {
                    ElMessage.error("未找到html文件")
                }
                else if (result == "noSuchFile_md") {
                    ElMessage.error("未找到md文件")
                } 
                else if (result == "taskNotFound") {
                    ElMessage.error("未找到任务")
                }
                else {
                    ElMessage.error(result)
                }
            } else {
                ElMessage.error('请正确填写任务配置')
            }
        })
        isCreating.value = false
    }

    //从文件保存
    const isSaving = ref(false)
    async function saveWithFile() {
        isSaving.value = true
        let publishConfig: PublishConfig = {
            type: 'file',
            name: '',
            torrent: config.torrent,
            information: config.information,
            category_bangumi: config.category_bangumi,
            category_nyaa: config.category_nyaa,
            tag: config.tag,
            completed: config.completed,
            remake: config.remake,
            title: config.title,
            content: {
                path_md: config.path_md,
                path_html: config.path_html,
                path_bbcode: config.path_bbcode,
                path_site: '',
            }
        }
        let result = await window.api.SaveWithFile(props.id, JSON.stringify(publishConfig))
        if (result.includes("success")) {
            ElMessage({
                message: '保存成功',
                type: 'success',
                plain: true,
            })
        } 
        else if (result == 'taskNotFound') {
            ElMessage.error('未找到任务')
        }
        else {
            ElMessage.error(result)
        }
        isSaving.value = false
    }
    
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

    //获取任务信息
    async function getTaskInfo() {
        const result = await window.api.OpenTask(props.id)
        if (result.status == 'notFound'){
            await ElMessageBox.alert('    未找到任务')
            router.push('/')
        }else if (result.status == 'folderNotFound'){
            await ElMessageBox.alert('    未找到任务目录')
            router.push('/')
        }else{
            Object.assign(config, result.config, result.config!.content)
            type.value = result.config!.type == 'file'
            if (config.information === '') config.information = 'https://vcb-s.com/archives/138'
        }
    }

    onMounted(async () => {
        setscrollbar()
        getTaskInfo()
    })
    
</script>

<template>
    <div :style="{height: slbHeight}">
        <el-scrollbar style="height: 100%;">
            <!-- 占行 -->
            <el-row style="height: 20px;" />
            <el-row style="font-size: xx-large; height: 43px;">
                <el-col :span="3" />
                <el-col :span="18">
                    编辑发布配置
                </el-col>
                <el-col :span="3" />
            </el-row>
            <!-- 占行 -->
            <el-row style="height: 20px;" />
            <el-row justify="space-between">
                <el-col :span="3" />
                <el-col :span="18">
                    <div v-if="!type">
                        <!-- 从模板创建 -->
                        <el-form ref="createForm_text" :model="config" label-width="auto" style="max-width: 600px;" :rules="rules">
                            <el-form-item label="中文标题" prop="Name_Ch">
                                <el-input v-model="config.Name_Ch" placeholder="请填写中文标题" />
                            </el-form-item>
                            <el-form-item label="英文标题" prop="Name_En">
                                <el-input v-model="config.Name_En" placeholder="请填写英文标题" />
                            </el-form-item>
                            <el-form-item label="日语标题" prop="Name_Jp">
                                <el-input v-model="config.Name_Jp" placeholder="请填写日语标题" />
                            </el-form-item>
                            <el-form-item label="位深" prop="bit">
                                <el-select v-model="config.bit" placeholder="请填写位深" style="width: 240px">
                                    <el-option
                                    v-for="item in bitOptions"
                                    :key="item.value"
                                    :label="item.label"
                                    :value="item.value"
                                    />
                                    <template #footer>
                                        <el-button v-if="!isAddingBitOption" text bg size="small" @click="onAddBitOption">添加</el-button>
                                        <template v-else>
                                            <el-input
                                            v-model="newBitOption"
                                            class="option-input"
                                            placeholder="添加位深选项"
                                            size="small"
                                            />
                                            <el-button type="primary" size="small" @click="onConfirmBitOption">确认</el-button>
                                            <el-button size="small" @click="clearBitOption">取消</el-button>
                                        </template>
                                    </template>
                                </el-select>
                            </el-form-item>
                            <el-form-item label="分辨率" prop="resolution">
                                <el-select v-model="config.resolution" placeholder="请填写分辨率" style="width: 240px">
                                    <el-option
                                    v-for="item in resolutionOptions"
                                    :key="item.value"
                                    :label="item.label"
                                    :value="item.value"
                                    />
                                    <template #footer>
                                        <el-button v-if="!isAddingResolutionOption" text bg size="small" @click="onAddResolutionOption">添加</el-button>
                                        <template v-else>
                                            <el-input
                                            v-model="newResolutionOption"
                                            class="option-input"
                                            placeholder="添加分辨率选项"
                                            size="small"
                                            />
                                            <el-button type="primary" size="small" @click="onConfirmResolutionOption">确认</el-button>
                                            <el-button size="small" @click="clearResolutionOption">取消</el-button>
                                        </template>
                                    </template>
                                </el-select>
                            </el-form-item>
                        </el-form>
                    </div>
                    <div v-else>
                        <!-- 从文件创建 -->
                        <el-form ref="createForm_file" :model="config" label-width="auto" style="max-width: 1050px;" :rules="rules">
                            <el-form-item label="标题" prop="title">
                                <el-input v-model="config.title" placeholder="请填写标题" @blur="getBangumiTags()"/>
                            </el-form-item>
                            <el-form-item label="种子文件路径" prop="torrent">
                                <el-input placeholder="选择一个文件" v-model="config.torrent" class="input-with-select">
                                    <template #append>
                                        <el-button @click="loadFile('torrent')" v-loading.fullscreen.lock="isLoading">
                                            <el-icon><FolderOpened /></el-icon>
                                        </el-button>
                                    </template>
                                </el-input>
                            </el-form-item>
                            <el-form-item label="html文件路径" prop="path_html">
                                <el-input placeholder="选择一个文件" v-model="config.path_html" class="input-with-select">
                                    <template #append>
                                        <el-button @click="loadFile('html')" v-loading.fullscreen.lock="isLoading">
                                            <el-icon><FolderOpened /></el-icon>
                                        </el-button>
                                    </template>
                                </el-input>
                            </el-form-item>
                            <el-form-item label="md文件路径" prop="path_md">
                                <el-input placeholder="选择一个文件" v-model="config.path_md" class="input-with-select">
                                    <template #append>
                                        <el-button @click="loadFile('md')" v-loading.fullscreen.lock="isLoading">
                                            <el-icon><FolderOpened /></el-icon>
                                        </el-button>
                                    </template>
                                </el-input>
                            </el-form-item>
                            <el-form-item label="bbcode文件路径" prop="path_bbcode">
                                <el-input placeholder="选择一个文件，若使用Bangumi团队同步留空" v-model="config.path_bbcode" class="input-with-select">
                                    <template #append>
                                        <el-button @click="loadFile('bbcode')" v-loading.fullscreen.lock="isLoading">
                                            <el-icon><FolderOpened /></el-icon>
                                        </el-button>
                                    </template>
                                </el-input>
                            </el-form-item>
                            <el-form-item label="Bangumi标签">
                                <el-select
                                    v-model="config.tag"
                                    multiple
                                    filterable
                                    remote
                                    reserve-keyword
                                    remote-show-suffix
                                    placeholder="请选择或添加Bangumi标签"
                                    :remote-method="searchBangumiTags"
                                    :loading="isSearching"
                                    style="width: 750px"
                                >
                                    <el-option
                                    v-for="item in BangumiTags"
                                    :key="item.value"
                                    :label="item.label"
                                    :value="item.value"
                                    />
                                </el-select>
                            </el-form-item>
                            <el-form-item label="Bangumi分类" prop="category_bangumi">
                                <el-select v-model="config.category_bangumi" placeholder="选择一个分类" style="width: 240px">
                                    <el-option 
                                    v-for="item in BangumiOptions"
                                    :key="item.value"
                                    :label="item.label"
                                    :value="item.value" 
                                    />
                                </el-select>
                            </el-form-item>
                            <el-form-item label="Nyaa Info" prop="information">
                                <el-input v-model="config.information" placeholder="https://vcb-s.com/archives/138"/>
                            </el-form-item>
                            <el-form-item label="Nyaa分类" prop="category_nyaa">
                                <el-select v-model="config.category_nyaa" placeholder="选择一个分类" style="width: 240px">
                                    <el-option 
                                    v-for="item in NyaaOptions"
                                    :key="item.value"
                                    :label="item.label"
                                    :value="item.value" 
                                    />
                                </el-select>
                            </el-form-item>
                            <el-form-item label="Nyaa配置项">
                                <el-checkbox label="Complete" v-model="config.completed" border />
                                <el-checkbox label="Remake" v-model="config.remake" border />
                            </el-form-item>
                        </el-form>
                    </div>
                </el-col>
                <el-col :span="3" />
            </el-row>
            <el-row class="title">
                <el-col>
                    <el-button class="btn" :loading="isSaving" @click="saveWithFile()" type="primary" plain>
                        保存
                    </el-button>
                    <el-button class="btn" :loading="isCreating" @click="createWithFile(createForm_file)" type="primary">
                        下一步
                    </el-button>  
                </el-col>  
            </el-row>
            <el-row style="height: 20px;" />
        </el-scrollbar>
    </div>
</template>

<style scoped>
.option-input {
  width: 100%;
  margin-bottom: 8px;
}

.title {
    text-align: center;
    font-size: xx-large;
}

.btn {
    width: 180px;
}
</style>