/**
 * Jest 测试环境设置
 */

// 扩展 Jest 匹配器
expect.extend({
  /**
   * 检查数字是否在指定范围内
   */
  toBeWithinRange(received: number, floor: number, ceiling: number) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () => `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      };
    }
    return {
      message: () => `expected ${received} to be within range ${floor} - ${ceiling}`,
      pass: false,
    };
  },
});

// 全局测试超时
jest.setTimeout(10000);

// 模拟 console 以减少测试输出噪音
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  // 保留 error 以便调试
  // error: jest.fn(),
};

// 清理单例实例的辅助函数
export function resetSingleton<T>(Class: any, instanceKey: string = '_instance'): void {
  Class[instanceKey] = null;
}
