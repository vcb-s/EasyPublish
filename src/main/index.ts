import { app, shell, BrowserWindow, ipcMain, dialog, Cookie, session, clipboard, net } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import type { PublishConfig, 
  Content_file, 
  Content_text,
  Message_PublishStatus,
  Message_LoginInfo, 
  Message_AccountInfo,
  ProxyConfig, 
  Message_rsPosts,
} from '../renderer/src/index.d.ts'
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

//应用数据管理及异常处理错误日志打印
app.commandLine.appendSwitch('lang', 'zh-CN');
const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36'
log.transports.file.format = '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}]{scope} {text}'
const date = new Date()
const dateStr = date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate()
log.transports.file.resolvePathFn = ()=> app.getPath('userData') + '\\logs\\' + dateStr + '.log'
log.initialize()
console.log = log.log
console.log(app.getPath('userData') + '\\logs\\' + dateStr + '.log')
process.on('uncaughtException', (err) => {log.error(err)})

type Storage = {
  id: number
  name: string
  path: string
  bangumi?: string
  nyaa?: string
  acgrip?: string
  dmhy?: string
  acgnx_g?: string
  acgnx_a?: string
  site?: string
  sync: boolean
  status: 'published' | 'publishing'
  step: 'create' | 'check' | 'publish' | 'site' | 'finish'
}
type LoginInfo = {
  name: string, 
  time: string, 
  status: string,
  username: string,
  password: string,
  enable: boolean,
  cookie: Cookie[]
}
type Data = {
  posts: Storage[],
  cookies: LoginInfo[],
  proxyConfig: ProxyConfig,
  site: {username: string, password: string}
}
const defaultData: Data = { posts: [],  
  proxyConfig: {
    status: false,
    type: '',
    host: '',
    port: 8080,
  },
  site: {username: '', password: ''},
  cookies: [
  {
    name: 'bangumi',
    time: '--',
    status: '账号未登录',
    username: '',
    password: '',
    enable: true,
    cookie: []
  },
  {
    name: 'nyaa',
    time: '--',
    status: '账号未登录',
    username: '',
    password: '',
    enable: true,
    cookie: []
  },
  {
    name: 'acgrip',
    time: '--',
    status: '账号未登录',
    username: '',
    password: '',
    enable: true,
    cookie: []
  },
  {
    name: 'dmhy',
    time: '--',
    status: '账号未登录',
    username: '',
    password: '',
    enable: true,
    cookie: []
  },
  {
    name: 'acgnx_g',
    time: '--',
    status: '账号未登录',
    username: '',
    password: '',
    enable: true,
    cookie: []
  },
  {
    name: 'acgnx_a',
    time: '--',
    status: '账号未登录',
    username: '',
    password: '',
    enable: true,
    cookie: []
  },
]}
let db: Low<Data>

//等待
function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

//获取当前日期函数
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

