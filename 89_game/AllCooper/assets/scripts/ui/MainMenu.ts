/**
 * 主菜单
 * 游戏主菜单界面
 */

import { eventSystem, GameEvent } from '../core/EventSystem';
import { gameManager, GameState } from '../core/GameManager';

/** 菜单按钮 */
interface MenuButton {
    id: string;
    label: string;
    action: () => void;
    enabled: boolean;
}

/**
 * 主菜单管理器
 */
export class MainMenu {
    private buttons: MenuButton[] = [];
    private selectedIndex: number = 0;
    private isVisible: boolean = false;
    private title: string = '万物为铜';

    constructor() {
        this.setupButtons();
    }

    /**
     * 设置菜单按钮
     */
    private setupButtons(): void {
        this.buttons = [
            {
                id: 'new_game',
                label: '开始新游戏',
                action: () => this.startNewGame(),
                enabled: true,
            },
            {
                id: 'continue',
                label: '继续游戏',
                action: () => this.continueGame(),
                enabled: false, // 根据存档状态更新
            },
            {
                id: 'settings',
                label: '设置',
                action: () => this.openSettings(),
                enabled: true,
            },
            {
                id: 'quit',
                label: '退出游戏',
                action: () => this.quitGame(),
                enabled: true,
            },
        ];
    }

    /**
     * 显示菜单
     */
    show(): void {
        this.isVisible = true;
        this.selectedIndex = 0;
        this.updateContinueButton();
    }

    /**
     * 隐藏菜单
     */
    hide(): void {
        this.isVisible = false;
    }

    /**
     * 更新继续游戏按钮状态
     */
    private updateContinueButton(): void {
        const continueBtn = this.buttons.find(b => b.id === 'continue');
        if (continueBtn) {
            // 检查是否有存档
            continueBtn.enabled = this.hasSaveData();
        }
    }

    /**
     * 检查是否有存档
     */
    private hasSaveData(): boolean {
        // 实际实现需要检查存档系统
        return false;
    }

    /**
     * 开始新游戏
     */
    private startNewGame(): void {
        console.log('[MainMenu] 开始新游戏');
        this.hide();
        gameManager.startGame();
    }

    /**
     * 继续游戏
     */
    private continueGame(): void {
        console.log('[MainMenu] 继续游戏');
        this.hide();
        // 加载存档并开始游戏
        gameManager.startGame();
    }

    /**
     * 打开设置
     */
    private openSettings(): void {
        console.log('[MainMenu] 打开设置');
        eventSystem.emit(GameEvent.UI_MENU_OPENED, { menuId: 'settings' } as any);
    }

    /**
     * 退出游戏
     */
    private quitGame(): void {
        console.log('[MainMenu] 退出游戏');
        // 实际实现需要调用引擎的退出方法
    }

    /**
     * 选择上一个按钮
     */
    selectPrevious(): void {
        do {
            this.selectedIndex = (this.selectedIndex - 1 + this.buttons.length) % this.buttons.length;
        } while (!this.buttons[this.selectedIndex].enabled);
    }

    /**
     * 选择下一个按钮
     */
    selectNext(): void {
        do {
            this.selectedIndex = (this.selectedIndex + 1) % this.buttons.length;
        } while (!this.buttons[this.selectedIndex].enabled);
    }

    /**
     * 确认选择
     */
    confirm(): void {
        const button = this.buttons[this.selectedIndex];
        if (button.enabled) {
            button.action();
        }
    }

    /**
     * 鼠标点击
     */
    handleClick(x: number, y: number): void {
        const buttonIndex = this.getButtonAtPosition(x, y);
        if (buttonIndex !== -1 && this.buttons[buttonIndex].enabled) {
            this.selectedIndex = buttonIndex;
            this.confirm();
        }
    }

    /**
     * 获取指定位置的按钮索引
     */
    private getButtonAtPosition(x: number, y: number): number {
        // 简化实现，需要根据实际布局计算
        return -1;
    }

    /**
     * 渲染菜单
     */
    render(ctx: CanvasRenderingContext2D, screenWidth: number, screenHeight: number): void {
        if (!this.isVisible) return;

        const centerX = screenWidth / 2;
        const startY = screenHeight * 0.35;
        const buttonHeight = 50;
        const buttonWidth = 200;
        const gap = 15;

        // 渲染标题
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.title, centerX, startY - 80);

