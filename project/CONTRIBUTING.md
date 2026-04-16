# 贡献指南

感谢您对 AI跨境新手加速器项目的兴趣！我们欢迎各种形式的贡献，包括但不限于：

- 🐛 报告 Bug
- 💡 提出新功能建议
- 📝 完善文档
- 🔧 提交代码修复
- ✨ 改进代码质量

## 开始之前

在开始贡献之前，请确保：

1. 已阅读并理解项目的 [README.md](./README.md)
2. Fork 了项目仓库
3. 克隆了您的 Fork 到本地
4. 在本地创建了功能分支

## 开发环境设置

```bash
# 克隆您的 Fork
git clone https://github.com/YOUR_USERNAME/ai-cross-border.git
cd ai-cross-border

# 添加上游仓库
git remote add upstream https://github.com/ORIGINAL_OWNER/ai-cross-border.git

# 安装依赖
cd backend && npm install
cd ../frontend && npm install
```

## 分支管理

我们使用 Git Flow 分支模型：

- `main` - 主分支，稳定版本
- `develop` - 开发分支
- `feature/*` - 功能分支
- `fix/*` - 修复分支
- `hotfix/*` - 紧急修复分支

### 创建功能分支

```bash
# 确保在 develop 分支上
git checkout develop

# 创建新功能分支
git checkout -b feature/your-feature-name

# 或创建修复分支
git checkout -b fix/issue-description
```

## 代码规范

### TypeScript

- 启用严格模式
- 使用明确的类型声明
- 避免使用 `any` 类型

```typescript
// ✅ 推荐
function greet(name: string): string {
  return `Hello, ${name}!`;
}

// ❌ 避免
function greet(name: any): any {
  return `Hello, ${name}!`;
}
```

### 命名规范

| 类型 | 规范 | 示例 |
|------|------|------|
| 变量/函数 | 驼峰命名 | `getUserData` |
| 类名 | PascalCase | `UserService` |
| 常量 | 全大写下划线 | `MAX_RETRY_COUNT` |
| 文件夹 |  kebab-case | `user-service` |

### 前端组件

- 使用函数式组件
- 使用有意义的组件名称
- 组件文件使用 PascalCase

```tsx
// ✅ 推荐
import { UserProfile } from './UserProfile';

// ❌ 避免
import { userProfile } from './user-profile';
```

### 后端模块

遵循 NestJS 模块化架构：

```
src/modules/
├── user/
│   ├── dto/           # 数据传输对象
│   │   ├── create-user.dto.ts
│   │   └── update-user.dto.ts
│   ├── user.controller.ts
│   ├── user.module.ts
│   ├── user.service.ts
│   └── user.service.spec.ts  # 单元测试
```

## 提交规范

### 提交信息格式

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

### 类型 (type)

| 类型 | 描述 |
|------|------|
| feat | 新功能 |
| fix | 修复 Bug |
| docs | 文档更新 |
| style | 代码格式调整（不影响功能） |
| refactor | 重构（不是修复也不是新功能） |
| perf | 性能改进 |
| test | 测试相关 |
| build | 构建或依赖更新 |
| ci | CI/CD 配置 |
| chore | 其他修改 |

### 示例

```bash
# 提交新功能
git commit -m "feat(ai): 添加商品翻译功能"

# 修复 Bug
git commit -m "fix(auth): 修复登录超时问题"

# 更新文档
git commit -m "docs: 更新 API 文档"
```

## 测试要求

### 单元测试

所有新功能必须包含单元测试：

```bash
# 后端测试
cd backend
npm run test

# 前端测试（如果添加）
cd frontend
npm run test
```

### 测试覆盖率

- 新增代码覆盖率不应低于 70%
- 关键业务逻辑覆盖率应达到 90% 以上

## Pull Request 流程

1. **创建分支** - 从 `develop` 分支创建功能分支
2. **开发代码** - 遵循代码规范进行开发
3. **编写测试** - 为新功能编写单元测试
4. **本地测试** - 确保所有测试通过
5. **提交代码** - 使用规范化的提交信息
6. **推送 Fork** - 推送到您的远程仓库
7. **创建 PR** - 在 GitHub 上创建 Pull Request

### Pull Request 模板

```markdown
## 描述
[简要描述这个 PR 的目的]

## 更改类型
- [ ] 🐛 Bug 修复
- [ ] ✨ 新功能
- [ ] 📝 文档更新
- [ ] 🎨 代码格式调整
- [ ] 🔄 重构
- [ ] ⚡ 性能改进
- [ ] ✅ 测试更新

## 测试
- [ ] 我已完成本地测试
- [ ] 新功能包含单元测试

## 截图（如果适用）
[添加截图]

## 注意事项
[需要特别关注的任何问题]
```

## 开发规范检查

在提交前，请运行以下检查：

```bash
# 代码格式检查
npm run lint

# 类型检查
npm run type-check

# 运行测试
npm run test
```

## 问题反馈

如果您发现了 Bug 或有新功能建议：

1. 搜索现有 Issues，确保问题未被报告
2. 创建新的 Issue，选择对应的模板
3. 详细描述问题或建议
4. 提供复现步骤（如适用）

## 行为准则

请尊重所有项目参与者和社区成员：

- 使用友好和包容的语言
- 尊重不同的观点和经验
- 接受建设性的批评
- 关注对社区最有利的事情

## 许可证

通过贡献代码，您同意将您的贡献按照 [MIT License](../LICENSE) 的条款进行许可。

---

再次感谢您的贡献！🎉
