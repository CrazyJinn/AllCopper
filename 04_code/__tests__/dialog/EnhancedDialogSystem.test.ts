/**
 * 对话系统测试
 */

import {
    EmotionType,
    PortraitPosition,
    DialogScriptData,
    DialogLineData,
    CharacterPortraitConfig,
} from '../../dialog/DialogData';
import { PortraitManager } from '../../dialog/PortraitManager';
import { EnhancedDialogSystem, DialogEventType } from '../../dialog/EnhancedDialogSystem';

// ==================== 测试数据 ====================

/** 示例对话脚本 JSON */
const sampleDialogScript: DialogScriptData = {
    id: 'dialog_test_001',
    name: '初次相遇',
    description: '罗兰与薇的第一次对话',
    characters: ['roland', 'wei'],
    lines: [
        {
            id: 'line_001',
            speakerId: 'roland',
            speakerName: '罗兰',
            text: '你好，我是罗兰。你也是幸存者吗？',
            speakerEmotion: EmotionType.DEFAULT,
            listenerId: 'wei',
            listenerEmotion: EmotionType.DEFAULT,
            nextDialogId: 'line_002',
        },
        {
            id: 'line_002',
            speakerId: 'wei',
            speakerName: '薇',
            text: '……',
            speakerEmotion: EmotionType.COLD,
            listenerId: 'roland',
            listenerEmotion: EmotionType.THINKING,
            nextDialogId: 'line_003',
        },
        {
            id: 'line_003',
            speakerId: 'wei',
            speakerName: '薇',
            text: '别靠近我。',
            speakerEmotion: EmotionType.COLD,
            listenerId: 'roland',
            listenerEmotion: EmotionType.SURPRISED,
            choices: [
                {
                    id: 'choice_001',
                    text: '保持距离',
                    nextDialogId: 'line_004a',
                },
                {
                    id: 'choice_002',
                    text: '尝试接近',
                    nextDialogId: 'line_004b',
                },
            ],
        },
        {
            id: 'line_004a',
            speakerId: 'roland',
            speakerName: '罗兰',
            text: '好的，我明白了。我会保持距离的。',
            speakerEmotion: EmotionType.DEFAULT,
            listenerId: 'wei',
            listenerEmotion: EmotionType.DEFAULT,
        },
        {
            id: 'line_004b',
            speakerId: 'roland',
            speakerName: '罗兰',
            text: '等等！我不是敌人！',
            speakerEmotion: EmotionType.SURPRISED,
            listenerId: 'wei',
            listenerEmotion: EmotionType.ANGRY,
        },
    ],
    startLineId: 'line_001',
};

/** 示例角色立绘配置 */
const sampleCharacters: CharacterPortraitConfig[] = [
    {
        characterId: 'roland',
        name: '罗兰',
        defaultPortraitId: 'portrait_roland_default',
        emotionPortraits: new Map([
            [EmotionType.DEFAULT, 'portrait_roland_default'],
            [EmotionType.HAPPY, 'portrait_roland_happy'],
            [EmotionType.ANGRY, 'portrait_roland_angry'],
            [EmotionType.SAD, 'portrait_roland_sad'],
            [EmotionType.SURPRISED, 'portrait_roland_surprised'],
            [EmotionType.THINKING, 'portrait_roland_thinking'],
        ]),
        defaultPosition: PortraitPosition.LEFT,
    },
    {
        characterId: 'wei',
        name: '薇',
        defaultPortraitId: 'portrait_wei_default',
        emotionPortraits: new Map([
            [EmotionType.DEFAULT, 'portrait_wei_default'],
            [EmotionType.COLD, 'portrait_wei_cold'],
            [EmotionType.ANGRY, 'portrait_wei_angry'],
            [EmotionType.SAD, 'portrait_wei_sad'],
        ]),
        defaultPosition: PortraitPosition.RIGHT,
    },
];

// ==================== 测试用例 ====================

