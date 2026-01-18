<script setup lang="ts">
  import { RouterView } from 'vue-router'
  import { useDark, useToggle } from '@vueuse/core'
  import { ref, reactive, onMounted, useTemplateRef } from 'vue'

  const isDark = useDark()
  const toggleDark = () => useToggle(isDark)
  document.body.style.overflow = "hidden";

  //窗口控制
  function winClose() { 
    let command: Message.Global.WinHandle = { command: "close" }
    window.globalAPI.winHandle(JSON.stringify(command)) 
  }
  function winMini() { 
    let command: Message.Global.WinHandle = { command: "mini" }
    window.globalAPI.winHandle(JSON.stringify(command)) 
  }
  function winMax() { 
    let command: Message.Global.WinHandle = { command: "max" }
    window.globalAPI.winHandle(JSON.stringify(command)) 
  }

  //设置代理
  const visible = ref(false)
  const form = reactive({
    status: false,
    type: '',
    host: '',
    port: 8080
  })
  function setProxyConfig() {
    let msg: Message.Global.ProxyConfig = form
    window.globalAPI.setProxyConfig(JSON.stringify(msg))
    visible.value = false
  }
  onMounted(async () => {
    let msg: Message.Global.ProxyConfig = JSON.parse(await window.globalAPI.getProxyConfig())
    Object.assign(form, msg)
  })

  //人机验证对话框
  const imageDialogVisible = ref(false)
  const reCaptchaDialogVisible_nyaa = ref(false)
  const turnstileDialogVisible_acgnx_a = ref(false)
  const turnstileDialogVisible_acgnx_g = ref(false)
  const turnstileValidation_acgnx_g = useTemplateRef('turnstileValidation_acgnx_g')
  const turnstileValidation_acgnx_a = useTemplateRef('turnstileValidation_acgnx_a')
  const imgSrc = ref('')
  const imgCaptcha = ref('')
  let reCaptcha = ''
  //图片验证码处理
  async function refreshImage() {
    imageDialogVisible.value = true
    imgSrc.value = 'https://www.dmhy.org/common/generate-captcha?code=' + Date.now()
  }
  window.BTAPI.loadImageCaptcha(refreshImage)
  //处理reCaptcha验证和cloudflare-turnstile验证
  async function setValidation(msg: string) {
    let { type } = JSON.parse(msg) as Message.BT.ValidationType
    if (type == 'nyaa') {
      reCaptchaDialogVisible_nyaa.value = true
    }
    else {
      if (type == 'acgnx_g') 
        turnstileDialogVisible_acgnx_g.value = true
      else 
        turnstileDialogVisible_acgnx_a.value = true
    }
  }
  window.BTAPI.loadValidation(setValidation)
  window.addEventListener('message', e => {
    reCaptcha = e.data
  })
  window.BTAPI.closeValidation(() => {
    turnstileDialogVisible_acgnx_g.value = false
    turnstileDialogVisible_acgnx_a.value = false
  })
  //提交验证码
  async function submitCaptcha(type: string) {
    if (type == 'dmhy'){
      let msg: Message.BT.ValidationInfo = {type: 'dmhy', key: imgCaptcha.value}
      window.BTAPI.loginAccount(JSON.stringify(msg))
      imageDialogVisible.value = false
    }
    else {
      let msg: Message.BT.ValidationInfo = {type: 'nyaa', key: reCaptcha}
      window.BTAPI.loginAccount(JSON.stringify(msg))
    }
  }
  //返回turnstile坐标
  async function setTurnstilePosition(type: 'acgnx_g' | 'acgnx_a') {
    let rect: DOMRect
    if (type == 'acgnx_g')
      rect = turnstileValidation_acgnx_g.value!.getBoundingClientRect()
    else
      rect = turnstileValidation_acgnx_a.value!.getBoundingClientRect()
    
      let position: Message.BT.TurnstilePosition = { x: rect.x, y: rect.y }
      let msg: Message.BT.ValidationInfo = { type, position }
      window.BTAPI.loginAccount(JSON.stringify(msg))
  }
  //主动关闭验证框
  async function removeValidation() {
    window.BTAPI.removeValidation()
  }
</script>

