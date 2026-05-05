using Godot;
using System.Collections.Generic;
using System.Text.Json;
using System.Text.Json.Serialization;

/// <summary>
/// .tpsheet 精灵表加载器
/// 支持单文件加载和目录批量加载
/// </summary>
public static class TpsheetLoader
{
	// ===== JSON 数据结构 =====

	private class TpsheetData
	{
		[JsonPropertyName("textures")]
		public List<TextureEntry> Textures { get; set; }

		[JsonPropertyName("meta")]
		public MetaData Meta { get; set; }
	}

	private class TextureEntry
	{
		[JsonPropertyName("image")]
		public string Image { get; set; }

		[JsonPropertyName("size")]
		public SizeData Size { get; set; }

		[JsonPropertyName("sprites")]
		public List<SpriteEntry> Sprites { get; set; }
	}

	private class SpriteEntry
	{
		[JsonPropertyName("filename")]
		public string Filename { get; set; }

		[JsonPropertyName("region")]
		public RectData Region { get; set; }

		[JsonPropertyName("margin")]
		public RectData Margin { get; set; }
	}

	private class RectData
	{
		[JsonPropertyName("x")]
		public int X { get; set; }

		[JsonPropertyName("y")]
		public int Y { get; set; }

		[JsonPropertyName("w")]
		public int W { get; set; }

		[JsonPropertyName("h")]
		public int H { get; set; }
	}

	private class SizeData
	{
		[JsonPropertyName("w")]
		public int W { get; set; }

		[JsonPropertyName("h")]
		public int H { get; set; }
	}

	private class MetaData
	{
		[JsonPropertyName("version")]
		public string Version { get; set; }

		[JsonPropertyName("format")]
		public string Format { get; set; }
	}

	// ===== 公共接口 =====

	/// <summary>
	/// 从目录加载所有 .tpsheet 文件，合并为一个 SpriteFrames
	/// </summary>
	public static SpriteFrames LoadDirectory(string dirPath, float fps = 8f)
	{
		using var dir = DirAccess.Open(dirPath);
		if (dir == null)
		{
			GD.PrintErr($"[TpsheetLoader] 无法打开目录: {dirPath}");
			return null;
		}

		var tpsheetFiles = new List<string>();
		dir.ListDirBegin();
		string fileName = dir.GetNext();
		while (fileName != "")
		{
			if (fileName.EndsWith(".tpsheet"))
				tpsheetFiles.Add(fileName);
			fileName = dir.GetNext();
		}
		dir.ListDirEnd();

		if (tpsheetFiles.Count == 0)
		{
			GD.PrintErr($"[TpsheetLoader] 目录中未找到 .tpsheet 文件: {dirPath}");
			return null;
		}

		tpsheetFiles.Sort();

		var spriteFrames = new SpriteFrames();
		foreach (var tpsheetFile in tpsheetFiles)
		{
			string tpsheetPath = dirPath.TrimEnd('/') + "/" + tpsheetFile;
			LoadSingleInto(spriteFrames, tpsheetPath, fps);
		}

		return spriteFrames;
	}

	/// <summary>
	/// 从单个 .tpsheet 文件加载 SpriteFrames
	/// </summary>
	public static SpriteFrames Load(string tpsheetPath, float fps = 8f)
	{
		using var file = FileAccess.Open(tpsheetPath, FileAccess.ModeFlags.Read);
		if (file == null)
		{
			GD.PrintErr($"[TpsheetLoader] 无法打开: {tpsheetPath}");
			return null;
		}

		string json = file.GetAsText();
		var data = JsonSerializer.Deserialize<TpsheetData>(json);
		if (data?.Textures == null || data.Textures.Count == 0)
		{
			GD.PrintErr($"[TpsheetLoader] JSON 解析失败: {tpsheetPath}");
			return null;
		}

		var spriteFrames = new SpriteFrames();
		string baseDir = tpsheetPath.GetBaseDir();

		foreach (var texEntry in data.Textures)
		{
			var atlas = ResolveAtlas(baseDir, tpsheetPath, texEntry.Image);
			if (atlas == null) continue;
			BuildAnimations(spriteFrames, atlas, texEntry.Sprites, fps);
		}

		return spriteFrames;
	}

