using Godot;

/// <summary>
/// 敌人AI组件
/// 管理巡逻、追击、攻击行为的决策和速度计算
/// 挂载于 EnemyController
/// </summary>
[GlobalClass]
public partial class EnemyAIComponent : Node
{
    // ===== 导出属性 =====

    /// <summary>侦测范围（像素）</summary>
    [Export]
    public float DetectRange { get; set; } = 300f;

    /// <summary>攻击范围（像素）</summary>
    [Export]
    public float AttackRange { get; set; } = 50f;

    /// <summary>追击速度</summary>
    [Export]
    public float ChaseSpeed { get; set; } = 150f;

    /// <summary>巡逻速度</summary>
    [Export]
    public float PatrolSpeed { get; set; } = 80f;

    /// <summary>攻击冷却时间（秒）</summary>
    [Export]
    public float AttackCooldown { get; set; } = 1f;

    // ===== 公共属性 =====

    /// <summary>是否正在攻击中</summary>
    public bool IsAttacking => _isAttacking;

    // ===== 私有字段 =====

    private EnemyController _owner;
    private float _attackCooldownTimer;
    private bool _isAttacking;
    private Vector2 _patrolTarget;
    private float _patrolWaitTimer;
    private bool _waiting;

    // Hitbox 激活窗口（帧比例）
    private const float HitboxStartRatio = 0.3f;
    private const float HitboxEndRatio = 0.6f;

    /// <summary>
    /// 初始化AI组件
    /// </summary>
    public void Initialize(EnemyController owner)
    {
        _owner = owner;
        _patrolTarget = owner.SpawnPosition;
        _patrolWaitTimer = 0f;
        _waiting = false;
    }

    public override void _Process(double delta)
    {
        if (_owner == null || _owner.CurrentState == EnemyState.Dead) return;

        float dt = (float)delta;

        // 攻击中：帧级 hitbox 控制 + 等待动画播完
        if (_isAttacking)
        {
            UpdateHitboxByFrame();
            return;
        }

        // 攻击CD递减
        if (_attackCooldownTimer > 0f)
        {
            _attackCooldownTimer -= dt;
        }

        // 巡逻等待
        if (_waiting)
        {
            _patrolWaitTimer -= dt;
            if (_patrolWaitTimer <= 0f)
            {
                _waiting = false;
                PickNewPatrolTarget();
            }
        }
    }

    /// <summary>
    /// 计算当前帧移动速度
    /// </summary>
    public Vector2 CalculateVelocity()
    {
        if (_owner == null || _owner.Target == null) return Vector2.Zero;

        // 攻击中不移动
        if (_isAttacking) return Vector2.Zero;

        float distance = _owner.GlobalPosition.DistanceTo(_owner.Target.GlobalPosition);

        // 目标已死亡 → 回到巡逻
        if (IsTargetDead())
        {
            _owner.ChangeState(EnemyState.Idle);
            return Vector2.Zero;
        }

        // 在攻击范围内且CD好了 → 发起攻击
        if (distance <= AttackRange && CanAttack())
        {
            StartAttack();
            return Vector2.Zero;
        }

        // 在侦测范围内 → 追击
        if (distance <= DetectRange)
        {
            _owner.ChangeState(EnemyState.Chase);
            Vector2 direction = (_owner.Target.GlobalPosition - _owner.GlobalPosition).Normalized();
            return direction * ChaseSpeed;
        }

        // 超出侦测范围 → 巡逻
        _owner.ChangeState(EnemyState.Patrol);
        return CalculatePatrolVelocity();
    }

    /// <summary>目标是否在侦测范围内</summary>
    public bool IsTargetInDetectRange()
    {
        if (_owner?.Target == null) return false;
        return _owner.GlobalPosition.DistanceTo(_owner.Target.GlobalPosition) <= DetectRange;
    }

    /// <summary>目标是否在攻击范围内</summary>
    public bool IsTargetInAttackRange()
    {
        if (_owner?.Target == null) return false;
        return _owner.GlobalPosition.DistanceTo(_owner.Target.GlobalPosition) <= AttackRange;
    }

    /// <summary>是否可以攻击（CD结束且不在攻击中）</summary>
    public bool CanAttack() => _attackCooldownTimer <= 0f && !_isAttacking;

    // ===== 攻击管理 =====

    private void StartAttack()
    {
        _isAttacking = true;
        _attackCooldownTimer = AttackCooldown;
        _owner.ChangeState(EnemyState.Attack);

        // 订阅动画播完信号
        _owner.SpriteSheet.AnimatedSprite.AnimationFinished += OnAttackAnimationFinished;
    }

    private void OnAttackAnimationFinished()
    {
        _owner.SpriteSheet.AnimatedSprite.AnimationFinished -= OnAttackAnimationFinished;
        _isAttacking = false;
        _owner.Hitbox.SetActive(false);
        _owner.ChangeState(EnemyState.Chase);
    }

    /// <summary>根据当前帧控制 hitbox 开关</summary>
    private void UpdateHitboxByFrame()
    {
        var sheet = _owner.SpriteSheet;
        if (sheet == null) return;

        int frame = sheet.CurrentFrame;
        int total = sheet.FrameCount;
        if (total == 0) return;

        int hitboxStart = (int)(total * HitboxStartRatio);
        int hitboxEnd = (int)(total * HitboxEndRatio);

        _owner.Hitbox.SetActive(frame >= hitboxStart && frame <= hitboxEnd);
    }

    // ===== 巡逻 =====

    /// <summary>检查目标是否死亡</summary>
    private bool IsTargetDead()
    {
        if (_owner.Target == null) return true;
        var health = _owner.Target.GetNodeOrNull<HealthComponent>("HealthComponent");
        return health != null && health.IsDead;
    }

    /// <summary>计算巡逻速度</summary>
    private Vector2 CalculatePatrolVelocity()
    {
        if (_waiting) return Vector2.Zero;

        Vector2 toTarget = _patrolTarget - _owner.GlobalPosition;
        if (toTarget.Length() < 10f)
        {
            _waiting = true;
            _patrolWaitTimer = (float)GD.RandRange(1.0, 3.0);
            return Vector2.Zero;
        }

        return toTarget.Normalized() * PatrolSpeed;
    }

    /// <summary>随机选择新巡逻目标点（在出生位置附近）</summary>
    private void PickNewPatrolTarget()
    {
        float patrolRadius = 100f;
        float angle = (float)GD.RandRange(0, Mathf.Tau);
        float dist = (float)GD.RandRange(30f, patrolRadius);
        _patrolTarget = _owner.SpawnPosition + new Vector2(Mathf.Cos(angle), Mathf.Sin(angle)) * dist;
    }
}
