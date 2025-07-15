//数据库设置
declare namespace Config {
  import { Cookie } from 'electron'

  const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36'
  type Task = {
    id: number
    name: string
    path: string
    bangumi?: string
    nyaa?: string
    acgrip?: string
    dmhy?: string
    acgnx_g?: string
    acgnx_a?: string
    forumLink?: string
    sync: boolean
    type: 'file' | 'template' | 'quick'
    status: 'published' | 'publishing'
    step: 'edit' | 'check' | 'bt_publish' | 'forum_publish' | 'finish'
  }
  type LoginInfo = {
    name: string, 
    time: string, 
    status: string,
    username: string,
    password: string,
    enable: boolean,
    cookies: Cookie[]
  }
  type TaskData = {
    tasks: Task[]
  }
  type UserData = {
    info: LoginInfo[]
    proxyConfig: ProxyConfig
    forum: {username: string, password: string}
  }

  interface ProxyConfig{
    status: boolean
    type: string
    host: string
    port: number
  }

  interface Content_template {
    title_CN: string
    title_EN: string
    title_JP: string
    depth: string
    resolution: string
    encoding: string
    contentType: string
    reseed: boolean
    nomination: boolean
    note: string[]
    sub_CN?: string
    sub_EN?: string
    audio_CN?: string
    audio_EN?: string
    comment_CN: string
    comment_EN: string
    rsVersion: number
    rsComment_CN?: string
    rsComment_EN?: string
    subTeam_CN?: string[]
    subTeam_EN?: string[]
    nonsense?: string
    members: {
      script: string
      encode: string
      collate: string
      upload: string
    }
    providers?: string
    comparisons_html?: string
    comparisons_md?: string
    comparisons_bbcode?: string
    posterUrl: string
    mediaInfo?: string
    imageCredit?: string
    imageSource?: string
    imagePath?: string
    prefill: boolean
  }

  declare interface Content_file {
    path_md: string
    path_html: string
    path_bbcode: string
  }

  declare interface PublishConfig {
    torrentPath: string
    torrentName: string
    category_bangumi: string
    category_nyaa: string
    tags: {label: string, value: string}[]
    content: Content_file | Content_template
    completed?: boolean
    information: string
    remake?: boolean
    title: string
  }
}
