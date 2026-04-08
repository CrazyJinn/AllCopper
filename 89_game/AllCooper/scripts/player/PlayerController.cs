using Godot;

/// <summary>
/// 角色控制器 - 处理移动、闪避、朝向、拾取
/// </summary>
public partial class PlayerController : CharacterBody2D
{
    [Signal] public delegate void DodgeStartedEventHandler();
    [Signal] public delegate void DodgeEndedEventHandler();
    [Signal] public delegate void ItemPickedUpEventHandler(Node item);

    [Export] public float MoveSpeed { get; set; } = 200f;
    [Export] public float DodgeSpeed { get; set; } = 400f;
    [Export] public float DodgeDuration { get; set; } = 0.3f;
    [Export] public float DodgeCooldown { get; set; } = 0.8f;

    public GameEnums.PlayerState CurrentState { get; private set; } = GameEnums.PlayerState.Idle;
    public GameEnums.FacingDirection Facing { get; private set; } = GameEnums.FacingDirection.Front;
    public Vector2 InputAxis { get; private set; }
    public bool IsDodging => CurrentState == GameEnums.PlayerState.Dodging;

    private Sprite2D _sprite;
    private float _dodgeTimer;
    private float _dodgeCooldownTimer;
    private Vector2 _dodgeDirection;
    private bool _isInvincible;

    public override void _Ready()
    {
        _sprite = new Sprite2D { Name = "Sprite" };
        AddChild(_sprite);

        // 碰撞形状
        var collision = new CollisionShape2D { Name = "CollisionShape" };
        var shape = new CircleShape2D { Radius = 16f };
        collision.Shape = shape;
        AddChild(collision);

        GameManager.Instance.Player = this;
    }

    public override void _PhysicsProcess(double delta)
    {
        var dt = (float)delta;

        // 更新计时器
        if (_dodgeCooldownTimer > 0)
            _dodgeCooldownTimer -= dt;

        // 读取输入
        InputAxis = Input.GetVector("move_left", "move_right", "move_up", "move_down");

        switch (CurrentState)
        {
            case GameEnums.PlayerState.Idle:
            case GameEnums.PlayerState.Moving:
                HandleMovement(dt);
                HandleDodge();
                HandleInteract();
                break;

            case GameEnums.PlayerState.Dodging:
                HandleDodging(dt);
                break;

            case GameEnums.PlayerState.Attacking:
            case GameEnums.PlayerState.Interacting:
                break;
        }

        MoveAndSlide();
    }

    private void HandleMovement(float delta)
    {
        Velocity = InputAxis * MoveSpeed;

        if (InputAxis != Vector2.Zero)
        {
            CurrentState = GameEnums.PlayerState.Moving;
            UpdateFacing();
        }
        else
        {
            CurrentState = GameEnums.PlayerState.Idle;
        }
    }

    private void HandleDodge()
    {
        if (!Input.IsActionJustPressed("dodge")) return;
        if (_dodgeCooldownTimer > 0) return;

        _dodgeDirection = InputAxis != Vector2.Zero ? InputAxis.Normalized() : GetForwardVector();
        CurrentState = GameEnums.PlayerState.Dodging;
        _dodgeTimer = DodgeDuration;
        _isInvincible = true;
        _dodgeCooldownTimer = DodgeCooldown;
        EmitSignal(SignalName.DodgeStarted);
    }

    private void HandleDodging(float delta)
    {
        Velocity = _dodgeDirection * DodgeSpeed;
        _dodgeTimer -= delta;

        if (_dodgeTimer <= 0f)
        {
            _isInvincible = false;
            CurrentState = GameEnums.PlayerState.Idle;
            EmitSignal(SignalName.DodgeEnded);
        }
    }

    private void HandleInteract()
    {
        if (!Input.IsActionJustPressed("interact")) return;

        // 检测附近的可交互物
        var area = new Area2D { Name = "InteractCheck" };
        var shape = new CircleShape2D { Radius = 32f };
        var collision = new CollisionShape2D { Shape = shape };
        area.AddChild(collision);
        AddChild(area);

        var bodies = area.GetOverlappingBodies();
        foreach (var body in bodies)
        {
            if (body.HasMethod("OnInteract"))
            {
                body.Call("OnInteract");
                EmitSignal(SignalName.ItemPickedUp, body);
                break;
            }
        }

        area.QueueFree();
    }

    private void UpdateFacing()
    {
        if (InputAxis.X > 0)
        {
            Facing = GameEnums.FacingDirection.Front;
            if (_sprite != null) _sprite.FlipH = false;
        }
        else if (InputAxis.X < 0)
        {
            Facing = GameEnums.FacingDirection.Front;
            if (_sprite != null) _sprite.FlipH = true;
        }

        if (InputAxis.Y < 0) Facing = GameEnums.FacingDirection.Back;
        else if (InputAxis.Y > 0) Facing = GameEnums.FacingDirection.Front;
    }

    private Vector2 GetForwardVector()
    {
        return Facing == GameEnums.FacingDirection.Front ? Vector2.Down : Vector2.Up;
    }

    /// <summary>是否处于无敌帧</summary>
    public bool IsInvincible() => _isInvincible;

    /// <summary>外部设置状态（如战斗系统接管）</summary>
    public void SetState(GameEnums.PlayerState state)
    {
        CurrentState = state;
    }
}
