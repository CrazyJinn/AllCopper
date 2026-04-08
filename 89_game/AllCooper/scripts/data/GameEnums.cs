using Godot;

/// <summary>
/// 全局枚举定义
/// </summary>
public static class GameEnums
{
    /// <summary>游戏全局状态</summary>
    public enum GameState
    {
        MainMenu,
        Exploring,
        Combat,
        Dialog,
        Cutscene,
        Paused
    }

    /// <summary>阵营类型</summary>
    public enum FactionType
    {
        Tech,
        Magic
    }

    /// <summary>伤害类型</summary>
    public enum DamageType
    {
        Normal,
        Poison,
        ShieldBreak
    }

    /// <summary>玩家状态</summary>
    public enum PlayerState
    {
        Idle,
        Moving,
        Dodging,
        Attacking,
        Interacting
    }

    /// <summary>玩家朝向</summary>
    public enum FacingDirection
    {
        Front,
        Back
    }

    /// <summary>AI状态</summary>
    public enum AIState
    {
        Idle,
        Patrol,
        Chase,
        Attack,
        Retreat,
        Special
    }

    /// <summary>房间状态</summary>
    public enum RoomState
    {
        NotEntered,
        InCombat,
        Cleared
    }

    /// <summary>房间类型</summary>
    public enum RoomType
    {
        Entrance,
        Normal,
        Elite,
        Boss,
        Secret
    }

    /// <summary>对话模式</summary>
    public enum DialogMode
    {
        Dialog,
        Monologue
    }

    /// <summary>表情类型</summary>
    public enum EmotionType
    {
        Calm,
        Smile,
        Laugh,
        Angry,
        Furious,
        Depressed,
        Thinking,
        Cold
    }

    /// <summary>物品类型</summary>
    public enum ItemType
    {
        Consumable,
        Equipment,
        Material,
        Quest,
        Literature
    }

    /// <summary>文献类型</summary>
    public enum LiteratureType
    {
        Newspaper,
        Diary,
        Report,
        Order,
        Archive
    }

    /// <summary>场景切换过渡类型</summary>
    public enum TransitionType
    {
        Fade,
        Instant
    }
}
