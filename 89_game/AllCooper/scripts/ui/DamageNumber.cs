using Godot;

/// <summary>
/// 浮动伤害数字
/// 显示伤害值并向上飘动淡出，完成后归还到 ObjectPool
/// </summary>
[GlobalClass]
public partial class DamageNumber : Label
{
    /// <summary>飘动持续时间（秒）</summary>
    [Export]
    public float FloatDuration { get; set; } = 1f;

    /// <summary>飘动速度（像素/秒）</summary>
    [Export]
    public float FloatSpeed { get; set; } = 60f;

    /// <summary>暴击缩放倍数</summary>
    [Export]
    public float CriticalScale { get; set; } = 1.5f;

    private Vector2 _startPosition;
    private float _timer;
    private bool _isActive;

    public override void _Ready()
    {
        HorizontalAlignment = HorizontalAlignment.Center;
        VerticalAlignment = VerticalAlignment.Center;
    }

    public override void _Process(double delta)
    {
        if (!_isActive) return;

        _timer += (float)delta;
        float progress = _timer / FloatDuration;

        // 向上飘动
        Position = new Vector2(Position.X, _startPosition.Y - FloatSpeed * _timer);

        // 淡出
        Modulate = new Color(1f, 1f, 1f, 1f - progress);

        if (progress >= 1f)
        {
            _isActive = false;
            SetProcess(false);
            SetVisible(false);
            ObjectPool.Instance?.Return("damage_number", this);
        }
    }

    /// <summary>
    /// 显示伤害数字
    /// </summary>
    /// <param name="amount">伤害数值</param>
    /// <param name="isCritical">是否暴击</param>
    /// <param name="pos">世界坐标位置</param>
    public void ShowDamage(float amount, bool isCritical, Vector2 pos)
    {
        Text = Mathf.CeilToInt(amount).ToString();
        _startPosition = pos;
        Position = pos;
        _timer = 0f;
        _isActive = true;
        Modulate = Colors.White;
        Scale = isCritical ? Vector2.One * CriticalScale : Vector2.One;

        SetVisible(true);
        SetProcess(true);
    }
}
