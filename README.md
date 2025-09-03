# 字流 - AI驱动的多平台内容发布工具

<div align="center">
  <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License">
  <img src="https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg" alt="Node.js">
  <img src="https://img.shields.io/badge/typescript-5.0-blue.svg" alt="TypeScript">
  <img src="https://img.shields.io/badge/next.js-15.4-black.svg" alt="Next.js">
</div>

<div align="center">
  <h3>让文字如流水般顺畅流向每个平台</h3>
  <p>一次创作，智能适配公众号、知乎、掘金、知识星球、视频号、抖音、B站、小红书等多个内容平台</p>
</div>

## ✨ 产品特性

### 🚀 核心功能
- **Markdown 编辑器** - 实时预览，支持富文本编辑
- **多平台发布** - 一键适配公众号、知乎、掘金、知识星球、视频号、抖音、B站、小红书
- **智能格式转换** - 自动转换各平台所需的格式和样式
- **Chrome 插件集成** - 浏览器插件一键填充内容
- **云端图片存储** - 自动处理图片上传和链接转换
- **发布预设管理** - 保存常用发布配置，提升发布效率

### 🎨 样式系统
- **默认样式** - 适合通用内容的清爽风格
- **技术样式** - 专为技术文章优化的代码友好样式  
- **简约样式** - 极简设计，突出内容本身

### 💎 订阅功能
- **免费版** - 基础功能，支持公众号发布
- **专业版** - 解锁全平台发布、无限存储、专业样式

## 🛠️ 技术架构

### 前端技术栈
- **框架**: Next.js 15.4 + React 19
- **语言**: TypeScript 5.0
- **样式**: Tailwind CSS 4.0
- **组件库**: Radix UI + shadcn/ui
- **编辑器**: @uiw/react-md-editor

### 后端技术栈
- **运行时**: Next.js API Routes
- **数据库**: SQLite (开发) / Turso (生产)
- **ORM**: Drizzle ORM
- **认证**: NextAuth.js
- **文件存储**: AWS S3 兼容服务

### 部署架构
- **托管平台**: Vercel
- **数据库**: Turso (LibSQL)
- **CDN**: Vercel Edge Network
- **图片存储**: Cloudflare R2

## 🚀 快速开始

### 环境要求
- Node.js 18+
- npm 或 yarn

### 1. 克隆项目
```bash
git clone https://github.com/your-username/ziliu.git
cd ziliu
```

### 2. 安装依赖
```bash
npm install
```

### 3. 环境配置
创建 `.env.local` 文件并配置必要的环境变量：

```bash
# 数据库配置
DATABASE_URL="file:./dev.db"
TURSO_DATABASE_URL="your-turso-url"
TURSO_AUTH_TOKEN="your-turso-token"

# 认证配置
NEXTAUTH_SECRET="your-super-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# 云存储配置 (可选)
R2_ACCOUNT_ID="your-r2-account-id"
R2_ACCESS_KEY_ID="your-r2-access-key"
R2_SECRET_ACCESS_KEY="your-r2-secret-key"
R2_BUCKET_NAME="your-bucket-name"
```

### 4. 初始化数据库
```bash
npm run db:push
```

### 5. 启动开发服务器
```bash
npm run dev
```

访问 http://localhost:3000 开始使用

## 📁 项目结构

```
ziliu/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (pages)/           # 应用页面
│   │   ├── api/               # API路由
│   │   └── globals.css        # 全局样式
│   ├── components/            # React 组件
│   │   ├── ui/               # UI 基础组件
│   │   ├── editor/           # 编辑器组件
│   │   └── layout/           # 布局组件
│   ├── lib/                  # 工具库
│   │   ├── db/               # 数据库相关
│   │   ├── auth.ts           # 认证配置
│   │   ├── converter.ts      # 格式转换
│   │   └── utils.ts          # 工具函数
│   └── types/                # TypeScript 类型定义
├── extension/                # Chrome 插件
│   ├── manifest.json        # 插件配置
│   ├── core/                # 核心功能
│   ├── plugins/             # 平台适配插件
│   └── ui/                  # 插件界面
├── drizzle/                 # 数据库迁移
└── public/                  # 静态资源
```

## 🔧 开发指南

### 可用脚本
```bash
# 开发
npm run dev              # 启动开发服务器
npm run build            # 构建生产版本
npm run start            # 启动生产服务器

# 数据库
npm run db:generate      # 生成数据库迁移
npm run db:migrate       # 执行数据库迁移
npm run db:push          # 推送架构到数据库
npm run db:studio        # 打开数据库管理界面

# 代码质量
npm run lint             # ESLint 检查
npm run type-check       # TypeScript 类型检查
```

### Chrome 插件开发
1. 插件源码位于 `/extension` 目录
2. 在 Chrome 中加载未打包的插件：
   - 打开 `chrome://extensions/`
   - 开启开发者模式
   - 点击"加载已解压的扩展程序"
   - 选择 `extension` 目录

## 🌟 主要功能

### 文章管理
- ✅ Markdown 编辑器
- ✅ 实时预览
- ✅ 自动保存
- ✅ 历史记录

### 平台发布
- ✅ 微信公众号
- ✅ 知乎专栏 (专业版)
- ✅ 掘金社区 (专业版) 
- ✅ 知识星球 (专业版)

### 格式转换
- ✅ Markdown 到 HTML
- ✅ 代码高亮
- ✅ 图片处理
- ✅ 样式适配

### 用户系统
- ✅ 注册登录
- ✅ 订阅管理
- ✅ 权限控制
- ✅ 使用统计

## 🎯 路线图

### 近期计划
- [ ] 小红书平台支持
- [ ] 微博平台支持
- [ ] 即刻平台支持
- [ ] 抖音、B站等视频平台支持

### 长期规划
- [ ] 更多平台接入

## 🤝 贡献指南

我们欢迎各种形式的贡献！

### 提交 Bug 报告
- 使用 GitHub Issues 提交 bug
- 提供详细的复现步骤
- 附上相关的错误日志

### 提交功能请求
- 在 Issues 中描述新功能
- 说明使用场景和预期效果
- 讨论实现方案

### 代码贡献
1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 📝 许可证

本项目采用 [MIT 许可证](LICENSE) - 查看文件了解详情

## 🙏 致谢

感谢以下开源项目：
- [Next.js](https://nextjs.org/) - 全栈 React 框架
- [Drizzle ORM](https://orm.drizzle.team/) - TypeScript ORM
- [Tailwind CSS](https://tailwindcss.com/) - CSS 框架
- [Radix UI](https://www.radix-ui.com/) - 无样式 UI 组件
- [NextAuth.js](https://next-auth.js.org/) - 认证解决方案

## 📞 联系我们

- 🌐 网站: [ziliu.online](https://ziliu.online)
- 📧 邮箱: 384709054@qq.com

---

<div align="center">
  <p>如果这个项目对你有帮助，请给我们一个 ⭐️</p>
</div>