using Godot;

/// <summary>
/// 敌人控制器
/// 管理敌人状态机、AI行为委托、受击反应、死亡处理和狂暴触发
/// 子节点通过 BuildScene() 动态创建
/// </summary>
[GlobalClass]
public partial class EnemyController : CharacterBody2D
{
    // ===== 子节点引用 =====

    public HealthComponent Health { get; private set; }
    public HitboxComponent Hitbox { get; private set; }
    public HurtboxComponent Hurtbox { get; private set; }
    public EnemyAIComponent AI { get; private set; }
    public SpriteSheetComponent SpriteSheet { get; private set; }

    // ===== 导出属性 =====

    /// <summary>敌人数据配置</summary>
    [Export]
    public EnemyData Data { get; set; }

    // ===== 公共属性 =====

    /// <summary>当前敌人状态</summary>
    public EnemyState CurrentState { get; private set; } = EnemyState.Idle;

    /// <summary>出生位置（巡逻中心）</summary>
    public Vector2 SpawnPosition { get; set; }

    /// <summary>当前追踪目标</summary>
    public CharacterBody2D Target { get; set; }

    /// <summary>是否处于狂暴状态</summary>
    public bool IsBerserk { get; private set; }

    // ===== 私有字段 =====

    private float _attackPower = 10f;
    private float _moveSpeed = 150f;

    public override void _Ready()
    {
        BuildScene();
        Initialize();
    }

    public override void _PhysicsProcess(double delta)
    {
        if (CurrentState == EnemyState.Dead) return;

        // 眩晕中不执行AI
        if (CurrentState == EnemyState.Stunned) return;

        // 攻击中由AI组件管理
        if (AI.IsAttacking)
        {
            if (AI.IsDashing)
            {
                // 冲刺中允许移动
                Velocity = AI.CalculateVelocity();
                MoveAndSlide();
            }
            else
            {
                Velocity = Vector2.Zero;
            }
            UpdateAnimation();
            return;
        }

        // AI 计算移动速度
        if (Target != null && !Target.IsQueuedForDeletion())
        {
            Vector2 aiVelocity = AI.CalculateVelocity();
            Velocity = aiVelocity;
        }
        else
        {
            Velocity = Vector2.Zero;
            if (CurrentState == EnemyState.Chase || CurrentState == EnemyState.Attack)
            {
                ChangeState(EnemyState.Idle);
            }
        }

        MoveAndSlide();
        UpdateAnimation();
    }

    /// <summary>
    /// 切换敌人状态
    /// </summary>
    public void ChangeState(EnemyState newState)
    {
        if (CurrentState == newState) return;
        CurrentState = newState;
    }

    /// <summary>
    /// 从 EnemyData 初始化属性
    /// </summary>
    public void Initialize()
    {
        if (Data == null) return;

        SpawnPosition = GlobalPosition;
        _attackPower = Data.AttackPower;
        _moveSpeed = Data.MoveSpeed;

        if (!string.IsNullOrEmpty(Data.TpsheetPath) && SpriteSheet != null)
            SpriteSheet.Initialize(Data.TpsheetPath);

        if (Health != null)
        {
            Health.MaxHealth = Data.MaxHealth;
            Health.MaxShield = Data.MaxShield;
        }

        if (Hitbox != null)
        {
            Hitbox.SetDamage(Data.AttackPower);
        }

        if (AI != null)
        {
            AI.DetectRange = Data.DetectRange;
            AI.AttackRange = Data.AttackRange;
            AI.ChaseSpeed = Data.MoveSpeed;
            AI.HasChargeAttack = Data.HasChargeAttack;
            AI.DashSpeed = Data.DashSpeed;
            AI.DashDistance = Data.DashDistance;
            AI.Initialize(this);
        }

        if (Health != null)
        {
            Health.Died += OnDeath;
            Health.Damaged += OnDamaged;
        }
    }

    /// <summary>
    /// 设置追踪目标
    /// </summary>
    /// <param name="target">目标（通常为 PlayerController）</param>
    public void SetTarget(CharacterBody2D target)
    {
        Target = target;
    }

    /// <summary>
    /// 受击反应
    /// </summary>
    private void OnDamaged(float rawDamage, DamageType type)
    {
        // 检查狂暴
        CheckBerserk();
    }

    /// <summary>
    /// 死亡处理
    /// </summary>
    private void OnDeath()
    {
        ChangeState(EnemyState.Dead);
        SetPhysicsProcess(false);
        Hitbox?.SetActive(false);
        EventBus.EmitEnemyDefeated(Data?.EnemyId ?? "unknown");

        // 掉落物生成（待补充）
        // 死亡动画后 QueueFree()
    }

