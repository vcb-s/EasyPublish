import { app, shell, BrowserWindow, ipcMain, dialog, session, clipboard, net, Session } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import fs from 'fs'
import { JSONFilePreset } from 'lowdb/node'
import { Low } from 'lowdb'
import axios from 'axios'
import axiosRetry from 'axios-retry'
import log from 'electron-log'
import socksProxy from 'socks-proxy-agent'
import commonmark from "commonmark"
import md2bbc from 'markdown-to-bbcode'
import html2md from 'turndown'
import CryptoJS from 'crypto-js'

//静态资源
import acgnxResponse from '../renderer/src/assets/acgnx.html?asset'
import nyaaResponse from '../renderer/src/assets/nyaa.html?asset'
import appIcon from '../../build/icon.ico?asset'

/*
  应用初始化和全局设置相关
*/
//初始化日志
function initializeLog() {
  log.transports.file.format = '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}]{scope} {text}'
  const date = new Date()
  const dateStr = date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate()
  log.transports.file.resolvePathFn = ()=> app.getPath('userData') + '\\logs\\' + dateStr + '.log'
  log.initialize()
  console.log = log.log
  console.log(app.getPath('userData') + '\\logs\\' + dateStr + '.log') 
}
initializeLog()
//默认语言中文
app.commandLine.appendSwitch('lang', 'zh-CN')
//全局捕获未经处理的异常
process.on('uncaughtException', (err) => {
  log.error(err)
  dialog.showErrorBox('错误', (err as Error).message)
})

//定义数据库
let taskDB: Low<Config.TaskData>
let userDB: Low<Config.UserData>

const defaultTaskData: Config.TaskData = { tasks: [] }
const defaultUserData: Config.UserData = {  
  proxyConfig: {
    status: false,
    type: '',
    host: '',
    port: 8080,
  },
  forum: {username: '', password: ''},
  info: [
    {
      name: 'bangumi',
      time: '--',
      status: '账号未登录',
      username: '',
      password: '',
      enable: true,
      cookies: []
    },
    {
      name: 'nyaa',
      time: '--',
      status: '账号未登录',
      username: '',
      password: '',
      enable: true,
      cookies: []
    },
    {
      name: 'acgrip',
      time: '--',
      status: '账号未登录',
      username: '',
      password: '',
      enable: true,
      cookies: []
    },
    {
      name: 'dmhy',
      time: '--',
      status: '账号未登录',
      username: '',
      password: '',
      enable: true,
      cookies: []
    },
    {
      name: 'acgnx_g',
      time: '--',
      status: '账号未登录',
      username: '',
      password: '',
      enable: true,
      cookies: []
    },
    {
      name: 'acgnx_a',
      time: '--',
      status: '账号未登录',
      username: '',
      password: '',
      enable: true,
      cookies: []
    }]
}

//后面会用到
//等待
function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
//获取当前日期
function getNowFormatDate() {
  let date = new Date(),
    year = date.getFullYear(), //获取完整的年份(4位)
    month = date.getMonth() + 1, //获取当前月份(0-11,0代表1月)
    strDate = date.getDate(),
    hour = date.getHours(), //获取当前小时(0 ~ 23)
    minute = date.getMinutes(), //获取当前分钟(0 ~ 59)
    second = date.getSeconds() //获取当前秒数(0 ~ 59) // 获取当前日(1-31)
  let m: string, d: string, h: string, s: string, mi: string;
  m = month < 10 ? `0${month}` : month.toString()
  d = strDate < 10 ? `0${strDate}` : strDate.toString() 
  h = hour < 10 ? `0${hour}` : hour.toString()
  mi = minute < 10 ? `0${minute}` : minute.toString()
  s = second < 10? `0${second}` : second.toString()
  return `${year}-${m}-${d}T${h}:${mi}:${s}`
}
//获取并处理当前时间
function getCurrentTime() {
  var stamp= new Date().getTime() + 8 * 60 * 60 * 1000;
  var currentTime = new Date(stamp).toISOString().replace(/T/, ' ').replace(/\..+/, '').substring(0, 19)
  return currentTime
}

//axios拦截添加cookie和useragent,主站设置认证
axios.interceptors.request.use(
  config => {
    let type = ''
    if (config.url!.includes('vcb-s.com')) {
      let key = "Basic " + btoa(userDB.data.forum.username + ':' + userDB.data.forum.password)
      config.headers['Authorization'] = key
      return config
    }
    else if (config.url!.includes('bangumi.moe')) type = 'bangumi'
    else if (config.url!.includes('nyaa.si')) type = 'nyaa'
    else if (config.url!.includes('acg.rip')) type = 'acgrip'
    else if (config.url!.includes('dmhy.org')) type = 'dmhy'
    else if (config.url!.includes('share.acgnx.se')) type = 'acgnx_a'
    else if (config.url!.includes('www.acgnx.se')) type = 'acgnx_g'
    else return config
    const info = userDB.data.info.find(item => item.name == type) as Config.LoginInfo
    let str = ''
    info.cookies.forEach(item => {
      str += `${item.name}=${item.value}; `
    })
    config.headers['Cookie'] = str
    config.headers['User-Agent'] = Config.userAgent
    return config
  },
  error => {console.log(error)}
)
//阻止重定向和取消状态码异常
axios.defaults.maxRedirects = 0
axios.defaults.validateStatus = () => true
//设置网络错误重试
axiosRetry(axios, { 
  retries: 5,
  retryCondition: (error) => {
    if (error.message.includes('status code'))
      return false
    return true
  }
})

/*
  主窗口设置
*/

let mainWindowWebContent: Electron.WebContents //暴露主窗口上下文，用于刷新页面
function createWindow(): void {
  
  const partition = 'persist:main' //隔离窗口缓存

  const mainWindow = new BrowserWindow({
    width: 1150,
    minWidth: 1150,
    minHeight: 650,
    height: 650,
    show: false,
    autoHideMenuBar: true,
    titleBarStyle: 'hidden',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      partition: partition
    },
    icon: appIcon,
  })
  mainWindowWebContent = mainWindow.webContents
  const ses = session.fromPartition(partition)

  /*
  拦截涉及ReCaptcha的请求，并篡改响应，这样处理因为reCaptcha只能在指定的域上工作，因此需要欺骗浏览器（不改变域名）。
  参考https://www.electronjs.org/zh/docs/latest/api/net#netfetchinput-init
  */
  ses.protocol.handle('https', async (req) => {
    try {
      const {host, pathname} = new URL(req.url)
      if (pathname == '/grecaptcha' && host == 'nyaa.si') {
        const data = fs.readFileSync(nyaaResponse, {encoding: 'utf-8'})
        return new Response(data, {
          headers: { 'content-type': 'text/html' }
        })
      }
      else if (pathname == '/grecaptcha' && host.includes('acgnx')) {
        const data = fs.readFileSync(acgnxResponse, {encoding: 'utf-8'})
        return new Response(data, {
          headers: { 'content-type': 'text/html' }
        })
      }
      else {
        return net.fetch(req, { bypassCustomProtocolHandlers: true }) //跳过协议拦截，否则会造成无限递归
      }
    }
    catch (err) {
      console.log(err)
      return new Response('bad', {
          status: 400,
          headers: { 'content-type': 'text/html' }
        })
    }
  })

  // 拦截设置useragent和cookies
  session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
    let type = ''
    if (details.url.includes('bangumi.moe')) type = 'bangumi'
    else if (details.url.includes('nyaa.si')) type = 'nyaa'
    else if (details.url.includes('acg.rip')) type = 'acgrip'
    else if (details.url.includes('dmhy.org')) type = 'dmhy'
    else if (details.url.includes('share.acgnx.se')) type = 'acgnx_a'
    else if (details.url.includes('www.acgnx.se')) type = 'acgnx_g'
    else {
      callback({ requestHeaders: details.requestHeaders })
      return
    }
    const info = userDB.data.info.find(item => item.name == type) as Config.LoginInfo
    let str = ''
    info.cookies.forEach(item => {
      str += `${item.name}=${item.value}; `
    })
    details.requestHeaders['Cookie'] = str
    details.requestHeaders['User-Agent'] = Config.userAgent
    callback({ requestHeaders: details.requestHeaders })
  })
  //设置代理
  let pconf = userDB.data.proxyConfig
  session.defaultSession.setProxy({ 
    proxyRules: `${pconf.type}://${pconf.host}:${pconf.port}` 
  })

  //监听程序崩溃
  mainWindowWebContent.on('render-process-gone', (_e, detail) => {
    console.log(detail)
    app.quit()
  })

  //窗口控制
  ipcMain.on("global_winHandle", (_event, message: string) => {
    let { command } = JSON.parse(message) as Message.Global.WinHandle
    if (command == "close") {
      mainWindow.close() 
    }
    else if (command == "mini") {
      mainWindow.minimize()
    }
    else{
      if (mainWindow.isMaximized()) {
        mainWindow.restore()
      }
      else{
        mainWindow.maximize()
      }
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  //使用系统默认应用打开外部链接
  mainWindow.webContents.on('will-navigate', (e, url) => {
    e.preventDefault()
    shell.openExternal(url)
  })
  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  //主窗口关闭时同时关闭应用
  mainWindow.on('close', _event => app.quit())

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

/*
  登录窗口设置
*/

async function createLoginWindow(type: string) {

  let url:string
  if (type == 'bangumi') url = 'https://bangumi.moe'
  else if (type == 'nyaa') url = 'https://nyaa.si/login'
  else if (type == 'acgrip') url = 'https://acg.rip/users/sign_in'
  else if (type == 'dmhy') url = 'https://www.dmhy.org/user'
  else if (type == 'acgnx_g') url = 'https://www.acgnx.se/user.php?o=login'
  else url = 'https://share.acgnx.se/user.php?o=login'

  const partition = 'persist:login' //隔离窗口缓存
  let ses = session.fromPartition(partition)

  //获取并保存cookie信息
  async function setCookies(type: string, url: string) {
    await ses.cookies.get({url: url}).then((cookies) => {
      userDB.data.info.find(item => item.name == type)!.cookies = cookies
    }).catch(err => {console.log(err)})
    //单独处理末日动漫的cloudflare验证
    if (type.includes('acgnx'))
      await ses.cookies.get({name: 'cf_clearance'}).then((cookies) => {
        userDB.data.info.find(item => item.name == type)!.cookies.push(...cookies)
      }).catch(err => {console.log(err)})
    await userDB.write()
  }

  const loginWindow = new BrowserWindow({
    width: 1200,
    minWidth: 950,
    minHeight: 750,
    height: 600,
    autoHideMenuBar: true,
    show: false,
    icon: appIcon,
    webPreferences: {
      partition: partition
    },
  })

  loginWindow.on('ready-to-show', async () => {
    loginWindow.show()
  })
  
  loginWindow.on('close', async (e) => {
    try{
      e.preventDefault()
      //保存cookie并检查登录状态
      await setCookies(type, url)
      await BT.checkLoginStatus(JSON.stringify({type}))
      //告知页面刷新数据
      mainWindowWebContent.send('BT_refreshLoginData')
    }
    catch(err){
      console.log(err)
    }
    finally{
      loginWindow.destroy()
    }
  })

  //拦截设置useragent
  ses.webRequest.onBeforeSendHeaders((details, callback) => {
    details.requestHeaders['User-Agent'] = Config.userAgent
    callback({ requestHeaders: details.requestHeaders })
  })
  //配置代理
  let pconf = userDB.data.proxyConfig
  if (pconf.status) {
    await loginWindow.webContents.session.setProxy({ 
      proxyRules: `${pconf.type}://${pconf.host}:${pconf.port}` 
    });
  }

  loginWindow.loadURL(url)
}

/*
  部分全局设置，主要为App.vue和多组件共用的部分函数
*/

namespace Global {

  //保存代理设置
  export async function setProxyConfig(message: string) {
    let pconf: Message.Global.ProxyConfig = JSON.parse(message)
    userDB.data.proxyConfig = pconf
    await userDB.write()
    app.relaunch()
    app.exit()
  }
  //获取代理设置
  export function getProxyConfig() {
    let msg: Message.Global.ProxyConfig = userDB.data.proxyConfig
    return JSON.stringify(msg)
  }

  //打开文件并返回文件路径
  export async function getFilePath(msg: string) {
    let { type }: Message.Global.FileType = JSON.parse(msg)
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties:[ 'openFile' ],
      filters: [{name: type, extensions:[type]}]
    })
    if (canceled) return ''
    let result: Message.Global.Path = { path: filePaths[0] }
    return JSON.stringify(result)
  }
  //打开文件夹并返回路径
  export async function getFolderPath() {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties:[ 'openDirectory' ]
    })
    if (canceled) return ''
    let result: Message.Global.Path = { path: filePaths[0] }
    return JSON.stringify(result)
  }
  //打开目录
  export async function openFolder(msg: string){
    let { path }: Message.Global.Path = JSON.parse(msg)
    shell.openPath(path)
  }
  
  //写入剪切板
  export function writeClipboard(msg: string) {
    let { str }: Message.Global.Clipboard = JSON.parse(msg)
    clipboard.writeText(str)
  }

  //读取文件内容
  export async function readFileContent() {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties:[ 'openFile' ]
    })
    let content = ''
    if (canceled) content = '' 
    content = fs.readFileSync(filePaths[0], {encoding: 'utf-8'})
    let result: Message.Global.FileContent = { content }
    return JSON.stringify(result)
  }
}

