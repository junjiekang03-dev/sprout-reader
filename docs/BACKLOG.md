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

## 2. 内容批量生成接入 API · AFK ✅ 已完成(2026-06-14)

**What**:把现在「手动跑 Workflow → 导出 → import-generated」的内容管线接成可重复脚本/后台任务,直接调模型 API 批量产出 → 程序校验 → 落 **Draft**。

**Acceptance**

- [x] 一条命令完成「生成 N 篇 → 校验 → 写入 draft」(`npm run content:generate`,见 `scripts/generate-content.ts`;直连 Claude API,默认 `claude-opus-4-8`,结构化 JSON Schema 输出)
- [x] 复用现有 `validateStory` 门禁与主题词豁免(运行器逐篇过 `validateStory` 才落 draft,slug 程序重建去重)
- [x] 产出率、拒绝原因有统计输出(结尾打印产出率 + 按校验错误分类的退回原因)
- [x] **情节多样性约束**(2026-06-13 完成):生成时自动提供「同轨道已有情节摘要」让模型避开雷同。每篇故事加 `summary` 情节弧梗概字段;`src/lib/story-corpus.ts` 的 `buildAvoidSection`(有单测)按轨道汇总梗概并排除自身,`story-prompt.ts` 注入 prompt、`gen-targets.ts` 随 target 输出 `avoidPlots`、`import-generated.ts` 携带模型产出的 summary 形成闭环。起因:首批批量产出里同一兴趣轨道相邻级别套用了相同情节模板(帮迷路小动物找妈妈 / 帮小星星发光 / 苦练后大赛进球)

**待重写 → ✅ 已重写并发布(2026-06-13)**:用 Workflow 喂「同轨道全部已有情节摘要 + 必须避开」生成,过分级校验 + 对抗式安全/多样性审核,人工通读后发布,均已生成童声(Ana)音频:

- ~~`dinosaurs-l6-and-the-little-dino`~~ → `dinosaurs-l6-the-rainy-day`(雨天大恐龙用尾巴当伞护住 {{name}} 和小动物)
- ~~`space-l6-and-the-little-star`~~ → `space-l6-the-new-planet`(发现并命名一颗开满花、会发光的新行星;slug+标题已换)
- ~~`soccer-l8-and-the-big-match`~~ → `soccer-l8-the-goalkeeper`(临危当门将做出关键扑救,而非进球)

> 旧 slug 的 draft 行已用新增的 `scripts/delete-stories.ts` 从库中清除。
> ✅「同轨道情节去重」已固化进生成脚本(见上「情节多样性约束」)。
> ✅ 一条命令直连 API 已落地:prompt 组装抽到 `src/lib/story-prompt-builder.ts`(CLI/API 共用),`scripts/generate-content.ts` 用官方 `@anthropic-ai/sdk` + 结构化 JSON Schema 产出 → 校验 → 落 draft。需在 `.env` 配 `ANTHROPIC_API_KEY`;落 draft 后仍须人工在 `/admin` 通读发布(第 3 层不可省)。后续可选优化:Batches API(半价)、prompt caching 缓存词表。

**Blocked by**:None(已有 Workflow 与 import 脚本作基础)

---

## 3. 升降级建议落到孩子档案的自动微调 · AFK ✅ 已完成(2026-06-13)

**What**:**Level Suggestion** 目前要手动点「接受」。增加可选的「自动跟随」开关,连续命中升/降条件时自动微调一级并通知家长。

**Acceptance**

- [x] 家长可开关「自动调级」(`Child.autoFollowLevel` + 主页开关 `setAutoFollowLevel`;开启时主页隐藏手动横幅)
- [x] 自动调级有记录与撤销(新增 `LevelChange` 表;主页显示最近一次自动调级 + 撤销 `undoLevelChange` 还原级别)
- [x] 复用现有 `suggestLevelChange` 纯逻辑(新增纯函数 `decideAutoLevelChange` 包一层门禁,6 个单测;在阅读提交 `POST /api/readings` 时触发)

**实现要点**:在阅读提交(性能数据到达的唯一时刻)而非主页渲染时自动调级,避免 RSC 副作用;`decideAutoLevelChange` 防御性只接受 ±1 且不越界。不做防抖——调级后新级别尚无样本,`suggestLevelChange` 攒够前不会再触发,天然避免横跳。preview 端到端验证:开开关→读达标→自动升 L4→撤销还原 L3。

**Blocked by**:None

---

## 4. 多孩子档案 · AFK ✅ 已完成(2026-06-13)

**What**:一个 **Parent** 支持多个 **Child**(现为一个)。主页加孩子切换。

**Acceptance**

- [x] 家长可建多个孩子档案(去掉 `createChild` 单孩子守卫,上限 `MAX_CHILDREN=6`;主页「＋添加孩子」入口)
- [x] 阅读/打卡/周报按孩子隔离(各表本就以 childId 为键;请求级别用「活跃孩子」解析,8 处 `children[0]` 全部改用 `getActiveChild`)
- [x] 切换孩子后推荐、统计正确(`ChildSwitcher` + `switchChild` 设 cookie;preview 验证:Leo L3/streak5 ↔ 新建 Mia L1/streak0 完全隔离)

**实现要点**:活跃孩子记在 cookie(`sprout_active_child`,按设备),纯函数 `resolveActiveChild`(命中用它 / 否则回退第一个,4 个单测)+ `getActiveChild` 读 cookie;无需加 schema 字段。新建孩子自动设为活跃并去入级测评。

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
