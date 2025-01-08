import { contextBridge } from 'electron'
import { ipcRenderer } from 'electron/renderer'
import type { PublishConfig} from '../renderer/src/index.d.ts'

// Custom APIs for renderer
const api = {
  WinHandle: (command: string) => ipcRenderer.send("WinHandle", command) , 
  OpenFile: async (type: string) => await ipcRenderer.invoke('openFile', type) , 
  GetProxyConfig: async () => await ipcRenderer.invoke('getProxyConfig'), 
  SetProxyConfig: (config: string) => ipcRenderer.send('setProxyConfig', config), 
  CreateTask: async (path: string, config: PublishConfig) => await ipcRenderer.invoke('createTask', path, config) ,
  CreateWithFile: async (id: number, config: string) => await ipcRenderer.invoke('createWithFile', id, config), 
  SaveWithFile: async (id: number, config: string) => await ipcRenderer.invoke('saveWithFile', id, config), 
  OpenTask: async (id: number) => await ipcRenderer.invoke('openTask', id),
  CheckTask: async (id: number) => await ipcRenderer.invoke('checkTask', id),
  SaveFileContent: async (id: number, type: string, content: string) => await ipcRenderer.invoke('saveFileContent', id, type, content), 
  GetBangumiTags: async (query: string) => await ipcRenderer.invoke('getBangumiTag', query),
  SearchBangumiTags: async (query: string) => await ipcRenderer.invoke('searchBangumiTag', query),
  GetLoginInfo: async () => await ipcRenderer.invoke('getLoginInfo'),
  OpenLoginWindow: (type: string) => ipcRenderer.send('openLoginWindow', type),
  RefreshLoginData: (loadData: () => void) => ipcRenderer.on('refreshLoginData', _event => loadData()),
  RefreshTaskData: (loadData: () => void) => ipcRenderer.on('refreshTaskData', _event => loadData()),
  SetUAP: (UAPs: string) => ipcRenderer.send('setUAP', UAPs),
  CheckLoginStatus: () => ipcRenderer.send('checkLoginStatus'),
  RemoveTask: (index: number) => ipcRenderer.send('removeTask', index),
  GetAllTask: async () => await ipcRenderer.invoke('getAllTask'),
  GetPublishInfo: async (id: number) => await ipcRenderer.invoke('getPublishInfo', id),
  GetSiteInfo: async (id: number) => await ipcRenderer.invoke('getSiteInfo', id),
  CheckAccount: async (type: string) => await ipcRenderer.invoke('checkAcount', type),
  ReadFileContent: async () => await ipcRenderer.invoke('readFileContent'),
  SetSiteUAP: async (op: boolean, username: string, password: string) => await ipcRenderer.invoke('setSiteUAP', op, username, password),
  Publish: async (id: number, type: string) => await ipcRenderer.invoke('publish', id, type),
  SitePublish: async (id: number, categories: string, imgsrc: string, title: string, content: string) => await ipcRenderer.invoke('sitePublish', id, title, content, imgsrc, categories),
  SiteRSPublish: async (id: number, rsID: number, title: string, content: string) => await ipcRenderer.invoke('siteRSPublish', id, rsID, title, content),
  GetSiteSrc: async (id: number) => await ipcRenderer.invoke('getSiteSrc', id),
  ClearStorage: () => ipcRenderer.send('clearStorage'),
  WriteClipboard: (str: string) => ipcRenderer.send('writeClipboard', str),
  SearchPosts: (str: string) =>ipcRenderer.invoke("searchPosts", str),
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
contextBridge.exposeInMainWorld('api', api)
