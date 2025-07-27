<script setup lang="ts" name="BTPublish">
    import { onMounted, ref, reactive } from "vue"
    import { useRouter } from 'vue-router'
    import type { TableInstance } from 'element-plus'

    const props = defineProps<{id: number}>()
    const router = useRouter()
    let type = false //项目类型

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

    //路由跳转
    function back() {
        router.push({
            name: type ? 'edit' : 'check',
            params: {id: props.id}
        })
    }
    function next() {
        router.push({
            name: type ? 'finish' : 'forum_publish',
            params: {id: props.id}
        })
    }

    //设置表格数据
    type Tabledata = {
        name: string,
        type: string,
        status: string,
        lock: boolean,
        class: string,
        index: number
    }
    const tabledata = reactive<Tabledata[]>([
        {
            name: '萌番组（团队同步）',
            type: 'bangumi_all',
            status: '未发布',
            lock: false,
            class: '',
            index: 0
        },
        {
            name: '萌番组',
            type: 'bangumi',
            status: '未发布',
            lock: false,
            class: '',
            index: 1
        },
        {
            name: 'Nyaa',
            type: 'nyaa',
            status: '未发布',
            lock: false,
            class: '',
            index: 2
        },
        {
            name: 'Acgrip',
            type: 'acgrip',
            status: '未发布',
            lock: false,
            class: '',
            index: 3
        },
        {
            name: '动漫花园',
            type: 'dmhy',
            status: '未发布',
            lock: false,
            class: '',
            index: 4
        },
        {
            name: 'AcgnX',
            type: 'acgnx_g',
            status: '未发布',
            lock: false,
            class: '',
            index: 5
        },
        {
            name: '末日动漫',
            type: 'acgnx_a',
            status: '未发布',
            lock: false,
            class: '',
            index: 6
        },
    ])

    //设置是否允许选择
    const selectable = (row: Tabledata) => !(row.status == '发布完成')
    const publishtable = ref<TableInstance>()
    const multipleSelection = ref<Tabledata[]>([])
    const handleSelectionChange = (val: Tabledata[]) => {
        multipleSelection.value = val
    }

    //加载已发布信息
    async function loadData() {
        let msg: Message.Task.TaskID = { id: props.id }
        let result: Message.Task.PublishStatus = JSON.parse(await window.taskAPI.getPublishStatus(JSON.stringify(msg)))
        let keys = Object.keys(result)
        keys.forEach(item => {
            if (result[item] == '发布完成') {
                tabledata.find(item_ => item_.type == item)!.status = '发布完成'
                tabledata.find(item_ => item_.type == item)!.class = 'success-row'
            }
            else if (result[item] == '种子已存在') {
                tabledata.find(item_ => item_.type == item)!.status = '种子已存在'
                tabledata.find(item_ => item_.type == item)!.class = 'danger-row'
            }
        })
        if (tabledata[1].status == '发布完成') {
            tabledata[0].status = '发布完成'
            tabledata[0].class = 'success-row'
        }
    }
    
    //发布
    async function publish(index: number) {
        tabledata[index].lock = true
        tabledata[index].status = '正在检查账户登录'
        let msg: Message.BT.AccountType = {type: index == 0 ? 'bangumi' : tabledata[index].type}
        const { status }: Message.BT.LoginStatus = JSON.parse(await window.BTAPI.checkLoginStatus(JSON.stringify(msg)))
        if (status != '账号已登录') {
            tabledata[index].status = status
            tabledata[index].class = 'warning-row'
            return
        }
        tabledata[index].status = '检查完成正在发布'
        let message: Message.Task.ContentType = { id: props.id, type: tabledata[index].type}
        for (let i = 1;i < 6;i++) {
            let { result }: Message.Task.Result = JSON.parse(await window.BTAPI.publish(JSON.stringify(message)))
            if (result == 'success') {
                tabledata[index].lock = false
                tabledata[index].status = '发布完成'
                tabledata[index].class = 'success-row'
                publishtable.value!.toggleRowSelection( tabledata[index], false )
                loadData()
                return
            }
            if (result == 'exist') {
                tabledata[index].lock = false
                tabledata[index].status = '种子已存在'
                tabledata[index].class = 'danger-row'
                return
            }
            if (result == 'failed') {
                tabledata[index].status = '发布失败正在重试（' + i + '/5)'
                tabledata[index].class = 'warning-row';
            }
        }
        tabledata[index].lock = false
        tabledata[index].status = '发布失败'
        tabledata[index].class = 'danger-row'
        return
    }

    //批量发布
    async function multipublish() {
        multipleSelection.value.forEach((item) => {
            publish(item.index)
        })
    }

    //设置颜色
    const tableRowClassName = ({ rowIndex }: { rowIndex: number }) => tabledata[rowIndex].class

    onMounted(async () => {
        setscrollbar()
        let msg: Message.Task.TaskID = { id: props.id }
        let taskType: Message.Task.TaskType = JSON.parse(await window.taskAPI.getTaskType(JSON.stringify(msg)))
        type = taskType.type == 'quick'
        let message: Message.Task.TaskStatus = { id: props.id, step: 'bt_publish' }
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
                    BT发布
                </el-col>
                <el-col :span="3" />
            </el-row>
            <el-row style="height: 20px;" />
            <el-row justify="space-between">
                <el-col :span="3" />
                <el-col :span="18">
                    <div style="float: right;text-align: right;">
                        <el-button plain @click="multipublish()">发布选中站点</el-button>
                    </div>
                    <el-row style="height: 40px;" />
                    <el-table style="width: 100%;" :data="tabledata" 
                    ref="publishtable"
                    :row-class-name="tableRowClassName"
                    @selection-change="handleSelectionChange">
                        <el-table-column fixed="right" label="发布" width="80">
                            <template #default="scope">
                                <el-button link type="primary" size="small" 
                                @click="publish(scope.$index)"
                                :disabled="scope.row.isFinished == 'published'"
                                :loading="scope.row.lock" >
                                    发布
                                </el-button>
                            </template>
                        </el-table-column>
                        <el-table-column type="selection" :selectable="selectable" width="55" />
                        <el-table-column prop="name" label="站点" />
                        <el-table-column prop="status" label="状态" width="220" />
                    </el-table>
                    <el-row style="height: 20px;" />
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

:deep(.el-table .warning-row) {
    --el-table-tr-bg-color: var(--el-color-warning-light-9);
}

:deep(.el-table .success-row) {
    --el-table-tr-bg-color: var(--el-color-success-light-9);
}

:deep(.el-table .danger-row) {
    --el-table-tr-bg-color: var(--el-color-danger-light-9);
}

.btn {
    width: 180px;
}

.title {
    text-align: center;
    font-size: xx-large;
}

</style>