using Godot;
using System.Collections.Generic;

/// <summary>
/// 怪物基类 - AI状态机 + 能力组件模式
/// </summary>
public partial class EnemyBase : CharacterBody2D
{
    [Signal] public delegate void AggroGainedEventHandler();
    [Signal] public delegate void AggroLostEventHandler();
    [Signal] public delegate void SpecialAbilityUsedEventHandler(string abilityId);
    [Signal] public delegate void EnemyDiedEventHandler(EnemyBase enemy);

    [Export] public EnemyData Data { get; set; }

    public GameEnums.AIState CurrentAIState { get; private set; } = GameEnums.AIState.Idle;
    public BattleResource Resource { get; private set; }
    public bool IsEnraged { get; private set; }

    protected List<AbilityComponent> _abilities = new();
    protected AIStateMachine _aiStateMachine;
    protected Sprite2D _sprite;
    protected Hurtbox _hurtbox;

    private Vector2 _patrolOrigin;
    private Vector2 _patrolTarget;
    private float _patrolWaitTimer;
    private float _enrageMultiplier = 1f;

    public override void _Ready()
    {
        _sprite = new Sprite2D { Name = "Sprite" };
        AddChild(_sprite);

        var collision = new CollisionShape2D { Name = "Collision" };
        collision.Shape = new CircleShape2D { Radius = 16f };
        AddChild(collision);

        _hurtbox = new Hurtbox { Name = "Hurtbox" };
        AddChild(_hurtbox);

        Resource = new BattleResource { Name = "BattleResource" };
        AddChild(Resource);

        if (Data != null)
        {
            Resource.MaxHP = Data.BaseStats.MaxHP;
            Resource.MaxShield = Data.BaseStats.MaxShield;
        }

        _aiStateMachine = new AIStateMachine { Name = "AIStateMachine" };
        AddChild(_aiStateMachine);
        _aiStateMachine.Initialize(this);

        _patrolOrigin = GlobalPosition;
    }

    public override void _PhysicsProcess(double delta)
    {
        var dt = (float)delta;

        // 更新能力组件
        foreach (var ability in _abilities)
        {
            ability.Tick(dt);
        }

        // AI状态机更新
        _aiStateMachine.Update(dt);

        MoveAndSlide();
    }

    /// <summary>添加能力组件</summary>
    public void AddAbility(AbilityComponent ability)
    {
        _abilities.Add(ability);
        ability.Initialize(this);
        AddChild(ability);
    }

    /// <summary>受击（由伤害系统调用）</summary>
    public void TakeDamageFromSpell(float amount, GameEnums.DamageType damageType)
    {
        Resource.TakeDamage(amount, damageType);

        // 被打进入追击
        if (CurrentAIState == GameEnums.AIState.Idle || CurrentAIState == GameEnums.AIState.Patrol)
        {
            _aiStateMachine.ForceTransition(GameEnums.AIState.Chase);
        }

        // 精英怪狂暴检查
        if (Data?.IsElite == true && !IsEnraged)
        {
            float hpPercent = Resource.HP / Resource.MaxHP;
            if (hpPercent <= Data.EnrageThreshold)
            {
                Enrage();
            }
        }

        if (Resource.HP <= 0)
        {
            Die();
        }
    }

    /// <summary>进入狂暴</summary>
    public void Enrage()
    {
        IsEnraged = true;
        _enrageMultiplier = Data?.EnrageMultiplier ?? 1.5f;
        _aiStateMachine.ForceTransition(GameEnums.AIState.Special);
    }

    /// <summary>死亡处理</summary>
    protected virtual void Die()
    {
        EmitSignal(SignalName.EnemyDied, this);
        QueueFree();
    }

    /// <summary>获取玩家位置</summary>
    public Vector2 GetPlayerPosition()
    {
        return GameManager.Instance?.Player?.GlobalPosition ?? Vector2.Zero;
    }

    /// <summary>朝目标移动</summary>
    public void MoveToward(Vector2 target, float speed)
    {
        var direction = (target - GlobalPosition).Normalized();
        Velocity = direction * speed * _enrageMultiplier;
    }

    /// <summary>获取与玩家的距离</summary>
    public float DistanceToPlayer()
    {
        return GlobalPosition.DistanceTo(GetPlayerPosition());
    }

    public void SetAIState(GameEnums.AIState state)
    {
        var oldState = CurrentAIState;
        CurrentAIState = state;

        if (oldState != GameEnums.AIState.Chase && state == GameEnums.AIState.Chase)
            EmitSignal(SignalName.AggroGained);
        else if (oldState == GameEnums.AIState.Chase && state != GameEnums.AIState.Chase)
            EmitSignal(SignalName.AggroLost);
    }
}
