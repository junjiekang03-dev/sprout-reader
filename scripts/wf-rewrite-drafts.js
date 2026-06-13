export const meta = {
  name: "rewrite-similar-drafts",
  description:
    "重写 3 篇雷同 draft(dino-l6 雨天 / space-l6 新行星 / soccer-l8 守门员):分级生成 → 对抗式安全·多样性审核 → 必要时修订",
  phases: [
    { title: "Draft", detail: "按级别词表/语法约束 + 指定全新情节生成,避开同轨道已有情节" },
    { title: "Verify", detail: "对抗式审核:安全/价值观/年龄/情节多样性/性别中立/词表越界" },
    { title: "Revise", detail: "对有问题的故事按审核意见修订并复核" },
  ],
};

// ── 精确词表(由 scripts/story-prompt.ts 生成,band 累积)──────────────────
const WORDLIST_B2 =
  "a, about, afraid, after, afternoon, again, all, alone, also, always, am, an, and, angry, animal, another, answer, ant, apple, are, arm, around, as, ask, asleep, at, aunt, autumn, awake, away, baby, back, bad, bag, ball, banana, bathroom, be, bear, beautiful, because, bed, bedroom, bee, before, behind, bell, big, bike, bird, birthday, bit, black, blue, boat, body, book, box, boy, brave, bread, breakfast, breath, bright, brother, brown, bus, bush, busy, but, butterfly, buy, by, bye, cake, call, calm, can, candy, cap, car, card, carrot, carry, cat, catch, chair, chicken, child, children, city, clap, class, classmate, classroom, clean, clear, clever, climb, clock, close, cloud, cloudy, coat, cold, come, computer, cook, cool, could, count, cousin, cow, cry, cup, curious, cut, cute, dad, dance, dark, day, deep, desk, did, different, dinner, dirty, do, doctor, does, dog, doll, dolphin, door, down, draw, dress, drink, drive, driver, dry, duck, dumpling, each, ear, easy, eat, egg, eight, eighteen, elephant, eleven, evening, ever, every, eye, face, fall, family, far, farm, farmer, fast, fat, father, feel, few, fifteen, fifty, find, fine, finger, first, fish, five, floor, flower, fly, food, foot, for, forty, four, fourteen, fox, free, fresh, friday, friend, frog, from, fruit, full, fun, funny, game, garden, gate, gentle, gently, get, gift, girl, give, glad, glasses, go, good, goodbye, grandfather, grandma, grandmother, grandpa, grape, grass, gray, great, green, grey, hair, hall, hand, happy, hard, has, hat, have, he, head, hear, heart, hello, help, hen, her, here, hi, hide, high, hill, him, his, hold, home, homework, hop, horse, hospital, hot, hour, house, how, hug, hundred, hungry, i, ice, ill, in, into, is, it, its, joy, juice, jump, keep, kick, kid, kind, kitchen, kite, knee, know, lamp, land, last, laugh, learn, leg, lesson, let, letter, library, light, like, lion, listen, little, live, long, look, lost, lot, loud, love, low, lunch, make, man, many, may, me, meat, meet, might, milk, minute, mom, moment, monday, money, monkey, month, moon, more, morning, most, mother, mouse, mouth, move, much, mud, must, my, name, near, need, never, new, next, nice, night, nine, nineteen, no, noise, noodle, nose, not, now, nurse, of, off, often, oh, ok, okay, old, on, one, open, or, orange, other, our, out, panda, pants, park, party, past, pat, pear, pen, pencil, people, phone, photo, pick, picture, pig, pink, plane, play, playground, please, point, police, potato, present, pretty, pull, purple, push, put, quick, quiet, rabbit, rain, rainy, read, red, rice, ride, right, road, rock, room, rose, round, run, sad, safe, sail, same, saturday, say, scared, school, season, seat, second, see, seem, seven, seventeen, shake, shall, shark, she, sheep, shine, ship, shirt, shoe, shop, short, should, shoulder, shout, show, shy, sick, sing, sister, sit, six, sixteen, skirt, sky, sleep, sleepy, slow, small, smell, smile, smooth, snake, snow, so, sock, soft, some, sometimes, song, soon, sorry, sound, soup, speak, sport, spring, stand, star, start, stay, step, still, stop, store, street, strong, student, study, subway, summer, sun, sunday, sunny, sweater, swim, take, talk, tall, taxi, tea, teach, teacher, teeth, tell, ten, than, thank, that, the, their, them, then, there, these, they, thin, thing, think, third, thirsty, thirteen, thirty, this, those, three, throw, thursday, tiger, time, tiny, tired, to, today, together, tomato, tomorrow, too, tooth, town, toy, train, tree, true, try, tuesday, turn, turtle, twelve, twenty, two, umbrella, uncle, under, up, us, use, vegetable, very, village, visit, wait, walk, wall, want, warm, was, wash, watch, water, watermelon, wave, way, we, weak, wear, weather, wednesday, week, wet, whale, what, when, where, white, who, why, wide, will, win, wind, window, windy, wink, winter, with, wolf, woman, work, worker, would, wow, write, wrong, year, yell, yellow, yes, yesterday, you, young, your, zero, zoo";

