using Godot;

/// <summary>
/// 大地图UI
/// 显示可探索区域，支持区域选择和锁定状态
/// </summary>
[GlobalClass]
public partial class WorldMapUI : Control
{
    // ===== 信号 =====

    [Signal]
    public delegate void RegionSelectedEventHandler(string regionId);

    // ===== 导出属性 =====

    /// <summary>区域配置列表</summary>
    [Export]
    public RegionData[] Regions { get; set; }

    public override void _Ready()
    {
        BuildScene();
    }

    /// <summary>
    /// 刷新区域解锁状态
    /// </summary>
    public void RefreshUnlocked()
    {
        if (Regions == null) return;

        var container = GetNodeOrNull<VBoxContainer>("RegionContainer");
        if (container == null) return;

        foreach (var child in container.GetChildren())
        {
            child.QueueFree();
        }

        foreach (var region in Regions)
        {
            var button = new Button
            {
                Text = region.IsUnlocked ? region.DisplayName : "???",
                Disabled = !region.IsUnlocked
            };
            string regionId = region.RegionId;
            button.Pressed += () => EmitSignal(SignalName.RegionSelected, regionId);
            container.AddChild(button);
        }
    }

    /// <summary>
    /// 代码构建子节点
    /// </summary>
    private void BuildScene()
    {
        SetAnchorsPreset(Control.LayoutPreset.FullRect);

        var overlay = new ColorRect();
        overlay.SetAnchorsPreset(Control.LayoutPreset.FullRect);
        overlay.Color = new Color(0.1f, 0.1f, 0.15f, 0.95f);
        AddChild(overlay);
        overlay.Owner = this;

        var container = new VBoxContainer();
        container.Name = "RegionContainer";
        container.AnchorLeft = 0.3f;
        container.AnchorRight = 0.7f;
        container.AnchorTop = 0.1f;
        container.AnchorBottom = 0.9f;
        AddChild(container);
        container.Owner = this;
    }
}
