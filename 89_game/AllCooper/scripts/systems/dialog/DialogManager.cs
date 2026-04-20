using Godot;

/// <summary>
/// 对话管理器
/// 管理对话流程的启动、推进、跳过和布局切换
/// 由 GameManager 通过 EventBus.OnDialogRequested 触发
/// </summary>
[GlobalClass]
public partial class DialogManager : Node
{
    // ===== 信号 =====

    [Signal]
    public delegate void DialogStartedEventHandler(string dialogId);

    [Signal]
    public delegate void DialogAdvancedEventHandler(int entryIndex);

    [Signal]
    public delegate void DialogEndedEventHandler(string dialogId);

    [Signal]
    public delegate void CutsceneTriggeredEventHandler(string cutsceneId);

    // ===== 公共属性 =====

    /// <summary>是否正在对话中</summary>
    public bool IsActive => _isActive;

    /// <summary>当前对话条目</summary>
    public DialogEntry CurrentEntry => _currentDialog?.Entries?[_currentEntryIndex];

    // ===== 私有字段 =====

    private DialogData _currentDialog;
    private int _currentEntryIndex;
    private bool _isActive;

    public override void _Ready()
    {
        EventBus.OnDialogRequested += OnDialogRequested;
    }

    public override void _ExitTree()
    {
        EventBus.OnDialogRequested -= OnDialogRequested;
    }

    /// <summary>
    /// 开始对话
    /// </summary>
    /// <param name="data">对话数据</param>
    public void StartDialog(DialogData data)
    {
        if (data?.Entries == null || data.Entries.Length == 0)
        {
            // 空对话立即结束
            return;
        }

        _currentDialog = data;
        _currentEntryIndex = 0;
        _isActive = true;

        EmitSignal(SignalName.DialogStarted, data.DialogId);

        // 检查首条是否有过场
        CheckCutscene();
    }

    /// <summary>
    /// 推进到下一条对话
    /// </summary>
    public void Advance()
    {
        if (!_isActive || _currentDialog == null) return;

        _currentEntryIndex++;

        if (_currentEntryIndex >= _currentDialog.Entries.Length)
        {
            // 对话结束
            string dialogId = _currentDialog.DialogId;
            _isActive = false;
            _currentDialog = null;
            _currentEntryIndex = 0;

            EmitSignal(SignalName.DialogEnded, dialogId);

            // 恢复游戏状态
            if (GameManager.Instance?.CurrentState == GameState.Dialog)
            {
                GameManager.Instance.ChangeState(GameState.Battle);
            }
            return;
        }

        EmitSignal(SignalName.DialogAdvanced, _currentEntryIndex);
        CheckCutscene();
    }

    /// <summary>
    /// 跳过当前对话
    /// </summary>
    public void Skip()
    {
        if (!_isActive || _currentDialog == null) return;

        string dialogId = _currentDialog.DialogId;
        _isActive = false;
        _currentDialog = null;
        _currentEntryIndex = 0;

        EmitSignal(SignalName.DialogEnded, dialogId);

        if (GameManager.Instance?.CurrentState == GameState.Dialog)
        {
            GameManager.Instance.ChangeState(GameState.Battle);
        }
    }

    /// <summary>
    /// 获取当前对话布局
    /// </summary>
    public DialogLayout GetCurrentLayout()
    {
        return CurrentEntry?.Layout ?? DialogLayout.SideBySide;
    }

    /// <summary>
    /// EventBus 回调：开始对话
    /// </summary>
    private void OnDialogRequested(string dialogId)
    {
        var dialogData = JsonDataLoader.GetDialog(dialogId);
        if (dialogData != null)
        {
            StartDialog(dialogData);
        }
    }

    /// <summary>
    /// 检查当前条目是否需要触发过场
    /// </summary>
    private void CheckCutscene()
    {
        if (CurrentEntry == null) return;
        if (!string.IsNullOrEmpty(CurrentEntry.CutsceneId))
        {
            EmitSignal(SignalName.CutsceneTriggered, CurrentEntry.CutsceneId);
        }
    }
}
