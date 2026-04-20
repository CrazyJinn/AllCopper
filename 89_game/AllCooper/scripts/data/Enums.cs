using Godot;

/// <summary>
/// 全局枚举定义
/// 包含阵营、伤害类型、物品分类、敌人类型等基础枚举
/// </summary>

/// <summary>阵营类型</summary>
public enum FactionType
{
    Tech,
    Magic
}

/// <summary>伤害类型</summary>
public enum DamageType
{
    Normal,
    Poison,
    ShieldBreak
}

/// <summary>物品分类</summary>
public enum ItemCategory
{
    Consumable,
    Equipment,
    Material,
    Document,
    KeyItem
}

/// <summary>物品稀有度</summary>
public enum ItemRarity
{
    Common,
    Rare,
    EpicRare
}

/// <summary>敌人类型</summary>
public enum EnemyType
{
    Normal,
    Elite,
    Boss
}

/// <summary>房间类型</summary>
public enum RoomType
{
    Normal,
    Elite,
    Boss,
    Hidden
}

/// <summary>战斗类型</summary>
public enum BattleType
{
    Tutorial,
    Defense,
    Stealth,
    Collect,
    Puzzle,
    Dialog
}

/// <summary>文献类型</summary>
public enum DocumentType
{
    Newspaper,
    Diary,
    Research,
    MilitaryOrder,
    GovernmentArchive
}

/// <summary>玩家状态</summary>
public enum PlayerState
{
    Idle,
    Moving,
    Attacking,
    Rolling,
    Casting,
    Interacting,
    Dead
}

/// <summary>敌人状态</summary>
public enum EnemyState
{
    Idle,
    Patrol,
    Chase,
    Attack,
    ChargeUp,
    Stunned,
    Dead
}

/// <summary>游戏状态</summary>
public enum GameState
{
    MainMenu,
    Battle,
    Dialog,
    WorldMap,
    Paused,
    Cutscene
}

/// <summary>状态效果类型</summary>
public enum StatusEffectType
{
    Poison,
    Stun,
    Burn
}

/// <summary>对话布局</summary>
public enum DialogLayout
{
    SideBySide,
    Monologue
}

/// <summary>对话立绘位置</summary>
public enum DialogPortraitSide
{
    Left,
    Right
}
