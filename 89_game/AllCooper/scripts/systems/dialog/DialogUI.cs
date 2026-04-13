using Godot;

/// <summary>
/// 对话界面UI
/// 显示角色立绘、对话文本、说话者信息，支持过场图片覆盖
/// 子节点通过 BuildScene() 动态创建
/// </summary>
[GlobalClass]
public partial class DialogUI : Control
{
    // ===== 子节点引用 =====

    private TextureRect _leftPortrait;
    private TextureRect _rightPortrait;
    private Panel _textBox;
    private RichTextLabel _dialogText;
    private Label _speakerName;
    private TextureRect _speakerAvatar;
    private TextureButton _continueButton;
    private ColorRect _cutsceneOverlay;
    private TextureRect _cutsceneImage;

    // ===== 公共属性 =====

    /// <summary>关联的 DialogManager</summary>
    private DialogManager _manager;

    public override void _Ready()
    {
        BuildScene();
        Visible = false;
    }

    /// <summary>
    /// 绑定对话管理器
    /// </summary>
    /// <param name="manager">DialogManager 实例</param>
    public void BindManager(DialogManager manager)
    {
        _manager = manager;
        if (_manager != null)
        {
            _manager.DialogStarted += OnDialogStarted;
            _manager.DialogAdvanced += OnDialogAdvanced;
            _manager.DialogEnded += OnDialogEnded;
        }
    }

    /// <summary>
    /// 显示对话条目
    /// </summary>
    /// <param name="entry">对话条目</param>
    public void ShowEntry(DialogEntry entry)
    {
        if (entry == null) return;

        // 说话者名称
        if (_speakerName != null)
        {
            _speakerName.Text = entry.SpeakerId;
        }

        // 对话文本
        if (_dialogText != null)
        {
            _dialogText.Text = entry.Text;
        }

        // 布局处理
        if (entry.Layout == DialogLayout.Monologue)
        {
            if (_leftPortrait != null) _leftPortrait.Visible = false;
            if (_rightPortrait != null) _rightPortrait.Visible = false;
        }
    }

    /// <summary>
    /// 设置角色立绘
    /// </summary>
    /// <param name="speakerId">说话者ID</param>
    /// <param name="portrait">立绘贴图</param>
    /// <param name="isLeft">是否在左侧</param>
    public void SetPortrait(string speakerId, Texture2D portrait, bool isLeft)
    {
        if (isLeft && _leftPortrait != null)
        {
            _leftPortrait.Texture = portrait;
            _leftPortrait.Visible = true;
        }
        else if (!isLeft && _rightPortrait != null)
        {
            _rightPortrait.Texture = portrait;
            _rightPortrait.Visible = true;
        }
    }

    /// <summary>
    /// 显示过场图片
    /// </summary>
    /// <param name="image">过场图片</param>
    public void ShowCutscene(Texture2D image)
    {
        if (_cutsceneOverlay != null) _cutsceneOverlay.Visible = true;
        if (_cutsceneImage != null) _cutsceneImage.Texture = image;
    }

    /// <summary>
    /// 隐藏过场图片
    /// </summary>
    public void HideCutscene()
    {
        if (_cutsceneOverlay != null) _cutsceneOverlay.Visible = false;
    }

    /// <summary>
    /// 清空界面
    /// </summary>
    public void Clear()
    {
        if (_dialogText != null) _dialogText.Text = "";
        if (_speakerName != null) _speakerName.Text = "";
        if (_leftPortrait != null) _leftPortrait.Visible = false;
        if (_rightPortrait != null) _rightPortrait.Visible = false;
        HideCutscene();
        Visible = false;
    }

    private void OnDialogStarted(string dialogId)
    {
        Visible = true;
    }

    private void OnDialogAdvanced(int entryIndex)
    {
        if (_manager != null)
        {
            ShowEntry(_manager.CurrentEntry);
        }
    }

    private void OnDialogEnded(string dialogId)
    {
        Clear();
    }

