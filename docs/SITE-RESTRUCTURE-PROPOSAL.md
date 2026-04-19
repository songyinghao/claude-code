# Claude Code 文档站章节重构方案

> 按功能域重新组织，专有名词保留英文，其余简化为中文。

---

## 一、导航结构

```
开始使用
├── 项目介绍
├── 项目动机
└── 架构总览

核心机制
├── Agent Loop
├── 流式响应
├── 多轮对话
├── 系统提示词
└── 深度规划

上下文管理
├── 令牌预算
├── 上下文压缩
├── 项目记忆
├── 自动记忆整理
└── 穷鬼模式

工具系统
├── 工具总览
├── 文件操作
├── 命令执行
├── 搜索导航
├── 任务管理
├── 网页搜索
├── 桌面自动化
└── 浏览器控制

多智能体
├── 子智能体
├── 自定义智能体
├── 工作树隔离
├── 协调模式
├── 团队记忆
└── 后台会话

MCP
└── MCP 详解

Hook 与 Plugin
├── Hook 钩子
├── 插件市场
└── LSP 集成

Skills
├── Skill 技能系统
├── Workflow 脚本
└── Skill 搜索

远程控制
├── 远程控制
├── ACP 接入
├── 消息通道
├── 本地通信
└── 常驻助手

安全机制
├── 安全概述
├── 权限模型
├── 沙箱
├── Bash 检查
├── 规划模式
└── 自动模式

额外功能
├── 特性开关
├── A/B 测试与配置
├── 错误追踪
├── 隐藏功能
├── Buddy 助手
├── 命令分类
└── 语音模式

开发人员
├── 可观测性
├── 调试模式
└── 专属特性

基础设施
├── 守护进程
└── 自动更新

附录
├── 任务追踪
├── 测试计划
└── 设计文档
```

---

## 二、标题映射

| 导航标题 | 新文件路径 | 合并来源 |
|---------|-----------|---------|
| 项目介绍 | docs/introduction/what-is-claude-code | （不变） |
| 项目动机 | docs/introduction/why-this-whitepaper | （不变） |
| 架构总览 | docs/introduction/architecture-overview | （不变） |
| Agent Loop | docs/conversation/the-loop | （不变） |
| 流式响应 | docs/conversation/streaming | （不变） |
| 多轮对话 | docs/conversation/multi-turn | （不变） |
| 系统提示词 | docs/context/system-prompt | （不变） |
| 语音模式 | docs/features/voice-mode | （不变） |
| 深度规划 | docs/features/ultraplan | （不变） |
| 令牌预算 | docs/context/token-budget | （不变） |
| 上下文压缩 | docs/context/compaction | （不变） |
| 项目记忆 | docs/context/project-memory | （不变） |
| 自动记忆整理 | docs/features/auto-dream | （不变） |
| 穷鬼模式 | （新写） | — |
| 工具总览 | docs/tools/what-are-tools | （不变） |
| 文件操作 | docs/tools/file-operations | （不变） |
| 命令执行 | docs/tools/shell-execution | （不变） |
| 搜索导航 | docs/tools/search-and-navigation | （不变） |
| 任务管理 | docs/tools/task-management | （不变） |
| 网页搜索 | docs/features/web-search-tool | （不变） |
| 桌面自动化 | docs/features/computer-use | （不变） |
| 浏览器控制 | docs/features/claude-in-chrome-mcp | （不变） |
| 子智能体 | docs/agent/sub-agents | ← sub-agents + features/fork-subagent |
| 自定义智能体 | docs/extensibility/custom-agents | （不变） |
| 工作树隔离 | docs/agent/worktree-isolation | （不变） |
| 协调模式 | docs/agent/coordinator-and-swarm | （不变） |
| 团队记忆 | docs/features/teammem | （不变） |
| 后台会话 | docs/features/pipes-and-lan | （不变） |
| MCP 详解 | docs/extensibility/mcp | ← extensibility/mcp-protocol + extensibility/mcp-configuration + features/mcp-skills |
| 插件市场 | （新写） | — |
| Hook 钩子 | docs/extensibility/hooks | （不变） |
| Skill 技能系统 | docs/extensibility/skills | （不变） |
| Workflow 脚本 | docs/features/workflow-scripts | （不变） |
| Skill 搜索 | docs/features/experimental-skill-search | （不变） |
| 远程控制 | docs/features/remote-control | ← features/bridge-mode + features/remote-control-self-hosting |
| ACP 接入 | docs/features/acp-link | （不变） |
| 消息通道 | docs/features/channels | （不变） |
| 本地通信 | docs/features/proactive | （不变） |
| 常驻助手 | docs/features/kairos | ← features/proactive + features/kairos |
| 安全概述 | docs/safety/why-safety-matters | （不变） |
| 权限模型 | docs/safety/permission-model | （不变） |
| 沙箱 | docs/safety/sandbox | （不变） |
| Bash 检查 | docs/features/tree-sitter-bash | ← features/tree-sitter-bash + features/bash-classifier |
| 规划模式 | docs/safety/plan-mode | （不变） |
| 自动模式 | docs/safety/auto-mode | （不变） |
| 特性开关 | docs/internals/feature-flags | （不变） |
| A/B 测试与配置 | docs/internals/growthbook | ← internals/growthbook-ab-testing + internals/growthbook-adapter |
| 错误追踪 | docs/internals/sentry-setup | （不变） |
| 隐藏功能 | docs/internals/hidden-features | （不变） |
| 专属特性 | docs/internals/ant-only-world | （不变，移至开发人员） |
| 调试模式 | docs/features/debug-mode | （不变，移至开发人员） |
| Buddy 助手 | docs/features/buddy | （不变） |
| 命令分类 | docs/features/bash-classifier | （不变） |
| 可观测性 | docs/features/langfuse-monitoring | （不变） |
| 守护进程 | docs/features/daemon | （不变） |
| 自动更新 | docs/auto-updater | （不变） |
| LSP 集成 | docs/lsp-integration | （不变） |