/* 
BT站功能相关
*/

namespace BT {

  //获取登录窗口回话
  export let ses: Session

  //判断登录状态，若未登录尝试自动登录或唤起验证码对话框
  export async function checkLoginStatus(msg: string) {
    try {
      let { type }: Message.BT.AccountType = JSON.parse(msg)
      if (type == 'all') {
        checkLoginStatus('bangumi')
        checkLoginStatus('nyaa')
        checkLoginStatus('dmhy')
        checkLoginStatus('acgrip')
        checkLoginStatus('acgnx_a')
        checkLoginStatus('acgnx_g')
        return ''
      }
      else {
        let info: Config.LoginInfo = userDB.data.info.find(item => item.name === type)!
        if (!info.enable) {
          info.time = getCurrentTime()
          info.status = '账户已禁用'
          await userDB.write()
          mainWindowWebContent.send('BT_refreshLoginData')
        } 
        else {
          if (type == 'bangumi') {
            await checkBangumiLoginStatus(info)
            await userDB.write()
            mainWindowWebContent.send('BT_refreshLoginData')
            if (info.status == '账号未登录')
              loginBangumi(info)
          }
          if (type == 'acgrip') {
            await checkAcgripLoginStatus(info)
            await userDB.write()
            mainWindowWebContent.send('BT_refreshLoginData')
            if (info.status == '账号未登录')
              loginAcgrip(info)
          }
          if (type == 'nyaa') {
            await checkNyaaLoginStatus(info)
            await userDB.write()
            mainWindowWebContent.send('BT_refreshLoginData')
            if (info.status == '账号未登录'){
              let msg: Message.BT.ReCaptchaType = { type: 'nyaa'}
              mainWindowWebContent.send('BT_loadReCaptcha', JSON.stringify(msg))
            }
          }
          if (type == 'acgnx_a') {
            await checkAcgnxALoginStatus(info)
            await userDB.write()
            mainWindowWebContent.send('BT_refreshLoginData')
            if (info.status == '账号未登录'){
              let msg: Message.BT.ReCaptchaType = { type: 'acgnx_a'}
              mainWindowWebContent.send('BT_loadReCaptcha', JSON.stringify(msg))
            }
          }
          if (type == 'acgnx_g') {
            await checkAcgnxGLoginStatus(info)
            await userDB.write()
            mainWindowWebContent.send('BT_refreshLoginData')
            if (info.status == '账号未登录'){
              let msg: Message.BT.ReCaptchaType = { type: 'acgnx_g'}
              mainWindowWebContent.send('BT_loadReCaptcha', JSON.stringify(msg))
            }
          }
          if (type == 'dmhy') {
            await checkDmhyLoginStatus(info)
            await userDB.write()
            mainWindowWebContent.send('BT_refreshLoginData')
            if (info.status == '账号未登录'){
              const result = await axios.get('https://www.dmhy.org/common/generate-captcha?code=' + Date.now())
              //设置PHP_SESSION以保证验证码合法
              if (result.headers['set-cookie']) {
                result.headers['set-cookie']!.forEach(async item => {
                  let cookie = item.split(';')[0]
                  let index = cookie.indexOf('=')
                  let name = cookie.slice(0, index)
                  let value = cookie.slice(index + 1, cookie.length)
                  await ses.cookies.set({url: 'https://www.dmhy.org', name: name, value: value, httpOnly: true, expirationDate: Date.now() + 31536000})
                });
                await ses.cookies.get({url: 'https://www.dmhy.org'}).then((cookies) => {
                  info.cookies.push(...cookies)
                }).catch(err => {console.log(err)})
                userDB.write()
              }
              let msg: Message.BT.ReCaptchaType = { type: 'nyaa'}
              mainWindowWebContent.send('BT_loadReCaptcha', JSON.stringify(msg))
            }
          }
        }
        let msg: Message.BT.LoginStatus = {status: info.status}
        return JSON.stringify(msg)
      }
    }
    catch (err) {
      console.log(err)
      return ''
    }
  }
  async function checkBangumiLoginStatus(info: Config.LoginInfo) {
    try {
      const url = 'https://bangumi.moe/api/team/myteam'
      let response = await axios.get(url, { responseType: 'text' })
      for (let i = 0;i < 5;i++) {
        if (response.status === 200) {
          break
        }
        response = await axios.get(url, { responseType: 'text' })
      }
      const {data, status} = response
      if (status != 200) {
        throw response
      }
      if (data == '[]') {
        info.time = getCurrentTime()
        info.status = '账号未登录'
      }
      else {
        info.time = getCurrentTime()
        info.status = '账号已登录'
      }
    }
    catch (err) {
      console.log(err)
      info.time = getCurrentTime()
    }
  }
  async function checkNyaaLoginStatus(info: Config.LoginInfo) {
    try {
      const url = 'https://nyaa.si/profile'
      let response = await axios.get(url, { responseType: 'text' })
      for (let i = 0;i < 5;i++) {
        if (response.status === 200 || response.status === 302) {
          break
        }
        response = await axios.get(url, { responseType: 'text' })
      }
      const {status} = response
      if (status == 302) {
        info.time = getCurrentTime()
        info.status = '账号未登录'
      }
      else if (status == 200) {
        info.time = getCurrentTime()
        info.status = '账号已登录'
      }
      else {
        throw response
      }
    }
    catch (err) {
      console.log(err)
      info.time = getCurrentTime()
    }
  }
  async function checkAcgripLoginStatus(info: Config.LoginInfo) {
    try {
      const url = 'https://acg.rip/cp'
      let response = await axios.get(url, { responseType: 'text' })
      for (let i = 0;i < 5;i++) {
        if (response.status === 200 || response.status === 302) {
          break
        }
        response = await axios.get(url, { responseType: 'text' })
      }
      const {status} = response
      if (status == 302) {
        info.time = getCurrentTime()
        info.status = '账号未登录'
      }
      else if (status == 200) {
        info.time = getCurrentTime()
        info.status = '账号已登录'
      }
      else {
        throw response
      }
    }
    catch (err) {
      console.log(err)
      info.time = getCurrentTime()
    }
  }
  async function checkDmhyLoginStatus(info: Config.LoginInfo) {
    try {
      const url = 'https://www.dmhy.org/user'
      let response = await axios.get(url, { responseType: 'text' })
      for (let i = 0;i < 5;i++) {
        if (response.status === 200 || response.status === 302) {
          break
        }
        response = await axios.get(url, { responseType: 'text' })
      }
      const {status} = response
      if (status == 302) {
        info.time = getCurrentTime()
        info.status = '账号未登录'
      }
      else if (status == 200) {
        info.time = getCurrentTime()
        info.status = '账号已登录'
      }
      else {
        throw response
      }
    }
    catch (err) {
      console.log(err)
      info.time = getCurrentTime()
    }
  }
  async function checkAcgnxGLoginStatus(info: Config.LoginInfo) {
    try {
      const url = 'https://www.acgnx.se/user.php'
      let response = await axios.get(url, { responseType: 'text' })
      for (let i = 0;i < 5;i++) {
        if (response.status === 200 || response.status === 302 || response.status === 403) {
          break
        }
        response = await axios.get(url, { responseType: 'text' })
      }
      const {data, status} = response
      if (status == 302) {
        info.time = getCurrentTime()
        info.status = '账号未登录'
      }
      else if (status == 403) {
        info.time = getCurrentTime()
        info.status = '防火墙阻止'
        createLoginWindow('acgnx_g')
      }
      else if (status == 200) {
        if ((data as string).includes('Your request has been blocked, Please complete the captcha to access.')) {
          info.time = getCurrentTime()
          info.status = '防火墙阻止'
          createLoginWindow('acgnx_g')
        }
        else {
          info.time = getCurrentTime()
          info.status = '账号已登录'
        }
      }
      else {
        throw response
      }
    }
    catch (err) {
      console.log(err)
      info.time = getCurrentTime()
    }
  }
  async function checkAcgnxALoginStatus(info: Config.LoginInfo) {
    try {
      const url = 'https://share.acgnx.se/user.php'
      let response = await axios.get(url, { responseType: 'text' })
      for (let i = 0;i < 5;i++) {
        if (response.status === 200 || response.status === 302 || response.status === 403) {
          break
        }
        response = await axios.get(url, { responseType: 'text' })
      }
      const {data, status} = response
      if (status == 302) {
        info.time = getCurrentTime()
        info.status = '账号未登录'
      }
      else if (status == 403) {
        info.time = getCurrentTime()
        info.status = '防火墙阻止'
        createLoginWindow('acgnx_a')
      }
      else if (status == 200) {
        if ((data as string).includes('Your request has been blocked, Please complete the captcha to access.')) {
          info.time = getCurrentTime()
          info.status = '防火墙阻止'
        createLoginWindow('acgnx_a')
        }
        else {
          info.time = getCurrentTime()
          info.status = '账号已登录'
        }
      }
      else {
        throw response
      }
    }
    catch (err) {
      console.log(err)
      info.time = getCurrentTime()
    }
  }

