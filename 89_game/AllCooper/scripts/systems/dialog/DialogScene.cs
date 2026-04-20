using Godot;

/// <summary>
/// 对话场景根节点
/// 独立场景，包含 DialogManager + DialogUI
/// 从 JSON 加载对话数据，处理输入推进，管理立绘切换
/// </summary>
[GlobalClass]
public partial class DialogScene : Control
{
    // ===== 子节点 =====
    private DialogManager _dialogManager;
    private DialogUI _dialogUI;

    // ===== 配置 =====
    private string _returnScenePath = "res://scenes/BattleScene.tscn";

    public override void _Ready()
    {
        BuildScene();
        BindComponents();

        // 自动启动 GameManager 暂存的对话
        var gm = GameManager.Instance;
        if (!string.IsNullOrEmpty(gm?.PendingDialogId))
        {
            StartDialog(gm.PendingDialogId, gm.PendingReturnScene);
        }
    }

    public override void _ExitTree()
    {
        UnbindComponents();
    }

    public override void _UnhandledInput(InputEvent ev)
    {
        if (_dialogManager == null || !_dialogManager.IsActive) return;

        if (ev is InputEventMouseButton mb && mb.Pressed && mb.ButtonIndex == MouseButton.Left)
        {
            _dialogManager.Advance();
            AcceptEvent();
        }
        else if (ev is InputEventKey key && key.Pressed
            && (key.Keycode == Key.Space || key.Keycode == Key.Enter))
        {
            _dialogManager.Advance();
            AcceptEvent();
        }
        else if (ev is InputEventKey esc && esc.Pressed && esc.Keycode == Key.Escape)
        {
            _dialogManager.Skip();
            AcceptEvent();
        }
    }

    /// <summary>
    /// 启动对话
    /// </summary>
    /// <param name="dialogId">对话ID</param>
    /// <param name="returnScenePath">对话结束后返回的场景路径</param>
    public void StartDialog(string dialogId, string returnScenePath = null)
    {
        if (!string.IsNullOrEmpty(returnScenePath))
            _returnScenePath = returnScenePath;

        var data = JsonDataLoader.GetDialog(dialogId);
        if (data == null)
        {
            GD.PrintErr($"[DialogScene] 对话不存在: {dialogId}");
            OnDialogEnded(dialogId);
            return;
        }

        _dialogUI.SetBackground(data.Background);
        _dialogManager.StartDialog(data);
    }

    // ===== 内部方法 =====

    private void BuildScene()
    {
        SetAnchorsPreset(Control.LayoutPreset.FullRect);

        _dialogManager = new DialogManager();
        _dialogManager.Name = "DialogManager";
        AddChild(_dialogManager);
        _dialogManager.Owner = this;

        _dialogUI = new DialogUI();
        _dialogUI.Name = "DialogUI";
        AddChild(_dialogUI);
        _dialogUI.Owner = this;
    }

    private void BindComponents()
    {
        _dialogUI.BindManager(_dialogManager);

        _dialogManager.DialogEnded += OnDialogEnded;
        _dialogManager.CutsceneTriggered += OnCutsceneTriggered;
    }

    private void UnbindComponents()
    {
        if (_dialogManager != null)
        {
            _dialogManager.DialogEnded -= OnDialogEnded;
            _dialogManager.CutsceneTriggered -= OnCutsceneTriggered;
        }
    }

    private void OnDialogEnded(string dialogId)
    {
        _dialogUI.Clear();

        GameManager.Instance?.ChangeState(GameState.Battle);
        EventBus.EmitSceneTransition(_returnScenePath);
    }

    private void OnCutsceneTriggered(string cutsceneId)
    {
        EventBus.EmitCutsceneRequested(cutsceneId);
    }
}
