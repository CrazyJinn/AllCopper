using Godot;

/// <summary>
/// 伤害系统核心 - HP/护盾伤害分配、碰撞判定
/// </summary>
public partial class DamageSystem : Node
{
    [Signal] public delegate void DamageAppliedEventHandler(Node2D target, float shieldDamage, float hpDamage);
    [Signal] public delegate void ShieldBrokenEventHandler(Node2D target);
    [Signal] public delegate void CharacterDiedEventHandler(Node2D character);

    public static DamageSystem Instance { get; private set; }

    public override void _EnterTree()
    {
        Instance = this;
    }

    /// <summary>应用伤害到目标</summary>
    public void ApplyDamage(Node2D target, float amount, GameEnums.DamageType damageType, Node2D source = null)
    {
        if (amount <= 0) return;

        // 检查无敌帧
        if (target is PlayerController player && player.IsInvincible()) return;

        var stats = target.Get("CombatStats").AsGodotObject() as CombatStats;
        if (stats == null) return;

        float shieldDmg = 0f;
        float hpDmg = 0f;

        switch (damageType)
        {
            case GameEnums.DamageType.Normal:
                shieldDmg = amount * stats.ShieldAbsorbRate;
                hpDmg = amount * (1f - stats.ShieldAbsorbRate);
                stats.Shield -= shieldDmg;
                stats.HP -= hpDmg;
                break;

            case GameEnums.DamageType.Poison:
                hpDmg = amount;
                stats.HP -= hpDmg;
                break;

            case GameEnums.DamageType.ShieldBreak:
                shieldDmg = amount * 3f;
                stats.Shield -= shieldDmg;
                break;
        }

        // 护盾溢出转HP伤害
        if (stats.Shield < 0)
        {
            stats.HP += stats.Shield; // Shield为负数
            hpDmg += Mathf.Abs(stats.Shield);
            stats.Shield = 0;
            EmitSignal(SignalName.ShieldBroken, target);
        }

        stats.TimeSinceLastHit = 0f;

        EmitSignal(SignalName.DamageApplied, target, shieldDmg, hpDmg);

        if (stats.IsDead)
        {
            EmitSignal(SignalName.CharacterDied, target);
        }
    }

    public override void _Process(double delta)
    {
        // 护盾自动恢复在 BattleResource 中处理
    }
}
