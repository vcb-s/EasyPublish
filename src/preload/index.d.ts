import type { 
  PublishConfig, 
  Content_file, 
  Message_FileContent, 
  Message_LoginInfo, 
  Message_ProxyConfig, 
  Message_TaskInfo,
  } from '../renderer/src/index.d.ts'

export interface IElectronAPI {
  WinHandle: (command: string) => void,
  GetProxyConfig: () => Promise<string>,
  SetProxyConfig: (config: string) => void,
  OpenFile: (type: string) => Promise<string>,
  CreateWithFile: (id: number, config: string) => Promise<string>,
  SaveWithFile: (id: number, config: string) => Promise<string>,
  CreateTask: (path: string, config: PublishConfig) => Promise<string>,
  OpenTask: (id: number) => Promise<{
    config: PublishConfig | undefined,
    status: string
  }>
  CheckTask: (id: number) => Promise<Message_FileContent>
  SaveFileContent: (id: number, type: string, content: string) => Promise<boolean>
  GetBangumiTags: (query: string) => Promise
  SearchBangumiTags: (query: string) => Promise
  GetLoginInfo: () => Promise<string>
  OpenLoginWindow: (type: string) => void
  RefreshLoginData: (loadData: Function) => void
  RefreshTaskData: (loadData: Function) => void
  SetUAP: (UAPs: string) => void
  CheckLoginStatus: () => void
  RemoveTask: (index: number) => void
  GetAllTask: () => Promise<Message_TaskInfo[]>
  GetPublishInfo: (id: number) => Promise<string>
  GetSiteInfo: (id: number) => Promise<string[]>
  CheckAccount: (type: string) => Promise<string>
  ReadFileContent: () => Promise<string>
  SetSiteUAP: (op: boolean, username: string, password: string) => Promise<string[]>
  Publish: (id: number, type: string) => Promise<string>
  SitePublish: (id: number, categories: string, imgsrc: string, title: string, content: string) => Promise<string>
  GetSiteSrc: (id: number) => Promise<string>
  ClearStorage: () => void
  WriteClipboard: (str: string) => void
}

declare global {
  interface Window {
    api: IElectronAPI
  }
}
