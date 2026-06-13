# 开发用 SQLite、生产用 Postgres;结构化字段以 JSON 字符串存储

开发环境用 SQLite(零安装),生产切换 Postgres——同一份 Prisma schema,只改 provider。`glossary` / `questions` / `interests` 等结构化字段统一以 JSON **字符串**存储,而非 Prisma 的 `Json` 标量,应用层负责解析。

理由:SQLite 不支持 Prisma 的 `Json` 标量。用 String 存储让同一份 schema 在 SQLite 与 Postgres 之间完全可移植,代价是应用层多一步 `JSON.parse`。对一个独立开发者的 MVP,「本地零依赖起步、部署一行切换」的价值远超这点解析成本。

## Consequences

- 这些字段无法用数据库层的 JSON 查询,但本项目从不按 glossary/questions 内容查询,无影响。
- 切到 Postgres 时,把 `provider` 改成 `postgresql`、跑一次迁移即可,代码零改动。
