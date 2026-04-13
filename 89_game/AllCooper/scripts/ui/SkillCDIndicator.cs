using Godot;

/// <summary>
/// 技能CD指示器
/// 显示技能图标和冷却遮罩
/// </summary>
[GlobalClass]
public partial class SkillCDIndicator : Control
{
    private TextureRect _icon;
    private ColorRect _cooldownOverlay;
    private Label _cooldownLabel;
    private SkillData _skill;

    public override void _Ready()
    {
        BuildScene();
    }

    /// <summary>
    /// 设置技能数据
    /// </summary>
    /// <param name="skill">技能配置</param>
    public void SetSkill(SkillData skill)
    {
        _skill = skill;
        if (_icon != null && skill?.Icon != null)
        {
            _icon.Texture = skill.Icon;
        }
    }

    /// <summary>
    /// 更新冷却显示
    /// </summary>
    /// <param name="remaining">剩余CD（秒）</param>
    /// <param name="total">总CD（秒）</param>
    public void UpdateCooldown(float remaining, float total)
    {
        if (_cooldownOverlay == null) return;

        float ratio = total > 0f ? remaining / total : 0f;
        _cooldownOverlay.Visible = remaining > 0f;

        // 调整遮罩高度模拟CD
        _cooldownOverlay.AnchorTop = 1f - ratio;

        if (_cooldownLabel != null)
        {
            _cooldownLabel.Text = remaining > 0f ? Mathf.CeilToInt(remaining).ToString() : "";
        }
    }

    /// <summary>
    /// 代码构建子节点
    /// </summary>
    private void BuildScene()
    {
        CustomMinimumSize = new Vector2(50, 50);

        _icon = new TextureRect();
        _icon.Name = "Icon";
        _icon.SetAnchorsPreset(Control.LayoutPreset.FullRect);
        _icon.StretchMode = TextureRect.StretchModeEnum.KeepAspectCentered;
        AddChild(_icon);
        _icon.Owner = this;

        _cooldownOverlay = new ColorRect();
        _cooldownOverlay.Name = "CooldownOverlay";
        _cooldownOverlay.SetAnchorsPreset(Control.LayoutPreset.FullRect);
        _cooldownOverlay.Color = new Color(0, 0, 0, 0.7f);
        _cooldownOverlay.Visible = false;
        AddChild(_cooldownOverlay);
        _cooldownOverlay.Owner = this;

        _cooldownLabel = new Label();
        _cooldownLabel.Name = "CooldownLabel";
        _cooldownLabel.SetAnchorsPreset(Control.LayoutPreset.FullRect);
        _cooldownLabel.HorizontalAlignment = HorizontalAlignment.Center;
        _cooldownLabel.VerticalAlignment = VerticalAlignment.Center;
        AddChild(_cooldownLabel);
        _cooldownLabel.Owner = this;
    }
}
