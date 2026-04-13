using Godot;

/// <summary>
/// 战斗资源组件
/// 管理科技系弹药（消耗/换弹）和魔法系蓄力/技能CD
/// 挂载于 PlayerController
/// </summary>
[GlobalClass]
public partial class CombatResourceComponent : Node
{
    // ===== 信号 =====

    [Signal]
    public delegate void AmmoChangedEventHandler(int current, int max);

    [Signal]
    public delegate void ChargeChangedEventHandler(float progress);

    [Signal]
    public delegate void SkillCooldownUpdatedEventHandler(int slot, float remaining, float total);

    // ===== 导出属性 =====

    /// <summary>阵营类型</summary>
    [Export]
    public FactionType Faction { get; set; }

    // 科技系
    /// <summary>最大弹药数</summary>
    [Export]
    public int MaxAmmo { get; set; } = 30;

    /// <summary>换弹时间（秒）</summary>
    [Export]
    public float ReloadTime { get; set; } = 1.5f;

    // 魔法系
    /// <summary>蓄力时间（秒）</summary>
    [Export]
    public float ChargeTime { get; set; } = 2f;

    /// <summary>CD加速倍率</summary>
    [Export]
    public float CdAcceleration { get; set; } = 1f;

    // ===== 公共属性 =====

    /// <summary>当前弹药数</summary>
    public int CurrentAmmo { get; private set; }

    /// <summary>蓄力进度（0~1）</summary>
    public float ChargeProgress { get; private set; }

    /// <summary>是否正在蓄力</summary>
    public bool IsCharging { get; private set; }

    /// <summary>是否正在换弹</summary>
    public bool IsReloading { get; private set; }

    // ===== 私有字段 =====

    // 技能CD：slot 0=Q, 1=左键, 2=右键, 3=E
    private readonly float[] _skillCooldowns = new float[4];
    private readonly float[] _skillMaxCooldowns = new float[4];
    private float _reloadTimer;
    private bool _cdAccelerationActive;

    public override void _Ready()
    {
        CurrentAmmo = MaxAmmo;
    }

    public override void _Process(double delta)
    {
        float dt = (float)delta;

        // 换弹计时
        if (IsReloading)
        {
            _reloadTimer -= dt;
            if (_reloadTimer <= 0f)
            {
                IsReloading = false;
                CurrentAmmo = MaxAmmo;
                EmitSignal(SignalName.AmmoChanged, CurrentAmmo, MaxAmmo);
            }
        }

        // 技能CD递减
        for (int i = 0; i < 4; i++)
        {
            if (_skillCooldowns[i] > 0f)
            {
                float speed = _cdAccelerationActive ? CdAcceleration : 1f;
                _skillCooldowns[i] -= dt * speed;
                if (_skillCooldowns[i] < 0f) _skillCooldowns[i] = 0f;
                EmitSignal(SignalName.SkillCooldownUpdated, i, _skillCooldowns[i], _skillMaxCooldowns[i]);
            }
        }
    }

    /// <summary>
    /// 消耗弹药
    /// </summary>
    /// <param name="count">消耗数量</param>
    public void ConsumeAmmo(int count)
    {
        if (count <= 0) return;
        CurrentAmmo = Mathf.Max(0, CurrentAmmo - count);
        EmitSignal(SignalName.AmmoChanged, CurrentAmmo, MaxAmmo);
    }

    /// <summary>
    /// 开始换弹
    /// </summary>
    public void Reload()
    {
        if (IsReloading || CurrentAmmo >= MaxAmmo) return;
        IsReloading = true;
        _reloadTimer = ReloadTime;
    }

    /// <summary>
    /// 开始蓄力（魔法系）
    /// </summary>
    public void StartCharge()
    {
        if (IsCharging) return;
        IsCharging = true;
        ChargeProgress = 0f;
    }

    /// <summary>
    /// 取消蓄力
    /// </summary>
    public void CancelCharge()
    {
        IsCharging = false;
        ChargeProgress = 0f;
        EmitSignal(SignalName.ChargeChanged, 0f);
    }

    /// <summary>
    /// 推进蓄力进度
    /// </summary>
    /// <param name="delta">帧间隔</param>
    public void AdvanceCharge(double delta)
    {
        if (!IsCharging) return;
        ChargeProgress = Mathf.Min(1f, ChargeProgress + (float)(delta / ChargeTime));
        EmitSignal(SignalName.ChargeChanged, ChargeProgress);
    }

    /// <summary>
    /// 获取蓄力进度
    /// </summary>
    public float GetChargeProgress() => ChargeProgress;

    /// <summary>
    /// 使用技能（开始CD）
    /// </summary>
    /// <param name="slot">技能槽位（0=Q, 1=左键, 2=右键, 3=E）</param>
    /// <param name="cooldown">冷却时间</param>
    public void UseSkill(int slot, float cooldown)
    {
        if (slot < 0 || slot > 3) return;
        _skillCooldowns[slot] = cooldown;
        _skillMaxCooldowns[slot] = cooldown;
        EmitSignal(SignalName.SkillCooldownUpdated, slot, cooldown, cooldown);
    }

    /// <summary>
    /// 技能是否就绪（CD结束）
    /// </summary>
    /// <param name="slot">技能槽位</param>
    public bool IsSkillReady(int slot)
    {
        if (slot < 0 || slot > 3) return false;
        return _skillCooldowns[slot] <= 0f;
    }

    /// <summary>
    /// 获取技能CD剩余时间
    /// </summary>
    /// <param name="slot">技能槽位</param>
    public float GetSkillCooldown(int slot)
    {
        if (slot < 0 || slot > 3) return 0f;
        return _skillCooldowns[slot];
    }

    /// <summary>
    /// 激活CD加速（魔法系R键）
    /// </summary>
    /// <param name="active">是否激活</param>
    public void SetCdAcceleration(bool active)
    {
        _cdAccelerationActive = active;
    }
}
