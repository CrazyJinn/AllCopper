using Godot;

/// <summary>
/// 经济管理器 - 货币（纽扣电池）+ 商店交易
/// </summary>
public partial class EconomyManager : Node
{
    [Signal] public delegate void CurrencyChangedEventHandler(float newAmount);
    [Signal] public delegate void TransactionCompletedEventHandler(bool success, string itemId);

    public static EconomyManager Instance { get; private set; }

    public float CurrentCurrency { get; private set; }

    public override void _EnterTree()
    {
        Instance = this;
    }

    /// <summary>添加货币</summary>
    public void AddCurrency(float amount)
    {
        CurrentCurrency += amount;
        EmitSignal(SignalName.CurrencyChanged, CurrentCurrency);
    }

    /// <summary>购买物品</summary>
    public bool BuyItem(ShopItem shopItem)
    {
        if (CurrentCurrency < shopItem.Price)
        {
            EmitSignal(SignalName.TransactionCompleted, false, shopItem.ItemId);
            return false;
        }

        // 检查背包空间
        var inventory = InventoryManager.Instance;
        if (inventory != null && !inventory.AutoPlace(shopItem.Item))
        {
            EmitSignal(SignalName.TransactionCompleted, false, shopItem.ItemId);
            return false;
        }

        CurrentCurrency -= shopItem.Price;
        EmitSignal(SignalName.CurrencyChanged, CurrentCurrency);
        EmitSignal(SignalName.TransactionCompleted, true, shopItem.ItemId);
        return true;
    }

    /// <summary>出售物品</summary>
    public bool SellItem(ItemData item)
    {
        float sellPrice = item.Rarity * 10f; // 简化的定价
        CurrentCurrency += sellPrice;
        EmitSignal(SignalName.CurrencyChanged, CurrentCurrency);
        return true;
    }
}

/// <summary>
/// 商店物品条目
/// </summary>
[GlobalClass]
public partial class ShopItem : Resource
{
    [Export] public string ItemId = "";
    [Export] public ItemData Item;
    [Export] public float Price = 10f;
    [Export] public int Stock = -1; // -1=无限
}
