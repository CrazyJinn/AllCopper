using Godot;

/// <summary>
/// 区域数据（Resource）
/// 定义大地图上可探索区域的信息
/// </summary>
[GlobalClass]
public partial class RegionData : Resource
{
    /// <summary>区域唯一ID</summary>
    [Export]
    public string RegionId { get; set; }

    /// <summary>显示名称</summary>
    [Export]
    public string DisplayName { get; set; } = "";

    /// <summary>地图图片</summary>
    [Export]
    public Texture2D MapImage { get; set; }

    /// <summary>是否已解锁</summary>
    [Export]
    public bool IsUnlocked { get; set; }

    /// <summary>解锁条件描述</summary>
    [Export]
    public string UnlockCondition { get; set; } = "";

    /// <summary>在大地图上的位置</summary>
    [Export]
    public Vector2 MapPosition { get; set; }

    /// <summary>区域包含的房间列表</summary>
    [Export]
    public RoomData[] Rooms { get; set; }
}
