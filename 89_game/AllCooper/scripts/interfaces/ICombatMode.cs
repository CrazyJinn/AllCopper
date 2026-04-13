/// <summary>
/// 战斗模式接口
/// 定义阵营差异化的战斗操作：科技系（近战+远程+换弹）和魔法系（蓄力+CD加速）
/// </summary>
public interface ICombatMode
{
    /// <summary>
    /// 处理普通攻击（左键）
    /// </summary>
    void HandleAttack(PlayerController player);

    /// <summary>
    /// 处理终极技能（右键）
    /// </summary>
    void HandleUltimate(PlayerController player);

    /// <summary>
    /// 处理技能1（Q键）
    /// </summary>
    void HandleSkill1(PlayerController player);

    /// <summary>
    /// 处理技能2（E键）
    /// </summary>
    void HandleSkill2(PlayerController player);

    /// <summary>
    /// 处理特殊动作（R键）：科技系换弹 / 魔法系CD加速
    /// </summary>
    void HandleSpecialAction(PlayerController player);

    /// <summary>
    /// 每帧更新战斗逻辑
    /// </summary>
    void Update(PlayerController player, double delta);
}
