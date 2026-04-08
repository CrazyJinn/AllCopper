using Godot;

/// <summary>
/// 房间门 - 控制房间出入口
/// </summary>
public partial class RoomDoor : StaticBody2D
{
    private DoorData _data;
    private Sprite2D _sprite;
    private CollisionShape2D _collision;
    private Area2D _trigger;
    private bool _isOpen;

    public void Setup(DoorData data)
    {
        _data = data;
        GlobalPosition = data.Position;
        _isOpen = data.IsOpen;

        // 门体碰撞
        _collision = new CollisionShape2D { Name = "Collision" };
        _collision.Shape = new RectangleShape2D { Size = new Vector2(64, 16) };
        AddChild(_collision);

        // 触发区域（检测玩家靠近进入下一房间）
        _trigger = new Area2D { Name = "Trigger" };
        var triggerShape = new CollisionShape2D();
        triggerShape.Shape = new RectangleShape2D { Size = new Vector2(64, 48) };
        _trigger.AddChild(triggerShape);
        _trigger.Monitoring = true;
        _trigger.Monitorable = false;
        AddChild(_trigger);

        _trigger.BodyEntered += OnBodyEntered;

        if (_isOpen) Open(); else Close();
    }

    /// <summary>关门</summary>
    public void Close()
    {
        _isOpen = false;
        _collision.Disabled = false;
    }

    /// <summary>开门</summary>
    public void Open()
    {
        _isOpen = true;
        _collision.Disabled = true;
    }

    private void OnBodyEntered(Node2D body)
    {
        if (!_isOpen) return;
        if (body is not PlayerController) return;

        // 请求进入下一房间
        if (_data != null && !string.IsNullOrEmpty(_data.TargetRoomId))
        {
            GameManager.Instance?.RequestSceneTransition(_data.TargetRoomId);
        }
    }
}
