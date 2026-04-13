using Godot;

/// <summary>
/// 掉落物数据
/// 定义敌人掉落物品的概率和数量范围
/// </summary>
[GlobalClass]
public partial class LootDrop : Resource
{
    /// <summary>掉落物品</summary>
    [Export]
    public ItemData Item { get; set; }

    /// <summary>掉落概率（0~1）</summary>
    [Export]
    public float DropChance { get; set; } = 0.5f;

    /// <summary>最小掉落数量</summary>
    [Export]
    public int MinCount { get; set; } = 1;

    /// <summary>最大掉落数量</summary>
    [Export]
    public int MaxCount { get; set; } = 1;
}
