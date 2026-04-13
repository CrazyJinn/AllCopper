using Godot;

/// <summary>
/// 房间数据（Resource）
/// 定义单个房间的配置：类型、尺寸、背景、敌人生成点、门位置、装饰物
/// </summary>
[GlobalClass]
public partial class RoomData : Resource
{
    /// <summary>房间唯一ID</summary>
    [Export]
    public string RoomId { get; set; }

    /// <summary>房间类型</summary>
    [Export]
    public RoomType Type { get; set; }

    /// <summary>战斗类型</summary>
    [Export]
    public BattleType BattleType { get; set; }

    /// <summary>房间尺寸</summary>
    [Export]
    public Vector2I RoomSize { get; set; } = new(1920, 1080);

    /// <summary>背景图片</summary>
    [Export]
    public Texture2D Background { get; set; }

    /// <summary>敌人生成点</summary>
    [Export]
    public SpawnPoint[] SpawnPoints { get; set; }

    /// <summary>门位置</summary>
    [Export]
    public DoorPosition[] Doors { get; set; }

    /// <summary>装饰物</summary>
    [Export]
    public Decoration[] Decorations { get; set; }

    /// <summary>隐藏房间条件</summary>
    [Export]
    public string HiddenCondition { get; set; } = "";
}

/// <summary>
/// 敌人生成点数据
/// </summary>
[GlobalClass]
public partial class SpawnPoint : Resource
{
    /// <summary>生成位置</summary>
    [Export]
    public Vector2 Position { get; set; }

    /// <summary>生成的敌人配置</summary>
    [Export]
    public EnemyData Enemy { get; set; }
}

/// <summary>
/// 门位置数据
/// </summary>
[GlobalClass]
public partial class DoorPosition : Resource
{
    /// <summary>门位置</summary>
    [Export]
    public Vector2 Position { get; set; }

    /// <summary>目标房间索引（-1 表示无效）</summary>
    [Export]
    public int TargetRoomIndex { get; set; } = -1;
}

/// <summary>
/// 装饰物数据
/// </summary>
[GlobalClass]
public partial class Decoration : Resource
{
    /// <summary>位置</summary>
    [Export]
    public Vector2 Position { get; set; }

    /// <summary>贴图</summary>
    [Export]
    public Texture2D Sprite { get; set; }

    /// <summary>是否有碰撞</summary>
    [Export]
    public bool HasCollision { get; set; }

    /// <summary>碰撞体大小</summary>
    [Export]
    public Vector2 CollisionSize { get; set; }
}