//axios拦截添加cookie和useragent,主站设置认证
axios.interceptors.request.use(
  config => {
    let type = ''
    if (config.url!.includes('vcb-s.com')) {
      let key = "Basic " + btoa(db.data.site.username + ':' + db.data.site.password)
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
    const info = db.data.cookies.find(item => item.name == type) as LoginInfo
    let str = ''
    info.cookie.forEach(item => {
      str += `${item.name}=${item.value}; `
    })
    config.headers['Cookie'] = str
    config.headers['User-Agent'] = userAgent
    return config
  },
  error => {console.log(error)}
)
//阻止重定向和取消状态码异常
axios.defaults.maxRedirects = 0
axios.defaults.validateStatus = function () {
  return true
}
//设置网络错误重试
axiosRetry(axios, { 
  retries: 5,
  retryCondition: (error) => {
    if (error.message.includes('status code'))
      return false
    return true
  }
 })

//BT发布
async function BTPublish(_event, id: number, type: string) {
  try {
    let storage = db.data.posts.find(item => item.id == id)
    if (storage == undefined) 
      throw new Error('TaskNotFound:' + id)
    if (!fs.existsSync(storage.path)) 
      throw new Error('FolderNotFound:' + id)
    const config: PublishConfig = await JSON.parse(fs.readFileSync(storage.path + '\\config.json', {encoding: 'utf-8'}))
    if (!fs.existsSync(`${storage.path}\\${config.torrentname}`))
      return 'noSuchFile_torrent'
    const torrent = fs.readFileSync(`${storage.path}\\${config.torrentname}`)
    //bangumi团队同步
    if (type == 'bangumi_all') {
      if (!fs.existsSync(storage.path + '\\bangumi.html'))
        return 'noSuchFile_html'
      let html = fs.readFileSync(storage.path + '\\bangumi.html', {encoding: 'utf-8'})
      const formData = new FormData()
      const team = await axios.get('https://bangumi.moe/api/team/myteam', { responseType: 'json' })
      let team_id: string = team.data[0]._id
      formData.append('category_tag_id', config.category_bangumi)
      formData.append('title',  config.title)
      formData.append('introduction', html)
      formData.append('tag_ids', config.tag.map(item => item.value).toString())
      formData.append('btskey', 'undefined')
      formData.append('team_id', team_id)
      formData.append('teamsync', '1')
      formData.append('file', new Blob([torrent], {type: 'application/x-bittorrent'}), config.torrentname)
      const response = await axios.post('https://bangumi.moe/api/torrent/add', formData, { responseType: 'json' })
      if (response.status != 200) throw response
      if (response.data.success === true) {
        storage.bangumi = 'https://bangumi.moe/torrent/' + response.data.torrent._id
        storage.sync = true
        await sleep(1000)
        let result = await axios.post('https://bangumi.moe/api/torrent/fetch', {_id: response.data.torrent._id}, { responseType: 'json' })
        for (let index = 0; index < 5; index++) {
          if (result.status == 200 && result.data.sync){ 
            storage.sync = false
            await db.write()
            break
          }
          await sleep(1000)
          result = await axios.post('https://bangumi.moe/api/torrent/fetch', {_id: response.data.torrent._id}, { responseType: 'json' })
        }
        if (storage.sync) return 'success'
        if (result.data.sync.acgnx != '已存在相同的种子'){
          storage.acgnx_a = result.data.sync.acgnx
        }
        else{
          if (!storage.acgnx_a)
            storage.acgnx_a = '种子已存在'
        }
        if (result.data.sync.acgnx_int != '已存在相同的种子'){
          storage.acgnx_g = result.data.sync.acgnx_int
        }
        else{
          if (!storage.acgnx_g)
            storage.acgnx_g = '种子已存在'
        }
        if (result.data.sync.acgrip != '已存在相同的种子'){
          storage.acgrip = result.data.sync.acgrip
        }
        else{
          if (!storage.acgrip)
            storage.acgrip = '种子已存在'
        }
        if (result.data.sync.dmhy != '已存在相同的种子'){
          storage.dmhy = result.data.sync.dmhy
        }
        else{
          if (!storage.dmhy)
            storage.dmhy = '种子已存在'
        }
        await db.write()
        return 'success'
      }
      else if (response.data.success === false && (response.data.message as string).includes('torrent same as')) {
        if (!storage.bangumi) {
          storage.bangumi = '种子已存在'
          await db.write()
        }
        return 'exist'
      }
      else {
        console.log(response)
        return 'failed'
      }
    }
    else if (type == 'bangumi') {
      if (!fs.existsSync(storage.path + '\\bangumi.html'))
        return 'noSuchFile_html'
      let html = fs.readFileSync(storage.path + '\\bangumi.html', {encoding: 'utf-8'})
      const formData = new FormData()
      const team = await axios.get('https://bangumi.moe/api/team/myteam', { responseType: 'json' })
      let team_id: string = team.data[0]._id
      formData.append('category_tag_id', config.category_bangumi)
      formData.append('title',  config.title)
      formData.append('introduction', html)
      formData.append('tag_ids', config.tag.map(item => item.value).toString())
      formData.append('btskey', 'undefined')
      formData.append('team_id', team_id)
      formData.append('file', new Blob([torrent], {type: 'application/x-bittorrent'}), config.torrentname)
      const response = await axios.post('https://bangumi.moe/api/torrent/add', formData, { responseType: 'json' })
      if (response.status != 200) throw response
      if (response.data.success === true) {
        storage.bangumi = 'https://bangumi.moe/torrent/' + response.data.torrent._id
        await db.write()
        return 'success'
      }
      else if (response.data.success === false && (response.data.message as string).includes('torrent same as')) {
        if (!storage.bangumi) {
          let id = (response.data.message as string).slice(16)
          storage.bangumi = 'https://bangumi.moe/torrent/' + id
          await db.write()
        }
        return 'exist'
      }
      else {
        console.log(response)
        return 'failed'
      }
    }
    else if (type == 'nyaa') {
      if (!fs.existsSync(storage.path + '\\nyaa.md'))
        return 'noSuchFile_md'
      let md = fs.readFileSync(storage.path + '\\nyaa.md', {encoding: 'utf-8'})
      const formData = new FormData()
      formData.append('torrent_file', new Blob([torrent], {type: 'application/x-bittorrent'}), config.torrentname)
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
        storage.nyaa = response.headers['location']
        await db.write()
        return 'success'
      }
      else if((response.data as string).includes('This torrent already exists')) {
        if (!storage.nyaa) {
          let id = (response.data as string).match(/This\storrent\salready\sexists\s\(#(\d+)\)/)![1]
          storage.nyaa = 'https://nyaa.si/view/' + id
          await db.write()
        }
        return 'exist'
      }
      else {
        console.log(response)
        return 'failed'
      }
    }
    else if (type == 'dmhy') {
      if (!fs.existsSync(storage.path + '\\bangumi.html'))
        return 'noSuchFile_html'
      let html = fs.readFileSync(storage.path + '\\bangumi.html', {encoding: 'utf-8'})
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
      formData.append('bt_file', new Blob([torrent], {type: 'application/x-bittorrent'}), config.torrentname)
      formData.append('disable_download_seed_file', '0')
      formData.append('emule_resource', '')
      formData.append('synckey', '')
      formData.append('submit', '提交')
      const response = await axios.post('https://www.dmhy.org/topics/add', formData, { responseType: 'text' })
      if (response.status != 200) throw response
      if ((response.data as string).includes('種子已存在，請不要重複上傳')) {
        if (!storage.dmhy) {
          let postresult = await axios.get('https://www.dmhy.org/topics/mlist/scope/team', { responseType: 'text' })
          let rtitle = config.title.replace(/[\*\.\?\+\^\$\|\\\/\[\]\(\)\{\}\s]/g, '[\\S\\s]').replace(/&/g, '&amp;')
          var rule = new RegExp('<a\\shref="([\\S]*?)"[\\s]*?target="_blank">' + rtitle)
          let src = ''
          for (let index = 0; index < 5; index++) {
            let result = (postresult.data as string).match(rule)
            if (result) {
              src = result[1]
              break
            }
            await sleep(1000)
            postresult = await axios.get('https://www.dmhy.org/topics/mlist/scope/team', { responseType: 'text' })
          }
          if (src == '')
            storage.dmhy = '未找到链接'
          else 
            storage.dmhy = 'https://www.dmhy.org' + src
          await db.write()
        }
        return 'exist'
      }
      if ((response.data as string).includes('上傳成功')) {
        //dmhy发布后不会返回发布的链接，需要从管理页获取，但网站数据同步还有延迟
        let postresult = await axios.get('https://www.dmhy.org/topics/mlist/scope/team', { responseType: 'text' })
        let rtitle = config.title.replace(/[\*\.\?\+\^\$\|\\\/\[\]\(\)\{\}\s]/g, '[\\S\\s]').replace(/&/g, '&amp;')
        var rule = new RegExp('<a\\shref="([\\S]*?)"[\\s]*?target="_blank">' + rtitle)
        let src = ''
        for (let index = 0; index < 5; index++) {
          let result = (postresult.data as string).match(rule)
          if (result) {
            src = result[1]
            break
          }
          await sleep(1000)
          postresult = await axios.get('https://www.dmhy.org/topics/mlist/scope/team', { responseType: 'text' })
        }
        if (src == '')
          storage.dmhy = '未找到链接'
        else 
          storage.dmhy = 'https://www.dmhy.org' + src
        await db.write()
        return 'success'
      }
      else {
        console.log(response)
        return 'failed'
      }
    }
    else if (type == 'acgnx_a') {
      if (!fs.existsSync(storage.path + '\\bangumi.html'))
        return 'noSuchFile_html'
      let html = fs.readFileSync(storage.path + '\\bangumi.html', {encoding: 'utf-8'})
      const formData = new FormData()
      formData.append('op', 'upload')
      if (config.category_bangumi == '54967e14ff43b99e284d0bf7') 
        formData.append('sort_id', '2')
      else if (config.category_bangumi == '549ef207fe682f7549f1ea90')
        formData.append('sort_id', '1')
      else formData.append('sort_id', '19')
      formData.append('bt_file', new Blob([torrent], {type: 'application/x-bittorrent'}), config.torrentname)
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
        storage.acgnx_a = 'https://share.acgnx.se/' + (response.data as string).match(/href="([\S]*?)">查看發佈的資源/)![1]
        await db.write()
        return 'success'
      }
      if ((response.data as string).includes('閣下所要上載的Torrent檔案已存在')) {
        if (!storage.acgnx_a) {
          let url = (response.data as string).match(/查看原資源詳情：<a\shref="([\S]*?)">/)![1]
          storage.acgnx_a = 'https://share.acgnx.se/' + url
          await db.write()
        }
        return 'exist'
      }
      else {
        console.log(response)
        return 'failed'
      }
    }
    else if (type == 'acgnx_g') {
      if (!fs.existsSync(storage.path + '\\bangumi.html'))
        return 'noSuchFile_html'
      let html = fs.readFileSync(storage.path + '\\bangumi.html', {encoding: 'utf-8'})
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
      formData.append('bt_file', new Blob([torrent], {type: 'application/x-bittorrent'}), config.torrentname)
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
        storage.acgnx_g = 'https://www.acgnx.se/' + (response.data as string).match(/href="([\S]*?)">View\sThis\sTorrent/)![1]
        await db.write()
        return 'success'
      }
      if ((response.data as string).includes('The Torrent file you are going to upload is already there')) {
        if (!storage.acgnx_g) {
          let url = (response.data as string).match(/View\soriginal\storrent\sdetails：<a\shref="([\S]*?)">/)![1]
          storage.acgnx_g = 'https://www.acgnx.se/' + url
          await db.write()
        }
        return 'exist'
      }
      else {
        console.log(response)
        return 'failed'
      }
    }
    else if (type == 'acgrip') {
      if (!fs.existsSync(storage.path + '\\acgrip.bbcode'))
        return 'noSuchFile_bbcode'
      let bbcode = fs.readFileSync(storage.path + '\\acgrip.bbcode', {encoding: 'utf-8'})
      const formData = new FormData()
      //CSRF验证
      const csrf = await axios.get('https://acg.rip/cp/posts/upload', { responseType: 'text' })
      let cookievalue = csrf.headers['set-cookie']![0].match(/_kanako_session=([\S]*?);/)![1]
      db.data.cookies[2].cookie.find((item => item.name == '_kanako_session'))!.value = cookievalue
      await db.write()
      const token = (csrf.data as string).match(/name="csrf-token"\scontent="([\S]*?)"/)![1]
      formData.append('authenticity_token', token)
      if (config.category_bangumi == '54967e14ff43b99e284d0bf7') 
        formData.append('post[category_id]', '5')
      else if (config.category_bangumi == '549ef207fe682f7549f1ea90')
        formData.append('post[category_id]', '1')
      else formData.append('post[category_id]', '9')
      formData.append('year', date.getFullYear().toString())
      formData.append('post[series_id]', '0')
      formData.append('post[torrent]', new Blob([torrent], {type: 'application/x-bittorrent'}), config.torrentname)
      formData.append('post[title]', config.title)
      formData.append('post[post_as_team]', '1')
      formData.append('post[content]', bbcode)
      formData.append('commit', '发布')
      const response = await axios.post('https://acg.rip/cp/posts', formData, { responseType: 'text' })
      if (response.status == 302) { 
        cookievalue = response.headers['set-cookie']![0].match(/_kanako_session=([\S]*?);/)![1]
        db.data.cookies[2].cookie.find((item => item.name == '_kanako_session'))!.value = cookievalue
        await db.write()
        let postresult = await axios.get('https://acg.rip/cp/team_posts', { responseType: 'text' })
        let rtitle = config.title.replace(/[\*\.\?\+\^\$\|\\\/\[\]\(\)\{\}\s]/g, '[\\S\\s]').replace(/&/g, '&amp;')
        let rule = new RegExp('href="([\\S]*?)">' + rtitle)
        let src = ''
        for (let index = 0; index < 5; index++) {
          let result = (postresult.data as string).match(rule)
          if (result) {
            src = result[1]
            break
          }
          await sleep(1000)
          cookievalue = postresult.headers['set-cookie']![0].match(/_kanako_session=([\S]*?);/)![1]
          db.data.cookies[2].cookie.find((item => item.name == '_kanako_session'))!.value = cookievalue
          await db.write()
          postresult = await axios.get('https://acg.rip/cp/team_posts', { responseType: 'text' })
        }
        if (src == '')
          storage.acgrip = '未找到链接'
        else
          storage.acgrip = 'https://acg.rip' + src
        await db.write()
        return 'success'
      }
      if ((response.data as string).includes('已存在相同的种子')) {
        if (!storage.acgrip) {
          let postresult = await axios.get('https://acg.rip/cp/team_posts', { responseType: 'text' })
          let rtitle = config.title.replace(/[\*\.\?\+\^\$\|\\\/\[\]\(\)\{\}\s]/g, '[\\S\\s]').replace(/&/g, '&amp;')
          let rule = new RegExp('href="([\\S]*?)">' + rtitle)
          let src = ''
          for (let index = 0; index < 5; index++) {
            let result = (postresult.data as string).match(rule)
            if (result) {
              src = result[1]
              break
            }
            await sleep(1000)
            cookievalue = postresult.headers['set-cookie']![0].match(/_kanako_session=([\S]*?);/)![1]
            db.data.cookies[2].cookie.find((item => item.name == '_kanako_session'))!.value = cookievalue
            await db.write()
            postresult = await axios.get('https://acg.rip/cp/team_posts', { responseType: 'text' })
          }
          if (src == '')
            storage.acgrip = '未找到链接'
          else
            storage.acgrip = 'https://acg.rip' + src
          await db.write()
        }
        return 'exist'
      }
      else {
        console.log(response)
        return 'failed'
      }
    }
    return 'failed'
  } catch (err) {
    console.log(err)
    return 'failed'
  }
}

