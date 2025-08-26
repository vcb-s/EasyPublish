![](readme/logo.png)

# EasyPublish

EasyPublish 是一个集发布稿生成、公网发布、主站更新、发布后修改于一体的一站式发布应用，支持向萌番组、动漫花园、末日动漫、Nyaa、Acgrip提交发布内容。

本项目旨在统一各站发布配置，简化发布流程，以及应对部分网站可用性差的问题，设计尽可能兼顾易用性和灵活性。

本项目部分功能仍处于测试阶段，可能尚不稳定。

------

## [快速开始](./QUICKSTART.md)

## 使用说明

### 登录管理

![登录管理](readme/08.png)

*新的登录机制仍处于测试阶段，可能尚不稳定。若遇到 BUG 可点击打开网站手动登录。*

在此输入各站的用户名和密码，用以登录各站。或者点击打开网站手动登录，EasyPublish 会在登录窗口关闭时记录登录状态和 Cookie。

点击检查按钮会先检查该站的登录状态，若未登录则尝试使用输入的用户名和密码自动登录。其中，Nyaa、动漫花园、末日动漫及其国际站点需要手动进行人机验证。

禁用账户后检查和发布将被跳过，也不会搜索对应站点的线上内容。

遇访问失败请检查网络环境并确保能够正常访问网站。遇到 AcgnX 的防火墙阻止时，EasyPublish 会自动弹出网站，在通过其人机验证后关闭即可。

导入导出按钮会以 `JSON` 的形式导入和导出 EasyPublish 保存的 Cookie。

清除缓存按钮将清除登录窗口的所有缓存并清除 EasyPublish 保存的 Cookie。

页面会自动刷新（如果没出 BUG 的话），所以刷新按钮意义不大。

![用户名密码](readme/04.png)

*（可选功能）* VCB-Studio 主站账户用于发布主站帖，基于 WP RUST API 实现，应用程序密码前往 *仪表盘-个人资料-应用程 密码* 新建。

> [!CAUTION]
>
> EasyPublish 明码存储您的信息，请确保运行环境安全

### 代理设置

![代理设置](readme/07.png)

代理设置位于右上角，修改后将自动重启应用以使设置生效。

EasyPublish 不会自动使用系统代理，若非 VPN/TUN 等请先配置代理设置。

### 新建项目

![新建项目](readme/01.png)

填写项目名称和存放配置的地址，该名称不作为发布时的标题。*（本地保存路径和项目名称已不再是必填项）* 

任务类型分为从文件创建、从模版创建和快速发布。

更多内容请参考[快速开始](./QUICKSTART.md)。

### 管理本地项目

![管理本地项目](readme/03.png)

管理 EasyPublish 创建的项目，默认只显示未完成项目，可以从该页面继续发布流程，删除项目的同时会删除项目目录。

展开行可以查看项目地址和已发布的BT链接，右键可复制。

所有项目以创建时的时间戳作为唯一标识。

### 管理已发布项目

*该功能现已上线，但仍在测试。*

EasyPublish 将获取各站发布的种子列表，并将相同标题的种子进行合并，如若在不同站点的标题不同，可借助搜索框进行检索。

默认只加载各站第一页中的内容，因此列表末端可能存在大量只有 Nyaa 的种子。

加载时间可能较长，与各站可用性和网络状况有关，如不需要加载部分站点可前往登录管理禁用对应账户。

点击打开以默认应用打开链接，点击复制复制网址，点击查看可在应用内查看内容，点击编辑可编辑对应的内容。

![02](./readme/02.png)

于最下方点击提交更改即可更新对应站点的内容。

![05](./readme/05.png)

批量修改功能可同时修改同一种子不同站点的内容，支持 html 格式的发布稿，Nyaa 和 Acgrip 将自动转换为 markdown 和 bbcode 格式的发布稿。若该种子存在于萌番组，将加载萌番组上的内容到输入框，此外，支持加载一个文件作为发布稿内容。

![06](./readme/06.png)

------

## 发布功能说明

具体步骤请参考[快速开始](./QUICKSTART.md)，此处仅为配置项说明。

### 编辑发布配置

##### 从文件创建