const WORDLIST_B3 =
  "a, about, above, across, act, afraid, after, afternoon, again, ago, agree, air, alien, all, almost, alone, along, already, also, always, am, an, and, angry, animal, another, answer, ant, any, anyone, anything, apple, are, arm, around, arrive, art, as, ask, asleep, astronaut, at, aunt, autumn, awake, away, baby, back, bad, bag, ball, banana, basketball, be, beach, bear, beautiful, became, because, become, bed, bedroom, bee, before, begin, behind, believe, bell, below, beside, best, better, between, big, bike, bird, birthday, bit, black, blue, boat, body, bone, book, boring, borrow, both, bottom, box, boy, brave, bread, break, breakfast, breath, bridge, bright, bring, brother, brown, build, bus, bush, busy, but, butterfly, buy, by, bye, cake, call, calm, can, candy, cap, car, card, careful, carefully, carrot, carry, castle, cat, catch, cave, chair, change, check, chicken, child, children, choose, circle, city, clap, class, classmate, classroom, clean, clear, clever, climb, clock, close, cloud, cloudy, coach, coat, cold, collect, come, computer, cook, cool, corner, could, count, country, cousin, cow, cross, crown, cry, cup, curious, cut, cute, dad, dance, dangerous, dark, day, decide, deep, delicious, desk, did, different, dig, dinner, dinosaur, dirty, do, doctor, does, dog, doll, dolphin, door, down, dragon, draw, dream, dress, drink, drive, driver, drop, dry, duck, dumpling, each, ear, early, earth, easy, eat, egg, eight, eighteen, either, elephant, eleven, else, email, end, enjoy, even, evening, ever, every, everyone, everything, everywhere, exam, excited, exciting, explain, eye, face, fairy, fall, family, famous, far, farm, farmer, fast, fat, father, favorite, feed, feel, festival, few, field, fifteen, fifty, fight, film, finally, find, fine, finger, finish, fire, first, fish, five, fix, floor, flower, fly, follow, food, foot, football, for, forest, forget, forty, four, fourteen, fox, free, fresh, friday, friend, friendly, frog, from, front, fruit, full, fun, funny, game, garden, gate, gentle, gently, get, giant, gift, girl, give, glad, glasses, go, goal, good, goodbye, grade, grandfather, grandma, grandmother, grandpa, grape, grass, gray, great, green, grey, ground, group, grow, guess, hair, hall, hand, happen, happy, hard, has, hat, hate, have, he, head, hear, heart, heavy, hello, help, hen, her, here, herself, hi, hide, high, hill, him, himself, his, history, hold, holiday, home, homework, hop, hope, horse, hospital, hot, hotel, hour, house, how, hug, hundred, hungry, hunt, hurt, i, ice, idea, if, ill, important, in, inside, interesting, internet, into, invite, is, island, it, its, join, joy, juice, jump, just, keep, kick, kid, kind, king, kitchen, kite, knee, knight, knock, know, lake, lamp, land, language, last, late, later, laugh, lazy, leaf, learn, leave, leg, lesson, let, letter, library, lie, lift, light, lightning, like, line, lion, list, listen, little, live, long, look, lose, lost, lot, loud, love, lovely, low, lucky, lunch, machine, magic, make, man, many, map, marry, match, math, may, maybe, me, mean, meat, medal, meet, menu, message, middle, might, milk, mine, minute, miss, mom, moment, monday, money, monkey, monster, month, moon, more, morning, most, mother, mountain, mouse, mouth, move, movie, much, mud, museum, music, must, my, myself, name, near, need, never, new, news, next, nice, night, nine, nineteen, no, nobody, noise, noodle, nose, not, nothing, notice, now, nurse, of, off, often, oh, ok, okay, old, on, once, one, open, or, orange, other, our, ours, out, outside, over, page, paint, pair, panda, pants, park, part, party, pass, past, pat, pay, pear, pen, pencil, people, perhaps, phone, photo, pick, picture, piece, pig, pink, place, plan, plane, planet, plant, play, player, playground, please, point, police, poor, potato, potion, practice, prepare, present, pretty, price, prince, princess, prize, problem, promise, protect, pull, purple, push, put, queen, question, quick, quickly, quiet, rabbit, race, rain, rainbow, rainy, reach, read, ready, real, really, red, remember, rest, restaurant, return, rice, rich, ride, right, ring, river, road, robot, rock, rocket, room, rose, round, run, sad, safe, sail, same, sand, saturday, save, say, scared, school, science, sea, search, season, seat, second, see, seem, send, sentence, seven, seventeen, shake, shall, share, shark, she, sheep, shine, ship, shirt, shoe, shop, short, should, shoulder, shout, show, shy, sick, side, sign, sing, sister, sit, six, sixteen, skate, ski, skirt, sky, sleep, sleepy, slow, slowly, small, smart, smell, smile, smooth, snake, snow, so, soccer, sock, soft, some, someone, something, sometimes, song, soon, sorry, sound, soup, sour, space, spaceship, speak, special, spell, spend, sport, spring, stand, star, start, stay, step, stick, still, stone, stop, store, storm, story, street, strong, student, study, subway, suddenly, summer, sun, sunday, sunny, sure, surprise, surprised, sweater, sweet, swim, sword, take, talk, tall, taste, taxi, tea, teach, teacher, team, teeth, tell, ten, tennis, test, than, thank, that, the, their, theirs, them, then, there, these, they, thin, thing, think, third, thirsty, thirteen, thirty, this, those, three, through, throw, thunder, thursday, ticket, tidy, tiger, time, tiny, tired, to, today, together, tomato, tomorrow, too, tooth, top, touch, tower, town, toy, train, travel, treasure, tree, trip, true, try, tuesday, turn, turtle, twelve, twenty, two, umbrella, uncle, under, understand, until, up, upon, us, use, vegetable, very, village, visit, voice, wait, wake, walk, wall, want, warm, was, wash, watch, water, watermelon, wave, way, we, weak, wear, weather, wednesday, week, welcome, well, wet, whale, what, when, where, while, white, who, whole, why, wide, will, win, wind, window, windy, wink, winner, winter, wish, with, wizard, wolf, woman, wonderful, wood, word, work, worker, world, worry, worse, worst, would, wow, write, wrong, year, yell, yellow, yes, yesterday, yet, you, young, your, yours, zero, zoo";

