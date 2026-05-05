using Godot;

/// <summary>
/// 玩家控制器
/// </summary>
[GlobalClass]
public partial class PlayerController : CharacterBody2D
{
    // ===== 子节点引用 =====

    private CollisionShape2D _collision;
    public HealthComponent Health { get; private set; }
    public HitboxComponent Hitbox { get; private set; }
    public HurtboxComponent Hurtbox { get; private set; }
    public CombatResourceComponent CombatResource { get; private set; }
    public StatusEffectComponent StatusEffect { get; private set; }
    public SpriteSheetComponent SpriteSheet { get; private set; }

    // ===== 导出属性 =====

    [Export]
    public CharacterData Data { get; set; }

    [Export]
    public float RollSpeed { get; set; } = 800f;

    [Export]
    public float RollCooldown { get; set; } = 0.5f;

    /// <summary>静止多久后播放 idle 动画（秒）</summary>
    [Export]
    public float IdleTimeout { get; set; } = 5f;

    // ===== 公共属性 =====

    public PlayerState CurrentState { get; private set; } = PlayerState.Idle;
    public ICombatMode CombatMode { get; private set; }
    public Vector2 FacingDirection { get; private set; } = Vector2.Right;

    // ===== 私有字段 =====

    private float _moveSpeed = 200f;
    private float _rollCooldownTimer;
    private Vector2 _rollDirection;
    private Vector2 _inputDirection;
    private Vector2 _lastMoveDirection = Vector2.Right;
    private float _idleTimer;
    private bool _rollAnimPlayed;

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

        if (_rollCooldownTimer > 0f)
            _rollCooldownTimer -= dt;

        HandleMovement(dt);

        // 闪避期间持续移动
        if (CurrentState == PlayerState.Rolling)
            Velocity = _rollDirection * RollSpeed;

        CombatMode?.Update(this, delta);