//主站发布
async function sitePublish(_event, id: number, title: string, content: string, imgsrc: string, categories: string) {
  try{
    if (!fs.existsSync(imgsrc)) {
      return 'noSuchFile_webp'
    }
    const img = fs.readFileSync(imgsrc)
    let imgData = new FormData()
    imgData.append('file', new Blob([img]), imgsrc.replace(/^.*[\\\/]/, ''))
    const result = await axios.post('https://vcb-s.com/wp-json/wp/v2/media', imgData, { responseType: 'json' })
    if (result.status == 401) return 'unauthorized'
    if (result.status != 201) throw result
    let data = {
      title: title,
      content: content,
      status: 'publish',
      format: 'standard',
      categories: JSON.parse(categories),
      featured_media: result.data.id
    }
    const response = await axios.post('https://vcb-s.com/wp-json/wp/v2/posts', data, {responseType: 'json'})
    if (response.status == 201) {
      db.data.posts.find((item) => item.id == id)!.site = response.data.link
      return 'success'
    }
    if (response.status == 400) return 'empty'
    throw response
  }
  catch (err) {
    console.log(err)
    return 'failed'
  }
}

//RS主站发布
async function siteRSPublish(_event, id: number, rsID: number, title: string, content: string) {
  try{
    let data = {
      date: getNowFormatDate(),
      title: title,
      content: content,
    }
    const response = await axios.patch('https://vcb-s.com/wp-json/wp/v2/posts/' + rsID, data, {responseType: 'json'})
    if (response.status == 200) {
      db.data.posts.find((item) => item.id == id)!.site = response.data.link
      return 'success'
    }
    if (response.status == 400) return 'empty'
    if (response.status == 401) return 'unauthorized'
    throw response
  }
  catch (err) {
    console.log(err)
    return 'failed'
  }
}

//获取Bangumi标签建议
async function getBangumiTags(_event, query: string) {
  try{
    const response = await axios.post('https://bangumi.moe/api/tag/suggest', {query: query})
    return  {data: response.data, status: response.status} 
  }
  catch(err){
    log.error(err)
    return {data: (err as any).name, status: 0}
  }
}
async function searchBangumiTags(_event, query: string) {
  try{
    const response = await axios.post('https://bangumi.moe/api/tag/search', {name: query, multi: true, keywords: true})
    return  {data: response.data, status: response.status} 
  }
  catch(err){
    log.error(err)
    return {data: (err as any).name, status: 0}
  }
}

//RS搜索文章
async function searchPosts(_event, title: string) {
  let result: Message_rsPosts[] = []
  const response = await axios.get('https://vcb-s.com/wp-json/wp/v2/posts?context=edit&search=' + title, { responseType: 'json' })
  response.data.forEach(item => {
    result.push({
      id: item.id,
      title: item.title.rendered,
      content: item.content.rendered.split('<!--more-->')[0],
      raw: item.content.raw
    })
  })
  return result
}

//登录窗口设置
async function createLoginWindow(type: string) {

  let url:string
  if (type == 'bangumi') url = 'https://bangumi.moe'
  else if (type == 'nyaa') url = 'https://nyaa.si/login'
  else if (type == 'acgrip') url = 'https://acg.rip/users/sign_in'
  else if (type == 'dmhy') url = 'https://www.dmhy.org/user'
  else if (type == 'acgnx_g') url = 'https://www.acgnx.se/user.php?o=login'
  else url = 'https://share.acgnx.se/user.php?o=login'

  const partition = 'persist:login'
  let ses = session.fromPartition(partition)

  //获取并保存cookie信息
  async function setCookies(type: string, url: string) {
    await ses.cookies.get({url: url}).then((cookies) => {
      db.data.cookies.find(item => item.name == type)!.cookie = cookies
    }).catch(err => {console.log(err)})
    if (type.includes('acgnx'))
      await ses.cookies.get({name: 'cf_clearance'}).then((cookies) => {
        db.data.cookies.find(item => item.name == type)!.cookie.push(...cookies)
    }).catch(err => {console.log(err)})
    await db.write()
  }

  const loginWindow = new BrowserWindow({
    width: 1200,
    minWidth: 950,
    minHeight: 550,
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
      await setCookies(type, url)
      await checkLoginStatus(type)
      //告知页面刷新数据
      mainWindowWebContent.send('refreshLoginData')
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
    details.requestHeaders['User-Agent'] = userAgent
    callback({ requestHeaders: details.requestHeaders })
  })

  //配置代理
  let pconf = db.data.proxyConfig
  if (pconf.status) {
    await loginWindow.webContents.session.setProxy({ 
      proxyRules: `${pconf.type}://${pconf.host}:${pconf.port}` 
    });
  }

  loginWindow.loadURL(url)
}

//获取并处理当前时间
function getCurrentTime() {
  var stamp= new Date().getTime() + 8 * 60 * 60 * 1000;
  var currentTime = new Date(stamp).toISOString().replace(/T/, ' ').replace(/\..+/, '').substring(0, 19)
  return currentTime
}

