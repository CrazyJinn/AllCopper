using Godot;

/// <summary>
/// 攻击判定组件（Area2D）
/// 表示攻击方的伤害区域，激活时与 HurtboxComponent 碰撞造成伤害
/// 碰撞层：玩家 L2（检测敌人 L3），敌人 L4（检测玩家 L1）
/// </summary>
[GlobalClass]
public partial class HitboxComponent : Area2D
{
    // ===== 信号 =====

    [Signal]
    public delegate void HitEventHandler(HurtboxComponent target);

    // ===== 导出属性 =====

    /// <summary>伤害值</summary>
    [Export]
    public float Damage { get; set; } = 10f;

    /// <summary>击退力</summary>
    [Export]
    public float KnockbackForce { get; set; } = 200f;

    /// <summary>伤害类型</summary>
    [Export]
    public DamageType DamageType { get; set; } = DamageType.Normal;

    // ===== 私有字段 =====

    private CollisionShape2D _collisionShape;
    private bool _isActive = true;

    public override void _Ready()
    {
        BuildScene();
        AreaEntered += OnAreaEntered;
    }

    /// <summary>
    /// 激活/禁用碰撞检测
    /// </summary>
    /// <param name="active">是否激活</param>
    public void SetActive(bool active)
    {
        _isActive = active;
        if (_collisionShape != null)
        {
            _collisionShape.SetDeferred(CollisionShape2D.PropertyName.Disabled, !active);
        }
    }

    /// <summary>
    /// 设置伤害值
    /// </summary>
    /// <param name="damage">伤害数值</param>
    public void SetDamage(float damage)
    {
        Damage = damage;
    }

    /// <summary>
    /// 设置碰撞形状大小
    /// </summary>
    /// <param name="radius">碰撞形状半径</param>
    public void SetShapeRadius(float radius)
    {
        if (_collisionShape != null && _collisionShape.Shape is CircleShape2D circle)
        {
            circle.Radius = radius;
        }
    }

    private void OnAreaEntered(Area2D area)
    {
        if (!_isActive) return;

        if (area is HurtboxComponent hurtbox)
        {
            hurtbox.ReceiveHit(this);
            EmitSignal(SignalName.Hit, hurtbox);
        }
    }

    /// <summary>
    /// 代码构建子节点
    /// </summary>
    private void BuildScene()
    {
        _collisionShape = new CollisionShape2D();
        _collisionShape.Shape = new CircleShape2D { Radius = 20f };
        AddChild(_collisionShape);
        _collisionShape.Owner = this;
    }
}
