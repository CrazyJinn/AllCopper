using Godot;

/// <summary>
/// 战斗场景根节点
/// 管理战斗场景中的背景、装饰、敌人、玩家、门和HUD
/// 子节点通过 BuildScene() 动态创建
/// </summary>
[GlobalClass]
public partial class BattleScene : Node2D
{
    // ===== 子节点引用 =====

    private Sprite2D _background;
    private Node2D _decorations;
    private Node2D _enemies;
    private PlayerController _player;
    private Node2D _doors;
    private Node2D _items;
    private CanvasLayer _hudLayer;

    // ===== 公共属性 =====

    /// <summary>房间管理器</summary>
    public RoomManager RoomManager { get; private set; }

    /// <summary>玩家引用</summary>
    public PlayerController Player => _player;

    /// <summary>玩家场景预制体</summary>
    [Export]
    public PackedScene PlayerScene { get; set; }

    public override void _Ready()
    {
        BuildScene();
        RoomManager?.Initialize(this);

        // 订阅事件
        EventBus.OnBattleComplete += OnBattleComplete;
    }

    public override void _ExitTree()
    {
        EventBus.OnBattleComplete -= OnBattleComplete;
    }

    /// <summary>
    /// 加载指定房间
    /// </summary>
    /// <param name="roomIndex">房间索引</param>
    public void LoadRoom(int roomIndex)
    {
        if (RoomManager == null) return;

        // 清除当前敌人和装饰
        ClearChildren(_enemies);
        ClearChildren(_decorations);
        ClearChildren(_doors);
        ClearChildren(_items);

        // 设置新房间
        RoomData room = RoomManager.Rooms[roomIndex];

        // 生成背景
        if (room.Background != null && _background != null)
        {
            _background.Texture = room.Background;
        }

        // 生成装饰
        SpawnDecorationsForRoom(room);

        // 生成门
        SpawnDoorsForRoom(room);

        // 生成敌人
        SpawnEnemiesForRoom(room);
    }

    /// <summary>
    /// 房间清空回调
    /// </summary>
    public void OnRoomCleared()
    {
        // 解锁门
        foreach (var child in _doors.GetChildren())
        {
            if (child is DoorController door)
            {
                door.Unlock();
            }
        }
    }

    /// <summary>
    /// 战斗完成回调
    /// </summary>
    public void OnBattleComplete()
    {
        GameManager.Instance?.TransitionToWorldMap();
    }

    /// <summary>
    /// 为房间生成敌人
    /// </summary>
    private void SpawnEnemiesForRoom(RoomData room)
    {
        if (room.SpawnPoints == null) return;

        var spawner = new EnemySpawner();
        spawner.Name = "EnemySpawner";
        _enemies.AddChild(spawner);
        spawner.Owner = this;

        SpawnPoint[] spawns = room.SpawnPoints;
        foreach (var spawn in spawns)
        {
            if (spawn.Enemy == null) continue;
            var enemy = new EnemyController { Data = spawn.Enemy };
            enemy.Position = spawn.Position;
            _enemies.AddChild(enemy);
            enemy.Owner = this;
        }

        spawner.SpawnWave(spawns);
    }

    /// <summary>
    /// 为房间生成装饰物
    /// </summary>
    private void SpawnDecorationsForRoom(RoomData room)
    {
        if (room.Decorations == null) return;

        foreach (var deco in room.Decorations)
        {
            if (deco.Sprite == null) continue;

            if (deco.HasCollision)
            {
                var body = new StaticBody2D();
                var sprite = new Sprite2D { Texture = deco.Sprite };
                var collision = new CollisionShape2D
                {
                    Shape = new RectangleShape2D { Size = deco.CollisionSize }
                };
                body.AddChild(sprite);
                body.AddChild(collision);
                body.Position = deco.Position;
                _decorations.AddChild(body);
                body.Owner = this;
            }
            else
            {
                var sprite = new Sprite2D { Texture = deco.Sprite, Position = deco.Position };
                _decorations.AddChild(sprite);
                sprite.Owner = this;
            }
        }
    }

    /// <summary>
    /// 为房间生成门
    /// </summary>
    private void SpawnDoorsForRoom(RoomData room)
    {
        if (room.Doors == null) return;

        for (int i = 0; i < room.Doors.Length; i++)
        {
            var doorPos = room.Doors[i];
            var door = new DoorController
            {
                TargetRoomIndex = doorPos.TargetRoomIndex,
                IsLocked = true,
                Position = doorPos.Position
            };
            door.Name = $"Door_{i}";
            _doors.AddChild(door);
            door.Owner = this;

            door.DoorEntered += OnDoorEntered;
        }
    }

    private void OnDoorEntered(int targetRoomIndex)
    {
        LoadRoom(targetRoomIndex);
    }

    /// <summary>
    /// 清除容器节点的所有子节点
    /// </summary>
    private void ClearChildren(Node container)
    {
        if (container == null) return;
        foreach (var child in container.GetChildren())
        {
            child.QueueFree();
        }
    }

    /// <summary>
    /// 代码构建场景树
    /// </summary>
    private void BuildScene()
    {
        // 背景
        _background = new Sprite2D();
        _background.Name = "Background";
        _background.Centered = true;
        _background.Position = new Vector2(960, 540);
        AddChild(_background);
        _background.Owner = this;

        // 装饰层
        _decorations = new Node2D();
        _decorations.Name = "Decorations";
        AddChild(_decorations);
        _decorations.Owner = this;

        // 敌人层
        _enemies = new Node2D();
        _enemies.Name = "Enemies";
        AddChild(_enemies);
        _enemies.Owner = this;

        // 玩家
        if (PlayerScene != null)
        {
            _player = PlayerScene.Instantiate<PlayerController>();
        }
        else
        {
            _player = new PlayerController();
        }
        _player.Name = "Player";
        _player.Position = new Vector2(960, 540);
        AddChild(_player);
        _player.Owner = this;

        // 门层
        _doors = new Node2D();
        _doors.Name = "Doors";
        AddChild(_doors);
        _doors.Owner = this;

        // 掉落物层
        _items = new Node2D();
        _items.Name = "Items";
        AddChild(_items);
        _items.Owner = this;

        // HUD层
        _hudLayer = new CanvasLayer();
        _hudLayer.Name = "HUD";
        _hudLayer.Layer = 10;
        AddChild(_hudLayer);
        _hudLayer.Owner = this;

        // RoomManager
        RoomManager = new RoomManager();
        RoomManager.Name = "RoomManager";
        AddChild(RoomManager);
        RoomManager.Owner = this;
    }
}
