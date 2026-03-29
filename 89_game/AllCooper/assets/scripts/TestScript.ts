import { _decorator, Component } from 'cc';
const { ccclass, property } = _decorator;

import { DialogComponent } from './dialog/DialogComponent';
import { startSimpleDialog, registerDefaultCharacters, isDialogActive } from './dialog/DialogStarter';

@ccclass('TestScript')
export class TestScript extends Component {

    @property({ type: DialogComponent })
    dialog: DialogComponent | null = null;

    /** 对话脚本路径（相对于 resources/dialogs/，不含 .json） */
    @property
    dialogPath: string = 'chapter1/dialog_001';

    onLoad() {
        // 注册预定义角色（只需调用一次）
        registerDefaultCharacters();
    }

    start() {
        console.log('TestScript start, dialog:', this.dialog);

        // 自动开始对话
        this.playDialog();
    }

    /** 播放对话 */
    async playDialog() {
        if (!this.dialog) {
            console.error('[TestScript] 未绑定 DialogComponent');
            return;
        }

        const success = await startSimpleDialog(this.dialog, this.dialogPath);
        if (success) {
            console.log('[TestScript] 对话开始');
        } else {
            console.error('[TestScript] 对话加载失败');
        }
    }

    /** NPC 交互时调用 */
    async talkToNPC(npcId: string) {
        if (isDialogActive(this.dialog)) {
            console.log('[TestScript] 对话进行中，跳过');
            return;
        }
        await startSimpleDialog(this.dialog, `chapter1/${npcId}`);
    }
}