const THEME = {
  dinosaurs: [
    "dinosaur",
    "dino",
    "egg",
    "bone",
    "roar",
    "tail",
    "claw",
    "scale",
    "fossil",
    "rex",
    "hatch",
  ],
  space: [
    "rocket",
    "moon",
    "star",
    "planet",
    "alien",
    "robot",
    "spaceship",
    "astronaut",
    "earth",
    "orbit",
    "comet",
    "galaxy",
    "telescope",
    "space",
  ],
  soccer: [
    "soccer",
    "goal",
    "kick",
    "team",
    "match",
    "ball",
    "player",
    "score",
    "field",
    "net",
    "coach",
    "cheer",
    "whistle",
    "pass",
  ],
};

const SPECS = [
  {
    key: "dino-l6",
    interest: "dinosaurs",
    levelId: 6,
    band: 2,
    wordList: WORDLIST_B2,
    theme: THEME.dinosaurs,
    wordCount: [120, 190],
    maxSentence: 10,
    maxNewRatio: 0.04,
    maxGlossaryTheme: 4,
    grammar: "一般过去时(规则动词);and/but 并列句;because 表原因",
    slug: "dinosaurs-l6-the-rainy-day",
    title: "{{name}} and the Rainy Day",
    premise: `主角 {{name}} 和一只恐龙好朋友本想在公园玩,可天忽然下起大雨。这只恐龙很大,它张开身体、用大大的尾巴(tail)给 {{name}} 和公园里躲雨的小动物(比如一只小鸭子 duck、一只小兔子 rabbit)挡雨,就像一把大伞(umbrella)。大家挤在恐龙身下,一起开心地等雨停。雨停后太阳出来了,他们在软软的泥地(mud)上又笑又跳地玩。情感落点:朋友的守护、善意、计划被打乱也能找到新乐趣;结尾温暖不说教。
用词提示(L6=band2):rain/rainy/wet/dry/umbrella/mud/duck/rabbit/tail 都在词表或主题词内,可直接用;"rainbow 彩虹" 不在本级词表——若想写彩虹,必须把 rainbow 收进 glossary(出现一次即可),否则就别写、改成"the sun came out";不要用 puddle 这类词表外的词。`,
    banned: `以下是【恐龙轨道】已有故事的情节,新故事绝不能与任何一条雷同或近似:
1) L3《The Big Egg》:公园里发现一个大蛋,蛋孵出小恐龙找妈妈,恐龙妈妈出现,小恐龙跑向妈妈。
2) L3《Where Is Rex》:{{name}} 的玩具恐龙 Rex 不见了,在房间到处找,最后在床上和狗一起找到。
3) L5《and the Baby Dinosaur》:公园里大蛋孵出小恐龙,小恐龙想找妈妈,一起走到小山找到恐龙妈妈团聚。
4) (本篇要替换的旧稿)公园里听到哭声,灌木后有迷路的小剑龙,走了很久,在大树旁找到恐龙妈妈团聚。
5) L7《The Dinosaur Museum》:周日和爸爸去恐龙博物馆,看霸王龙,挖化石,找到一块骨头。
绝对禁止再写:孵蛋、迷路宝宝找/团聚妈妈、找丢失的玩具、去博物馆挖化石。本篇必须是【雨天大恐龙用身体和尾巴帮大家挡雨】这个全新情节。`,
  },
  {
    key: "space-l6",
    interest: "space",
    levelId: 6,
    band: 2,
    wordList: WORDLIST_B2,
    theme: THEME.space,
    wordCount: [120, 190],
    maxSentence: 10,
    maxNewRatio: 0.04,
    maxGlossaryTheme: 4,
    grammar: "一般过去时(规则动词);and/but 并列句;because 表原因",
    slug: "space-l6-the-new-planet",
    title: "{{name}} and the New Planet",
    premise: `主角 {{name}} 坐着火箭(rocket)飞过月亮(moon),发现了一颗从来没有人见过的新行星(planet)。这颗行星很特别:上面开满了各种颜色的花(flower),草(grass)软软的(soft),小石头(rock)会轻轻发光(shine/bright)。{{name}} 在花丛和软软的小山(hill)间又跑又跳,玩得特别开心,还捡到会发光的小石头。最后 {{name}} 给这颗自己发现的行星起了一个名字(体现"这是我发现的、属于我的")。情感落点:好奇心、探索、发现并命名属于自己的东西的喜悦;结尾温暖。
用词提示(L6=band2):rocket/moon/planet/star/space 是主题词可直接用;flower/grass/soft/shine/bright/hill/rock/jump/run/name 都在词表内;不要用 bounce/bouncy(词表外);不要用 stone(用 rock)。`,
    banned: `以下是【太空轨道】已有故事的情节,新故事绝不能与任何一条雷同或近似:
1) L3《Go to the Moon》:{{name}} 拿着玩具火箭在家假装飞去月亮,爸爸喊去睡觉。
2) L4《and the Moon Rocket》:夜空里一艘火箭飞向月亮,一个友好的机器人招手,{{name}} 爬上火箭,在月球上跳,看到地球像蓝色的球,机器人送 {{name}} 一颗小星星,一起飞回家。
3) L5《and the Little Star》:{{name}} 用望远镜看到一颗伤心、暗淡的小星星不会发光,鼓励它"再试试",星星亮了,成为朋友。
4) (本篇要替换的旧稿){{name}} 用箱子做火箭飞过月亮,遇到一颗丢了光的伤心小星星,在云后面找到光还给它,星星重新发光。
5) L8《The Red Star》:生日收到望远镜,一颗红星其实是外星人 Pip 的飞船,飞船需要水,{{name}} 拿水帮它,成为朋友。
绝对禁止再写:帮伤心/暗淡的星星发光、单纯去月球旅行、遇到机器人同伴、帮外星人取水/资源、在家用玩具火箭假装。本篇必须是【发现一颗开满花、会发光的新行星并给它命名】这个全新情节。`,
  },
  {
    key: "soccer-l8",
    interest: "soccer",
    levelId: 8,
    band: 3,
    wordList: WORDLIST_B3,
    theme: THEME.soccer,
    wordCount: [180, 270],
    maxSentence: 12,
    maxNewRatio: 0.035,
    maxGlossaryTheme: 5,
    grammar: "be going to;情态动词 should/must;when 时间状语从句(简单)",
    slug: "soccer-l8-the-goalkeeper",
    title: "{{name}} the Goalkeeper",
    premise: `主角 {{name}} 平时不是守门员,但今天球队的守门员生病了,轮到 {{name}} 去守球门(play in goal)。{{name}} 很紧张,心里想"我必须挡住球(I must stop the ball)"。比赛(match)进行中,比分接近;快结束时对方球员带球冲来,眼看就要进球了(The other team is going to score)。就在球飞向球门的那一刻(When the ball came...),{{name}} 鼓起勇气跳起来把球接住/挡住(jump + catch,做出一次 save),守住了球队!队友们围过来为 {{name}} 欢呼(cheer)。情感落点:每个位置都很重要、在陌生的新角色里鼓起勇气。
【关键】高潮必须是 {{name}} 做出一次扑救/挡球(a save),绝对不是 {{name}} 自己踢进一个球。
用词提示(L8=band3):goal/kick/team/match/ball/player/score/net/coach/cheer/whistle/pass 是主题词;save/catch/jump/strong/brave/quick/ready/should/must/ground 都在词表内;"goalkeeper 守门员" 不在词表——正文若用就收进 glossary,或直接用 "play in goal" 表达。务必自然地用到这三类语法:be going to、should/must、when 时间状语从句。`,
    banned: `以下是【足球轨道】已有故事的情节,新故事绝不能与任何一条雷同或近似:
1) L4《The Big Kick》:{{name}} 和朋友 Lily、Ben 在公园踢小比赛,{{name}} 把球踢进得分,朋友欢呼。
2) L5《The Big Game》:比赛中 {{name}} 把球传丢很沮丧,对方领先,再试一次,把球踢进得分,大家开心。
3) L7《and the Big Goal》:{{name}} 踢不远,一位老人教"盯住球",每天苦练,大赛打平、最后时刻球到 {{name}} 脚下踢进制胜球。
4) (本篇要替换的旧稿){{name}} 不擅长进球被同学嘲笑,每天苦练,周六大赛 0-0,球到脚下踢进,球队获胜。
5) L9《The Big Match》:{{name}} 是蓝队队长,讲团队配合,对阵 Red Stars,下雨,传给 Mia 进球,最后 {{name}} 进球,因团队配合获胜,发奖牌。
绝对禁止再写:{{name}} 苦练后踢进制胜/关键进球、在比赛里踢进球得分、当队长靠团队配合夺冠。本篇高潮必须是【{{name}} 当守门员做出关键扑救】而不是进球。`,
  },
];

