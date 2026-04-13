using Godot;

/// <summary>
/// 商店控制器
/// 管理商店购买流程：检查余额 → 扣费 → 放入背包
/// </summary>
[GlobalClass]
public partial class ShopController : Node
{
    // ===== 信号 =====

    [Signal]
    public delegate void PurchaseCompletedEventHandler(string itemId);

    [Signal]
    public delegate void PurchaseFailedEventHandler(string reason);

    // ===== 私有字段 =====

    private EconomyComponent _buyerEconomy;
    private InventoryComponent _buyerInventory;
    private ItemData[] _shopItems;

    /// <summary>
    /// 打开商店
    /// </summary>
    /// <param name="shopItems">商品列表</param>
    /// <param name="economy">买方经济组件</param>
    /// <param name="inventory">买方背包组件</param>
    public void Open(ItemData[] shopItems, EconomyComponent economy, InventoryComponent inventory)
    {
        _shopItems = shopItems;
        _buyerEconomy = economy;
        _buyerInventory = inventory;
    }

    /// <summary>
    /// 尝试购买商品
    /// </summary>
    /// <param name="item">目标商品</param>
    /// <returns>是否购买成功</returns>
    public bool TryPurchase(ItemData item)
    {
        if (_buyerEconomy == null || _buyerInventory == null) return false;

        // 检查余额
        if (!_buyerEconomy.CanAfford(item.BuyPrice))
        {
            EmitSignal(SignalName.PurchaseFailed, "余额不足");
            return false;
        }

        // 检查背包空间
        if (!_buyerInventory.HasSpace(item))
        {
            EmitSignal(SignalName.PurchaseFailed, "背包已满");
            return false;
        }

        // 扣费
        _buyerEconomy.TrySpend(item.BuyPrice);

        // 放入背包
        _buyerInventory.TryAddItem(item, out _);

        EmitSignal(SignalName.PurchaseCompleted, item.ItemId);
        return true;
    }

    /// <summary>
    /// 关闭商店
    /// </summary>
    public void Close()
    {
        _shopItems = null;
        _buyerEconomy = null;
        _buyerInventory = null;
    }
}
