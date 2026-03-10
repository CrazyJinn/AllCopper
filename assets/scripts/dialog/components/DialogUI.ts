/**
 * 对话UI组件
 * 管理对话框的显示、交互、选项按钮
 */

import {
    _decorator,
    Component,
    Node,
    Label,
    Sprite,
    SpriteFrame,
    Button,
    instantiate,
    Prefab,
    resources,
    input,
    Input,
    EventTouch,
    tween,
    UIOpacity,
    UITransform
} from 'cc';
import {
    DialogConfig,
    DialogLine,
    DialogChoice,
    DialogState,
    DialogEventType,
    DialogEventData,
    EmotionType
} from '../data/DialogTypes';
import { DialogManager } from '../managers/DialogManager';
import { TypewriterEffect } from './TypewriterEffect';
import { PortraitManager } from './PortraitView';
import { CutsceneManager } from './CutscenePlayer';

const { ccclass, property } = _decorator;

/**
 * 对话选项按钮组件
 */
@ccclass('DialogChoiceButton')
export class DialogChoiceButton extends Component {
    @property(Label)
    textLabel: Label | null = null;

    @property(Button)
    button: Button | null = null;

    private _choice: DialogChoice | null = null;
    private _onClick: ((choice: DialogChoice) => void) | null = null;

    /**
     * 设置选项数据
     */
    public setChoice(choice: DialogChoice, onClick: (choice: DialogChoice) => void): void {
        this._choice = choice;
        this._onClick = onClick;

        if (this.textLabel) {
            this.textLabel.string = choice.text;
        }

        if (this.button) {
            this.button.node.on(Button.EventType.CLICK, this._onButtonClick, this);
        }
    }

    private _onButtonClick(): void {
        if (this._onClick && this._choice) {
            this._onClick(this._choice);
        }
    }
}

/**
 * 对话UI主组件
 */
@ccclass('DialogUI')
export class DialogUI extends Component {
    // ===================== UI节点引用 =====================

    @property(Node)
    dialogBox: Node | null = null;

    @property(Sprite)
    avatarSprite: Sprite | null = null;

    @property(Label)
    nameLabel: Label | null = null;

    @property(Label)
    dialogLabel: Label | null = null;

    @property(TypewriterEffect)
    typewriter: TypewriterEffect | null = null;

    @property(Node)
    choicesContainer: Node | null = null;

    @property(Prefab)
    choiceButtonPrefab: Prefab | null = null;

    @property(PortraitManager)
    portraitManager: PortraitManager | null = null;

    @property(CutsceneManager)
    cutsceneManager: CutsceneManager | null = null;

    @property(Node)
    continueHint: Node | null = null;

    @property(Sprite)
    backgroundSprite: Sprite | null = null;

    // ===================== 私有属性 =====================

    private _dialogManager: DialogManager = DialogManager.instance;
    private _choiceButtons: DialogChoiceButton[] = [];
    private _initialized: boolean = false;

    // ===================== 生命周期 =====================

    protected onLoad(): void {
        this._init();
    }

    protected onEnable(): void {
        this._registerEvents();
        this._registerInput();
    }

    protected onDisable(): void {
        this._unregisterEvents();
        this._unregisterInput();
    }

    // ===================== 初始化 =====================

    private _init(): void {
        if (this._initialized) return;
        this._initialized = true;

        this.hide();

        if (this.typewriter) {
            this.typewriter.typeSpeed = this._dialogManager.typeSpeed;
        }
    }

    private _registerEvents(): void {
        this._dialogManager.on(DialogEventType.DIALOG_START, this._onDialogStart, this);
        this._dialogManager.on(DialogEventType.DIALOG_END, this._onDialogEnd, this);
        this._dialogManager.on(DialogEventType.LINE_START, this._onLineStart, this);
        this._dialogManager.on(DialogEventType.TYPE_COMPLETE, this._onTypeComplete, this);
        this._dialogManager.on(DialogEventType.CHOICES_SHOW, this._onChoicesShow, this);
        this._dialogManager.on(DialogEventType.EMOTION_CHANGE, this._onEmotionChange, this);
        this._dialogManager.on(DialogEventType.SPEAKER_CHANGE, this._onSpeakerChange, this);
        this._dialogManager.on(DialogEventType.CUTSCENE_START, this._onCutsceneStart, this);
        this._dialogManager.on(DialogEventType.CUTSCENE_END, this._onCutsceneEnd, this);
    }

