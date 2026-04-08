using Godot;

/// <summary>
/// 战斗控制器基类 - 策略模式抽象
/// </summary>
public abstract partial class CombatController : Node
{
    [Signal] public delegate void AttackExecutedEventHandler();
    [Signal] public delegate void SkillUsedEventHandler(int skillIndex);
    [Signal] public delegate void ChargeStartedEventHandler();
    [Signal] public delegate void ChargeReleasedEventHandler(float chargeLevel);

    protected PlayerController _player;
    protected BattleResource _resource;
    protected SkillData[] _skills;

    public void Initialize(PlayerController player, BattleResource resource, SkillData[] skills)
    {
        _player = player;
        _resource = resource;
        _skills = skills;

        var cooldowns = new float[skills.Length];
        for (int i = 0; i < skills.Length; i++)
            cooldowns[i] = skills[i].Cooldown;
        resource.InitSkillCooldowns(cooldowns);
    }

    public abstract void OnAttack();
    public abstract void OnUltimate();
    public abstract void OnSkill1();
    public abstract void OnSkill2();
    public abstract void OnReload();

    public override void _Process(double delta)
    {
        if (!Input.IsActionJustPressed("attack")) return;
        OnAttack();
    }
}

/// <summary>
/// 科技路线战斗 - 近战/枪械
/// </summary>
public partial class TechCombat : CombatController
{
    private int _currentCombo;
    private float _comboTimer;
    private const float ComboWindow = 0.5f;
    private bool _isReloading;

    public override void _Process(double delta)
    {
        base._Process(delta);

        if (_comboTimer > 0)
        {
            _comboTimer -= (float)delta;
            if (_comboTimer <= 0) _currentCombo = 0;
        }

        if (Input.IsActionJustPressed("ultimate")) OnUltimate();
        if (Input.IsActionJustPressed("skill_1")) OnSkill1();
        if (Input.IsActionJustPressed("skill_2")) OnSkill2();
        if (Input.IsActionJustPressed("reload")) OnReload();
    }

    public override void OnAttack()
    {
        if (_isReloading) return;
        if (!_resource.ConsumeAmmo(1))
        {
            // 空弹音效
            AudioManager.Instance?.PlaySfx("res://assets/sfx/empty_click.ogg");
            return;
        }

        // 发射子弹
        var projectile = ProjectilePool.Instance?.Get();
        if (projectile != null)
        {
            projectile.GlobalPosition = _player.GlobalPosition;
            projectile.Fire(_player.Facing == GameEnums.FacingDirection.Front ? Vector2.Down : Vector2.Up, 500f, 10f);
        }

        _currentCombo++;
        _comboTimer = ComboWindow;
        EmitSignal(SignalName.AttackExecuted);
    }

    public override void OnUltimate()
    {
        if (!_resource.UseSkill(0)) return;
        EmitSignal(SignalName.SkillUsed, 0);
    }

    public override void OnSkill1()
    {
        if (!_resource.UseSkill(1)) return;
        EmitSignal(SignalName.SkillUsed, 1);
    }

    public override void OnSkill2()
    {
        if (!_resource.UseSkill(2)) return;
        EmitSignal(SignalName.SkillUsed, 2);
    }

    public override void OnReload()
    {
        if (_isReloading || _resource.Ammo == _resource.MaxAmmo) return;
        _isReloading = true;

        // 创建换弹计时器
        var timer = GetTree().CreateTimer(1.5);
        timer.Timeout += () =>
        {
            _resource.ReloadAmmo();
            _isReloading = false;
        };
    }
}

/// <summary>
/// 魔法路线战斗 - 蓄力魔法
/// </summary>
public partial class MagicCombat : CombatController
{
    private float _chargeLevel;
    private bool _isCharging;
    private const float ChargeTime = 2f;

    public override void _Process(double delta)
    {
        var dt = (float)delta;

        if (_isCharging)
        {
            _chargeLevel += dt / ChargeTime;
            if (_chargeLevel >= 1f)
            {
                OnChargeRelease();
            }
        }

        if (Input.IsActionJustPressed("ultimate")) OnUltimate();
        if (Input.IsActionJustPressed("skill_1")) OnSkill1();
        if (Input.IsActionJustPressed("skill_2")) OnSkill2();
        if (Input.IsActionJustPressed("reload")) OnReload();
    }

    public override void OnAttack()
    {
        if (_isCharging) return;
        _isCharging = true;
        _chargeLevel = 0f;
        EmitSignal(SignalName.ChargeStarted);
    }

    private void OnChargeRelease()
    {
        CastSpell(_chargeLevel);
        _chargeLevel = 0f;
        _isCharging = false;
        EmitSignal(SignalName.ChargeReleased, _chargeLevel);
    }

    private void CastSpell(float power)
    {
        // AOE伤害判定
        var area = new Area2D { Name = "SpellAOE" };
        var shape = new CircleShape2D { Radius = 100f * power };
        var collision = new CollisionShape2D { Shape = shape };
        area.AddChild(collision);
        area.GlobalPosition = _player.GlobalPosition;
        _player.GetParent().AddChild(area);

        foreach (var body in area.GetOverlappingBodies())
        {
            if (body.HasMethod("TakeDamageFromSpell"))
            {
                body.Call("TakeDamageFromSpell", 30f * power, GameEnums.DamageType.Normal);
            }
        }

        area.QueueFree();
    }

    public override void OnUltimate()
    {
        if (!_resource.UseSkill(0)) return;
        EmitSignal(SignalName.SkillUsed, 0);
    }

    public override void OnSkill1()
    {
        if (!_resource.UseSkill(1)) return;
        EmitSignal(SignalName.SkillUsed, 1);
    }

    public override void OnSkill2()
    {
        if (!_resource.UseSkill(2)) return;
        EmitSignal(SignalName.SkillUsed, 2);
    }

    public override void OnReload()
    {
        // 魔法路线：加快技能CD
        _resource.ReduceAllCooldowns(0.5f);
    }
}
