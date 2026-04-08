using Godot;

/// <summary>
/// 玩家状态接口 - 各状态的实现基类
/// </summary>
public abstract partial class PlayerStateBase : Node
{
    protected PlayerController _player;

    public void Initialize(PlayerController player)
    {
        _player = player;
    }

    public virtual void Enter() { }
    public virtual void Exit() { }
    public virtual void PhysicsUpdate(float delta) { }
    public virtual void HandleInput(InputEvent @event) { }
}

/// <summary>站立状态</summary>
public partial class PlayerIdleState : PlayerStateBase
{
    public override void PhysicsUpdate(float delta)
    {
        if (_player.InputAxis != Vector2.Zero)
        {
            // 由 PlayerController 自动切换 Moving
        }
    }
}

/// <summary>移动状态</summary>
public partial class PlayerMovingState : PlayerStateBase
{
    public override void PhysicsUpdate(float delta)
    {
        if (_player.InputAxis == Vector2.Zero)
        {
            // 由 PlayerController 自动切换 Idle
        }
    }
}

/// <summary>闪避状态</summary>
public partial class PlayerDodgingState : PlayerStateBase
{
    public override void Enter()
    {
        _player.SetState(GameEnums.PlayerState.Dodging);
    }
}

/// <summary>攻击状态</summary>
public partial class PlayerAttackingState : PlayerStateBase
{
    public override void Enter()
    {
        _player.SetState(GameEnums.PlayerState.Attacking);
    }
}

/// <summary>交互状态</summary>
public partial class PlayerInteractingState : PlayerStateBase
{
    public override void Enter()
    {
        _player.SetState(GameEnums.PlayerState.Interacting);
    }
}
