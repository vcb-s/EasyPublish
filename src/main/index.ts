import { app, shell, BrowserWindow, ipcMain, dialog, Cookie, session, clipboard } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import type { PublishConfig, 
  Content_file, 
  Message_PublishStatus,
  Message_LoginInfo, 
  Message_UAP,
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
import appIcon from '../../build/icon.ico?asset'

/*
                   _ooOoo_
                  o8888888o
                  88" . "88
                  (| -_- |)
                  O\  =  /O
               ____/`---'\____
             .'  \\|     |//  `.
            /  \\|||  :  |||//  \
           /  _||||| -:- |||||-  \
           |   | \\\  -  /// |   |
           | \_|  ''\---/''  |   |
           \  .-\__  `-`  ___/-. /
         ___`. .'  /--.--\  `. . __
      ."" '<  `.___\_<|>_/___.'  >'"".
     | | :  `- \`.;`\ _ /`;.`/ - ` : | |
     \  \ `-.   \_ __\ /__ _/   .-` /  /
======`-.____`-.___\_____/___.-`____.-'======
                   `=---='
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
            佛祖保佑       永无BUG
*/

//应用数据管理及异常处理错误日志打印
const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.6478.234 Safari/537.36'
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
  status: 'published' | 'publishing'
  step: 'create' | 'check' | 'publish' | 'site' | 'finish'
}
type LoginInfo = {
  name: string, 
  time: string, 
  status: string,
  username: string,
  password: string,
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
    cookie: []
  },
  {
    name: 'nyaa',
    time: '--',
    status: '账号未登录',
    username: '',
    password: '',
    cookie: []
  },
  {
    name: 'acgrip',
    time: '--',
    status: '账号未登录',
    username: '',
    password: '',
    cookie: []
  },
  {
    name: 'dmhy',
    time: '--',
    status: '账号未登录',
    username: '',
    password: '',
    cookie: []
  },
  {
    name: 'acgnx_g',
    time: '--',
    status: '账号未登录',
    username: '',
    password: '',
    cookie: []
  },
  {
    name: 'acgnx_a',
    time: '--',
    status: '账号未登录',
    username: '',
    password: '',
    cookie: []
  },
]}
let db: Low<Data>

//等待
function sleep(ms) {
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
      formData.append('tag_ids', config.tag.toString())
      formData.append('btskey', 'undefined')
      formData.append('team_id', team_id)
      formData.append('teamsync', '1')
      formData.append('file', new Blob([torrent], {type: 'application/x-bittorrent'}), config.torrentname)
      const response = await axios.post('https://bangumi.moe/api/torrent/add', formData, { responseType: 'json' })
      if (response.status != 200) throw response
      if (response.data.success === true) {
        storage.bangumi = 'https://bangumi.moe/torrent/' + response.data.torrent._id
        await sleep(1000)
        let result = await axios.post('https://bangumi.moe/api/torrent/fetch', {_id: response.data.torrent._id}, { responseType: 'json' })
        for (let index = 0; index < 5; index++) {
          if (result.status == 200) 
            break
          await sleep(1000)
          result = await axios.post('https://bangumi.moe/api/torrent/fetch', {_id: response.data.torrent._id}, { responseType: 'json' })
        }
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
      formData.append('tag_ids', config.tag.toString())
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
          storage.nyaa = '种子已存在'
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
      let imgsrc = html.match(/<img\ssrc="([\S]*?)"/)![1]
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
          storage.dmhy = '种子已存在'
          await db.write()
        }
        return 'exist'
      }
      if ((response.data as string).includes('上傳成功')) {
        //dmhy发布后不会返回发布的链接，需要从管理页获取，但网站数据同步还有延迟，算是难用到一定程度了，不知道bangumi团队同步是怎么解决这个问题的
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
          storage.acgnx_a = '种子已存在'
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
          storage.acgnx_g = '种子已存在'
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
          storage.acgrip = '种子已存在'
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
    if (result.status != 201)
      throw result
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
    if (response.status == 401) return 'unauthorized'
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
    console.log(response)
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
  const response = await axios.get('https://vcb-s.com/wp-json/wp/v2/posts?search=' + title, { responseType: 'json' })
  response.data.forEach(item => {
    result.push({
      id: item.id,
      title: item.title.rendered,
      content: item.content.rendered.split('<!--more-->')[0]
    })
  })
  return result
}

