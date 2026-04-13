using System.Collections.Generic;
using Godot;

/// <summary>
/// 敌人生成器
/// 管理一波敌人的生成和存活计数，全部击败后发射信号
/// </summary>
[GlobalClass]
public partial class EnemySpawner : Node
{
    // ===== 信号 =====

    [Signal]
    public delegate void AllEnemiesDefeatedEventHandler();

    // ===== 公共属性 =====

    /// <summary>剩余敌人数量</summary>
    public int RemainingCount => _activeEnemies.Count;

    // ===== 私有字段 =====

    private readonly List<EnemyController> _activeEnemies = new();

    public override void _Ready()
    {
        EventBus.OnEnemyDefeated += OnEnemyDefeated;
    }

    public override void _ExitTree()
    {
        EventBus.OnEnemyDefeated -= OnEnemyDefeated;
    }

    /// <summary>
    /// 生成一波敌人
    /// </summary>
    /// <param name="spawns">生成点配置</param>
    public void SpawnWave(SpawnPoint[] spawns)
    {
        if (spawns == null) return;

        foreach (var spawn in spawns)
        {
            if (spawn.Enemy == null) continue;
            // 查找场景中已生成的敌人
            var enemy = GetParent()?.GetNodeOrNull<EnemyController>($"../{spawn.Enemy.EnemyId}");
            if (enemy != null)
            {
                _activeEnemies.Add(enemy);
            }
        }
    }

    /// <summary>
    /// 注册已有敌人到追踪列表
    /// </summary>
    /// <param name="enemy">敌人实例</param>
    public void RegisterEnemy(EnemyController enemy)
    {
        if (enemy != null && !_activeEnemies.Contains(enemy))
        {
            _activeEnemies.Add(enemy);
        }
    }

    /// <summary>
    /// 清除所有存活敌人
    /// </summary>
    public void ClearAll()
    {
        foreach (var enemy in _activeEnemies)
        {
            if (IsInstanceValid(enemy))
            {
                enemy.QueueFree();
            }
        }
        _activeEnemies.Clear();
    }

    private void OnEnemyDefeated(string enemyId)
    {
        _activeEnemies.RemoveAll(e => !IsInstanceValid(e) || (e.Data?.EnemyId == enemyId));

        if (_activeEnemies.Count == 0)
        {
            EmitSignal(SignalName.AllEnemiesDefeated);
        }
    }
}
