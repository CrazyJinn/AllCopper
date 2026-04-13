using Godot;

/// <summary>
/// 技能数据
/// 定义技能的基础属性：冷却、伤害、范围、持续时间
/// </summary>
[GlobalClass]
public partial class SkillData : Resource
{
    /// <summary>技能唯一ID</summary>
    [Export]
    public string SkillId { get; set; }

    /// <summary>显示名称</summary>
    [Export]
    public string DisplayName { get; set; } = "";

    /// <summary>技能图标</summary>
    [Export]
    public Texture2D Icon { get; set; }

    /// <summary>冷却时间（秒）</summary>
    [Export]
    public float Cooldown { get; set; } = 5f;

    /// <summary>伤害值</summary>
    [Export]
    public float Damage { get; set; } = 20f;

    /// <summary>作用范围</summary>
    [Export]
    public float Range { get; set; } = 100f;

    /// <summary>持续时间（秒）</summary>
    [Export]
    public float Duration { get; set; } = 0.5f;

    /// <summary>是否需要瞄准</summary>
    [Export]
    public bool RequiresAim { get; set; } = true;
}
