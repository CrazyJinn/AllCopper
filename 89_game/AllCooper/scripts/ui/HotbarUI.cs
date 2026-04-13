using Godot;

/// <summary>
/// 快捷栏UI
/// 显示4个快捷栏槽位和物品图标
/// </summary>
[GlobalClass]
public partial class HotbarUI : Control
{
    private readonly Panel[] _slots = new Panel[HotbarComponent.SlotCount];

    public override void _Ready()
    {
        BuildScene();
    }

    /// <summary>
    /// 刷新快捷栏槽位
    /// </summary>
    /// <param name="index">槽位索引</param>
    /// <param name="itemId">物品ID</param>
    /// <param name="count">数量</param>
    public void RefreshSlot(int index, string itemId, int count)
    {
        if (index < 0 || index >= _slots.Length) return;
        if (_slots[index] == null) return;

        // 清空
        foreach (var child in _slots[index].GetChildren())
        {
            child.QueueFree();
        }

        if (!string.IsNullOrEmpty(itemId))
        {
            var label = new Label { Text = $"{itemId}\n{count}" };
            _slots[index].AddChild(label);
        }
    }

    /// <summary>
    /// 代码构建子节点
    /// </summary>
    private void BuildScene()
    {
        var container = new HBoxContainer();
        container.Name = "HotbarSlots";
        AddChild(container);
        container.Owner = this;

        for (int i = 0; i < HotbarComponent.SlotCount; i++)
        {
            _slots[i] = new Panel();
            _slots[i].Name = $"HotbarSlot_{i}";
            _slots[i].CustomMinimumSize = new Vector2(50, 50);
            container.AddChild(_slots[i]);
            _slots[i].Owner = this;
        }
    }
}
