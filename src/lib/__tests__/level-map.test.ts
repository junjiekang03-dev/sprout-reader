import { describe, it, expect } from "vitest";
import { buildLevelMap, TOTAL_LEVELS } from "../level-map";

describe("成长地图 buildLevelMap", () => {
  it("总是输出 15 个节点,按级别升序 L1→L15", () => {
    const map = buildLevelMap({ currentLevel: 3 });
    expect(map.nodes).toHaveLength(TOTAL_LEVELS);
    expect(map.nodes.map((n) => n.level.id)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
    ]);
  });

  it("状态三分:低于当前=已通过 / 等于=当前 / 高于=未解锁", () => {
    const map = buildLevelMap({ currentLevel: 3 });
    expect(map.nodes[0].status).toBe("cleared"); // L1
    expect(map.nodes[1].status).toBe("cleared"); // L2
    expect(map.nodes[2].status).toBe("current"); // L3
    expect(map.nodes[3].status).toBe("locked"); // L4
    expect(map.nodes[14].status).toBe("locked"); // L15
    expect(map.clearedCount).toBe(2);
    expect(map.currentLevel).toBe(3);
    expect(map.current.id).toBe(3);
  });

  it("L1 新手:没有已通过的关,L1 即当前", () => {
    const map = buildLevelMap({ currentLevel: 1 });
    expect(map.clearedCount).toBe(0);
    expect(map.nodes[0].status).toBe("current");
    expect(map.nodes.filter((n) => n.status === "cleared")).toHaveLength(0);
  });

  it("L15 顶级:前 14 关全通过,无未解锁", () => {
    const map = buildLevelMap({ currentLevel: 15 });
    expect(map.clearedCount).toBe(14);
    expect(map.nodes[14].status).toBe("current");
    expect(map.nodes.filter((n) => n.status === "locked")).toHaveLength(0);
  });

  it("已读/已发布篇数按级别映射,缺省为 0", () => {
    const map = buildLevelMap({
      currentLevel: 3,
      readByLevel: { 3: 2 },
      storyByLevel: { 3: 3, 4: 6 },
    });
    expect(map.nodes[2].readCount).toBe(2); // L3 读了 2
    expect(map.nodes[2].storyCount).toBe(3); // L3 共 3
    expect(map.nodes[3].storyCount).toBe(6); // L4 共 6
    expect(map.nodes[0].readCount).toBe(0); // L1 缺省
    expect(map.nodes[0].storyCount).toBe(0);
  });

  it("totalRead 汇总各级已读不同 Story 数", () => {
    const map = buildLevelMap({ currentLevel: 5, readByLevel: { 3: 2, 4: 3, 5: 1 } });
    expect(map.totalRead).toBe(6);
  });

  it("totalRead 无阅读时为 0", () => {
    expect(buildLevelMap({ currentLevel: 1 }).totalRead).toBe(0);
  });

  it("越界 / 非法当前级别被钳制到 [1, 15],不抛错", () => {
    expect(buildLevelMap({ currentLevel: 0 }).currentLevel).toBe(1);
    expect(buildLevelMap({ currentLevel: 99 }).currentLevel).toBe(15);
    expect(buildLevelMap({ currentLevel: NaN }).currentLevel).toBe(1);
    expect(buildLevelMap({ currentLevel: 3.7 }).currentLevel).toBe(4); // 四舍五入
  });
});
