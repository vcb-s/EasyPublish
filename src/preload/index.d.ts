export interface IElectronAPI {
}

export interface GlobalAPI {
  winHandle: (msg: string) => void
  getProxyConfig: () => Promise<string>
  setProxyConfig: (config: string) => void
  getFilePath: (msg: string) => Promise<string>
  getFolderPath: () => Promise<string>
  openFolder: (msg: string) => void
  writeClipboard: (msg: string) => void
  readFileContent: () => Promise<string>
  html2markdown: (msg: string) => Promise<string>
  html2bbcode: (msg: string) => Promise<string>
}

export interface BTAPI {
  loadReCaptcha: (loadReCaptcha: Function) => void
  loadImageCaptcha: (loadImage: Function) => void
  loginAccount: (msg: string) => void
  checkLoginStatus: (msg: string) => Promise<string>
  openLoginWindow: (msg: string) => void
  refreshLoginData: (loadData: Function) => void
  saveAccountInfo: (msg: string) => void
  getAccountInfo: (msg: string) => Promise<string>
  importCookies: (msg: string) => void
  exportCookies: (msg: string) => void
  clearStorage: () => void
  publish: (msg: string) => Promise<string>
  getBangumiTags: (msg: string) => Promise<string>
  searchBangumiTags: (msg: string) => Promise<string>
  getBTLinks: (msg: string) => Promise<string>
  getTorrentList: () => Promise<string>
  getTorrentDetail: (msg: string) => Promise<string>
  updateTorrent: (msg: string) => Promise<string>
}

export interface ForumAPI {
  saveAccountInfo: (msg: string) => void
  getAccountInfo: () => Promise<string>
  searchPosts: (msg: string) => Promise<string>
  publish: (msg: string) => Promise<string>
  rsPublish: (msg: string) => Promise<string>
}

export interface TaskAPI {
  refreshTaskData: (loadData: Function) => void
  createTask: (msg: string) => Promise<string>
  getTaskList: () => Promise<string>
  removeTask: (msg: string) => void
  getTaskType: (msg: string) => Promise<string>
  setTaskProcess: (msg: string) => void
  getForumLink: (msg: string) => Promise<string>
  getContent: (msg: string) => Promise<string>
  saveContent: (msg: string) => void
  exportContent: (msg: string) => void
  saveTitle: (msg: string) => void
  getPublishStatus: (msg: string) => Promise<string>
  getPublishConfig: (msg: string) => Promise<string>
  loadComparisons: () => Promise<string>
  saveConfig: (msg: string) => Promise<string>
  createConfig: (msg: string) => Promise<string>
  getForumConfig: (msg: string) => Promise<string>
}

declare global {
  interface Window {
    globalAPI: GlobalAPI
    BTAPI: BTAPI
    forumAPI: ForumAPI
    taskAPI: TaskAPI
  }
}
