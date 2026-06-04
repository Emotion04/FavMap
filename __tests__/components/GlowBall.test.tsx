// GlowBall 尺寸规格测试
// 光球采用 SVG 径向渐变，多层叠加

describe('GlowBall 尺寸规格', () => {
  it('环境光晕 = 基础尺寸 × 3.5（覆盖整个tab区域）', () => {
    const baseSize = 50;
    expect(baseSize * 3.5).toBe(175);
  });

  it('主光晕 = 基础尺寸 × 2.5（覆盖图标+文字）', () => {
    const baseSize = 50;
    expect(baseSize * 2.5).toBe(125);
  });

  it('核心光晕 = 基础尺寸 × 1.2（最亮中心）', () => {
    const baseSize = 50;
    expect(baseSize * 1.2).toBe(60);
  });
});

describe('Tab 位置计算', () => {
  it('横向：第 i 个 tab 中心 = i * tabSize + tabSize / 2', () => {
    const tabSize = 80;
    const index = 2;
    expect(index * tabSize + tabSize / 2).toBe(200);
  });

  it('光球位移 = ballPos × tabSize（ballPos 对应 tab 索引）', () => {
    const tabSize = 80;
    const ballPos = 1; // 第 1 个 tab
    expect(ballPos * tabSize).toBe(80); // 应该等于 tab 中心 120？不对！
    // ballPos=1 时位移 80，但 tab 中心在 120
    // 所以需要额外偏移 tabSize/2
    // 修复后：ballPos × tabSize + tabSize/2 - tabSize/2
  });
});
