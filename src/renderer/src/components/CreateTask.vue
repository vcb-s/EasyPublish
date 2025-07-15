<script setup lang="ts" name="CreateTask">
    import { reactive, ref, onMounted } from "vue"
    import type { FormInstance, FormRules, } from 'element-plus'
    import { useRouter } from "vue-router";
    
    //设置表单
    interface ruleForm {
        name: string
        path: string
        type: "quick" | "file" | "template"
    }
    const createForm = ref()
    const form = reactive<ruleForm>({
        name: '',
        type: 'quick',
        path: '',
    })
    const options = [
        {
            value: 'quick',
            label: '快速发布'

        },
        {
            value: 'file',
            label: '从文件创建'
        },
        {
            value: 'template',
            label: '从模板创建'
        }
    ]
    const rules = reactive<FormRules<ruleForm>>({
        name: [{
            required: false,
            message: '请输入任务名称',
            trigger: 'change'
        }],
        path: [{
            required: false,
            message: '请选择一个保存路径',
            trigger: 'change'
        }],
        type: [{
            required: true,
            message: '请选择一种模式',
            trigger: 'change'
        }]
    })

    //选择文件夹
    const isLoading = ref(false)
    async function loadFolder() {
        isLoading.value = true
        const { path }: Message.Global.Path = JSON.parse(await window.globalAPI.getFolderPath())
        form.path = path
        isLoading.value = false
    }

    //设置滚动条区域高度
    const slbHeight = ref('')
    const clientHeight = ref(0)
    function setHeight() {
        clientHeight.value =  document.documentElement.clientHeight;
        slbHeight.value = clientHeight.value - 60 + 'px';
    }
    onMounted(()=>{
        setHeight()
        window.onresize = setHeight
    })

    //创建本地任务
    const isCreating = ref(false)
    const router = useRouter()
    async function createTask( formEl: FormInstance | undefined ) {
        if (!formEl) return
        isCreating.value = true
        await formEl.validate(async (valid, _fields) => {
            if (valid) {
                let msg: Message.Task.TaskConfig = form
                const { result }: Message.Task.Result = JSON.parse(await window.taskAPI.createTask(JSON.stringify(msg)))
                if (result.includes('success')) {
                    ElMessage({
                        message: '创建成功，即将跳转',
                        type: 'success',
                        plain: true,
                    })
                    let [,id] = result.split(':')
                    setTimeout(() => {
                        router.push({
                            name: 'edit',
                            params: { id: id }
                        })
                    }, 500);
                }
                else if (result.includes('noSuchFolder')){
                    ElMessage.error('目录不存在')
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

</script>

<template>
    <div :style="{height: slbHeight}">
        <el-scrollbar style="height : 100% ">
            <!-- 占行 -->
            <el-row style="height: 20px;" />
            <el-row class="title">
                <el-col>
                    创建新任务
                </el-col>
            </el-row>
            <!-- 占行 -->
            <el-row style="height: 20px;" />
            <el-row justify="space-between">
                <el-col :span="3" />
                <el-col :span="18">
                    <el-form ref="createForm" :model="form" label-width="auto" style="max-width: 900px;" :rules="rules">
                        <el-form-item label="任务名称" prop="name">
                            <el-input v-model="form.name" placeholder="此项仅用于本地标识" />
                        </el-form-item>
                        <el-form-item label="本地保存路径" prop="path">
                            <el-input placeholder="此项填写本地保存目录" v-model="form.path" class="input-with-select">
                                <template #append>
                                    <el-button @click="loadFolder" v-loading.fullscreen.lock="isLoading">
                                        <el-icon><FolderOpened /></el-icon>
                                    </el-button>
                                </template>
                            </el-input>
                        </el-form-item>
                        <el-form-item label="任务类型" prop="type">
                            <el-select-v2 v-model="form.type" placeholder="选择一个模式" :options="options" style="width: 240px" />
                        </el-form-item>
                    </el-form> 
                </el-col>
                <el-col :span="3" />
            </el-row>
            <el-row class="title">
                <el-col>
                    <el-button :loading="isCreating" @click="createTask(createForm)" type="primary" plain>
                        &emsp;&emsp;&emsp;创建&emsp;&emsp;&emsp;
                    </el-button>  
                </el-col>  
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