    private _unregisterEvents(): void {
        this._dialogManager.off(DialogEventType.DIALOG_START, this._onDialogStart, this);
        this._dialogManager.off(DialogEventType.DIALOG_END, this._onDialogEnd, this);
        this._dialogManager.off(DialogEventType.LINE_START, this._onLineStart, this);
        this._dialogManager.off(DialogEventType.TYPE_COMPLETE, this._onTypeComplete, this);
        this._dialogManager.off(DialogEventType.CHOICES_SHOW, this._onChoicesShow, this);
        this._dialogManager.off(DialogEventType.EMOTION_CHANGE, this._onEmotionChange, this);
        this._dialogManager.off(DialogEventType.SPEAKER_CHANGE, this._onSpeakerChange, this);
        this._dialogManager.off(DialogEventType.CUTSCENE_START, this._onCutsceneStart, this);
        this._dialogManager.off(DialogEventType.CUTSCENE_END, this._onCutsceneEnd, this);
    }

    private _registerInput(): void {
        if (this.dialogBox) {
            this.dialogBox.on(Node.EventType.TOUCH_END, this._onTouchEnd, this);
        }

        input.on(Input.EventType.KEY_DOWN, this._onKeyDown, this);
    }

    private _unregisterInput(): void {
        if (this.dialogBox) {
            this.dialogBox.off(Node.EventType.TOUCH_END, this._onTouchEnd, this);
        }

        input.off(Input.EventType.KEY_DOWN, this._onKeyDown, this);
    }

    // ===================== 公共方法 =====================

    /**
     * 显示对话UI
     */
    public show(): void {
        this.node.active = true;

        const opacity = this.getComponent(UIOpacity);
        if (opacity) {
            opacity.opacity = 0;
            tween(opacity)
                .to(0.2, { opacity: 255 })
                .start();
        }
    }

    /**
     * 隐藏对话UI
     */
    public hide(): void {
        const opacity = this.getComponent(UIOpacity);
        if (opacity) {
            tween(opacity)
                .to(0.2, { opacity: 0 })
                .call(() => {
                    this.node.active = false;
                })
                .start();
        } else {
            this.node.active = false;
        }
    }

    /**
     * 开始对话
     */
    public startDialog(dialog: DialogConfig): void {
        this.show();
        this._dialogManager.startDialog(dialog);
    }

    /**
     * 推进对话
     */
    public advance(): void {
        const state = this._dialogManager.state;

        if (state === DialogState.TYPING) {
            if (this.typewriter && this.typewriter.isTyping) {
                this.typewriter.showAll();
                this._dialogManager.onTypingComplete();
            }
            return;
        }

        if (state === DialogState.WAITING) {
            this._dialogManager.nextLine();
        }
    }

    /**
     * 跳过当前对话
     */
    public skip(): void {
        this._dialogManager.forceEnd();
    }

    // ===================== 事件处理 =====================

    private _onDialogStart(data: DialogEventData): void {
        const dialog = this._dialogManager.currentDialog;
        if (!dialog) return;

        if (this.portraitManager) {
            this.portraitManager.setSpeakers(dialog.speakers);
        }

        if (dialog.background && this.backgroundSprite) {
            resources.load(dialog.background, SpriteFrame, (err, sf) => {
                if (!err && this.backgroundSprite) {
                    this.backgroundSprite.spriteFrame = sf;
                }
            });
        }
    }

    private _onDialogEnd(data: DialogEventData): void {
        if (this.portraitManager) {
            this.portraitManager.clearAll();
        }

        this.hide();
    }

    private _onLineStart(data: DialogEventData): void {
        const line = data.line;
        if (!line) return;

        this._hideContinueHint();
        this._clearChoices();
        this._updateSpeakerInfo(line);

        if (this.typewriter && this.dialogLabel) {
            this.typewriter.typeSpeed = this._dialogManager.typeSpeed;
            this.typewriter.startTyping(line.text, () => {
                this._dialogManager.onTypingComplete();
            });
        } else if (this.dialogLabel) {
            this.dialogLabel.string = line.text;
            this._dialogManager.onTypingComplete();
        }
    }

    private _onTypeComplete(data: DialogEventData): void {
        this._showContinueHint();
    }

