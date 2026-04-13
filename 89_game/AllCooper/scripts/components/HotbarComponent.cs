using Godot;

/// <summary>
/// 快捷栏组件
/// 管理4个快捷栏槽位的物品绑定和使用
/// </summary>
[GlobalClass]
public partial class HotbarComponent : Node
{
    // ===== 信号 =====

    [Signal]
    public delegate void SlotChangedEventHandler(int index, string itemId, int count);

    [Signal]
    public delegate void ItemUsedEventHandler(int index);

    // ===== 常量 =====

    /// <summary>快捷栏槽位数</summary>
    public const int SlotCount = 4;

    // ===== 私有字段 =====

    private readonly (string itemId, int count)[] _slots = new (string, int)[SlotCount];

    public override void _Ready()
    {
        for (int i = 0; i < SlotCount; i++)
        {
            _slots[i] = ("", 0);
        }
    }

    /// <summary>
    /// 设置快捷栏槽位
    /// </summary>
    /// <param name="index">槽位索引（0~3）</param>
    /// <param name="itemId">物品ID</param>
    /// <param name="count">数量</param>
    /// <returns>是否成功</returns>
    public bool SetSlot(int index, string itemId, int count)
    {
        if (index < 0 || index >= SlotCount) return false;
        _slots[index] = (itemId, count);
        EmitSignal(SignalName.SlotChanged, index, itemId, count);
        return true;
    }

    /// <summary>
    /// 清空槽位
    /// </summary>
    /// <param name="index">槽位索引</param>
    public void ClearSlot(int index)
    {
        if (index < 0 || index >= SlotCount) return;
        _slots[index] = ("", 0);
        EmitSignal(SignalName.SlotChanged, index, "", 0);
    }

    /// <summary>
    /// 使用槽位物品
    /// </summary>
    /// <param name="index">槽位索引</param>
    public void UseSlot(int index)
    {
        if (index < 0 || index >= SlotCount) return;
        if (string.IsNullOrEmpty(_slots[index].itemId)) return;

        // 减少数量
        _slots[index].count--;
        if (_slots[index].count <= 0)
        {
            _slots[index] = ("", 0);
        }

        EmitSignal(SignalName.ItemUsed, index);
        EmitSignal(SignalName.SlotChanged, index, _slots[index].itemId, _slots[index].count);
    }

    /// <summary>
    /// 获取槽位信息
    /// </summary>
    /// <param name="index">槽位索引</param>
    /// <returns>物品ID和数量元组</returns>
    public (string itemId, int count) GetSlot(int index)
    {
        if (index < 0 || index >= SlotCount) return ("", 0);
        return _slots[index];
    }
}
