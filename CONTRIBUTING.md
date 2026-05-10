# Contributing Guide

感谢您对本项目的关注！我们欢迎任何形式的贡献。

## 📋 目录

- [开发环境搭建](#开发环境搭建)
- [代码规范](#代码规范)
- [Git 工作流](#git-工作流)
- [提交 Pull Request](#提交-pull-request)
- [代码审查](#代码审查)
- [Issue 提交规范](#issue-提交规范)

## 开发环境搭建

### 前置要求

- **Node.js**: >= 18.0.0（推荐使用 LTS 版本）
- **包管理器**: npm >= 9.0.0 或 yarn >= 1.22.0 或 pnpm >= 8.0.0
- **Git**: >= 2.30.0

### 快速开始

```bash
# 1. Fork 并克隆仓库
git clone https://github.com/<your-username>/<repo-name>.git
cd <repo-name>

# 2. 安装依赖
npm install  # 或 yarn install / pnpm install

# 3. 启动开发服务器
npm run dev

# 4. 运行测试
npm test
```

### 推荐工具

- **编辑器**: VS Code
- **VS Code 插件**: ESLint, Prettier, EditorConfig
- **浏览器**: Chrome（配合 React/Vue DevTools）

## 代码规范

### 命名规范

| 类型 | 规范 | 示例 |
|------|------|------|
| 文件名 | kebab-case | `user-service.ts` |
| 组件名 | PascalCase | `UserProfile.vue` |
| 变量/函数 | camelCase | `getUserInfo()` |
| 常量 | UPPER_SNAKE_CASE | `API_BASE_URL` |
| CSS 类名 | BEM 或 kebab-case | `.card__title--active` |

### 代码风格

- **缩进**: 2 个空格（不使用 Tab）
- **引号**: 单引号 `'`（JS/TS）, 双引号 `"`（HTML/JSX 属性）
- **分号**: 不使用分号（遵循 Prettier 默认配置）
- **行宽**: 最大 100 字符
- **尾逗号**: 使用（ES5 兼容模式）

### 注释规范

```javascript
/**
 * 获取用户信息
 * @param {string} userId - 用户 ID
 * @returns {Promise<User>} 用户信息对象
 */
async function getUserInfo(userId) {
  // 实现逻辑
}
```

### 文件组织

```
src/
├── components/     # 可复用组件
├── pages/          # 页面组件
├── services/       # API 服务层
├── utils/          # 工具函数
├── hooks/          # 自定义 Hooks
├── stores/         # 状态管理
├── types/          # TypeScript 类型定义
├── assets/         # 静态资源
└── styles/         # 全局样式
```

## Git 工作流

### 分支命名

| 分支类型 | 命名格式 | 用途 |
|----------|----------|------|
| 主分支 | `main` / `master` | 生产环境代码 |
| 开发分支 | `dev` | 日常开发集成 |
| 功能分支 | `feature/<描述>` | 新功能开发 |
| 修复分支 | `fix/<描述>` | Bug 修复 |
| 热修复 | `hotfix/<描述>` | 生产环境紧急修复 |
| 文档分支 | `docs/<描述>` | 文档更新 |

### Commit 规范

遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

**Type 类型：**

| Type | 说明 |
|------|------|
| `feat` | 新功能 |
| `fix` | Bug 修复 |
| `docs` | 文档更新 |
| `style` | 代码格式调整（不影响逻辑） |
| `refactor` | 代码重构 |
| `perf` | 性能优化 |
| `test` | 测试相关 |
| `chore` | 构建/工具链变更 |
| `ci` | CI/CD 配置 |

**示例：**

```bash
git commit -m "feat(auth): add JWT token refresh mechanism"
git commit -m "fix(api): handle null response in user endpoint"
git commit -m "docs: update deployment guide for Docker"
```

## 提交 Pull Request

### PR 流程

1. **确保代码质量**
   ```bash
   npm run lint
   npm test
   npm run build
   ```

2. **同步主分支**
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

3. **推送并创建 PR**
   ```bash
   git push origin feature/your-feature
   ```

4. **填写 PR 描述模板**

### PR 标题规范

与 Commit 规范一致：`<type>(<scope>): <description>`

### PR 描述模板

```markdown
## 变更说明

简要描述本次变更的内容和目的。

## 变更类型

- [ ] 新功能 (feature)
- [ ] Bug 修复 (fix)
- [ ] 文档更新 (docs)
- [ ] 代码重构 (refactor)
- [ ] 其他: ___

## 测试情况

- [ ] 已添加/更新单元测试
- [ ] 已通过本地手动测试
- [ ] 已通过 E2E 测试

## 截图（如适用）

## 关联 Issue

Closes #<issue-number>
```

## 代码审查

### 审查要点

- **功能性**: 代码是否实现了预期功能？
- **代码质量**: 是否遵循项目代码规范？
- **性能**: 是否有性能隐患？
- **安全性**: 是否存在安全漏洞？
- **测试**: 测试覆盖率是否足够？
- **可维护性**: 代码是否易于理解和维护？

### 审查流程

1. 至少需要 1 位维护者批准
2. 所有 CI 检查必须通过
3. 解决所有审查意见后方可合并
4. 使用 **Squash Merge** 合并到主分支

## Issue 提交规范

### Bug 报告

```markdown
## Bug 描述
清晰简洁地描述 bug。

## 复现步骤
1. 打开 '...'
2. 点击 '...'
3. 滚动到 '...'
4. 看到错误

## 期望行为
描述期望的正确行为。

## 实际行为
描述实际发生的错误行为。

## 环境信息
- OS: [e.g., macOS 14.0]
- Browser: [e.g., Chrome 120]
- Node.js: [e.g., 18.18.0]
```

### 功能请求

```markdown
## 功能描述
清晰简洁地描述您希望添加的功能。

## 使用场景
描述该功能的使用场景和解决的问题。

## 方案建议（可选）
如果您有实现方案，请在此描述。
```

## 📞 联系方式

如有任何问题，欢迎通过以下方式联系我们：

- 提交 [Issue](../../issues)
- 发起 [Discussion](../../discussions)

---

再次感谢您的贡献！🎉
