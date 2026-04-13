using Godot;

/// <summary>
/// 玩家控制器
/// 处理玩家移动、翻滚闪避、阵营切换、交互和战斗模式分发
/// 子节点通过 BuildScene() 动态创建，.tscn 只保留空壳
/// </summary>
[GlobalClass]
public partial class PlayerController : CharacterBody2D
{
    // ===== 子节点引用（BuildScene 创建） =====

    private Sprite2D _sprite;
    private CollisionShape2D _collision;
    public HealthComponent Health { get; private set; }
    public HitboxComponent Hitbox { get; private set; }
    public HurtboxComponent Hurtbox { get; private set; }
    public CombatResourceComponent CombatResource { get; private set; }
    public StatusEffectComponent StatusEffect { get; private set; }
    private AnimationPlayer _anim;

    // ===== 导出属性 =====

    /// <summary>角色数据配置</summary>
    [Export]
    public CharacterData Data { get; set; }

    /// <summary>翻滚速度</summary>
    [Export]
    public float RollSpeed { get; set; } = 400f;

    /// <summary>翻滚持续时间</summary>
    [Export]
    public float RollDuration { get; set; } = 0.3f;

    /// <summary>翻滚冷却时间</summary>
    [Export]
    public float RollCooldown { get; set; } = 0.5f;

    // ===== 公共属性 =====

    /// <summary>当前玩家状态</summary>
    public PlayerState CurrentState { get; private set; } = PlayerState.Idle;

    /// <summary>当前战斗模式（阵营差异）</summary>
    public ICombatMode CombatMode { get; private set; }

    /// <summary>面朝方向</summary>
    public Vector2 FacingDirection { get; private set; } = Vector2.Right;

    // ===== 私有字段 =====

    private float _moveSpeed = 200f;
    private float _rollTimer;
    private float _rollCooldownTimer;
    private Vector2 _rollDirection;
    private Vector2 _inputDirection;

    // ===== 生命周期 =====

    public override void _Ready()
    {
        BuildScene();
        Initialize();
    }

    public override void _PhysicsProcess(double delta)
    {
        if (CurrentState == PlayerState.Dead) return;

        float dt = (float)delta;

        // 翻滚冷却计时
        if (_rollCooldownTimer > 0f)
        {
            _rollCooldownTimer -= dt;
        }

        HandleMovement(dt);
        HandleRoll(dt);

        // 战斗模式更新（魔法系蓄力逻辑等）
        CombatMode?.Update(this, delta);

        MoveAndSlide();
        UpdateAnimation();
    }

    public override void _UnhandledInput(InputEvent ev)
    {
        if (CurrentState == PlayerState.Dead) return;

        if (ev.IsActionPressed("attack"))
        {
            CombatMode?.HandleAttack(this);
        }
        else if (ev.IsActionPressed("ultimate"))
        {
            CombatMode?.HandleUltimate(this);
        }
        else if (ev.IsActionPressed("skill_1"))
        {
            CombatMode?.HandleSkill1(this);
        }
        else if (ev.IsActionPressed("skill_2"))
        {
            CombatMode?.HandleSkill2(this);
        }
        else if (ev.IsActionPressed("special_action"))
        {
            CombatMode?.HandleSpecialAction(this);
        }
        else if (ev.IsActionPressed("roll"))
        {
            TryStartRoll();
        }
        else if (ev.IsActionPressed("interact"))
        {
            Interact();
        }
        else if (ev.IsActionPressed("hotbar_1"))
        {
            GetNode<HotbarComponent>("HotbarComponent")?.UseSlot(0);
        }
        else if (ev.IsActionPressed("hotbar_2"))
        {
            GetNode<HotbarComponent>("HotbarComponent")?.UseSlot(1);
        }
        else if (ev.IsActionPressed("hotbar_3"))
        {
            GetNode<HotbarComponent>("HotbarComponent")?.UseSlot(2);
        }
        else if (ev.IsActionPressed("hotbar_4"))
        {
            GetNode<HotbarComponent>("HotbarComponent")?.UseSlot(3);
        }
    }