  //登录BT账户
  export async function loginAccount(msg: string) {
    let {type, key}: Message.BT.Captcha = JSON.parse(msg)
    let info = userDB.data.info.find(item => item.name == type)!
    if (type == 'nyaa')
      loginNyaa(info, key)
    if (type == 'acgnx_a')
      loginAcgnxA(info, key)
    if (type == 'acgnx_g')
      loginAcgnxG(info, key)
    if (type == 'dmhy')
      loginDmhy(info, key)
  }
  async function loginBangumi(info: Config.LoginInfo) {
    try {
      info.time = getCurrentTime()
      info.status = '正在登录'
      await userDB.write()
      mainWindowWebContent.send('BT_refreshLoginData')
      const url = 'https://bangumi.moe/api/user/signin'
      let uname = info.username
      let pwd = info.password
      let response = await axios.post(url, {username: uname, password: CryptoJS.MD5(pwd).toString()})
      if (response.data.success) {
        response.headers['set-cookie']!.forEach(async item => {
          let cookie = item.split(';')[0]
          let index = cookie.indexOf('=')
          let name = cookie.slice(0, index)
          let value = cookie.slice(index + 1, cookie.length)
          await ses.cookies.set({url: 'https://bangumi.moe', name: name, value: value, httpOnly: true, expirationDate: Date.now() + 31536000})
        });
        await ses.cookies.get({url: 'https://bangumi.moe'}).then((cookies) => {
          info.cookies.push(...cookies)
        }).catch(err => {console.log(err)})
        info.time = getCurrentTime()
        info.status = '账号已登录'
        await userDB.write()
        mainWindowWebContent.send('BT_refreshLoginData')
      }
      else {
        info.time = getCurrentTime()
        info.status = '账号密码错误'
        await userDB.write()
        mainWindowWebContent.send('BT_refreshLoginData')
      }
    }
    catch (err) {
      console.log(err)
    }
  }
  async function loginAcgrip(info: Config.LoginInfo) {
    try {
      info.time = getCurrentTime()
      info.status = '正在登录'
      await userDB.write()
      mainWindowWebContent.send('BT_refreshLoginData')
      const url = 'https://acg.rip/users/sign_in'
      const formData = new FormData()
      //CSRF验证
      const csrf = await axios.get(url, { responseType: 'text' })
      let cookievalue = csrf.headers['set-cookie']![0].match(/_kanako_session=([\S]*?);/)![1]
      let _kanako_session = info.cookies.find((item => item.name == '_kanako_session'))
      if (_kanako_session)
        _kanako_session.value = cookievalue
      else 
        info.cookies.push({name: '_kanako_session', value: cookievalue, sameSite: 'lax'})
      await userDB.write()
      const token = (csrf.data as string).match(/name="csrf-token"\scontent="([\S]*?)"/)![1]
      formData.append('authenticity_token', token)
      let uname = info.username
      let pwd = info.password
      formData.append('user[email]', uname)
      formData.append('user[password]', pwd)
      formData.append('user[remember_me]', '1')
      formData.append('commit', '登录')
      let response = await axios.post(url, formData, { responseType: 'text' })
      if (response.status == 302) {
        response.headers['set-cookie']!.forEach(async item => {
          let cookie = item.split(';')[0]
          let index = cookie.indexOf('=')
          let name = cookie.slice(0, index)
          let value = cookie.slice(index + 1, cookie.length)
          await ses.cookies.set({url: 'https://acg.rip', name: name, value: value, httpOnly: true, expirationDate: Date.now() + 31536000})
        });
        await ses.cookies.get({url: 'https://acg.rip'}).then((cookies) => {
          info.cookies.push(...cookies)
        }).catch(err => {console.log(err)})
        info.time = getCurrentTime()
        info.status = '账号已登录'
        await userDB.write()
        mainWindowWebContent.send('BT_refreshLoginData')
      }
    }
    catch (err) {
      console.log(err)
    }
  }
  async function loginNyaa(info: Config.LoginInfo, key: string) {
    try {
      info.time = getCurrentTime()
      info.status = '正在登录'
      await userDB.write()
      mainWindowWebContent.send('BT_refreshLoginData')
      let url = 'https://nyaa.si/login'
      const formData = new FormData()
      let uname = info.username
      let pwd = info.password
      formData.append('username', uname)
      formData.append('password', pwd)
      formData.append('g-recaptcha-response', key)
      let response = await axios.post(url, formData, { responseType: 'text' })
      if (response.status == 302) {
        response.headers['set-cookie']!.forEach(async item => {
          let cookie = item.split(';')[0]
          let index = cookie.indexOf('=')
          let name = cookie.slice(0, index)
          let value = cookie.slice(index + 1, cookie.length)
          await ses.cookies.set({url: 'https://nyaa.si', name: name, value: value, httpOnly: true, expirationDate: Date.now() + 31536000})
        });
        await ses.cookies.get({url: 'https://nyaa.si'}).then((cookies) => {
          info.cookies.push(...cookies)
        }).catch(err => {console.log(err)})
        info.time = getCurrentTime()
        info.status = '账号已登录'
        await userDB.write()
        mainWindowWebContent.send('BT_refreshLoginData')
      }
      else if ((response.data as string).includes('Incorrect username or password')) {
        info.time = getCurrentTime()
        info.status = '账号密码错误'
        await userDB.write()
        mainWindowWebContent.send('BT_refreshLoginData')
      }
      else {
        throw response
      }
    }
    catch (err) {
      console.log(err)
    }
  }
  async function loginDmhy(info: Config.LoginInfo, key: string) {
    try {
      info.time = getCurrentTime()
      info.status = '正在登录'
      await userDB.write()
      mainWindowWebContent.send('BT_refreshLoginData')
      let url = 'https://www.dmhy.org/user/login'
      let uname = info.username
      let pwd = info.password
      const formData = new FormData()
      formData.append('goto', 'https://www.dmhy.org/')
      formData.append('email', uname)
      formData.append('password', pwd)
      formData.append('login_node', '0')
      formData.append('cookietime', '315360000')
      formData.append('captcha_code', key)
      let response = await axios.post(url, formData, { responseType: 'text' })
      if ((response.data as string).includes('登入成功')) {
        response.headers['set-cookie']!.forEach(async item => {
          let cookie = item.split(';')[0]
          let index = cookie.indexOf('=')
          let name = cookie.slice(0, index)
          let value = cookie.slice(index + 1, cookie.length)
          await ses.cookies.set({url: 'https://www.dmhy.org', name: name, value: value, httpOnly: true, expirationDate: Date.now() + 31536000})
        });
        await ses.cookies.get({url: 'https://www.dmhy.org'}).then((cookies) => {
          info.cookies.push(...cookies)
        }).catch(err => {console.log(err)})
        info.time = getCurrentTime()
        info.status = '账号已登录'
        await userDB.write()
        mainWindowWebContent.send('BT_refreshLoginData')
      }
      else if ((response.data as string).includes('帐户密码错误')) {
        info.time = getCurrentTime()
        info.status = '账号密码错误'
        await userDB.write()
        mainWindowWebContent.send('BT_refreshLoginData')
      }
      else if ((response.data as string).includes('验证码错误')) {
        info.time = getCurrentTime()
        info.status = '验证码错误'
        await userDB.write()
        mainWindowWebContent.send('BT_refreshLoginData')
      }
      else {
        throw response
      }
    }
    catch (err) {
      console.log(err)
    }
  }
  async function loginAcgnxG(info: Config.LoginInfo, key: string) {
    try {
      info.time = getCurrentTime()
      info.status = '正在登录'
      await userDB.write()
      mainWindowWebContent.send('BT_refreshLoginData')
      let url = 'https://www.acgnx.se/user.php?o=login'
      const formData = new FormData()
      let uname = info.username
      let pwd = info.password
      formData.append('op', 'login')
      formData.append('url', 'http%3A%2F%2Fwww.acgnx.se')
      formData.append('emailaddress', uname)
      formData.append('password', pwd)
      formData.append('cookietime', '315360000')
      formData.append('g-recaptcha-response', key)
      let response = await axios.post(url, formData, { responseType: 'text' })
      if (response.status == 302) {
        response.headers['set-cookie']!.forEach(async item => {
          let cookie = item.split(';')[0]
          let index = cookie.indexOf('=')
          let name = cookie.slice(0, index)
          let value = cookie.slice(index + 1, cookie.length)
          await ses.cookies.set({url: 'https://www.acgnx.se', name: name, value: value, httpOnly: true, expirationDate: Date.now() + 31536000})
        });
        await ses.cookies.get({url: 'https://www.acgnx.se'}).then((cookies) => {
          info.cookies.push(...cookies)
        }).catch(err => {console.log(err)})
        info.time = getCurrentTime()
        info.status = '账号已登录'
        await userDB.write()
        mainWindowWebContent.send('BT_refreshLoginData')
      }
      else if ((response.data as string).includes('登錄密碼不正確')) {
        info.time = getCurrentTime()
        info.status = '账号密码错误'
        await userDB.write()
        mainWindowWebContent.send('BT_refreshLoginData')
      }
      else {
        throw response
      }
    }
    catch (err) {
      console.log(err)
    }
  }
  async function loginAcgnxA(info: Config.LoginInfo, key: string) {
    try {
      info.time = getCurrentTime()
      info.status = '正在登录'
      await userDB.write()
      mainWindowWebContent.send('BT_refreshLoginData')
      let url = 'https://share.acgnx.se/user.php?o=login'
      const formData = new FormData()
      let uname = info.username
      let pwd = info.password
      formData.append('op', 'login')
      formData.append('url', 'http%3A%2F%2Fwww.acgnx.se')
      formData.append('emailaddress', uname)
      formData.append('password', pwd)
      formData.append('cookietime', '315360000')
      formData.append('g-recaptcha-response', key)
      let response = await axios.post(url, formData, { responseType: 'text' })
      if (response.status == 302) {
        response.headers['set-cookie']!.forEach(async item => {
          let cookie = item.split(';')[0]
          let index = cookie.indexOf('=')
          let name = cookie.slice(0, index)
          let value = cookie.slice(index + 1, cookie.length)
          await ses.cookies.set({url: 'https://share.acgnx.se', name: name, value: value, httpOnly: true, expirationDate: Date.now() + 31536000})
        });
        await ses.cookies.get({url: 'https://share.acgnx.se'}).then((cookies) => {
          info.cookies.push(...cookies)
        }).catch(err => {console.log(err)})
        info.time = getCurrentTime()
        info.status = '账号已登录'
        await userDB.write()
        mainWindowWebContent.send('BT_refreshLoginData')
      }
      else if ((response.data as string).includes('登錄密碼不正確')) {
        info.time = getCurrentTime()
        info.status = '账号密码错误'
        await userDB.write()
        mainWindowWebContent.send('BT_refreshLoginData')
      }
      else {
        throw response
      }
    }
    catch (err) {
      console.log(err)
    }
  }

