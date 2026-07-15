# 本地自动化测试

项目使用 Node.js 内置测试框架，不需要安装第三方依赖。请使用 Node.js 20 或更高版本。

## 首次启用推送前检查

每个新克隆的仓库执行一次：

```powershell
npm run hooks:install
```

该命令会让 Git 使用仓库内的 `.githooks`。此后每次 `git push` 前都会自动运行快速测试；测试失败时推送会被中止。

## 手动运行

```powershell
npm test
```

也可以直接运行与推送钩子相同的入口：

```powershell
npm run test:quick
```

测试会检查 JavaScript 语法、赛事与史实马数据完整性，以及几组核心规则边界。整个过程离线运行，不会执行需要访问 Wikipedia 的史实胜场审计。

## 故障排查

- 如果 Git 没有自动运行测试，重新执行 `npm run hooks:install`，并用 `git config --get core.hooksPath` 确认结果为 `.githooks`。
- 如果提示找不到 Node.js 或版本过低，请安装 Node.js 20 或更高版本。
- 测试失败时，根据输出中的文件名或数据 ID 修复问题，再重新推送。
- 紧急情况下可用 `git push --no-verify` 跳过本地钩子；这会绕过全部推送前检查，应谨慎使用。
