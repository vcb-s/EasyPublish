<script setup lang="ts" name="Login">
    import { ref, reactive, onMounted } from "vue";
    import type { Message_LoginInfo, Message_UAP } from '../index.d.ts'
    import { RefreshRight, Key, Delete } from '@element-plus/icons-vue'

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
        site: string
        time: string
        status: string
        index: number
        username: string
        password: string
        cookies: {name: string, value: string}[]
    }
    const tabledata = reactive<Tabledata[]>([{
        site: '萌番组',
        time: '',
        status: '',
        username: '',
        password: '',
        index: 1,
        cookies: []
    },
    {
        site: 'Nyaa',
        time: '',
        status: '',
        username: '',
        password: '',
        index: 2,
        cookies: []
    },
    {
        site: 'Acgrip',
        time: '',
        status: '',
        username: '',
        password: '',
        index: 3,
        cookies: []
    },
    {
        site: '动漫花园',
        time: '',
        status: '',
        username: '',
        password: '',
        index: 4,
        cookies: []
    },
    {
        site: 'AcgnX',
        time: '',
        status: '',
        username: '',
        password: '',
        index: 5,
        cookies: []
    },
    {
        site: '末日动漫',
        time: '',
        status: '',
        username: '',
        password: '',
        index: 6,
        cookies: []
    }])
    //加载数据
    async function loadData() {
        const result: Message_LoginInfo[] = JSON.parse(await window.api.GetLoginInfo())
        for (let index = 0; index < 6; index++) tabledata[index].time = result[index].time
        for (let index = 0; index < 6; index++) tabledata[index].cookies = result[index].cookies
        for (let index = 0; index < 6; index++) tabledata[index].username = result[index].username
        for (let index = 0; index < 6; index++) tabledata[index].password = result[index].password
        for (let index = 0; index < 6; index++) tabledata[index].status = result[index].status
    }
    window.api.RefreshLoginData(loadData)
    
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
    
    onMounted(() => {
        loadData()
        setSiteUap(false)
        setscrollbar()
    })

    //重新检查
    function checkLoginStatus() {
        window.api.CheckLoginStatus()
    }

    //账户密码提示
    const isEdit = ref(false)
    async function setuap() {
        isEdit.value = false
        let UAPs: Message_UAP[] = []
        tabledata.forEach(data => {
            UAPs.push({username: data.username, password: data.password})
        });
        window.api.SetUAP(JSON.stringify(UAPs))
    }

    //主站账户配置
    const username = ref('')
    const password = ref('')
    //获取或设置主站用户密码
    async function setSiteUap (op: boolean) {
        const result = await window.api.SetSiteUAP(op, username.value, password.value)
        username.value = result[0]
        password.value = result[1]
    }

    //打开登录页面
    async function login(index:number) {
        let type: string
        switch (index) {
            case 0:
                type = 'bangumi'
                break;
            case 1:
                type = 'nyaa'
                break;
            case 2:
                type = 'acgrip'
                break;
            case 3:
                type = 'dmhy'
                break;
            case 4:
                type = 'acgnx_g'
                break;
            case 5:
                type = 'acgnx_a'
                break;
            default:
                type = 'bangumi'
                break;
        }
        window.api.OpenLoginWindow(type)
    }

    //清除缓存
    function clearStorage() {
        window.api.ClearStorage()
    }

    //右键复制事件
    function handleRightClick(str: string) {
        window.api.WriteClipboard(str)
        ElMessage('复制成功')
    }

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
                    <span style="font-size: x-large; font-weight: bold;">BT站账户</span>
                    <el-button style="float: right;text-align: right; margin-bottom: 20px;" 
                    type="danger" plain
                    :icon="Delete"
                    @click="clearStorage()">
                        清除缓存
                    </el-button>
                    <el-button style="float: right;text-align: right; margin-bottom: 20px; margin-right: 10px;" 
                    type="primary" plain
                    :icon="Key"
                    @click="checkLoginStatus()">
                        检查
                    </el-button>
                    <el-button style="float: right;text-align: right; margin-bottom: 20px;" 
                    :icon="RefreshRight"
                    @click="loadData()"
                    plain>
                        刷新
                    </el-button>
                    <el-table style="width: 100%;" row-key="index" :data="tabledata" :row-class-name="tableRowClassName">
                        <el-table-column fixed="right" label="登录" width="100">
                            <template #default="scope">
                                <el-button link type="primary" size="small" @click="login(scope.$index)">登录账号</el-button>
                            </template>
                        </el-table-column>
                        <el-table-column prop="site" label="站点"/>
                        <el-table-column prop="time" label="上次检查时间" width="240" />
                        <el-table-column prop="status" label="登录状态" width="160" />
                        <el-table-column fixed="left" type="expand" width="50">
                            <template #default="props">
                                <el-row>
                                    <el-col :span="1" />
                                    <el-col :span="22">
                                        <el-row style="margin-top: 15px;">
                                            <span @dblclick="isEdit = true">用户名：</span>
                                            <el-input size="small" style="width: 240px;" @blur="setuap()" v-if="isEdit" v-model="props.row.username" />
                                            <span @dblclick="isEdit = true" 
                                            @contextmenu.prevent="handleRightClick(props.row.username)" 
                                            v-else>{{ props.row.username }}</span>
                                        </el-row>
                                        <el-row style="margin-top: 15px;">
                                            <span @dblclick="isEdit = true">密码：</span>
                                            <el-input size="small" style="width: 240px;" @blur="setuap()" v-if="isEdit" v-model="props.row.password" />
                                            <span @dblclick="isEdit = true" 
                                            @contextmenu.prevent="handleRightClick(props.row.password)" 
                                            v-else>{{ props.row.password }}</span>
                                        </el-row>
                                        <h3>Cookies</h3>
                                        <el-table :data="props.row.cookies">
                                            <el-table-column label="Name" prop="name" />
                                            <el-table-column label="Value" prop="value" />
                                        </el-table>
                                    </el-col>
                                    <el-col :span="1" />
                                </el-row>
                            </template>
                        </el-table-column>
                    </el-table>
                    <h2>VCB主站账户</h2>
                    <el-row>
                        <el-form label-width="auto">
                            <el-form-item label="用户名">
                                <el-input
                                v-model="username"
                                style="width: 240px"
                                placeholder="填写主站用户名"
                                @blur="setSiteUap(true)"
                                />
                            </el-form-item>
                            <el-form-item label="应用程序密码">
                                <el-input
                                v-model="password"
                                style="width: 240px"
                                placeholder="填写应用程序密码"
                                @blur="setSiteUap(true)"
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