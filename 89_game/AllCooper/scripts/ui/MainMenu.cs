using Godot;

/// <summary>
/// 主菜单 - 游戏入口
/// </summary>
public partial class MainMenu : CanvasLayer
{
    private Control _root;
    private Button _startButton;
    private Button _loadButton;
    private Button _settingsButton;
    private Button _quitButton;
    private Label _title;

    public override void _Ready()
    {
        Layer = 10;

        _root = new Control { Name = "MainMenuRoot" };
        _root.SetAnchorsPreset(Control.LayoutPreset.FullRect);
        AddChild(_root);

        // 标题
        _title = new Label
        {
            Name = "Title",
            Text = "万物为铜",
            HorizontalAlignment = HorizontalAlignment.Center
        };
        _title.SetAnchorsPreset(Control.LayoutPreset.CenterTop);
        _title.Position = new Vector2(0, 100);
        _title.SetAnchorsAndOffsetsPreset(Control.LayoutPreset.CenterTop);
        _root.AddChild(_title);

        // 按钮容器
        var container = new VBoxContainer { Name = "ButtonContainer" };
        container.SetAnchorsPreset(Control.LayoutPreset.Center);
        container.Position = new Vector2(-100, 0);
        container.CustomMinimumSize = new Vector2(200, 250);
        _root.AddChild(container);

        _startButton = CreateButton("开始游戏", OnStartGame);
        _loadButton = CreateButton("继续游戏", OnLoadGame);
        _settingsButton = CreateButton("设置", OnSettings);
        _quitButton = CreateButton("退出游戏", OnQuit);

        container.AddChild(_startButton);
        container.AddChild(_loadButton);
        container.AddChild(_settingsButton);
        container.AddChild(_quitButton);

        GameManager.Instance?.ChangeState(GameEnums.GameState.MainMenu);
    }

    private void OnStartGame()
    {
        GameManager.Instance?.ChangeState(GameEnums.GameState.Exploring);
        SceneManager.Instance?.ChangeScene("res://scenes/game.tscn");
    }

    private void OnLoadGame()
    {
        // TODO: 调用存档系统
        GD.Print("[MainMenu] 加载存档（待实现）");
    }

    private void OnSettings()
    {
        // TODO: 打开设置界面
        GD.Print("[MainMenu] 打开设置（待实现）");
    }

    private void OnQuit()
    {
        GetTree().Quit();
    }

    private Button CreateButton(string text, Callable onPressed)
    {
        var btn = new Button
        {
            Text = text,
            CustomMinimumSize = new Vector2(200, 50)
        };
        btn.Pressed += onPressed;
        return btn;
    }
}
