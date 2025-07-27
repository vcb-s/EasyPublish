<script setup lang="ts" name="Account">
    import { ref, reactive, onMounted } from "vue"
    import { RefreshRight, Key, Delete } from '@element-plus/icons-vue'

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
        site: string
        type: string
        time: string
        status: string
        index: number
        username: string
        password: string
        enable: boolean
    }
    const tabledata = reactive<Tabledata[]>([{
        site: '萌番组',
        type: 'bangumi',
        time: '',
        status: '',
        username: '',
        password: '',
        enable: true,
        index: 1,
    },
    {
        site: 'Nyaa',
        type: 'nyaa',
        time: '',
        status: '',
        username: '',
        password: '',
        enable: true,
        index: 2,
    },
    {
        site: 'Acgrip',
        type: 'acgrip',
        time: '',
        status: '',
        username: '',
        password: '',
        enable: true,
        index: 3,
    },
    {
        site: '动漫花园',
        type: 'dmhy',
        time: '',
        status: '',
        username: '',
        password: '',
        enable: true,
        index: 4,
    },
    {
        site: 'AcgnX',
        type: 'acgnx_g',
        time: '',
        status: '',
        username: '',
        password: '',
        enable: true,
        index: 5,
    },
    {
        site: '末日动漫',
        type: 'acgnx_a',
        time: '',
        status: '',
        username: '',
        password: '',
        enable: true,
        index: 6,
    }])
    //加载数据
    async function loadData() {
        tabledata.forEach(async (item, index, arr) => {
            let msg: Message.BT.AccountType = {type: item.type}
            let result = await window.BTAPI.getAccountInfo(JSON.stringify(msg))
            let info: Message.BT.AccountInfo = JSON.parse(result)
            Object.assign(arr[index], info)
        });
    }
    window.BTAPI.refreshLoginData(loadData)

    //导入导出Cookies
    async function exportCookies(type: string) {
        let msg: Message.BT.AccountType = { type }
        window.BTAPI.exportCookies(JSON.stringify(msg))
    }
    async function importCookies(type: string) {
        let msg: Message.BT.AccountType = { type }
        window.BTAPI.importCookies(JSON.stringify(msg))
    }
    
    //设置颜色
    const tableRowClassName = ({ rowIndex }: { rowIndex: number }) => {
        if (tabledata[rowIndex].status == '访问失败') {
            return 'danger-row'
        } else if (tabledata[rowIndex].status == '账号已登录') {
            return 'success-row'
        } else if (tabledata[rowIndex].status == '防火墙阻止') {
            return 'warning-row'
        }
        return ''
    }

    //检查BT站点登录状态
    function checkLoginStatus(type: string) {
        let msg: Message.BT.AccountType = { type }
        window.BTAPI.checkLoginStatus(JSON.stringify(msg))
    }
    //保存BT账户密码
    async function saveAccountInfo(type: string) {
        let msg: Message.BT.AccountInfo = tabledata.find(item => item.type == type)!
        window.BTAPI.saveAccountInfo(JSON.stringify(msg))
    }
    //打开登录页面
    async function openLoginWindow(type: string) {
        let msg: Message.BT.AccountType = {type}
        window.BTAPI.openLoginWindow(JSON.stringify(msg))
    }
    //清除登录状态
    function clearStorage() {
        window.BTAPI.clearStorage()
    }

    //主站账户配置
    const username = ref('')
    const password = ref('')
    //获取或设置主站用户密码
    async function saveForumAccountInfo () {
        let msg: Message.Forum.AccountInfo = {
            username: username.value,
            password: password.value
        }
        window.forumAPI.saveAccountInfo(JSON.stringify(msg))
    }
    async function getForumAccountInfo () {
        let msg: Message.Forum.AccountInfo = JSON.parse(await window.forumAPI.getAccountInfo())
        username.value = msg.username
        password.value = msg.password
    }

    
    onMounted(() => {
        loadData()
        getForumAccountInfo()
        setscrollbar()
    })

</script>

