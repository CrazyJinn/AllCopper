using Godot;

/// <summary>
/// 游戏管理器（Autoload）
/// 管理全局游戏状态机、场景切换和流程控制
/// </summary>
[GlobalClass]
public partial class GameManager : Node
{
    public static GameManager Instance { get; private set; }

    /// <summary>当前游戏状态</summary>
    public GameState CurrentState { get; private set; } = GameState.MainMenu;

    /// <summary>当前章节</summary>
    public string CurrentChapter { get; private set; }

    /// <summary>当前区域ID</summary>
    public string CurrentRegion { get; private set; }

    /// <summary>当前阵营</summary>
    public FactionType ActiveFaction { get; private set; }

    /// <summary>待启动的对话ID（场景切换时暂存）</summary>
    public string PendingDialogId { get; private set; }

    /// <summary>对话结束后返回的场景路径</summary>
    public string PendingReturnScene { get; private set; }

    public override void _Ready()
    {
        Instance = this;
        JsonDataLoader.LoadAll();
    }

    /// <summary>
    /// 切换游戏状态
    /// </summary>
    /// <param name="newState">目标状态</param>
    public void ChangeState(GameState newState)
    {
        if (CurrentState == newState) return;
        GD.Print($"[GameManager] State: {CurrentState} → {newState}");
        CurrentState = newState;
    }

    /// <summary>
    /// 开始新游戏
    /// </summary>
    /// <param name="faction">选择阵营</param>
    public void StartNewGame(FactionType faction)
    {
        ActiveFaction = faction;
        CurrentChapter = "chapter_01";
        CurrentRegion = "region_01";
        ChangeState(GameState.Battle);
        GD.Print($"[GameManager] New game started. Faction: {faction}");
    }

    /// <summary>
    /// 切换到战斗场景
    /// </summary>
    /// <param name="regionId">目标区域ID</param>
    public void TransitionToBattle(string regionId)
    {
        CurrentRegion = regionId;
        ChangeState(GameState.Battle);
        EventBus.EmitSceneTransition("res://scenes/BattleScene.tscn");
    }

    /// <summary>
    /// 切换到大地图
    /// </summary>
    public void TransitionToWorldMap()
    {
        ChangeState(GameState.WorldMap);
        EventBus.EmitSceneTransition("res://scenes/WorldMap.tscn");
    }

    /// <summary>
    /// 请求对话
    /// </summary>
    /// <param name="dialogId">对话ID</param>
    public void RequestDialog(string dialogId)
    {
        ChangeState(GameState.Dialog);
        EventBus.EmitDialogRequested(dialogId);
    }

    /// <summary>
    /// 切换到对话场景
    /// </summary>
    /// <param name="dialogId">对话ID</param>
    /// <param name="returnScenePath">对话结束后返回的场景路径</param>
    public void TransitionToDialog(string dialogId, string returnScenePath = null)
    {
        PendingDialogId = dialogId;
        PendingReturnScene = returnScenePath ?? "res://scenes/BattleScene.tscn";
        ChangeState(GameState.Dialog);
        EventBus.EmitSceneTransition("res://scenes/DialogScene.tscn");
    }

    /// <summary>
    /// 暂停游戏
    /// </summary>
    public void PauseGame()
    {
        if (CurrentState == GameState.MainMenu) return;
        GetTree().Paused = true;
        ChangeState(GameState.Paused);
    }

    /// <summary>
    /// 恢复游戏
    /// </summary>
    public void ResumeGame()
    {
        GetTree().Paused = false;
        ChangeState(GameState.Battle);
    }

    /// <summary>
    /// 请求存档
    /// </summary>
    public void RequestSave()
    {
        EventBus.EmitSaveRequested();
    }

    /// <summary>
    /// 请求读档
    /// </summary>
    /// <param name="savePath">存档文件路径</param>
    public void RequestLoad(string savePath)
    {
        // 存档加载逻辑在 SaveData 模块中实现
        GD.Print($"[GameManager] Load requested: {savePath}");
    }
}
