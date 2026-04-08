using Godot;

/// <summary>
/// 对话界面 - 立绘显示 + 文本框 + 逐字显示
/// </summary>
public partial class DialogUI : CanvasLayer
{
    private TextureRect _portraitA;
    private TextureRect _portraitB;
    private RichTextLabel _textBox;
    private Label _speakerLabel;
    private Panel _dialogPanel;
    private PortraitManager _portraitManager;

    public override void _Ready()
    {
        Layer = 20;

        var root = new Control { Name = "DialogUIRoot" };
        root.SetAnchorsPreset(Control.LayoutPreset.FullRect);
        AddChild(root);

        // 左侧立绘
        _portraitA = new TextureRect
        {
            Name = "PortraitA",
            ExpandMode = TextureRect.ExpandModeEnum.IgnoreSize,
            StretchMode = TextureRect.StretchModeEnum.KeepAspectCentered,
            Visible = false
        };
        _portraitA.SetAnchorsPreset(Control.LayoutPreset.CenterLeft);
        _portraitA.CustomMinimumSize = new Vector2(400, 800);
        root.AddChild(_portraitA);

        // 右侧立绘
        _portraitB = new TextureRect
        {
            Name = "PortraitB",
            ExpandMode = TextureRect.ExpandModeEnum.IgnoreSize,
            StretchMode = TextureRect.StretchModeEnum.KeepAspectCentered,
            Visible = false
        };
        _portraitB.SetAnchorsPreset(Control.LayoutPreset.CenterRight);
        _portraitB.CustomMinimumSize = new Vector2(400, 800);
        root.AddChild(_portraitB);

        // 对话面板（底部）
        _dialogPanel = new Panel { Name = "DialogPanel" };
        _dialogPanel.SetAnchorsAndOffsetsPreset(Control.LayoutPreset.BottomWide);
        _dialogPanel.OffsetTop = -200;
        root.AddChild(_dialogPanel);

        // 说话者名字
        _speakerLabel = new Label
        {
            Name = "SpeakerLabel",
            Position = new Vector2(30, 10),
            CustomMinimumSize = new Vector2(200, 30)
        };
        _dialogPanel.AddChild(_speakerLabel);

        // 文本框
        _textBox = new RichTextLabel
        {
            Name = "TextBox",
            BbcodeEnabled = true
        };
        _textBox.SetAnchorsAndOffsetsPreset(Control.LayoutPreset.FullRect);
        _textBox.OffsetTop = 40;
        _textBox.OffsetLeft = 30;
        _textBox.OffsetRight = -30;
        _textBox.OffsetBottom = -20;
        _dialogPanel.AddChild(_textBox);

        // 立绘管理器
        _portraitManager = new PortraitManager { Name = "PortraitManager" };
        AddChild(_portraitManager);
        _portraitManager.Setup(_portraitA, _portraitB);

        // 连接DialogManager信号
        if (DialogManager.Instance != null)
        {
            DialogManager.Instance.DialogStarted += OnDialogStarted;
            DialogManager.Instance.DialogEnded += OnDialogEnded;
            DialogManager.Instance.PortraitChanged += OnPortraitChanged;
        }

        root.Visible = false;
    }

    public override void _Process(double delta)
    {
        if (DialogManager.Instance?.IsPlaying != true) return;

        var line = DialogManager.Instance.CurrentLine;
        if (line != null)
        {
            _speakerLabel.Text = line.SpeakerA;
            _textBox.Text = line.Text.Substring(0, Mathf.Min(DialogManager.Instance.CurrentLine.Text.Length,
                (int)(_textBox.VisibleCharacters)));
        }
    }

    private void OnDialogStarted(string dialogId)
    {
        GetChild<Control>(0).Visible = true;
    }

    private void OnDialogEnded(string dialogId)
    {
        GetChild<Control>(0).Visible = false;
    }

    private void OnPortraitChanged(string speakerA, int emotionA, string speakerB, int emotionB)
    {
        _portraitManager.UpdatePortraits(
            speakerA, (GameEnums.EmotionType)emotionA,
            speakerB, (GameEnums.EmotionType)emotionB
        );
    }
}
