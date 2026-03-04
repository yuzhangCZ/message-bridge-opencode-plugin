# ADR（Architecture Decision Records）说明

Doc Version: v1.0
Last Updated: 2026-03-04

## Purpose（目的）
记录重大架构决策，保证后续演进可追溯、可审计、可回滚。

## Scope（范围）
适用于以下变更：
- 对外接口契约调整。
- 核心流程分支变更（入站、回流、代理、文件链路）。
- 状态模型、容错策略、兼容策略变更。

## Interface/Flow Definition（定义）
命名规则：`NNNN-title.zh.md`（例如 `0001-doc-governance.zh.md`）

必填章节：
1. 背景（Context）
2. 决策（Decision）
3. 备选方案（Alternatives）
4. 影响（Consequences）
5. 回滚策略（Rollback）

## Examples（调用示例 + 报文示例）
最小 ADR 模板请参考：
- [0001-doc-governance.zh.md](/Users/zy/Code/opencode/message-bridge-opencode-plugin/docs/architecture/adr/0001-doc-governance.zh.md)

## Failure Modes（失败场景）
- 未记录 ADR 的重大变更会导致架构漂移与知识断层。

## Compatibility（兼容性）
- ADR 为文档治理机制，对运行时无影响。

## Open Questions（未决事项）
- 是否需要增加 ADR 审批状态字段（Draft/Accepted/Superseded）。
