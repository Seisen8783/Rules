# Rules · 学生手册考试题库检索

纯静态单页应用：对学生手册考试题库（当前 **3357** 条）进行多关键词组合检索。
部署目标为 **Cloudflare Workers / Pages**。仓库连接 Cloudflare Git 集成后，每次推送到 `main` 分支会自动构建部署，无需手动上传。

- 仓库地址：`https://github.com/Seisen8783/Rules`
- 默认分支：`main`（所有变更直接提交到该分支，不开 PR、不建其他分支）
- 技术栈：原生 HTML / CSS / JavaScript，**无框架、无构建步骤**，`public/` 目录原样作为静态站点发布

---

## 一、目录结构

```
Rules/
├── public/               # 静态站点根目录（Cloudflare 部署目录，勿改名）
│   ├── index.html        # 页面结构 + 全部样式；题库总数显示在 <div class="sub"> 中
│   ├── data.js           # 题库数据：const LINES = [ "1. …", "2. …", … ];
│   └── app.js            # 检索逻辑：关键词切分、AND 匹配、转义后高亮渲染
├── wrangler.toml         # Cloudflare Workers 配置（[assets] directory = "./public"）
├── package.json          # 脚本：dev / deploy / deploy:pages；依赖仅 wrangler
├── package-lock.json     # 锁定依赖版本，必须随 package.json 一起提交
├── .gitignore            # 忽略 node_modules/、.wrangler/、dist/、日志等
└── README.md             # 本规范
```

职责边界：

| 要改什么 | 改哪个文件 |
|---|---|
| 增删改题目 | 只改 `public/data.js`，并同步 `public/index.html` 中的总数 |
| 界面、文案、样式 | 只改 `public/index.html` |
| 搜索行为、高亮、交互 | 只改 `public/app.js` |
| 部署配置 | `wrangler.toml`（一般不需要动） |

---

## 二、更新规范（AI / 维护者必须遵守）

### 1. 更新题库数据（public/data.js）

- 文件必须保持合法 JavaScript，整体结构固定为：
  ```js
  const LINES = [
    "1. 题目内容……",
    "2. 题目内容……",
    …
  ];
  ```
- 每条数据是一个字符串，格式为 `序号. 内容`；序号从 1 开始**连续递增**，与数组下标对应。
- 字符串使用双引号；内容中的双引号必须转义为 `\"`，反斜杠转义为 `\\`；不得出现裸换行。
- 新增题目追加到数组末尾并续接序号；删除题目后必须重排所有后续序号。
- **同步总数**：修改 `public/index.html` 中 `<div class="sub">… 题库共 <b>3357</b> 条</div>` 的数字，使其等于 `LINES.length`。
- 改完必须运行校验（在仓库根目录）：
  ```bash
  node -e "const s=require('fs').readFileSync('public/data.js','utf8');const a=new Function(s+';return LINES')();console.log('条数:',a.length);console.log('序号连续:',a.every((x,i)=>x.startsWith((i+1)+'. ')))"
  ```
  输出条数必须与 index.html 中的总数一致，序号连续必须为 true。

### 2. 更新页面（public/index.html）

- 保持 `lang="zh-CN"`、UTF-8、viewport meta。
- 脚本引用顺序固定：先 `data.js` 后 `app.js`，不得改为异步加载。
- 不引入外部 CDN、字体或图片资源，保持离线可用与零外部请求。

### 3. 更新检索逻辑（public/app.js）

- 必须保留 `escapeHtml` / `escapeReg`：**任何文本先转义再进入 innerHTML**，禁止直接拼接未转义的数据或用户输入。
- 保留现有交互：回车搜索、搜索按钮、清空按钮、多关键词以空格/逗号/顿号等分隔且需同时命中（AND 逻辑）。
- 不得引入框架或打包器；如确需第三方库，只能以本地文件形式放入 `public/`。

### 4. 部署配置（wrangler.toml）

- `[assets] directory` 必须保持 `"./public"`。
- `compatibility_date` 不得晚于当前日期；如需更新，改为当天或更早的日期。
- 不添加构建命令，保持纯静态部署。

---

## 三、提交前本地验证（必做）

```bash
npm install                 # 首次或依赖变更后执行
npm run dev                 # 启动本地 Worker，默认 http://localhost:8787
```

在浏览器中逐项确认：

1. 页面正常打开，标题与题库总数显示正确；
2. 搜索「奖学金」等关键词有命中且关键词黄色高亮；
3. 多关键词（如「奖学金 国家」）按 AND 逻辑命中；
4. 回车搜索、清空按钮正常；无结果与空输入有提示文案；
5. 浏览器控制台无 error / warning；
6. 最后运行部署预检：
   ```bash
   npx wrangler deploy --dry-run
   ```
   必须成功读取 assets 且无报错。

---

## 四、代码提交规范（提交到哪里、如何提交）

**提交目标固定**：远程 `origin` = `https://github.com/Seisen8783/Rules.git`，分支 `main`。

流程（在仓库根目录依次执行）：

```bash
# 1. 确认当前分支为 main、远程正确
git branch --show-current        # 必须输出 main
git remote -v                    # origin 必须指向 Seisen8783/Rules

# 2. 只暂存本次实际修改的文件（禁止 git add -A / git add .）
git add public/data.js public/index.html README.md   # 按实际改动替换

# 3. 检查暂存内容，确认不含 node_modules、日志、密钥
git status
git diff --cached --stat

# 4. 提交，信息使用 Conventional Commits 格式
git commit -m "data: 新增第3358-3360条题目并同步总数"

# 5. 推送到固定目标
git push origin main
```

提交信息前缀约定：

| 前缀 | 用途 | 示例 |
|---|---|---|
| `data:` | 题库数据变更 | `data: 修订第47条国家励志奖学金金额` |
| `feat:` | 新功能 | `feat: 支持按题号区间筛选` |
| `fix:` | 缺陷修复 | `fix: 修复特殊字符关键词高亮错位` |
| `style:` | 界面样式调整 | `style: 优化移动端搜索栏换行` |
| `docs:` | 文档变更 | `docs: 更新README更新规范` |
| `chore:` | 依赖 / 配置维护 | `chore: 升级wrangler至4.x` |

推送后：Cloudflare 自动构建部署（通常 1 分钟内），无需其他操作。

### 禁止事项

- 禁止提交 `node_modules/`、`.wrangler/`、`dist/`、日志、`.env`、任何令牌或密钥；
- 禁止 `push --force`、`reset --hard` 覆盖远端历史、修改远程地址或默认分支；
- 禁止引入需要构建步骤的框架（React/Vue 等）而破坏纯静态部署；
- 禁止改动 `public/` 目录名称或其中三个文件的文件名（Cloudflare 与页面引用依赖它们）。

---

## 五、部署方式参考（人工操作）

- **Workers**：Cloudflare 控制台 → Workers & Pages → Create → Worker → Import Git repository → 选择 `Seisen8783/Rules`，构建命令留空，自动识别 `wrangler.toml`。
- **Pages**：Workers & Pages → Create → Pages → Connect to Git → 选择本仓库；Framework preset = None，Build command 留空，**Build output directory = `public`**。
- **命令行**（需已 `wrangler login`）：`npm run deploy`（Workers）或 `npm run deploy:pages`（Pages）。