using Godot;

/// <summary>
/// 角色面板UI
/// 显示角色属性、HP/护盾状态、阵营信息
/// </summary>
[GlobalClass]
public partial class CharacterPanelUI : Control
{
    private Label _nameLabel;
    private Label _factionLabel;
    private ProgressBar _hpBar;
    private ProgressBar _shieldBar;
    private Label _statsLabel;

    public override void _Ready()
    {
        BuildScene();
    }

    /// <summary>
    /// 显示角色属性
    /// </summary>
    /// <param name="data">角色数据</param>
    /// <param name="health">生命组件</param>
    public void ShowStats(CharacterData data, HealthComponent health)
    {
        if (_nameLabel != null && data != null)
        {
            _nameLabel.Text = data.DisplayName;
        }

        if (_factionLabel != null && data != null)
        {
            _factionLabel.Text = data.Faction.ToString();
        }

        if (_hpBar != null && health != null)
        {
            _hpBar.MaxValue = health.MaxHealth;
            _hpBar.Value = health.CurrentHealth;
        }

        if (_shieldBar != null && health != null)
        {
            _shieldBar.MaxValue = health.MaxShield;
            _shieldBar.Value = health.CurrentShield;
        }

        if (_statsLabel != null && data != null)
        {
            _statsLabel.Text = $"速度: {data.MoveSpeed}\n护盾吸收: {data.ShieldAbsorbRate * 100}%";
        }
    }

    /// <summary>
    /// 代码构建子节点
    /// </summary>
    private void BuildScene()
    {
        SetAnchorsPreset(Control.LayoutPreset.FullRect);

        var panel = new Panel();
        panel.AnchorLeft = 0.25f;
        panel.AnchorRight = 0.75f;
        panel.AnchorTop = 0.15f;
        panel.AnchorBottom = 0.85f;
        AddChild(panel);
        panel.Owner = this;

        var container = new VBoxContainer();
        container.SetAnchorsAndOffsetsPreset(Control.LayoutPreset.FullRect, Control.LayoutPreset.KeepSize, 20);
        panel.AddChild(container);
        container.Owner = panel;

        _nameLabel = new Label { Name = "NameLabel", Text = "角色" };
        container.AddChild(_nameLabel);
        _nameLabel.Owner = panel;

        _factionLabel = new Label { Name = "FactionLabel", Text = "阵营" };
        container.AddChild(_factionLabel);
        _factionLabel.Owner = panel;

        _hpBar = new ProgressBar { Name = "HPBar", CustomMinimumSize = new Vector2(200, 16) };
        container.AddChild(_hpBar);
        _hpBar.Owner = panel;

        _shieldBar = new ProgressBar { Name = "ShieldBar", CustomMinimumSize = new Vector2(200, 8) };
        container.AddChild(_shieldBar);
        _shieldBar.Owner = panel;

        _statsLabel = new Label { Name = "StatsLabel" };
        container.AddChild(_statsLabel);
        _statsLabel.Owner = panel;

        var closeButton = new Button { Text = "关闭" };
        closeButton.Pressed += () => { Visible = false; };
        container.AddChild(closeButton);
        closeButton.Owner = panel;
    }
}
