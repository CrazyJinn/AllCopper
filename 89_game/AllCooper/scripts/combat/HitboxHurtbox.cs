using Godot;

/// <summary>
/// 攻击判定区 - 放置在攻击者身上
/// </summary>
public partial class Hitbox : Area2D
{
    [Export] public float Damage = 10f;
    [Export] public GameEnums.DamageType DamageType = GameEnums.DamageType.Normal;
    [Export] public float KnockbackForce = 200f;

    public Node2D OwnerNode { get; set; }
    private CollisionShape2D _collision;

    public override void _Ready()
    {
        _collision = new CollisionShape2D { Name = "CollisionShape" };
        var shape = new RectangleShape2D { Size = new Vector2(32f, 32f) };
        _collision.Shape = shape;
        _collision.Disabled = true;
        AddChild(_collision);

        Monitoring = true;
        Monitorable = false;
    }

    /// <summary>启用攻击判定</summary>
    public void Enable()
    {
        _collision.Disabled = false;
    }

    /// <summary>禁用攻击判定</summary>
    public void Disable()
    {
        _collision.Disabled = true;
    }
}

/// <summary>
/// 受击判定区 - 放置在可受击角色身上
/// </summary>
public partial class Hurtbox : Area2D
{
    [Signal] public delegate void HitReceivedEventHandler(Hitbox hitbox);

    private CollisionShape2D _collision;

    public override void _Ready()
    {
        _collision = new CollisionShape2D { Name = "CollisionShape" };
        var shape = new CircleShape2D { Radius = 16f };
        _collision.Shape = shape;
        AddChild(_collision);

        Monitoring = false;
        Monitorable = true;

        AreaEntered += OnAreaEntered;
    }

    private void OnAreaEntered(Area2D area)
    {
        if (area is Hitbox hitbox)
        {
            EmitSignal(SignalName.HitReceived, hitbox);
            DamageSystem.Instance?.ApplyDamage(
                GetParent() as Node2D,
                hitbox.Damage,
                hitbox.DamageType,
                hitbox.OwnerNode
            );
        }
    }
}
