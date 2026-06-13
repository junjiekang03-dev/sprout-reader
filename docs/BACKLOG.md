# Backlog(二期)

二期工作按 **tracer-bullet 垂直切片** 拆分:每个切片是一条贯穿 schema/API/UI/测试的完整薄路径,可独立验证。无远程 issue tracker,故落本地;接入 tracker 后可逐条搬运。

类型:**AFK** = 可无人值守实现并合并;**HITL** = 需人工决策(资质/合规/定价/数据)。

术语见 [CONTEXT.md](../CONTEXT.md),决策见 [docs/adr/](adr/)。

---

## 1. 入级测评题库扩充到每级 4+ 题 · AFK ✅ 已完成

**What**:把 **Placement** 题库从每级 2 题扩到 4+ 题,降低单题偶然性对定级的影响。

**Acceptance**

- [x] L1-L12 每级 ≥4 题,题型分布同现状(共 48 题,不变量测试守护)
- [x] 自适应选题不重复(`pickItem` 用 used 集合;测试断言同级题干/选项不重复)
- [x] 降低单题作答的敏感度:每级 4 题 + 选项乱序(正确答案不再恒在第一个)。定量稳定性回归留后续观察

**Blocked by**:None

---

## 2. 内容批量生成接入 API · AFK

**What**:把现在「手动跑 Workflow → 导出 → import-generated」的内容管线接成可重复脚本/后台任务,直接调模型 API 批量产出 → 程序校验 → 落 **Draft**。

**Acceptance**

- [ ] 一条命令完成「生成 N 篇 → 校验 → 写入 draft」
- [ ] 复用现有 `validateStory` 门禁与主题词豁免
- [ ] 产出率、拒绝原因有统计输出

**Blocked by**:None(已有 Workflow 与 import 脚本作基础)

---

## 3. 升降级建议落到孩子档案的自动微调 · AFK

**What**:**Level Suggestion** 目前要手动点「接受」。增加可选的「自动跟随」开关,连续命中升/降条件时自动微调一级并通知家长。

**Acceptance**

- [ ] 家长可开关「自动调级」
- [ ] 自动调级有记录与撤销
- [ ] 复用现有 `suggestLevelChange` 纯逻辑(已有测试)

**Blocked by**:None

---

## 4. 多孩子档案 · AFK

**What**:一个 **Parent** 支持多个 **Child**(现为一个)。主页加孩子切换。

**Acceptance**

- [ ] 家长可建多个孩子档案
- [ ] 阅读/打卡/周报按孩子隔离
- [ ] 切换孩子后推荐、统计正确

**Blocked by**:None

---

## 5. TTS 预生成接入对象存储 + CDN · HITL

**What**:跑 `tts-generate` 把音频上传 COS/OSS + CDN,`audioUrl` 指向 CDN,阅读器优先用预生成音频。

**Acceptance**

- [ ] 已发布 Story 都有预生成音频
- [ ] 阅读器优先用 `audioUrl`,无则回退 Web Speech
- [ ] 音频不进 git(已 gitignore)

**Blocked by**:HITL — 选 TTS 供应商(Azure/MiniMax)与对象存储,需账号与计费决策

---

## 6. 微信支付 + 年度会员 · HITL

**What**:Freemium 付费墙——免费每天 1-2 篇,会员解锁无限阅读 + 周报。接微信支付下单与会员状态。

**Acceptance**

- [ ] 免费/会员的内容边界生效
- [ ] 微信支付下单、回调、开通会员闭环
- [ ] 会员到期与续费提醒

**Blocked by**:HITL — 需个体户执照 → 微信支付商户号;定价最终拍板(见 README 200-400 元/年)

---

## 7. 微信服务号周报推送 · HITL

**What**:**Weekly Report** 目前靠分享链接。接服务号模板消息,每周日晚自动推送本周报告链接给家长。

**Acceptance**

- [ ] 家长关注服务号并绑定
- [ ] 每周定时推送周报链接
- [ ] 退订与频率控制

**Blocked by**:HITL — 需服务号认证(依赖执照);依赖 #6 的家长绑定体系更顺

---

## 8. 微信小程序 web-view 套壳 · HITL

**What**:用小程序 web-view 套壳现有 H5,作为获客与分享裂变入口(见 [ADR-0006](adr/0006-mobile-web-first-miniprogram-later.md))。

**Acceptance**

- [ ] 小程序内可走完核心闭环
- [ ] 分享卡片走小程序原生分享
- [ ] 登录态在套壳内打通

**Blocked by**:HITL — 小程序类目资质(教育类审核严);业务域名备案

---

## 9. 跟读录音 + 发音评测 · HITL

**What**:读完可跟读一段,语音评测打分。差异化强但技术与合规复杂。

**Acceptance**

- [ ] 录音权限与未成年人声音数据的合规处理
- [ ] 评测打分与重试
- [ ] 评测结果进周报

**Blocked by**:HITL — 选评测 API;未成年人声音数据采集/存储的合规决策(最重)

---

## 10. 生词本 + 间隔复习 · AFK

**What**:孩子查过的词进生词本,按间隔重复算法安排复习(选词卡/小测)。

**Acceptance**

- [ ] 查词自动进生词本
- [ ] 间隔复习排程
- [ ] 复习不打断每日阅读主线

**Blocked by**:None
