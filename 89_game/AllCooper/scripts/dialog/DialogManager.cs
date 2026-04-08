using Godot;

/// <summary>
/// 对话管理器 - 双模式对话 + 表情立绘 + 逐字显示
/// </summary>
public partial class DialogManager : Node
{
    [Signal] public delegate void DialogStartedEventHandler(string dialogId);
    [Signal] public delegate void DialogEndedEventHandler(string dialogId);
    [Signal] public delegate void PortraitChangedEventHandler(string speakerA, int emotionA, string speakerB, int emotionB);
    [Signal] public delegate void CutsceneTriggeredEventHandler(string cutsceneId);

    public static DialogManager Instance { get; private set; }

    public bool IsPlaying { get; private set; }
    public GameEnums.DialogMode CurrentMode { get; private set; }
    public DialogLine CurrentLine { get; private set; }

    private DialogData _currentDialog;
    private int _currentLineIndex;
    private bool _isTyping;
    private string _fullText;
    private int _charIndex;
    private float _typeSpeed = 0.05f; // 每字间隔
    private float _typeTimer;

    public override void _EnterTree()
    {
        Instance = this;
    }

    public override void _Ready() { }

    public override void _Process(double delta)
    {
        if (!_isTyping) return;

        _typeTimer += (float)delta;
        if (_typeTimer >= _typeSpeed)
        {
            _typeTimer = 0f;
            _charIndex++;
            if (_charIndex >= _fullText.Length)
            {
                _isTyping = false;
                _charIndex = _fullText.Length;
            }
        }
    }

    public override void _Input(InputEvent @event)
    {
        if (!IsPlaying) return;
        if (!@event.IsActionPressed("ui_accept") && !@event.IsActionPressed("interact")) return;

        if (_isTyping)
        {
            // 跳过逐字显示
            _isTyping = false;
            _charIndex = _fullText.Length;
        }
        else
        {
            Advance();
        }
    }

    /// <summary>启动对话</summary>
    public void StartDialog(DialogData dialogData)
    {
        _currentDialog = dialogData;
        _currentLineIndex = 0;
        CurrentMode = dialogData.Mode;
        IsPlaying = true;

        EmitSignal(SignalName.DialogStarted, dialogData.DialogId);
        GameManager.Instance?.ChangeState(GameEnums.GameState.Dialog);
        ShowLine(0);
    }

    /// <summary>推进到下一行</summary>
    public void Advance()
    {
        _currentLineIndex++;
        if (_currentLineIndex >= _currentDialog.Lines.Length)
        {
            EndDialog();
        }
        else
        {
            ShowLine(_currentLineIndex);
        }
    }

    private void ShowLine(int index)
    {
        var line = _currentDialog.Lines[index];
        CurrentLine = line;

        // 更新立绘
        EmitSignal(SignalName.PortraitChanged,
            line.SpeakerA, (int)line.EmotionA,
            line.SpeakerB ?? "", (int)line.EmotionB
        );

        // 开始逐字显示
        _fullText = line.Text;
        _charIndex = 0;
        _isTyping = true;
        _typeTimer = 0f;

        // 检查过场触发
        if (!string.IsNullOrEmpty(line.CutsceneId))
        {
            EmitSignal(SignalName.CutsceneTriggered, line.CutsceneId);
        }
    }

    private void EndDialog()
    {
        IsPlaying = false;
        _currentDialog = null;
        EmitSignal(SignalName.DialogEnded, "");
        GameManager.Instance?.RestorePreviousState();
    }
}

/// <summary>
/// 对话数据
/// </summary>
[GlobalClass]
public partial class DialogData : Resource
{
    [Export] public string DialogId = "";
    [Export] public GameEnums.DialogMode Mode = GameEnums.DialogMode.Dialog;
    [Export] public DialogLine[] Lines = System.Array.Empty<DialogLine>();
}

/// <summary>
/// 对话行
/// </summary>
[GlobalClass]
public partial class DialogLine : Resource
{
    [Export] public string SpeakerA = "";
    [Export] public string SpeakerB = "";
    [Export] public GameEnums.EmotionType EmotionA = GameEnums.EmotionType.Calm;
    [Export] public GameEnums.EmotionType EmotionB = GameEnums.EmotionType.Calm;
    [Export] public string Text = "";
    [Export] public string CutsceneId = "";
}
