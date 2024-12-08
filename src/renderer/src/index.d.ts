
export interface Content_text {
  sub: string
  Name_Ch: string
  Name_En: string
  Name_Jp: string
  bit: string
  resolution: string
  encoding: string  
  torrent_type: string
  note: string[]
  audio_Ch?: string
  audio_En?: string
  comment_Ch: string
  comment_En: string
  subTeam_Ch?: string
  subTeam_En?: string
  nonsense?: string
  members: {
    script: string
    encode: string
    collate: string
    upload: string
  }
  providers:{
    BD: string[]
    Scan: string[]
    CD: string[]
  }
  pictures_html: string
  pictures_md: string
  picture_title: string
}

export interface Content_file {
  path_md: string
  path_html: string
  path_site: string
  path_bbcode: string
}

export interface PublishConfig {
  type: 'text' | 'file'
  name: string
  torrent: string
  torrentname?: string
  category_bangumi: string
  category_nyaa: string
  tag: string[]
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