using Godot;

/// <summary>
/// 经济组件
/// 管理游戏货币（纽扣电池）的增加、消费和余额查询
/// </summary>
[GlobalClass]
public partial class EconomyComponent : Node
{
    // ===== 信号 =====

    [Signal]
    public delegate void CurrencyChangedEventHandler(float current);

    // ===== 公共属性 =====

    /// <summary>当前货币</summary>
    public float CurrentCurrency { get; private set; }

    /// <summary>
    /// 增加货币
    /// </summary>
    /// <param name="amount">金额</param>
    public void AddCurrency(float amount)
    {
        if (amount <= 0f) return;
        CurrentCurrency += amount;
        EmitSignal(SignalName.CurrencyChanged, CurrentCurrency);
        EventBus.EmitCurrencyChanged(CurrentCurrency);
    }

    /// <summary>
    /// 尝试消费货币
    /// </summary>
    /// <param name="amount">消费金额</param>
    /// <returns>是否成功（余额足够）</returns>
    public bool TrySpend(float amount)
    {
        if (amount <= 0f || !CanAfford(amount)) return false;
        CurrentCurrency -= amount;
        EmitSignal(SignalName.CurrencyChanged, CurrentCurrency);
        EventBus.EmitCurrencyChanged(CurrentCurrency);
        return true;
    }

    /// <summary>
    /// 检查是否能支付
    /// </summary>
    /// <param name="amount">金额</param>
    public bool CanAfford(float amount)
    {
        return CurrentCurrency >= amount;
    }
}
