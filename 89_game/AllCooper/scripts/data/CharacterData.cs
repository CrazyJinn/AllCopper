using Godot;

/// <summary>
/// 角色数据（Resource）
/// 定义玩家角色的全部属性配置，可在编辑器中创建和编辑
/// </summary>
[GlobalClass]
public partial class CharacterData : Resource
{
    /// <summary>角色唯一ID</summary>
    [Export]
    public string CharacterId { get; set; }

    /// <summary>显示名称</summary>
    [Export]
    public string DisplayName { get; set; } = "";

    // ===== 生命/护盾 =====

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

    /// <summary>护盾恢复延迟（秒）</summary>
    [Export]
    public float ShieldRegenDelay { get; set; } = 3f;

    // ===== 移动 =====

    /// <summary>移动速度</summary>
    [Export]
    public float MoveSpeed { get; set; } = 200f;

    /// <summary>翻滚速度</summary>
    [Export]
    public float RollSpeed { get; set; } = 400f;

    /// <summary>翻滚持续时间（秒）</summary>
    [Export]
    public float RollDuration { get; set; } = 0.3f;

    /// <summary>翻滚冷却时间（秒）</summary>
    [Export]
    public float RollCooldown { get; set; } = 0.5f;

    // ===== 阵营 =====

    /// <summary>阵营类型</summary>
    [Export]
    public FactionType Faction { get; set; }

    // ===== 战斗资源 =====

    /// <summary>最大弹药数（科技系）</summary>
    [Export]
    public int MaxAmmo { get; set; } = 30;

    /// <summary>换弹时间（秒，科技系）</summary>
    [Export]
    public float ReloadTime { get; set; } = 1.5f;

    /// <summary>蓄力时间（秒，魔法系）</summary>
    [Export]
    public float ChargeTime { get; set; } = 2f;

    /// <summary>CD加速倍率（魔法系）</summary>
    [Export]
    public float CdAcceleration { get; set; } = 1f;

    // ===== 技能 =====

    /// <summary>技能列表</summary>
    [Export]
    public SkillData[] Skills { get; set; }

    // ===== 背包 =====

    /// <summary>额外背包格数加成</summary>
    [Export]
    public int InventoryBonus { get; set; } = 0;

    // ===== 立绘 =====

    /// <summary>默认立绘</summary>
    [Export]
    public Texture2D PortraitDefault { get; set; }

    /// <summary>表情立绘列表</summary>
    [Export]
    public Texture2D[] PortraitExpressions { get; set; }
}
