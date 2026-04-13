using Godot;

/// <summary>
/// 门控制器（Area2D）
/// 管理房间门的锁定/解锁状态和玩家通过检测
/// </summary>
[GlobalClass]
public partial class DoorController : Area2D
{
    // ===== 信号 =====

    [Signal]
    public delegate void DoorEnteredEventHandler(int targetRoomIndex);

    // ===== 导出属性 =====

    /// <summary>是否锁定</summary>
    [Export]
    public bool IsLocked { get; set; } = true;

    /// <summary>目标房间索引</summary>
    [Export]
    public int TargetRoomIndex { get; set; }

    // ===== 私有字段 =====

    private CollisionShape2D _collisionShape;
    private Sprite2D _sprite;
    private bool _playerInside;

    public override void _Ready()
    {
        BuildScene();
        BodyEntered += OnBodyEntered;
    }

    /// <summary>
    /// 解锁门
    /// </summary>
    public void Unlock()
    {
        IsLocked = false;
        // 视觉反馈（待补充：更换贴图/发光效果）
    }

    /// <summary>
    /// 重新锁定门
    /// </summary>
    public void Lock()
    {
        IsLocked = true;
    }

    private void OnBodyEntered(Node2D body)
    {
        if (IsLocked) return;
        if (body is PlayerController)
        {
            EmitSignal(SignalName.DoorEntered, TargetRoomIndex);
        }
    }

    /// <summary>
    /// 代码构建子节点
    /// </summary>
    private void BuildScene()
    {
        _collisionShape = new CollisionShape2D();
        _collisionShape.Shape = new RectangleShape2D { Size = new Vector2(60, 20) };
        AddChild(_collisionShape);
        _collisionShape.Owner = this;

        _sprite = new Sprite2D();
        _sprite.Name = "DoorSprite";
        AddChild(_sprite);
        _sprite.Owner = this;
    }
}
