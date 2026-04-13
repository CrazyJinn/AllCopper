using Godot;

/// <summary>
/// 房间管理器
/// 管理房间推进、隐藏房条件检查、全清判定
/// </summary>
[GlobalClass]
public partial class RoomManager : Node
{
    // ===== 信号 =====

    [Signal]
    public delegate void RoomClearedEventHandler(int roomIndex);

    [Signal]
    public delegate void AllRoomsClearedEventHandler();

    // ===== 导出属性 =====

    /// <summary>房间配置列表</summary>
    [Export]
    public RoomData[] Rooms { get; set; }

    // ===== 公共属性 =====

    /// <summary>当前房间索引</summary>
    public int CurrentRoomIndex { get; private set; }

    /// <summary>当前房间数据</summary>
    public RoomData CurrentRoom => Rooms != null && CurrentRoomIndex < Rooms.Length
        ? Rooms[CurrentRoomIndex]
        : null;

    /// <summary>总房间数</summary>
    public int TotalRooms => Rooms?.Length ?? 0;

    // ===== 私有字段 =====

    private BattleScene _scene;
    private bool _hasTakenDamage;

    /// <summary>
    /// 初始化房间管理器
    /// </summary>
    /// <param name="scene">所属战斗场景</param>
    public void Initialize(BattleScene scene)
    {
        _scene = scene;
        CurrentRoomIndex = 0;

        // 订阅敌人击败事件
        EventBus.OnEnemyDefeated += OnEnemyDefeated;
    }

    public override void _ExitTree()
    {
        EventBus.OnEnemyDefeated -= OnEnemyDefeated;
    }

    /// <summary>
    /// 推进到下一个房间
    /// </summary>
    public void AdvanceToNext()
    {
        if (Rooms == null) return;

        CurrentRoomIndex++;

        if (CurrentRoomIndex >= Rooms.Length)
        {
            // 所有房间已清空
            EmitSignal(SignalName.AllRoomsCleared);
            EventBus.EmitBattleComplete();
            return;
        }

        _scene?.LoadRoom(CurrentRoomIndex);
    }

    /// <summary>
    /// 检查隐藏房间条件
    /// </summary>
    /// <param name="condition">条件描述</param>
    /// <returns>是否满足条件</returns>
    public bool CheckHiddenRoomCondition(string condition)
    {
        if (string.IsNullOrEmpty(condition)) return false;

        return condition switch
        {
            "no_damage" => !_hasTakenDamage,
            _ => false
        };
    }

    /// <summary>
    /// 标记玩家已受伤（影响隐藏房条件）
    /// </summary>
    public void MarkDamageTaken()
    {
        _hasTakenDamage = true;
    }

    private void OnEnemyDefeated(string enemyId)
    {
        // 检查当前房间是否所有敌人已击败
        var spawner = _scene?.GetNode<EnemySpawner>("Enemies/EnemySpawner");
        if (spawner != null && spawner.RemainingCount <= 0)
        {
            EmitSignal(SignalName.RoomCleared, CurrentRoomIndex);
            EventBus.EmitRoomCleared(CurrentRoomIndex);
        }
    }
}
