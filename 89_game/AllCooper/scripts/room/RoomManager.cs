using Godot;
using System.Collections.Generic;

/// <summary>
/// 房间管理器 - 多房间推进系统
/// 入口→普通→精英→Boss→隐藏
/// </summary>
public partial class RoomManager : Node
{
    [Signal] public delegate void RoomEnteredEventHandler(string roomId);
    [Signal] public delegate void RoomClearedEventHandler(string roomId);
    [Signal] public delegate void SecretRoomTriggeredEventHandler(string roomId);

    public GameEnums.RoomState CurrentRoomState { get; private set; } = GameEnums.RoomState.NotEntered;
    public int RemainingEnemies { get; private set; }

    private RoomData _roomData;
    private readonly List<EnemyBase> _spawnedEnemies = new();
    private readonly List<RoomDoor> _doors = new();

    public override void _Ready() { }

    /// <summary>初始化房间</summary>
    public void Setup(RoomData roomData)
    {
        _roomData = roomData;

        // 创建门
        foreach (var doorData in roomData.Doors)
        {
            var door = new RoomDoor { Name = $"Door_{doorData.Direction}" };
            door.Setup(doorData);
            AddChild(door);
            _doors.Add(door);
        }
    }

    /// <summary>玩家进入房间</summary>
    public void OnPlayerEnter()
    {
        if (CurrentRoomState != GameEnums.RoomState.NotEntered) return;

        CurrentRoomState = GameEnums.RoomState.InCombat;

        // 关门
        foreach (var door in _doors) door.Close();

        // 刷怪（入口房不刷）
        if (_roomData.Type != GameEnums.RoomType.Entrance && _roomData.SpawnPoints != null)
        {
            foreach (var spawn in _roomData.SpawnPoints)
            {
                for (int i = 0; i < spawn.Count; i++)
                {
                    var enemy = CreateEnemy(spawn.EnemyId, spawn.Position + new Vector2(
                        (float)GD.RandRange(-20, 20),
                        (float)GD.RandRange(-20, 20)
                    ));
                    if (enemy != null)
                    {
                        _spawnedEnemies.Add(enemy);
                        GetParent().AddChild(enemy);
                        enemy.EnemyDied += OnEnemyDied;
                    }
                }
            }
        }

        RemainingEnemies = _spawnedEnemies.Count;
        EmitSignal(SignalName.RoomEntered, _roomData.RoomId);

        // 空房间直接清理
        if (RemainingEnemies == 0)
        {
            ClearRoom();
        }
    }

    /// <summary>怪物死亡回调</summary>
    private void OnEnemyDied(EnemyBase enemy)
    {
        _spawnedEnemies.Remove(enemy);
        RemainingEnemies--;

        if (RemainingEnemies <= 0)
        {
            ClearRoom();
        }
    }

    /// <summary>清理房间</summary>
    private void ClearRoom()
    {
        CurrentRoomState = GameEnums.RoomState.Cleared;

        // 开门
        foreach (var door in _doors) door.Open();

        EmitSignal(SignalName.RoomCleared, _roomData.RoomId);

        // 检查隐藏房
        CheckSecretRoom();
    }

    /// <summary>检查隐藏房触发条件</summary>
    private void CheckSecretRoom()
    {
        if (_roomData.SecretRoom == null) return;

        bool conditionMet = _roomData.SecretRoom.ConditionType switch
        {
            "no_damage" => true, // TODO: 检查玩家是否未受伤
            "kill_all_in_seconds" => _roomData.SecretRoom.Parameter.VariantType == Variant.Type.Float
                && _stateTimer <= _roomData.SecretRoom.Parameter.AsFloat(),
            _ => false
        };

        if (conditionMet)
        {
            EmitSignal(SignalName.SecretRoomTriggered, _roomData.RoomId);
        }
    }

    private float _stateTimer;

    public override void _Process(double delta)
    {
        if (CurrentRoomState == GameEnums.RoomState.InCombat)
        {
            _stateTimer += (float)delta;
        }
    }

    private EnemyBase CreateEnemy(string enemyId, Vector2 position)
    {
        // TODO: 从资源管理器加载怪物数据
        var enemy = new EnemyBase { Name = $"Enemy_{enemyId}" };
        enemy.GlobalPosition = position;
        return enemy;
    }
}
