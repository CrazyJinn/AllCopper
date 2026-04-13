using System;

/// <summary>
/// 全局事件总线（Autoload）
/// 使用 C# static event 委托实现跨场景解耦通信
/// 不使用 Godot Signal，避免装箱开销和类型丢失
/// </summary>
[GlobalClass]
public partial class EventBus : Node
{
    public static EventBus Instance { get; private set; }

    public override void _Ready()
    {
        Instance = this;
    }

    // ===== 战斗事件 =====

    /// <summary>全局伤害事件：伤害值 + 伤害类型</summary>
    public static event Action<float, DamageType> OnGlobalDamage;

    /// <summary>敌人被击败事件：敌人ID</summary>
    public static event Action<string> OnEnemyDefeated;

    /// <summary>玩家死亡事件</summary>
    public static event Action OnPlayerDied;

    /// <summary>房间清空事件：房间索引</summary>
    public static event Action<int> OnRoomCleared;

    /// <summary>战斗完成事件</summary>
    public static event Action OnBattleComplete;

    // ===== 物品/经济事件 =====

    /// <summary>物品拾取事件：物品ID + 数量</summary>
    public static event Action<string, int> OnItemCollected;

    /// <summary>文献收集事件：文献ID</summary>
    public static event Action<string> OnDocumentCollected;

    /// <summary>货币变化事件：当前金额</summary>
    public static event Action<float> OnCurrencyChanged;

    // ===== 流程事件 =====

    /// <summary>请求对话事件：对话ID</summary>
    public static event Action<string> OnDialogRequested;

    /// <summary>请求过场事件：过场ID</summary>
    public static event Action<string> OnCutsceneRequested;

    /// <summary>请求存档事件</summary>
    public static event Action OnSaveRequested;

    /// <summary>场景切换事件：目标场景路径</summary>
    public static event Action<string> OnSceneTransition;

    // ===== 触发方法 =====

    public static void EmitGlobalDamage(float amount, DamageType type) =>
        OnGlobalDamage?.Invoke(amount, type);

    public static void EmitEnemyDefeated(string enemyId) =>
        OnEnemyDefeated?.Invoke(enemyId);

    public static void EmitPlayerDied() =>
        OnPlayerDied?.Invoke();

    public static void EmitRoomCleared(int roomIndex) =>
        OnRoomCleared?.Invoke(roomIndex);

    public static void EmitBattleComplete() =>
        OnBattleComplete?.Invoke();

    public static void EmitItemCollected(string itemId, int count) =>
        OnItemCollected?.Invoke(itemId, count);

    public static void EmitDocumentCollected(string docId) =>
        OnDocumentCollected?.Invoke(docId);

    public static void EmitCurrencyChanged(float current) =>
        OnCurrencyChanged?.Invoke(current);

    public static void EmitDialogRequested(string dialogId) =>
        OnDialogRequested?.Invoke(dialogId);

    public static void EmitCutsceneRequested(string cutsceneId) =>
        OnCutsceneRequested?.Invoke(cutsceneId);

    public static void EmitSaveRequested() =>
        OnSaveRequested?.Invoke();

    public static void EmitSceneTransition(string scenePath) =>
        OnSceneTransition?.Invoke(scenePath);
}