function buildDraft(spec) {
  return `你是一位专业英语分级读物作者,为中国 8-12 岁孩子写「母语化可理解输入」故事。请创作 1 篇【${spec.interest} 主题、平台 Level ${spec.levelId}】的英文短故事。

# 指定情节(必须严格按这个全新情节写)
${spec.premise}

# 必须避开的已有情节(雷同即不合格)
${spec.banned}

# 硬性约束(程序会逐条校验,违反即退回)
1. 词数:${spec.wordCount[0]}-${spec.wordCount[1]} 个英文单词({{name}} 计为 1 个词)。
2. 句长:任何一句不超过 ${spec.maxSentence} 个单词。短句为主,适合朗读。
3. 词汇:正文与题目只能用「下方允许词表」里的词(可用其常规屈折:复数/过去式/进行时/比较级/所有格)。
4. 主题生词例外:最多 ${spec.maxGlossaryTheme} 个词表外的本主题生词,每个必须写进 glossary 并给中文释义;生词总出现次数 ≤ 全文词数的 ${Math.round(spec.maxNewRatio * 100)}%。下面「本轨道主题词」无需进 glossary、不算生词,可直接用。
5. 语法只用:${spec.grammar}。
6. 主角名一律写作 {{name}}(两层花括号),平台会替换成任意孩子的英文名。
   ⚠️ 因为 {{name}} 可能是男孩也可能是女孩,正文里【绝对不要】用 he/she/him/her/his/himself/herself 指代 {{name}}——一律用 {{name}} 或 {{name}}'s,或换成中性说法。其他配角可以有性别。
7. 配角名/地名可自创但要简单好读。

# 内容红线
- 不出现暴力细节、恐怖、死亡威胁、歧视、政治、宗教。
- 价值观积极;有起因-经过-结果;结尾温暖或有趣,【不要说教】。

# 3 道理解题
- 单选,每题 3 个选项,考查情节理解(不考语法);题干与选项不超出词表。
- ⚠️ 正确答案 answer 下标不要总是 0,请在 0/1/2 之间分布。

# 本轨道主题词(免进 glossary、不算生词,可直接用)
${spec.theme.join(", ")}

# 允许词表(band 1-${spec.band} 累积;正文/题目只能用「这些词 + 上面主题词 + 你写进 glossary 的生词」)
${spec.wordList}

# 输出
返回 story 对象:slug="${spec.slug}",title="${spec.title}",levelId=${spec.levelId},interest="${spec.interest}",text 为正文(段落用 \\n\\n 分隔),glossary 为生词数组,questions 为 3 道题。
正文要自然、有画面感、像真正的儿童绘本,而不是堆砌词表。先在心里数一遍词数和每句词数再输出。`;
}

