using Godot;
using System;

/// <summary>
/// 角色数据
/// </summary>
[GlobalClass]
public partial class CharacterData : Resource
{
    [Export] public string CharacterId = "";
    [Export] public string Name = "";
    [Export] public GameEnums.FactionType Faction = GameEnums.FactionType.Tech;
    [Export] public CombatStats BaseStats = new();
    [Export] public int InventorySize = 10;
    [Export] public float MoveSpeed = 200f;
    [Export] public float DodgeSpeed = 400f;
    [Export] public float DodgeDuration = 0.3f;
    [Export] public float DodgeCooldown = 0.8f;
    [Export] public SkillData[] Skills = Array.Empty<SkillData>();
    [Export] public string[] PortraitPaths = Array.Empty<string>();
}

/// <summary>
/// 战斗属性
/// </summary>
[GlobalClass]
public partial class CombatStats : Resource
{
    [Export] public float MaxHP = 100f;
    [Export] public float HP = 100f;
    [Export] public float MaxShield = 50f;
    [Export] public float Shield = 50f;
    [Export] public float ShieldAbsorbRate = 0.7f;
    [Export] public float ShieldRegenRate = 5f;
    [Export] public float ShieldRegenDelay = 3f;
    [Export] public float AttackPower = 10f;

    public float TimeSinceLastHit { get; set; } = 999f;
    public bool IsDead => HP <= 0;

    public CombatStats Clone()
    {
        return new CombatStats
        {
            MaxHP = MaxHP, HP = HP,
            MaxShield = MaxShield, Shield = Shield,
            ShieldAbsorbRate = ShieldAbsorbRate,
            ShieldRegenRate = ShieldRegenRate,
            ShieldRegenDelay = ShieldRegenDelay,
            AttackPower = AttackPower,
            TimeSinceLastHit = TimeSinceLastHit
        };
    }
}

/// <summary>
/// 怪物数据
/// </summary>
[GlobalClass]
public partial class EnemyData : Resource
{
    [Export] public string EnemyId = "";
    [Export] public string Name = "";
    [Export] public CombatStats BaseStats = new();
    [Export] public float MoveSpeed = 100f;
    [Export] public float AggroRange = 300f;
    [Export] public float AttackRange = 50f;
    [Export] public string[] AbilityIds = Array.Empty<string>();
    [Export] public bool IsElite = false;
    [Export] public float EnrageThreshold = 0.25f;
    [Export] public float EnrageMultiplier = 1.5f;
    [Export] public int DropTableId;
}

/// <summary>
/// 技能数据
/// </summary>
[GlobalClass]
public partial class SkillData : Resource
{
    [Export] public string SkillId = "";
    [Export] public string Name = "";
    [Export] public float Cooldown = 5f;
    [Export] public float Damage = 20f;
    [Export] public float Range = 100f;
    [Export] public Texture2D Icon;
    [Export] public PackedScene ProjectileScene;
}

/// <summary>
/// 物品数据
/// </summary>
[GlobalClass]
public partial class ItemData : Resource
{
    [Export] public string ItemId = "";
    [Export] public string Name = "";
    [Export] public string Description = "";
    [Export] public Texture2D Icon;
    [Export] public GameEnums.ItemType Type = GameEnums.ItemType.Consumable;
    [Export] public int Width = 1;
    [Export] public int Height = 1;
    [Export] public int MaxStack = 1;
    [Export] public float Rarity;
}

/// <summary>
/// 区域数据
/// </summary>
[GlobalClass]
public partial class RegionData : Resource
{
    [Export] public string RegionId = "";
    [Export] public string RegionName = "";
    [Export] public string ScenePath = "";
    [Export] public Vector2 MapPosition;
    [Export] public bool IsUnlocked;
    [Export] public string UnlockCondition = "";
    [Export] public Texture2D Icon;
}

/// <summary>
/// 文献数据
/// </summary>
[GlobalClass]
public partial class LiteratureData : Resource
{
    [Export] public string Id = "";
    [Export] public GameEnums.LiteratureType Type = GameEnums.LiteratureType.Newspaper;
    [Export] public string Period = "";
    [Export] public string Content = "";
    [Export] public float Rarity;
    [Export] public string[] UnlockConditions = Array.Empty<string>();
}
