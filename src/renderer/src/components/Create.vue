<script setup lang="ts" name="Create">
    import { defineProps, onMounted, ref, reactive, computed } from "vue"
    import type { PublishConfig, Content_text } from '../index.d.ts'
    import { useRouter } from 'vue-router'
    import type { FormRules } from 'element-plus'

    const props = defineProps<{id: number}>()
    const router = useRouter()

    //设置参与制作者表单验证
    const checkMembers = (_rules, _value, callback) => {
        if (config.script != '' &&
        config.encode != '' &&
        config.collate != '' &&
        config.upload != ''
        ) {
            callback()
        }
        else
            callback(new Error('请填写参与制作者'))
    }
    //设置表单
    const loadCompleted = ref(false)
    const createForm_file = ref()
    const createForm_text = ref()
    const url_type = ref('html')
    const type = ref(true)
    interface ruleForm {
        type: "quick" | "file" | "text",
        name: string,
        torrent: string,
        Name_Ch: string,
        Name_En: string,
        Name_Jp: string,
        comment_Ch: string
        comment_En: string
        rs_version: number
        rs_comment_Ch: string
        rs_comment_En: string
        information: string,
        bit: string,
        resolution: string,
        encoding: string,
        torrent_type: string,
        pictures_md: string
        pictures_bbcode: string
        pictures_html: string
        nomination: boolean
        reseed: boolean
        nonsense: string
        note: string[],
        sub_Ch: string
        sub_En: string
        audio_Ch: string
        audio_En: string
        subTeam_Ch: string[]
        subTeam_En: string[]
        category_bangumi: string,
        category_nyaa: string,
        providers: string
        picture_path: string
        script: string
        encode: string
        collate: string
        upload: string
        tag: {label: string, value: string}[],
        path_md: string,
        path_html: string,
        path_bbcode: string, 
        title: string,
        completed?: boolean,
        remake?: boolean,
        mediaInfo?: string,
        imageCredit?: string,
        imageLinks?: string,
        imageSrc?: string,
        prefill: boolean
    }
    const config = reactive<ruleForm>({
        type: "quick",
        name: "",
        torrent: "",
        Name_Ch: "",
        Name_En: "",
        Name_Jp: "",
        information: '',
        bit: "",
        picture_path: '',
        nomination: false,
        reseed: false,
        resolution: "",
        encoding: "",
        comment_Ch: '',
        comment_En: '',
        script: '',
        encode: '',
        collate: '',
        upload: '',
        torrent_type: "",
        note: [],
        category_bangumi: "",
        category_nyaa: "",
        tag: [],
        path_md: '',
        path_html: '',
        path_bbcode: '',
        title: '',
        rs_version: 1,
        rs_comment_Ch: "",
        rs_comment_En: "",
        pictures_md: "",
        pictures_bbcode: "",
        pictures_html: "",
        nonsense: "",
        sub_Ch: "",
        sub_En: "",
        audio_Ch: "",
        audio_En: "",
        subTeam_Ch: [],
        subTeam_En: [],
        providers: "",
        mediaInfo: '',
        imageCredit: '',
        imageLinks: '',
        imageSrc: '',
        prefill: false
    })
    const rules = reactive<FormRules<ruleForm>>({
        Name_Ch: [{
            message: '请输入中文标题',
            trigger: 'change'
        }],
        Name_Jp: [{
            message: '请输入日语标题',
            trigger: 'change'
        }],
        Name_En: [{
            required: true,
            message: '请输入英文标题',
            trigger: 'change'
        }],
        bit: [{
            required: true,
            message: '请选择成片位深',
            trigger: 'change'
        }],
        resolution: [{
            required: true,
            message: '请选择成片分辨率',
            trigger: 'change'
        }],
        encoding: [{
            required: true,
            message: '请输选择成片编码格式',
            trigger: 'change'
        }],
        comment_Ch: [{
            required: true,
            message: '请填写总监吐槽',
            trigger: 'change'
        }],
        comment_En: [{
            required: true,
            message: '请填写总监吐槽',
            trigger: 'change'
        }],
        torrent_type: [{
            required: true,
            message: '请选择成片类型',
            trigger: 'change'
        }],
        category_bangumi: [{
            required: true,
            message: '请设置Bangumi分类',
            trigger: 'change'
        }],
        category_nyaa: [{
            required: true,
            message: '请设置Nyaa分类',
            trigger: 'change'
        }],
        picture_path: [{
            required: true,
            message: '选择海报图',
            trigger: 'change'
        }],
        information: [{
            required: false,
            message: '请填写Nyaa Information，默认https://vcb-s.com/archives/138',
            trigger: 'change'
        }],
        script: [{
            required: true,
            validator: checkMembers,
            trigger: 'blur'
        }],
        path_md: [{
            message: '请选择Nyaa描述文件',
            trigger: 'change'
        }],
        path_bbcode: [{
            message: '请选择Acgrip描述文件',
            trigger: 'change'
        }],
        path_html: [{
            required: true,
            message: '请选择Bangumi描述文件',
            trigger: 'change'
        }],
        torrent: [{
            required: true,
            message: '请选择种子文件',
            trigger: 'change'
        }],
        title: [{
            required: true,
            message: '请填写标题',
            trigger: 'change'
        },{
            max: 128, 
            message: '长度不得超过128', 
            trigger: 'change'
        }],
    })
    //设置位深
    const bitOptions = ref([
        {
            label: '10-bit',
            value: '10-bit'
        },
        {
            label: '8-bit',
            value: '8-bit'
        }
    ])
    //设置分辨率
    const resolutionOptions = ref([
        {
            label: '1080p',
            value: '1080p'
        },
        {
            label: '720p',
            value: '720p'
        },
        {
            label: '2160p',
            value: '2160p'
        }
    ])
    //设置编码
    const encodingOptions = ref([
        {
            label: 'AVC',
            value: 'AVC'
        },
        {
            label: 'HEVC',
            value: 'HEVC'
        },
        {
            label: 'AVC/HEVC',
            value: 'AVC/HEVC'
        }
    ])
    //设置类型
    const typeOptions = ref([
        {
            label: 'BDRip',
            value: 'BDRip'
        },
        {
            label: 'DVDRip',
            value: 'DVDRip'
        }
    ])
    //设置内容量
    const noteOptions = ref([
        {
            label: 'S1',
            value: 'S1'
        },
        {
            label: 'S2',
            value: 'S2'
        },
        {
            label: 'S1-S3',
            value: 'S1-S3'
        },
        {
            label: 'OVA',
            value: 'OVA'
        },
        {
            label: 'OVAs',
            value: 'OVAs'
        },
        {
            label: 'MOVIE',
            value: 'MOVIE'
        },
        {
            label: 'LIVE',
            value: 'LIVE'
        }
    ])
    //设置字幕信息
    const subOptions = ref([
        {
            label: 'ENG',
            value: 'ENG'
        },
        {
            label: 'JPN',
            value: 'JPN'
        },
        {
            label: 'CHN',
            value: 'CHN'
        }
    ])
    const subInfo = ref<string[]>([])
    const subText = ref<string>('')
    function onChangeSubInfo() {
        let sub = ''
        subInfo.value.forEach(item => {
            sub += item + ' + '
        })
        if (subInfo.value.length > 0){
            sub = sub.slice(0, -3)
            subText.value = '内封原盘 ' + sub + ' 字幕。\nEmbedded official ' + sub + ' PGS.'
        }
        else
            subText.value = ''
        onChangeSubText()
    }
    function onChangeSubText() {
        if (subText.value != '') {
            let value = subText.value.split('\n')
            config.sub_Ch = value[0]
            config.sub_En = value[1]
        }
        else {
            config.sub_Ch = ''
            config.sub_En = ''
        }
    }
    //设置音轨信息
    const audioOptions = ref([
        {
            label: '部分剧集内封评论音轨',
            value: 1
        },
        {
            label: '内封评论音轨',
            value: 2
        },
        {
            label: '外挂 FLAC 5.1',
            value: 3
        },
        {
            label: '外挂 Headphone X',
            value: 4
        },
        {
            label: '外挂评论音轨',
            value: 5
        },
        {
            label: '外挂无障碍音轨',
            value: 6
        }
    ])
    const audioInfo = ref<number[]>([])
    const audioText = ref<string>('')
    function onChangeAudioInfo() {
        let audio_in_E = ''
        let audio_in_C = ''
        let audio_out_C = ''
        let audio_out_E = ''
        audioInfo.value.forEach(item => {
            if (item == 1) {
                audio_in_C = '部分剧集内封评论音轨。'
                audio_in_E = 'Certain episodes contain commentary tracks. '
            }
            if (item == 2) {
                audio_in_C = '内封评论音轨。'
                audio_in_E = 'Embedded commentary track. '
            }
            if (item == 3) {
                audio_out_C += 'FLAC 5.1' + ' + '
                audio_out_E += 'FLAC 5.1' + ' + '
            }
            if (item == 4) {
                audio_out_C += 'Headphone X' + ' + '
                audio_out_E += 'Headphone X' + ' + '
            }
            if (item == 5) {
                audio_out_C += '评论音轨' + ' + '
                audio_out_E += 'commentary tracks' + ' + '
            }
            if (item == 5) {
                audio_out_C += '无障碍音轨' + ' + '
                audio_out_E += 'audio description' + ' + '
            }
        })
        if (audio_out_C != ''){
            audio_out_C = '外挂 ' + audio_out_C.slice(0, -3)
            audio_out_E = 'MKA contains ' + audio_out_E.slice(0, -3)
            audioText.value = `${audio_in_C}${audio_out_C} 。\n${audio_in_E}${audio_out_E}.`
        }
        else
            audioText.value = `${audio_in_C}\n${audio_in_E}`
        onChangeAudioText()
    }
    function onChangeAudioText() {
        if (audioText.value != '') {
            let value = audioText.value.split('\n')
            config.audio_Ch = value[0]
            config.audio_En = value[1]
        }
        else {
            config.audio_Ch = ''
            config.audio_En = ''
        }
    }
    //设置字幕组
    const subTeamOptions = ref([
        {
            label: '千夏字幕组/Airota',
            value: '千夏字幕组/Airota'
        },
        {
            label: '喵萌奶茶屋/Nekomoe kissaten',
            value: '喵萌奶茶屋/Nekomoe kissaten'
        },
        {
            label: '悠哈璃羽字幕社/UHA-WINGS',
            value: '悠哈璃羽字幕社/UHA-WINGS'
        },
        {
            label: '诸神字幕组/Kamigami',
            value: '诸神字幕组/Kamigami'
        },
        {
            label: '天香字幕社/T.H.X',
            value: '天香字幕社/T.H.X'
        },
        {
            label: '动漫国字幕组/DMG',
            value: '动漫国字幕组/DMG'
        },
        {
            label: '星空字幕组/XKsub',
            value: '星空字幕组/XKsub'
        },
        {
            label: '茉语星梦/MakariHoshiyume',
            value: '茉语星梦/MakariHoshiyume'
        },
        {
            label: '风之圣殿/FZSD',
            value: '风之圣殿/FZSD'
        },
        {
            label: '白恋字幕组/Shirokoi',
            value: '白恋字幕组/Shirokoi'
        },
        {
            label: 'SweetSub/SweetSub',
            value: 'SweetSub/SweetSub'
        },
        {
            label: 'LoliHouse/LoliHouse',
            value: 'LoliHouse/LoliHouse'
        },
        {
            label: '豌豆字幕组/BeanSub',
            value: '豌豆字幕组/BeanSub'
        },
        {
            label: '澄空学园/SumiSora',
            value: '澄空学园/SumiSora'
        },
        {
            label: '北宇治字幕组/KitaujiSub',
            value: '北宇治字幕组/KitaujiSub'
        }
    ])
    const subTeamInfo = ref<string[]>([])
    function onChangeSubTeam() {
        config.subTeam_Ch = []
        config.subTeam_En = []
        subTeamInfo.value.forEach(item => {
            let value = item.split('/')
            config.subTeam_Ch!.push(value[0])
            config.subTeam_En!.push(value[1])
        })
        getBangumiTags()
    }
    //设置Bangumi分类
    const BangumiOptions = [
        {
            label: '合集',
            value: '54967e14ff43b99e284d0bf7'
        },
        {
            label: '剧场版',
            value: '549cc9369310bc7d04cddf9f'
        },
        {
            label: '动画',
            value: '549ef207fe682f7549f1ea90'
        },
        {
            label: '其他',
            value: '549ef250fe682f7549f1ea91'
        },
    ]
    //设置Nyaa分类
    const NyaaOptions = [
        {
            label: 'Anime - English-translated',
            value: '1_2'
        },
        {
            label: 'Anime - Non-English-translated',
            value: '1_3'
        },
        {
            label: 'Anime - Raw',
            value: '1_4'
        },
        {
            label: 'Live Action - English-translated',
            value: '4_1'
        },
        {
            label: 'Live Action - Non-English-translated',
            value: '4_3'
        },
        {
            label: 'Live Action - Raw',
            value: '4_4'
        },
    ]
    //设置Bangumi标签
    const remoteSearchEnable = ref(true)
    const isSearching = ref(false)
    type TagOptions = {
        label: string
        value: {
            label: string
            value: string
        }
    }
    let suggestedBangumiTags = ref<TagOptions[]>([])
    let inputBangumiTags = ref<TagOptions[]>([])
    const BangumiTags = computed(() => {
        return suggestedBangumiTags.value.concat(inputBangumiTags.value)
    })
    async function getBangumiTags() {
        if (!remoteSearchEnable.value) 
            return
        let title = generateTitle()
        const {data, status} = await window.api.GetBangumiTags(type.value ? config.title : title)
        if (status == 200) {
            suggestedBangumiTags.value = []
            for (let item of data) {
                if (item.type != 'misc') 
                    suggestedBangumiTags.value.push({label: item.name, value: {label: item.name ,value: item._id}})
            }
        }
        else if (status == 0) {
            ElMessage.error('请求Bangumi标签建议错误，错误信息详见日志')
        } 
        else {
            ElMessage.error(`获取Bangumi标签建议失败，错误代码:${status}`)
        }
    }
    const searchBangumiTags = async (query: string) =>{
        if (!remoteSearchEnable.value) 
            return
        const {data, status} = await window.api.SearchBangumiTags(query)
        if (status == 200) {
            inputBangumiTags.value = []
            if (data.success) {
                for (const item of data.tag) {
                    if (item.type != 'misc') inputBangumiTags.value.push({label: item.name, value: {label: item.name ,value: item._id}})
                }
            }
        } 
        else if (status == 0) {
            ElMessage.error('请求Bangumi标签建议错误，错误信息详见日志')
        } 
        else {
            ElMessage.error(`获取Bangumi标签建议失败，错误代码:${status}`)
        }
    }

    //打开文件
    const isLoading = ref(false)
    async function loadFile(type: string) {
        isLoading.value = true
        const file = await window.api.OpenFile(type)
        if (type == 'torrent') config.torrent = file
        else if (type == 'md') config.path_md = file
        else if (type == 'html') config.path_html = file
        else if (type == 'bbcode') config.path_bbcode = file
        else if (type == 'webp') config.imageSrc = file
        isLoading.value = false
    }

    //生成标题
    function generateTitle() {
        let team = '', note = ''
        if (config.subTeam_Ch)
            config.subTeam_Ch.forEach(item => { team += item + '&' })
        team += 'VCB-Studio'
        if (config.note)
            config.note.forEach(item => { note += item + ' + ' })
        if (note != '')
            note = note.slice(0, -2)
        if (config.reseed)
            note += `Reseed${config.rs_version > 1 ? ` v${config.rs_version}` : ''} Fin`
        else
            note += 'Fin'
        let title = `[${team}] `
        if (config.Name_Ch != '') 
            title += config.Name_Ch.trim() + ' / '
        title += config.Name_En.trim() + ' '
        if (config.Name_Jp != '') 
            title += '/ ' + config.Name_Jp.trim() + ' '
        title += `${config.bit} ${config.resolution} ${config.encoding} ${config.torrent_type} [${note}]` 
        if (title.length > 128)
            title = `[${team}] ${config.Name_Ch == '' ? '' : config.Name_Ch.trim() + ' / '}${config.Name_En.trim()}` 
                    + ` ${config.bit} ${config.resolution} ${config.encoding} ${config.torrent_type} [${note}]`
        if (title.length > 128)
            title = `[${team}] ${config.Name_En.trim()} ${config.bit} ${config.resolution} ` 
                    + `${config.encoding} ${config.torrent_type} [${note}]`
        return title
    }
    //生成发布配置
    async function generateConfig() {
        if (type.value) {
            let publishConfig: PublishConfig = {
                type: config.type,
                name: '',
                torrent: config.torrent,
                information: config.information,
                category_bangumi: config.category_bangumi,
                category_nyaa: config.category_nyaa,
                tag: config.tag,
                completed: config.completed,
                remake: config.remake,
                title: config.title,
                content: {
                    path_md: config.path_md,
                    path_html: config.path_html,
                    path_bbcode: config.path_bbcode,
                }
            }
            return publishConfig
        }
        else {
            if (!config.prefill) {
                config.imageCredit = ''
                config.imageLinks = ''
                config.imageSrc = ''
                config.mediaInfo = ''
            }
            let publishConfig: PublishConfig = {
                type: 'text',
                name: '',
                torrent: config.torrent,
                information: config.information.trim(),
                category_bangumi: config.category_bangumi,
                category_nyaa: config.category_nyaa,
                tag: config.tag,
                completed: config.completed,
                remake: config.remake,
                title: generateTitle(),
                content: {
                    Name_Ch: config.Name_Ch.trim(),
                    Name_En: config.Name_En.trim(),
                    Name_Jp: config.Name_Jp.trim(),
                    bit: config.bit,
                    resolution: config.resolution,
                    encoding: config.encoding,
                    torrent_type: config.torrent_type,
                    reseed: config.reseed,
                    nomination: config.nomination,
                    note: config.note,
                    sub_Ch: config.sub_Ch.trim(),
                    sub_En: config.sub_En.trim(),
                    audio_Ch: config.audio_Ch.trim(),
                    audio_En: config.audio_En.trim(),
                    comment_Ch: config.comment_Ch.trim(),
                    comment_En: config.comment_En.trim(),
                    rs_version: config.rs_version,
                    rs_comment_Ch: config.rs_comment_Ch.trim(),
                    rs_comment_En: config.rs_comment_En.trim(),
                    subTeam_Ch: config.subTeam_Ch,
                    subTeam_En: config.subTeam_En,
                    nonsense: config.nonsense.trim(),
                    members: {
                        script: config.script,
                        encode: config.encode,
                        collate: config.collate,
                        upload: config.upload
                    },
                    providers: config.providers.trim(),
                    pictures_html: config.pictures_html,
                    pictures_md: config.pictures_md,
                    pictures_bbcode: config.pictures_bbcode,
                    picture_path: config.picture_path,
                    mediaInfo: config.mediaInfo,
                    imageCredit: config.imageCredit,
                    imageLinks: config.imageLinks,
                    imageSrc: config.imageSrc,
                    prefill: config.prefill
                }
            }
            return publishConfig
        }
    }

    //创建
    const isCreating = ref(false)
    async function createWithFile() {
        let formEl = createForm_file.value
        if (!formEl) return
        isCreating.value = true
        await formEl.validate(async (valid, _fields) => {
            if (valid) {
                let publishConfig: PublishConfig = await generateConfig()
                let result = await window.api.CreateWithFile(props.id, JSON.stringify(publishConfig))
                if (result.includes("success")) {
                    ElMessage({
                        message: '创建成功，即将跳转',
                        type: 'success',
                        plain: true,
                    })
                    setTimeout(() => {
                        router.push({
                            name: config.name == 'file' ? 'check' : 'publish',
                            params: { id: props.id }
                        })
                    }, 500);
                } 
                else if (result == "noSuchFile_md") {
                    ElMessage.error("未找到md文件")
                } 
                else if (result == "noSuchFile_html") {
                    ElMessage.error("未找到html文件")
                } 
                else if (result == "noSuchFile_bbcode") {
                    ElMessage.error("未找到bbcode文件")
                }
                else if (result == "noSuchFile_torrent") {
                    ElMessage.error("未找到种子文件")
                }
                else if (result == "taskNotFound") {
                    ElMessage.error("未找到任务")
                }
                else {
                    ElMessage.error(result)
                }
            } else {
                ElMessage.error('请正确填写任务配置')
            }
        })
        isCreating.value = false
    }
    async function createWithText() {
        let formEl = createForm_text.value
        if (!formEl) return
        isCreating.value = true
        await formEl.validate(async (valid, _fields) => {
            if (valid) {
                let publishConfig: PublishConfig = await generateConfig()
                let result = await window.api.CreateWithText(props.id, JSON.stringify(publishConfig))
                if (result.includes("success")) {
                    ElMessage({
                        message: '创建成功，即将跳转',
                        type: 'success',
                        plain: true,
                    })
                    setTimeout(() => {
                        router.push({
                            name: 'check',
                            params: { id: props.id }
                        })
                    }, 500);
                } 
                else if (result == "taskNotFound") {
                    ElMessage.error("未找到任务")
                }
                else if (result == "noSuchFile_torrent") {
                    ElMessage.error("未找到种子文件")
                }
                else {
                    ElMessage.error(result)
                }
            }else {
                ElMessage.error('请正确填写任务配置')
            }
            isCreating.value = false
        })
    }

    //保存
    const isSaving = ref(false)
    async function saveWithFile() {
        isSaving.value = true
        let publishConfig: PublishConfig = await generateConfig()
        let result = await window.api.SaveContent(props.id, JSON.stringify(publishConfig))
        if (result.includes("success")) {
            ElMessage({
                message: '保存成功',
                type: 'success',
                plain: true,
            })
        } 
        else if (result == 'taskNotFound') {
            ElMessage.error('未找到任务')
        }
        else {
            ElMessage.error(result)
        }
        isSaving.value = false
    }
    async function saveWithText() {
        isSaving.value = true
        let publishConfig: PublishConfig = await generateConfig()
        let result = await window.api.SaveContent(props.id, JSON.stringify(publishConfig))
        if (result.includes("success")) {
            ElMessage({
                message: '保存成功',
                type: 'success',
                plain: true,
            })
        } 
        else if (result == 'taskNotFound') {
            ElMessage.error('未找到任务')
        }
        else {
            ElMessage.error(result)
        }
        isSaving.value = false
    }

    //从url.txt加载对比图
    async function loadFromTxt() {
        let result = await window.api.LoadFromTxt()
        config.pictures_html = result[0]
        config.pictures_md = result[1]
        config.pictures_bbcode = result[2]
    }
    
    //设置滚动条区域高度
    const slbHeight = ref('')
    const clientHeight = ref(0)
    function setHeight() {
        clientHeight.value =  document.documentElement.clientHeight;
        slbHeight.value = clientHeight.value - 117 + 'px';
    }
    function setscrollbar() {
        setHeight()
        window.onresize = setHeight
    }

    //保存和创建
    async function save() {
        if (type.value)
            saveWithFile()
        else 
            saveWithText()
    }
    async function create() {
        if (type.value)
            createWithFile()
        else
            createWithText()
    }

    //获取任务信息
    async function getTaskInfo() {
        const result = await window.api.OpenTask(props.id)
        if (result.status == 'notFound'){
            await ElMessageBox.alert('    未找到任务')
            router.push('/')
        }else if (result.status == 'folderNotFound'){
            await ElMessageBox.alert('    未找到任务目录')
            router.push('/')
        }else{
            Object.assign(config, result.config, result.config!.content)
            type.value = !(result.status == 'text')
            config.tag.map((val) => {
                BangumiTags.value.push({label: val.label, value: val})
            })
            if (!type.value) {
                Object.assign(config, (result.config!.content as Content_text).members)
                if (config.sub_Ch != '' && config.sub_En != '')
                    subText.value = `${config.sub_Ch}\n${config.sub_En}`
                if (config.audio_Ch != '' && config.audio_En != '')
                    audioText.value = `${config.audio_Ch}\n${config.audio_En}`
                if (config.subTeam_Ch && config.subTeam_En){
                    for (let i = 0; i < config.subTeam_Ch.length; i++)
                        subTeamInfo.value.push(`${config.subTeam_Ch[i]}/${config.subTeam_En[i]}`)
                }
            }
        }
    }

    onMounted(async () => {
        setscrollbar()
        await getTaskInfo()
        loadCompleted.value = true
    })
    
