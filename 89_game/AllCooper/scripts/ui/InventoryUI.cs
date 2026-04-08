using Godot;

/// <summary>
/// 背包界面 - 网格拖拽式背包
/// </summary>
public partial class InventoryUI : CanvasLayer
{
    private Control _root;
    private GridContainer _grid;
    private TextureRect[,] _slots;
    private int _gridWidth = 10;
    private int _gridHeight = 6;

    public override void _Ready()
    {
        Layer = 30;

        _root = new Control { Name = "InventoryRoot" };
        _root.SetAnchorsPreset(Control.LayoutPreset.FullRect);
        AddChild(_root);

        // 背景
        var bg = new ColorRect { Color = new Color(0, 0, 0, 0.7f) };
        bg.SetAnchorsPreset(Control.LayoutPreset.FullRect);
        _root.AddChild(bg);

        // 居中面板
        var panel = new Panel { Name = "InventoryPanel" };
        panel.SetAnchorsPreset(Control.LayoutPreset.Center);
        panel.CustomMinimumSize = new Vector2(500, 400);
        _root.AddChild(panel);

        // 标题
        var title = new Label { Text = "背包", Position = new Vector2(20, 10) };
        panel.AddChild(title);

        // 网格容器
        _grid = new GridContainer
        {
            Name = "ItemGrid",
            Columns = _gridWidth,
            Position = new Vector2(20, 50)
        };
        panel.AddChild(_grid);

        _slots = new TextureRect[_gridWidth, _gridHeight];
        for (int y = 0; y < _gridHeight; y++)
        {
            for (int x = 0; x < _gridWidth; x++)
            {
                var slot = new TextureRect
                {
                    CustomMinimumSize = new Vector2(48, 48),
                    StretchMode = TextureRect.StretchModeEnum.KeepAspectCentered,
                    Name = $"Slot_{x}_{y}"
                };
                var style = new StyleBoxFlat
                {
                    BgColor = new Color(0.2f, 0.2f, 0.2f, 0.8f),
                    BorderColor = new Color(0.5f, 0.5f, 0.5f),
                    BorderWidthBottom = 1,
                    BorderWidthTop = 1,
                    BorderWidthLeft = 1,
                    BorderWidthRight = 1
                };
                slot.AddThemeStyleboxOverride("panel", style);
                _grid.AddChild(slot);
                _slots[x, y] = slot;
            }
        }

        _root.Visible = false;

        // 连接信号
        if (InventoryManager.Instance != null)
        {
            InventoryManager.Instance.ItemAdded += OnItemAdded;
            InventoryManager.Instance.ItemRemoved += OnItemRemoved;
        }
    }

    public override void _Input(InputEvent @event)
    {
        if (@event.IsActionPressed("toggle_inventory"))
        {
            _root.Visible = !_root.Visible;
            if (_root.Visible)
            {
                GameManager.Instance?.ChangeState(GameEnums.GameState.Paused);
            }
            else
            {
                GameManager.Instance?.RestorePreviousState();
            }
        }
    }

    private void OnItemAdded(string itemId, Vector2I position)
    {
        RefreshGrid();
    }

    private void OnItemRemoved(string itemId, Vector2I position)
    {
        RefreshGrid();
    }

    private void RefreshGrid()
    {
        // 清空所有格子
        for (int y = 0; y < _gridHeight; y++)
        {
            for (int x = 0; x < _gridWidth; x++)
            {
                _slots[x, y].Texture = null;
            }
        }

        // 从背包管理器填充
        var inventory = InventoryManager.Instance;
        if (inventory == null) return;

        for (int y = 0; y < _gridHeight; y++)
        {
            for (int x = 0; x < _gridWidth; x++)
            {
                var item = inventory.GetItemAt(new Vector2I(x, y));
                if (item != null && item.Icon != null)
                {
                    _slots[x, y].Texture = item.Icon;
                }
            }
        }
    }
}
