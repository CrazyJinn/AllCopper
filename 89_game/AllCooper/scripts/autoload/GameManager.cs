using Godot;

/// <summary>
/// 全局管理器 - Autoload单例
/// 维护全局游戏状态，管理玩家数据引用，协调各Autoload单例初始化
/// </summary>
public partial class GameManager : Node
{
    public static GameManager Instance { get; private set; }

    [Signal] public delegate void GameStateChangedEventHandler(GameEnums.GameState newState);
    [Signal] public delegate void SceneTransitionEventHandler(string targetScene, GameEnums.TransitionType transitionType);

    public GameEnums.GameState CurrentState { get; private set; } = GameEnums.GameState.MainMenu;
    public PlayerController Player { get; set; }
    public CharacterData PlayerData { get; set; }

    private GameEnums.GameState _previousState;

    public override void _EnterTree()
    {
        Instance = this;
    }

    public override void _Ready()
    {
        // 协调各Autoload单例初始化（Godot按project.godot注册顺序初始化）
        GD.Print("[GameManager] 初始化完成");
    }

    /// <summary>切换游戏状态</summary>
    public void ChangeState(GameEnums.GameState newState)
    {
        if (CurrentState == newState) return;

        _previousState = CurrentState;
        CurrentState = newState;
        EmitSignal(SignalName.GameStateChanged, (int)newState);

        ProcessMode = newState == GameEnums.GameState.Paused
            ? ProcessModeEnum.Always
            : ProcessModeEnum.Pausable;

        GetTree().Paused = newState == GameEnums.GameState.Paused;
    }

    /// <summary>恢复上一个状态（用于暂停恢复）</summary>
    public void RestorePreviousState()
    {
        ChangeState(_previousState);
    }

    /// <summary>请求场景切换</summary>
    public void RequestSceneTransition(string targetScene, GameEnums.TransitionType transitionType = GameEnums.TransitionType.Fade)
    {
        EmitSignal(SignalName.SceneTransition, targetScene, (int)transitionType);
    }
}