  //打开登录窗口
  export async function openLoginWindow(msg: string) {
    let { type }: Message.BT.AccountType = JSON.parse(msg)
    createLoginWindow(type)
  }
  
  //保存用户密码
  export async function saveAccountInfo(msg: string) {
    const result: Message.BT.AccountInfo = JSON.parse(msg)
    let info = userDB.data.info.find(item => item.name == result.type)!
    info.username = result.username
    info.password = result.password
    info.enable = result.enable
    await userDB.write()
  }

  //获取登录信息
  export async function getAccountInfo(msg: string) {
    let { type }: Message.BT.AccountType = JSON.parse(msg)
    let info = userDB.data.info.find(item => item.name == type)!
    let result: Message.BT.AccountInfo = {
      type: info.name,
      time: info.time,
      status: info.status,
      username: info.username,
      password: info.password,
      enable: info.enable
    }
    return JSON.stringify(result)
  }

  //清除登录状态
  export async function clearStorage() {
    const partition = 'persist:login'
    let ses = session.fromPartition(partition)
    await ses.clearStorageData()
    userDB.data.info.forEach((item) =>{
      item.cookies = []
    })
    await userDB.write()
    mainWindowWebContent.send('BT_refreshLoginData')
  }

  //导入导出Cookies
  export async function exportCookies(msg: string) {
    const { canceled, filePath } = await dialog.showSaveDialog({filters: [{name: 'JSON', extensions: ['json']}]})
    if (canceled) return
    let { type }: Message.BT.AccountInfo = JSON.parse(msg)
    let info = userDB.data.info.find(item => item.name == type)!
    fs.writeFileSync(filePath, JSON.stringify(info.cookies))
  }
  export async function importCookies(msg: string) {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openFile'], 
      filters: [{name: 'JSON', extensions: ['json']}]
    })
    if (canceled) return
    let { type }: Message.BT.AccountInfo = JSON.parse(msg)
    userDB.data.info.find(item => item.name == type)!.cookies = JSON.parse(fs.readFileSync(filePaths[0], {encoding: 'utf-8'}))
    await userDB.write()
  }

  //BT发布
  export async function publish(msg: string) {
    try {
      let result = ''
      let { id, type }: Message.Task.ContentType = JSON.parse(msg)
      let task = taskDB.data.tasks.find(item => item.id == id)!
      const config: Config.PublishConfig = await JSON.parse(fs.readFileSync(task.path + '\\config.json', {encoding: 'utf-8'}))
      if (type == 'bangumi_all')
        result = await publishBangumi(task, config, true)
      else if (type == 'bangumi')
        result = await publishBangumi(task, config, false)
      else if (type == 'nyaa')
        result = await publishNyaa(task, config)
      else if (type == 'dmhy')
        result = await publishDmhy(task, config)
      else if (type == 'acgnx_a')
        result = await publishAcgnxA(task, config)
      else if (type == 'acgnx_g')
        result = await publishAcgnxG(task, config)
      else if (type == 'acgrip')
        result = await publishAcgrip(task, config)
      else result = 'failed'
      let message: Message.Task.Result = { result }
      return JSON.stringify(message)
    } catch (err) {
      console.log(err)
      let message: Message.Task.Result = { result: 'failed' }
      return JSON.stringify(message)
    }
  }
  async function publishBangumi(task: Config.Task, config: Config.PublishConfig, sync: boolean) {
    try {
      let html = fs.readFileSync(task.path + '\\bangumi.html', {encoding: 'utf-8'})
      const torrent = fs.readFileSync(`${task.path}\\${config.torrentName}`)
      const formData = new FormData()
      const team = await axios.get('https://bangumi.moe/api/team/myteam', { responseType: 'json' })
      let team_id: string = team.data[0]._id
      formData.append('category_tag_id', config.category_bangumi)
      formData.append('title',  config.title)
      formData.append('introduction', html)
      formData.append('tag_ids', config.tags.map(item => item.value).toString())
      formData.append('btskey', 'undefined')
      formData.append('team_id', team_id)
      if (sync) formData.append('teamsync', '1')
      formData.append('file', new Blob([torrent], {type: 'application/x-bittorrent'}), config.torrentName)
      const response = await axios.post('https://bangumi.moe/api/torrent/add', formData, { responseType: 'json' })
      if (response.status != 200) throw response
      if (response.data.success === true) {
        task.bangumi = 'https://bangumi.moe/torrent/' + response.data.torrent._id
        if (sync) {
          await getBangumiSyncLink(task, response.data.torrent._id)
        }
        await taskDB.write()
        return 'success'
      }
      else if (response.data.success === false && (response.data.message as string).includes('torrent same as')) {
        if (!task.bangumi) {
          let id = (response.data.message as string).slice(16)
          task.bangumi = 'https://bangumi.moe/torrent/' + id
          await taskDB.write()
        }
        return 'exist'
      }
      else {
        console.log(response)
        return 'failed'
      }
    }
    catch (err) {
      console.log(err)
      return 'failed'
    }
  }
  async function publishNyaa(task: Config.Task, config: Config.PublishConfig) {
    try {
      const torrent = fs.readFileSync(`${task.path}\\${config.torrentName}`)
      let md = fs.readFileSync(task.path + '\\nyaa.md', {encoding: 'utf-8'})
      const formData = new FormData()
      formData.append('torrent_file', new Blob([torrent], {type: 'application/x-bittorrent'}), config.torrentName)
      formData.append('display_name', config.title)
      formData.append('category', config.category_nyaa)
      formData.append('information', config.information)
      if (config.completed) 
        formData.append('is_complete', 'y')
      if (config.remake) 
        formData.append('is_remake', 'y')
      formData.append('description', md)
      const response = await axios.post('https://nyaa.si/upload', formData, { responseType: 'text' })
      if ((response.data as string).includes('You should be redirected automatically to target URL')) {
        task.nyaa = response.headers['location']
        await taskDB.write()
        return 'success'
      }
      else if((response.data as string).includes('This torrent already exists')) {
        if (!task.nyaa) {
          let id = (response.data as string).match(/This\storrent\salready\sexists\s\(#(\d+)\)/)![1]
          task.nyaa = 'https://nyaa.si/view/' + id
          await taskDB.write()
        }
        return 'exist'
      }
      else {
        console.log(response)
        return 'failed'
      }
    }
    catch (err) {
      console.log(err)
      return 'failed'
    }
  }
  async function publishDmhy(task: Config.Task, config: Config.PublishConfig) {
    try {
      const torrent = fs.readFileSync(`${task.path}\\${config.torrentName}`)
      let html = fs.readFileSync(task.path + '\\bangumi.html', {encoding: 'utf-8'})
      const formData = new FormData()
      const team = await axios.get('https://www.dmhy.org/team/myteam', { responseType: 'text'})
      let team_id = (team.data as string).match(/<tbody>[\s\S]*?<td>([\S]*?)<\/td>/)
      if (config.category_bangumi == '54967e14ff43b99e284d0bf7') 
        formData.append('sort_id', '31')
      else if (config.category_bangumi == '549ef207fe682f7549f1ea90')
        formData.append('sort_id', '2')
      else formData.append('sort_id', '1')
      formData.append('team_id', team_id ? team_id[1] : '')
      formData.append('bt_data_title', config.title)
      let imgsrc = html.match(/<img[\s\S]*?src="([\S]*?)"/)![1]
      formData.append('poster_url', imgsrc)
      formData.append('bt_data_intro', html)
      formData.append('tracker', '')
      formData.append('MAX_FILE_SIZE', '2097152')
      formData.append('bt_file', new Blob([torrent], {type: 'application/x-bittorrent'}), config.torrentName)
      formData.append('disable_download_seed_file', '0')
      formData.append('emule_resource', '')
      formData.append('synckey', '')
      formData.append('submit', '提交')
      const response = await axios.post('https://www.dmhy.org/topics/add', formData, { responseType: 'text' })
      if (response.status != 200) throw response
      if ((response.data as string).includes('種子已存在，請不要重複上傳')) {
        if (!task.dmhy) {
          let src = await getDmhyLink(config.title)
          if (src == '')
            task.dmhy = '未找到链接'
          else 
            task.dmhy = 'https://www.dmhy.org' + src
          await taskDB.write()
        }
        return 'exist'
      }
      if ((response.data as string).includes('上傳成功')) {
        let src = await getDmhyLink(config.title)
        if (src == '')
          task.dmhy = '未找到链接'
        else 
          task.dmhy = 'https://www.dmhy.org' + src
        await taskDB.write()
        return 'success'
      }
      else {
        console.log(response)
        return 'failed'
      }
    }
    catch (err) {
      console.log(err)
      return 'failed'
    }
  }
  async function publishAcgnxA(task: Config.Task, config: Config.PublishConfig) {
    try {
      let html = fs.readFileSync(task.path + '\\bangumi.html', {encoding: 'utf-8'})
      const torrent = fs.readFileSync(`${task.path}\\${config.torrentName}`)
      const formData = new FormData()
      formData.append('op', 'upload')
      if (config.category_bangumi == '54967e14ff43b99e284d0bf7') 
        formData.append('sort_id', '2')
      else if (config.category_bangumi == '549ef207fe682f7549f1ea90')
        formData.append('sort_id', '1')
      else formData.append('sort_id', '19')
      formData.append('bt_file', new Blob([torrent], {type: 'application/x-bittorrent'}), config.torrentName)
      formData.append('title', config.title)
      formData.append('intro', html)
      formData.append('emule_resource', '')
      formData.append('synckey', '')
      formData.append('discuss_url', '')
      formData.append('Anonymous_Post', '0')
      formData.append('Team_Post', '1')
      const response = await axios.post('https://share.acgnx.se/user.php?o=upload', formData, { responseType: 'text' })
      if (response.status != 200) throw response
      if ((response.data as string).includes('恭喜，資源發佈成功')) {
        task.acgnx_a = 'https://share.acgnx.se/' + (response.data as string).match(/href="([\S]*?)">查看發佈的資源/)![1]
        await taskDB.write()
        return 'success'
      }
      if ((response.data as string).includes('閣下所要上載的Torrent檔案已存在')) {
        if (!task.acgnx_a) {
          let url = (response.data as string).match(/查看原資源詳情：<a\shref="([\S]*?)">/)![1]
          task.acgnx_a = 'https://share.acgnx.se/' + url
          await taskDB.write()
        }
        return 'exist'
      }
      else {
        console.log(response)
        return 'failed'
      }
    }
    catch (err) {
      console.log(err)
      return 'failed'
    }
  }
  async function publishAcgnxG(task: Config.Task, config: Config.PublishConfig) {
    try {
      let html = fs.readFileSync(task.path + '\\bangumi.html', {encoding: 'utf-8'})
      const torrent = fs.readFileSync(`${task.path}\\${config.torrentName}`)
      const formData = new FormData()
      formData.append('op', 'upload')
      if (config.category_nyaa == '1_2') 
        formData.append('sort_id', '2')
      else if (config.category_nyaa == '1_3')
        formData.append('sort_id', '4')
      else if (config.category_nyaa == '1_4')
        formData.append('sort_id', '3')
      else if (config.category_nyaa == '4_1')
        formData.append('sort_id', '14')
      else if (config.category_nyaa == '4_2')
        formData.append('sort_id', '16')
      else formData.append('sort_id', '15')
      formData.append('bt_file', new Blob([torrent], {type: 'application/x-bittorrent'}), config.torrentName)
      formData.append('title', config.title)
      formData.append('intro', html)
      formData.append('emule_resource', '')
      formData.append('synckey', '')
      formData.append('discuss_url', '')
      formData.append('tos', '1')
      formData.append('Anonymous_Post', '0')
      formData.append('Team_Post', '1')
      const response = await axios.post('https://www.acgnx.se/user.php?o=upload', formData, { responseType: 'text' })
      if (response.status != 200) throw response
      if ((response.data as string).includes('Congratulations, upload success')) {
        task.acgnx_g = 'https://www.acgnx.se/' + (response.data as string).match(/href="([\S]*?)">View\sThis\sTorrent/)![1]
        await taskDB.write()
        return 'success'
      }
      if ((response.data as string).includes('The Torrent file you are going to upload is already there')) {
        if (!task.acgnx_g) {
          let url = (response.data as string).match(/View\soriginal\storrent\sdetails：<a\shref="([\S]*?)">/)![1]
          task.acgnx_g = 'https://www.acgnx.se/' + url
          await taskDB.write()
        }
        return 'exist'
      }
      else {
        console.log(response)
        return 'failed'
      }
    }
    catch (err) {
      console.log(err)
      return 'failed'
    }
  }
  async function publishAcgrip(task: Config.Task, config: Config.PublishConfig) {
    try {
      let bbcode = fs.readFileSync(task.path + '\\acgrip.bbcode', {encoding: 'utf-8'})
      const torrent = fs.readFileSync(`${task.path}\\${config.torrentName}`)
      const formData = new FormData()
      let date = new Date()
      //CSRF验证
      const csrf = await axios.get('https://acg.rip/cp/posts/upload', { responseType: 'text' })
      let cookievalue = csrf.headers['set-cookie']![0].match(/_kanako_session=([\S]*?);/)![1]
      userDB.data.info[2].cookies.find((item => item.name == '_kanako_session'))!.value = cookievalue
      await userDB.write()
      const token = (csrf.data as string).match(/name="csrf-token"\scontent="([\S]*?)"/)![1]
      formData.append('authenticity_token', token)
      if (config.category_bangumi == '54967e14ff43b99e284d0bf7') 
        formData.append('post[category_id]', '5')
      else if (config.category_bangumi == '549ef207fe682f7549f1ea90')
        formData.append('post[category_id]', '1')
      else formData.append('post[category_id]', '9')
      formData.append('year', date.getFullYear().toString())
      formData.append('post[series_id]', '0')
      formData.append('post[torrent]', new Blob([torrent], {type: 'application/x-bittorrent'}), config.torrentName)
      formData.append('post[title]', config.title)
      formData.append('post[post_as_team]', '1')
      formData.append('post[content]', bbcode)
      formData.append('commit', '发布')
      const response = await axios.post('https://acg.rip/cp/posts', formData, { responseType: 'text' })
      if (response.status == 302) { 
        cookievalue = response.headers['set-cookie']![0].match(/_kanako_session=([\S]*?);/)![1]
        userDB.data.info[2].cookies.find((item => item.name == '_kanako_session'))!.value = cookievalue
        await userDB.write()
        let src = await getAcgripLink(config.title)
        if (src == '')
          task.acgrip = '未找到链接'
        else
          task.acgrip = 'https://acg.rip' + src
        await taskDB.write()
        return 'success'
      }
      if ((response.data as string).includes('已存在相同的种子')) {
        if (!task.acgrip) {
          let src = await getAcgripLink(config.title)
          if (src == '')
            task.acgrip = '未找到链接'
          else
            task.acgrip = 'https://acg.rip' + src
          await taskDB.write()
        }
        return 'exist'
      }
      else {
        console.log(response)
        return 'failed'
      }
    }
    catch (err) {
      console.log(err)
      return 'failed'
    }
  }
  //获取动漫花园链接
  //dmhy发布后不会返回发布的链接，需要从管理页获取，但网站数据同步还有延迟
  async function getDmhyLink(title: string) {
    let ruleTitle = title.replace(/[\*\.\?\+\^\$\|\\\/\[\]\(\)\{\}\s]/g, '[\\S\\s]').replace(/&/g, '&amp;')
    var rule = new RegExp('<a\\shref="([\\S]*?)"[\\s]*?target="_blank">' + ruleTitle)
    let src = ''
    for (let index = 0; index < 5; index++) {
      await sleep(1000)
      let result = await axios.get('https://www.dmhy.org/topics/mlist/scope/team', { responseType: 'text' })
      let link = (result.data as string).match(rule)
      if (link) {
        src = link[1]
        break
      }
    }
    return src
  }
  //获取Acgrip的链接
  async function getAcgripLink(title: string) {
    let ruletitle = title.replace(/[\*\.\?\+\^\$\|\\\/\[\]\(\)\{\}\s]/g, '[\\S\\s]').replace(/&/g, '&amp;')
    let rule = new RegExp('href="([\\S]*?)">' + ruletitle)
    let src = ''
    for (let index = 0; index < 5; index++) {
      let result = await axios.get('https://acg.rip/cp/team_posts', { responseType: 'text' })
      let link = (result.data as string).match(rule)
      if (link) {
        src = link[1]
        break
      }
      await sleep(1000)
      let cookievalue = result.headers['set-cookie']![0].match(/_kanako_session=([\S]*?);/)![1]
      userDB.data.info[2].cookies.find((item => item.name == '_kanako_session'))!.value = cookievalue
      await userDB.write()
    }
    return src
  }
  //获取萌番组同步链接
  async function getBangumiSyncLink(task: Config.Task, _id) {
    task.sync = true
    let data: any
    for (let index = 0; index < 5; index++) {
      await sleep(1000)
      let result = await axios.post('https://bangumi.moe/api/torrent/fetch', { _id }, { responseType: 'json' })
      if (result.status == 200 && result.data.sync) { 
        task.sync = false
        data = result.data
        await taskDB.write()
        break
      }
    }
    if (task.sync) return
    if (data.sync.acgnx != '已存在相同的种子'){
      task.acgnx_a = data.sync.acgnx
    }
    else{
      if (!task.acgnx_a)
        task.acgnx_a = '种子已存在'
    }
    if (data.sync.acgnx_int != '已存在相同的种子'){
      task.acgnx_g = data.sync.acgnx_int
    }
    else{
      if (!task.acgnx_g)
        task.acgnx_g = '种子已存在'
    }
    if (data.sync.acgrip != '已存在相同的种子'){
      task.acgrip = data.sync.acgrip
    }
    else{
      if (!task.acgrip)
        task.acgrip = '种子已存在'
    }
    if (data.sync.dmhy != '已存在相同的种子'){
      task.dmhy = data.sync.dmhy
    }
    else{
      if (!task.dmhy)
        task.dmhy = '种子已存在'
    }
  }

  //获取Bangumi标签建议
  export async function getBangumiTags(msg: string) {
    try{
      let { query }: Message.BT.BangumiQuery = JSON.parse(msg)
      const response = await axios.post('https://bangumi.moe/api/tag/suggest', { query })
      let result: Message.BT.BangumiTags = { data: response.data, status: response.status } 
      return  JSON.stringify(result)
    }
    catch(err){
      log.error(err)
      let result: Message.BT.BangumiTags = { data: {}, status: 0 } 
      return  JSON.stringify(result)
    }
  }
  export async function searchBangumiTags(msg: string) {
    try{
      let { query }: Message.BT.BangumiQuery = JSON.parse(msg)
      const response = await axios.post('https://bangumi.moe/api/tag/search', {name: query, multi: true, keywords: true})
      let result: Message.BT.BangumiTags = { data: response.data, status: response.status } 
      return  JSON.stringify(result)
    }
    catch(err){
      log.error(err)
      let result: Message.BT.BangumiTags = { data: {}, status: 0 } 
      return  JSON.stringify(result)
    }
  }
  
  //主站获取BT链接
  export async function getBTLinks(msg: string) {
    let { id }: Message.Task.TaskID = JSON.parse(msg)
    let task = taskDB.data.tasks.find(item => item.id == id)!
    let isFinished = 'true'
    //若bangumi团队同步未完成则再次尝试获取各站链接
    if (task.sync) {
      isFinished = 'false'
      let _id = task.bangumi!.split('torrent/')[1]
      await getBangumiSyncLink(task, _id)
      await taskDB.write()
      if (!task.sync) isFinished = 'true'
    }
    //重新尝试获取动漫花园的链接
    if (task.dmhy == '未找到链接') {
      isFinished = 'false'
      const config: Config.PublishConfig = JSON.parse(fs.readFileSync(task.path + '\\config.json', {encoding: 'utf-8'}))
      let src = await getDmhyLink(config.title)
      if (src == '')
        task.dmhy = '未找到链接'
      else {
        task.dmhy = 'https://www.dmhy.org' + src
        isFinished = 'true'
      }
      await taskDB.write()
    }
    let result: Message.Task.PublishStatus = {
      bangumi_all: isFinished,
      bangumi: task.bangumi,
      nyaa: task.nyaa,
      dmhy: task.dmhy,
      acgrip: task.acgrip,
      acgnx_a: task.acgnx_a,
      acgnx_g: task.acgnx_g
    }
    return JSON.stringify(result)
  }
}

/* 
主站功能相关
*/

namespace Forum {

  //获取主站账户信息
  export function getAccountInfo() {
    let info = userDB.data.forum
    let msg: Message.Forum.AccountInfo = {
      username: info.username,
      password: info.password
    }
    return JSON.stringify(msg)
  }
  //保存主站账户信息
  export async function saveAccountInfo(msg: string) {
    let info: Message.Forum.AccountInfo = JSON.parse(msg)
    userDB.data.forum.username = info.username
    userDB.data.forum.password = info.password
    await userDB.write()
  }
  
  //RS搜索文章
  export async function searchPosts(msg: string) {
    let { title }: Message.Forum.Title = JSON.parse(msg)
    let result: Message.Forum.Posts = { posts: [] }
    const response = await axios.get('https://vcb-s.com/wp-json/wp/v2/posts?context=edit&search=' + title, { responseType: 'json' })
    response.data.forEach(item => {
      result.posts.push({
        id: item.id,
        title: item.title.rendered,
        content: item.content.rendered.split('<!--more-->')[0],
        raw: item.content.raw
      })
    })
    return JSON.stringify(result)
  }

  //主站发布
  export async function publish(msg: string) {
    let message: Message.Task.Result = { result: ''}
    try {
      let config: Message.Forum.PublishConfig = JSON.parse(msg)
      if (!fs.existsSync(config.imagePath)) {
        message.result = 'noSuchFile_webp'
        return JSON.stringify(message)
      }
      const img = fs.readFileSync(config.imagePath)
      let imageData = new FormData()
      imageData.append('file', new Blob([img]), config.imagePath.replace(/^.*[\\\/]/, ''))
      const result = await axios.post('https://vcb-s.com/wp-json/wp/v2/media', imageData, { responseType: 'json' })
      if (result.status == 401) {
        message.result = 'unauthorized'
        return JSON.stringify(message)
      }
      if (result.status != 201) throw result
      let data = {
        title: config.title,
        content: config.content,
        status: 'publish',
        format: 'standard',
        categories: JSON.parse(config.categories),
        featured_media: result.data.id
      }
      const response = await axios.post('https://vcb-s.com/wp-json/wp/v2/posts', data, {responseType: 'json'})
      if (response.status == 201) {
        taskDB.data.tasks.find(item => item.id == config.id)!.forumLink = response.data.link
        message.result = 'success'
        return JSON.stringify(message)
      }
      if (response.status == 400) {
        message.result = 'empty'
        return JSON.stringify(message)

      }
      throw response
    }
    catch (err) {
      console.log(err)
      message.result = 'failed'
      return JSON.stringify(message)
    }
  }
  //RS主站发布
  export async function rsPublish(msg: string) {
    let message: Message.Task.Result = { result: ''}
    try{
      let config: Message.Forum.RSConfig = JSON.parse(msg)
      let data = {
        date: getNowFormatDate(),
        title: config.title,
        content: config.content,
      }
      const response = await axios.patch('https://vcb-s.com/wp-json/wp/v2/posts/' + config.rsID, data, {responseType: 'json'})
      if (response.status == 200) {
        taskDB.data.tasks.find((item) => item.id == config.id)!.forumLink = response.data.link
        message.result = 'success'
        return JSON.stringify(message)
      }
      if (response.status == 400) {
        message.result = 'empty'
        return JSON.stringify(message)
      }
      if (response.status == 401) {
        message.result = 'unauthorized'
        return JSON.stringify(message)
      }
      throw response
    }
    catch (err) {
      console.log(err)
      message.result = 'failed'
      return JSON.stringify(message)
    }
  }
}

/* 
任务相关处理
*/

namespace Task {

  //创建新任务
  export async function createTask(msg: string) {
    try{
      let { type, path, name }: Message.Task.TaskConfig = JSON.parse(msg)
      if (path === "") {
        path = app.getPath('userData') + '\\task'
        if (!fs.existsSync(path))
          fs.mkdirSync(path)
      }
      if (!fs.existsSync(path)) {
        let result: Message.Task.Result = { result: 'noSuchFolder'}
        return JSON.stringify(result)
      }
      else{
        if (name == '')
          name = getNowFormatDate().replace(/:/g, '-')
        fs.mkdirSync(path + '\\' +  name)
        let content
        if (type == 'template') {
          content = {
            title_CN: '',
            title_EN: '',
            title_JP: '',
            depth: '10-bit',
            resolution: '1080p',
            encoding: 'HEVC',
            contentType: 'BDRip',
            reseed: false,
            nomination: false,
            note: [],
            comment_CN: '',
            comment_EN: '',
            rsVersion: 1,
            members: {
              script: '',
              encode: '',
              collate: '',
              upload: ''
            },
            posterUrl: '',
            prefill: false
          }
        }
        else {
          content = {
            path_md: '',
            path_html: '',
            path_bbcode: '',
          }
        }
        let config: Config.PublishConfig = {
          title: '',
          category_bangumi: '',
          category_nyaa: '',
          information: 'https://vcb-s.com/archives/138',
          tags: [],
          torrentName: '',
          torrentPath: '',
          content
        }
        fs.writeFileSync(path + '\\' +  name + '\\config.json', JSON.stringify(config))
        let id = Date.now()
        taskDB.data.tasks.push({
          id: id,
          type: type,
          name: name,
          path: path + '\\' + name,
          status: 'publishing',
          step: 'edit',
          sync: false
        })
        await taskDB.write()
        let result: Message.Task.Result = { result: 'success:' + id }
        return JSON.stringify(result)
      }
    }
    catch(err){
      dialog.showErrorBox('错误', (err as Error).message)
      let result: Message.Task.Result = { result: 'failed' }
      return JSON.stringify(result)
    }
  }

  //获取全部任务信息
  export function getTaskList() {
    let result: Message.Task.TaskList = { list: taskDB.data.tasks }
    return JSON.stringify(result)
  }
  //获取任务类型
  export function getTaskType(msg: string) {
    let { id }: Message.Task.TaskID = JSON.parse(msg)
    let type = taskDB.data.tasks.find(item => item.id == id)!.type
    let result: Message.Task.TaskType = { type }
    return JSON.stringify(result)
  }

  //删除任务
  export async function removeTask(msg: string) {
    let { id }: Message.Task.TaskID = JSON.parse(msg)
    fs.rmSync(taskDB.data.tasks.find((item) => item.id == id)!.path, { recursive: true, force: true })
    taskDB.data.tasks = taskDB.data.tasks.filter(item => item.id != id)
    await taskDB.write()
    mainWindowWebContent.send('task_refreshTaskData')
  }

  //获取主站发布链接
  export async function getForumLink(msg: string) {
    let { id }: Message.Task.TaskID = JSON.parse(msg)
    let info = taskDB.data.tasks.find(item => item.id == id)!
    let result: Message.Task.ForumLink = { link: info.forumLink }
    return JSON.stringify(result)
  }

  //设置任务进度
  export async function setTaskProcess(msg: string) {
    let { id, step }: Message.Task.TaskStatus = JSON.parse(msg)
    let task = taskDB.data.tasks.find(item => item.id == id)!
    task.step = step
    if (step == 'finish') task.status = 'published'
    await taskDB.write()
  }

  //复查任务
  export async function getContent(msg: string) {
    let { id }: Message.Task.TaskID = JSON.parse(msg)
    let task = taskDB.data.tasks.find(item => item.id == id)!
    let html = '', md = '', bbcode = '', title = ''
    html = fs.readFileSync(task.path + '\\bangumi.html', {encoding: 'utf-8'})
    md = fs.readFileSync(task.path + '\\nyaa.md', {encoding: 'utf-8'})
    bbcode = fs.readFileSync(task.path + '\\acgrip.bbcode', {encoding: 'utf-8'})
    let content: Config.PublishConfig = JSON.parse(fs.readFileSync(task.path + '\\config.json', {encoding: 'utf-8'}))
    title = content.title
    let result: Message.Task.TaskContents = { html, md, bbcode, title }
    return JSON.stringify(result)
  }
  //保存内容修改
  export async function saveContent(msg: string) {
    let { id, content, type }: Message.Task.ModifiedContent = JSON.parse(msg)
    let task = taskDB.data.tasks.find(item => item.id == id)!
    if (type == 'html')
      fs.writeFileSync(task.path + '\\bangumi.html', content, {encoding: 'utf-8'})
    if (type == 'md')
      fs.writeFileSync(task.path + '\\nyaa.md', content, {encoding: 'utf-8'})
    if (type == 'bbcode')
      fs.writeFileSync(task.path + '\\acgrip.bbcode', content, {encoding: 'utf-8'})
  }
  //保存标题修改
  export async function saveTitle(msg: string) {
    let { id, title }: Message.Task.ModifiedTitle = JSON.parse(msg)
    let task = taskDB.data.tasks.find(item => item.id == id)!
    let path = task.path + '\\config.json'
    let config: Config.PublishConfig = JSON.parse(fs.readFileSync(path, {encoding: 'utf-8'}))
    config.title = title
    fs.writeFileSync(path, JSON.stringify(config), {encoding: 'utf-8'})
  }
  //导出发布稿
  export async function exportContent(msg: string) {
    let { id, type }: Message.Task.ContentType = JSON.parse(msg)
    let task = taskDB.data.tasks.find(item => item.id == id)!
    const {canceled, filePath} = await dialog.showSaveDialog({defaultPath: task.name,filters: [{name: type, extensions: [type]}]})
    if (canceled) return
    let filename = ''
    if (type == 'html') filename = '/bangumi.html'
    if (type == 'md') filename = '/nyaa.md'
    if (type == 'bbcode') filename = '/acgrip.bbcode'
    fs.copyFileSync(task.path + filename, filePath)
  }

  //获取任务的发布情况
  export async function getPublishStatus(msg: string) {
    let { id }: Message.Task.TaskID = JSON.parse(msg)
    let task = taskDB.data.tasks.find(item => item.id == id)!
    let result: Message.Task.PublishStatus = {}
    if (task.bangumi && task.bangumi != '种子已存在') {
      result.bangumi = '发布完成'
      result.bangumi_all
    }
    if (task.nyaa && task.nyaa != '种子已存在') result.nyaa = '发布完成'
    if (task.dmhy && task.dmhy != '种子已存在') result.dmhy = '发布完成'
    if (task.acgrip && task.acgrip != '种子已存在') result.acgrip = '发布完成'
    if (task.acgnx_a && task.acgnx_a != '种子已存在') result.acgnx_a = '发布完成'
    if (task.acgnx_g && task.acgnx_g != '种子已存在') result.acgnx_g = '发布完成'
    return JSON.stringify(result)
  }

  //编辑任务时获取任务信息
  export async function getPublishConfig(msg: string) {
    try{
      let { id }: Message.Task.TaskID = JSON.parse(msg)
      let task = taskDB.data.tasks.find(item => item.id == id)!
      const config: Message.Task.PublishConfig = JSON.parse(fs.readFileSync(task.path + '\\config.json', {encoding: 'utf-8'}))
      return JSON.stringify(config)
    }
    catch(err){
      dialog.showErrorBox('错误', (err as Error).message)
      return
    }
  }

  //从url.txt加载对比图
  export async function loadComparisons() {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties:[ 'openFile' ],
      filters: [{name: 'txt', extensions:['txt']}]
    })
    if (canceled) return
    let content = fs.readFileSync(filePaths[0], {encoding: 'utf-8'})
    let html = content.match(/<p>[\s\S]*<\/p>/)![0]
    let md = content.match(/\[!\[\]\([\s\S]*\)\s\s/)![0]
    let bbcode = content.match(/\[URL=[\s\S]*\[\/URL\]/)![0]
    const str = 'Comparison (right click on the image and open it in a new tab to see the full-size one)\n'
              + content.match(/<br\/>[\s\S]*?<br\/>/)![0].slice(5).slice(0, -5).trim() + '\n\n' 
    html += '\n'
    md = str + md
    bbcode = str + bbcode + '\n'
    bbcode = bbcode.replace(/IMG/g, 'img')
    bbcode = bbcode.replace(/URL/g, 'url')
    let msg: Message.Task.Comparisons = { html, md, bbcode }
    return JSON.stringify(msg)
  } 

  //创建和保存
  export async function createConfig(msg: string){
    let { id, config, type }: Message.Task.ModifiedConfig = JSON.parse(msg)
    let result = ''
    if (type == 'template')
      result = await createWithTemplate(id, config)
    else 
      result = await createWithFile(id, config)
    let response: Message.Task.Result = { result }
    return JSON.stringify(response)
  }
  async function createWithFile(id: number, config: Config.PublishConfig) {
    try {
      let task = taskDB.data.tasks.find(item => item.id == id)
      let info = config.content as Config.Content_file
      if (!task) return 'taskNotFound'
      fs.writeFileSync(task.path + '\\config.json', JSON.stringify(config))
      if (!fs.existsSync(config.torrentPath)) return "noSuchFile_torrent"
      if (!fs.existsSync(info.path_html))
        return "noSuchFile_html"
      else 
        fs.copyFileSync(info.path_html, task.path + '\\bangumi.html')
      if (!fs.existsSync(info.path_md)) {
        if (info.path_md != '') 
          return 'noSuchFile_md'
        let content = fs.readFileSync(task.path + '\\bangumi.html', {encoding: 'utf-8'})
        var converter = new html2md()
        let md = converter.turndown(content)
        fs.writeFileSync(task.path + '\\nyaa.md', md)
      } else
        fs.copyFileSync(info.path_html, task.path + '\\bangumi.html')
      if (!fs.existsSync(info.path_bbcode)) {
        if (info.path_bbcode != '') 
          return 'noSuchFile_bbcode'
        let content = fs.readFileSync(task.path + '\\nyaa.md', {encoding: 'utf-8'})
        let reader = new commonmark.Parser()
        let writer = new md2bbc.BBCodeRenderer()
        let parsed = reader.parse((content as string).replaceAll('\n* * *', ''))
        let bbcode = writer.render(parsed).slice(1)
        fs.writeFileSync(task.path + '\\acgrip.bbcode', bbcode)
      } else
        fs.copyFileSync(info.path_bbcode, task.path + '\\acgrip.bbcode')
      fs.copyFileSync(config.torrentPath, task.path + '\\' + config.torrentPath.replace(/^.*[\\\/]/, ''))
      return 'success'
    } catch (err) {
      dialog.showErrorBox('错误', (err as Error).message)
      return 'failed'
    }
  }
  async function createWithTemplate(id: number, config: Config.PublishConfig) {
    try {
      let task = taskDB.data.tasks.find(item => item.id == id)
      let info = config.content as Config.Content_template
      if (!task) return 'taskNotFound'
      fs.writeFileSync(task.path + '\\config.json', JSON.stringify(config))
      if (!fs.existsSync(config.torrentPath)) return "noSuchFile_torrent"
      let content = '<p>\n'
      content += `<img src="${info.posterUrl}" alt="${info.posterUrl.replace(/^.*[\\\/]/, '')}" /><br />\n<br />\n`
      let note = ''
      if (info.note)
        info.note.forEach(item => { note += item + ' + ' })
      if (note != '')
        note = note.slice(0, -2)
      let reseed = info.reseed ? ` Reseed${info.rsVersion > 1 ? ` v${info.rsVersion}` : ''}` : ''
      if (config.title.includes(info.title_JP)) {
        if (info.title_CN != '')
          content += info.title_CN + ' / '
        content += info.title_EN
        if (info.title_JP != '')
          content += ` / ${info.title_JP} `
        content += ` ${note} ${info.contentType}${reseed} <br />\n`
      }
      else {
        if (info.title_CN != '') 
          content += `${info.title_CN} ${note} ${info.contentType}${reseed} <br />\n`
        content += `${info.title_EN} ${note} ${info.contentType}${reseed} <br />\n`
        if (info.title_JP != '') 
          content += `${info.title_JP} ${note} ${info.contentType}${reseed} <br />\n`
      }
      content += '<br />\n'
      if (info.sub_CN && info.sub_CN != '') {
        content += `${info.sub_CN}<br />\n${info.sub_EN}<br />\n`
      }
      if (info.audio_CN && info.audio_CN != '') {
        content += `${info.audio_CN}<br />\n${info.audio_EN}<br />\n`
      }
      if (content.slice(-14) != '<br />\n<br />\n') content += '<br />\n'
      if (info.nomination) {
        content += '本番由 <strong>组员提名</strong>，应要求制作。感谢他们为 VCB-Studio 发展做出的无私奉献。<br />\n'
        content += 'This project was <strong>nominated by our members</strong> and produced upon request. Thanks to them for their selfless dedication to the development of VCB-Studio.<br />\n<br />\n'
      }
      let team_CN = '', team_EN = ''
      if (info.subTeam_CN && info.subTeam_EN) {
        info.subTeam_CN.forEach(item => { team_CN += item + ' & ' })
        info.subTeam_EN.forEach(item => { team_EN += item + ' & ' })
      }
      if (team_CN != ''){
        team_CN = team_CN.slice(0, -3)
        team_EN = team_EN.slice(0, -3)
        content += `这个项目与 <strong>${team_CN}</strong> 合作，感谢他们精心制作的字幕。<br />\n`
        content += `This project is in collaboration with <strong>${team_EN}</strong>. Thanks to them for crafting Chinese subtitles.<br />\n<br />\n`
      }
      let comment_CN = info.comment_CN.split('\n')
      let comment_EN = info.comment_EN.split('\n')
      for (let i = 0; i <comment_CN.length; i++){
        content += comment_CN[i] + '<br />\n'
        content += comment_EN[i] + '<br />\n<br />\n'
      }
      if (content.slice(-14) != '<br />\n<br />\n') content += '<br />\n'
      if (info.nonsense) {
        let nonsense = info.nonsense.split('\n')
        nonsense.forEach(item => {
          content += item + '<br />\n'
        });
      }
      if (content.slice(-14) != '<br />\n<br />\n') content += '<br />\n'
      content += '</p>\n<hr />\n<p>\n'
      if (info.reseed) {
        let rsComment_CN = info.rsComment_CN!.split('\n')
        let rsComment_EN = info.rsComment_EN!.split('\n')
        content += '重发修正：<br />\n'
        rsComment_CN.forEach(item => {
          content += item + '<br />\n'
        });
        content += '<br />\nReseed comment:<br />\n'
        rsComment_EN.forEach(item => {
          content += item + '<br />\n'
        });
        content += '<br />\n</p>\n<hr />\n<p>\n'
      }
      content += '感谢所有参与制作者 / Thanks to our participating members:<br />\n'
      content += '总监 / Script: ' + info.members.script + '<br />\n'
      content += '压制 / Encode: ' + info.members.encode + '<br />\n'
      content += '整理 / Collate: ' + info.members.collate + '<br />\n'
      content += '发布 / Upload: ' + info.members.upload + '<br />\n'
      content += '分流 / Seed: VCB-Studio CDN 分流成员<br />\n'
      if (info.providers && info.providers != '') {
        let providers = info.providers.split('\n')
        content += '<br />\n感谢所有资源提供者 / Thanks to all resource providers:<br />\n'
        providers.forEach(item => {
          content += item + '<br />\n'
        });
      }
      content += '<br />\n</p>\n<hr />\n<p>\n'
      if (info.reseed) {
        content += '本次发布来自 VCB-Studio 旧作重发计划。我们会不定期重发过去发布过的合集，或为补充做种，或为修正制作错漏，或为整合系列合集。<br />\n'
        content += 'This is a release of VCB-Studio Reseed Project. We would re-upload previous torrents from time to time, to resurrect old torrents with few seeders, to correct errors/omissions, or to batch separate releases that belong to a same series.<br />\n'
        content += '<br />\n</p>\n<hr />\n<p>\n'
      }
      if (!info.reseed) {
        content += ' VCB-Studio 已不再保证收集作品相关 CD 和扫图资源，详情请参见 <a href="https://vcb-s.com/archives/14331">https://vcb-s.com/archives/14331</a>。<br />\n'
        content += 'Please refer to <a href="https://vcb-s.com/archives/14331">https://vcb-s.com/archives/14331</a> on VCB-Studio no longer guaranteeing the inclusion of relevant CDs and scans.<br />\n<br />\n'
        content += '本组（不）定期招募新成员。详情请参见 <a href="https://vcb-s.com/archives/16986">https://vcb-s.com/archives/16986</a>。<br />\n'
        content += 'Please refer to <a href="https://vcb-s.com/archives/16986">https://vcb-s.com/archives/16986</a> for information on our (un)scheduled recruitment.<br />\n<br />\n'
      }
      content += '播放器教程索引： <a href="https://vcb-s.com/archives/16639" target="_blank">VCB-Studio 播放器推荐</a><br />\n'
      content += '中文字幕分享区： <a href="https://bbs.acgrip.com/" target="_blank">Anime 分享论坛</a><br />\n'
      content += '项目计划与列表： <a href="https://vcb-s.com/archives/138" target="_blank">VCB-Studio 项目列表</a><br />\n'
      content += '特殊格式与说明： <a href="https://vcb-s.com/archives/7949" target="_blank">WebP 扫图说明</a><br />\n<br />\n</p>\n'
      if (!info.reseed) {
        content += '<hr />\n'
      }
      let converter = new html2md()
      let md = converter.turndown(content)
      let reader = new commonmark.Parser()
      let bbcodeWriter = new md2bbc.BBCodeRenderer()
      let parsed_bbcode = reader.parse((md as string).replaceAll('\n* * *', ''))
      let bbcode = bbcodeWriter.render(parsed_bbcode).slice(1)
      let html = content
      if (!info.reseed) {
        md += '\n\n' +  info.comparisons_md
        html += info.comparisons_html
        info.comparisons_bbcode = info.comparisons_bbcode!.replace(/IMG/g, 'img')
        info.comparisons_bbcode = info.comparisons_bbcode!.replace(/URL/g, 'url')
        bbcode += '\n' + info.comparisons_bbcode
      }
      fs.writeFileSync(task.path + '\\bangumi.html', html)
      fs.writeFileSync(task.path + '\\nyaa.md', md)
      fs.writeFileSync(task.path + '\\acgrip.bbcode', bbcode)
      fs.copyFileSync(config.torrentPath, task.path + '\\' + config.torrentPath.replace(/^.*[\\\/]/, ''))
      return 'success'
    } catch (err) {
      dialog.showErrorBox('错误', (err as Error).message)
      return 'failed'
    }
  }
  export async function saveConfig(msg: string) {
    let { id, config }: Message.Task.ModifiedConfig = JSON.parse(msg)
    let task = taskDB.data.tasks.find(item => item.id == id)!
    fs.writeFileSync(task.path + '\\config.json', JSON.stringify(config))
    let result: Message.Task.Result = { result: 'success' }
    return JSON.stringify(result)
  }

  //主站发布获取信息
  export async function getForumConfig(msg: string) {
    try {
      let { id }: Message.Task.TaskID = JSON.parse(msg)
      let task = taskDB.data.tasks.find(item => item.id == id)!
      let result: Message.Forum.Contents = {}
      //从模版创建则生成发布稿
      if (task.type == 'template') {
        const config: Config.PublishConfig = await JSON.parse(fs.readFileSync(task.path + '\\config.json', {encoding: 'utf-8'}))
        let info = config.content as Config.Content_template
        let note = ''
        if (info.note)
          info.note.forEach(item => { note += item + ' + ' })
        if (note != '')
            note = note.slice(0, -2)
        if (info.reseed)
            note += `Reseed${info.rsVersion > 1 ? ` v${info.rsVersion}` : ''} Fin`
        else
            note += 'Fin'
        let title = `${info.title_EN}${info.title_CN == '' ? '' : ' / ' +  info.title_CN} ${info.depth} ${info.resolution} ` 
                  + `${info.encoding} ${info.contentType} [${note}]`
        result.title = title
        let team_CN = '', content = ''
        if (info.nomination)
          content += '本番由 <strong>组员提名</strong>，应要求制作。感谢他们为 VCB-Studio 发展做出的无私奉献。\n\n'
        if (info.subTeam_CN) {
          info.subTeam_CN.forEach(item => { team_CN += item + ' & ' })
        }
        if (team_CN != ''){
          team_CN = team_CN.slice(0, -3)
          content += `这个项目与 <strong>${team_CN}</strong> 合作，感谢他们精心制作的字幕。\n\n`
        }
        content += info.comment_CN + '\n\n'
        if (info.sub_CN && info.sub_CN != '') {
          content += info.sub_CN + '\n'
        }
        if (info.audio_CN && info.audio_CN != '') {
          content += info.audio_CN + '\n'
        }
        if (content.slice(-2) != '\n\n') content += '\n'
        if (info.nonsense && info.nonsense != '') {
          content += info.nonsense + '\n\n'
        }
        content += '<!--more-->\n\n感谢所有参与制作者：\n'
        content += `总监：${info.members.script}\n`
        content += `压制：${info.members.encode}\n`
        content += `整理：${info.members.collate}\n`
        content += `发布：${info.members.upload}\n`
        content += '分流：VCB-Studio CDN 分流成员\n\n'
        if (info.reseed) {
          content += '[box style="info"]\n重发修正：\n\n'
          content += info.rsComment_CN + '\n[/box]\n\n'
        }
        content += '[box style="download"]\n'
        content += `${info.depth} ${info.resolution} ${info.encoding}${info.reseed ? ' (Reseed)' : ''}`
        content += '\n\n链接加载中[/box]\n\n'
        if (info.reseed) 
          content += '<hr />\n\n请将旧链放于此\n\n'
        if (info.imageCredit != '') {
          content += `Image Credit: <a href="${info.imageSource}" rel="noopener" target="_blank">${info.imageCredit}</a>\n\n`
        }
        content += '<label for="medie-info-switch" class="btn btn-inverse-primary" title="展开MediaInfo">MediaInfo</label>\n\n'
        content += '<pre class="js-medie-info-detail medie-info-detail" style="display: none">\n'
        if (info.mediaInfo == '') 
          content += '请将MediaInfo放置于此'
        else 
          content += info.mediaInfo
        content += '\n</pre>'
        result.content = content
        result.imagePath = info.imagePath
      }
      return JSON.stringify(result)
    }
    catch (err) {
      console.log(err)
      dialog.showErrorBox('错误', (err as Error).message)
      return
    }
  }

}

app.whenReady().then(async () => {
  //设置应用数据库
  userDB = await JSONFilePreset<Config.UserData>(app.getPath('userData') + '\\easypublish-user-db.json', defaultUserData)
  taskDB = await JSONFilePreset<Config.TaskData>(app.getPath('userData') + '\\easypublish-task-db.json', defaultTaskData)
  //获取登录窗口回话
  BT.ses = session.fromPartition('persist:login')
  await userDB.write()
  await taskDB.write()
  //注册IPC通信
  ipcMain.handle('global_getProxyConfig', _event => Global.getProxyConfig())
  ipcMain.handle('global_getFilePath', (_event, msg) => Global.getFilePath(msg))
  ipcMain.handle('global_getFolderPath', _event => Global.getFolderPath())
  ipcMain.handle('global_readFileContent', _event => Global.readFileContent())
  ipcMain.handle('BT_checkLoginStatus', (_event, msg) => BT.checkLoginStatus(msg))
  ipcMain.handle('BT_getAccountInfo', (_event, msg) => BT.getAccountInfo(msg))
  ipcMain.handle('BT_publish', (_event, msg) => BT.publish(msg))
  ipcMain.handle('BT_getBangumiTags', (_event, msg) => BT.getBangumiTags(msg))
  ipcMain.handle('BT_searchBangumiTags', (_event, msg) => BT.searchBangumiTags(msg))
  ipcMain.handle('BT_getBTLinks', (_eventm, msg) => BT.getBTLinks(msg))
  ipcMain.handle('forum_getAccountInfo', _event => Forum.getAccountInfo())
  ipcMain.handle('forum_searchPosts', (_event, msg) => Forum.searchPosts(msg))
  ipcMain.handle('forum_publish', (_event, msg) => Forum.publish(msg))
  ipcMain.handle('forum_rsPublish', (_event, msg) => Forum.rsPublish(msg))
  ipcMain.handle('task_createTask', (_event, msg) => Task.createTask(msg))
  ipcMain.handle('task_getTaskList', _event => Task.getTaskList())
  ipcMain.handle('task_getTaskType', (_event, msg) => Task.getTaskType(msg))
  ipcMain.handle('task_getForumLink', (_event, msg) => Task.getForumLink(msg))
  ipcMain.handle('task_getContent', (_event, msg) => Task.getContent(msg))
  ipcMain.handle('task_getPublishStatus', (_event, msg) => Task.getPublishStatus(msg))
  ipcMain.handle('task_getPublishConfig', (_event, msg) => Task.getPublishConfig(msg))
  ipcMain.handle('task_loadComparisons', _event => Task.loadComparisons())
  ipcMain.handle("task_saveConfig", (_event, msg) => Task.saveConfig(msg))
  ipcMain.handle("task_createConfig", (_event, msg) => Task.createConfig(msg))
  ipcMain.handle('task_getForumConfig', (_event, msg) => Task.getForumConfig(msg))
  ipcMain.on('global_setProxyConfig', (_event, msg) => Global.setProxyConfig(msg))
  ipcMain.on('global_openFolder', (_event, msg) => Global.openFolder(msg))
  ipcMain.on('global_writeClipboard', (_event, msg) => Global.writeClipboard(msg))
  ipcMain.on('BT_loginAccount', (_event, msg) => BT.loginAccount(msg))
  ipcMain.on('BT_openLoginWindow', (_event, msg) => BT.openLoginWindow(msg))
  ipcMain.on('BT_saveAccountInfo', (_event, msg) => BT.saveAccountInfo(msg))
  ipcMain.on('BT_clearStorage', (_event) => BT.clearStorage())
  ipcMain.on('BT_exportCookies', (_event, msg) => BT.exportCookies(msg))
  ipcMain.on('BT_importCookies', (_event, msg) => BT.importCookies(msg))
  ipcMain.on('forum_saveAccountInfo', (_event, msg) => Forum.saveAccountInfo(msg))
  ipcMain.on('task_removeTask', (_event, msg) => Task.removeTask(msg))
  ipcMain.on('task_setTaskProcess', (_event, msg) => Task.setTaskProcess(msg))
  ipcMain.on('task_saveContent', (_event, msg) => Task.saveContent(msg))
  ipcMain.on('task_exportContent', (_event, msg) => Task.exportContent(msg))
  ipcMain.on('task_saveTitle', (_event, msg) => Task.saveTitle(msg))

  //配置axios代理
  let pconf = userDB.data.proxyConfig
  if (pconf.status) {
    if (pconf.type == "socks") {
      axios.defaults.httpsAgent = new socksProxy.SocksProxyAgent(`socks://${pconf.host}:${pconf.port}`)
    }
    else{
      axios.defaults.proxy = {
        protocol: pconf.type,
        port: pconf.port,
        host: pconf.host
      }
    }
  }

  // Set app user model id for windows
  electronApp.setAppUserModelId('com.easypublish')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
