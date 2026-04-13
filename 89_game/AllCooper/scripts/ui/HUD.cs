using Godot;

/// <summary>
/// 战斗HUD总控
/// 管理HP条、护盾条、弹药数、技能栏、快捷栏、货币、小地图、Boss血条
/// 通过绑定 PlayerController 的信号驱动更新
/// </summary>
[GlobalClass]
public partial class HUD : CanvasLayer
{
    // ===== 子节点引用 =====

    private ProgressBar _hpBar;
    private ProgressBar _shieldBar;
    private Label _ammoLabel;
    private HBoxContainer _skillBar;
    private Control _hotbar;
    private Label _currencyLabel;
    private Control _minimap;
    private BossHPBar _bossHPBar;
    private DamageNumber _damageNumberTemplate;

    public override void _Ready()
    {
        BuildScene();
        Layer = 10;
    }

    /// <summary>
    /// 绑定玩家控制器，订阅所有信号
    /// </summary>
    /// <param name="player">玩家实例</param>
    public void BindPlayer(PlayerController player)
    {
        if (player?.Health == null) return;

        player.Health.HealthChanged += OnHealthChanged;
        player.Health.ShieldChanged += OnShieldChanged;

        var resource = player.CombatResource;
        if (resource != null)
        {
            resource.AmmoChanged += OnAmmoChanged;
        }
    }

    /// <summary>
    /// 显示Boss血条
    /// </summary>
    /// <param name="name">Boss名称</param>
    /// <param name="health">Boss HealthComponent</param>
    public void ShowBossHP(string name, HealthComponent health)
    {
        _bossHPBar?.Initialize(name, health);
    }

    /// <summary>
    /// 隐藏Boss血条
    /// </summary>
    public void HideBossHP()
    {
        _bossHPBar?.HideBar();
    }

    /// <summary>
    /// 生成浮动伤害数字
    /// </summary>
    /// <param name="amount">伤害数值</param>
    /// <param name="worldPos">世界坐标</param>
    /// <param name="isCritical">是否暴击</param>
    public void SpawnDamageNumber(float amount, Vector2 worldPos, bool isCritical)
    {
        var dmgNum = ObjectPool.Instance?.Get<DamageNumber>("damage_number");
        if (dmgNum != null)
        {
            dmgNum.ShowDamage(amount, isCritical, worldPos);
        }
    }

    /// <summary>
    /// 更新货币显示
    /// </summary>
    /// <param name="amount">当前金额</param>
    public void UpdateCurrency(float amount)
    {
        if (_currencyLabel != null)
        {
            _currencyLabel.Text = Mathf.CeilToInt(amount).ToString();
        }
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

    private void OnAmmoChanged(int current, int max)
    {
        if (_ammoLabel != null)
        {
            _ammoLabel.Text = $"{current}/{max}";
        }
    }

    /// <summary>
    /// 代码构建HUD场景树
    /// </summary>
    private void BuildScene()
    {
        var root = new Control();
        root.Name = "HUDRoot";
        root.SetAnchorsPreset(Control.LayoutPreset.FullRect);
        AddChild(root);
        root.Owner = this;

        // ===== 左上角：HP/护盾/弹药 =====
        var topLeft = new VBoxContainer();
        topLeft.Name = "TopLeft";
        topLeft.AnchorLeft = 0.02f;
        topLeft.AnchorTop = 0.02f;
        topLeft.AnchorRight = 0.2f;
        topLeft.AnchorBottom = 0.1f;
        root.AddChild(topLeft);
        topLeft.Owner = root;

        _hpBar = new ProgressBar { Name = "HPBar", CustomMinimumSize = new Vector2(200, 16) };
        topLeft.AddChild(_hpBar);
        _hpBar.Owner = root;

        _shieldBar = new ProgressBar { Name = "ShieldBar", CustomMinimumSize = new Vector2(200, 8) };
        topLeft.AddChild(_shieldBar);
        _shieldBar.Owner = root;

        _ammoLabel = new Label { Name = "AmmoCount", Text = "30/30" };
        topLeft.AddChild(_ammoLabel);
        _ammoLabel.Owner = root;

        // ===== 右上角：货币 =====
        _currencyLabel = new Label();
        _currencyLabel.Name = "CurrencyLabel";
        _currencyLabel.AnchorLeft = 0.9f;
        _currencyLabel.AnchorTop = 0.02f;
        _currencyLabel.Text = "0";
        root.AddChild(_currencyLabel);
        _currencyLabel.Owner = root;

        // ===== 底部中央：技能栏 =====
        _skillBar = new HBoxContainer();
        _skillBar.Name = "SkillBar";
        _skillBar.AnchorLeft = 0.35f;
        _skillBar.AnchorRight = 0.65f;
        _skillBar.AnchorTop = 0.88f;
        _skillBar.AnchorBottom = 0.98f;
        root.AddChild(_skillBar);
        _skillBar.Owner = root;

        for (int i = 0; i < 4; i++)
        {
            var slot = new SkillCDIndicator { Name = $"SkillSlot_{i}" };
            _skillBar.AddChild(slot);
            slot.Owner = root;
        }

        // ===== 顶部中央：Boss HP（默认隐藏） =====
        _bossHPBar = new BossHPBar();
        _bossHPBar.Name = "BossHPBar";
        root.AddChild(_bossHPBar);
        _bossHPBar.Owner = root;
    }
}