</script>

<template>
    <div v-if="loadCompleted" :style="{height: slbHeight}">
        <el-scrollbar style="height: 100%;">
            <el-row>
                <el-col :span="3" />
                <el-col :span="18">
                    <span style="float: right">
                        <el-link :underline="false" @click="create" type="primary">下一步<el-icon><ArrowRight /></el-icon></el-link>
                    </span>
                </el-col>
                <el-col :span="3" />
            </el-row>
            <el-row style="height: 20px;" />
            <el-row style="font-size: xx-large; height: 43px;">
                <el-col :span="3" />
                <el-col :span="18">
                    编辑发布配置
                </el-col>
                <el-col :span="3" />
            </el-row>
            <el-row style="height: 20px;" />
            <el-row justify="space-between">
                <el-col :span="3" />
                <el-col :span="18">
                    <div v-if="!type">
                        <!-- 从模板创建 -->
                        <el-form ref="createForm_text" :model="config" label-width="auto" style="max-width: 1050px;" :rules="rules">
                            <el-form-item label="中文标题" prop="Name_Ch">
                                <el-input v-model="config.Name_Ch" placeholder="请填写中文标题" />
                            </el-form-item>
                            <el-form-item label="英文标题" prop="Name_En">
                                <el-input v-model="config.Name_En" placeholder="请填写英文标题" />
                            </el-form-item>
                            <el-form-item label="日语标题" prop="Name_Jp">
                                <el-input v-model="config.Name_Jp" placeholder="请填写日语标题" />
                            </el-form-item>
                            <el-form-item label="海报图链接" prop="picture_path">
                                <el-input placeholder="请填写海报图链接" v-model="config.picture_path">
                                </el-input>
                            </el-form-item>
                            <el-form-item label="内容量">
                                <el-select-v2
                                    v-model="config.note" placeholder="请填写内容量，无需标注可留空"
                                    multiple filterable allow-create default-first-option
                                    :options="noteOptions" :reserve-keyword="false" style="width: 600px"
                                    />
                            </el-form-item>
                            <el-form-item label="位深" prop="bit">
                                <el-select-v2 v-model="config.bit" :options="bitOptions" :reserve-keyword="false" 
                                placeholder="请填写位深" style="width: 150px" filterable allow-create />
                            </el-form-item>
                            <el-form-item label="分辨率" prop="resolution">
                                <el-select-v2 v-model="config.resolution" :options="resolutionOptions" :reserve-keyword="false" 
                                placeholder="请填写分辨率" style="width: 150px" filterable allow-create />
                            </el-form-item>
                            <el-form-item label="编码" prop="encoding">
                                <el-select-v2 v-model="config.encoding" :options="encodingOptions" :reserve-keyword="false" 
                                placeholder="请填写编码" style="width: 150px" filterable allow-create />
                            </el-form-item>
                            <el-form-item label="类型" prop="torrent_type">
                                <el-select-v2 v-model="config.torrent_type" :options="typeOptions" :reserve-keyword="false" 
                                placeholder="请填写类型" style="width: 150px" filterable allow-create />
                            </el-form-item>
                            <el-form-item label="提名情况">
                                <el-checkbox label="组员提名项目" v-model="config.nomination" border />
                            </el-form-item>
                            <el-form-item label="字幕信息">
                                <el-select-v2
                                    v-model="subInfo" placeholder="请选择内封字幕信息，没有可留空"
                                    multiple filterable allow-create :options="subOptions"
                                    :reserve-keyword="false" style="width: 600px"
                                    @change="onChangeSubInfo"
                                    />
                                <el-input v-model="subText" :rows="2" type="textarea" style="width: 600px; margin-top: 10px;" 
                                @blur="onChangeSubText" placeholder="无" resize="none"/>
                            </el-form-item>
                            <el-form-item label="音轨信息">
                                <el-select-v2
                                    v-model="audioInfo" placeholder="请选择内封和外挂音轨信息，没有可留空"
                                    multiple filterable :options="audioOptions"
                                    :reserve-keyword="false" style="width: 600px"
                                    @change="onChangeAudioInfo"
                                    />
                                <el-input v-model="audioText" :rows="2" type="textarea" style="width: 600px; margin-top: 10px;" 
                                @blur="onChangeAudioText" placeholder="无" resize="none"/>
                            </el-form-item>
                            <el-form-item label="合作字幕组">
                                <el-select-v2
                                    v-model="subTeamInfo" placeholder="请填写合作字幕组，没有可留空"
                                    multiple filterable allow-create :options="subTeamOptions"
                                    :reserve-keyword="false" style="width: 600px" @change="onChangeSubTeam"
                                    />
                            </el-form-item>
                            <el-form-item label="中文吐槽" prop="comment_Ch">
                                <el-input v-model="config.comment_Ch" :autosize="{minRows: 2}" type="textarea" :placeholder="'画质 XXXXXX...\n处理上 XXXXXX...'" />
                            </el-form-item>
                            <el-form-item label="英文吐槽" prop="comment_En">
                                <el-input v-model="config.comment_En" :autosize="{minRows: 2}" type="textarea" :placeholder="'This BD ......\nPP: XXXX, XXXX, ...'" />
                            </el-form-item>
                            <el-form-item label="发布吐槽">
                                <el-input v-model="config.nonsense" :autosize="{minRows: 2}" type="textarea" :placeholder="'好想看到会动的瑠衣酱 XXXXXXXXX ...'" />
                            </el-form-item>
                            <el-form-item label="RS选项">
                                <el-checkbox label="该项目为Reseed项目" v-model="config.reseed" />
                            </el-form-item>
                            <el-form-item label="主站预填写">
                                <el-checkbox label="预填写主站MediaInfo、发布图和署名" v-model="config.prefill" />
                            </el-form-item>
                            <el-form-item v-if="config.reseed" label="RS版本">
                                <el-input-number v-model="config.rs_version" />
                            </el-form-item>
                            <el-form-item v-if="config.reseed" label="中文修正" :rules="{required: config.reseed, message: '请填写重发修正', trigger: 'change'}">
                                <el-input v-model="config.rs_comment_Ch" type="textarea" :autosize="{minRows: 2}" :placeholder="'1. XXXXXX；\n2. XXXXXX。'" />
                            </el-form-item>
                            <el-form-item v-if="config.reseed" label="英文修正" :rules="{required: config.reseed, message: '请填写重发修正', trigger: 'change'}">
                                <el-input v-model="config.rs_comment_En" type="textarea" :autosize="{minRows: 2}" :placeholder="'1. XXXXXX;\n2. XXXXXX.'" />
                            </el-form-item>
                            <el-form-item v-if="config.prefill" label="发布图署名">
                                <el-input v-model="config.imageCredit" placeholder="填写Image Credit" style="width:200px" />
                            </el-form-item>
                            <el-form-item v-if="config.prefill" label="原图链接">
                                <el-input v-model="config.imageLinks" placeholder="填写Credit链接" />
                            </el-form-item>
                            <el-form-item v-if="config.prefill" label="发布图链接">
                                <el-input v-model="config.imageSrc" placeholder="填写发布图链接">
                                    <template #append>
                                        <el-button @click="loadFile('webp')" v-loading.fullscreen.lock="isLoading">
                                            <el-icon><FolderOpened /></el-icon>
                                        </el-button>
                                    </template>
                                </el-input>
                            </el-form-item>
                            <el-form-item v-if="config.prefill" label="MediaInfo">
                                <el-input v-model="config.mediaInfo" type="textarea" :autosize="{minRows: 10}" placeholder="填写MediaInfo" />
                            </el-form-item>
                            <el-form-item label="参与制作" prop="script">
                                <el-row>
                                    <span style="margin-right: 6px;">
                                    <div>总监</div>
                                    <el-input v-model="config.script" style="width: 140px;" :placeholder="'总监'" />
                                    </span>
                                    <span style="margin-right: 6px;">
                                    <div>压制</div>
                                    <el-input v-model="config.encode" style="width: 140px;" :placeholder="'压制'" /></span>
                                    <span style="margin-right: 6px;">
                                    <div>整理</div>
                                    <el-input v-model="config.collate" style="width: 140px;" :placeholder="'整理'" /></span>
                                    <span style="margin-right: 6px;">
                                    <div>发布</div>
                                    <el-input v-model="config.upload" style="width: 140px;" :placeholder="'发布'" /></span>
                                </el-row>
                            </el-form-item>
                            <el-form-item label="资源提供者">
                                <el-input v-model="config.providers" type="textarea" :autosize="{minRows: 3}" 
                                :placeholder="'BD: XXXX@XXXX...\nSCAN: XXXX@XXXX...\nCD: XXXX@XXXX...'" />
                            </el-form-item>
                            <div v-if="!config.reseed" style="margin-bottom: 20px;">
                                <span style="margin-left: 123px;">
                                    <el-radio-group v-model="url_type">
                                        <el-radio-button label="Html" value="html" />
                                        <el-radio-button label="Markdown" value="md" />
                                        <el-radio-button label="BBCode" value="bbcode" />
                                    </el-radio-group>
                                </span>
                                <span>
                                    <el-button style="float: right;text-align: right;" @click="loadFromTxt">
                                        从url.txt加载<el-icon><Upload /></el-icon>
                                    </el-button>
                                </span>
                            </div>
                            <el-form-item v-if="!config.reseed && url_type == 'html'" label="对比图"
                            :rules="{required: !config.reseed, message: '请填写对比图html部分', trigger: 'change'}">
                                <el-input v-model="config.pictures_html" type="textarea" :autosize="{minRows: 10}" 
                                :placeholder="'<p>Comparison (right click on the image and open it in a new tab to see the full-size one)<br/>........'" />
                            </el-form-item>
                            <el-form-item v-if="!config.reseed && url_type == 'md'" label="对比图" 
                            :rules="{required: !config.reseed, message: '请填写对比图markdown部分', trigger: 'change'}">
                                <el-input v-model="config.pictures_md" type="textarea" :autosize="{minRows: 10}" 
                                :placeholder="'Comparison (right click on the image and open it in a new tab to see the full-size one)........'" />
                            </el-form-item>
                            <el-form-item v-if="!config.reseed && url_type == 'bbcode'" label="对比图"
                            :rules="{required: !config.reseed, message: '请填写对比图bbcode部分', trigger: 'change'}">
                                <el-input v-model="config.pictures_bbcode" type="textarea" :autosize="{minRows: 10}" 
                                :placeholder="'Comparison (right click on the image and open it in a new tab to see the full-size one)........'" />
                            </el-form-item>
                            <el-form-item label="种子文件路径" prop="torrent">
                                <el-input placeholder="选择一个文件" v-model="config.torrent">
                                    <template #append>
                                        <el-button @click="loadFile('torrent')" v-loading.fullscreen.lock="isLoading">
                                            <el-icon><FolderOpened /></el-icon>
                                        </el-button>
                                    </template>
                                </el-input>
                            </el-form-item>
                            <el-form-item label="远程搜索">
                                <el-switch v-model="remoteSearchEnable" active-text="启用" inactive-text="关闭" />
                            </el-form-item>
                            <el-form-item label="Bangumi标签">
                                <el-select-v2
                                    v-model="config.tag" value-key="value" placeholder="请选择或添加Bangumi标签"
                                    multiple filterable remote reserve-keyword style="width: 750px" :options="BangumiTags"
                                    :remote-method="searchBangumiTags" :loading="isSearching" @focus="getBangumiTags"
                                />
                            </el-form-item>
                            <el-form-item label="Bangumi分类" prop="category_bangumi">
                                <el-select-v2 v-model="config.category_bangumi" :options="BangumiOptions" placeholder="选择一个分类" style="width: 240px" />
                            </el-form-item>
                            <el-form-item label="Nyaa Info" prop="information">
                                <el-input v-model="config.information" placeholder="https://vcb-s.com/archives/138"/>
                            </el-form-item>
                            <el-form-item label="Nyaa分类" prop="category_nyaa">
                                <el-select-v2 v-model="config.category_nyaa" :options="NyaaOptions" placeholder="选择一个分类" style="width: 240px" />
                            </el-form-item>
                            <el-form-item label="Nyaa配置项">
                                <el-checkbox label="Complete" v-model="config.completed" border />
                                <el-checkbox label="Remake" v-model="config.remake" border />
                            </el-form-item>
                        </el-form>
                    </div>
                    <div v-else>
                        <!-- 从文件创建 -->
                        <el-form ref="createForm_file" :model="config" label-width="auto" style="max-width: 1050px;" :rules="rules">
                            <el-form-item label="标题" prop="title">
                                <el-input v-model="config.title" placeholder="请填写标题"/>
                            </el-form-item>
                            <el-form-item label="种子文件路径" prop="torrent">
                                <el-input placeholder="选择一个文件" v-model="config.torrent">
                                    <template #append>
                                        <el-button @click="loadFile('torrent')" v-loading.fullscreen.lock="isLoading">
                                            <el-icon><FolderOpened /></el-icon>
                                        </el-button>
                                    </template>
                                </el-input>
                            </el-form-item>
                            <el-form-item label="html文件路径" prop="path_html">
                                <el-input placeholder="选择一个文件" v-model="config.path_html">
                                    <template #append>
                                        <el-button @click="loadFile('html')" v-loading.fullscreen.lock="isLoading">
                                            <el-icon><FolderOpened /></el-icon>
                                        </el-button>
                                    </template>
                                </el-input>
                            </el-form-item>
                            <el-form-item label="md文件路径" prop="path_md">
                                <el-input placeholder="选择一个文件" v-model="config.path_md">
                                    <template #append>
                                        <el-button @click="loadFile('md')" v-loading.fullscreen.lock="isLoading">
                                            <el-icon><FolderOpened /></el-icon>
                                        </el-button>
                                    </template>
                                </el-input>
                            </el-form-item>
                            <el-form-item label="bbcode文件路径" prop="path_bbcode">
                                <el-input placeholder="选择一个文件" v-model="config.path_bbcode">
                                    <template #append>
                                        <el-button @click="loadFile('bbcode')" v-loading.fullscreen.lock="isLoading">
                                            <el-icon><FolderOpened /></el-icon>
                                        </el-button>
                                    </template>
                                </el-input>
                            </el-form-item>
                            <el-form-item label="远程搜索">
                                <el-switch v-model="remoteSearchEnable" active-text="启用" inactive-text="关闭" />
                            </el-form-item>
                            <el-form-item label="Bangumi标签">
                                <el-select-v2
                                    v-model="config.tag" value-key="label" placeholder="请选择或添加Bangumi标签"
                                    multiple filterable remote reserve-keyword style="width: 750px" :options="BangumiTags"
                                    :remote-method="searchBangumiTags" :loading="isSearching" @focus="getBangumiTags"
                                />
                            </el-form-item>
                            <el-form-item label="Bangumi分类" prop="category_bangumi">
                                <el-select-v2 v-model="config.category_bangumi" :options="BangumiOptions" placeholder="选择一个分类" style="width: 240px" />
                            </el-form-item>
                            <el-form-item label="Nyaa Info" prop="information">
                                <el-input v-model="config.information" placeholder="https://vcb-s.com/archives/138"/>
                            </el-form-item>
                            <el-form-item label="Nyaa分类" prop="category_nyaa">
                                <el-select-v2 v-model="config.category_nyaa" :options="NyaaOptions" placeholder="选择一个分类" style="width: 240px" />
                            </el-form-item>
                            <el-form-item label="Nyaa配置项">
                                <el-checkbox label="Complete" v-model="config.completed" border />
                                <el-checkbox label="Remake" v-model="config.remake" border />
                            </el-form-item>
                        </el-form>
                    </div>
                </el-col>
                <el-col :span="3" />
            </el-row>
            <el-row class="title">
                <el-col>
                    <el-button class="btn" :loading="isSaving" @click="save()" type="primary" plain>
                        保存
                    </el-button>
                    <el-button class="btn" :loading="isCreating" @click="create()" type="primary">
                        下一步
                    </el-button>  
                </el-col>  
            </el-row>
            <el-row style="height: 20px;" />
        </el-scrollbar>
    </div>
</template>

<style scoped>
.option-input {
  width: 100%;
  margin-bottom: 8px;
}

.title {
    text-align: center;
    font-size: xx-large;
}

.btn {
    width: 180px;
}
</style>