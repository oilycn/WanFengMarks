
# 晚风Marks - 个性化书签导航

晚风Marks 是一个使用 Next.js、Tailwind CSS 和 ShadCN UI 构建的现代化、可自托管的书签导航应用。它允许用户管理自己的书签，按分类组织，并提供了一个简洁美观、响应式的仪表盘界面。

## 特性

*   **书签管理**: 轻松添加、编辑、删除书签。
*   **分类管理**: 创建和管理书签分类，支持自定义图标、私密性、排序权重。
*   **拖拽排序**: 在管理模式下，支持拖拽排序同一分类下的书签，并通过保存按钮持久化顺序。
*   **美观界面**: 基于 ShadCN UI 和 Tailwind CSS 的现代化、响应式设计，适配桌面和移动设备。
*   **搜索功能**: 快速搜索网页或筛选应用内书签。
*   **时钟显示**: 首页集成美观的数字时钟。
*   **管理模式**: 通过密码保护的管理模式进行书签和分类的增删改及排序操作。
*   **应用设置**: 管理员可以更改管理员密码，自定义站点 Logo 文本和图标。
*   **书签脚本 (Bookmarklet)**: 通过浏览器书签栏快速添加当前网页到晚风Marks。
*   **MySQL 后端**: 数据持久化存储在 MySQL 数据库中。
*   **性能优化**: 核心组件和库（如对话框、拖拽功能）采用动态导入，减少初始加载体积，提升用户体验。
*   **Docker 支持**: 提供 Dockerfile 以方便容器化部署。

## 技术栈

*   **框架**: Next.js (App Router)
*   **UI 组件**: ShadCN UI
*   **样式**: Tailwind CSS
*   **拖拽**: React Beautiful DnD
*   **数据库**: MySQL
*   **语言**: TypeScript
*   **容器化**: Docker
*   **(可选) AI 功能**: Genkit (如果集成)

## 快速开始

### 1. 环境准备

*   Node.js (推荐 LTS 版本)
*   MySQL 数据库服务
*   (可选) Docker

### 2. 克隆仓库与安装依赖

```bash
git clone <your-repository-url>
cd wanfeng-marks
npm install
# 或者
# yarn install
```

### 3. 配置环境变量

在项目根目录下创建一个名为 `.env.local` 的文件，并填入您的 MySQL 连接字符串：

```env
MYSQL_CONNECTION_STRING="mysql://your_user:your_password@your_host:your_port/your_database"
```

替换 `your_user`, `your_password`, `your_host`, `your_port`, 和 `your_database` 为您的实际 MySQL 配置。

例如，本地开发可能如下：
`MYSQL_CONNECTION_STRING="mysql://root:password@localhost:3306/wanfeng_marks"`

### 4. 首次运行与应用配置 (非 Docker 方式)

如果您不使用 Docker，请按以下步骤运行：

```bash
npm run dev
# 或者
# yarn dev
```

浏览器会自动打开 `http://localhost:9003` (或您配置的端口)。您将被重定向到 `/setup` 页面。

*   **测试数据库连接**: 点击按钮测试应用是否能成功连接到您在 `.env.local` 中配置的 MySQL 数据库。
*   **初始化数据库**: 连接成功后，点击按钮以在数据库中创建应用所需的表结构。
*   **设置管理员密码**: 数据库初始化完成后，设置一个管理员密码，用于后续管理书签和分类。

### 5. 使用 Docker 运行 (推荐)

项目包含 `Dockerfile`，使用 Next.js 的 `standalone` 输出模式进行优化构建。

1.  **构建 Docker 镜像**:
    在项目根目录下，运行以下命令构建镜像：
    ```bash
    docker build -t wanfeng-marks .
    ```

