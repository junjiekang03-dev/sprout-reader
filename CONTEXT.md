# 芽芽阅读 SproutReader

面向中国 8-12 岁孩子的英语母语化分级阅读平台。本文件固定项目的领域语言——
代码、提交、文档、与 AI 协作时都用这里的词,避免同义词漂移。

## Language

### 分级与内容

**Level(分级)**:
平台自研的 1-15 级难度阶梯,底层锚定 CEFR + 课标词表,对外映射牛津树级别和校内年级。
_Avoid_: grade, difficulty tier, 难度等级

**Band(词表档)**:
词汇约束的档位(1-5)。每个 Level 归属一个 Band,Band 词表累积生效(Band N = 1..N 全部词表)。
_Avoid_: vocabulary list, tier, 词库

**Story(故事)**:
一篇分级读物,含正文、生词表、3 道理解题、可选预生成音频。内容的最小单位。
_Avoid_: article, lesson, passage, 课文

**Glossary(生词表)**:
一篇 Story 中超出其 Band 词表的主题生词及中文释义。生词受 newWordBudget 限制。
_Avoid_: dictionary, vocabulary, 词汇表

**Name Slot(名字槽位)**:
Story 正文里的 `{{name}}` 占位,渲染时确定性替换为孩子的英文名。是「兴趣定制」卖点的实现手段之一,不产生新 AI 内容。
_Avoid_: placeholder, variable, 变量

**Interest Track(兴趣轨道)**:
按主题(恐龙/足球/公主/宇宙/动物/魔法)组织的 Story 线。孩子只看到自己选的轨道。
_Avoid_: category, tag, genre, 分类

**Validation Gate(分级校验门禁)**:
入库前对 Story 做的程序化校验(词表归属、句长上限、生词密度、题目结构)。不通过则拒绝入库,人工不可绕过。
_Avoid_: linter, checker, 校验器

**Draft / Published(草稿 / 已发布)**:
Story 的上架状态。AI 生成 + 程序校验 + 安全审核通过后入 Draft,人工通读后才 Published 对孩子可见。
_Avoid_: status, state, 状态

### 用户与学习

**Parent(家长)**:
账号的注册主体,以手机号注册。是平台唯一的「用户」。
_Avoid_: user, account, 用户

**Child(孩子)**:
Parent 名下的子档案,只含英文昵称、级别、兴趣。不是独立账号,不收真实姓名或身份信息。
_Avoid_: student, learner, user, 学生

**Placement(入级测评)**:
新 Child 的自适应定级流程,输出建议起始 Level。
_Avoid_: test, assessment, exam, 考试

**Reading(阅读记录)**:
一次完成的「读 + 答题」记录,是打卡与统计的单位。同一天重复读同一篇只记一次。
_Avoid_: session, log, attempt, 会话

**Streak(连续打卡)**:
连续有 Reading 的天数,缺一天即断。
_Avoid_: chain, 连胜

**Level Suggestion(升降级建议)**:
基于近期 Reading 表现给出的升级或降级提示,家长/孩子可接受或忽略。
_Avoid_: recommendation, promotion, 推荐

**Weekly Report(家长周报)**:
给 Parent 的周度学习报告页(阅读量、坚持天数、正确率、级别),免登录可分享。
_Avoid_: dashboard, summary, 报表
