/**
 * 游戏主入口
 * 万物为铜 - 2D俯视角动作游戏
 */

// 核心模块
export * from './core';

// 数据模块
export * from './data';

// 玩家模块
export * from './player';

// 战斗模块
export * from './combat';

// UI模块
export * from './ui';

// 场景模块
export * from './scene';

// AI模块
export * from './ai';

// 经济系统
export * from './economy';

// 对话系统
export * from './dialog';

// 游戏初始化
import { gameManager } from './core/GameManager';
import { inputManager } from './player/InputManager';
import { combatSystem } from './combat/CombatSystem';
import { sceneManager } from './scene/SceneManager';

/**
 * 游戏初始化函数
 * 在Cocos引擎加载完成后调用
 */
export function initGame(): void {
    console.log('[Game] 初始化游戏...');

    // 初始化各系统
    gameManager;
    inputManager;
    combatSystem;
    sceneManager;

    console.log('[Game] 游戏初始化完成');
}

/**
 * 游戏主循环
 * 由Cocos引擎每帧调用
 * @param deltaTime 帧间隔时间（秒）
 */
export function gameUpdate(deltaTime: number): void {
    // 更新输入
    inputManager.update(deltaTime);

    // 更新游戏管理器
    gameManager.update();

    // 更新战斗系统
    combatSystem.update(deltaTime);
}
