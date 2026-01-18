declare namespace Message {

  namespace Global {
    
    interface WinHandle {
      command: "close" | "mini" | "max"
    }

    type ProxyConfig = Config.ProxyConfig

    interface FileType {
      type: string
    }

    interface Path {
      path: string
    }

    interface Clipboard {
      str: string
    }

    interface FileContent {
      content: string
    }

    interface ConfigName {
      name: string
    }

  }

  namespace BT {

    interface ValidationType {
      type: 'nyaa' | 'acgnx_a' | 'acgnx_g'
    }

    interface TurnstilePosition {
      x: number
      y: number
    }

    type AcgnXAPIConfig = Config.AcgnXAPIConfig

    interface AccountType {
      type: string
    }

    interface ValidationInfo {
      type: string
      key?: string
      position?: TurnstilePosition
    }

    interface LoginStatus {
      status: string
    }

    interface AccountInfo {
      type: string
      time: string
      status: string
      username: string
      password: string
      enable: boolean
    }

    interface BangumiQuery {
      query: string
    }

    interface BangumiTags {
      status: number
      data: any
    }

    namespace TorrentDetail {

      interface Detail<T> {
        id: string
        url: string
        is_loaded: boolean
        content?: T
      }

      interface BangumiDetail extends Detail<BangumiContent> {}
      interface NyaaDetail extends Detail<NyaaContent> {}
      interface AcgripDetail extends Detail<AcgripContent> {}
      interface DmhyDetail extends Detail<DmhyContent> {}
      interface AcgnxDetail extends Detail<AcgnxContent> {}

      interface Content {
        content: string
      }

      interface BangumiContent extends Content {
        category_tag_id: string
        tag_ids: string[]
      }

      interface NyaaContent extends Content {
        category: string
        information: string
        is_complete: boolean
        is_remake: boolean
      }

      interface AcgripContent extends Content {
        series_id: string
        post_as_team: string
        category_id: string
      }

      interface DmhyContent extends Content {
        synckey: string
        sort_id: string
        poster_url: string
      }

      interface AcgnxContent extends Content {
        sort_id: string
        synckey: string
        discuss_url: string
        team_post: string
      }

      interface Details {
        title: string
        bangumi?: BangumiDetail
        nyaa?: NyaaDetail
        acgrip?: AcgripDetail
        dmhy?: DmhyDetail
        acgnx_a?: AcgnxDetail
        acgnx_g?: AcgnxDetail
      }
    }

    interface TorrentList {
      list: TorrentDetail.List[]
    }

    interface TorrentInfo {
      id: string
      type: string
    }

    interface UpdatedContent<T = TorrentDetail.Content>{
      title: string
      type: string
      id: string
      config: T
    }

  }

  namespace Forum {

    interface AccountInfo {
      username: string
      password: string
    }

    interface Posts {
      posts : {
        id: number
        title: string
        content: string
        raw: string
      }[]
    }

    interface Title {
      title: string
    }

    interface Contents {
      title?: string
      content?: string
      imagePath?: string
    }

    interface PublishConfig {
      id: number 
      title: string 
      content: string 
      imagePath: string 
      categories: string
    }

    interface RSConfig {
      id: number 
      rsID: number 
      title: string 
      content: string
    }

  }

  namespace Task {

    interface TaskConfig {
      path: string
      type: 'file' | 'template' | 'quick'
      name: string
    }

    type PublishConfig = Config.PublishConfig

    interface Result {
      result: string
    }

    interface TaskList {
      list: Config.Task[]
    }

    interface TaskID {
      id: number
    }

    interface TaskType {
      type: string
    }

    interface ForumLink {
      link: string | undefined
    }

    interface TaskStatus {
      id: number
      step: 'edit' | 'check' | 'bt_publish' | 'forum_publish' | 'finish'
    }

    interface TaskContents {
      html: string
      md: string
      bbcode: string
      title: string
    }

    interface ModifiedContent {
      id: number
      type: string
      content: string
    }

    interface ModifiedTitle {
      id: number
      title: string
    }

    interface ContentType {
      id: number
      type: string
    }

    interface PublishStatus {
      bangumi_all? :string
      bangumi?: string
      nyaa?: string
      dmhy?: string
      acgrip?: string
      acgnx_a?: string
      acgnx_g?: string
    }

    interface Comparisons {
      html: string
      md: string
      bbcode: string
    }

    interface ModifiedConfig {
      id: number
      type?: string
      config: Config.PublishConfig
    }

  }

  interface Message_TaskInfo {
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
}