        MoveAndSlide();
        UpdateAnimation();
        UpdateIdle(dt);
    }

    public override void _UnhandledInput(InputEvent ev)
    {
        if (CurrentState == PlayerState.Dead) return;
        if (CurrentState == PlayerState.Rolling) return;

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

    public void ChangeState(PlayerState newState)
    {
        if (CurrentState == newState) return;
        PlayerState previous = CurrentState;
        CurrentState = newState;

        if (newState == PlayerState.Rolling)
            Health?.SetInvincible(true);
        if (previous == PlayerState.Rolling && newState != PlayerState.Rolling)
            Health?.SetInvincible(false);

        if (previous == PlayerState.Idle || newState == PlayerState.Idle)
            _idleTimer = 0f;
    }

    public void SetFaction(FactionType faction)
    {
        CombatMode = faction switch
        {
            FactionType.Tech => new TechCombatMode(),
            FactionType.Magic => new MagicCombatMode(),
            _ => CombatMode
        };

        if (CombatResource != null)
            CombatResource.Faction = faction;
    }

    public void TakeDamage(float amount)
    {
        if (CurrentState == PlayerState.Dead || CurrentState == PlayerState.Rolling) return;
        Health?.ApplyDamage(amount);
    }

    public void Interact()
    {
        ChangeState(PlayerState.Interacting);
    }

    // ===== 私有方法 =====

    private void Initialize()
    {
        if (Data != null)
        {
            _moveSpeed = Data.MoveSpeed;
            RollSpeed = Data.RollSpeed;
            RollCooldown = Data.RollCooldown;

            if (!string.IsNullOrEmpty(Data.TpsheetPath) && SpriteSheet != null)
                SpriteSheet.Initialize(Data.TpsheetPath);

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
            _lastMoveDirection = _inputDirection;
            ChangeState(PlayerState.Moving);
        }
        else
        {
            Velocity = Vector2.Zero;
            if (CurrentState == PlayerState.Moving)
                ChangeState(PlayerState.Idle);
        }

        Vector2 mousePos = GetGlobalMousePosition();
        FacingDirection = (mousePos - GlobalPosition).Normalized();
    }

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
            : _lastMoveDirection;

        _rollCooldownTimer = RollCooldown;
        _rollAnimPlayed = false;
        ChangeState(PlayerState.Rolling);
    }

    /// <summary>dodge 动画播完时由信号触发，结束闪避状态</summary>
    private void OnRollAnimFinished(string animName)
    {
        if (CurrentState != PlayerState.Rolling) return;
        if (!animName.StartsWith("dodge")) return;

        Velocity = Vector2.Zero;
        ChangeState(PlayerState.Idle);
    }

    private void UpdateAnimation()
    {
        if (SpriteSheet == null) return;

        if (CurrentState == PlayerState.Rolling)
        {
            if (!_rollAnimPlayed)
            {
                _rollAnimPlayed = true;
                string dir = _rollDirection.Y >= 0 ? "front" : "back";
                SpriteSheet.SetDirection(dir);
                SpriteSheet.SetFlipH(_rollDirection.X > 0);
                SpriteSheet.PlayOnce($"dodge_{dir}");
            }
            return;
        }

        if (CurrentState == PlayerState.Idle)
        {
            if (SpriteSheet.IsPlaying)
                SpriteSheet.Stop();
            string idleDir = _lastMoveDirection.Y >= 0 ? "front" : "back";
            SpriteSheet.SetDirection(idleDir);
            SpriteSheet.SetFlipH(_lastMoveDirection.X > 0);
            return;
        }

        Vector2 facing = CurrentState == PlayerState.Attacking ? FacingDirection : _lastMoveDirection;
        string direction = facing.Y >= 0 ? "front" : "back";
        SpriteSheet.SetFlipH(facing.X > 0);

        string animName = CurrentState switch
        {
            PlayerState.Moving => $"move_{direction}",
            PlayerState.Attacking => $"attack_{direction}",
            PlayerState.Casting => $"cast_{direction}",
            PlayerState.Interacting => $"interact_{direction}",
            PlayerState.Dead => "dead",
            _ => $"idle_{direction}"
        };

        SpriteSheet.Play(animName);
    }

    private void UpdateIdle(float dt)
    {
        if (CurrentState != PlayerState.Idle) return;
        if (SpriteSheet == null) return;
        if (SpriteSheet.IsPlaying) return;

        _idleTimer += dt;
        if (_idleTimer >= IdleTimeout)
        {
            string direction = _lastMoveDirection.Y >= 0 ? "front" : "back";
            SpriteSheet.PlayOnce($"idle_{direction}");
            _idleTimer = 0f;
        }
    }

    private void OnDeath()
    {
        ChangeState(PlayerState.Dead);
        SetPhysicsProcess(false);
        EventBus.EmitPlayerDied();
    }

    private void BuildScene()
    {
        SpriteSheet = new SpriteSheetComponent();
        SpriteSheet.Name = "SpriteSheet";
        SpriteSheet.AnimationFinished += OnRollAnimFinished;
        AddChild(SpriteSheet);
        SpriteSheet.Owner = this;

        _collision = new CollisionShape2D();
        _collision.Name = "CollisionShape";
        _collision.Shape = new CircleShape2D { Radius = 16f };
        AddChild(_collision);
        _collision.Owner = this;

        CollisionLayer = 1u;
        CollisionMask = 5u;

        Health = new HealthComponent();
        Health.Name = "HealthComponent";
        AddChild(Health);
        Health.Owner = this;
        Health.Died += OnDeath;

        Hitbox = new HitboxComponent();
        Hitbox.Name = "HitboxComponent";
        Hitbox.CollisionLayer = 2u;
        Hitbox.CollisionMask = 4u;
        AddChild(Hitbox);
        Hitbox.Owner = this;

        Hurtbox = new HurtboxComponent();
        Hurtbox.Name = "HurtboxComponent";
        Hurtbox.CollisionLayer = 1u;
        Hurtbox.CollisionMask = 8u;
        AddChild(Hurtbox);
        Hurtbox.Owner = this;

        CombatResource = new CombatResourceComponent();
        CombatResource.Name = "CombatResourceComponent";
        AddChild(CombatResource);
        CombatResource.Owner = this;

        StatusEffect = new StatusEffectComponent();
        StatusEffect.Name = "StatusEffectComponent";
        AddChild(StatusEffect);
        StatusEffect.Owner = this;
    }
}
