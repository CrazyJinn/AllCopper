using System.Collections.Generic;
using Godot;

/// <summary>
/// 通用对象池（Autoload）
/// 管理可复用节点实例（子弹、伤害数字、掉落物等），避免频繁实例化开销
/// </summary>
[GlobalClass]
public partial class ObjectPool : Node
{
    public static ObjectPool Instance { get; private set; }

    private readonly Dictionary<string, Stack<Node>> _pools = new();
    private readonly Dictionary<string, PackedScene> _scenes = new();
    private readonly Dictionary<string, int> _defaultPreload = new();

    public override void _Ready()
    {
        Instance = this;
    }

    /// <summary>
    /// 注册对象池
    /// </summary>
    /// <param name="key">池标识名</param>
    /// <param name="scene">对象场景</param>
    /// <param name="preload">预加载数量</param>
    public void Register(string key, PackedScene scene, int preload = 5)
    {
        _scenes[key] = scene;
        _defaultPreload[key] = preload;
        _pools[key] = new Stack<Node>();

        for (int i = 0; i < preload; i++)
        {
            var instance = CreateInstance(key);
            instance.SetProcess(false);
            instance.SetPhysicsProcess(false);
            if (instance is CanvasItem ci) ci.Visible = false;
            AddChild(instance);
            _pools[key].Push(instance);
        }
    }

    /// <summary>
    /// 从池中获取对象实例
    /// </summary>
    /// <typeparam name="T">节点类型</typeparam>
    /// <param name="key">池标识名</param>
    /// <returns>可用实例，池空时自动扩展</returns>
    public T Get<T>(string key) where T : Node
    {
        if (!_pools.ContainsKey(key))
        {
            GD.PrintErr($"[ObjectPool] Key '{key}' not registered.");
            return null;
        }

        Node instance;
        if (_pools[key].Count > 0)
        {
            instance = _pools[key].Pop();
        }
        else
        {
            instance = CreateInstance(key);
            AddChild(instance);
        }

        instance.SetProcess(true);
        instance.SetPhysicsProcess(true);
        if (instance is CanvasItem ci) ci.Visible = true;
        return instance as T;
    }

    /// <summary>
    /// 归还对象到池中
    /// </summary>
    /// <param name="key">池标识名</param>
    /// <param name="obj">归还的对象实例</param>
    public void Return(string key, Node obj)
    {
        if (obj == null) return;

        obj.SetProcess(false);
        obj.SetPhysicsProcess(false);
        if (obj is CanvasItem ci) ci.Visible = false;

        if (obj.GetParent() == null)
        {
            AddChild(obj);
        }

        if (_pools.ContainsKey(key))
        {
            _pools[key].Push(obj);
        }
    }

    /// <summary>
    /// 预加载所有已注册池
    /// </summary>
    public void PreloadAll()
    {
        foreach (var kvp in _scenes)
        {
            if (!_pools.ContainsKey(kvp.Key))
            {
                _pools[kvp.Key] = new Stack<Node>();
            }

            int target = _defaultPreload.ContainsKey(kvp.Key) ? _defaultPreload[kvp.Key] : 5;
            while (_pools[kvp.Key].Count < target)
            {
                var instance = CreateInstance(kvp.Key);
                instance.SetProcess(false);
                instance.SetPhysicsProcess(false);
                if (instance is CanvasItem ci) ci.Visible = false;
                AddChild(instance);
                _pools[kvp.Key].Push(instance);
            }
        }
    }

    /// <summary>
    /// 获取池中可用实例数量
    /// </summary>
    public int GetAvailableCount(string key)
    {
        return _pools.ContainsKey(key) ? _pools[key].Count : 0;
    }

    private Node CreateInstance(string key)
    {
        if (!_scenes.ContainsKey(key))
        {
            GD.PrintErr($"[ObjectPool] No scene registered for key '{key}'.");
            return null;
        }
        return _scenes[key].Instantiate<Node>();
    }
}