//响应前端检查
async function checkLogin(type: string, value?: string) {
  if (type == 'all') {
    checkLogin('bangumi')
    checkLogin('nyaa')
    checkLogin('dmhy')
    checkLogin('acgrip')
    checkLogin('acgnx_a')
    checkLogin('acgnx_g')
  }
  else {
    if (!value)
      await checkLoginStatus(type)
    let status = db.data.cookies.find((item) => item.name == type)!.status
    if (status == '账号未登录' || value) {
      BTLogin(type, value)
    }
  }
}
//判断登陆状态
async function checkLoginStatus(type: string) {
  try{
    let item: LoginInfo = db.data.cookies.find(item => item.name === type)!
    if (!item.enable) {
      item.time = getCurrentTime()
      item.status = '账户已禁用'
    } 
    else {
      let url:string
      if (type == 'bangumi') {
        url = 'https://bangumi.moe/api/team/myteam'
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
          item.time = getCurrentTime()
          item.status = '账号未登录'
        }
        else {
          item.time = getCurrentTime()
          item.status = '账号已登录'
        }
      }
      else if (type == 'nyaa') {
        url = 'https://nyaa.si/profile'
        let response = await axios.get(url, { responseType: 'text' })
        for (let i = 0;i < 5;i++) {
          if (response.status === 200 || response.status === 302) {
            break
          }
          response = await axios.get(url, { responseType: 'text' })
        }
        const {status} = response
        if (status == 302) {
          item.time = getCurrentTime()
          item.status = '账号未登录'
        }
        else if (status == 200) {
          item.time = getCurrentTime()
          item.status = '账号已登录'
        }
        else {
          throw response
        }
      }
      else if (type == 'acgrip') {
        url = 'https://acg.rip/cp'
        let response = await axios.get(url, { responseType: 'text' })
        for (let i = 0;i < 5;i++) {
          if (response.status === 200 || response.status === 302) {
            break
          }
          response = await axios.get(url, { responseType: 'text' })
        }
        const {status} = response
        if (status == 302) {
          item.time = getCurrentTime()
          item.status = '账号未登录'
        }
        else if (status == 200) {
          item.time = getCurrentTime()
          item.status = '账号已登录'
        }
        else {
          throw response
        }
      }
      else if (type == 'dmhy') {
        url = 'https://www.dmhy.org/user'
        let response = await axios.get(url, { responseType: 'text' })
        for (let i = 0;i < 5;i++) {
          if (response.status === 200 || response.status === 302) {
            break
          }
          response = await axios.get(url, { responseType: 'text' })
        }
        const {status} = response
        if (status == 302) {
          item.time = getCurrentTime()
          item.status = '账号未登录'
        }
        else if (status == 200) {
          item.time = getCurrentTime()
          item.status = '账号已登录'
        }
        else {
          throw response
        }
      }
      else if (type == 'acgnx_g') {
        url = 'https://www.acgnx.se/user.php'
        let response = await axios.get(url, { responseType: 'text' })
        for (let i = 0;i < 5;i++) {
          if (response.status === 200 || response.status === 302 || response.status === 403) {
            break
          }
          response = await axios.get(url, { responseType: 'text' })
        }
        const {data, status} = response
        if (status == 302) {
          item.time = getCurrentTime()
          item.status = '账号未登录'
        }
        else if (status == 403) {
          item.time = getCurrentTime()
          item.status = '防火墙阻止'
          createLoginWindow('acgnx_g')
        }
        else if (status == 200) {
          if ((data as string).includes('Your request has been blocked, Please complete the captcha to access.')) {
            item.time = getCurrentTime()
            item.status = '防火墙阻止'
            createLoginWindow('acgnx_g')
          }
          else {
            item.time = getCurrentTime()
            item.status = '账号已登录'
          }
        }
        else {
          throw response
        }
      }
      else if (type == 'acgnx_a') {
        url = 'https://share.acgnx.se/user.php'
        let response = await axios.get(url, { responseType: 'text' })
        for (let i = 0;i < 5;i++) {
          if (response.status === 200 || response.status === 302 || response.status === 403) {
            break
          }
          response = await axios.get(url, { responseType: 'text' })
        }
        const {data, status} = response
        if (status == 302) {
          item.time = getCurrentTime()
          item.status = '账号未登录'
        }
        else if (status == 403) {
          item.time = getCurrentTime()
          item.status = '防火墙阻止'
          createLoginWindow('acgnx_a')
        }
        else if (status == 200) {
          if ((data as string).includes('Your request has been blocked, Please complete the captcha to access.')) {
            item.time = getCurrentTime()
            item.status = '防火墙阻止'
          createLoginWindow('acgnx_a')
          }
          else {
            item.time = getCurrentTime()
            item.status = '账号已登录'
          }
        }
        else {
          throw response
        }
      }
    }
    await db.write()
    mainWindowWebContent.send('refreshLoginData')
  }
  catch(err){
    console.log(err)
    if (type == 'bangumi') {
      db.data.cookies[0].time = getCurrentTime()
      db.data.cookies[0].status = '访问失败'
    }
    else if (type == 'nyaa') {
      db.data.cookies[1].time = getCurrentTime()
      db.data.cookies[1].status = '访问失败'
    }
    else if (type == 'acgrip') {
      db.data.cookies[2].time = getCurrentTime()
      db.data.cookies[2].status = '访问失败'
    }
    else if (type == 'dmhy') {
      db.data.cookies[3].time = getCurrentTime()
      db.data.cookies[3].status = '访问失败'
    }
    else if (type == 'acgnx_g') {
      db.data.cookies[4].time = getCurrentTime()
      db.data.cookies[4].status = '访问失败'
    }
    else {
      db.data.cookies[5].time = getCurrentTime()
      db.data.cookies[5].status = '访问失败'}
    await db.write()
  }
}
//登录账号
async function BTLogin(type: string, value?: string) {
  try {
    let url: string
    const partition = 'persist:login'
    let ses = session.fromPartition(partition)
    if (type == 'bangumi') {
      db.data.cookies[0].time = getCurrentTime()
      db.data.cookies[0].status = '正在登录'
      await db.write()
      mainWindowWebContent.send('refreshLoginData')
      url = 'https://bangumi.moe/api/user/signin'
      let uname = db.data.cookies[0].username
      let pwd = db.data.cookies[0].password
      let response = await axios.post(url, {username: uname, password: CryptoJS.MD5(pwd).toString()})
      if (response.data.success) {
        response.headers['set-cookie']!.forEach(async item => {
          let cookie = item.split(';')[0]
          let index = cookie.indexOf('=')
          let name = cookie.slice(0, index)
          let value = cookie.slice(index + 1, cookie.length)
          await ses.cookies.set({url: 'https://bangumi.moe', name: name, value: value, httpOnly: true})
        });
        await ses.cookies.get({url: 'https://bangumi.moe'}).then((cookies) => {
          db.data.cookies[0].cookie.push(...cookies)
        }).catch(err => {console.log(err)})
        db.data.cookies[0].time = getCurrentTime()
        db.data.cookies[0].status = '账号已登录'
        await db.write()
        mainWindowWebContent.send('refreshLoginData')
      }
      else {
        db.data.cookies[0].time = getCurrentTime()
        db.data.cookies[0].status = '账号密码错误'
        await db.write()
        mainWindowWebContent.send('refreshLoginData')
      }
    }
    else if (type == 'acgrip') {
      db.data.cookies[2].time = getCurrentTime()
      db.data.cookies[2].status = '正在登录'
      await db.write()
      mainWindowWebContent.send('refreshLoginData')
      url = 'https://acg.rip/users/sign_in'
      const formData = new FormData()
      //CSRF验证
      const csrf = await axios.get(url, { responseType: 'text' })
      let cookievalue = csrf.headers['set-cookie']![0].match(/_kanako_session=([\S]*?);/)![1]
      let _kanako_session = db.data.cookies[2].cookie.find((item => item.name == '_kanako_session'))
      if (_kanako_session)
        _kanako_session.value = cookievalue
      else 
        db.data.cookies[2].cookie.push({name: '_kanako_session', value: cookievalue, sameSite: 'lax'})
      await db.write()
      const token = (csrf.data as string).match(/name="csrf-token"\scontent="([\S]*?)"/)![1]
      formData.append('authenticity_token', token)
      let uname = db.data.cookies[2].username
      let pwd = db.data.cookies[2].password
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
          await ses.cookies.set({url: 'https://acg.rip', name: name, value: value, httpOnly: true})
        });
        await ses.cookies.get({url: 'https://acg.rip'}).then((cookies) => {
          db.data.cookies[2].cookie.push(...cookies)
        }).catch(err => {console.log(err)})
        db.data.cookies[2].time = getCurrentTime()
        db.data.cookies[2].status = '账号已登录'
        await db.write()
        mainWindowWebContent.send('refreshLoginData')
      }
      else if ((response.data as string).includes('邮箱或密码错误')) {
        db.data.cookies[2].time = getCurrentTime()
        db.data.cookies[2].status = '账号密码错误'
        await db.write()
        mainWindowWebContent.send('refreshLoginData')
      }
      else {
        throw response
      }
    }
    else if (type == 'dmhy') {
      db.data.cookies[3].time = getCurrentTime()
      db.data.cookies[3].status = '正在登录'
      await db.write()
      mainWindowWebContent.send('refreshLoginData')
      url = 'https://www.dmhy.org/user/login'
      if (!value) {
        const result = await axios.get('https://www.dmhy.org/common/generate-captcha?code=' + Date.now())
        if (result.headers['set-cookie']) {
          result.headers['set-cookie']!.forEach(async item => {
            let cookie = item.split(';')[0]
            let index = cookie.indexOf('=')
            let name = cookie.slice(0, index)
            let value = cookie.slice(index + 1, cookie.length)
            await ses.cookies.set({url: 'https://www.dmhy.org', name: name, value: value, httpOnly: true})
          });
          await ses.cookies.get({url: 'https://www.dmhy.org'}).then((cookies) => {
            db.data.cookies[3].cookie.push(...cookies)
          }).catch(err => {console.log(err)})
          db.write()
        }
        mainWindowWebContent.send('loadIamgeCaptcha')
        return
      }
      let uname = db.data.cookies[3].username
      let pwd = db.data.cookies[3].password
      const formData = new FormData()
      formData.append('goto', 'https://www.dmhy.org/')
      formData.append('email', uname)
      formData.append('password', pwd)
      formData.append('login_node', '0')
      formData.append('cookietime', '315360000')
      formData.append('captcha_code', value)
      let response = await axios.post(url, formData, { responseType: 'text' })
      if ((response.data as string).includes('登入成功')) {
        response.headers['set-cookie']!.forEach(async item => {
          let cookie = item.split(';')[0]
          let index = cookie.indexOf('=')
          let name = cookie.slice(0, index)
          let value = cookie.slice(index + 1, cookie.length)
          await ses.cookies.set({url: 'https://www.dmhy.org', name: name, value: value, httpOnly: true})
        });
        await ses.cookies.get({url: 'https://www.dmhy.org'}).then((cookies) => {
          db.data.cookies[3].cookie.push(...cookies)
        }).catch(err => {console.log(err)})
        db.data.cookies[3].time = getCurrentTime()
        db.data.cookies[3].status = '账号已登录'
        await db.write()
        mainWindowWebContent.send('refreshLoginData')
      }
      else if ((response.data as string).includes('帐户密码错误')) {
        db.data.cookies[3].time = getCurrentTime()
        db.data.cookies[3].status = '账号密码错误'
        await db.write()
        mainWindowWebContent.send('refreshLoginData')
      }
      else if ((response.data as string).includes('验证码错误')) {
        db.data.cookies[3].time = getCurrentTime()
        db.data.cookies[3].status = '验证码错误'
        await db.write()
        mainWindowWebContent.send('refreshLoginData')
      }
      else {
        throw response
      }
    }
    else if (type == 'nyaa') {
      db.data.cookies[1].time = getCurrentTime()
      db.data.cookies[1].status = '正在登录'
      await db.write()
      mainWindowWebContent.send('refreshLoginData')
      if (!value) {
        mainWindowWebContent.send('loadReCaptcha', 'nyaa')
        return
      }
      url = 'https://nyaa.si/login'
      const formData = new FormData()
      let uname = db.data.cookies[1].username
      let pwd = db.data.cookies[1].password
      formData.append('username', uname)
      formData.append('password', pwd)
      formData.append('g-recaptcha-response', value)
      let response = await axios.post(url, formData, { responseType: 'text' })
      if (response.status == 302) {
        response.headers['set-cookie']!.forEach(async item => {
          let cookie = item.split(';')[0]
          let index = cookie.indexOf('=')
          let name = cookie.slice(0, index)
          let value = cookie.slice(index + 1, cookie.length)
          await ses.cookies.set({url: 'https://nyaa.si', name: name, value: value, httpOnly: true})
        });
        await ses.cookies.get({url: 'https://nyaa.si'}).then((cookies) => {
          db.data.cookies[1].cookie.push(...cookies)
        }).catch(err => {console.log(err)})
        db.data.cookies[1].time = getCurrentTime()
        db.data.cookies[1].status = '账号已登录'
        await db.write()
        mainWindowWebContent.send('refreshLoginData')
      }
      else if ((response.data as string).includes('Incorrect username or password')) {
        db.data.cookies[1].time = getCurrentTime()
        db.data.cookies[1].status = '账号密码错误'
        await db.write()
        mainWindowWebContent.send('refreshLoginData')
      }
      else {
        throw response
      }
    }
    else if (type == 'acgnx_g') {
      db.data.cookies[4].time = getCurrentTime()
      db.data.cookies[4].status = '正在登录'
      await db.write()
      mainWindowWebContent.send('refreshLoginData')
      if (!value) {
        mainWindowWebContent.send('loadReCaptcha', 'acgnx_g')
        return
      }
      url = 'https://www.acgnx.se/user.php?o=login'
      const formData = new FormData()
      let uname = db.data.cookies[4].username
      let pwd = db.data.cookies[4].password
      formData.append('op', 'login')
      formData.append('url', 'http%3A%2F%2Fwww.acgnx.se')
      formData.append('emailaddress', uname)
      formData.append('password', pwd)
      formData.append('cookietime', '315360000')
      formData.append('g-recaptcha-response', value)
      let response = await axios.post(url, formData, { responseType: 'text' })
      if (response.status == 302) {
        response.headers['set-cookie']!.forEach(async item => {
          let cookie = item.split(';')[0]
          let index = cookie.indexOf('=')
          let name = cookie.slice(0, index)
          let value = cookie.slice(index + 1, cookie.length)
          await ses.cookies.set({url: 'https://www.acgnx.se', name: name, value: value, httpOnly: true})
        });
        await ses.cookies.get({url: 'https://www.acgnx.se'}).then((cookies) => {
          db.data.cookies[4].cookie.push(...cookies)
        }).catch(err => {console.log(err)})
        db.data.cookies[4].time = getCurrentTime()
        db.data.cookies[4].status = '账号已登录'
        await db.write()
        mainWindowWebContent.send('refreshLoginData')
      }
      else if ((response.data as string).includes('登錄密碼不正確')) {
        db.data.cookies[4].time = getCurrentTime()
        db.data.cookies[4].status = '账号密码错误'
        await db.write()
        mainWindowWebContent.send('refreshLoginData')
      }
      else {
        throw response
      }
    }
    else if (type == 'acgnx_a') {
      db.data.cookies[5].time = getCurrentTime()
      db.data.cookies[5].status = '正在登录'
      await db.write()
      mainWindowWebContent.send('refreshLoginData')
      if (!value) {
        mainWindowWebContent.send('loadReCaptcha', 'acgnx_a')
        return
      }
      url = 'https://share.acgnx.se/user.php?o=login'
      const formData = new FormData()
      let uname = db.data.cookies[5].username
      let pwd = db.data.cookies[5].password
      formData.append('op', 'login')
      formData.append('url', 'http%3A%2F%2Fwww.acgnx.se')
      formData.append('emailaddress', uname)
      formData.append('password', pwd)
      formData.append('cookietime', '315360000')
      formData.append('g-recaptcha-response', value)
      let response = await axios.post(url, formData, { responseType: 'text' })
      if (response.status == 302) {
        response.headers['set-cookie']!.forEach(async item => {
          let cookie = item.split(';')[0]
          let index = cookie.indexOf('=')
          let name = cookie.slice(0, index)
          let value = cookie.slice(index + 1, cookie.length)
          await ses.cookies.set({url: 'https://share.acgnx.se', name: name, value: value, httpOnly: true})
        });
        await ses.cookies.get({url: 'https://share.acgnx.se'}).then((cookies) => {
          db.data.cookies[5].cookie.push(...cookies)
        }).catch(err => {console.log(err)})
        db.data.cookies[5].time = getCurrentTime()
        db.data.cookies[5].status = '账号已登录'
        await db.write()
        mainWindowWebContent.send('refreshLoginData')
      }
      else if ((response.data as string).includes('登錄密碼不正確')) {
        db.data.cookies[5].time = getCurrentTime()
        db.data.cookies[5].status = '账号密码错误'
        await db.write()
        mainWindowWebContent.send('refreshLoginData')
      }
      else {
        throw response
      }
    }
  }
  catch (err) {
    console.log(err)
  }
}

