using Godot;

/// <summary>
/// 敌人数据（Resource）
/// 定义敌人属性：类型、生命、攻击力、AI参数、狂暴、掉落表
/// </summary>
[GlobalClass]
public partial class EnemyData : Resource
{
    /// <summary>敌人唯一ID</summary>
    [Export]
    public string EnemyId { get; set; }

    /// <summary>显示名称</summary>
    [Export]
    public string DisplayName { get; set; } = "";

    /// <summary>敌人类型</summary>
    [Export]
    public EnemyType Type { get; set; }

    // ===== 属性 =====

    /// <summary>最大生命值</summary>
    [Export]
    public float MaxHealth { get; set; } = 100f;

    /// <summary>最大护盾值</summary>
    [Export]
    public float MaxShield { get; set; } = 30f;

    /// <summary>攻击力</summary>
    [Export]
    public float AttackPower { get; set; } = 10f;

    /// <summary>移动速度</summary>
    [Export]
    public float MoveSpeed { get; set; } = 150f;

    /// <summary>侦测范围</summary>
    [Export]
    public float DetectRange { get; set; } = 300f;

    /// <summary>攻击范围</summary>
    [Export]
    public float AttackRange { get; set; } = 50f;

    /// <summary>精灵图</summary>
    [Export]
    public Texture2D Sprite { get; set; }

    /// <summary>精灵表数据文件路径（.tpsheet）</summary>
    [Export]
    public string TpsheetPath { get; set; }

    // ===== 特殊能力 =====

    /// <summary>是否拥有蓄力冲刺攻击</summary>
    [Export]
    public bool HasChargeAttack { get; set; }

    /// <summary>冲刺速度</summary>
    [Export]
    public float DashSpeed { get; set; } = 400f;

    /// <summary>冲刺距离</summary>
    [Export]
    public float DashDistance { get; set; } = 200f;

    /// <summary>是否有狂暴状态</summary>
    [Export]
    public bool HasBerserk { get; set; }

    /// <summary>狂暴触发阈值（HP百分比）</summary>
    [Export]
    public float BerserkThreshold { get; set; } = 0.3f;

    /// <summary>是否有中毒攻击</summary>
    [Export]
    public bool HasPoison { get; set; }

    /// <summary>中毒伤害</summary>
    [Export]
    public float PoisonDamage { get; set; } = 0f;

    /// <summary>是否能召唤</summary>
    [Export]
    public bool CanSummon { get; set; }

    /// <summary>召唤的敌人类型</summary>
    [Export]
    public EnemyData SummonType { get; set; }

    /// <summary>掉落表</summary>
    [Export]
    public LootDrop[] LootTable { get; set; }
}