function buildVerify(spec, story) {
  return `你是一位严格的儿童内容审核员 + 分级校验预检员。对下面这篇面向中国 8-12 岁孩子的英语分级故事做对抗式审查——默认挑刺,宁严勿松。

# 待审故事(JSON)
${JSON.stringify(story)}

# 本篇【应有】的情节(必须就是这个,不能跑偏成别的)
${spec.premise}

# 必须避开的已有情节
${spec.banned}

# 逐项给出布尔判断(发现任何问题就把该项置 false 并把具体问题写进 issues):
- safe:无暴力/恐怖/死亡威胁/歧视/政治/宗教。
- valuesPositive:价值观积极,不说教。
- ageAppropriate:适合 8-12 岁,温暖有趣。
- distinctFromExisting:与上面任何一条已有情节都【不】雷同/近似(尤其不能是"帮迷路宝宝团聚""帮星星发光""苦练后踢进制胜球"等被禁模板);只要沾边就置 false 并在 issues 说明撞了哪条。
- genderNeutral:正文【没有】用 he/she/him/her/his/himself/herself 指代主角 {{name}}。把发现的违例词放进 issues。
- likelyInBand:正文与题目里的词,看起来都在 band 1-${spec.band} 词表 + 本主题词 + glossary 之内。把你认为可能超纲、又没进 glossary 的实义词放进 suspiciousWords(忽略 {{name}} 和自创专有名词)。
- wordCountOk:正文词数在 ${spec.wordCount[0]}-${spec.wordCount[1]} 之间(自己数,{{name}} 算 1 词)。
- sentenceLenOk:没有任何一句超过 ${spec.maxSentence} 个单词。
- issues:列出所有具体问题(空数组=没问题)。

# 参考:本主题词(不算超纲)
${spec.theme.join(", ")}
# 参考:允许词表(band 1-${spec.band})
${spec.wordList}

只输出 verdict 对象。`;
}

