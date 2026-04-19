using Godot;

/// <summary>
/// 背包界面UI
/// 网格布局显示物品，支持拖拽移动、详情查看、快捷栏绑定
/// </summary>
[GlobalClass]
public partial class InventoryUI : Control
{
    // ===== 信号 =====

    [Signal]
    public delegate void ItemSelectedEventHandler(string itemId);

    [Signal]
    public delegate void ItemMovedEventHandler(string itemId, Vector2I from, Vector2I to);

    [Signal]
    public delegate void ClosedEventHandler();

    // ===== 子节点引用 =====

    private GridContainer _itemGrid;
    private Panel _detailPanel;
    private Control _hotbarDisplay;
    private Label _currencyLabel;

    public override void _Ready()
    {
        BuildScene();
    }

    /// <summary>
    /// 刷新背包显示
    /// </summary>
    /// <param name="inventory">背包组件</param>
    public void Refresh(InventoryComponent inventory)
    {
        if (_itemGrid == null || inventory == null) return;

        // 清空网格
        foreach (var child in _itemGrid.GetChildren())
        {
            child.QueueFree();
        }

        // 重新填充
        var items = inventory.GetAllItems();
        foreach (var (itemId, pos, count) in items)
        {
            var slot = new Panel();
            var label = new Label { Text = $"{itemId}\n{count}" };
            slot.AddChild(label);
            _itemGrid.AddChild(slot);
        }
    }

    /// <summary>
    /// 显示物品详情
    /// </summary>
    /// <param name="item">物品数据</param>
    public void ShowItemDetail(ItemData item)
    {
        if (_detailPanel == null || item == null) return;

        // 清空详情面板
        foreach (var child in _detailPanel.GetChildren())
        {
            child.QueueFree();
        }

        var nameLabel = new Label { Text = item.DisplayName };
        var descLabel = new Label { Text = item.Description };
        _detailPanel.AddChild(nameLabel);
        _detailPanel.AddChild(descLabel);
    }

    /// <summary>
    /// 代码构建子节点
    /// </summary>
    private void BuildScene()
    {
        SetAnchorsPreset(Control.LayoutPreset.FullRect);

        // 半透明背景
        var overlay = new ColorRect();
        overlay.SetAnchorsPreset(Control.LayoutPreset.FullRect);
        overlay.Color = new Color(0, 0, 0, 0.5f);
        AddChild(overlay);
        overlay.Owner = this;

        // 主容器
        var container = new HBoxContainer();
        container.SetAnchorsAndOffsetsPreset(Control.LayoutPreset.FullRect, Control.LayoutPresetMode.KeepSize, 40);
        AddChild(container);
        container.Owner = this;

        // 物品网格
        _itemGrid = new GridContainer();
        _itemGrid.Name = "ItemGrid";
        _itemGrid.Columns = 10;
        _itemGrid.CustomMinimumSize = new Vector2(500, 400);
        container.AddChild(_itemGrid);
        _itemGrid.Owner = this;

        // 详情面板
        _detailPanel = new Panel();
        _detailPanel.Name = "DetailPanel";
        _detailPanel.CustomMinimumSize = new Vector2(300, 400);
        container.AddChild(_detailPanel);
        _detailPanel.Owner = this;

        // 货币标签
        _currencyLabel = new Label();
        _currencyLabel.Name = "CurrencyLabel";
        _currencyLabel.Text = "0";
        container.AddChild(_currencyLabel);
        _currencyLabel.Owner = this;

        // 关闭按钮
        var closeButton = new Button { Text = "关闭" };
        closeButton.Pressed += () => EmitSignal(SignalName.Closed);
        container.AddChild(closeButton);
        closeButton.Owner = this;
    }
}
