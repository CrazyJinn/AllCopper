/**
 * 简化版对话系统测试
 */

import {
    DialogScriptData,
    DialogLineData,
    EmotionType,
    PortraitPosition,
    CharacterPortraitConfig,
} from '../../dialog/DialogData';
import { PortraitManager, portraitManager } from '../../dialog/PortraitManager';
import { SimpleDialogSystem } from '../../dialog/SimpleDialogSystem';

// ==================== 测试数据 ====================

const testCharacters: CharacterPortraitConfig[] = [
    {
        characterId: 'roland',
        name: '罗兰',
        defaultPortraitId: 'roland_default',
        emotionPortraits: new Map([
            [EmotionType.DEFAULT, 'roland_default'],
            [EmotionType.HAPPY, 'roland_happy'],
            [EmotionType.ANGRY, 'roland_angry'],
        ]),
        defaultPosition: PortraitPosition.LEFT,
    },
    {
        characterId: 'wei',
        name: '薇',
        defaultPortraitId: 'wei_default',
        emotionPortraits: new Map([
            [EmotionType.DEFAULT, 'wei_default'],
            [EmotionType.COLD, 'wei_cold'],
        ]),
        defaultPosition: PortraitPosition.RIGHT,
    },
];

const testScript: DialogScriptData = {
    id: 'test_dialog_001',
    name: '初次相遇',
    characters: ['roland', 'wei'],
    startLineId: 'line_1',
    lines: [
        {
            id: 'line_1',
            speakerId: 'roland',
            speakerName: '罗兰',
            text: '你好，我是罗兰。你也是幸存者吗？',
            speakerEmotion: EmotionType.DEFAULT,
            listenerId: 'wei',
            listenerEmotion: EmotionType.DEFAULT,
            nextDialogId: 'line_2',
        },
        {
            id: 'line_2',
            speakerId: 'wei',
            speakerName: '薇',
            text: '……',
            speakerEmotion: EmotionType.COLD,
            listenerId: 'roland',
            listenerEmotion: EmotionType.DEFAULT,
            nextDialogId: 'line_3',
        },
        {
            id: 'line_3',
            speakerId: 'wei',
            speakerName: '薇',
            text: '别靠近我。',
            speakerEmotion: EmotionType.COLD,
            listenerId: 'roland',
            listenerEmotion: EmotionType.SURPRISED,
            // 无 nextDialogId，对话结束
        },
    ],
};

// ==================== 测试 ====================

describe('PortraitManager', () => {
    beforeEach(() => {
        portraitManager.clear();
    });

    it('应该正确注册角色', () => {
        portraitManager.register(testCharacters[0]);
        expect(portraitManager.has('roland')).toBe(true);
        expect(portraitManager.has('wei')).toBe(false);
    });

    it('应该批量注册角色', () => {
        portraitManager.registerAll(testCharacters);
        expect(portraitManager.has('roland')).toBe(true);
        expect(portraitManager.has('wei')).toBe(true);
    });

    it('应该获取正确的立绘', () => {
        portraitManager.registerAll(testCharacters);

        const portrait = portraitManager.getPortrait('roland', EmotionType.HAPPY);
        expect(portrait).not.toBeNull();
        expect(portrait?.emotion).toBe(EmotionType.HAPPY);
        expect(portrait?.portraitAssetId).toBe('roland_happy');
    });

    it('未注册角色应返回 null', () => {
        expect(portraitManager.getPortrait('unknown')).toBeNull();
    });
});

