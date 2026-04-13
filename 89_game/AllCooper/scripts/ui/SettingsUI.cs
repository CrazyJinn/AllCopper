using Godot;

/// <summary>
/// 设置界面UI
/// 提供音乐/SFX音量滑块、分辨率选择
/// </summary>
[GlobalClass]
public partial class SettingsUI : Control
{
    private HSlider _musicVolumeSlider;
    private HSlider _sfxVolumeSlider;
    private OptionButton _resolutionOption;

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

        var overlay = new ColorRect();
        overlay.SetAnchorsPreset(Control.LayoutPreset.FullRect);
        overlay.Color = new Color(0, 0, 0, 0.7f);
        AddChild(overlay);
        overlay.Owner = this;

        var container = new VBoxContainer();
        container.AnchorLeft = 0.25f;
        container.AnchorRight = 0.75f;
        container.AnchorTop = 0.2f;
        container.AnchorBottom = 0.8f;
        AddChild(container);
        container.Owner = this;

        // 音乐音量
        var musicLabel = new Label { Text = "音乐音量" };
        container.AddChild(musicLabel);
        musicLabel.Owner = this;

        _musicVolumeSlider = new HSlider { Name = "MusicVolume", MinValue = 0, MaxValue = 100, Value = 80, Step = 1 };
        _musicVolumeSlider.ValueChanged += (val) =>
        {
            AudioManager.Instance?.SetMusicVolume((float)val / 100f);
        };
        container.AddChild(_musicVolumeSlider);
        _musicVolumeSlider.Owner = this;

        // SFX音量
        var sfxLabel = new Label { Text = "音效音量" };
        container.AddChild(sfxLabel);
        sfxLabel.Owner = this;

        _sfxVolumeSlider = new HSlider { Name = "SFXVolume", MinValue = 0, MaxValue = 100, Value = 80, Step = 1 };
        _sfxVolumeSlider.ValueChanged += (val) =>
        {
            AudioManager.Instance?.SetSFXVolume((float)val / 100f);
        };
        container.AddChild(_sfxVolumeSlider);
        _sfxVolumeSlider.Owner = this;

        // 关闭按钮
        var closeButton = new Button { Text = "关闭" };
        closeButton.Pressed += () => { Visible = false; };
        container.AddChild(closeButton);
        closeButton.Owner = this;
    }
}
