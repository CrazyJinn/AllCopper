using Godot;

/// <summary>
/// 游戏HUD - HP条、护盾条、技能栏、弹药
/// </summary>
public partial class GameHUD : CanvasLayer
{
    private ProgressBar _hpBar;
    private ProgressBar _shieldBar;
    private Label _ammoLabel;
    private HBoxContainer _skillBar;
    private TextureRect[] _skillIcons;
    private TextureProgressBar[] _skillCooldownOverlays;

    private BattleResource _trackedResource;

    public override void _Ready()
    {
        Layer = 10;

        var root = new Control { Name = "HUDRoot" };
        root.SetAnchorsPreset(Control.LayoutPreset.FullRect);
        AddChild(root);

        // HP/护盾条容器（左下角）
        var barsContainer = new VBoxContainer
        {
            Name = "BarsContainer",
            Position = new Vector2(20, 0),
            CustomMinimumSize = new Vector2(250, 50)
        };
        root.AddChild(barsContainer);

        // 设置到底部
        barsContainer.SetAnchorsPreset(Control.LayoutPreset.BottomLeft);
        barsContainer.Position = new Vector2(20, -80);

        _shieldBar = CreateBar("ShieldBar", new Color(0.3f, 0.6f, 1f, 0.8f));
        barsContainer.AddChild(_shieldBar);

        _hpBar = CreateBar("HPBar", new Color(0.9f, 0.2f, 0.2f, 0.9f));
        barsContainer.AddChild(_hpBar);

        // 弹药显示（右下角）
        _ammoLabel = new Label
        {
            Name = "AmmoLabel",
            Text = "30/30",
            Position = new Vector2(-120, -50)
        };
        _ammoLabel.SetAnchorsPreset(Control.LayoutPreset.BottomRight);
        root.AddChild(_ammoLabel);

        // 技能栏（底部中央）
        _skillBar = new HBoxContainer { Name = "SkillBar" };
        _skillBar.SetAnchorsPreset(Control.LayoutPreset.BottomWide);
        _skillBar.Position = new Vector2(0, -60);
        root.AddChild(_skillBar);
    }

    public override void _Process(double delta)
    {
        if (_trackedResource == null) return;

        _hpBar.Value = _trackedResource.HP / _trackedResource.MaxHP * 100;
        _shieldBar.Value = _trackedResource.Shield / _trackedResource.MaxShield * 100;
        _ammoLabel.Text = $"{_trackedResource.Ammo}/{_trackedResource.MaxAmmo}";
    }

    /// <summary>绑定战斗资源</summary>
    public void TrackResource(BattleResource resource)
    {
        _trackedResource = resource;
    }

    private ProgressBar CreateBar(string name, Color color)
    {
        var bar = new ProgressBar
        {
            Name = name,
            CustomMinimumSize = new Vector2(250, 16),
            MaxValue = 100,
            Value = 100
        };

        var styleBg = new StyleBoxFlat
        {
            BgColor = new Color(0.1f, 0.1f, 0.1f, 0.5f),
            CornerRadiusTopLeft = 4,
            CornerRadiusTopRight = 4,
            CornerRadiusBottomLeft = 4,
            CornerRadiusBottomRight = 4
        };
        bar.AddThemeStyleboxOverride("background", styleBg);

        var styleFill = new StyleBoxFlat
        {
            BgColor = color,
            CornerRadiusTopLeft = 4,
            CornerRadiusTopRight = 4,
            CornerRadiusBottomLeft = 4,
            CornerRadiusBottomRight = 4
        };
        bar.AddThemeStyleboxOverride("fill", styleFill);

        return bar;
    }
}