describe('PortraitManager', () => {
    let manager: PortraitManager;

    beforeEach(() => {
        manager = PortraitManager.instance;
        manager.clear();
    });

    describe('角色注册', () => {
        it('应该正确注册角色', () => {
            manager.registerCharacter(sampleCharacters[0]);

            expect(manager.hasCharacter('roland')).toBe(true);
            expect(manager.hasCharacter('wei')).toBe(false);
        });

        it('应该批量注册角色', () => {
            manager.registerCharacters(sampleCharacters);

            expect(manager.hasCharacter('roland')).toBe(true);
            expect(manager.hasCharacter('wei')).toBe(true);
        });
    });

    describe('立绘获取', () => {
        beforeEach(() => {
            manager.registerCharacters(sampleCharacters);
        });

        it('应该获取默认立绘', () => {
            const portrait = manager.getPortrait('roland', EmotionType.DEFAULT);

            expect(portrait).not.toBeNull();
            expect(portrait?.characterId).toBe('roland');
            expect(portrait?.name).toBe('罗兰');
            expect(portrait?.emotion).toBe(EmotionType.DEFAULT);
            expect(portrait?.portraitAssetId).toBe('portrait_roland_default');
        });

        it('应该获取指定表情立绘', () => {
            const portrait = manager.getPortrait('roland', EmotionType.HAPPY);

            expect(portrait).not.toBeNull();
            expect(portrait?.emotion).toBe(EmotionType.HAPPY);
            expect(portrait?.portraitAssetId).toBe('portrait_roland_happy');
        });

        it('未注册角色应返回 null', () => {
            const portrait = manager.getPortrait('unknown', EmotionType.DEFAULT);

            expect(portrait).toBeNull();
        });
    });
});

