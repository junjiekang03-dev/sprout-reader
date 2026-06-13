/**
 * 入级测评题库:L1-L12 各 2 题。
 * 低级别考词汇辨认(表情选项),中级别考句子理解(中文提问),
 * 高级别考英文短文理解(全英提问)——和正式阅读体验衔接。
 */

export interface PlacementItem {
  level: number;
  prompt: string;
  options: string[];
  answer: number;
}

export const PLACEMENT_BANK: PlacementItem[] = [
  { level: 1, prompt: "哪个是 “dog”?", options: ["🐶", "🐱", "🐟"], answer: 0 },
  { level: 1, prompt: "哪个是 “apple”?", options: ["🍎", "🍌", "🍰"], answer: 0 },

  { level: 2, prompt: "“The cat is black.” —— 猫是什么颜色?", options: ["黑色", "白色", "红色"], answer: 0 },
  { level: 2, prompt: "“I have a red ball.” —— 我有什么?", options: ["一个红球", "一只红鸟", "一顶红帽"], answer: 0 },

  { level: 3, prompt: "“The dog is on the bed.” —— 狗在哪里?", options: ["床上", "桌子下", "门外"], answer: 0 },
  { level: 3, prompt: "“She can fly a kite.” —— 她会做什么?", options: ["放风筝", "骑自行车", "游泳"], answer: 0 },

  { level: 4, prompt: "“Tom plays soccer at the park every day.” —— Tom 多久去一次公园?", options: ["每天", "每周一次", "从不"], answer: 0 },
  { level: 4, prompt: "“There are three birds in the tree.” —— 树上有几只鸟?", options: ["3 只", "2 只", "5 只"], answer: 0 },

  { level: 5, prompt: "“Lily wants to be a doctor when she grows up.” —— Lily 长大想做什么?", options: ["医生", "老师", "司机"], answer: 0 },
  { level: 5, prompt: "“It is raining, so we play inside.” —— 为什么在室内玩?", options: ["因为下雨", "因为天黑", "因为太热"], answer: 0 },

  { level: 6, prompt: "“Yesterday Ben walked to school because his bike was broken.” —— Ben 昨天怎么去学校?", options: ["走路", "骑车", "坐汽车"], answer: 0 },
  { level: 6, prompt: "“The baby panda fell down, but it was okay.” —— 熊猫宝宝怎么了?", options: ["摔倒了但没事", "受伤住院了", "睡着了"], answer: 0 },

  {
    level: 7,
    prompt: "Mia found a wet cat near the door. She gave it milk and a warm box. — What did Mia give the cat?",
    options: ["Milk and a warm box", "Bread and water", "A new hat"],
    answer: 0,
  },
  {
    level: 7,
    prompt: "Sam will visit his grandma next week. He wants to show her his new robot. — What will Sam show her?",
    options: ["His new robot", "His old bike", "His school bag"],
    answer: 0,
  },

  {
    level: 8,
    prompt: "Tom was reading when the lights went out. He found a small light and kept reading his book. — What was Tom doing?",
    options: ["Reading a book", "Playing a game", "Sleeping"],
    answer: 0,
  },
  {
    level: 8,
    prompt: "The little alien needed water for its spaceship, so it asked a kind boy for help. — What did the alien need?",
    options: ["Water", "Fire", "Gold"],
    answer: 0,
  },

  {
    level: 9,
    prompt: "The team was losing at first, but they kept playing together and won the match in the end. — Why did they win?",
    options: ["They played together", "They were taller", "The other team was sick"],
    answer: 0,
  },
  {
    level: 9,
    prompt: "Anna has been learning the piano for two years, and now she plays at school shows. — How long has Anna learned the piano?",
    options: ["Two years", "Two weeks", "Ten years"],
    answer: 0,
  },

  {
    level: 10,
    prompt: "If you see a baby bird on the ground, do not pick it up. Its mother is often watching nearby and will come back to help it. — What should you do?",
    options: ["Leave it and let its mother help", "Take it home quickly", "Give it some bread"],
    answer: 0,
  },
  {
    level: 10,
    prompt: "Maya has never seen snow, so she has decided to visit the north this winter with her aunt. — What has Maya decided to do?",
    options: ["Visit the north in winter", "Buy a snow toy", "Stay at home"],
    answer: 0,
  },

  {
    level: 11,
    prompt: "The old map, which was hidden in a wooden box for a hundred years, showed the way to a secret garden behind the hills. — Where does the map lead?",
    options: ["To a secret garden", "To a gold mine", "To an old school"],
    answer: 0,
  },
  {
    level: 11,
    prompt: "Although the storm was strong, the little ship reached the island safely because the captain knew these waters well. — Why did the ship arrive safely?",
    options: ["The captain knew the waters", "The storm suddenly stopped", "The island moved closer"],
    answer: 0,
  },

  {
    level: 12,
    prompt: "Scientists who study the ocean say that more than half of the world's oxygen comes from tiny sea plants, not from forests as many people believe. — Where does much of the oxygen come from?",
    options: ["Tiny sea plants", "Only big forests", "Mountain rocks"],
    answer: 0,
  },
  {
    level: 12,
    prompt: "Reading a little every day has been shown to build a larger vocabulary than studying for hours once a week. — What builds vocabulary better?",
    options: ["Reading a little every day", "Studying once a week", "Never reading at all"],
    answer: 0,
  },
];
