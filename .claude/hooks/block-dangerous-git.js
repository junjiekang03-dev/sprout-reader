#!/usr/bin/env node
/**
 * PreToolUse 护栏:在危险 git 命令执行前拦截(退出码 2 = 阻断并把 stderr 回传给模型)。
 *
 * 跨平台(Node 实现,不依赖 bash/jq),适配 Windows。
 * 注意:此钩子匹配 Claude Code 的 "Bash" 工具调用。本机环境里 Claude 主要用
 * PowerShell 工具跑 git,PowerShell 工具不被 "Bash" matcher 拦截——该钩子主要
 * 防护通过 Bash 工具发出的危险命令,以及作为多一层保险。
 */

const DANGEROUS = [
  /\bgit\s+push\b/,
  /\bgit\s+reset\s+--hard\b/,
  /\bgit\s+clean\s+-[a-z]*f/,
  /\bgit\s+branch\s+-D\b/,
  /\bgit\s+checkout\s+\.(\s|$)/,
  /\bgit\s+restore\s+\.(\s|$)/,
  /push\s+--force/,
  /--force-with-lease/,
  /\bgit\s+reflog\s+delete\b/,
];

let raw = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (c) => (raw += c));
process.stdin.on("end", () => {
  let command = "";
  try {
    // 去掉可能的 BOM(某些 shell 管道会在 UTF-8 前加 ﻿)
    command = JSON.parse(raw.replace(/^﻿/, ""))?.tool_input?.command ?? "";
  } catch {
    // 解析失败时放行,绝不因钩子自身故障阻断正常工作
    process.exit(0);
  }
  for (const re of DANGEROUS) {
    if (re.test(command)) {
      process.stderr.write(
        `BLOCKED: "${command}" 命中危险 git 模式 ${re}. 用户已禁止你执行此类命令。` +
          `如确需推送/重置,请由用户本人手动执行。\n`
      );
      process.exit(2);
    }
  }
  process.exit(0);
});
