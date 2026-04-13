using Godot;

/// <summary>
/// Boss血条UI
/// 监听 HealthComponent 信号实时更新Boss血量和护盾
/// 默认隐藏，Boss战开始时显示
/// </summary>
[GlobalClass]
public partial class BossHPBar : Control
{
    private ProgressBar _hpBar;
    private ProgressBar _shieldBar;
    private Label _nameLabel;
    private HealthComponent _trackedHealth;

    public override void _Ready()
    {
        BuildScene();
    }

    /// <summary>
    /// 初始化Boss血条（绑定HealthComponent）
    /// </summary>
    /// <param name="name">Boss名称</param>
    /// <param name="health">Boss的HealthComponent</param>
    public void Initialize(string name, HealthComponent health)
    {
        _trackedHealth = health;
        if (_nameLabel != null) _nameLabel.Text = name;

        if (_trackedHealth != null)
        {
            _trackedHealth.HealthChanged += OnHealthChanged;
            _trackedHealth.ShieldChanged += OnShieldChanged;
            OnHealthChanged(_trackedHealth.CurrentHealth, _trackedHealth.MaxHealth);
            OnShieldChanged(_trackedHealth.CurrentShield, _trackedHealth.MaxShield);
        }

        Visible = true;
    }

    /// <summary>
    /// 隐藏Boss血条
    /// </summary>
    public void HideBar()
    {
        if (_trackedHealth != null)
        {
            _trackedHealth.HealthChanged -= OnHealthChanged;
            _trackedHealth.ShieldChanged -= OnShieldChanged;
        }
        _trackedHealth = null;
        Visible = false;
    }

    private void OnHealthChanged(float current, float max)
    {
        if (_hpBar != null)
        {
            _hpBar.MaxValue = max;
            _hpBar.Value = current;
        }
    }

    private void OnShieldChanged(float current, float max)
    {
        if (_shieldBar != null)
        {
            _shieldBar.MaxValue = max;
            _shieldBar.Value = current;
        }
    }

    /// <summary>
    /// 代码构建子节点
    /// </summary>
    private void BuildScene()
    {
        Visible = false;

        // 外框容器
        var container = new VBoxContainer();
        container.Name = "BossInfo";
        container.AnchorLeft = 0.2f;
        container.AnchorRight = 0.8f;
        container.AnchorTop = 0.02f;
        container.AnchorBottom = 0.06f;
        AddChild(container);
        container.Owner = this;

        // Boss名称
        _nameLabel = new Label();
        _nameLabel.Name = "BossName";
        _nameLabel.HorizontalAlignment = HorizontalAlignment.Center;
        container.AddChild(_nameLabel);
        _nameLabel.Owner = this;

        // 护盾条
        _shieldBar = new ProgressBar();
        _shieldBar.Name = "ShieldBar";
        _shieldBar.CustomMinimumSize = new Vector2(0, 6);
        container.AddChild(_shieldBar);
        _shieldBar.Owner = this;

        // HP条
        _hpBar = new ProgressBar();
        _hpBar.Name = "HPBar";
        _hpBar.CustomMinimumSize = new Vector2(0, 12);
        container.AddChild(_hpBar);
        _hpBar.Owner = this;
    }
}
