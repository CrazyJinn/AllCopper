using Godot;

/// <summary>
/// 物品数据
/// 定义物品的基础属性：名称、描述、占用空间、分类、稀有度、价格
/// </summary>
[GlobalClass]
public partial class ItemData : Resource
{
    /// <summary>物品唯一ID</summary>
    [Export]
    public string ItemId { get; set; }

    /// <summary>显示名称</summary>
    [Export]
    public string DisplayName { get; set; } = "";

    /// <summary>物品描述</summary>
    [Export]
    public string Description { get; set; } = "";

    /// <summary>物品图标</summary>
    [Export]
    public Texture2D Icon { get; set; }

    /// <summary>背包占用空间（格子数）</summary>
    [Export]
    public Vector2I SpaceOccupied { get; set; } = new(1, 1);

    /// <summary>物品分类</summary>
    [Export]
    public ItemCategory Category { get; set; }

    /// <summary>稀有度</summary>
    [Export]
    public ItemRarity Rarity { get; set; }

    /// <summary>最大堆叠数</summary>
    [Export]
    public int MaxStack { get; set; } = 99;

    /// <summary>购买价格</summary>
    [Export]
    public float BuyPrice { get; set; } = 0f;

    /// <summary>出售价格</summary>
    [Export]
    public float SellPrice { get; set; } = 0f;

    /// <summary>使用效果ID（关联效果系统）</summary>
    [Export]
    public string UseEffectId { get; set; }
}
