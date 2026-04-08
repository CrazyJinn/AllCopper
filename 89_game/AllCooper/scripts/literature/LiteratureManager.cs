using Godot;
using System.Collections.Generic;

/// <summary>
/// 文献管理器 - 文献碎片收集系统
/// </summary>
public partial class LiteratureManager : Node
{
    [Signal] public delegate void LiteratureCollectedEventHandler(string literatureId);
    [Signal] public delegate void LiteratureSetCompletedEventHandler(string setId);

    public static LiteratureManager Instance { get; private set; }

    private readonly HashSet<string> _collectedIds = new();
    private readonly Dictionary<string, LiteratureData> _allLiterature = new();

    public override void _EnterTree()
    {
        Instance = this;
    }

    /// <summary>收集文献</summary>
    public bool Collect(string literatureId)
    {
        if (_collectedIds.Contains(literatureId)) return false;

        _collectedIds.Add(literatureId);
        EmitSignal(SignalName.LiteratureCollected, literatureId);
        return true;
    }

    /// <summary>检查是否已收集</summary>
    public bool IsCollected(string literatureId) => _collectedIds.Contains(literatureId);

    /// <summary>获取所有已收集文献</summary>
    public LiteratureData[] GetCollected()
    {
        var result = new List<LiteratureData>();
        foreach (var id in _collectedIds)
        {
            if (_allLiterature.TryGetValue(id, out var data))
                result.Add(data);
        }
        return result.ToArray();
    }

    /// <summary>获取按时期分组的文献</summary>
    public Dictionary<string, List<LiteratureData>> GetByPeriod()
    {
        var groups = new Dictionary<string, List<LiteratureData>>();
        foreach (var id in _collectedIds)
        {
            if (!_allLiterature.TryGetValue(id, out var data)) continue;
            if (!groups.ContainsKey(data.Period))
                groups[data.Period] = new List<LiteratureData>();
            groups[data.Period].Add(data);
        }
        return groups;
    }

    /// <summary>注册文献数据</summary>
    public void RegisterLiterature(LiteratureData data)
    {
        _allLiterature[data.Id] = data;
    }

    /// <summary>获取收集进度</summary>
    public float GetProgress()
    {
        if (_allLiterature.Count == 0) return 0f;
        return (float)_collectedIds.Count / _allLiterature.Count;
    }
}