//获取登录信息
async function getLoginInfo(_event) {
  let result: Message_LoginInfo[] = []
  const info = db.data.cookies
  info.forEach(item => {
    result.push({
      name: item.name, 
      time: item.time, 
      status: item.status, 
      username: item.username, 
      password: item.password, 
      enable: item.enable,
    })
  })
  return JSON.stringify(result)
}

//读取或设置主站用户密码
async function setSiteUAP(_event, op: boolean, username: string, password: string) {
  let config = db.data.site
  if (op) {
    config.username = username
    config.password = password
    await db.write()
  }
  return [config.username, config.password]
}

//导入导出Cookies
async function exportCookies(_event, type: number) {
  const { canceled, filePath } = await dialog.showSaveDialog({filters: [{name: 'JSON', extensions: ['json']}]})
  if (canceled) return
  fs.writeFileSync(filePath, JSON.stringify(db.data.cookies[type].cookie))
}
async function importCookies(_event, type: number) {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openFile'], 
    filters: [{name: 'JSON', extensions: ['json']}]
  })
  if (canceled) return
  db.data.cookies[type].cookie = JSON.parse(fs.readFileSync(filePaths[0], {encoding: 'utf-8'}))
  db.write()
  mainWindowWebContent.send('refreshLoginData')
}

//打开项目目录
async function openDirectory(_event, path: string){
  shell.openPath(path)
}

//打开文件(夹)
async function handleFileOpen(_event, type: string) {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties:[ type == 'folder' ? 'openDirectory' : 'openFile' ],
    filters: type == 'folder' ? undefined : [{name: type, extensions:[type]}]
  })
  if (!canceled) {
    return filePaths[0]
  }
  return ''
}

//读取文件内容
async function readFileContent(_event) {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties:[ 'openFile' ]
  })
  if(canceled) return ''
  const content = fs.readFileSync(filePaths[0], {encoding: 'utf-8'})
  return content
}

