using Godot;

/// <summary>
/// 商店界面UI
/// 显示商品列表，支持购买操作
/// </summary>
[GlobalClass]
public partial class ShopUI : Control
{
    // ===== 私有字段 =====

    private ItemList _itemList;
    private Panel _detailPanel;
    private Button _buyButton;
    private Label _currencyLabel;
    private ShopController _controller;

    public override void _Ready()
    {
        BuildScene();
        Visible = false;
    }

    /// <summary>
    /// 打开商店
    /// </summary>
    /// <param name="items">商品列表</param>
    /// <param name="eco">买方经济组件</param>
    /// <param name="inv">买方背包组件</param>
    public void OpenShop(ItemData[] items, EconomyComponent eco, InventoryComponent inv)
    {
        _controller = new ShopController();
        _controller.Open(items, eco, inv);
        _controller.PurchaseCompleted += OnPurchaseCompleted;
        _controller.PurchaseFailed += OnPurchaseFailed;

        RefreshItemList(items);
        Visible = true;
    }

    private void RefreshItemList(ItemData[] items)
    {
        _itemList?.Clear();
        if (items == null) return;

        foreach (var item in items)
        {
            _itemList?.AddItem($"{item.DisplayName} - {item.BuyPrice}");
        }
    }

    private void OnItemSelected(long index)
    {
        // 显示选中物品详情
    }

    private void OnBuyPressed()
    {
        int selected = _itemList?.GetSelectedItems().Length > 0
            ? _itemList.GetSelectedItems()[0]
            : -1;
        // 通过 controller 购买
    }

    private void OnPurchaseCompleted(string itemId)
    {
        GD.Print($"[ShopUI] Purchased: {itemId}");
    }

    private void OnPurchaseFailed(string reason)
    {
        GD.Print($"[ShopUI] Purchase failed: {reason}");
    }

    /// <summary>
    /// 代码构建子节点
    /// </summary>
    private void BuildScene()
    {
        SetAnchorsPreset(Control.LayoutPreset.FullRect);

        var overlay = new ColorRect();
        overlay.SetAnchorsPreset(Control.LayoutPreset.FullRect);
        overlay.Color = new Color(0, 0, 0, 0.5f);
        AddChild(overlay);
        overlay.Owner = this;

        var container = new VBoxContainer();
        container.SetAnchorsAndOffsetsPreset(Control.LayoutPreset.FullRect, Control.LayoutPresetMode.KeepSize, 40);
        AddChild(container);
        container.Owner = this;

        _itemList = new ItemList { Name = "ItemList", CustomMinimumSize = new Vector2(400, 300) };
        _itemList.ItemSelected += OnItemSelected;
        container.AddChild(_itemList);
        _itemList.Owner = this;

        _detailPanel = new Panel { Name = "DetailPanel", CustomMinimumSize = new Vector2(400, 150) };
        container.AddChild(_detailPanel);
        _detailPanel.Owner = this;

        var bottomBar = new HBoxContainer();
        _currencyLabel = new Label { Name = "CurrencyLabel", Text = "0" };
        _buyButton = new Button { Name = "BuyButton", Text = "购买" };
        _buyButton.Pressed += OnBuyPressed;
        var closeButton = new Button { Text = "关闭" };
        closeButton.Pressed += () => { Visible = false; };

        bottomBar.AddChild(_currencyLabel);
        bottomBar.AddChild(_buyButton);
        bottomBar.AddChild(closeButton);
        container.AddChild(bottomBar);
        bottomBar.Owner = this;
    }
}
