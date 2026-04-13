using Godot;

/// <summary>
/// 主菜单UI
/// 全屏覆盖，包含标题和开始/设置/退出按钮
/// </summary>
[GlobalClass]
public partial class MainMenuUI : Control
{
    // ===== 信号 =====

    [Signal]
    public delegate void StartGamePressedEventHandler();

    [Signal]
    public delegate void SettingsPressedEventHandler();

    [Signal]
    public delegate void QuitPressedEventHandler();

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

        // 背景
        var background = new TextureRect();
        background.Name = "Background";
        background.SetAnchorsPreset(Control.LayoutPreset.FullRect);
        background.StretchMode = TextureRect.StretchModeEnum.KeepAspectCovered;
        AddChild(background);
        background.Owner = this;

        // 标题
        var titleLabel = new Label();
        titleLabel.Name = "TitleLabel";
        titleLabel.Text = "万物为铜";
        titleLabel.AnchorLeft = 0.3f;
        titleLabel.AnchorRight = 0.7f;
        titleLabel.AnchorTop = 0.2f;
        titleLabel.AnchorBottom = 0.35f;
        titleLabel.HorizontalAlignment = HorizontalAlignment.Center;
        titleLabel.VerticalAlignment = VerticalAlignment.Center;
        AddChild(titleLabel);
        titleLabel.Owner = this;

        // 按钮容器
        var buttonContainer = new VBoxContainer();
        buttonContainer.Name = "ButtonContainer";
        buttonContainer.AnchorLeft = 0.35f;
        buttonContainer.AnchorRight = 0.65f;
        buttonContainer.AnchorTop = 0.5f;
        buttonContainer.AnchorBottom = 0.8f;
        AddChild(buttonContainer);
        buttonContainer.Owner = this;

        var startButton = new Button { Name = "StartButton", Text = "开始游戏" };
        startButton.Pressed += () => EmitSignal(SignalName.StartGamePressed);
        buttonContainer.AddChild(startButton);
        startButton.Owner = this;

        var settingsButton = new Button { Name = "SettingsButton", Text = "设置" };
        settingsButton.Pressed += () => EmitSignal(SignalName.SettingsPressed);
        buttonContainer.AddChild(settingsButton);
        settingsButton.Owner = this;

        var quitButton = new Button { Name = "QuitButton", Text = "退出" };
        quitButton.Pressed += () => EmitSignal(SignalName.QuitPressed);
        buttonContainer.AddChild(quitButton);
        quitButton.Owner = this;
    }
}
