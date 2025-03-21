
export interface Content_text {
  Name_Ch: string
  Name_En: string
  Name_Jp: string
  bit: string
  resolution: string
  encoding: string
  torrent_type: string
  reseed: boolean
  nomination: boolean
  note: string[]
  sub_Ch?: string
  sub_En?: string
  audio_Ch?: string
  audio_En?: string
  comment_Ch: string
  comment_En: string
  rs_version: number
  rs_comment_Ch?: string
  rs_comment_En?: string
  subTeam_Ch?: string[]
  subTeam_En?: string[]
  nonsense?: string
  members: {
    script: string
    encode: string
    collate: string
    upload: string
  }
  providers?: string
  pictures_html?: string
  pictures_md?: string
  pictures_bbcode?: string
  picture_path: string
  mediaInfo?: string
  imageCredit?: string
  imageLinks?: string
  imageSrc?: string
}

export interface Content_file {
  path_md: string
  path_html: string
  path_bbcode: string
}

export interface PublishConfig {
  type: 'text' | 'file'
  name: string
  torrent: string
  torrentname?: string
  category_bangumi: string
  category_nyaa: string
  tag: {label: string, value: string}[]
  content?: Content_file | Content_text
  completed?: boolean
  information: string
  remake?: boolean
  title: string
}

export interface Message_FileContent {
  html: string
  md: string
  bbcode: string
  title: string
}

export interface Message_LoginInfo{
  name: string
  time: string
  status: string
  username: string
  password: string
  cookies: {name: string, value: string}[]
}

export interface Message_UAP{
  username: string
  password: string
}

export interface Message_TaskInfo {
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

export interface Message_PublishStatus{
  site: string
  status: string
}

export interface ProxyConfig{
  status: boolean
  type: string
  host: string
  port: number
}

export interface Message_rsPosts{
  id: number
  title: string
  content: string
  raw: string
}