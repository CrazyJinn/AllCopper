using Godot;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Text.Json.Serialization;

/// <summary>
/// .tpsheet 精灵表加载器
/// 解析自定义 tpsheet JSON 格式，构建 SpriteFrames 资源供 AnimatedSprite2D 使用
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
	/// 从 .tpsheet 文件加载 SpriteFrames
	/// </summary>
	/// <param name="tpsheetPath">res:// 路径</param>
	/// <param name="fps">默认帧率</param>
	public static SpriteFrames Load(string tpsheetPath, float fps = 8f)
	{
		GD.Print($"[TpsheetLoader] 开始加载: {tpsheetPath}");

		using var file = FileAccess.Open(tpsheetPath, FileAccess.ModeFlags.Read);
		if (file == null)
		{
			GD.PrintErr($"[TpsheetLoader] 无法打开: {tpsheetPath}, Error: {FileAccess.GetOpenError()}");
			return null;
		}

		string json = file.GetAsText();
		GD.Print($"[TpsheetLoader] JSON 长度: {json.Length}");

		var data = JsonSerializer.Deserialize<TpsheetData>(json);
		if (data?.Textures == null || data.Textures.Count == 0)
		{
			GD.PrintErr($"[TpsheetLoader] JSON 解析失败: {tpsheetPath}");
			return null;
		}

		string baseDir = tpsheetPath.GetBaseDir();
		var spriteFrames = new SpriteFrames();

		foreach (var texEntry in data.Textures)
		{
			string imagePath = baseDir + "/" + texEntry.Image;
			GD.Print($"[TpsheetLoader] 加载纹理: {imagePath}");

			var atlas = GD.Load<Texture2D>(imagePath);
			if (atlas == null)
			{
				GD.PrintErr($"[TpsheetLoader] 无法加载纹理: {imagePath}");
				continue;
			}

			GD.Print($"[TpsheetLoader] 纹理尺寸: {atlas.GetWidth()}x{atlas.GetHeight()}, Sprites数量: {texEntry.Sprites.Count}");

			BuildAnimations(spriteFrames, atlas, texEntry.Sprites, fps);
		}

		// 输出所有构建的动画
		string[] animNames = spriteFrames.GetAnimationNames();
		GD.Print($"[TpsheetLoader] 完成, 共 {animNames.Length} 个动画:");
		foreach (string name in animNames)
		{
			GD.Print($"  {name}: {spriteFrames.GetFrameCount(name)} 帧, {spriteFrames.GetAnimationSpeed(name)} fps");
		}

		return spriteFrames;
	}

	// ===== 内部方法 =====

	private static void BuildAnimations(
		SpriteFrames spriteFrames,
		Texture2D atlas,
		List<SpriteEntry> sprites,
		float fps)
	{
		// 按 filename 分组：去掉 _NNN 后缀得到动画名
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
	/// idle_back_001 → ("idle_back", 1)
	/// </summary>
	private static (string animName, int frameIndex) ParseFilename(string filename)
	{
		int last = filename.LastIndexOf('_');
		if (last < 0)
			return (filename, 0);

		string animPart = filename.Substring(0, last);
		string numPart = filename.Substring(last + 1);

		return int.TryParse(numPart, out int idx)
			? (animPart, idx)
			: (filename, 0);
	}
}