function buildRevise(spec, story, verdict) {
  return `下面这篇分级故事审核没通过。请在【保持指定情节不变】的前提下,修正所有问题,重新产出完整 story 对象。

# 原故事(JSON)
${JSON.stringify(story)}

# 审核发现的问题(逐条修正)
${(verdict.issues || []).join("\n") || "(见下方可能超纲词)"}
可能超纲、需要换成词表内的词或收进 glossary 的词:${(verdict.suspiciousWords || []).join(", ") || "无"}

# 必须保持的情节
${spec.premise}

# 约束(与生成时相同,逐条复核)
- 词数 ${spec.wordCount[0]}-${spec.wordCount[1]};任何一句 ≤ ${spec.maxSentence} 个单词;语法只用:${spec.grammar}。
- 只用允许词表 + 主题词 + glossary 生词;生词出现次数 ≤ ${Math.round(spec.maxNewRatio * 100)}%;最多 ${spec.maxGlossaryTheme} 个主题生词进 glossary。
- 绝不用 he/she/him/her/his 指代 {{name}}。
- slug="${spec.slug}", title="${spec.title}", levelId=${spec.levelId}, interest="${spec.interest}"。
- 3 道题,正确答案下标在 0/1/2 间分布。

# 本轨道主题词
${spec.theme.join(", ")}
# 允许词表(band 1-${spec.band})
${spec.wordList}

只输出修正后的完整 story 对象。`;
}

