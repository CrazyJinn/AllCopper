using Godot;

/// <summary>
/// 暂停菜单UI
/// 全屏覆盖，包含继续/设置/返回主菜单按钮
/// </summary>
[GlobalClass]
public partial class PauseMenuUI : Control
{
    // ===== 信号 =====

    [Signal]
    public delegate void ResumePressedEventHandler();

    [Signal]
    public delegate void SettingsPressedEventHandler();

    [Signal]
    public delegate void MainMenuPressedEventHandler();

    public override void _Ready()
    {
        BuildScene();
    }

    /// <summary>
    /// 代码构建子节点
    /// </summary>
    private void BuildScene()
    {
        SetAnchorsPreset(Control.LayoutPreset.FullRect);

        // 半透明背景
        var overlay = new ColorRect();
        overlay.Name = "Overlay";
        overlay.SetAnchorsPreset(Control.LayoutPreset.FullRect);
        overlay.Color = new Color(0, 0, 0, 0.6f);
        AddChild(overlay);
        overlay.Owner = this;

        // 按钮容器
        var buttonContainer = new VBoxContainer();
        buttonContainer.Name = "ButtonContainer";
        buttonContainer.AnchorLeft = 0.35f;
        buttonContainer.AnchorRight = 0.65f;
        buttonContainer.AnchorTop = 0.3f;
        buttonContainer.AnchorBottom = 0.7f;
        AddChild(buttonContainer);
        buttonContainer.Owner = this;

        var resumeButton = new Button { Name = "ResumeButton", Text = "继续游戏" };
        resumeButton.Pressed += () => EmitSignal(SignalName.ResumePressed);
        buttonContainer.AddChild(resumeButton);
        resumeButton.Owner = this;

        var settingsButton = new Button { Name = "SettingsButton", Text = "设置" };
        settingsButton.Pressed += () => EmitSignal(SignalName.SettingsPressed);
        buttonContainer.AddChild(settingsButton);
        settingsButton.Owner = this;

        var mainMenuButton = new Button { Name = "MainMenuButton", Text = "返回主菜单" };
        mainMenuButton.Pressed += () => EmitSignal(SignalName.MainMenuPressed);
        buttonContainer.AddChild(mainMenuButton);
        mainMenuButton.Owner = this;
    }
}
