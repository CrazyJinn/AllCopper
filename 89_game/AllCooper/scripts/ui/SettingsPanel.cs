using Godot;

/// <summary>
/// 设置界面 - 音量、分辨率、按键映射
/// </summary>
public partial class SettingsPanel : CanvasLayer
{
    private Control _panel;
    private HSlider _masterVolumeSlider;
    private HSlider _bgmVolumeSlider;
    private HSlider _sfxVolumeSlider;
    private OptionButton _resolutionOption;
    private Button _backButton;

    public override void _Ready()
    {
        Layer = 100;

        _panel = new Control { Name = "SettingsPanel" };
        _panel.SetAnchorsPreset(Control.LayoutPreset.FullRect);
        AddChild(_panel);

        var bg = new ColorRect { Color = new Color(0, 0, 0, 0.8f) };
        bg.SetAnchorsPreset(Control.LayoutPreset.FullRect);
        _panel.AddChild(bg);

        var container = new VBoxContainer { Name = "SettingsContainer" };
        container.SetAnchorsPreset(Control.LayoutPreset.Center);
        container.CustomMinimumSize = new Vector2(400, 500);
        _panel.AddChild(container);

        // 音量设置
        container.AddChild(new Label { Text = "主音量" });
        _masterVolumeSlider = new HSlider { MinValue = 0, MaxValue = 100, Value = 100, CustomMinimumSize = new Vector2(300, 20) };
        _masterVolumeSlider.ValueChanged += v => AudioManager.Instance?.SetMasterVolume((float)v / 100f);
        container.AddChild(_masterVolumeSlider);

        container.AddChild(new Label { Text = "BGM音量" });
        _bgmVolumeSlider = new HSlider { MinValue = 0, MaxValue = 100, Value = 80, CustomMinimumSize = new Vector2(300, 20) };
        _bgmVolumeSlider.ValueChanged += v => AudioManager.Instance?.SetBgmVolume((float)v / 100f);
        container.AddChild(_bgmVolumeSlider);

        container.AddChild(new Label { Text = "SFX音量" });
        _sfxVolumeSlider = new HSlider { MinValue = 0, MaxValue = 100, Value = 100, CustomMinimumSize = new Vector2(300, 20) };
        _sfxVolumeSlider.ValueChanged += v => AudioManager.Instance?.SetSfxVolume((float)v / 100f);
        container.AddChild(_sfxVolumeSlider);

        // 返回按钮
        _backButton = new Button { Text = "返回", CustomMinimumSize = new Vector2(200, 50) };
        _backButton.Pressed += Close;
        container.AddChild(_backButton);

        _panel.Visible = false;
    }

    public void Open()
    {
        _panel.Visible = true;
    }

    public void Close()
    {
        _panel.Visible = false;
        SaveSettings();
    }

    private void SaveSettings()
    {
        var config = new ConfigFile();
        config.SetValue("audio", "master", _masterVolumeSlider.Value);
        config.SetValue("audio", "bgm", _bgmVolumeSlider.Value);
        config.SetValue("audio", "sfx", _sfxVolumeSlider.Value);
        config.Save("user://settings.cfg");
    }
}
