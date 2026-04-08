using Godot;

/// <summary>
/// 能力组件基类
/// </summary>
public abstract partial class AbilityComponent : Node
{
    protected EnemyBase _owner;
    protected float _cooldownTimer;

    public void Initialize(EnemyBase owner)
    {
        _owner = owner;
    }

    public abstract void Tick(float delta);
}

/// <summary>
/// 狂暴能力 - HP低于阈值时进入狂暴
/// </summary>
public partial class EnrageAbility : AbilityComponent
{
    private readonly float _threshold;
    private bool _triggered;

    public EnrageAbility(float threshold)
    {
        _threshold = threshold;
    }

    public override void Tick(float delta)
    {
        if (_triggered) return;
        if (_owner.Resource.HP / _owner.Resource.MaxHP <= _threshold)
        {
            _triggered = true;
            _owner.Enrage();
        }
    }
}

/// <summary>
/// 近战攻击能力
/// </summary>
public partial class MeleeAttackAbility : AbilityComponent
{
    private readonly float _damage;
    private readonly float _cooldown;
    private readonly float _range;

    public MeleeAttackAbility(float damage, float cooldown = 1f, float range = 50f)
    {
        _damage = damage;
        _cooldown = cooldown;
        _range = range;
    }

    public override void Tick(float delta)
    {
        _cooldownTimer -= delta;
        if (_cooldownTimer > 0) return;

        var playerPos = _owner.GetPlayerPosition();
        if (_owner.GlobalPosition.DistanceTo(playerPos) <= _range)
        {
            var player = GameManager.Instance?.Player;
            if (player != null)
            {
                DamageSystem.Instance?.ApplyDamage(
                    player, _damage, GameEnums.DamageType.Normal, _owner
                );
                _cooldownTimer = _cooldown;
            }
        }
    }
}

/// <summary>
/// 远程攻击能力 - 发射弹道
/// </summary>
public partial class RangedAttackAbility : AbilityComponent
{
    private readonly string _projectileType;
    private readonly float _range;
    private readonly float _damage;
    private readonly float _cooldown;

    public RangedAttackAbility(string projectileType, float range, float damage = 15f, float cooldown = 2f)
    {
        _projectileType = projectileType;
        _range = range;
        _damage = damage;
        _cooldown = cooldown;
    }

    public override void Tick(float delta)
    {
        _cooldownTimer -= delta;
        if (_cooldownTimer > 0) return;

        var playerPos = _owner.GetPlayerPosition();
        if (_owner.GlobalPosition.DistanceTo(playerPos) <= _range)
        {
            FireProjectile(playerPos);
            _cooldownTimer = _cooldown;
        }
    }

    private void FireProjectile(Vector2 target)
    {
        var projectile = ProjectilePool.Instance?.Get();
        if (projectile != null)
        {
            projectile.GlobalPosition = _owner.GlobalPosition;
            var direction = (target - _owner.GlobalPosition).Normalized();
            projectile.Fire(direction, 300f, _damage);
        }
    }
}

/// <summary>
/// 毒素能力 - 造成持续伤害
/// </summary>
public partial class PoisonAbility : AbilityComponent
{
    private readonly float _dps;
    private readonly float _duration;
    private float _tickTimer;
    private bool _isPoisoning;
    private float _poisonTimer;

    public PoisonAbility(float dps, float duration)
    {
        _dps = dps;
        _duration = duration;
    }

    public override void Tick(float delta)
    {
        if (_isPoisoning)
        {
            _tickTimer += delta;
            _poisonTimer -= delta;

            if (_tickTimer >= 1f)
            {
                _tickTimer = 0f;
                var player = GameManager.Instance?.Player;
                if (player != null)
                {
                    DamageSystem.Instance?.ApplyDamage(
                        player, _dps, GameEnums.DamageType.Poison, _owner
                    );
                }
            }

            if (_poisonTimer <= 0) _isPoisoning = false;
        }
    }

    /// <summary>触发毒素</summary>
    public void ApplyPoison()
    {
        _isPoisoning = true;
        _poisonTimer = _duration;
        _tickTimer = 0f;
    }
}
