using Godot;

/// <summary>
/// 场景管理器 - Autoload单例
/// 处理场景切换与过渡动画
/// </summary>
public partial class SceneManager : Node
{
    public static SceneManager Instance { get; private set; }

    [Signal] public delegate void SceneLoadStartedEventHandler();
    [Signal] public delegate void SceneLoadCompletedEventHandler(string sceneName);

    public string CurrentSceneName { get; private set; } = "";
    public bool IsTransitioning { get; private set; }

    private ColorRect _fadeRect;
    private const float FadeDuration = 0.5f;
    private float _fadeAlpha;
    private bool _fadingOut;
    private string _pendingScene;

    public override void _EnterTree()
    {
        Instance = this;
    }

    public override void _Ready()
    {
        // 创建淡入淡出遮罩
        _fadeRect = new ColorRect
        {
            Color = new Color(0, 0, 0, 0),
            MouseFilter = Control.MouseFilterEnum.Ignore,
            ZIndex = 100
        };
        _fadeRect.SetAnchorsPreset(Control.LayoutPreset.FullRect);
        AddChild(_fadeRect);
    }

    public override void _Process(double delta)
    {
        if (!IsTransitioning) return;

        var dt = (float)delta;

        if (_fadingOut)
        {
            _fadeAlpha += dt / FadeDuration;
            if (_fadeAlpha >= 1f)
            {
                _fadeAlpha = 1f;
                DoSceneChange();
            }
        }
        else
        {
            _fadeAlpha -= dt / FadeDuration;
            if (_fadeAlpha <= 0f)
            {
                _fadeAlpha = 0f;
                IsTransitioning = false;
                _fadeRect.MouseFilter = Control.MouseFilterEnum.Ignore;
            }
        }

        _fadeRect.Color = new Color(0, 0, 0, _fadeAlpha);
    }

    /// <summary>切换场景</summary>
    public void ChangeScene(string scenePath, GameEnums.TransitionType transitionType = GameEnums.TransitionType.Fade)
    {
        if (IsTransitioning) return;

        _pendingScene = scenePath;

        if (transitionType == GameEnums.TransitionType.Instant)
        {
            DoSceneChange();
            return;
        }

        IsTransitioning = true;
        _fadingOut = true;
        _fadeAlpha = 0f;
        _fadeRect.MouseFilter = Control.MouseFilterEnum.Stop;
        EmitSignal(SignalName.SceneLoadStarted);
    }

    private void DoSceneChange()
    {
        _fadingOut = false;
        GetTree().ChangeSceneToFile(_pendingScene);

        CurrentSceneName = _pendingScene;
        EmitSignal(SignalName.SceneLoadCompleted, CurrentSceneName);
        GD.Print($"[SceneManager] 场景切换完成: {CurrentSceneName}");
    }
}
