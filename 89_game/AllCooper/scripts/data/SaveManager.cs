using Godot;
using System.Collections.Generic;
using System.Text.Json;

/// <summary>
/// 存档管理器 - 进度持久化
/// </summary>
public partial class SaveManager : Node
{
    public static SaveManager Instance { get; private set; }

    private const string SavePath = "user://save_data.json";

    public override void _EnterTree()
    {
        Instance = this;
    }

    /// <summary>保存游戏</summary>
    public bool SaveGame()
    {
        var saveData = new SaveData
        {
            CurrentScene = SceneManager.Instance?.CurrentSceneName ?? "",
            PlayerPosition = GameManager.Instance?.Player?.GlobalPosition ?? Vector2.Zero,
            Currency = EconomyManager.Instance?.CurrentCurrency ?? 0,
            GameState = (int)(GameManager.Instance?.CurrentState ?? GameEnums.GameState.MainMenu),
            CollectedLiterature = new List<string>(LiteratureManager.Instance?._collectedIds ?? new HashSet<string>()),
            UnlockedRegions = WorldMapManager.Instance?.GetUnlockedRegions() ?? System.Array.Empty<string>()
        };

        // 战斗资源
        var player = GameManager.Instance?.Player;
        if (player != null)
        {
            var resource = player.GetNode<BattleResource>("BattleResource");
            if (resource != null)
            {
                saveData.HP = resource.HP;
                saveData.Shield = resource.Shield;
                saveData.Ammo = resource.Ammo;
            }
        }

        string json = JsonSerializer.Serialize(saveData);
        var file = FileAccess.Open(SavePath, FileAccess.ModeFlags.Write);
        if (file == null) return false;

        file.StoreString(json);
        file.Close();
        GD.Print("[SaveManager] 存档保存成功");
        return true;
    }

    /// <summary>加载游戏</summary>
    public bool LoadGame()
    {
        if (!FileAccess.FileExists(SavePath)) return false;

        var file = FileAccess.Open(SavePath, FileAccess.ModeFlags.Read);
        if (file == null) return false;

        string json = file.GetAsText();
        file.Close();

        var saveData = JsonSerializer.Deserialize<SaveData>(json);
        if (saveData == null) return false;

        // 恢复状态
        if (!string.IsNullOrEmpty(saveData.CurrentScene))
        {
            SceneManager.Instance?.ChangeScene(saveData.CurrentScene, GameEnums.TransitionType.Instant);
        }

        EconomyManager.Instance?.AddCurrency(saveData.Currency);

        // 恢复文献
        if (saveData.CollectedLiterature != null)
        {
            foreach (var id in saveData.CollectedLiterature)
            {
                LiteratureManager.Instance?.Collect(id);
            }
        }

        // 恢复区域
        if (saveData.UnlockedRegions != null)
        {
            foreach (var regionId in saveData.UnlockedRegions)
            {
                WorldMapManager.Instance?.UnlockRegion(regionId);
            }
        }

        GD.Print("[SaveManager] 存档加载成功");
        return true;
    }

    /// <summary>删除存档</summary>
    public void DeleteSave()
    {
        if (FileAccess.FileExists(SavePath))
        {
            DirAccess.RemoveAbsolute(SavePath);
        }
    }

    /// <summary>检查存档是否存在</summary>
    public bool HasSave() => FileAccess.FileExists(SavePath);
}

/// <summary>
/// 存档数据结构
/// </summary>
public class SaveData
{
    public string CurrentScene { get; set; } = "";
    public Vector2 PlayerPosition { get; set; }
    public float HP { get; set; }
    public float Shield { get; set; }
    public int Ammo { get; set; }
    public float Currency { get; set; }
    public int GameState { get; set; }
    public List<string> CollectedLiterature { get; set; } = new();
    public string[] UnlockedRegions { get; set; } = System.Array.Empty<string>();
}
