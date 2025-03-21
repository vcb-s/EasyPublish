<script lang="ts" name="Localtask" setup>
    import { ref, reactive, onMounted } from "vue";
    import { useRouter } from 'vue-router'

    //设置滚动条区域高度
    const slbHeight = ref('')
    const clientHeight = ref(0)
    function setHeight() {
        clientHeight.value =  document.documentElement.clientHeight;
        slbHeight.value = clientHeight.value - 50 + 'px';
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
    const tabledata = reactive<Tabledata[]>([])

    //跳转发布页面
    const router = useRouter()
    function toPublish(index: number) {
        router.push({
            name: tabledata[index].step,
            params: {id: tabledata[index].id}
        })
    }

    //打开项目目录
    async function OpenDirectory(path: string){
        window.api.OpenDirectory(path)
    }

    //加载数据
    async function loadData() {
        tabledata.length = 0
        const taskInfo = await window.api.GetAllTask()
        taskInfo.forEach((value) => {
            let str: string
            if (value.step == 'create') str = '编辑配置阶段'
            else if (value.step == 'check') str = '复核阶段'
            else if (value.step == 'publish') str = 'BT发布阶段'
            else if (value.step == 'site') str = '主站发布阶段'
            else str = '发布完成'
            if (value.status == 'published') str = '发布完成'
            tabledata.push({
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
    window.api.RefreshTaskData(loadData)

    //删除任务
    function remove(index: number) {
        window.api.RemoveTask(tabledata[index].id)
    }

    //右键复制事件
    function handleRightClick(str: string) {
        window.api.WriteClipboard(str)
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
                    <el-table style="width: 100%;" :data="tabledata">
                        <el-table-column fixed="right" label="发布" width="80">
                            <template #default="scope">
                                <el-button link type="primary" size="small" 
                                @click="toPublish(scope.$index)">
                                    继续发布
                                </el-button>
                            </template>
                        </el-table-column>
                        <el-table-column fixed="right" label="打开" width="80">
                            <template #default="scope">
                                <el-button link type="primary" size="small" 
                                @click="OpenDirectory(scope.row.path)">
                                    打开目录
                                </el-button>
                            </template>
                        </el-table-column>
                        <el-table-column fixed="right" label="删除" width="80">
                            <template #default="scope">
                                <el-button link type="danger" size="small" 
                                @click="remove(scope.$index)">
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
                                        <p @contextmenu.prevent="handleRightClick(props.row.bangumi)">萌番组：{{props.row.bangumi}}</p>
                                        <p @contextmenu.prevent="handleRightClick(props.row.nyaa)">Nyaa：{{props.row.nyaa}}</p>
                                        <p @contextmenu.prevent="handleRightClick(props.row.acgrip)">Acgrip：{{props.row.acgrip}}</p>
                                        <p @contextmenu.prevent="handleRightClick(props.row.dmhy)">动漫花园：{{props.row.dmhy}}</p>
                                        <p @contextmenu.prevent="handleRightClick(props.row.acgnx_a)">末日动漫：{{props.row.acgnx_a}}</p>
                                        <p @contextmenu.prevent="handleRightClick(props.row.acgnx_g)">AcgnX：{{props.row.acgnx_g}}</p>
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