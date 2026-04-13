using System.Collections.Generic;
using Godot;

/// <summary>
/// 背包组件（网格系统，类暗黑2）
/// 使用二维布尔数组管理物品占用空间，支持不同尺寸的物品
/// </summary>
[GlobalClass]
public partial class InventoryComponent : Node
{
    // ===== 信号 =====

    [Signal]
    public delegate void ItemAddedEventHandler(string itemId, int count);

    [Signal]
    public delegate void ItemRemovedEventHandler(string itemId, int count);

    [Signal]
    public delegate void InventoryChangedEventHandler();

    // ===== 导出属性 =====

    /// <summary>网格尺寸（列x行）</summary>
    [Export]
    public Vector2I GridSize { get; set; } = new(10, 8);

    /// <summary>额外格数（加成）</summary>
    [Export]
    public int BonusSlots { get; set; } = 0;

    // ===== 公共属性 =====

    /// <summary>实际网格宽度（含加成）</summary>
    public int EffectiveWidth => GridSize.X + BonusSlots;

    // ===== 私有字段 =====

    private bool[,] _grid;
    private readonly Dictionary<string, List<(Vector2I pos, ItemData data)>> _items = new();

    public override void _Ready()
    {
        _grid = new bool[EffectiveWidth, GridSize.Y];
    }

    /// <summary>
    /// 尝试将物品放入背包
    /// </summary>
    /// <param name="item">物品数据</param>
    /// <param name="placedAt">放置位置</param>
    /// <returns>是否成功</returns>
    public bool TryAddItem(ItemData item, out Vector2I placedAt)
    {
        placedAt = Vector2I.Zero;

        if (item == null) return false;

        Vector2I size = item.SpaceOccupied;

        // 查找空闲位置
        for (int y = 0; y <= GridSize.Y - size.Y; y++)
        {
            for (int x = 0; x <= EffectiveWidth - size.X; x++)
            {
                if (CanPlaceAt(x, y, size))
                {
                    PlaceItem(x, y, item);
                    placedAt = new Vector2I(x, y);
                    EmitSignal(SignalName.ItemAdded, item.ItemId, 1);
                    EmitSignal(SignalName.InventoryChanged);
                    return true;
                }
            }
        }

        return false;
    }

    /// <summary>
    /// 尝试移除物品
    /// </summary>
    /// <param name="itemId">物品ID</param>
    /// <param name="count">数量</param>
    /// <returns>是否成功</returns>
    public bool TryRemoveItem(string itemId, int count = 1)
    {
        if (!_items.ContainsKey(itemId) || _items[itemId].Count < count) return false;

        for (int i = 0; i < count; i++)
        {
            var (pos, data) = _items[itemId][^1];
            _items[itemId].RemoveAt(_items[itemId].Count - 1);
            FreeGrid(pos, data.SpaceOccupied);
        }

        if (_items[itemId].Count == 0)
        {
            _items.Remove(itemId);
        }

        EmitSignal(SignalName.ItemRemoved, itemId, count);
        EmitSignal(SignalName.InventoryChanged);
        return true;
    }

    /// <summary>
    /// 尝试移动物品到新位置
    /// </summary>
    /// <param name="itemId">物品ID</param>
    /// <param name="newPos">目标位置</param>
    /// <returns>是否成功</returns>
    public bool TryMoveItem(string itemId, Vector2I newPos)
    {
        if (!_items.ContainsKey(itemId) || _items[itemId].Count == 0) return false;

        var entry = _items[itemId][0];
        Vector2I size = entry.data.SpaceOccupied;

        // 先释放当前位置
        FreeGrid(entry.pos, size);

        // 检查新位置是否可用
        if (CanPlaceAt(newPos.X, newPos.Y, size))
        {
            PlaceItem(newPos.X, newPos.Y, entry.data);
            _items[itemId][0] = (newPos, entry.data);
            EmitSignal(SignalName.InventoryChanged);
            return true;
        }

        // 新位置不可用，恢复原位
        PlaceItem(entry.pos.X, entry.pos.Y, entry.data);
        return false;
    }

    /// <summary>
    /// 检查是否有空间放入指定物品
    /// </summary>
    /// <param name="item">物品数据</param>
    public bool HasSpace(ItemData item)
    {
        if (item == null) return false;
        Vector2I size = item.SpaceOccupied;

        for (int y = 0; y <= GridSize.Y - size.Y; y++)
        {
            for (int x = 0; x <= EffectiveWidth - size.X; x++)
            {
                if (CanPlaceAt(x, y, size)) return true;
            }
        }

        return false;
    }

    /// <summary>
    /// 获取指定物品的数量
    /// </summary>
    public int GetItemCount(string itemId)
    {
        return _items.ContainsKey(itemId) ? _items[itemId].Count : 0;
    }

    /// <summary>
    /// 获取所有物品列表
    /// </summary>
    public List<(string itemId, Vector2I pos, int count)> GetAllItems()
    {
        var result = new List<(string, Vector2I, int)>();
        foreach (var kvp in _items)
        {
            if (kvp.Value.Count > 0)
            {
                result.Add((kvp.Key, kvp.Value[0].pos, kvp.Value.Count));
            }
        }
        return result;
    }

    /// <summary>
    /// 检查指定位置是否可以放置指定大小的物品
    /// </summary>
    private bool CanPlaceAt(int startX, int startY, Vector2I size)
    {
        for (int dy = 0; dy < size.Y; dy++)
        {
            for (int dx = 0; dx < size.X; dx++)
            {
                int x = startX + dx;
                int y = startY + dy;
                if (x >= EffectiveWidth || y >= GridSize.Y || _grid[x, y])
                {
                    return false;
                }
            }
        }
        return true;
    }

    /// <summary>
    /// 放置物品到网格
    /// </summary>
    private void PlaceItem(int startX, int startY, ItemData item)
    {
        Vector2I size = item.SpaceOccupied;
        for (int dy = 0; dy < size.Y; dy++)
        {
            for (int dx = 0; dx < size.X; dx++)
            {
                _grid[startX + dx, startY + dy] = true;
            }
        }

        if (!_items.ContainsKey(item.ItemId))
        {
            _items[item.ItemId] = new List<(Vector2I, ItemData)>();
        }
        _items[item.ItemId].Add((new Vector2I(startX, startY), item));
    }

    /// <summary>
    /// 释放网格区域
    /// </summary>
    private void FreeGrid(Vector2I pos, Vector2I size)
    {
        for (int dy = 0; dy < size.Y; dy++)
        {
            for (int dx = 0; dx < size.X; dx++)
            {
                int x = pos.X + dx;
                int y = pos.Y + dy;
                if (x < EffectiveWidth && y < GridSize.Y)
                {
                    _grid[x, y] = false;
                }
            }
        }
    }
}
