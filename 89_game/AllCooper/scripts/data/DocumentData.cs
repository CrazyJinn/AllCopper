using Godot;

/// <summary>
/// 文献数据（Resource）
/// 定义可收集的文献物品属性
/// </summary>
[GlobalClass]
public partial class DocumentData : Resource
{
    /// <summary>文献唯一ID</summary>
    [Export]
    public string DocumentId { get; set; }

    /// <summary>标题</summary>
    [Export]
    public string Title { get; set; } = "";

    /// <summary>内容</summary>
    [Export]
    public string Content { get; set; } = "";

    /// <summary>文献类型</summary>
    [Export]
    public DocumentType Type { get; set; }

    /// <summary>稀有度</summary>
    [Export]
    public ItemRarity Rarity { get; set; }

    /// <summary>时代背景</summary>
    [Export]
    public string TimePeriod { get; set; }

    /// <summary>文献图片</summary>
    [Export]
    public Texture2D Image { get; set; }
}
