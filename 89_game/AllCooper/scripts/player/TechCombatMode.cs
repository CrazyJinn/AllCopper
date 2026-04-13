using Godot;

/// <summary>
/// 科技系战斗模式（罗兰）
/// 操作：近战/远程攻击、换弹（R键）、无移动限制
/// </summary>
public class TechCombatMode : ICombatMode
{
    private float _meleeDuration = 0.2f;
    private float _meleeTimer;

    /// <summary>
    /// 处理普通攻击（左键）：近战激活 Hitbox
    /// </summary>
    public void HandleAttack(PlayerController player)
    {
        if (player.CurrentState == PlayerState.Dead ||
            player.CurrentState == PlayerState.Rolling) return;

        var resource = player.CombatResource;
        if (resource == null) return;

        // 科技系弹药检查
        if (resource.CurrentAmmo <= 0)
        {
            AudioManager.Instance?.PlaySFX("res://assets/sfx/empty_ammo.ogg");
            return;
        }

        // 近战攻击：激活 Hitbox 短暂时间
        player.Hitbox.SetDamage(10f);
        player.Hitbox.SetActive(true);
        _meleeTimer = _meleeDuration;
        resource.ConsumeAmmo(1);
        player.ChangeState(PlayerState.Attacking);

        // 短暂后关闭 Hitbox（通过 Update 倒计时）
    }

    /// <summary>
    /// 处理终极技能（右键）
    /// </summary>
    public void HandleUltimate(PlayerController player)
    {
        if (!player.CombatResource.IsSkillReady(2)) return;
        // 远程大招：从 ObjectPool 取子弹
        // 具体实现在技能系统完善时补充
        player.CombatResource.UseSkill(2, 15f);
    }

    /// <summary>
    /// 处理技能1（Q键）
    /// </summary>
    public void HandleSkill1(PlayerController player)
    {
        if (!player.CombatResource.IsSkillReady(0)) return;
        player.CombatResource.UseSkill(0, 5f);
        // Q技能效果待补充
    }

    /// <summary>
    /// 处理技能2（E键）
    /// </summary>
    public void HandleSkill2(PlayerController player)
    {
        if (!player.CombatResource.IsSkillReady(3)) return;
        player.CombatResource.UseSkill(3, 8f);
        // E技能效果待补充
    }

    /// <summary>
    /// 处理特殊动作（R键）：换弹
    /// </summary>
    public void HandleSpecialAction(PlayerController player)
    {
        var resource = player.CombatResource;
        if (resource == null || resource.IsReloading) return;
        resource.Reload();
    }

    /// <summary>
    /// 每帧更新：科技系无额外限制
    /// </summary>
    public void Update(PlayerController player, double delta)
    {
        // 近战 Hitbox 计时关闭
        if (_meleeTimer > 0f)
        {
            _meleeTimer -= (float)delta;
            if (_meleeTimer <= 0f)
            {
                player.Hitbox.SetActive(false);
                if (player.CurrentState == PlayerState.Attacking)
                {
                    player.ChangeState(PlayerState.Idle);
                }
            }
        }
    }
}
