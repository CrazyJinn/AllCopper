using Godot;
using System.Collections.Generic;

/// <summary>
/// 背包管理器 - 暗黑2式网格背包
/// </summary>
public partial class InventoryManager : Node
{
    [Signal] public delegate void ItemAddedEventHandler(string itemId, Vector2I position);
    [Signal] public delegate void ItemRemovedEventHandler(string itemId, Vector2I position);
    [Signal] public delegate void InventoryFullEventHandler();

    public static InventoryManager Instance { get; private set; }

    private Dictionary<Vector2I, ItemData> _grid = new();
    private int _width;
    private int _height;

    public override void _EnterTree()
    {
        Instance = this;
    }

    /// <summary>初始化背包大小</summary>
    public void Init(int width, int height)
    {
        _width = width;
        _height = height;
        _grid.Clear();

        for (int x = 0; x < width; x++)
        {
            for (int y = 0; y < height; y++)
            {
                _grid[new Vector2I(x, y)] = null;
            }
        }
    }

    /// <summary>检查能否放置物品</summary>
    public bool CanPlaceItem(ItemData item, Vector2I position)
    {
        for (int x = 0; x < item.Width; x++)
        {
            for (int y = 0; y < item.Height; y++)
            {
                var checkPos = position + new Vector2I(x, y);
                if (!_grid.ContainsKey(checkPos)) return false;
                if (_grid[checkPos] != null) return false;
            }
        }
        return true;
    }

    /// <summary>放置物品</summary>
    public bool PlaceItem(ItemData item, Vector2I position)
    {
        if (!CanPlaceItem(item, position)) return false;

        for (int x = 0; x < item.Width; x++)
        {
            for (int y = 0; y < item.Height; y++)
            {
                _grid[position + new Vector2I(x, y)] = item;
            }
        }

        EmitSignal(SignalName.ItemAdded, item.ItemId, position);
        return true;
    }

    /// <summary>移除物品</summary>
    public bool RemoveItem(Vector2I position)
    {
        var item = _grid.GetValueOrDefault(position);
        if (item == null) return false;

        // 清除物品占用的所有格子
        for (int x = 0; x < _width; x++)
        {
            for (int y = 0; y < _height; y++)
            {
                if (_grid[new Vector2I(x, y)] == item)
                {
                    _grid[new Vector2I(x, y)] = null;
                }
            }
        }

        EmitSignal(SignalName.ItemRemoved, item.ItemId, position);
        return true;
    }

    /// <summary>自动寻找空位放置</summary>
    public bool AutoPlace(ItemData item)
    {
        for (int y = 0; y < _height; y++)
        {
            for (int x = 0; x < _width; x++)
            {
                if (PlaceItem(item, new Vector2I(x, y))) return true;
            }
        }

        EmitSignal(SignalName.InventoryFull);
        return false;
    }

    /// <summary>获取指定位置的物品</summary>
    public ItemData GetItemAt(Vector2I position)
    {
        return _grid.GetValueOrDefault(position);
    }

    /// <summary>获取已用格子数</summary>
    public int GetUsedCapacity()
    {
        int count = 0;
        foreach (var kvp in _grid)
        {
            if (kvp.Value != null) count++;
        }
        return count;
    }
}
