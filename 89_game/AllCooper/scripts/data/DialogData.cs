using Godot;

/// <summary>
/// 对话数据（Resource）
/// 定义一段完整对话的所有条目
/// </summary>
[GlobalClass]
public partial class DialogData : Resource
{
    /// <summary>对话唯一ID</summary>
    [Export]
    public string DialogId { get; set; }

    /// <summary>对话背景图</summary>
    [Export]
    public Texture2D Background { get; set; }

    /// <summary>对话条目列表</summary>
    [Export]
    public DialogEntry[] Entries { get; set; }
}

/// <summary>
/// 单条对话条目
/// </summary>
[GlobalClass]
public partial class DialogEntry : Resource
{
    /// <summary>说话者ID</summary>
    [Export]
    public string SpeakerId { get; set; }

    /// <summary>对话文本</summary>
    [Export]
    public string Text { get; set; } = "";

    /// <summary>立绘表情名称</summary>
    [Export]
    public string PortraitExpression { get; set; } = "default";

    /// <summary>对话布局</summary>
    [Export]
    public DialogLayout Layout { get; set; } = DialogLayout.SideBySide;

    /// <summary>立绘位置</summary>
    [Export]
    public DialogPortraitSide PortraitSide { get; set; } = DialogPortraitSide.Left;

    /// <summary>过场动画ID（非空则触发过场）</summary>
    [Export]
    public string CutsceneId { get; set; } = "";

    /// <summary>过场延迟（秒）</summary>
    [Export]
    public float CutsceneDelay { get; set; } = 0f;
}
