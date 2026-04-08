using Godot;

/// <summary>
/// AI状态机 - 管理怪物AI状态切换
/// </summary>
public partial class AIStateMachine : Node
{
    private EnemyBase _owner;
    private GameEnums.AIState _currentState = GameEnums.AIState.Idle;

    private float _stateTimer;
    private Vector2 _patrolTarget;

    public void Initialize(EnemyBase owner)
    {
        _owner = owner;
    }

    public void Update(float delta)
    {
        _stateTimer += delta;

        EvaluateTransition();

        switch (_currentState)
        {
            case GameEnums.AIState.Idle:
                // 等待一段时间后开始巡逻
                if (_stateTimer > 3f)
                {
                    ForceTransition(GameEnums.AIState.Patrol);
                }
                break;

            case GameEnums.AIState.Patrol:
                UpdatePatrol(delta);
                break;

            case GameEnums.AIState.Chase:
                _owner.MoveToward(_owner.GetPlayerPosition(), _owner.Data?.MoveSpeed ?? 100f);
                break;

            case GameEnums.AIState.Attack:
                break; // 由能力组件处理

            case GameEnums.AIState.Special:
                _owner.MoveToward(_owner.GetPlayerPosition(), (_owner.Data?.MoveSpeed ?? 100f) * 1.5f);
                break;
        }
    }

    private void EvaluateTransition()
    {
        if (_owner?.Data == null) return;
        var data = _owner.Data;
        var dist = _owner.DistanceToPlayer();

        switch (_currentState)
        {
            case GameEnums.AIState.Idle:
            case GameEnums.AIState.Patrol:
                if (dist <= data.AggroRange)
                {
                    ForceTransition(GameEnums.AIState.Chase);
                }
                break;

            case GameEnums.AIState.Chase:
                if (dist <= data.AttackRange)
                {
                    ForceTransition(GameEnums.AIState.Attack);
                }
                else if (dist > data.AggroRange * 1.5f)
                {
                    ForceTransition(GameEnums.AIState.Idle);
                }
                break;

            case GameEnums.AIState.Attack:
                if (dist > data.AttackRange * 1.2f)
                {
                    ForceTransition(GameEnums.AIState.Chase);
                }
                break;
        }
    }

    private void UpdatePatrol(float delta)
    {
        if (_patrolTarget == Vector2.Zero || GlobalPosition.DistanceTo(_patrolTarget) < 10f)
        {
            // 选择新的巡逻点
            _patrolTarget = _owner.GlobalPosition + new Vector2(
                (float)GD.RandRange(-100, 100),
                (float)GD.RandRange(-100, 100)
            );
        }

        _owner.MoveToward(_patrolTarget, (_owner.Data?.MoveSpeed ?? 100f) * 0.5f);
    }

    /// <summary>强制切换状态</summary>
    public void ForceTransition(GameEnums.AIState newState)
    {
        _currentState = newState;
        _stateTimer = 0f;
        _owner?.SetAIState(newState);
    }
}
