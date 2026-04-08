using Godot;
using System.Collections.Generic;

/// <summary>
/// 大地图管理器 - 区域导航与解锁
/// </summary>
public partial class WorldMapManager : Node
{
    [Signal] public delegate void RegionSelectedEventHandler(string regionId);
    [Signal] public delegate void MapOpenedEventHandler();
    [Signal] public delegate void MapClosedEventHandler();

    public static WorldMapManager Instance { get; private set; }

    public string CurrentRegion { get; private set; } = "";
    private readonly Dictionary<string, RegionData> _regions = new();

    public override void _EnterTree()
    {
        Instance = this;
    }

    public override void _Ready() { }

    public override void _Input(InputEvent @event)
    {
        if (@event.IsActionPressed("toggle_map"))
        {
            if (GameManager.Instance.CurrentState == GameEnums.GameState.Dialog ||
                GameManager.Instance.CurrentState == GameEnums.GameState.Cutscene) return;

            if (GameManager.Instance.CurrentState == GameEnums.GameState.Paused) return;

            EmitSignal(SignalName.MapOpened);
        }
    }

    /// <summary>注册区域</summary>
    public void RegisterRegion(RegionData region)
    {
        _regions[region.RegionId] = region;
    }

    /// <summary>选择区域</summary>
    public void SelectRegion(string regionId)
    {
        if (!_regions.TryGetValue(regionId, out var region)) return;
        if (!region.IsUnlocked) return;

        CurrentRegion = regionId;
        EmitSignal(SignalName.RegionSelected, regionId);
        SceneManager.Instance?.ChangeScene(region.ScenePath);
        GameManager.Instance?.ChangeState(GameEnums.GameState.Exploring);
    }

    /// <summary>解锁区域</summary>
    public void UnlockRegion(string regionId)
    {
        if (_regions.TryGetValue(regionId, out var region))
        {
            region.IsUnlocked = true;
        }
    }

    /// <summary>获取所有已解锁区域</summary>
    public string[] GetUnlockedRegions()
    {
        var result = new List<string>();
        foreach (var kvp in _regions)
        {
            if (kvp.Value.IsUnlocked) result.Add(kvp.Key);
        }
        return result.ToArray();
    }

    /// <summary>获取区域数据</summary>
    public RegionData GetRegionData(string regionId)
    {
        return _regions.GetValueOrDefault(regionId);
    }
}