//登录窗口设置
async function createLoginWindow(type: string) {

  let url:string
  if (type == 'bangumi') url = 'https://bangumi.moe'
  else if (type == 'nyaa') url = 'https://nyaa.si'
  else if (type == 'acgrip') url = 'https://acg.rip'
  else if (type == 'dmhy') url = 'https://www.dmhy.org'
  else if (type == 'acgnx_g') url = 'https://www.acgnx.se'
  else url = 'https://share.acgnx.se'

  //获取并保存cookie信息
  async function setCookies(type: string, url: string) {
    await loginWindow.webContents.session.cookies.get({url: url}).then((cookies) => {
      db.data.cookies.find(item => item.name == type)!.cookie = cookies
    }).catch(err => {console.log(err)})
    if (type.includes('acgnx'))
      await loginWindow.webContents.session.cookies.get({name: 'cf_clearance'}).then((cookies) => {
        db.data.cookies.find(item => item.name == type)!.cookie.push(...cookies)
    }).catch(err => {console.log(err)})
    await db.write()
  }

  const loginWindow = new BrowserWindow({
    width: 950,
    minWidth: 950,
    minHeight: 550,
    height: 550,
    autoHideMenuBar: true,
    show: false,
    icon: appIcon,
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
  loginWindow.webContents.session.webRequest.onBeforeSendHeaders((details, callback) => {
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

//判断登陆状态
async function checkLoginStatus(type: string) {
  try{
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
        db.data.cookies[0].time = getCurrentTime()
        db.data.cookies[0].status = '账号未登录'
      }
      else {
        db.data.cookies[0].time = getCurrentTime()
        db.data.cookies[0].status = '账号已登录'
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
        db.data.cookies[1].time = getCurrentTime()
        db.data.cookies[1].status = '账号未登录'
      }
      else if (status == 200) {
        db.data.cookies[1].time = getCurrentTime()
        db.data.cookies[1].status = '账号已登录'
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
        db.data.cookies[2].time = getCurrentTime()
        db.data.cookies[2].status = '账号未登录'
      }
      else if (status == 200) {
        db.data.cookies[2].time = getCurrentTime()
        db.data.cookies[2].status = '账号已登录'
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
        db.data.cookies[3].time = getCurrentTime()
        db.data.cookies[3].status = '账号未登录'
      }
      else if (status == 200) {
        db.data.cookies[3].time = getCurrentTime()
        db.data.cookies[3].status = '账号已登录'
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
        db.data.cookies[4].time = getCurrentTime()
        db.data.cookies[4].status = '账号未登录'
      }
      else if (status == 403) {
        db.data.cookies[4].time = getCurrentTime()
        db.data.cookies[4].status = '防火墙阻止'
      }
      else if (status == 200) {
        if ((data as string).includes('Your request has been blocked, Please complete the captcha to access.')) {
          db.data.cookies[4].time = getCurrentTime()
          db.data.cookies[4].status = '防火墙阻止'
        }
        else {
          db.data.cookies[4].time = getCurrentTime()
          db.data.cookies[4].status = '账号已登录'
        }
      }
      else {
        throw response
      }
    }
    else {
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
        db.data.cookies[5].time = getCurrentTime()
        db.data.cookies[5].status = '账号未登录'
      }
      else if (status == 403) {
        db.data.cookies[5].time = getCurrentTime()
        db.data.cookies[5].status = '防火墙阻止'
      }
      else if (status == 200) {
        if ((data as string).includes('Your request has been blocked, Please complete the captcha to access.')) {
          db.data.cookies[5].time = getCurrentTime()
          db.data.cookies[5].status = '防火墙阻止'
        }
        else {
          db.data.cookies[5].time = getCurrentTime()
          db.data.cookies[5].status = '账号已登录'
        }
      }
      else {
        throw response
      }
    }
    await db.write()
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

//访问cookie信息
function getCookies(type: string) {
  const info = db.data.cookies.find(item => item.name == type) as LoginInfo
  let result: {name: string, value: string}[] = []
  info.cookie.forEach(item => {
      result.push({name: item.name, value: item.value})
  })
  return result
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
      cookies: getCookies(item.name)
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
    if (!fs.existsSync(path)) {
      return "noSuchFolder"
    }
    else{
      fs.mkdirSync( path + '\\' +  config.name)
      if (config.type == 'file') {
        const file: Content_file = {
          path_md: '',
          path_html: '',
          path_site: '',
          path_bbcode: '',
        }
        config.content = file
      }
      else {
        //使用模板创建，待开发
      }
      fs.writeFileSync(path + '\\' +  config.name + '\\config.json', JSON.stringify(config))
      let id = Date.now()
      db.data.posts.push({
        id: id,
        name: config.name,
        path: path + '\\' + config.name,
        status: 'publishing',
        step: 'create'
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

//从文件创建和保存
async function saveConfigWithFile(id: number, config: PublishConfig) {
  let storage = db.data.posts.find(item => item.id == id)
  if (storage == undefined) return "taskNotFound"
  const oldConfig: PublishConfig = await JSON.parse(fs.readFileSync(storage.path + '\\config.json', {encoding: 'utf-8'}))
  config.name = oldConfig.name;
  config.torrentname = config.torrent.replace(/^.*[\\\/]/, '');
  (config.content as Content_file).path_site = (oldConfig.content as Content_file).path_site
  fs.writeFileSync(storage.path + '\\config.json', JSON.stringify(config))
  return storage.path
}
async function createWithFile(_event, id: number, config_: string) {
  try {
    let config: PublishConfig = JSON.parse(config_)
    let isBBcodeExist = fs.existsSync((config.content as Content_file).path_bbcode)
    if (!fs.existsSync((config.content as Content_file).path_md)) {
      return "noSuchFile_md"
    }
    else if (!fs.existsSync((config.content as Content_file).path_html)) {
      return "noSuchFile_html"
    }
    else if (!fs.existsSync(config.torrent)) {
      return "noSuchFile_torrent"
    }
    else {
      const result = await saveConfigWithFile(id, config)
      if (result == 'taskNotFound') return 'taskNotFound'
      fs.copyFileSync((config.content as Content_file).path_md, result + '\\nyaa.md')
      fs.copyFileSync((config.content as Content_file).path_html, result + '\\bangumi.html')
      fs.copyFileSync(config.torrent, result + '\\' + config.torrent.replace(/^.*[\\\/]/, ''))
      if (isBBcodeExist) fs.copyFileSync((config.content as Content_file).path_bbcode, result + '\\acgrip.bbcode')
      return 'success'
    }
  } catch (err) {
    dialog.showErrorBox('错误', (err as Error).message)
    return 'failed'
  }
}
async function saveWithFile(_event, id: number, config_: string) {
  let config: PublishConfig = JSON.parse(config_)
  const result = await saveConfigWithFile(id, config)
  if (result == 'taskNotFound') return 'taskNotFound'
  else return 'success'
}

//创建时打开任务
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

//复查任务
async function checkTask(_event, id: number) {
  try {
    let storage = db.data.posts.find(item => item.id == id)
    let html = '', md = '', bbcode = ''
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
    return {html: html, md: md, bbcode: bbcode}
  } catch (err) {
    dialog.showErrorBox('错误', (err as Error).message)
    return {}
  }
}

//保存文件内容
async function saveFileContent(_event, id: number, type: string, content: string) {
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
    return true
  }
  catch(err) {
    dialog.showErrorBox('错误', (err as Error).message)
    return false
  }
}

//保存代理设置
async function setProxyConfig(_event, config: string) {
  db.data.proxyConfig = JSON.parse(config)
  await db.write()
}

//保存用户密码
async function setUAP(_event, UAPs: string) {
  const result: Message_UAP[] = JSON.parse(UAPs)
  for (let index = 0; index < 6; index++) {
    db.data.cookies[index].username = result[index].username
    db.data.cookies[index].password = result[index].password
  }
  await db.write()
}

//判断全部登录状态
async function checkAllLoginStatus(_event) {
  checkLoginStatus('bangumi').then(() => {
    mainWindowWebContent.send('refreshLoginData')
  })
  checkLoginStatus('nyaa').then(() => {
    mainWindowWebContent.send('refreshLoginData')
  })
  checkLoginStatus('acgrip').then(() => {
    mainWindowWebContent.send('refresLoginhData')
  })
  checkLoginStatus('dmhy').then(() => {
    mainWindowWebContent.send('refreshLoginData')
  })
  checkLoginStatus('acgnx_g').then(() => {
    mainWindowWebContent.send('refreshLoginData')
  })
  checkLoginStatus('acgnx_a').then(() => {
    mainWindowWebContent.send('refreshLoginData')
  })
}

//删除任务
async function removeTask(_event, index: number) {
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
  return db.data.cookies.find((item) => item.name == type)!.status
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
      result.push('萌番组：' + (storage.bangumi ? storage.bangumi : ''))
      result.push('Nyaa：' + (storage.nyaa ? storage.nyaa : ''))
      result.push('Acgrip：' + (storage.acgrip ? storage.acgrip : ''))
      result.push('动漫花园：' + (storage.dmhy ? storage.dmhy : ''))
      result.push('Acgnx：' + (storage.acgnx_g ? storage.acgnx_g : ''))
      result.push('末日动漫：' + (storage.acgnx_a ? storage.acgnx_a : ''))
      result.push('')
      result.push('')
      return result
    }
    //从模板创建，待开发
    else {
      return result
    }
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
  await session.defaultSession.clearStorageData()
  db.data.cookies.forEach((item) =>{
    item.cookie = []
  })
  mainWindowWebContent.send('refreshLoginData')
}

//写入剪切板
function writeClipboard(_event, str: string) {
  clipboard.writeText(str)
}

//主窗口
let mainWindowWebContent: Electron.WebContents
function createWindow(): void {
  // Create the browser window.

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
    },
    icon: appIcon,
  })
  mainWindowWebContent = mainWindow.webContents

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

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
  //设置应用数据库
  db = await JSONFilePreset<Data>('easypublish-db.json', defaultData)
  await db.write()
  //响应通信
  ipcMain.handle('openFile', handleFileOpen)
  ipcMain.handle('createTask', createTask)
  ipcMain.handle("createWithFile", createWithFile)
  ipcMain.handle("saveWithFile", saveWithFile)
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
  ipcMain.handle('checkAcount', checkAccount)
  ipcMain.handle('readFileContent', readFileContent)
  ipcMain.handle('publish', BTPublish)
  ipcMain.handle('sitePublish', sitePublish)
  ipcMain.handle('siteRSPublish', siteRSPublish)
  ipcMain.handle('setSiteUAP', setSiteUAP)
  ipcMain.handle('getSiteSrc', getSiteSrc)
  ipcMain.handle('searchPosts', searchPosts)
  ipcMain.on('setProxyConfig', setProxyConfig)
  ipcMain.on('setUAP', setUAP)
  ipcMain.on('checkLoginStatus', checkAllLoginStatus)
  ipcMain.on('removeTask', removeTask)
  ipcMain.on('clearStorage', clearStorage)
  ipcMain.on('writeClipboard', writeClipboard)

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
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

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