    // ===== 状态管理 =====

    /// <summary>
    /// 切换玩家状态
    /// </summary>
    /// <param name="newState">目标状态</param>
    public void ChangeState(PlayerState newState)
    {
        if (CurrentState == newState) return;
        PlayerState previous = CurrentState;
        CurrentState = newState;

        // 翻滚开始时启用无敌
        if (newState == PlayerState.Rolling)
        {
            Health?.SetInvincible(true);
        }
        // 翻滚结束时关闭无敌
        if (previous == PlayerState.Rolling && newState != PlayerState.Rolling)
        {
            Health?.SetInvincible(false);
        }
    }

    /// <summary>
    /// 切换阵营（同时切换战斗模式）
    /// </summary>
    /// <param name="faction">目标阵营</param>
    public void SetFaction(FactionType faction)
    {
        CombatMode = faction switch
        {
            FactionType.Tech => new TechCombatMode(),
            FactionType.Magic => new MagicCombatMode(),
            _ => CombatMode
        };

        if (CombatResource != null)
        {
            CombatResource.Faction = faction;
        }
    }

    /// <summary>
    /// 玩家受击入口
    /// </summary>
    /// <param name="amount">伤害量</param>
    public void TakeDamage(float amount)
    {
        if (CurrentState == PlayerState.Dead || CurrentState == PlayerState.Rolling) return;
        Health?.ApplyDamage(amount);
    }

    /// <summary>
    /// 交互（拾取物品等）
    /// </summary>
    public void Interact()
    {
        // 检测交互范围内的可交互对象
        // 具体实现在内容系统阶段完成
        ChangeState(PlayerState.Interacting);
    }

    // ===== 私有方法 =====

    /// <summary>
    /// 从 CharacterData 初始化属性
    /// </summary>
    private void Initialize()
    {
        if (Data != null)
        {
            _moveSpeed = Data.MoveSpeed;
            RollSpeed = Data.RollSpeed;
            RollDuration = Data.RollDuration;
            RollCooldown = Data.RollCooldown;

            if (Health != null)
            {
                Health.MaxHealth = Data.MaxHealth;
                Health.MaxShield = Data.MaxShield;
                Health.ShieldAbsorbRate = Data.ShieldAbsorbRate;
                Health.ShieldRegenSpeed = Data.ShieldRegenSpeed;
                Health.ShieldRegenDelay = Data.ShieldRegenDelay;
            }
        }

        SetFaction(Data?.Faction ?? FactionType.Tech);
    }

    /// <summary>
    /// 处理移动输入
    /// </summary>
    private void HandleMovement(float delta)
    {
        if (CurrentState == PlayerState.Rolling ||
            CurrentState == PlayerState.Dead ||
            CurrentState == PlayerState.Casting)
        {
            return;
        }

        _inputDirection = Vector2.Zero;
        if (Input.IsActionPressed("move_up")) _inputDirection.Y -= 1f;
        if (Input.IsActionPressed("move_down")) _inputDirection.Y += 1f;
        if (Input.IsActionPressed("move_left")) _inputDirection.X -= 1f;
        if (Input.IsActionPressed("move_right")) _inputDirection.X += 1f;

        if (_inputDirection != Vector2.Zero)
        {
            _inputDirection = _inputDirection.Normalized();
            Velocity = _inputDirection * _moveSpeed;
            ChangeState(PlayerState.Moving);
        }
        else
        {
            Velocity = Vector2.Zero;
            if (CurrentState == PlayerState.Moving)
            {
                ChangeState(PlayerState.Idle);
            }
        }

        // 更新面朝方向（跟随鼠标）
        Vector2 mousePos = GetGlobalMousePosition();
        FacingDirection = (mousePos - GlobalPosition).Normalized();
    }

    /// <summary>
    /// 处理翻滚逻辑
    /// </summary>
    private void HandleRoll(float delta)
    {
        if (CurrentState != PlayerState.Rolling) return;

        _rollTimer -= delta;
        Velocity = _rollDirection * RollSpeed;

        if (_rollTimer <= 0f)
        {
            ChangeState(PlayerState.Idle);
            Velocity = Vector2.Zero;
        }
    }

