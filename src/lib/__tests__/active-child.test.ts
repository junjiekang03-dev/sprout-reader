import { describe, it, expect } from "vitest";
import { resolveActiveChild } from "../active-child";

/**
 * 多孩子档案的活跃孩子解析(BACKLOG#4)。纯函数门禁。
 * 决定一次请求里「当前是哪个孩子」:命中 cookie 里的 activeId 用它,否则回退第一个。
 */
describe("活跃孩子解析 resolveActiveChild", () => {
  const kids = [{ id: "a" }, { id: "b" }, { id: "c" }];

  it("空列表返回 null", () => {
    expect(resolveActiveChild([], "a")).toBeNull();
  });

  it("activeId 命中时返回该孩子", () => {
    expect(resolveActiveChild(kids, "b")).toEqual({ id: "b" });
  });

  it("activeId 不在列表里时回退到第一个(切换了设备 / cookie 失效)", () => {
    expect(resolveActiveChild(kids, "zzz")).toEqual({ id: "a" });
  });

  it("activeId 缺省时回退到第一个", () => {
    expect(resolveActiveChild(kids, undefined)).toEqual({ id: "a" });
  });
});