| 配置项         | 说明                                                         |
| -------------- | ------------------------------------------------------------ |
| 标题           | 用作发布帖的标题                                             |
| 种子文件路径   | 选择要发布的种子，或者直接填写其路径                         |
| md文件路径     | *（可选）* 选择 markdown 格式的发布搞，或者直接填写其路径，该文件将用于 Nyaa 的发布 |
| html文件路径   | 选择 html 格式的发布稿，或直接填写其路径，该文件将用于萌番组、动漫花园、末日动漫及其国际站点的发布 |
| bbcode文件路径 | *（可选）* 选择 bbcode 格式的发布搞，或者直接填写其路径，该文件将用于 Acgrip 的发布 |
| 萌番组标签     | （可选）选择萌番组的标签，选项默认根据标题自动向萌番组获取，若有遗漏则在框内输入相关内容，EasyPublish会搜索相关标签 |
| 萌番组分类     | 选择发布内容在萌番组上的分类                                 |
| Nyaa Info      | 填写 Nyaa 上 Information 一栏对应内容，默认填写 *VCB-Stusio 发布规范* 中的默认内容，若留空请删除 |
| Nyaa分类       | 选择发布内容在 Nyaa 上的分类                                 |
| Nyaa配置项     | 对应 Nyaa 上的两个选项                                       |

其他站点将根据萌番组和 Nyaa 的分类选择相应分类，分类仅收录部分，若有需要请反馈。

若没有选择 md 文件和 bbcode 文件，将会根据所选的 html 文件生成对应的文件。

点击保存按钮以保存以上配置，点击下一步自动保存并进入复核阶段。

##### 从模板创建