    /// <summary>
    /// 尝试开始翻滚
    /// </summary>
    private void TryStartRoll()
    {
        if (CurrentState == PlayerState.Rolling ||
            CurrentState == PlayerState.Dead ||
            _rollCooldownTimer > 0f)
        {
            return;
        }

        _rollDirection = _inputDirection != Vector2.Zero
            ? _inputDirection.Normalized()
            : FacingDirection;

        _rollTimer = RollDuration;
        _rollCooldownTimer = RollCooldown;
        ChangeState(PlayerState.Rolling);
    }

    /// <summary>
    /// 更新动画状态
    /// </summary>
    private void UpdateAnimation()
    {
        if (_anim == null) return;

        string animName = CurrentState switch
        {
            PlayerState.Idle => "idle",
            PlayerState.Moving => "move",
            PlayerState.Attacking => "attack",
            PlayerState.Rolling => "roll",
            PlayerState.Casting => "cast",
            PlayerState.Interacting => "interact",
            PlayerState.Dead => "dead",
            _ => "idle"
        };

        if (_anim.HasAnimation(animName) && !_anim.IsPlaying())
        {
            _anim.Play(animName);
        }
    }

    /// <summary>
    /// 死亡处理（由 HealthComponent.Died 信号触发）
    /// </summary>
    private void OnDeath()
    {
        ChangeState(PlayerState.Dead);
        SetPhysicsProcess(false);
        EventBus.EmitPlayerDied();
    }

    /// <summary>
    /// 代码构建所有子节点
    /// </summary>
    private void BuildScene()
    {
        // Sprite
        _sprite = new Sprite2D();
        _sprite.Name = "Sprite";
        AddChild(_sprite);
        _sprite.Owner = this;

        // CollisionShape（CircleShape2D R=16）
        _collision = new CollisionShape2D();
        _collision.Name = "CollisionShape";
        _collision.Shape = new CircleShape2D { Radius = 16f };
        AddChild(_collision);
        _collision.Owner = this;

        // 设置物理层：玩家在 Layer 1
        CollisionLayer = 1u;  // Layer 1: Player Body
        CollisionMask = 5u;   // Layer 1 + 3: Player Body + Enemy Body

        // HealthComponent
        Health = new HealthComponent();
        Health.Name = "HealthComponent";
        AddChild(Health);
        Health.Owner = this;
        Health.Died += OnDeath;

        // HitboxComponent（Layer 2，检测 Layer 3 敌人）
        Hitbox = new HitboxComponent();
        Hitbox.Name = "HitboxComponent";
        Hitbox.CollisionLayer = 2u;  // Layer 2: Player Hitbox
        Hitbox.CollisionMask = 4u;   // Layer 3: Enemy Body
        AddChild(Hitbox);
        Hitbox.Owner = this;

        // HurtboxComponent（Layer 1，监测 Layer 4 敌人攻击）
        Hurtbox = new HurtboxComponent();
        Hurtbox.Name = "HurtboxComponent";
        Hurtbox.CollisionLayer = 1u;  // Layer 1: Player Body
        Hurtbox.CollisionMask = 8u;   // Layer 4: Enemy Hitbox
        AddChild(Hurtbox);
        Hurtbox.Owner = this;

        // CombatResourceComponent
        CombatResource = new CombatResourceComponent();
        CombatResource.Name = "CombatResourceComponent";
        AddChild(CombatResource);
        CombatResource.Owner = this;

        // StatusEffectComponent
        StatusEffect = new StatusEffectComponent();
        StatusEffect.Name = "StatusEffectComponent";
        AddChild(StatusEffect);
        StatusEffect.Owner = this;

        // AnimationPlayer
        _anim = new AnimationPlayer();
        _anim.Name = "AnimationPlayer";
        AddChild(_anim);
        _anim.Owner = this;
    }
}
