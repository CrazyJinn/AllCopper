using Godot;

/// <summary>
/// 立绘管理器 - 管理对话中的角色表情立绘切换
/// </summary>
public partial class PortraitManager : Node
{
    private TextureRect _portraitA; // 左侧立绘
    private TextureRect _portraitB; // 右侧立绘

    private string _currentSpeakerA;
    private string _currentSpeakerB;
    private readonly System.Collections.Generic.Dictionary<string, Texture2D[]> _portraitCache = new();

    public void Setup(TextureRect portraitA, TextureRect portraitB)
    {
        _portraitA = portraitA;
        _portraitB = portraitB;
    }

    /// <summary>更新立绘显示</summary>
    public void UpdatePortraits(string speakerA, GameEnums.EmotionType emotionA, string speakerB, GameEnums.EmotionType emotionB)
    {
        // 更新说话者A立绘
        if (_portraitA != null)
        {
            _portraitA.Texture = GetPortrait(speakerA, emotionA);
            _portraitA.Visible = _portraitA.Texture != null;
            _currentSpeakerA = speakerA;
        }

        // 更新说话者B立绘（对话模式）
        if (_portraitB != null)
        {
            _portraitB.Texture = GetPortrait(speakerB, emotionB);
            _portraitB.Visible = _portraitB.Texture != null;
            _currentSpeakerB = speakerB;
        }
    }

    /// <summary>加载立绘</summary>
    private Texture2D GetPortrait(string speaker, GameEnums.EmotionType emotion)
    {
        if (string.IsNullOrEmpty(speaker)) return null;

        string key = $"{speaker}_{(int)emotion}";
        if (_portraitCache.TryGetValue(key, out var textures) && textures.Length > 0)
        {
            return textures[0];
        }

        // 尝试从资源路径加载
        string path = $"res://assets/portraits/{speaker}/{emotion.ToString().ToLower()}.png";
        var texture = GD.Load<Texture2D>(path);
        return texture;
    }

    /// <summary>预加载角色所有立绘</summary>
    public void PreloadPortraits(string speaker, string[] portraitPaths)
    {
        foreach (var path in portraitPaths)
        {
            var texture = GD.Load<Texture2D>(path);
            if (texture != null)
            {
                string key = $"{speaker}_{path}";
                _portraitCache[key] = new[] { texture };
            }
        }
    }
}