describe('EnhancedDialogSystem', () => {
    let dialogSystem: EnhancedDialogSystem;
    let portraitManager: PortraitManager;

    beforeEach(() => {
        dialogSystem = new EnhancedDialogSystem();
        portraitManager = PortraitManager.instance;
        portraitManager.clear();
        portraitManager.registerCharacters(sampleCharacters);
    });

    describe('脚本加载', () => {
        it('应该从 JSON 对象加载脚本', () => {
            const result = dialogSystem.loadScriptFromJson(sampleDialogScript);

            expect(result).toBe(true);
            expect(dialogSystem.getLoadedScript('dialog_test_001')).toBeDefined();
        });

        it('应该从 JSON 字符串加载脚本', () => {
            const jsonString = JSON.stringify(sampleDialogScript);
            const result = dialogSystem.loadScriptFromJson(jsonString);

            expect(result).toBe(true);
        });

        it('无效脚本应加载失败', () => {
            const invalidScript = { id: 'test' }; // 缺少必要字段
            const result = dialogSystem.loadScriptFromJson(invalidScript as any);

            expect(result).toBe(false);
        });
    });

    describe('对话控制', () => {
        beforeEach(() => {
            dialogSystem.loadScriptFromJson(sampleDialogScript);
        });

        it('应该正确开始对话', () => {
            const result = dialogSystem.startDialog('dialog_test_001');

            expect(result).toBe(true);
            expect(dialogSystem.isActive()).toBe(true);
            expect(dialogSystem.getCurrentSpeaker()?.name).toBe('罗兰');
        });

        it('未加载脚本应开始失败', () => {
            const result = dialogSystem.startDialog('non_existent');

            expect(result).toBe(false);
            expect(dialogSystem.isActive()).toBe(false);
        });

        it('应该正确推进对话', () => {
            dialogSystem.startDialog('dialog_test_001');

            // 跳过打字机效果
            dialogSystem.skipTypewriter();

            // 推进到下一句
            dialogSystem.advance();

            expect(dialogSystem.getCurrentSpeaker()?.name).toBe('薇');
        });

        it('应该在选项处等待', () => {
            dialogSystem.startDialog('dialog_test_001');

            // 快速推进到选项
            dialogSystem.skipTypewriter(); // line_001
            dialogSystem.advance(); // line_002
            dialogSystem.skipTypewriter(); // line_002
            dialogSystem.advance(); // line_003
            dialogSystem.skipTypewriter(); // 跳过 line_003 打字机，显示选项

            expect(dialogSystem.isWaitingForChoice()).toBe(true);
            expect(dialogSystem.getCurrentChoices().length).toBe(2);
        });

        it('应该正确选择选项', () => {
            dialogSystem.startDialog('dialog_test_001');

            // 快速推进到选项
            dialogSystem.skipTypewriter();
            dialogSystem.advance();
            dialogSystem.skipTypewriter();
            dialogSystem.advance();
            dialogSystem.skipTypewriter(); // 显示选项

            // 选择选项
            const result = dialogSystem.selectChoice('choice_001');

            expect(result).toBe(true);
            expect(dialogSystem.isWaitingForChoice()).toBe(false);
            expect(dialogSystem.getCurrentSpeaker()?.name).toBe('罗兰');
        });

        it('应该正确结束对话', () => {
            dialogSystem.startDialog('dialog_test_001');

            // 推进到结束
            dialogSystem.skipTypewriter(); // line_001
            dialogSystem.advance(); // line_002
            dialogSystem.skipTypewriter(); // line_002
            dialogSystem.advance(); // line_003
            dialogSystem.skipTypewriter(); // 显示选项
            dialogSystem.selectChoice('choice_001'); // 选择选项，进入 line_004a
            dialogSystem.skipTypewriter(); // line_004a
            dialogSystem.advance(); // 结束

            expect(dialogSystem.isActive()).toBe(false);
        });
    });

    describe('打字机效果', () => {
        beforeEach(() => {
            dialogSystem.loadScriptFromJson(sampleDialogScript);
            dialogSystem.startDialog('dialog_test_001');
        });

        it('应该逐步显示文本', () => {
            const fullText = dialogSystem.getFullText();
            const displayText = dialogSystem.getDisplayText();

            // 初始时显示文本应该较短
            expect(displayText.length).toBeLessThan(fullText.length);
        });

        it('更新后应该显示更多文本', () => {
            const displayBefore = dialogSystem.getDisplayText().length;

            dialogSystem.update(0.5); // 更新 0.5 秒

            const displayAfter = dialogSystem.getDisplayText().length;

            expect(displayAfter).toBeGreaterThan(displayBefore);
        });

        it('跳过应该显示全部文本', () => {
            dialogSystem.skipTypewriter();

            const displayText = dialogSystem.getDisplayText();
            const fullText = dialogSystem.getFullText();

            expect(displayText).toBe(fullText);
            expect(dialogSystem.isTypewriterComplete()).toBe(true);
        });
    });

    describe('立绘管理', () => {
        beforeEach(() => {
            dialogSystem.loadScriptFromJson(sampleDialogScript);
        });

        it('应该显示说话者和听话者立绘', () => {
            dialogSystem.startDialog('dialog_test_001');

            const portraits = dialogSystem.getDisplayedPortraits();

            expect(portraits.size).toBe(2);
            expect(portraits.has('roland')).toBe(true);
            expect(portraits.has('wei')).toBe(true);
        });

        it('说话者应该高亮', () => {
            dialogSystem.startDialog('dialog_test_001');

            const portraits = dialogSystem.getDisplayedPortraits();
            const speaker = portraits.get('roland');
            const listener = portraits.get('wei');

            expect(speaker?.highlighted).toBe(true);
            expect(listener?.highlighted).toBe(false);
        });
    });

    describe('事件系统', () => {
        beforeEach(() => {
            dialogSystem.loadScriptFromJson(sampleDialogScript);
        });

        it('应该触发对话开始事件', () => {
            const listener = jest.fn();
            dialogSystem.addEventListener(DialogEventType.DIALOG_STARTED, listener);

            dialogSystem.startDialog('dialog_test_001');

            expect(listener).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: DialogEventType.DIALOG_STARTED,
                })
            );
        });

        it('应该触发对话结束事件', () => {
            const listener = jest.fn();
            dialogSystem.addEventListener(DialogEventType.DIALOG_ENDED, listener);

            dialogSystem.startDialog('dialog_test_001');
            dialogSystem.endDialog();

            expect(listener).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: DialogEventType.DIALOG_ENDED,
                })
            );
        });

        it('应该触发选项选择事件', () => {
            dialogSystem.startDialog('dialog_test_001');
            dialogSystem.skipTypewriter();
            dialogSystem.advance();
            dialogSystem.skipTypewriter();
            dialogSystem.advance();
            dialogSystem.skipTypewriter(); // 显示选项

            const listener = jest.fn();
            dialogSystem.addEventListener(DialogEventType.CHOICE_SELECTED, listener);

            dialogSystem.selectChoice('choice_001');

            expect(listener).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: DialogEventType.CHOICE_SELECTED,
                    data: expect.objectContaining({
                        choiceId: 'choice_001',
                    }),
                })
            );
        });
    });
});

describe('JSON 数据格式示例', () => {
    it('应该可以序列化和反序列化', () => {
        const json = JSON.stringify(sampleDialogScript, (_, value) => {
            // 处理 Map 序列化
            if (value instanceof Map) {
                return { __type: 'Map', data: Array.from(value.entries()) };
            }
            return value;
        });

        const parsed = JSON.parse(json);

        expect(parsed.id).toBe('dialog_test_001');
        expect(parsed.lines.length).toBe(5);
        expect(parsed.characters).toContain('roland');
        expect(parsed.characters).toContain('wei');
    });
});
