import { contextBridge } from 'electron'
import { ipcRenderer } from 'electron/renderer'

const globalAPI = {
  getProxyConfig: async () => await ipcRenderer.invoke('global_getProxyConfig'), 
  getFilePath: async (msg: string) => await ipcRenderer.invoke('global_getFilePath', msg),
  getFolderPath: async () => await ipcRenderer.invoke('global_getFolderPath'),
  readFileContent: async () => await ipcRenderer.invoke('global_readFileContent'),
  winHandle: (msg: string) => ipcRenderer.send("global_winHandle", msg) , 
  setProxyConfig: (msg: string) => ipcRenderer.send('global_setProxyConfig', msg), 
  openFolder: (msg: string) => ipcRenderer.send('global_openFolder', msg), 
  writeClipboard: (msg: string) => ipcRenderer.send('global_writeClipboard', msg),
}

const BTAPI = {
  loadReCaptcha: (loadReCaptcha: (msg: string) => void) => ipcRenderer.on('BT_loadReCaptcha', (_event, msg) => loadReCaptcha(msg)),
  refreshLoginData: (loadData: () => void) => ipcRenderer.on('BT_refreshLoginData', _event => loadData()),
  loadImageCaptcha: (loadImage: () => void) => ipcRenderer.on('BT_loadIamgeCaptcha', _event => loadImage()),
  getAccountInfo: async (msg: string) => await ipcRenderer.invoke('BT_getAccountInfo', msg),
  checkLoginStatus: async (msg: string) => await ipcRenderer.invoke('BT_checkLoginStatus', msg),
  getBangumiTags: async (msg: string) => await ipcRenderer.invoke('BT_getBangumiTags', msg),
  searchBangumiTags: async (msg: string) => await ipcRenderer.invoke('BT_searchBangumiTags', msg),
  publish: async (msg: string) => await ipcRenderer.invoke('BT_publish', msg),
  getBTLinks: async (msg: string) => await ipcRenderer.invoke('BT_getBTLinks', msg), 
  loginAccount: (msg: string) => ipcRenderer.send('BT_loginAccount', msg),
  openLoginWindow: (msg: string) => ipcRenderer.send('BT_openLoginWindow', msg),
  saveAccountInfo: (msg: string) => ipcRenderer.send('BT_saveAccountInfo', msg),
  exportCookies: (msg: string) => ipcRenderer.send('BT_exportCookies', msg),
  importCookies: (msg: string) => ipcRenderer.send('BT_importCookies', msg),
  clearStorage: () => ipcRenderer.send('BT_clearStorage'),
}

const forumAPI = {
  getAccountInfo: async () => await ipcRenderer.invoke('forum_getAccountInfo'),
  searchPosts: async (msg: string) => await ipcRenderer.invoke("forum_searchPosts", msg),
  publish: async (msg: string) => await ipcRenderer.invoke('forum_publish', msg),
  rsPublish: async (msg: string) => await ipcRenderer.invoke('forum_rsPublish', msg),
  saveAccountInfo: (msg: string) => ipcRenderer.send('forum_saveAccountInfo', msg),
}

const taskAPI = {
  refreshTaskData: (loadData: () => void) => ipcRenderer.on('task_refreshTaskData', _event => loadData()),
  createTask: async (msg: string) => await ipcRenderer.invoke('task_createTask', msg),
  getTaskList: async () => await ipcRenderer.invoke('task_getTaskList'),
  getTaskType: async (msg: string) => await ipcRenderer.invoke('task_getTaskType', msg),
  getForumLink: async (msg: string) => await ipcRenderer.invoke('task_ getForumLink', msg),
  getContent: async (msg: string) => await ipcRenderer.invoke('task_getContent', msg),
  getPublishConfig: async (msg: string) => await ipcRenderer.invoke('task_getPublishConfig', msg),
  loadComparisons: () => ipcRenderer.invoke("task_loadComparisons"),
  saveConfig: async (msg: string) => await ipcRenderer.invoke('task_saveConfig', msg), 
  createConfig: async (msg: string) => await ipcRenderer.invoke('task_ createConfig', msg), 
  getForumConfig: async (msg: string) => await ipcRenderer.invoke('task_getForumConfig', msg),
  saveContent: (msg: string) => ipcRenderer.send('task_saveContent', msg),
  exportContent: (msg: string) => ipcRenderer.send('task_exportContent', msg),
  saveTitle: (msg: string) => ipcRenderer.send('task_saveTitle', msg),
  removeTask: (msg: string) => ipcRenderer.send('task_removeTask', msg),
  setTaskProcess: (msg: string) => ipcRenderer.send('task_setTaskProcess', msg),
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
contextBridge.exposeInMainWorld('globalAPI', globalAPI)
contextBridge.exposeInMainWorld('BTAPI', BTAPI)
contextBridge.exposeInMainWorld('forumAPI', forumAPI)
contextBridge.exposeInMainWorld('taskAPI', taskAPI)