    private _onChoicesShow(data: DialogEventData): void {
        const line = data.line;
        if (!line || !line.choices) return;

        this._showChoices(line.choices);
    }

    private _onEmotionChange(data: DialogEventData): void {
        const dialog = this._dialogManager.currentDialog;
        const line = this._dialogManager.currentLine;
        if (!dialog || !line) return;

        if (this.portraitManager) {
            this.portraitManager.setEmotion(line.speakerId, data.emotion || EmotionType.idle);
        }
    }

    private _onSpeakerChange(data: DialogEventData): void {
        const speaker = data.speaker;
        if (!speaker) return;

        if (this.portraitManager) {
            this.portraitManager.setCurrentSpeaker(speaker.characterId);
        }
    }

    private _onCutsceneStart(data: DialogEventData): void {
        if (this.dialogBox) {
            this.dialogBox.active = false;
        }

        if (this.cutsceneManager && data.cutsceneId) {
            this.cutsceneManager.play(data.cutsceneId, () => {
                this._dialogManager.onCutsceneComplete();
            });
        }
    }

    private _onCutsceneEnd(data: DialogEventData): void {
        if (this.dialogBox) {
            this.dialogBox.active = true;
        }
    }

    // ===================== 输入处理 =====================

    private _onTouchEnd(event: EventTouch): void {
        this.advance();
    }

    private _onKeyDown(event: any): void {
        if (event.keyCode === 32 || event.keyCode === 13) {
            this.advance();
        }

        if (event.keyCode === 27) {
            this.skip();
        }
    }

    // ===================== UI更新 =====================

    private _updateSpeakerInfo(line: DialogLine): void {
        const dialog = this._dialogManager.currentDialog;
        if (!dialog) return;

        const speaker = dialog.speakers.find(s => s.characterId === line.speakerId);
        if (!speaker) return;

        if (this.nameLabel) {
            this.nameLabel.string = speaker.name;
        }

        if (this.avatarSprite && speaker.portrait) {
            resources.load(speaker.portrait, SpriteFrame, (err, sf) => {
                if (!err && this.avatarSprite) {
                    this.avatarSprite.spriteFrame = sf;
                }
            });
        }
    }

    private _showContinueHint(): void {
        if (!this.continueHint) return;

        this.continueHint.active = true;

        const opacity = this.continueHint.getComponent(UIOpacity);
        if (opacity) {
            tween(opacity)
                .to(0.3, { opacity: 100 })
                .to(0.3, { opacity: 255 })
                .union()
                .repeatForever()
                .start();
        }
    }

    private _hideContinueHint(): void {
        if (!this.continueHint) return;

        const opacity = this.continueHint.getComponent(UIOpacity);
        if (opacity) {
            opacity.stopAllActions();
        }

        this.continueHint.active = false;
    }

    private _showChoices(choices: DialogChoice[]): void {
        if (!this.choicesContainer) return;

        this._clearChoices();

        for (const choice of choices) {
            let buttonNode: Node;

            if (this.choiceButtonPrefab) {
                buttonNode = instantiate(this.choiceButtonPrefab);
            } else {
                buttonNode = this._createSimpleChoiceButton(choice);
            }

            const choiceButton = buttonNode.getComponent(DialogChoiceButton);
            if (choiceButton) {
                choiceButton.setChoice(choice, (selectedChoice) => {
                    this._onChoiceSelected(selectedChoice);
                });
            }

            buttonNode.parent = this.choicesContainer;
            this._choiceButtons.push(choiceButton!);
        }

        this.choicesContainer.active = true;
        this._hideContinueHint();
    }

    private _createSimpleChoiceButton(choice: DialogChoice): Node {
        const node = new Node(choice.id);

        const transform = node.addComponent(UITransform);
        transform.setContentSize(300, 40);

        const label = node.addComponent(Label);
        label.string = choice.text;
        label.fontSize = 20;

        const button = node.addComponent(Button);

        const choiceButton = node.addComponent(DialogChoiceButton);
        choiceButton.textLabel = label;
        choiceButton.button = button;

        return node;
    }

    private _clearChoices(): void {
        if (!this.choicesContainer) return;

        this.choicesContainer.removeAllChildren();
        this._choiceButtons = [];
        this.choicesContainer.active = false;
    }

    private _onChoiceSelected(choice: DialogChoice): void {
        this._clearChoices();
        this._dialogManager.selectChoice(choice);
    }
}