<template>
  <div class="layout">
    <!--登录人机验证对话框-->
    <!-- 图形验证码 -->
    <el-dialog align-center v-model="imageDialogVisible" destroy-on-close title="登录到动漫花园" width="220">
      <el-row>
        <img :src="imgSrc" style="width: 100px; margin-right: 10px;" />
        <el-button link type="primary" size="small" @click="refreshImage">换一张</el-button>
      </el-row>
      <el-row style="height: 20px;" />
      <el-row>
        <el-input v-model="imgCaptcha" style="width: 100px; margin-right: 10px;" />
        <el-button type="primary" @click="submitCaptcha('dmhy')">确认</el-button>
      </el-row>
    </el-dialog>
    <!-- reCaptcha验证码 -->
    <el-dialog align-center v-model="reCaptchaDialogVisible_nyaa" destroy-on-close title="登录到Nyaa" width="360">
      <el-row>
        <iframe src="https://nyaa.si/grecaptcha" style="height: 500px;width: 350px;"></iframe>
      </el-row>
      <el-row style="height: 20px;" />
      <el-row>
        <el-button type="primary" @click="submitCaptcha('nyaa'); reCaptchaDialogVisible_nyaa = false">确认</el-button>
      </el-row>
    </el-dialog>
    <!-- cloudflare-turnstile验证 -->
    <el-dialog :z-index="3000" align-center v-model="turnstileDialogVisible_acgnx_g" destroy-on-close title="登录到AcgnX" width="360" 
      @opened="setTurnstilePosition('acgnx_g')" @close="removeValidation">
      <div style="display: flex; justify-content: center; align-items: center;">
        <div ref="turnstileValidation_acgnx_g" style="width: 300px; height: 65px;">cloudflare-turnstile</div>
      </div>
    </el-dialog>
    <el-dialog :z-index="3001" align-center v-model="turnstileDialogVisible_acgnx_a" destroy-on-close title="登录到末日动漫" width="360" 
      @opened="setTurnstilePosition('acgnx_a')" @close="removeValidation">
      <div style="display: flex; justify-content: center; align-items: center;">
        <div ref="turnstileValidation_acgnx_a" style="width: 300px; height: 65px;">cloudflare-turnstile</div>
      </div>
    </el-dialog>
    <el-container style="height: 100%">
      <!-- 标题栏 -->
      <el-header class="header">
        &nbsp;EasyPublish
        <el-button text circle type="danger" 
        style="position: absolute; right: 10px;" @click="winClose">
          <el-icon :size="30"><Close /></el-icon>
        </el-button>
        <el-button text circle type="info" 
        style="position: absolute; right: 50px;" @click="winMax">
          <el-icon :size="25"><FullScreen /></el-icon>
        </el-button>
        <el-button text circle type="info" 
        style="position: absolute; right: 90px;" @click="winMini">
          <el-icon :size="29"><Minus /></el-icon>
        </el-button>
        <el-switch v-model="isDark" style="position: absolute; right: 180px; 
        --el-switch-on-color: #2d2d2f; --el-switch-off-color: #E5EAF3" 
        inline-prompt size="large" @change="toggleDark">
          <template #active-action>
            <el-icon><Moon /></el-icon>
          </template>
          <template #inactive-action>
            <el-icon><Sunny /></el-icon>
          </template>
        </el-switch>
        <div style="position: absolute; right: 140px;">
          <el-popover :visible="visible" :width="300">
            <el-form :model="form" label-width="auto" style="max-width: 300px">
              <el-form-item label="启用代理">
                <el-switch v-model="form.status" />
              </el-form-item>
              <el-form-item label="代理类型">
                <el-select v-model="form.type" placeholder="选择一种协议">
                  <el-option label="HTTP" value="http" />
                  <el-option label="HTTPS" value="https" />
                  <el-option label="SOCKS5" value="socks" />
                </el-select>
              </el-form-item>
              <el-form-item label="代理主机">
                <el-input v-model="form.host" />
              </el-form-item>
              <el-form-item label="代理端口">
                <el-input-number v-model="form.port" />
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="setProxyConfig()">保存</el-button>
                <el-button @click="visible = false">取消</el-button>
              </el-form-item>
            </el-form>
            <template #reference>
              <el-button @click="visible = !visible" circle>
                <el-icon><Operation /></el-icon>
              </el-button>
            </template>
          </el-popover>
        </div>
      </el-header>
      <el-container>
        <el-aside width="200px">
          <el-menu default-active="2" class="el-menu-vertical" :router="true">
            <el-menu-item index="/create_task">
              <el-icon><DocumentAdd /></el-icon>
              <span>创建新任务</span>
            </el-menu-item>
            <el-menu-item index="/task_list">
              <el-icon><FolderOpened /></el-icon>
              <span>管理本地任务</span>
            </el-menu-item>
            <el-menu-item index="/modify">
              <el-icon><Memo /></el-icon>
              <span>修改线上内容</span>
            </el-menu-item>
            <el-menu-item index="/account">
              <el-icon><Key /></el-icon>
              <span>登录管理</span> 
            </el-menu-item>
            <el-menu-item index="/quickstart">
              <el-icon><CircleCheck /></el-icon>
              <span>快速开始</span>
            </el-menu-item>
          </el-menu>
        </el-aside>
        <el-container>
          <el-main>
            <RouterView></RouterView>
          </el-main>
          <el-footer height="10px"></el-footer>
        </el-container>
      </el-container>
    </el-container>
  </div>
</template>

<style scoped>

.header {
  display: flex;
  align-items: center;
  flex-direction: row;
  font-size: x-large;
  position: relative;
  height: 50px;
  -webkit-app-region: drag;
}

button, .el-switch {
  -webkit-app-region: no-drag;
}

.el-menu--horizontal {
  --el-menu-horizontal-height: 100px;
}

.layout {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.el-main {
  padding: 0%;
}
</style>