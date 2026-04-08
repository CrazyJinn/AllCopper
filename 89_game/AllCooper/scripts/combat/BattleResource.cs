using Godot;

/// <summary>
/// 通用战斗资源组件 - HP/护盾/弹药/技能CD
/// 可挂载到角色或怪物上
/// </summary>
public partial class BattleResource : Node
{
    [Signal] public delegate void ResourceChangedEventHandler();
    [Signal] public delegate void ResourceDepletedEventHandler(string resourceType);

    [Export] public float MaxHP { get; set; } = 100f;
    [Export] public float MaxShield { get; set; } = 50f;
    [Export] public int MaxAmmo { get; set; } = 30;
    [Export] public float ShieldAbsorbRate { get; set; } = 0.7f;
    [Export] public float ShieldRegenRate { get; set; } = 5f;
    [Export] public float ShieldRegenDelay { get; set; } = 3f;

    public float HP { get; private set; }
    public float Shield { get; private set; }
    public int Ammo { get; private set; }
    public float TimeSinceLastHit { get; private set; } = 999f;

    private float[] _skillCooldowns;
    private float[] _skillMaxCooldowns;

    public override void _Ready()
    {
        HP = MaxHP;
        Shield = MaxShield;
        Ammo = MaxAmmo;
    }

    public override void _Process(double delta)
    {
        var dt = (float)delta;

        // 护盾恢复
        TimeSinceLastHit += dt;
        if (TimeSinceLastHit >= ShieldRegenDelay && Shield < MaxShield)
        {
            Shield = Mathf.Min(Shield + ShieldRegenRate * dt, MaxShield);
            EmitSignal(SignalName.ResourceChanged);
        }

        // 技能CD倒计时
        if (_skillCooldowns != null)
        {
            for (int i = 0; i < _skillCooldowns.Length; i++)
            {
                if (_skillCooldowns[i] > 0)
                {
                    _skillCooldowns[i] -= dt;
                    if (_skillCooldowns[i] <= 0)
                    {
                        _skillCooldowns[i] = 0f;
                    }
                }
            }
        }
    }

    /// <summary>受击处理</summary>
    public void TakeDamage(float amount, GameEnums.DamageType damageType)
    {
        TimeSinceLastHit = 0f;
        float shieldDmg = 0f;
        float hpDmg = 0f;

        switch (damageType)
        {
            case GameEnums.DamageType.Normal:
                shieldDmg = amount * ShieldAbsorbRate;
                hpDmg = amount * (1f - ShieldAbsorbRate);
                break;
            case GameEnums.DamageType.Poison:
                hpDmg = amount;
                break;
            case GameEnums.DamageType.ShieldBreak:
                shieldDmg = amount * 3f;
                break;
        }

        Shield -= shieldDmg;
        HP -= hpDmg;

        if (Shield < 0)
        {
            HP += Shield;
            Shield = 0;
        }

        if (HP < 0) HP = 0;

        EmitSignal(SignalName.ResourceChanged);

        if (HP <= 0)
        {
            EmitSignal(SignalName.ResourceDepleted, "hp");
        }
    }

    /// <summary>消耗弹药</summary>
    public bool ConsumeAmmo(int amount = 1)
    {
        if (Ammo < amount) return false;
        Ammo -= amount;
        EmitSignal(SignalName.ResourceChanged);
        if (Ammo <= 0) EmitSignal(SignalName.ResourceDepleted, "ammo");
        return true;
    }

    /// <summary>补充弹药</summary>
    public void ReloadAmmo()
    {
        Ammo = MaxAmmo;
        EmitSignal(SignalName.ResourceChanged);
    }

    /// <summary>初始化技能CD</summary>
    public void InitSkillCooldowns(float[] cooldowns)
    {
        _skillCooldowns = new float[cooldowns.Length];
        _skillMaxCooldowns = new float[cooldowns.Length];
        cooldowns.CopyTo(_skillMaxCooldowns, 0);
    }

    /// <summary>使用技能，开始CD</summary>
    public bool UseSkill(int index)
    {
        if (_skillCooldowns == null || index >= _skillCooldowns.Length) return false;
        if (_skillCooldowns[index] > 0) return false;

        _skillCooldowns[index] = _skillMaxCooldowns[index];
        EmitSignal(SignalName.ResourceChanged);
        return true;
    }

    /// <summary>减少所有技能CD</summary>
    public void ReduceAllCooldowns(float amount)
    {
        if (_skillCooldowns == null) return;
        for (int i = 0; i < _skillCooldowns.Length; i++)
        {
            _skillCooldowns[i] = Mathf.Max(0, _skillCooldowns[i] - amount);
        }
    }

    public float GetCooldown(int index) => _skillCooldowns?[index] ?? 0f;
    public bool IsCooldownReady(int index) => GetCooldown(index) <= 0f;
}
