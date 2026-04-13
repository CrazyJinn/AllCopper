using Godot;

/// <summary>
/// 存档数据（Resource）
/// 定义游戏存档的所有持久化字段，支持 JSON 序列化
/// </summary>
[GlobalClass]
public partial class SaveData : Resource
{
    /// <summary>当前章节</summary>
    [Export]
    public string CurrentChapter { get; set; }

    /// <summary>当前区域</summary>
    [Export]
    public string CurrentRegion { get; set; }

    /// <summary>当前阵营</summary>
    [Export]
    public FactionType ActiveFaction { get; set; }

    /// <summary>玩家生命值</summary>
    [Export]
    public float PlayerHealth { get; set; }

    /// <summary>玩家护盾值</summary>
    [Export]
    public float PlayerShield { get; set; }

    /// <summary>货币</summary>
    [Export]
    public float Currency { get; set; }

    /// <summary>背包物品ID列表</summary>
    [Export]
    public string[] InventoryItems { get; set; }

    /// <summary>已收集文献ID列表</summary>
    [Export]
    public string[] CollectedDocuments { get; set; }

    /// <summary>已解锁区域ID列表</summary>
    [Export]
    public string[] UnlockedRegions { get; set; }

    /// <summary>已完成房间数</summary>
    [Export]
    public int CompletedRooms { get; set; }

    /// <summary>
    /// 保存到文件
    /// </summary>
    /// <param name="path">存档文件路径</param>
    /// <returns>保存结果</returns>
    public Error SaveToFile(string path)
    {
        return ResourceSaver.Save(this, path);
    }

    /// <summary>
    /// 从文件加载存档
    /// </summary>
    /// <param name="path">存档文件路径</param>
    /// <returns>加载的存档数据，失败返回 null</returns>
    public static SaveData LoadFromFile(string path)
    {
        if (!ResourceLoader.Exists(path)) return null;
        return ResourceLoader.Load<SaveData>(path);
    }
}
