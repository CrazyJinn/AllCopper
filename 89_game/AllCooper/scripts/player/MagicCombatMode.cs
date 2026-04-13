using Godot;

/// <summary>
/// 魔法系战斗模式（薇）
/// 操作：蓄力攻击（移动中断蓄力）、CD加速（R键）
/// </summary>
public class MagicCombatMode : ICombatMode
{
    /// <summary>
    /// 处理普通攻击（左键）：蓄力释放
    /// </summary>
    public void HandleAttack(PlayerController player)
    {
        if (player.CurrentState == PlayerState.Dead ||
            player.CurrentState == PlayerState.Rolling) return;

        var resource = player.CombatResource;
        if (resource == null) return;

        if (!resource.IsCharging && resource.IsSkillReady(1))
        {
            player.ChangeState(PlayerState.Casting);
            resource.StartCharge();
        }
    }

    /// <summary>
    /// 处理终极技能（右键）
    /// </summary>
    public void HandleUltimate(PlayerController player)
    {
        if (!player.CombatResource.IsSkillReady(2)) return;
        player.CombatResource.UseSkill(2, 20f);
        // 终极魔法效果待补充
    }

    /// <summary>
    /// 处理技能1（Q键）
    /// </summary>
    public void HandleSkill1(PlayerController player)
    {
        if (!player.CombatResource.IsSkillReady(0)) return;
        player.CombatResource.UseSkill(0, 6f);
        // Q技能效果待补充
    }

    /// <summary>
    /// 处理技能2（E键）
    /// </summary>
    public void HandleSkill2(PlayerController player)
    {
        if (!player.CombatResource.IsSkillReady(3)) return;
        player.CombatResource.UseSkill(3, 10f);
        // E技能效果待补充
    }

    /// <summary>
    /// 处理特殊动作（R键）：CD加速
    /// </summary>
    public void HandleSpecialAction(PlayerController player)
    {
        var resource = player.CombatResource;
        if (resource == null) return;

        // 切换CD加速状态
        resource.SetCdAcceleration(true);
    }

    /// <summary>
    /// 每帧更新：蓄力逻辑（移动中断蓄力）
    /// </summary>
    public void Update(PlayerController player, double delta)
    {
        var resource = player.CombatResource;
        if (resource == null) return;

        if (resource.IsCharging)
        {
            // 移动中断蓄力
            if (player.Velocity != Vector2.Zero && player.Velocity.Length() > 10f)
            {
                resource.CancelCharge();
                player.ChangeState(PlayerState.Idle);
                return;
            }

            // 推进蓄力
            resource.AdvanceCharge(delta);

            // 蓄力完成，释放技能
            if (resource.GetChargeProgress() >= 1f)
            {
                // 在面朝方向释放魔法攻击
                player.Hitbox.SetDamage(25f);
                player.Hitbox.SetActive(true);

                resource.UseSkill(1, 3f);
                resource.CancelCharge();
                player.ChangeState(PlayerState.Attacking);

                // 延迟关闭 Hitbox（简化：下一帧关闭）
                player.Hitbox.SetActive(false);
            }
        }
    }
}