        // 渲染副标题
        ctx.font = '18px Arial';
        ctx.fillStyle = '#AAAAAA';
        ctx.fillText('万物为铜，唯有生存', centerX, startY - 40);

        // 渲染按钮
        this.buttons.forEach((button, index) => {
            const y = startY + index * (buttonHeight + gap);
            const isSelected = index === this.selectedIndex;

            // 按钮背景
            if (isSelected) {
                ctx.fillStyle = button.enabled ? '#FFD700' : '#666666';
            } else {
                ctx.fillStyle = button.enabled ? '#333333' : '#222222';
            }
            ctx.fillRect(centerX - buttonWidth / 2, y, buttonWidth, buttonHeight);

            // 按钮边框
            ctx.strokeStyle = isSelected ? '#FFFFFF' : '#555555';
            ctx.lineWidth = 2;
            ctx.strokeRect(centerX - buttonWidth / 2, y, buttonWidth, buttonHeight);

            // 按钮文字
            ctx.fillStyle = button.enabled ? '#FFFFFF' : '#666666';
            ctx.font = 'bold 20px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(button.label, centerX, y + buttonHeight / 2 + 6);
        });

        // 渲染版本信息
        ctx.fillStyle = '#666666';
        ctx.font = '12px Arial';
        ctx.textAlign = 'right';
        ctx.fillText('v1.0.0', screenWidth - 20, screenHeight - 20);
    }
}

/**
 * 暂停菜单
 */
export class PauseMenu {
    private isVisible: boolean = false;
    private buttons: MenuButton[] = [];
    private selectedIndex: number = 0;

    constructor() {
        this.setupButtons();
    }

    private setupButtons(): void {
        this.buttons = [
            {
                id: 'resume',
                label: '继续游戏',
                action: () => this.resume(),
                enabled: true,
            },
            {
                id: 'settings',
                label: '设置',
                action: () => this.openSettings(),
                enabled: true,
            },
            {
                id: 'main_menu',
                label: '返回主菜单',
                action: () => this.returnToMainMenu(),
                enabled: true,
            },
        ];
    }

    show(): void {
        this.isVisible = true;
        this.selectedIndex = 0;
    }

    hide(): void {
        this.isVisible = false;
    }

    private resume(): void {
        this.hide();
        gameManager.resumeGame();
    }

    private openSettings(): void {
        eventSystem.emit(GameEvent.UI_MENU_OPENED, { menuId: 'settings' } as any);
    }

    private returnToMainMenu(): void {
        this.hide();
        gameManager.returnToMenu();
    }

    selectPrevious(): void {
        this.selectedIndex = (this.selectedIndex - 1 + this.buttons.length) % this.buttons.length;
    }

    selectNext(): void {
        this.selectedIndex = (this.selectedIndex + 1) % this.buttons.length;
    }

    confirm(): void {
        this.buttons[this.selectedIndex].action();
    }

    render(ctx: CanvasRenderingContext2D, screenWidth: number, screenHeight: number): void {
        if (!this.isVisible) return;

        // 半透明背景
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, screenWidth, screenHeight);

        const centerX = screenWidth / 2;
        const centerY = screenHeight / 2;
        const buttonHeight = 50;
        const buttonWidth = 200;
        const gap = 15;
        const startY = centerY - (this.buttons.length * (buttonHeight + gap)) / 2;

        // 标题
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 36px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('游戏暂停', centerX, startY - 40);

        // 按钮
        this.buttons.forEach((button, index) => {
            const y = startY + index * (buttonHeight + gap);
            const isSelected = index === this.selectedIndex;

            ctx.fillStyle = isSelected ? '#FFD700' : '#333333';
            ctx.fillRect(centerX - buttonWidth / 2, y, buttonWidth, buttonHeight);

            ctx.strokeStyle = isSelected ? '#FFFFFF' : '#555555';
            ctx.lineWidth = 2;
            ctx.strokeRect(centerX - buttonWidth / 2, y, buttonWidth, buttonHeight);

            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 20px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(button.label, centerX, y + buttonHeight / 2 + 6);
        });
    }
}
