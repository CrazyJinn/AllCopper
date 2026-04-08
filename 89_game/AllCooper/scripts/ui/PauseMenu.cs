using Godot;

/// <summary>
/// 暂停菜单 - 暂停/继续/返回主菜单
/// </summary>
public partial class PauseMenu : CanvasLayer
{
    private Control _panel;
    private Button _resumeButton;
    private Button _mainMenuButton;
    private Button _settingsButton;

    public override void _Ready()
    {
        Layer = 100;

        _panel = new Control { Name = "PausePanel" };
        _panel.SetAnchorsPreset(Control.LayoutPreset.FullRect);
        AddChild(_panel);

        // 半透明背景
        var bg = new ColorRect { Color = new Color(0, 0, 0, 0.5f) };
        bg.SetAnchorsPreset(Control.LayoutPreset.FullRect);
        bg.MouseFilter = Control.MouseFilterEnum.Stop;
        _panel.AddChild(bg);

        // 居中容器
        var center = new VBoxContainer { Name = "ButtonContainer" };
        center.SetAnchorsPreset(Control.LayoutPreset.Center);
        center.Position = new Vector2(-100, -80);
        center.CustomMinimumSize = new Vector2(200, 200);
        _panel.AddChild(center);

        _resumeButton = CreateButton("继续游戏", () => Resume());
        _mainMenuButton = CreateButton("返回主菜单", () => BackToMainMenu());
        _settingsButton = CreateButton("设置", () => GD.Print("打开设置"));

        center.AddChild(_resumeButton);
        center.AddChild(_mainMenuButton);
        center.AddChild(_settingsButton);

        _panel.Visible = false;
    }

    public override void _Input(InputEvent @event)
    {
        if (@event.IsActionPressed("pause"))
        {
            if (_panel.Visible)
                Resume();
            else
                Pause();
        }
    }

    private void Pause()
    {
        _panel.Visible = true;
        GameManager.Instance?.ChangeState(GameEnums.GameState.Paused);
    }

    private void Resume()
    {
        _panel.Visible = false;
        GameManager.Instance?.RestorePreviousState();
    }

    private void BackToMainMenu()
    {
        _panel.Visible = false;
        GetTree().Paused = false;
        GameManager.Instance?.ChangeState(GameEnums.GameState.MainMenu);
        SceneManager.Instance?.ChangeScene("res://scenes/main_menu.tscn");
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
