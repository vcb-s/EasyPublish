<script lang="ts" setup name="TaskList">
    import { ref, reactive, onMounted, computed } from "vue";
    import { useRouter } from 'vue-router'

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

    //设置表格内容
    type Tabledata = {
        id: number,
        name: string,
        path: string,
        step: string,
        status: string,
        bangumi?: string,
        nyaa?: string,
        acgrip?: string,
        dmhy?: string,
        acgnx_a?: string,
        acgnx_g?: string,
        isFinished: string,
    }
    const incomplete = ref(false)
    const data = reactive<Tabledata[]>([])
    const tabledata = computed(() => {
        if (incomplete.value)
            return data
        return data.filter((item) => item.isFinished == "publishing")
    })

    //跳转发布页面
    const router = useRouter()
    function openTask(id: number) {
        router.push({
            name: data.find((item) => item.id == id)!.step,
            params: {id: id}
        })
    }

    //打开项目目录
    async function openFolder(path: string){
        let msg: Message.Global.Path = { path }
        window.globalAPI.openFolder(JSON.stringify(msg))
    }

    //加载数据
    async function loadData() {
        data.length = 0
        const { list }: Message.Task.TaskList = JSON.parse(await window.taskAPI.getTaskList())
        list.forEach((value) => {
            let str: string
            if (value.step == 'edit') str = '编辑配置阶段'
            else if (value.step == 'check') str = '复核阶段'
            else if (value.step == 'bt_publish') str = 'BT发布阶段'
            else if (value.step == 'forum_publish') str = '主站发布阶段'
            else str = '发布完成'
            if (value.status == 'published') str = '发布完成'
            data.push({
                id: value.id,
                name: value.name,
                path: value.path,
                step: value.step,
                isFinished: value.status,
                status: str,
                bangumi: value.bangumi,
                nyaa: value.nyaa,
                dmhy: value.dmhy,
                acgrip: value.acgrip,
                acgnx_a: value.acgnx_a,
                acgnx_g: value.acgnx_g
            })
        })
    }
    window.taskAPI.refreshTaskData(loadData)

    //删除任务
    function remove(id: number) {
        let msg: Message.Task.TaskID = { id }
        window.taskAPI.removeTask(JSON.stringify(msg))
    }

    //右键复制事件
    function handleRightClick(str: string) {
        let msg: Message.Global.Clipboard = { str }
        window.globalAPI.writeClipboard(JSON.stringify(msg))
        ElMessage('复制成功')
    }

    onMounted(() => {
        loadData()
        setscrollbar()
    })

</script>

<template>
    <div :style="{height: slbHeight}">
        <el-scrollbar style="height: 100%;">
            <el-row style="height: 20px;" />
            <el-row class="title">
                <el-col>
                    管理本地任务
                </el-col>
            </el-row>
            <el-row style="height: 20px;" />
            <el-row justify="space-between">
                <el-col :span="3" />
                <el-col :span="18">
                    <el-checkbox label="显示已完成项目" v-model="incomplete" />
                    <el-row style="height: 10px;" />
                    <el-table style="width: 100%; height: 100%" :data="tabledata" :default-sort="{prop: 'id', order: 'descending'}">
                        <el-table-column fixed="right" label="发布" width="80">
                            <template #default="scope">
                                <el-button link type="primary" size="small" 
                                @click="openTask(scope.row.id)">
                                    继续发布
                                </el-button>
                            </template>
                        </el-table-column>
                        <el-table-column fixed="right" label="打开" width="80">
                            <template #default="scope">
                                <el-button link type="primary" size="small" 
                                @click="openFolder(scope.row.path)">
                                    打开目录
                                </el-button>
                            </template>
                        </el-table-column>
                        <el-table-column fixed="right" label="删除" width="80">
                            <template #default="scope">
                                <el-button link type="danger" size="small" 
                                @click="remove(scope.row.id)">
                                    删除
                                </el-button>
                            </template>
                        </el-table-column>
                        <el-table-column prop="id" label="ID" width="140" />
                        <el-table-column prop="name" label="项目名称" show-overflow-tooltip />
                        <el-table-column prop="status" label="状态" width="120" />
                        <el-table-column fixed="left" type="expand" width="50">
                            <template #default="props">
                                <el-row>
                                    <el-col :span="1" />
                                    <el-col :span="22">
                                        <p @contextmenu.prevent="handleRightClick(props.row.path)">项目地址：{{props.row.path}}</p>
                                        <p @contextmenu.prevent="handleRightClick(props.row.bangumi)">萌番组：<a :href="props.row.bangumi">{{props.row.bangumi}}</a></p>
                                        <p @contextmenu.prevent="handleRightClick(props.row.nyaa)">Nyaa：<a :href="props.row.nyaa">{{props.row.nyaa}}</a></p>
                                        <p @contextmenu.prevent="handleRightClick(props.row.acgrip)">Acgrip：<a :href="props.row.acgrip">{{props.row.acgrip}}</a></p>
                                        <p @contextmenu.prevent="handleRightClick(props.row.dmhy)">动漫花园：<a :href="props.row.dmhy">{{props.row.dmhy}}</a></p>
                                        <p @contextmenu.prevent="handleRightClick(props.row.acgnx_a)">末日动漫：<a :href="props.row.acgnx_a">{{props.row.acgnx_a}}</a></p>
                                        <p @contextmenu.prevent="handleRightClick(props.row.acgnx_g)">AcgnX：<a :href="props.row.acgnx_g">{{props.row.acgnx_g}}</a></p>
                                    </el-col>
                                    <el-col :span="1" />
                                </el-row>
                            </template>
                        </el-table-column>
                    </el-table>
                </el-col>
                <el-col :span="3" />
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
</style>