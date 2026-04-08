using Godot;
using System.Collections.Generic;

/// <summary>
/// 子弹/弹道对象池
/// </summary>
public partial class ProjectilePool : Node
{
    public static ProjectilePool Instance { get; private set; }

    private const int InitialCapacity = 50;
    private const int MaxCapacity = 200;
    private readonly Queue<Projectile> _pool = new();
    private readonly List<Projectile> _active = new();

    public override void _EnterTree()
    {
        Instance = this;
    }

    public override void _Ready()
    {
        for (int i = 0; i < InitialCapacity; i++)
        {
            var proj = CreateProjectile();
            proj.Visible = false;
            proj.SetProcess(false);
            _pool.Enqueue(proj);
            AddChild(proj);
        }
    }

    /// <summary>从池中获取一个子弹</summary>
    public Projectile Get()
    {
        Projectile proj;

        if (_pool.Count > 0)
        {
            proj = _pool.Dequeue();
        }
        else if (_active.Count < MaxCapacity)
        {
            proj = CreateProjectile();
            AddChild(proj);
        }
        else
        {
            // 强制回收最早活跃的子弹
            proj = _active[0];
            _active.RemoveAt(0);
        }

        proj.Visible = true;
        proj.SetProcess(true);
        _active.Add(proj);
        return proj;
    }

    /// <summary>归还子弹到池中</summary>
    public void Return(Projectile proj)
    {
        proj.Visible = false;
        proj.SetProcess(false);
        proj.Velocity = Vector2.Zero;
        _active.Remove(proj);
        _pool.Enqueue(proj);
    }

    private Projectile CreateProjectile()
    {
        return new Projectile { Name = "Projectile" };
    }
}

/// <summary>
/// 子弹实体
/// </summary>
public partial class Projectile : CharacterBody2D
{
    public Vector2 Velocity = Vector2.Zero;
    private float _damage;
    private Hitbox _hitbox;
    private float _lifetime;
    private const float MaxLifetime = 5f;

    public override void _Ready()
    {
        var sprite = new Sprite2D { Name = "Sprite" };
        AddChild(sprite);

        var collision = new CollisionShape2D { Name = "Collision" };
        collision.Shape = new CircleShape2D { Radius = 4f };
        AddChild(collision);

        _hitbox = new Hitbox { Name = "Hitbox" };
        AddChild(_hitbox);
    }

    public void Fire(Vector2 direction, float speed, float damage)
    {
        Velocity = direction.Normalized() * speed;
        _damage = damage;
        _hitbox.Damage = damage;
        _hitbox.Enable();
        _lifetime = 0f;
    }

    public override void _PhysicsProcess(double delta)
    {
        _lifetime += (float)delta;
        if (_lifetime >= MaxLifetime)
        {
            ProjectilePool.Instance?.Return(this);
            return;
        }

        KinematicCollision2D collision = MoveAndCollide(Velocity * (float)delta);
        if (collision != null)
        {
            _hitbox.Disable();
            ProjectilePool.Instance?.Return(this);
        }
    }
}