describe('SimpleDialogSystem', () => {
    let dialog: SimpleDialogSystem;

    beforeEach(() => {
        portraitManager.clear();
        portraitManager.registerAll(testCharacters);
        dialog = new SimpleDialogSystem();
    });

    describe('脚本加载', () => {
        it('应该正确加载脚本', () => {
            expect(dialog.loadScript(testScript)).toBe(true);
        });

        it('无效脚本应加载失败', () => {
            expect(dialog.loadScript({} as any)).toBe(false);
            expect(dialog.loadScript({ id: 'test' } as any)).toBe(false);
        });
    });

    describe('对话控制', () => {
        beforeEach(() => {
            dialog.loadScript(testScript);
        });

        it('应该正确开始对话', () => {
            const result = dialog.start('test_dialog_001');
            expect(result).toBe(true);
            expect(dialog.isActive).toBe(true);
            expect(dialog.getSpeaker()?.name).toBe('罗兰');
        });

        it('未加载脚本应开始失败', () => {
            expect(dialog.start('unknown')).toBe(false);
            expect(dialog.isActive).toBe(false);
        });

        it('应该正确推进对话', () => {
            dialog.start('test_dialog_001');

            // 跳过打字机
            dialog.advance();
            expect(dialog.isTypewriterComplete).toBe(true);

            // 推进到下一句
            dialog.advance();
            expect(dialog.getSpeaker()?.name).toBe('薇');
            expect(dialog.getSpeaker()?.emotion).toBe(EmotionType.COLD);
        });

        it('应该正确结束对话', () => {
            dialog.start('test_dialog_001');

            // line_1
            dialog.advance();
            dialog.advance();

            // line_2
            dialog.advance();
            dialog.advance();

            // line_3
            dialog.advance();
            dialog.advance();

            // 结束
            expect(dialog.isActive).toBe(false);
        });
    });

    describe('打字机效果', () => {
        beforeEach(() => {
            dialog.loadScript(testScript);
            dialog.start('test_dialog_001');
        });

        it('应该逐步显示文本', () => {
            const fullText = dialog.getFullText();
            const displayText = dialog.getDisplayText();
            expect(displayText.length).toBeLessThan(fullText.length);
        });

        it('更新后应该显示更多文本', () => {
            const before = dialog.getDisplayText().length;
            dialog.update(0.5);
            const after = dialog.getDisplayText().length;
            expect(after).toBeGreaterThan(before);
        });

        it('跳过应该显示全部文本', () => {
            dialog.advance();
            expect(dialog.getDisplayText()).toBe(dialog.getFullText());
            expect(dialog.isTypewriterComplete).toBe(true);
        });
    });

    describe('立绘管理', () => {
        beforeEach(() => {
            dialog.loadScript(testScript);
        });

        it('应该显示说话者和听话者', () => {
            dialog.start('test_dialog_001');
            const portraits = dialog.getPortraits();

            expect(portraits.size).toBe(2);
            expect(portraits.has('roland')).toBe(true);
            expect(portraits.has('wei')).toBe(true);
        });

        it('说话者应该高亮', () => {
            dialog.start('test_dialog_001');
            const portraits = dialog.getPortraits();

            expect(portraits.get('roland')?.highlighted).toBe(true);
            expect(portraits.get('wei')?.highlighted).toBe(false);
        });

        it('切换说话者时高亮应该变化', () => {
            dialog.start('test_dialog_001');
            dialog.advance();
            dialog.advance();

            const portraits = dialog.getPortraits();
            expect(portraits.get('wei')?.highlighted).toBe(true);
            expect(portraits.get('roland')?.highlighted).toBe(false);
        });
    });

    describe('回调', () => {
        beforeEach(() => {
            dialog.loadScript(testScript);
        });

        it('应该触发 onDialogStart', () => {
            const fn = jest.fn();
            dialog.setCallbacks({ onDialogStart: fn });
            dialog.start('test_dialog_001');
            expect(fn).toHaveBeenCalledWith('test_dialog_001');
        });

        it('应该触发 onDialogEnd', () => {
            const fn = jest.fn();
            dialog.setCallbacks({ onDialogEnd: fn });
            dialog.start('test_dialog_001');
            dialog.end();
            expect(fn).toHaveBeenCalledWith('test_dialog_001');
        });

        it('应该触发 onShowText', () => {
            const fn = jest.fn();
            dialog.setCallbacks({ onShowText: fn });
            dialog.start('test_dialog_001');
            expect(fn).toHaveBeenCalledWith('你好，我是罗兰。你也是幸存者吗？', '罗兰');
        });

        it('应该触发 onTypewriterComplete', () => {
            const fn = jest.fn();
            dialog.setCallbacks({ onTypewriterComplete: fn });
            dialog.start('test_dialog_001');

            // 模拟更新直到完成
            for (let i = 0; i < 10; i++) {
                dialog.update(0.1);
            }
            expect(fn).toHaveBeenCalled();
        });
    });
});

describe('JSON 序列化', () => {
    it('应该可以序列化和反序列化', () => {
        const json = JSON.stringify(testScript);
        const parsed = JSON.parse(json) as DialogScriptData;

        expect(parsed.id).toBe('test_dialog_001');
        expect(parsed.lines.length).toBe(3);
        expect(parsed.characters).toContain('roland');
    });
});