    /// <summary>
    /// 检查狂暴触发条件
    /// </summary>
    private void CheckBerserk()
    {
        if (Data == null || !Data.HasBerserk || IsBerserk) return;

        float hpRatio = Health.CurrentHealth / Health.MaxHealth;
        if (hpRatio <= Data.BerserkThreshold)
        {
            IsBerserk = true;
            _moveSpeed *= 1.5f;
            _attackPower *= 1.5f;
            Hitbox?.SetDamage(_attackPower);
            AI.ChaseSpeed = _moveSpeed;
        }
    }

    /// <summary>
    /// 更新动画
    /// </summary>
    private void UpdateAnimation()
    {
        if (SpriteSheet == null) return;

        // 朝向：冲刺用冲刺方向，蓄力/攻击用目标方向，其他用移动方向
        Vector2 facing;
        if (AI.IsDashing)
            facing = AI.DashDirection;
        else if ((CurrentState == EnemyState.Attack || CurrentState == EnemyState.ChargeUp) && Target != null)
            facing = (Target.GlobalPosition - GlobalPosition).Normalized();
        else
            facing = Velocity;

        string direction = facing.Y >= 0 ? "front" : "back";

        // 水平翻转：精灵默认朝左
        if (facing.X != 0f)
            SpriteSheet.SetFlipH(facing.X > 0);

        string animName = CurrentState switch
        {
            EnemyState.Idle => $"idle_{direction}",
            EnemyState.Patrol => $"move_{direction}",
            EnemyState.Chase => $"move_{direction}",
            EnemyState.ChargeUp => $"attack_{direction}",
            EnemyState.Attack => $"attack_{direction}",
            EnemyState.Stunned => $"stunned_{direction}",
            EnemyState.Dead => "death",
            _ => $"idle_{direction}"
        };

        // 蓄力：慢放，非循环
        if (CurrentState == EnemyState.ChargeUp)
        {
            SpriteSheet.SetSpeedScale(0.2f);
            SpriteSheet.PlayOnce(animName);
        }
        // 攻击/冲刺：正常速度，非循环
        else if (CurrentState == EnemyState.Attack)
        {
            SpriteSheet.SetSpeedScale(1f);
            SpriteSheet.PlayOnce(animName);
        }
        else
        {
            SpriteSheet.SetSpeedScale(1f);
            SpriteSheet.Play(animName);
        }
    }

    /// <summary>
    /// 代码构建所有子节点
    /// </summary>
    private void BuildScene()
    {
        // SpriteSheetComponent
        SpriteSheet = new SpriteSheetComponent();
        SpriteSheet.Name = "SpriteSheet";
        AddChild(SpriteSheet);
        SpriteSheet.Owner = this;

        // CollisionShape
        var collision = new CollisionShape2D();
        collision.Name = "CollisionShape";
        collision.Shape = new CircleShape2D { Radius = 16f };
        AddChild(collision);
        collision.Owner = this;

        // 物理层：敌人在 Layer 3
        CollisionLayer = 4u;  // Layer 3: Enemy Body
        CollisionMask = 3u;   // Layer 1 + 2: Player Body + Player Hitbox

        // HealthComponent
        Health = new HealthComponent();
        Health.Name = "HealthComponent";
        AddChild(Health);
        Health.Owner = this;

        // HitboxComponent（Layer 4，检测 Layer 1 玩家）
        Hitbox = new HitboxComponent();
        Hitbox.Name = "HitboxComponent";
        Hitbox.CollisionLayer = 8u;  // Layer 4: Enemy Hitbox
        Hitbox.CollisionMask = 1u;   // Layer 1: Player Body
        AddChild(Hitbox);
        Hitbox.Owner = this;

        // HurtboxComponent（Layer 3，监测 Layer 2 玩家攻击）
        Hurtbox = new HurtboxComponent();
        Hurtbox.Name = "HurtboxComponent";
        Hurtbox.CollisionLayer = 4u;  // Layer 3: Enemy Body
        Hurtbox.CollisionMask = 2u;   // Layer 2: Player Hitbox
        AddChild(Hurtbox);
        Hurtbox.Owner = this;

        // EnemyAIComponent
        AI = new EnemyAIComponent();
        AI.Name = "EnemyAIComponent";
        AddChild(AI);
        AI.Owner = this;
    }
}