	// ===== 内部方法 =====

	private static void LoadSingleInto(SpriteFrames spriteFrames, string tpsheetPath, float fps)
	{
		using var file = FileAccess.Open(tpsheetPath, FileAccess.ModeFlags.Read);
		if (file == null) return;

		var data = JsonSerializer.Deserialize<TpsheetData>(file.GetAsText());
		if (data?.Textures == null) return;

		string baseDir = tpsheetPath.GetBaseDir();

		foreach (var texEntry in data.Textures)
		{
			var atlas = ResolveAtlas(baseDir, tpsheetPath, texEntry.Image);
			if (atlas == null) continue;
			BuildAnimations(spriteFrames, atlas, texEntry.Sprites, fps);
		}
	}

	/// <summary>
	/// 解析图集纹理：先尝试 JSON 中的 image 字段，若不存在则用 .tpsheet 同名 .png
	/// </summary>
	private static Texture2D ResolveAtlas(string baseDir, string tpsheetPath, string imageRef)
	{
		string imagePath = baseDir + "/" + imageRef;
		if (ResourceLoader.Exists(imagePath))
			return GD.Load<Texture2D>(imagePath);

		string tpsheetStem = tpsheetPath.GetFile().Replace(".tpsheet", ".png");
		string fallbackPath = baseDir + "/" + tpsheetStem;
		if (ResourceLoader.Exists(fallbackPath))
			return GD.Load<Texture2D>(fallbackPath);

		GD.PrintErr($"[TpsheetLoader] 无法加载图集: {imagePath}");
		return null;
	}

	private static void BuildAnimations(
		SpriteFrames spriteFrames,
		Texture2D atlas,
		List<SpriteEntry> sprites,
		float fps)
	{
		var groups = new Dictionary<string, List<(int index, SpriteEntry sprite)>>();

		foreach (var sprite in sprites)
		{
			var (animName, frameIdx) = ParseFilename(sprite.Filename);
			if (!groups.ContainsKey(animName))
				groups[animName] = new List<(int, SpriteEntry)>();
			groups[animName].Add((frameIdx, sprite));
		}

		foreach (var kvp in groups)
		{
			string animName = kvp.Key;
			var frames = kvp.Value;
			frames.Sort((a, b) => a.index.CompareTo(b.index));

			spriteFrames.AddAnimation(animName);
			spriteFrames.SetAnimationSpeed(animName, fps);
			spriteFrames.SetAnimationLoop(animName, true);

			foreach (var (_, sprite) in frames)
			{
				var atlasTex = new AtlasTexture();
				atlasTex.Atlas = atlas;
				atlasTex.Region = new Rect2(
					sprite.Region.X, sprite.Region.Y,
					sprite.Region.W, sprite.Region.H
				);
				spriteFrames.AddFrame(animName, atlasTex);
			}
		}
	}

	/// <summary>
	/// 解析帧名 → (动画名, 帧序号)
	/// char_002_move_front_04 → ("move_front", 4)
	/// idle_back_001 → ("idle_back", 1)
	/// </summary>
	private static (string animName, int frameIndex) ParseFilename(string filename)
	{
		int last = filename.LastIndexOf('_');
		if (last < 0)
			return (filename, 0);

		string animPart = filename.Substring(0, last);
		string numPart = filename.Substring(last + 1);

		if (!int.TryParse(numPart, out int idx))
			return (filename, 0);

		// 去掉 {type}_{NNN}_ 前缀（如 char_002_）
		int firstUnderscore = animPart.IndexOf('_');
		if (firstUnderscore > 0)
		{
			string afterFirst = animPart.Substring(firstUnderscore + 1);
			int secondUnderscore = afterFirst.IndexOf('_');
			if (secondUnderscore > 0 && int.TryParse(afterFirst.Substring(0, secondUnderscore), out _))
				animPart = afterFirst.Substring(secondUnderscore + 1);
		}

		return (animPart, idx);
	}
}
