using Godot;

/// <summary>
/// 生命值组件
/// 管理HP/护盾/伤害分配，挂载于 PlayerController 和 EnemyController
/// 伤害分配算法：普通伤害按 ShieldAbsorbRate 分配到护盾/HP，中毒直接扣HP，碎盾只扣护盾
/// </summary>
[GlobalClass]
public partial class HealthComponent : Node
{
    // ===== 信号 =====

    [Signal]
    public delegate void HealthChangedEventHandler(float current, float max);

    [Signal]
    public delegate void ShieldChangedEventHandler(float current, float max);

    [Signal]
    public delegate void DamagedEventHandler(float rawDamage, DamageType type);

    [Signal]
    public delegate void HealedEventHandler(float amount);

    [Signal]
    public delegate void DiedEventHandler();

    // ===== 导出属性 =====

    /// <summary>最大生命值</summary>
    [Export]
    public float MaxHealth { get; set; } = 100f;

    /// <summary>最大护盾值</summary>
    [Export]
    public float MaxShield { get; set; } = 50f;

    /// <summary>护盾吸收比例（0~1）</summary>
    [Export]
    public float ShieldAbsorbRate { get; set; } = 0.5f;

    /// <summary>护盾恢复速度（每秒）</summary>
    [Export]
    public float ShieldRegenSpeed { get; set; } = 2f;

    /// <summary>护盾恢复延迟（受击后多少秒开始恢复）</summary>
    [Export]
    public float ShieldRegenDelay { get; set; } = 3f;

    // ===== 公共属性 =====

    /// <summary>当前生命值</summary>
    public float CurrentHealth { get; private set; }

    /// <summary>当前护盾值</summary>
    public float CurrentShield { get; private set; }

    /// <summary>是否已死亡</summary>
    public bool IsDead => CurrentHealth <= 0f;

    // ===== 私有字段 =====

    private bool _invincible;
    private double _lastDamageTime;

    public override void _Ready()
    {
        CurrentHealth = MaxHealth;
        CurrentShield = MaxShield;
    }

    public override void _Process(double delta)
    {
        if (IsDead) return;
        RegenShield(delta);
    }

    /// <summary>
    /// 普通伤害：按 ShieldAbsorbRate 分配到护盾和HP
    /// </summary>
    /// <param name="amount">伤害总量</param>
    public void ApplyDamage(float amount)
    {
        if (amount <= 0f || _invincible || IsDead) return;

        float shieldDamage = amount * ShieldAbsorbRate;
        float healthDamage = amount * (1f - ShieldAbsorbRate);

        CurrentShield = Mathf.Max(0f, CurrentShield - shieldDamage);
        CurrentHealth = Mathf.Max(0f, CurrentHealth - healthDamage);

        _lastDamageTime = Godot.Time.GetTicksMsec() / 1000.0;

        EmitSignal(SignalName.Damaged, amount, (int)DamageType.Normal);
        EmitSignal(SignalName.ShieldChanged, CurrentShield, MaxShield);
        EmitSignal(SignalName.HealthChanged, CurrentHealth, MaxHealth);

        if (CurrentHealth <= 0f)
        {
            EmitSignal(SignalName.Died);
        }
    }

    /// <summary>
    /// 中毒伤害：直接扣HP，无视护盾
    /// </summary>
    /// <param name="amount">伤害量</param>
    public void ApplyPoisonDamage(float amount)
    {
        if (amount <= 0f || _invincible || IsDead) return;

        CurrentHealth = Mathf.Max(0f, CurrentHealth - amount);

        EmitSignal(SignalName.Damaged, amount, (int)DamageType.Poison);
        EmitSignal(SignalName.HealthChanged, CurrentHealth, MaxHealth);

        if (CurrentHealth <= 0f)
        {
            EmitSignal(SignalName.Died);
        }
    }

    /// <summary>
    /// 碎盾伤害：只扣护盾，不扣HP
    /// </summary>
    /// <param name="amount">碎盾量</param>
    public void ApplyShieldBreak(float amount)
    {
        if (amount <= 0f || IsDead) return;

        CurrentShield = Mathf.Max(0f, CurrentShield - amount);
        _lastDamageTime = Godot.Time.GetTicksMsec() / 1000.0;

        EmitSignal(SignalName.ShieldChanged, CurrentShield, MaxShield);
    }

    /// <summary>
    /// 治疗回复HP
    /// </summary>
    /// <param name="amount">治疗量</param>
    public void Heal(float amount)
    {
        if (amount <= 0f || IsDead) return;

        float previous = CurrentHealth;
        CurrentHealth = Mathf.Min(MaxHealth, CurrentHealth + amount);

        if (CurrentHealth != previous)
        {
            EmitSignal(SignalName.Healed, CurrentHealth - previous);
            EmitSignal(SignalName.HealthChanged, CurrentHealth, MaxHealth);
        }
    }

    /// <summary>
    /// 设置无敌状态（翻滚闪避用）
    /// </summary>
    /// <param name="enabled">是否启用无敌</param>
    public void SetInvincible(bool enabled)
    {
        _invincible = enabled;
    }

    /// <summary>
    /// 重置到满血满盾
    /// </summary>
    public void Reset()
    {
        CurrentHealth = MaxHealth;
        CurrentShield = MaxShield;
        _invincible = false;
        _lastDamageTime = 0;
        EmitSignal(SignalName.HealthChanged, CurrentHealth, MaxHealth);
        EmitSignal(SignalName.ShieldChanged, CurrentShield, MaxShield);
    }

    /// <summary>
    /// 护盾恢复：受击后 ShieldRegenDelay 秒开始恢复
    /// </summary>
    private void RegenShield(double delta)
    {
        if (CurrentShield >= MaxShield) return;

        double elapsed = Godot.Time.GetTicksMsec() / 1000.0 - _lastDamageTime;
        if (elapsed >= ShieldRegenDelay)
        {
            CurrentShield = Mathf.Min(MaxShield, CurrentShield + (float)(ShieldRegenSpeed * delta));
            EmitSignal(SignalName.ShieldChanged, CurrentShield, MaxShield);
        }
    }
}