//创建新任务
async function createTask(_event, path: string, config: PublishConfig) {
  try{
    if (path === "") {
      path = app.getPath('userData') + '\\task'
      if (!fs.existsSync(path))
        fs.mkdirSync(path)
    }
    if (!fs.existsSync(path)) {
      return 'noSuchFolder'
    }
    else{
      if (config.name == '')
        config.name = getNowFormatDate().replace(/:/g, '-')
      fs.mkdirSync(path + '\\' +  config.name)
      if (config.type == 'text') {
        const text: Content_text = {
          Name_Ch: '',
          Name_En: '',
          Name_Jp: '',
          bit: '10-bit',
          resolution: '1080p',
          encoding: 'HEVC',
          torrent_type: 'BDRip',
          reseed: false,
          nomination: false,
          note: [],
          comment_Ch: '',
          comment_En: '',
          rs_version: 1,
          members: {
            script: '',
            encode: '',
            collate: '',
            upload: ''
          },
          picture_path: '',
          prefill: false
        }
        config.content = text
      }
      else {
        const file: Content_file = {
          path_md: '',
          path_html: '',
          path_bbcode: '',
        }
        config.content = file
      }
      fs.writeFileSync(path + '\\' +  config.name + '\\config.json', JSON.stringify(config))
      let id = Date.now()
      db.data.posts.push({
        id: id,
        name: config.name,
        path: path + '\\' + config.name,
        status: 'publishing',
        step: 'create',
        sync: false
      })
      await db.write()
      return 'success:' + id
    }
  }
  catch(err){
    dialog.showErrorBox('错误', (err as Error).message)
    return 'failed'
  }
}