<template>
    <div :style="{height: slbHeight}">
        <el-scrollbar style="height: 100%;">
            <el-row style="height: 20px;" />
            <el-row class="title">
                <el-col>
                    登录发布账号
                </el-col>
            </el-row>
            <el-row style="height: 20px;" />
            <el-row justify="space-between">
                <el-col :span="3" />
                <el-col :span="18">
                    <span style="font-size: x-large; font-weight: bold;">BT 站账户</span>
                    <el-button style="float: right;text-align: right; margin-bottom: 20px;" 
                    type="danger" plain :icon="Delete" @click="clearStorage()">
                        清除缓存
                    </el-button>
                    <el-button style="float: right;text-align: right; margin-bottom: 20px; margin-right: 10px;" 
                    type="primary" plain :icon="Key" @click="checkLoginStatus('all')">
                        全部检查
                    </el-button>
                    <el-button style="float: right;text-align: right; margin-bottom: 20px;" 
                    :icon="RefreshRight" @click="loadData()" plain>
                        刷新
                    </el-button>
                    <el-table style="width: 100%;" row-key="index" :data="tabledata" :row-class-name="tableRowClassName">
                        <el-table-column fixed="right" label="检查" width="60">
                            <template #default="scope">
                                <el-button link type="primary" size="small" @click="checkLoginStatus(scope.row.type)">检查</el-button>
                            </template>
                        </el-table-column>
                        <el-table-column fixed="right" label="导入" width="60">
                            <template #default="scope">
                                <el-button link type="primary" size="small" @click="importCookies(scope.row.type)">导入</el-button>
                            </template>
                        </el-table-column>
                        <el-table-column fixed="right" label="导出" width="60">
                            <template #default="scope">
                                <el-button link type="primary" size="small" @click="exportCookies(scope.row.type)">导出</el-button>
                            </template>
                        </el-table-column>
                        <el-table-column fixed="right" label="登录" width="100">
                            <template #default="scope">
                                <el-button link type="primary" size="small" @click="openLoginWindow(scope.row.type)">打开网站</el-button>
                            </template>
                        </el-table-column>
                        <el-table-column prop="site" label="站点"/>
                        <el-table-column prop="time" label="上次检查时间" width="180" />
                        <el-table-column prop="status" label="登录状态" width="120" />
                        <el-table-column fixed="left" type="expand" width="50">
                            <template #default="scope">
                                <el-row>
                                    <el-col :span="1" />
                                    <el-col :span="22">
                                        <el-form label-width="auto">
                                            <el-form-item label="启用账户">
                                                <el-switch v-model="scope.row.enable" active-text="启用" inactive-text="禁用" @change="saveAccountInfo(scope.row.type)" />
                                            </el-form-item>
                                            <el-form-item label="用户名">
                                                <el-input style="width: 300px;" @blur="saveAccountInfo(scope.row.type)" v-model="scope.row.username" />
                                            </el-form-item>
                                            <el-form-item label="密码">
                                                <el-input style="width: 300px;" @blur="saveAccountInfo(scope.row.type)" v-model="scope.row.password" />
                                            </el-form-item>
                                        </el-form>
                                    </el-col>
                                    <el-col :span="1" />
                                </el-row>
                            </template>
                        </el-table-column>
                    </el-table>
                    <h2>VCB-Studio 主站账户</h2>
                    <el-row>
                        <el-form label-width="auto">
                            <el-form-item label="用户名">
                                <el-input
                                v-model="username"
                                style="width: 240px"
                                placeholder="填写主站用户名"
                                @blur="saveForumAccountInfo"
                                />
                            </el-form-item>
                            <el-form-item label="应用程序密码">
                                <el-input
                                v-model="password"
                                style="width: 240px"
                                placeholder="填写应用程序密码"
                                @blur="saveForumAccountInfo"
                                />
                            </el-form-item>
                        </el-form>
                    </el-row>
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

:deep(.el-table .warning-row) {
    --el-table-tr-bg-color: var(--el-color-warning-light-9);
}

:deep(.el-table .success-row) {
    --el-table-tr-bg-color: var(--el-color-success-light-9);
}

:deep(.el-table .danger-row) {
    --el-table-tr-bg-color: var(--el-color-danger-light-9);
}

</style>