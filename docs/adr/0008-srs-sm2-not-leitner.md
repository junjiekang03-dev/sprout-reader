# 间隔重复用 Anki 式 SM-2,不用 Leitner 盒子

生词复习的调度从早先的 Leitner 固定盒子升级为 **Anki 式 SM-2**:每个词带独立的难度系数 ease(EF,初始 2.5、下限 1.3),下次间隔 = 当前间隔 × ease;答错则重置(明天再练)并永久调低该词的 ease。

理由:Leitner 盒子对所有词用同一套固定间隔阶梯(1/2/4/7/15 天),一个反复记不住的词每次「打回 box 1」后还是爬同样的梯子。SM-2 让「老记不住的词」ease 越来越低、间隔涨得越来越慢,而「一记就牢的词」间隔成倍拉长——逐词自适应,记忆效率更高,这是 Anki 多年验证的核心机制。

复习界面**保留「看词选释义」选择题**,而不换成 Anki 的翻卡自评:8-12 岁孩子很难诚实判断「我到底记没记住」,自评不可靠,且与「刻意做简单、不制造焦虑」的产品原则冲突;选择题低摩擦、对低龄更友好。二元对错映射成 SM-2 质量分(对→4 good、错→2 again);识别题有选项、比主动回忆容易,故答对给 4 而非满分 5,ease 不虚高。

## Consequences

- `WordbookEntry` 去掉 `box`,改加 `ease / intervalDays / reps / lapses / masteredAt`(见 `prisma/schema.prisma`)。Prisma 走 `db push`,无迁移文件。
- 「牢记/出师」(`wordsMastered`,喂徽章和萌宠成长值)从「box 到 5」改为「**成熟卡:间隔 ≥ 21 天**」(同 Anki mature 口径)。用 `masteredAt` 时间戳记录,**只设一次、永不清除**,保证 `wordsMastered` 单调,游戏化不会倒退。
- 新词以 ease 2.5(最高)入本,按 ease 升序排时会排在所有生疏词后面被饿死,故 `pickSession` 每轮保留若干新词名额(`NEW_PER_SESSION`)。
- 引擎内部按 0-5 质量分计算,留好将来接更细评分(如按作答快慢分档)的口子。
- 纯调度逻辑在 `src/lib/srs.ts`(`reviewCard / isMature / pickSession`,有单测),DB 胶水在 `src/lib/wordbook.ts`。
