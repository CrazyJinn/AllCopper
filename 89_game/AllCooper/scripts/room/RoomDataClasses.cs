using Godot;

/// <summary>
/// 房间数据
/// </summary>
[GlobalClass]
public partial class RoomData : Resource
{
    [Export] public string RoomId = "";
    [Export] public GameEnums.RoomType Type = GameEnums.RoomType.Normal;
    [Export] public Vector2 Size = new(1920, 1080);
    [Export] public SpawnPointData[] SpawnPoints = System.Array.Empty<SpawnPointData>();
    [Export] public DoorData[] Doors = System.Array.Empty<DoorData>();
    [Export] public SecretConditionData SecretRoom;
}

/// <summary>
/// 刷怪点数据
/// </summary>
[GlobalClass]
public partial class SpawnPointData : Resource
{
    [Export] public Vector2 Position;
    [Export] public string EnemyId = "";
    [Export] public int Count = 1;
}

/// <summary>
/// 门数据
/// </summary>
[GlobalClass]
public partial class DoorData : Resource
{
    [Export] public Vector2 Position;
    [Export] public string Direction = "right"; // up/down/left/right
    [Export] public string TargetRoomId = "";
    [Export] public bool IsOpen;
}

/// <summary>
/// 隐藏房触发条件
/// </summary>
[GlobalClass]
public partial class SecretConditionData : Resource
{
    [Export] public string ConditionType = "no_damage"; // no_damage, time_limit, kill_all_in_seconds
    [Export] public Variant Parameter;
}
