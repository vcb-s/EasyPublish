<script setup lang="ts" name="Modify">
    import { onMounted, ref, computed, reactive, watch } from "vue"
    import { useDark } from '@vueuse/core'
    import { Edit, View, CopyDocument, Link, Search, RefreshRight, Upload } from '@element-plus/icons-vue'
    import { Codemirror } from 'vue-codemirror'
    import { html } from '@codemirror/lang-html'
    import { oneDark } from '@codemirror/theme-one-dark'
    import { marked } from 'marked'
    import bbobHTML from '@bbob/html'
    import presetHTML5 from '@bbob/preset-html5'

    //设置滚动条区域高度
    const slbHeight = ref('')
    const clientHeight = ref(0)
    function setHeight() {
        clientHeight.value =  document.documentElement.clientHeight;
        slbHeight.value = clientHeight.value - 60 + 'px';
    }
    function setscrollbar() {
        setHeight()
        window.onresize = setHeight
    }

    //编辑器设置
    const isDark = useDark()
    let extensions
    function changeTheme() {
        if (isDark.value)
            extensions = [html(), oneDark]
        else extensions = [html()]
    }
    watch(isDark, changeTheme)

    //设置表格数据
    let siteName = {
        bangumi: '萌番组',
        nyaa: 'Nyaa',
        acgrip: 'Acgrip',
        dmhy: '动漫花园',
        acgnx_a: '末日动漫',
        acgnx_g: 'AcgnX'
    }
    const condition = ref(' ')
    type Tabledata = Message.BT.TorrentDetail.Details
    const tabledata = computed(() => {
        if (condition.value == '')
            return data
        else 
            return data.filter(item => item.title.includes(condition.value))
    })
    const data = reactive<Tabledata[]>([])

    //设置对话框
    const empty = '<div style="height: 200px; align-items: center; display: flex; font-size: xx-large; justify-content: center;"><div>加载中</div></div>';
    const isViewing = ref(false)
    const isEditing = ref(false)
    const isMultiEdit = ref(false)
    const isLoadingContent = ref(false)
    const sourceType = ref('')
    const dialogTitle = ref('')
    const renderedContent = ref(empty)
    const title = ref('')
    const content = ref('')
    const checkList = ref<string[]>([])
    const torrentIndex = ref<number>(-1)
    //关闭对话框重置设置
    function resetDialog() {
        sourceType.value = ''
        dialogTitle.value = ''
        renderedContent.value = empty
        title.value = ''
        content.value = ''
        torrentIndex.value = -1
        isMultiEdit.value = false
        checkList.value = []
    }
    //唤起查看对话框
    async function openViewDialog(type: string, id: string) {
        isViewing.value = true
        isLoadingContent.value = true
        if (type == 'bangumi') {
            dialogTitle.value = '查看萌番组上的内容'
            renderedContent.value = data.find(item => item.bangumi && item.bangumi.id == id)!.bangumi!.content!.content
        }
        if (type == 'nyaa') {
            dialogTitle.value = '查看Nyaa上的内容'
            let info = data.find(item => item.nyaa && item.nyaa.id === id)!.nyaa!
            if (!info.is_loaded) {
                info.content = await getDetails<Message.BT.TorrentDetail.NyaaContent>(type, id)
                info.is_loaded = true
            }
            renderedContent.value = marked.parse(info.content!.content, { async: false })
        }
        if (type == 'acgrip') {
            dialogTitle.value = '查看Acgrip上的内容'
            let info = data.find(item => item.acgrip && item.acgrip.id == id)!.acgrip!
            if (!info.is_loaded) {
                info.content = await getDetails<Message.BT.TorrentDetail.AcgripContent>(type, id)
                info.is_loaded = true
            }
            let value = info.content!.content.replace(/\n/g, '<br/>')
            renderedContent.value = bbobHTML(value, presetHTML5())
        }
        if (type == 'dmhy') {
            dialogTitle.value = '查看动漫花园上的内容'
            let info = data.find(item => item.dmhy && item.dmhy.id == id)!.dmhy!
            if (!info.is_loaded) {
                info.content = await getDetails<Message.BT.TorrentDetail.DmhyContent>(type, id)
                info.is_loaded = true
            }
            renderedContent.value = info.content!.content
        }
        if (type == 'acgnx_a') {
            dialogTitle.value = '查看末日动漫上的内容'
            let info = data.find(item => item.acgnx_a && item.acgnx_a.id == id)!.acgnx_a!
            if (!info.is_loaded) {
                info.content = await getDetails<Message.BT.TorrentDetail.AcgnxContent>(type, id)
                info.is_loaded = true
            }
            renderedContent.value = info.content!.content
        }
        if (type == 'acgnx_g') {
            dialogTitle.value = '查看AcgnX上的内容'
            let info = data.find(item => item.acgnx_g && item.acgnx_g.id == id)!.acgnx_g!
            if (!info.is_loaded) {
                info.content = await getDetails<Message.BT.TorrentDetail.AcgnxContent>(type, id)
                info.is_loaded = true
            }
            renderedContent.value = info.content!.content
        }
        isLoadingContent.value = false
    }
    //唤起编辑对话框
    async function openEditDialog(type: string, id: string, postTitle: string) {
        isEditing.value = true
        isLoadingContent.value = true
        title.value = postTitle
        sourceType.value = type
        let index = data.findIndex(item => item.title == postTitle)
        torrentIndex.value = index
        if (type == 'bangumi') {
            dialogTitle.value = '修改萌番组上的内容'
            let str = data[index].bangumi!.content!.content
            content.value = str.replaceAll('<br>', '<br>\n').replace(/(>)(<)(\/*)/g, '$1\n$2$3')
        }
        if (type == 'nyaa') {
            dialogTitle.value = '修改Nyaa上的内容'
            let info = data[index].nyaa!
            if (!info.is_loaded) {
                info.content = await getDetails<Message.BT.TorrentDetail.NyaaContent>(type, id)
                info.is_loaded = true
            }
            content.value = info.content!.content
        }
        if (type == 'acgrip') {
            dialogTitle.value = '修改Acgrip上的内容'
            let info = data[index].acgrip!
            if (!info.is_loaded) {
                info.content = await getDetails<Message.BT.TorrentDetail.AcgripContent>(type, id)
                info.is_loaded = true
            }
            content.value = info.content!.content
        }
        if (type == 'dmhy') {
            dialogTitle.value = '修改动漫花园上的内容'
            let info = data[index].dmhy!
            if (!info.is_loaded) {
                info.content = await getDetails<Message.BT.TorrentDetail.DmhyContent>(type, id)
                info.is_loaded = true
            }
            content.value = info.content!.content
        }
        if (type == 'acgnx_a') {
            dialogTitle.value = '修改末日动漫上的内容'
            let info = data[index].acgnx_a!
            if (!info.is_loaded) {
                info.content = await getDetails<Message.BT.TorrentDetail.AcgnxContent>(type, id)
                info.is_loaded = true
            }
            content.value = info.content!.content
        }
        if (type == 'acgnx_g') {
            dialogTitle.value = '修改AcgnX上的内容'
            let info = data[index].acgnx_g!
            if (!info.is_loaded) {
                info.content = await getDetails<Message.BT.TorrentDetail.AcgnxContent>(type, id)
                info.is_loaded = true
            }
            content.value = info.content!.content
        }
        isLoadingContent.value = false
    }
    //批量编辑
    async function multiEdit(postTitle: string) {
        isEditing.value = true
        isMultiEdit.value = true
        dialogTitle.value = '批量修改'
        title.value = postTitle
        let index = data.findIndex(item => item.title == postTitle)
        torrentIndex.value = index
        if (data[index].bangumi)
            content.value = data[index].bangumi.content!.content.replaceAll('<br>', '<br>\n').replace(/(>)(<)(\/*)/g, '$1\n$2$3')
    }
    //获取详情
    async function getDetails<T extends Message.BT.TorrentDetail.Content = any>(type: string, id: string) {
        try {
            let msg: Message.BT.TorrentInfo = { id, type }
            let result: T = JSON.parse(await window.BTAPI.getTorrentDetail(JSON.stringify(msg)))
            if (type != 'acgrip') {
                let doc = new DOMParser().parseFromString(result.content, 'text/html')
                result.content = doc.documentElement.textContent!
            }
            return result
        }
        catch (err) {
            ElMessage.error('加载失败')
            return undefined
        }
    }
    //提交修改
    async function submitChange() {
        isLoadingContent.value = true
        let index = torrentIndex.value
        let type = sourceType.value
        if (!isMultiEdit.value){
            data[index][type].content.content = content.value
            await updateTorrent(type, data[index][type].id, title.value)
        }
        else {
            let intro = content.value
            let postTitle = title.value
            checkList.value.forEach(async item => {
                if (!data[index][item].is_loaded) {
                    data[index][item].content = await getDetails(item, data[index][item].id)
                    data[index][item].is_loaded = true
                }
                if (item == 'nyaa') {
                    let msg: Message.Global.FileContent = { content: intro }
                    let result: Message.Global.FileContent = JSON.parse(await window.globalAPI.html2markdown(JSON.stringify(msg)))
                    data[index].nyaa!.content!.content = result.content
                }
                else if (item == 'acgrip') {
                    let msg: Message.Global.FileContent = { content: intro }
                    let result: Message.Global.FileContent = JSON.parse(await window.globalAPI.html2bbcode(JSON.stringify(msg)))
                    data[index].acgrip!.content!.content = result.content
                }
                else {
                    data[index][item].content!.content = intro
                }
                await updateTorrent(item, data[index][item].id, postTitle)
            })
        }
        isLoadingContent.value = false
        isEditing.value = false
    }
    async function updateTorrent(type: string, id: string, title: string) {
        let result = ''
        if (type == 'bangumi') {
            let config = data.find(item => item.bangumi && item.bangumi.id === id)!.bangumi!.content!
            let msg: Message.BT.UpdatedContent<Message.BT.TorrentDetail.BangumiContent> = {
                title, id, config, type
            }
            result = await window.BTAPI.updateTorrent(JSON.stringify(msg))
        }
        if (type == 'nyaa') {
            let config = data.find(item => item.nyaa && item.nyaa.id === id)!.nyaa!.content!
            let msg: Message.BT.UpdatedContent<Message.BT.TorrentDetail.NyaaContent> = {
                title, id, config, type
            }
            result = await window.BTAPI.updateTorrent(JSON.stringify(msg))
        }
        if (type == 'acgrip') {
            let config = data.find(item => item.acgrip && item.acgrip.id === id)!.acgrip!.content!
            let msg: Message.BT.UpdatedContent<Message.BT.TorrentDetail.AcgripContent> = {
                title, id, config, type
            }
            result = await window.BTAPI.updateTorrent(JSON.stringify(msg))
        }
        if (type == 'dmhy') {
            let config = data.find(item => item.dmhy && item.dmhy.id === id)!.dmhy!.content!
            let msg: Message.BT.UpdatedContent<Message.BT.TorrentDetail.DmhyContent> = {
                title, id, config, type
            }
            result = await window.BTAPI.updateTorrent(JSON.stringify(msg))
        }
        if (type == 'acgnx_a') {
            let config = data.find(item => item.acgnx_a && item.acgnx_a.id === id)!.acgnx_a!.content!
            let msg: Message.BT.UpdatedContent<Message.BT.TorrentDetail.AcgnxContent> = {
                title, id, config, type
            }
            result = await window.BTAPI.updateTorrent(JSON.stringify(msg))
        }
        if (type == 'acgnx_g') {
            let config = data.find(item => item.acgnx_g && item.acgnx_g.id === id)!.acgnx_g!.content!
            let msg: Message.BT.UpdatedContent<Message.BT.TorrentDetail.AcgnxContent> = {
                title, id, config, type
            }
            result = await window.BTAPI.updateTorrent(JSON.stringify(msg))
        }
        let message: Message.Task.Result = JSON.parse(result)
        if (message.result == 'success') {
            ElMessage({
                message: siteName[type] + '：修改成功',
                type: 'success'
            })
        }
        else ElMessage.error(siteName[type] + '：修改失败')
    }

    //写入剪切板
    function writeClipboard(str: string) {
        let msg: Message.Global.Clipboard = { str }
        window.globalAPI.writeClipboard(JSON.stringify(msg))
        ElMessage('复制成功')
    }
    //读取文件
    const isLoadingFile = ref(false)
    async function readFileContent() {
        isLoadingFile.value = true
        const result: Message.Global.FileContent = JSON.parse(await window.globalAPI.readFileContent())
        content.value = result.content
        isLoadingFile.value = false
    }

    async function loadData() {
        isLoading.value = true
        let { list }: Message.BT.TorrentList = JSON.parse(await window.BTAPI.getTorrentList())
        data.length = 0
        list.forEach(item => { data.push(item) })
        condition.value = ''
        isLoading.value = false
    }
    
    const isLoading = ref(true)
    onMounted(() => {
        setscrollbar()
        changeTheme()
        loadData()
    })
</script>

<template>
    <el-dialog v-model="isViewing" width="900" :title="dialogTitle" @closed="resetDialog">
        <div v-loading="isLoadingContent" v-html="renderedContent"></div>
    </el-dialog>
    <el-dialog v-model="isEditing" width="900" :title="dialogTitle" @closed="resetDialog">
        <div v-loading="isLoadingContent">
            <el-input style="margin-bottom: 20px;" v-model="title" />
            <codemirror v-model="content" :style="{ minHeight: '400px', width: '100%' }" placeholder="请填写发布内容" :extensions="extensions" />
            <div style="margin-top: 10px;" v-if="isMultiEdit">
                <span>批量修改时仅支持html形式的发布稿</span>
                <span>
                    <el-button style="margin-left: 10px;" :icon="Upload" type="primary" @click="readFileContent()" link
                    v-loading.fullscreen.lock="isLoadingFile">
                        选择一个文件
                    </el-button>
                </span>
                <h2>选择需要修改的站点</h2>
                <el-checkbox-group v-model="checkList">
                    <span v-for="(_value, key) in data[torrentIndex]" style="margin-right: 10px;">
                        <el-checkbox v-if="key != 'title'" :label="siteName[key]" :value="key" />
                    </span>
                </el-checkbox-group>
            </div>
            <div class="title"><el-button size="large" style="margin-top: 20px;" type="primary" @click="submitChange">提交更改</el-button></div>
        </div>
    </el-dialog>
    <div :style="{height: slbHeight}">
        <el-scrollbar style="height: 100%;">
            <el-row style="height: 20px;" />
            <el-row class="title">
                <el-col>
                    已发布的种子
                </el-col>
            </el-row>
            <el-row style="height: 20px;" />
            <el-row justify="space-between">
                <el-col :span="3" />
                <el-col :span="18">
                    <el-input v-model="condition" style="width: 500px" placeholder="搜索标题" :prefix-icon="Search" />
                    <el-button style="float: right;text-align: right; margin-bottom: 20px;" 
                    :icon="RefreshRight" @click="loadData()" plain>
                        刷新
                    </el-button>
                    <el-table v-loading="isLoading" :data="tabledata" style="width: 100%; height: 100%;">
                        <el-table-column prop="title" label="标题"/>
                            <el-table-column fixed="left" type="expand" width="50">
                                <template #default="scope">
                                    <el-row>
                                        <el-col :span="1" />
                                        <el-col :span="22">
                                            <span><el-button type="primary" link :icon="Edit" 
                                                @click="multiEdit(scope.row.title)">批量编辑
                                            </el-button></span>
                                            <div v-for="(value, key) in (scope.row as Tabledata)">
                                                <div style="margin-top: 10px; margin-bottom: 10px;" v-if="key != 'title'">
                                                    <span style="width: 70px; display: inline-block">{{ siteName[key] }}：</span>
                                                    <span style="margin-left: 10px;"><el-link type="primary" :href="(value as any).url" 
                                                        :icon="Link" underline="never">打开
                                                    </el-link></span>
                                                    <span style="margin-left: 10px;"><el-button type="primary" link :icon="CopyDocument" 
                                                        @click="writeClipboard((value as any).url)">复制
                                                    </el-button></span>
                                                    <span style="margin-left: 10px;"><el-button type="primary" link :icon="View" 
                                                        @click="openViewDialog(key, (value as any).id)">查看
                                                    </el-button></span>
                                                    <span style="margin-left: 10px;"><el-button type="primary" link :icon="Edit" 
                                                        @click="openEditDialog(key, (value as any).id, scope.row.title)">编辑
                                                    </el-button></span>
                                                </div>
                                            </div>
                                        </el-col>
                                        <el-col :span="1" />
                                    </el-row>
                                </template>
                            </el-table-column>
                    </el-table>
                </el-col>
                <el-col :span="3" />
            </el-row>
        </el-scrollbar>
    </div>
</template>

<style scoped>

.title {
    text-align: center;
    font-size: xx-large;
}
</style>