//创建和保存
async function saveConfig(id: number, config: PublishConfig) {
  let storage = db.data.posts.find(item => item.id == id)
  if (storage == undefined) return "taskNotFound"
  const oldConfig: PublishConfig = await JSON.parse(fs.readFileSync(storage.path + '\\config.json', {encoding: 'utf-8'}))
  config.name = oldConfig.name;
  config.torrentname = config.torrent.replace(/^.*[\\\/]/, '');
  fs.writeFileSync(storage.path + '\\config.json', JSON.stringify(config))
  return storage.path
}
async function createWithFile(_event, id: number, config_: string) {
  try {
    let config: PublishConfig = JSON.parse(config_)
    const result = await saveConfig(id, config)
    if (result == 'taskNotFound') return 'taskNotFound'
    if (!fs.existsSync(config.torrent)) return "noSuchFile_torrent"
    if (!fs.existsSync((config.content as Content_file).path_html))
      return "noSuchFile_html"
    else 
      fs.copyFileSync((config.content as Content_file).path_html, result + '\\bangumi.html')
    if (!fs.existsSync((config.content as Content_file).path_md)) {
      if ((config.content as Content_file).path_md != '') 
        return 'noSuchFile_md'
      let content = fs.readFileSync(result + '\\bangumi.html', {encoding: 'utf-8'})
      var converter = new html2md()
      let md = converter.turndown(content)
      fs.writeFileSync(result + '\\nyaa.md', md)
    } else
      fs.copyFileSync((config.content as Content_file).path_html, result + '\\bangumi.html')
    if (!fs.existsSync((config.content as Content_file).path_bbcode)) {
      if ((config.content as Content_file).path_bbcode != '') 
        return 'noSuchFile_bbcode'
      let content = fs.readFileSync(result + '\\nyaa.md', {encoding: 'utf-8'})
      let reader = new commonmark.Parser()
      let writer = new md2bbc.BBCodeRenderer()
      let parsed = reader.parse(content)
      let bbcode = writer.render(parsed)
      fs.writeFileSync(result + '\\acgrip.bbcode', bbcode)
    } else
      fs.copyFileSync((config.content as Content_file).path_bbcode, result + '\\acgrip.bbcode')
    fs.copyFileSync(config.torrent, result + '\\' + config.torrent.replace(/^.*[\\\/]/, ''))
    return 'success'
  } catch (err) {
    dialog.showErrorBox('错误', (err as Error).message)
    return 'failed'
  }
}
async function createWithText(_event, id: number, config_: string) {
  try {
    let config: PublishConfig = JSON.parse(config_)
    let info = config.content as Content_text
    const result = await saveConfig(id, config)
    if (result == 'taskNotFound') return 'taskNotFound'
    if (!fs.existsSync(config.torrent)) return "noSuchFile_torrent"
    let content = '<p>\n'
    content += `<img src="${info.picture_path}" alt="${info.picture_path.replace(/^.*[\\\/]/, '')}" /><br />\n<br />\n`
    let note = ''
    if (info.note)
      info.note.forEach(item => { note += item + ' + ' })
    if (note != '')
      note = note.slice(0, -2)
    let reseed = info.reseed ? ` Reseed${info.rs_version > 1 ? ` v${info.rs_version}` : ''}` : ''
    if (config.title.includes(info.Name_Jp)) {
      if (info.Name_Ch != '')
        content += info.Name_Ch + ' / '
      content += info.Name_En
      if (info.Name_Jp != '')
        content += ` / ${info.Name_Jp} `
      content += ` ${note} ${info.torrent_type}${reseed} <br />\n`
    }
    else {
      if (info.Name_Ch != '') 
        content += `${info.Name_Ch} ${note} ${info.torrent_type}${reseed} <br />\n`
      content += `${info.Name_En} ${note} ${info.torrent_type}${reseed} <br />\n`
      if (info.Name_Jp != '') 
        content += `${info.Name_Jp} ${note} ${info.torrent_type}${reseed} <br />\n`
    }
    content += '<br />\n'
    if (info.sub_Ch && info.sub_Ch != '') {
      content += `${info.sub_Ch}<br />\n${info.sub_En}<br />\n`
    }
    if (info.audio_Ch && info.audio_Ch != '') {
      content += `${info.audio_Ch}<br />\n${info.audio_En}<br />\n`
    }
    if (content.slice(-14) != '<br />\n<br />\n') content += '<br />\n'
    if (info.nomination) {
      content += '本番由 <strong>组员提名</strong>，应要求制作。感谢他们为 VCB-Studio 发展做出的无私奉献。<br />\n'
      content += 'This project was <strong>nominated by our members</strong> and produced upon request. Thanks to them for their selfless dedication to the development of VCB-Studio.<br />\n<br />\n'
    }
    let team_Ch = '', team_En = ''
    if (info.subTeam_Ch && info.subTeam_En) {
      info.subTeam_Ch.forEach(item => { team_Ch += item + ' & ' })
      info.subTeam_En.forEach(item => { team_En += item + ' & ' })
    }
    if (team_Ch != ''){
      team_Ch = team_Ch.slice(0, -3)
      team_En = team_En.slice(0, -3)
      content += `这个项目与 <strong>${team_Ch}</strong> 合作，感谢他们精心制作的字幕。<br />\n`
      content += `This project is in collaboration with <strong>${team_En}</strong>. Thanks to them for crafting Chinese subtitles.<br />\n<br />\n`
    }
    let comment_Ch = info.comment_Ch.split('\n')
    let comment_En = info.comment_En.split('\n')
    for (let i = 0; i <comment_Ch.length; i++){
      content += comment_Ch[i] + '<br />\n'
      content += comment_En[i] + '<br />\n<br />\n'
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
      let rs_comment_Ch = info.rs_comment_Ch!.split('\n')
      let rs_comment_En = info.rs_comment_En!.split('\n')
      content += '重发修正：<br />\n'
      rs_comment_Ch.forEach(item => {
        content += item + '<br />\n'
      });
      content += '<br />\nReseed comment:<br />\n'
      rs_comment_En.forEach(item => {
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
    let parsed_bbcode = reader.parse(md)
    let bbcode = bbcodeWriter.render(parsed_bbcode)
    let html = content
    if (!info.reseed) {
      md += '\n\n' +  info.pictures_md
      html += info.pictures_html
      info.pictures_bbcode = info.pictures_bbcode!.replace(/IMG/g, 'img')
      info.pictures_bbcode = info.pictures_bbcode!.replace(/URL/g, 'url')
      bbcode += info.pictures_bbcode
    }
    fs.writeFileSync(result + '\\bangumi.html', html)
    fs.writeFileSync(result + '\\nyaa.md', md)
    fs.writeFileSync(result + '\\acgrip.bbcode', bbcode)
    fs.copyFileSync(config.torrent, result + '\\' + config.torrent.replace(/^.*[\\\/]/, ''))
    return 'success'
  } catch (err) {
    dialog.showErrorBox('错误', (err as Error).message)
    return 'failed'
  }
}
async function saveContent(_event, id: number, config_: string) {
  let config: PublishConfig = JSON.parse(config_)
  const result = await saveConfig(id, config)
  if (result == 'taskNotFound') return 'taskNotFound'
  else return 'success'
}

//创建时打开任务 / 获取任务信息
async function openTask(_event, id: number) {
  try{
    let storage = db.data.posts.find(item => item.id == id)
    if (storage == undefined) return {status: 'notFound'}
    db.data.posts.find(item => item.id == id)!.step = 'create'
    await db.write()
    if (!fs.existsSync(storage.path)) return {status: 'folderNotFound'}
    const config: PublishConfig = await JSON.parse(fs.readFileSync(storage.path + '\\config.json', {encoding: 'utf-8'}))
    return {status: config.type, config: config}
  }
  catch(err){
    dialog.showErrorBox('错误', (err as Error).message)
    return {status: 'failed'}
  }
}

//从url.txt加载对比图
async function loadFromTxt(_event) {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties:[ 'openFile' ],
    filters: [{name: 'txt', extensions:['txt']}]
  })
  if (canceled) return new String[3]
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
  return [html, md, bbcode]
} 

//复查任务
async function checkTask(_event, id: number) {
  try {
    let storage = db.data.posts.find(item => item.id == id)
    let html = '', md = '', bbcode = '', title = ''
    if (storage == undefined) 
      throw new Error('TaskNotFound:' + id)
    storage.step = 'check'
    await db.write()
    if (!fs.existsSync(storage.path)) 
      throw new Error('FolderNotFound:' + id)
    if (fs.existsSync(storage.path + '\\bangumi.html'))
      html = fs.readFileSync(storage.path + '\\bangumi.html', {encoding: 'utf-8'})
    if (fs.existsSync(storage.path + '\\nyaa.md'))
      md = fs.readFileSync(storage.path + '\\nyaa.md', {encoding: 'utf-8'})
    if (fs.existsSync(storage.path + '\\acgrip.bbcode'))
      bbcode = fs.readFileSync(storage.path + '\\acgrip.bbcode', {encoding: 'utf-8'})
    if (fs.existsSync(storage.path + '\\config.json')) {
      let content: PublishConfig = JSON.parse(fs.readFileSync(storage.path + '\\config.json', {encoding: 'utf-8'}))
      title = content.title
    }
    return {html: html, md: md, bbcode: bbcode, title: title}
  } catch (err) {
    dialog.showErrorBox('错误', (err as Error).message)
    return {}
  }
}

//保存文件内容
async function saveFileContent(_event, id: number, type: string, content: string, title: string) {
  try{
    let storage = db.data.posts.find(item => item.id == id)
    if (storage == undefined) 
      throw new Error('TaskNotFound:' + id)
    if (!fs.existsSync(storage.path)) 
      throw new Error('FolderNotFound:' + id)
    if (type == 'html')
      fs.writeFileSync(storage.path + '\\bangumi.html', content, {encoding: 'utf-8'})
    if (type == 'md')
      fs.writeFileSync(storage.path + '\\nyaa.md', content, {encoding: 'utf-8'})
    if (type == 'bbcode')
      fs.writeFileSync(storage.path + '\\acgrip.bbcode', content, {encoding: 'utf-8'})
    let config: PublishConfig = await JSON.parse(fs.readFileSync(storage.path + '\\config.json', {encoding: 'utf-8'}))
    config.title = title
    fs.writeFileSync(storage.path + '\\config.json', JSON.stringify(config))
    return true
  }
  catch(err) {
    dialog.showErrorBox('错误', (err as Error).message)
    return false
  }
}

async function exportContent(_event, id: number, type: string) {
  let post = db.data.posts.find(item => item.id == id)!
  const {canceled, filePath} = await dialog.showSaveDialog({defaultPath: post.name,filters: [{name: type, extensions: [type]}]})
  if (canceled) return
  let filename = ''
  if (type == 'html') filename = '/bangumi.html'
  if (type == 'md') filename = '/nyaa.md'
  if (type == 'bbcode') filename = '/acgrip.bbcode'
  fs.copyFileSync(post.path + filename, filePath)
}

//保存代理设置
async function setProxyConfig(_event, config: string) {
  let pconf = JSON.parse(config)
  db.data.proxyConfig = pconf
  await db.write()
  app.relaunch()
  app.exit()
}

//保存用户密码
async function saveAccountInfo(_event, info: string) {
  const result: Message_AccountInfo[] = JSON.parse(info)
  for (let index = 0; index < 6; index++) {
    db.data.cookies[index].username = result[index].username
    db.data.cookies[index].password = result[index].password
    db.data.cookies[index].enable = result[index].enable
  }
  await db.write()
}

//删除任务
async function removeTask(_event, index: number) {
  fs.rmSync(db.data.posts.find((item) => item.id == index)!.path, { recursive: true, force: true })
  db.data.posts = db.data.posts.filter((item) => item.id != index)
  db.write()
  mainWindowWebContent.send('refreshTaskData')
}

//获取任务的发布情况
async function getPublishInfo(_event, id: number) {
  try{
    let storage = db.data.posts.find(item => item.id == id)
    let result: Message_PublishStatus[] = []
    if (storage == undefined) 
      throw new Error('TaskNotFound:' + id)
    if (storage.bangumi) 
      if (storage.bangumi == '种子已存在') 
        result.push({site: 'bangumi', status: '种子已存在'})
      else
        result.push({site: 'bangumi', status: '发布完成'})
    if (storage.nyaa) 
      if (storage.nyaa == '种子已存在') 
        result.push({site: 'nyaa', status: '种子已存在'})
      else
        result.push({site: 'nyaa', status: '发布完成'})
    if (storage.acgrip) 
      if (storage.acgrip == '种子已存在') 
        result.push({site: 'acgrip', status: '种子已存在'})
      else
        result.push({site: 'acgrip', status: '发布完成'})
    if (storage.dmhy) 
      if (storage.dmhy == '种子已存在') 
        result.push({site: 'dmhy', status: '种子已存在'})
      else
        result.push({site: 'dmhy', status: '发布完成'})
    if (storage.acgnx_a) 
      if (storage.acgnx_a == '种子已存在') 
        result.push({site: 'acgnx_a', status: '种子已存在'})
      else
        result.push({site: 'acgnx_a', status: '发布完成'})
    if (storage.acgnx_g) 
      if (storage.acgnx_g == '种子已存在') 
        result.push({site: 'acgnx_g', status: '种子已存在'})
      else
        result.push({site: 'acgnx_g', status: '发布完成'})
    storage.step = 'publish'
    await db.write()
    return JSON.stringify(result)
  }
  catch(err){
    dialog.showErrorBox('错误', (err as Error).message)
    return []
  }
}

//发布前检查登录情况
async function checkAccount(_event, type: string) {
  await checkLoginStatus(type)
  let result = db.data.cookies.find((item) => item.name == type)!.status
  return result
}

//主站发布获取信息
async function getSiteInfo(_event, id: number) {
  try {
    let storage = db.data.posts.find(item => item.id == id)
    if (storage == undefined) 
      throw new Error('TaskNotFound:' + id)
    if (!fs.existsSync(storage.path)) 
      throw new Error('FolderNotFound:' + id)
    const config: PublishConfig = await JSON.parse(fs.readFileSync(storage.path + '\\config.json', {encoding: 'utf-8'}))
    storage.step = 'site'
    await db.write()
    let result: string[] = []
    //从文件创建
    if (config.type == 'file') {
      result.push('')
      result.push('')
      result.push('')
      return result
    }
    //从模板创建
    else {
      let info = config.content as Content_text
      let note = ''
      if (info.note)
        info.note.forEach(item => { note += item + ' + ' })
      if (note != '')
          note = note.slice(0, -2)
      if (info.reseed)
          note += `Reseed${info.rs_version > 1 ? ` v${info.rs_version}` : ''} Fin`
      else
          note += 'Fin'
      let title = `${info.Name_En}${info.Name_Ch == '' ? '' : ' / ' +  info.Name_Ch} ${info.bit} ${info.resolution} ` 
                + `${info.encoding} ${info.torrent_type} [${note}]`
      result.push(title)
      let team_Ch = '', content = ''
      if (info.nomination)
        content += '本番由 <strong>组员提名</strong>，应要求制作。感谢他们为 VCB-Studio 发展做出的无私奉献。\n\n'
      if (info.subTeam_Ch) {
        info.subTeam_Ch.forEach(item => { team_Ch += item + ' & ' })
      }
      if (team_Ch != ''){
        team_Ch = team_Ch.slice(0, -3)
        content += `这个项目与 <strong>${team_Ch}</strong> 合作，感谢他们精心制作的字幕。\n\n`
      }
      content += info.comment_Ch + '\n\n'
      if (info.sub_Ch && info.sub_Ch != '') {
        content += info.sub_Ch + '\n'
      }
      if (info.audio_Ch && info.audio_Ch != '') {
        content += info.audio_Ch + '\n'
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
        content += info.rs_comment_Ch + '\n[/box]\n\n'
      }
      content += '[box style="download"]\n'
      content += `${info.bit} ${info.resolution} ${info.encoding}${info.reseed ? ' (Reseed)' : ''}`
      content += '\n\n链接加载中[/box]\n\n'
      if (info.reseed) 
        content += '<hr />\n\n请将旧链放于此\n\n'
      if (info.imageCredit != '') {
        content += `Image Credit: <a href="${info.imageLinks}" rel="noopener" target="_blank">${info.imageCredit}</a>\n\n`
      }
      content += '<label for="medie-info-switch" class="btn btn-inverse-primary" title="展开MediaInfo">MediaInfo</label>\n\n'
      content += '<pre class="js-medie-info-detail medie-info-detail" style="display: none">\n'
      if (info.mediaInfo == '') 
        content += '请将MediaInfo放置于此'
      else 
        content += info.mediaInfo
      content += '\n</pre>'
      result.push(content)
      result.push(info.imageSrc!)
      return result
    }
  }
  catch (err) {
    console.log(err)
    dialog.showErrorBox('错误', (err as Error).message)
    return []
  }
}
//主站获取BT链接
async function getBTLinks(_event, id: number) {
  try {
    let storage = db.data.posts.find(item => item.id == id)
    if (storage == undefined) 
      throw new Error('TaskNotFound:' + id)
    if (!fs.existsSync(storage.path)) 
      throw new Error('FolderNotFound:' + id)
    storage.step = 'site'
    await db.write()
    let result: string[] = []
    let isFinished = 'true'
    //若bangumi团队同步未完成则再次尝试获取各站链接
    if (storage.sync && 
      !storage.acgrip && 
      !storage.dmhy && 
      !storage.acgnx_g && 
      !storage.acgnx_a
    ){
      isFinished = 'false'
      let response = await axios.post('https://bangumi.moe/api/torrent/fetch', {_id: storage.bangumi!.split('torrent/')[1]}, { responseType: 'json' })
      for (let index = 0; index < 5; index++) {
        if (response.status == 200 && response.data.sync){ 
          isFinished = 'true'
          storage.sync = false
          break
        }
        await sleep(1000)
        response = await axios.post('https://bangumi.moe/api/torrent/fetch', {_id: storage.bangumi!.split('torrent/ ')[1]}, { responseType: 'json' })
      }
      if (!storage.sync) 
      {
        if (response.data.sync.acgnx != '已存在相同的种子'){
          storage.acgnx_a = response.data.sync.acgnx
        }
        else{
          if (!storage.acgnx_a)
            storage.acgnx_a = '种子已存在'
        }
        if (response.data.sync.acgnx_int != '已存在相同的种子'){
          storage.acgnx_g = response.data.sync.acgnx_int
        }
        else{
          if (!storage.acgnx_g)
            storage.acgnx_g = '种子已存在'
        }
        if (response.data.sync.acgrip != '已存在相同的种子'){
          storage.acgrip = response.data.sync.acgrip
        }
        else{
          if (!storage.acgrip)
            storage.acgrip = '种子已存在'
        }
        if (response.data.sync.dmhy != '已存在相同的种子'){
          storage.dmhy = response.data.sync.dmhy
        }
        else{
          if (!storage.dmhy)
            storage.dmhy = '种子已存在'
        }
      }
      await db.write()
    }
    //重新尝试获取动漫花园的链接
    if (storage.dmhy == '未找到链接') {
      isFinished = 'false'
      const config: PublishConfig = await JSON.parse(fs.readFileSync(storage.path + '\\config.json', {encoding: 'utf-8'}))
      let postresult = await axios.get('https://www.dmhy.org/topics/mlist/scope/team', { responseType: 'text' })
      let rtitle = config.title.replace(/[\*\.\?\+\^\$\|\\\/\[\]\(\)\{\}\s]/g, '[\\S\\s]').replace(/&/g, '&amp;')
      var rule = new RegExp('<a\\shref="([\\S]*?)"[\\s]*?target="_blank">' + rtitle)
      let src = ''
      for (let index = 0; index < 5; index++) {
        let result = (postresult.data as string).match(rule)
        if (result) {
          src = result[1]
          break
        }
        await sleep(1000)
        postresult = await axios.get('https://www.dmhy.org/topics/mlist/scope/team', { responseType: 'text' })
      }
      if (src == '')
        storage.dmhy = '未找到链接'
      else {
        storage.dmhy = 'https://www.dmhy.org' + src
        isFinished = 'true'
      }
      await db.write()
    }
    result.push(storage.bangumi ? storage.bangumi : '')
    result.push(storage.nyaa ? storage.nyaa : '')
    result.push(storage.acgrip ? storage.acgrip : '')
    result.push(storage.dmhy ? storage.dmhy : '')
    result.push(storage.acgnx_g ? storage.acgnx_g : '')
    result.push(storage.acgnx_a ? storage.acgnx_a : '')
    result.push(isFinished)
    return result
  }
  catch (err) {
    console.log(err)
    dialog.showErrorBox('错误', (err as Error).message)
    return []
  }
}

//获取主站发布链接
async function getSiteSrc(_event, id: number) {
  try {
    let storage = db.data.posts.find(item => item.id == id)
    if (storage == undefined) 
      throw new Error('TaskNotFound:' + id)
    if (!fs.existsSync(storage.path)) 
      throw new Error('FolderNotFound:' + id)
    storage.step = 'finish'
    storage.status = 'published'
    await db.write()
    return storage.site ? storage.site : ''
  }
  catch (err){
    console.log(err)
    dialog.showErrorBox('错误', (err as Error).message)
    return ''
  }
}

//清除缓存
async function clearStorage(_event) {
  const partition = 'persist:login'
  let ses = session.fromPartition(partition)
  await ses.clearStorageData()
  db.data.cookies.forEach((item) =>{
    item.cookie = []
  })
  db.write()
  mainWindowWebContent.send('refreshLoginData')
}

//写入剪切板
function writeClipboard(_event, str: string) {
  clipboard.writeText(str)
}

//主窗口
let mainWindowWebContent: Electron.WebContents
function createWindow(): void {
  
  const partition = 'persist:main'

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
      callback({ requestHeaders: details.requestHeaders})
      return
    }
    const info = db.data.cookies.find(item => item.name == type) as LoginInfo
    let str = ''
    info.cookie.forEach(item => {
      str += `${item.name}=${item.value}; `
    })
    details.requestHeaders['Cookie'] = str
    details.requestHeaders['User-Agent'] = userAgent
    callback({ requestHeaders: details.requestHeaders })
  })

  //监听程序崩溃
  mainWindowWebContent.on('render-process-gone', (_e, detail) => {
    console.log(detail)
    app.quit()
  })

  //窗口控制
  ipcMain.on("WinHandle", (_event, command: string) => {
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
  ipcMain.on('openLoginWindow', (_event, type: string) => {
    createLoginWindow(type)
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.on('will-navigate', (e, url) => {
    e.preventDefault()
    shell.openExternal(url)
})

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  mainWindow.on('close', (_event) => {app.quit()})

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(async () => {
  //设置应用数据库
  db = await JSONFilePreset<Data>(app.getPath('userData') + '\\easypublish-db.json', defaultData)
  await db.write()
  //响应通信
  ipcMain.handle('openFile', handleFileOpen)
  ipcMain.handle('openDirectory', openDirectory)
  ipcMain.handle('createTask', createTask)
  ipcMain.handle("createWithFile", createWithFile)
  ipcMain.handle("createWithText", createWithText)
  ipcMain.handle("saveContent", saveContent)
  ipcMain.handle('openTask', openTask)
  ipcMain.handle('checkTask', checkTask)
  ipcMain.handle('saveFileContent', saveFileContent)
  ipcMain.handle('getBangumiTag', getBangumiTags)
  ipcMain.handle('searchBangumiTag', searchBangumiTags)
  ipcMain.handle('getLoginInfo', getLoginInfo)
  ipcMain.handle('getProxyConfig', _event => JSON.stringify(db.data.proxyConfig))
  ipcMain.handle('getAllTask', _event => db.data.posts)
  ipcMain.handle('getPublishInfo', getPublishInfo)
  ipcMain.handle('getSiteInfo', getSiteInfo)
  ipcMain.handle('getBTLinks', getBTLinks)
  ipcMain.handle('checkAcount', checkAccount)
  ipcMain.handle('readFileContent', readFileContent)
  ipcMain.handle('publish', BTPublish)
  ipcMain.handle('sitePublish', sitePublish)
  ipcMain.handle('siteRSPublish', siteRSPublish)
  ipcMain.handle('setSiteUAP', setSiteUAP)
  ipcMain.handle('getSiteSrc', getSiteSrc)
  ipcMain.handle('searchPosts', searchPosts)
  ipcMain.handle('loadFromTxt', loadFromTxt)
  ipcMain.on('setProxyConfig', setProxyConfig)
  ipcMain.on('saveAccountInfo', saveAccountInfo)
  ipcMain.on('checkLoginStatus', (_event, type: string, value: string) => checkLogin(type, value))
  ipcMain.on('removeTask', removeTask)
  ipcMain.on('clearStorage', clearStorage)
  ipcMain.on('writeClipboard', writeClipboard)
  ipcMain.on('exportCookies', exportCookies)
  ipcMain.on('importCookies', importCookies)
  ipcMain.on('exportContent', exportContent)

  //配置axios代理
  let pconf = db.data.proxyConfig
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