2.  **运行 Docker 容器**:
    使用以下命令运行容器。请确保替换 `<your_mysql_connection_string>` 为您的实际 MySQL 连接字符串。
    ```bash
    docker run -d -p 9003:3000 \
      -e MYSQL_CONNECTION_STRING="<your_mysql_connection_string>" \
      --name wanfeng-marks-app \
      wanfeng-marks
    ```
    *   `-d`: 后台运行容器。
    *   `-p 9003:3000`: 将宿主机的 9003 端口映射到容器的 3000 端口。
    *   `-e MYSQL_CONNECTION_STRING="..."`: **必需！** 设置 MySQL 连接字符串。
    *   `--name wanfeng-marks-app`: 为容器指定一个名称。
    *   `wanfeng-marks`: 您构建的镜像名称。

    容器启动后，如果这是首次运行，请访问 `http://<your-docker-host-ip>:9003/setup` (例如 `http://localhost:9003/setup`) 来完成数据库初始化和管理员密码设置。
    `镜像已制作上传dockerhub,只需要配置mysql即可`
    ```bash
    docker run -d -p 9003:3000 -e MYSQL_CONNECTION_STRING="<your_mysql_connection_string>" --name wanfeng-marks-app oilycn/wanfeng-marks
    ```


### 6. 使用应用

配置完成后，您将被引导至主页。

*   **浏览书签**: 按分类查看您的书签。
*   **管理模式**: 点击侧边栏底部的 "进入管理模式" 按钮，输入您设置的管理员密码。
    *   在管理模式下，您可以添加、编辑、删除书签和分类。
    *   在管理模式下，您可以对特定分类下的书签进行拖拽排序。排序后，分类标题旁会出现 "保存书签顺序" 按钮，点击即可持久化更改。
    *   管理模式下，右下角会出现浮动按钮，用于快速添加书签、复制书签脚本、**打开应用设置**和退出管理模式。
*   **应用设置 (管理模式)**:
    *   点击右下角的设置图标按钮 (齿轮图标) 打开设置弹窗。
    *   **密码安全**: 在此标签页下，您可以更改管理员密码。如果系统已设置密码，您需要输入当前密码。
    *   **站点外观**: 在此标签页下，您可以自定义站点左上角显示的 Logo 文本和选择一个 Logo 图标。更改会实时保存在数据库并更新界面。

### 7. 书签脚本 (Bookmarklet)

为了方便快速添加当前浏览的网页为书签：

1.  进入管理模式。
2.  点击右下角的 "复制书签脚本" 按钮 (带有复制图标)。
3.  在您的浏览器书签栏上右键，选择 "添加网页" 或 "添加书签"。
    *   **名称**: 任意填写，例如 "添加到晚风Marks"。
    *   **网址/URL**: 粘贴您刚刚复制的脚本 (它以 `javascript:` 开头)。
4.  保存书签。
5.  之后，在任何您想收藏的网页上，点击这个新创建的浏览器书签，就会弹出一个预填写了网页标题、网址和描述（如果能获取到）的添加窗口。

## 项目结构 (概览)

*   `src/app/`: Next.js App Router 页面和布局。
    *   `page.tsx`: 主仪表盘页面。
    *   `setup/page.tsx`: 首次配置页面。
    *   `add-bookmark-popup/page.tsx`: 书签脚本使用的弹窗页面。
*   `src/components/`: React UI 组件 (大部分基于 ShadCN)。
    *   `SettingsDialog.tsx`: 应用设置弹窗组件。
*   `src/actions/`: Next.js Server Actions (用于后端逻辑，如数据库交互)。
*   `src/lib/`: 工具函数和数据库连接逻辑 (如 `mysql.ts`)。
*   `src/hooks/`: 自定义 React Hooks (如 `use-toast`, `use-mobile`)。
*   `src/types/`: TypeScript 类型定义。
*   `public/`: 静态资源。
*   `Dockerfile`: 用于构建 Docker 镜像的配置文件。
*   `.dockerignore`: 指定 Docker 构建时忽略的文件。

## 贡献

欢迎提交 Pull Requests 或 Issues。

## 许可证

本项目采用 MIT 许可证。