该部分内容根据 [VCB-Studio 发布规范](https://github.com/vcb-s/VCB-S_Publishing) 设计，目前尚只能处理简单的新番和RS项目，对于系列合集、携带系列合集的复杂内容请考虑使用文件发布。

对于非RS项目：

| 配置项     | 说明                                                         |
| ---------- | ------------------------------------------------------------ |
| 中文标题   | 如实填写 |
| 英文标题   | 如实填写           |
| 日语标题   | 如实填写            |
| 海报图链接 | 如实填写                                                     |
| 内容量     | *（可选）* 指示项目包含的内容，如 S1、OVA 等，选项中缺少可直接输入，无需标注可留空 |
| 位深       | 如实填写，选项中缺少可添加                                   |
| 分辨率     | 如实填写，选项中缺少可添加                                   |
| 编码       | 如实填写，选项中缺少可添加                                   |
| 类型       | 如实填写，选项中缺少可添加，如 BDRip、DVDRip                 |
| 提名情况   | 指示该项目是否为组员提名项目                                 |
| 字幕信息   | *（可选）* 选择内封字幕信息，缺少语言可直接输入，没有可留空；下方输入框将呈现最终效果，若不合预期可直接修改或重新填写，但应始终保持一行中文一行英文 |
| 音轨信息   | *（可选）* 选择内封和外挂音轨信息，没有可留空；下方输入框将呈现最终效果，若不合预期可直接修改或重新填写，但应始终保持一行中文一行英文 |
| 合作字幕组 | *（可选）* 选择项目的合作字幕组，若缺少请按照 `中文组名/English Name` 的格式输入添加，没有可留空 |
| 中文吐槽   | 填写总监的画质吐槽，请不要在行首和行尾留有多余的空格和换行   |
| 英文吐槽   | 填写画质吐槽的英文版本，应与中文吐槽的段落数保持严格一致 |
| 发布吐槽   | *（可选）* 填写参与制作者留下的吐槽，每行对应一个 |
| 参与制作   | 填写参与制作的总监、整理、压制、发布                         |
| 资源提供者 | *（可选）* 填写资源提供者，每行对应一个类别，没有可留空，请不要在行首和行尾留有多余的空格和换行 |
| 对比图     | 分别填写 html、md、bbcode 三种格式的对比图，注意应当包含附带的文字，支持直接从 url.txt 文件加载 |
| 种子文件路径 | 选择要发布的种子，或者直接填写其路径 |
| 萌番组标签    | *（可选）* 选择萌番组的标签，选项默认根据标题自动向萌番组获取，若有遗漏则在框内输入相关内容，EasyPublish 会搜索相关标签 |
| 萌番组分类    | 选择发布内容在萌番组上的分类                                 |
| Nyaa Info      | 填写Nyaa上Information一栏对应内容，默认填写VCB默认内容，若留空请删除 |
| Nyaa分类       | 选择发布内容在Nyaa上的分类                                   |
| Nyaa配置项     | 对应Nyaa上的两个选项                                                            |

此外，若勾选主站预填写，可以在此填写发布图、署名和 MediaInfo，以加快发布当日的发布速度。注意，对于RS项目，通常不需要进行预填写。

| 配置项     | 说明                          |
| ---------- | ----------------------------- |
| 发布图署名 | 填写主站横图的作者名字        |
| 原图链接   | 填写主站横图的来源链接        |
| Mediainfo  | 对应主站帖子的Mediainfo的内容 |

对于RS项目，无需填写对比图部分，并增加以下三个内容：

| 配置项   | 说明                                                     |
| -------- | -------------------------------------------------------- |
| 中文修正 | 填写重发修正，每行一条                                   |
| 英文修正 | 填写重发修正的英文版本，应当与中文修正的行数保持严格一致 |
| RS版本   | 填写 Reseed 的版本，默认为 1                             |

### BT发布

在进行发布之前，请确保账户已登录，并通过了末日动漫的防火墙验证和人机验证。

EasyPublish 在发布之前会再次检查登录状态，若出现异常请前往登录管理登录账号，再转到管理本地项目继续发布。

对于末日动漫，若遇防火墙阻止将弹出登录页面，请通过人机验证后再次尝试发布。

萌番组有团队同步和非团队同步两种发布方式，任意一项发布完成均不可再次在萌番组发布。

另部分情况下可能出现疑似由网络波动造成的已发布但显示种子已存在，若出现以上情况请携日志反馈。

### 主站发布

*（该步骤可以跳过）* 

主站发布功能基于 WordPress RUST API 实现，需要账户登录处填写正确的用户名和应用程序密码。

刷新会尝试再次获取未同步的链接（萌番组团队同步）或未获取到的链接（动漫花园），获取到后将自动填入发布稿中（仅项目为模版创建时有效）。

复制按钮可以 html 格式复制全部 BT 链接。

若勾选 RS 选项，在下方搜索框搜索并选择一个文章，EasyPublish 将会在填写模板一栏自动填写原帖的 Image Credit、MediaInfo、发布链接和过往修正，并自动为链接增加删除线标签，发布时将以新的内容覆盖旧的内容。

------

## 开源许可

| 项目               | 开源协议           | 库                                                           |
| ------------------ | ------------------ | ------------------------------------------------------------ |
| electron           | MIT License        | [https://github.com/electron/electron](https://github.com/electron/electron) |
| vue                | MIT License        | [https://github.com/vuejs/core](https://github.com/vuejs/core) |
| vue-router         | MIT License        | [https://github.com/vuejs/router](https://github.com/vuejs/router) |
| axios              | MIT License        | [https://github.com/axios/axios](https://github.com/axios/axios) |
| axios-retry        | Apache License 2.0 | [https://github.com/softonic/axios-retry](https://github.com/softonic/axios-retry) |
| element-plus       | MIT License        | [https://github.com/element-plus/element-plus](https://github.com/element-plus/element-plus) |
| electron-log       | MIT License        | [https://github.com/megahertz/electron-log](https://github.com/megahertz/electron-log) |
| lowdb              | MIT License        | [https://github.com/typicode/lowdb](https://github.com/typicode/lowdb) |
| bbob               | MIT License        | [https://github.com/JiLiZART/bbob](https://github.com/JiLiZART/bbob) |
| marked             | MIT License        | [https://github.com/markedjs/marked](https://github.com/markedjs/marked) |
| commonmark         | BSD License        | [https://github.com/commonmark/commonmark.js](https://github.com/commonmark/commonmark.js) |
| markdown-to-bbcode | MIT License        | [https://github.com/ddormer/markdown-to-bbcode](https://github.com/ddormer/markdown-to-bbcode) |
| Turndown           | MIT License        | [https://github.com/mixmark-io/turndown](https://github.com/mixmark-io/turndown) |

------

## Project Setup

### Install

```bash
$ npm install
```

### Development

```bash
$ npm run dev
```

### Build

```bash
# For windows
$ npm run build:win

# For macOS
$ npm run build:mac

# For Linux
$ npm run build:linux
```