    private void OnContinuePressed()
    {
        _manager?.Advance();
    }

    /// <summary>
    /// 代码构建子节点
    /// </summary>
    private void BuildScene()
    {
        SetAnchorsPreset(Control.LayoutPreset.FullRect);

        // 左侧立绘（400x800）
        _leftPortrait = new TextureRect();
        _leftPortrait.Name = "LeftPortrait";
        _leftPortrait.CustomMinimumSize = new Vector2(400, 800);
        _leftPortrait.AnchorLeft = 0f;
        _leftPortrait.AnchorTop = 0.1f;
        _leftPortrait.AnchorBottom = 0.9f;
        _leftPortrait.AnchorRight = 0.25f;
        _leftPortrait.StretchMode = TextureRect.StretchModeEnum.KeepAspectCentered;
        _leftPortrait.Visible = false;
        AddChild(_leftPortrait);
        _leftPortrait.Owner = this;

        // 右侧立绘（400x800）
        _rightPortrait = new TextureRect();
        _rightPortrait.Name = "RightPortrait";
        _rightPortrait.CustomMinimumSize = new Vector2(400, 800);
        _rightPortrait.AnchorLeft = 0.75f;
        _rightPortrait.AnchorTop = 0.1f;
        _rightPortrait.AnchorBottom = 0.9f;
        _rightPortrait.AnchorRight = 1f;
        _rightPortrait.StretchMode = TextureRect.StretchModeEnum.KeepAspectCentered;
        _rightPortrait.Visible = false;
        AddChild(_rightPortrait);
        _rightPortrait.Owner = this;

        // 对话文本框（底部全宽x200px）
        _textBox = new Panel();
        _textBox.Name = "TextBox";
        _textBox.AnchorLeft = 0.05f;
        _textBox.AnchorRight = 0.95f;
        _textBox.AnchorTop = 0.75f;
        _textBox.AnchorBottom = 0.95f;
        AddChild(_textBox);
        _textBox.Owner = this;

        // 说话者名称
        _speakerName = new Label();
        _speakerName.Name = "SpeakerName";
        _speakerName.AnchorLeft = 0.07f;
        _speakerName.AnchorTop = 0.76f;
        AddChild(_speakerName);
        _speakerName.Owner = this;

        // 对话文本
        _dialogText = new RichTextLabel();
        _dialogText.Name = "DialogText";
        _dialogText.AnchorLeft = 0.07f;
        _dialogText.AnchorRight = 0.93f;
        _dialogText.AnchorTop = 0.80f;
        _dialogText.AnchorBottom = 0.93f;
        _dialogText.BbcodeEnabled = true;
        AddChild(_dialogText);
        _dialogText.Owner = this;

        // 继续按钮
        _continueButton = new TextureButton();
        _continueButton.Name = "ContinueButton";
        _continueButton.AnchorLeft = 0.9f;
        _continueButton.AnchorTop = 0.92f;
        AddChild(_continueButton);
        _continueButton.Owner = this;
        _continueButton.Pressed += OnContinuePressed;

        // 过场覆盖层（默认隐藏）
        _cutsceneOverlay = new ColorRect();
        _cutsceneOverlay.Name = "CutsceneOverlay";
        _cutsceneOverlay.SetAnchorsPreset(Control.LayoutPreset.FullRect);
        _cutsceneOverlay.Color = Colors.Black;
        _cutsceneOverlay.Visible = false;
        AddChild(_cutsceneOverlay);
        _cutsceneOverlay.Owner = this;

        _cutsceneImage = new TextureRect();
        _cutsceneImage.Name = "CutsceneImage";
        _cutsceneImage.SetAnchorsPreset(Control.LayoutPreset.FullRect);
        _cutsceneImage.StretchMode = TextureRect.StretchModeEnum.KeepAspectCovered;
        _cutsceneOverlay.AddChild(_cutsceneImage);
        _cutsceneImage.Owner = this;
    }
}