const STORY_SCHEMA = {
  type: "object",
  properties: {
    slug: { type: "string" },
    title: { type: "string" },
    levelId: { type: "number" },
    interest: { type: "string" },
    text: { type: "string" },
    glossary: {
      type: "array",
      items: {
        type: "object",
        properties: { word: { type: "string" }, zh: { type: "string" } },
        required: ["word", "zh"],
      },
    },
    questions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          prompt: { type: "string" },
          options: { type: "array", items: { type: "string" } },
          answer: { type: "number" },
        },
        required: ["prompt", "options", "answer"],
      },
    },
  },
  required: ["slug", "title", "levelId", "interest", "text", "glossary", "questions"],
};

const VERDICT_SCHEMA = {
  type: "object",
  properties: {
    safe: { type: "boolean" },
    valuesPositive: { type: "boolean" },
    ageAppropriate: { type: "boolean" },
    distinctFromExisting: { type: "boolean" },
    genderNeutral: { type: "boolean" },
    likelyInBand: { type: "boolean" },
    wordCountOk: { type: "boolean" },
    sentenceLenOk: { type: "boolean" },
    suspiciousWords: { type: "array", items: { type: "string" } },
    issues: { type: "array", items: { type: "string" } },
  },
  required: [
    "safe",
    "valuesPositive",
    "ageAppropriate",
    "distinctFromExisting",
    "genderNeutral",
    "likelyInBand",
    "wordCountOk",
    "sentenceLenOk",
    "suspiciousWords",
    "issues",
  ],
};

function isClean(v) {
  return (
    v &&
    v.safe &&
    v.valuesPositive &&
    v.ageAppropriate &&
    v.distinctFromExisting &&
    v.genderNeutral &&
    v.likelyInBand &&
    v.wordCountOk &&
    v.sentenceLenOk &&
    (v.suspiciousWords?.length ?? 0) === 0 &&
    (v.issues?.length ?? 0) === 0
  );
}

const results = await pipeline(
  SPECS,
  (spec) =>
    agent(buildDraft(spec), { label: `draft:${spec.key}`, phase: "Draft", schema: STORY_SCHEMA }),
  (story, spec) =>
    agent(buildVerify(spec, story), {
      label: `verify:${spec.key}`,
      phase: "Verify",
      schema: VERDICT_SCHEMA,
    }).then((verdict) => ({ story, verdict })),
  (sv, spec) => {
    if (!sv || !sv.story) return null;
    if (isClean(sv.verdict))
      return {
        key: spec.key,
        slug: spec.slug,
        story: sv.story,
        verdict: sv.verdict,
        revised: false,
      };
    log(`${spec.key} 初稿有问题,进入修订:${(sv.verdict.issues || []).join(" | ").slice(0, 160)}`);
    return agent(buildRevise(spec, sv.story, sv.verdict), {
      label: `revise:${spec.key}`,
      phase: "Revise",
      schema: STORY_SCHEMA,
    }).then((revised) =>
      agent(buildVerify(spec, revised), {
        label: `reverify:${spec.key}`,
        phase: "Revise",
        schema: VERDICT_SCHEMA,
      }).then((rv) => ({
        key: spec.key,
        slug: spec.slug,
        story: revised,
        verdict: rv,
        revised: true,
      }))
    );
  }
);

return results.filter(Boolean);
