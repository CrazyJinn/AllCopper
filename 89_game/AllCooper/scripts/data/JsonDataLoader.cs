using Godot;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;

/// <summary>
/// JSON 数据加载器
/// 从 res://data/ 加载 JSON 配置文件，转换为 Godot Resource 数据对象
/// </summary>
public static class JsonDataLoader
{
	// ===== JSON DTO =====

	private class CharacterDto
	{
		public string CharacterId { get; set; }
		public string DisplayName { get; set; }
		public float MaxHealth { get; set; }
		public float MaxShield { get; set; }
		public float ShieldAbsorbRate { get; set; }
		public float ShieldRegenSpeed { get; set; }
		public float ShieldRegenDelay { get; set; }
		public float MoveSpeed { get; set; }
		public float RollSpeed { get; set; }
		public float RollDuration { get; set; }
		public float RollCooldown { get; set; }
		public string Faction { get; set; }
		public int MaxAmmo { get; set; }
		public float ReloadTime { get; set; }
		public float ChargeTime { get; set; }
		public float CdAcceleration { get; set; }
		public int InventoryBonus { get; set; }
		public string[] SkillIds { get; set; }
		public string PortraitDefault { get; set; }
		public string[] PortraitExpressions { get; set; }
		public string TpsheetPath { get; set; }
	}

	private class EnemyDto
	{
		public string EnemyId { get; set; }
		public string DisplayName { get; set; }
		public string Type { get; set; }
		public float MaxHealth { get; set; }
		public float MaxShield { get; set; }
		public float AttackPower { get; set; }
		public float MoveSpeed { get; set; }
		public float DetectRange { get; set; }
		public float AttackRange { get; set; }
		public string Sprite { get; set; }
		public string TpsheetPath { get; set; }
		public bool HasChargeAttack { get; set; }
		public float DashSpeed { get; set; }
		public float DashDistance { get; set; }
		public bool HasBerserk { get; set; }
		public float BerserkThreshold { get; set; }
		public bool HasPoison { get; set; }
		public float PoisonDamage { get; set; }
		public bool CanSummon { get; set; }
		public string SummonTypeId { get; set; }
		public LootDropDto[] LootTable { get; set; }
	}

	private class LootDropDto
	{
		public string ItemId { get; set; }
		public float DropChance { get; set; }
		public int MinCount { get; set; }
		public int MaxCount { get; set; }
	}

	private class RoomDto
	{
		public string RoomId { get; set; }
		public string Type { get; set; }
		public string BattleType { get; set; }
		public int[] RoomSize { get; set; }
		public string Background { get; set; }
		public SpawnPointDto[] SpawnPoints { get; set; }
		public DoorDto[] Doors { get; set; }
		public DecorationDto[] Decorations { get; set; }
		public WallDto[] Walls { get; set; }
		public float[] PlayerSpawn { get; set; }
		public string HiddenCondition { get; set; }
	}

	private class WallDto
	{
		public float[] Position { get; set; }
		public float[] Size { get; set; }
	}

	private class SpawnPointDto
	{
		public float[] Position { get; set; }
		public string EnemyId { get; set; }
	}

	private class DoorDto
	{
		public float[] Position { get; set; }
		public int TargetRoomIndex { get; set; }
	}

	private class DecorationDto
	{
		public float[] Position { get; set; }
		public string Sprite { get; set; }
		public bool HasCollision { get; set; }
		public float[] CollisionSize { get; set; }
	}

	private class RegionDto
	{
		public string RegionId { get; set; }
		public string DisplayName { get; set; }
		public string MapImage { get; set; }
		public bool IsUnlocked { get; set; }
		public string UnlockCondition { get; set; }
		public float[] MapPosition { get; set; }
		public string[] RoomIds { get; set; }
	}

	private class ItemGroupDto
	{
		public ItemDto[] Items { get; set; }
	}

	private class ItemDto
	{
		public string ItemId { get; set; }
		public string DisplayName { get; set; }
		public string Description { get; set; }
		public string Icon { get; set; }
		public int[] SpaceOccupied { get; set; }
		public string Category { get; set; }
		public string Rarity { get; set; }
		public int MaxStack { get; set; }
		public float BuyPrice { get; set; }
		public float SellPrice { get; set; }
		public string UseEffectId { get; set; }
	}

	private class SkillGroupDto
	{
		public SkillDto[] Skills { get; set; }
	}

	private class SkillDto
	{
		public string SkillId { get; set; }
		public string DisplayName { get; set; }
		public string Icon { get; set; }
		public float Cooldown { get; set; }
		public float Damage { get; set; }
		public float Range { get; set; }
		public float Duration { get; set; }
		public bool RequiresAim { get; set; }
	}

	private class DialogDto
	{
		public string DialogId { get; set; }
		public string Background { get; set; }
		public DialogEntryDto[] Entries { get; set; }
	}

	private class DialogEntryDto
	{
		public string SpeakerId { get; set; }
		public string Text { get; set; }
		public string Expression { get; set; }
		public string Layout { get; set; }
		public string PortraitSide { get; set; }
		public string CutsceneId { get; set; }
		public float CutsceneDelay { get; set; }
	}

	// ===== 注册表 =====

	private static readonly Dictionary<string, CharacterData> _characters = new();
	private static readonly Dictionary<string, EnemyData> _enemies = new();
	private static readonly Dictionary<string, RoomData> _rooms = new();
	private static readonly Dictionary<string, RegionData> _regions = new();
	private static readonly Dictionary<string, ItemData> _items = new();
	private static readonly Dictionary<string, SkillData> _skills = new();
	private static readonly Dictionary<string, DialogData> _dialogs = new();

	private static readonly JsonSerializerOptions JsonOpts = new()
	{
		PropertyNameCaseInsensitive = true,
		ReadCommentHandling = JsonCommentHandling.Skip,
		AllowTrailingCommas = true,
	};

	// ===== 公共查询 API =====

	public static CharacterData GetCharacter(string id) => _characters.GetValueOrDefault(id);
	public static EnemyData GetEnemy(string id) => _enemies.GetValueOrDefault(id);
	public static RoomData GetRoom(string id) => _rooms.GetValueOrDefault(id);
	public static RegionData GetRegion(string id) => _regions.GetValueOrDefault(id);
	public static ItemData GetItem(string id) => _items.GetValueOrDefault(id);
	public static SkillData GetSkill(string id) => _skills.GetValueOrDefault(id);
		public static DialogData GetDialog(string id) => _dialogs.GetValueOrDefault(id);

	// ===== 批量加载 =====

	/// <summary>
	/// 加载所有数据（按依赖顺序）
	/// </summary>
	public static void LoadAll()
	{
		GD.Print("[JsonDataLoader] 开始加载所有游戏数据...");

		LoadItemGroup("res://data/items/items_common.json");
		LoadSkillGroup("res://data/skills/skills_tech.json");
		LoadSkillGroup("res://data/skills/skills_magic.json");

		LoadCharacter("res://data/characters/char_001.json");
		LoadCharacter("res://data/characters/char_002.json");

		LoadEnemy("res://data/enemies/enemy_005.json");

		LoadRoom("res://data/rooms/room_tutorial_01.json");
		LoadRoom("res://data/rooms/room_region01_01.json");
		LoadRoom("res://data/rooms/room_region01_02.json");
		LoadRoom("res://data/rooms/room_region01_elite.json");
		LoadRoom("res://data/rooms/room_region01_boss.json");

		LoadDialog("res://data/dialogs/dialog_ch01_intro.json");

		GD.Print($"[JsonDataLoader] 加载完成 — 角色:{_characters.Count} 敌人:{_enemies.Count} 房间:{_rooms.Count} 区域:{_regions.Count} 物品:{_items.Count} 技能:{_skills.Count} 对话:{_dialogs.Count}");
	}

	// ===== 单文件加载 =====

	public static void LoadCharacter(string path)
	{
		var dto = ReadAndDeserialize<CharacterDto>(path);
		if (dto == null) return;

		var data = new CharacterData
		{
			CharacterId = dto.CharacterId,
			DisplayName = dto.DisplayName ?? "",
			MaxHealth = dto.MaxHealth,
			MaxShield = dto.MaxShield,
			ShieldAbsorbRate = dto.ShieldAbsorbRate,
			ShieldRegenSpeed = dto.ShieldRegenSpeed,
			ShieldRegenDelay = dto.ShieldRegenDelay,
			MoveSpeed = dto.MoveSpeed,
			RollSpeed = dto.RollSpeed,
			RollDuration = dto.RollDuration,
			RollCooldown = dto.RollCooldown,
			Faction = ParseEnum<FactionType>(dto.Faction),
			MaxAmmo = dto.MaxAmmo,
			ReloadTime = dto.ReloadTime,
			ChargeTime = dto.ChargeTime,
			CdAcceleration = dto.CdAcceleration,
			InventoryBonus = dto.InventoryBonus,
			Skills = ResolveSkills(dto.SkillIds),
			PortraitDefault = LoadTexture(dto.PortraitDefault),
			PortraitExpressions = dto.PortraitExpressions?.Select(LoadTexture).ToArray() ?? [],
			TpsheetPath = dto.TpsheetPath ?? "",
		};

		_characters[data.CharacterId] = data;
		GD.Print($"[JsonDataLoader] 角色: {data.DisplayName} ({data.CharacterId})");
	}

	public static void LoadEnemy(string path)
	{
		var dto = ReadAndDeserialize<EnemyDto>(path);
		if (dto == null) return;

		var data = new EnemyData
		{
			EnemyId = dto.EnemyId,
			DisplayName = dto.DisplayName ?? "",
			Type = ParseEnum<EnemyType>(dto.Type),
			MaxHealth = dto.MaxHealth,
			MaxShield = dto.MaxShield,
			AttackPower = dto.AttackPower,
			MoveSpeed = dto.MoveSpeed,
			DetectRange = dto.DetectRange,
			AttackRange = dto.AttackRange,
			Sprite = LoadTexture(dto.Sprite),
			TpsheetPath = dto.TpsheetPath ?? "",
			HasChargeAttack = dto.HasChargeAttack,
			DashSpeed = dto.DashSpeed,
			DashDistance = dto.DashDistance,
			HasBerserk = dto.HasBerserk,
			BerserkThreshold = dto.BerserkThreshold,
			HasPoison = dto.HasPoison,
			PoisonDamage = dto.PoisonDamage,
			CanSummon = dto.CanSummon,
			SummonType = !string.IsNullOrEmpty(dto.SummonTypeId) ? GetEnemy(dto.SummonTypeId) : null,
			LootTable = dto.LootTable?.Select(ToLootDrop).ToArray() ?? [],
		};

		_enemies[data.EnemyId] = data;
		GD.Print($"[JsonDataLoader] 敌人: {data.DisplayName} ({data.EnemyId})");
	}

	public static void LoadRoom(string path)
	{
		var dto = ReadAndDeserialize<RoomDto>(path);
		if (dto == null) return;

		var data = new RoomData
		{
			RoomId = dto.RoomId,
			Type = ParseEnum<RoomType>(dto.Type),
			BattleType = ParseEnum<BattleType>(dto.BattleType),
			RoomSize = dto.RoomSize != null ? new Vector2I(dto.RoomSize[0], dto.RoomSize[1]) : new Vector2I(1920, 1080),
			Background = LoadTexture(dto.Background),
			SpawnPoints = dto.SpawnPoints?.Select(ToSpawnPoint).ToArray() ?? [],
			Doors = dto.Doors?.Select(ToDoorPosition).ToArray() ?? [],
			Decorations = dto.Decorations?.Select(ToDecoration).ToArray() ?? [],
			Walls = dto.Walls?.Select(ToWallData).ToArray() ?? [],
			PlayerSpawn = dto.PlayerSpawn != null ? new Vector2(dto.PlayerSpawn[0], dto.PlayerSpawn[1]) : new Vector2(-200, 0),
			HiddenCondition = dto.HiddenCondition ?? "",
		};

		_rooms[data.RoomId] = data;
		GD.Print($"[JsonDataLoader] 房间: {data.RoomId}");
	}

	public static void LoadRegion(string path)
	{
		var dto = ReadAndDeserialize<RegionDto>(path);
		if (dto == null) return;

		var data = new RegionData
		{
			RegionId = dto.RegionId,
			DisplayName = dto.DisplayName ?? "",
			MapImage = LoadTexture(dto.MapImage),
			IsUnlocked = dto.IsUnlocked,
			UnlockCondition = dto.UnlockCondition ?? "",
			MapPosition = dto.MapPosition != null ? new Vector2(dto.MapPosition[0], dto.MapPosition[1]) : Vector2.Zero,
			Rooms = dto.RoomIds?.Select(id =>
			{
				var room = GetRoom(id);
				if (room == null) GD.PrintErr($"[JsonDataLoader] 区域 {dto.RegionId} 引用的房间不存在: {id}");
				return room;
			}).Where(r => r != null).ToArray() ?? [],
		};

		_regions[data.RegionId] = data;
		GD.Print($"[JsonDataLoader] 区域: {data.DisplayName} ({data.RegionId}), {data.Rooms?.Length ?? 0} 个房间");
	}

	public static void LoadItemGroup(string path)
	{
		var dto = ReadAndDeserialize<ItemGroupDto>(path);
		if (dto?.Items == null) return;

		foreach (var itemDto in dto.Items)
		{
			var data = new ItemData
			{
				ItemId = itemDto.ItemId,
				DisplayName = itemDto.DisplayName ?? "",
				Description = itemDto.Description ?? "",
				Icon = LoadTexture(itemDto.Icon),
				SpaceOccupied = itemDto.SpaceOccupied != null
					? new Vector2I(itemDto.SpaceOccupied[0], itemDto.SpaceOccupied[1])
					: new Vector2I(1, 1),
				Category = ParseEnum<ItemCategory>(itemDto.Category),
				Rarity = ParseEnum<ItemRarity>(itemDto.Rarity),
				MaxStack = itemDto.MaxStack,
				BuyPrice = itemDto.BuyPrice,
				SellPrice = itemDto.SellPrice,
				UseEffectId = itemDto.UseEffectId ?? "",
			};
			_items[data.ItemId] = data;
		}
		GD.Print($"[JsonDataLoader] 物品: 加载 {dto.Items.Length} 个");
	}

	public static void LoadSkillGroup(string path)
	{
		var dto = ReadAndDeserialize<SkillGroupDto>(path);
		if (dto?.Skills == null) return;

		foreach (var skillDto in dto.Skills)
		{
			var data = new SkillData
			{
				SkillId = skillDto.SkillId,
				DisplayName = skillDto.DisplayName ?? "",
				Icon = LoadTexture(skillDto.Icon),
				Cooldown = skillDto.Cooldown,
				Damage = skillDto.Damage,
				Range = skillDto.Range,
				Duration = skillDto.Duration,
				RequiresAim = skillDto.RequiresAim,
			};
			_skills[data.SkillId] = data;
		}
		GD.Print($"[JsonDataLoader] 技能: 加载 {dto.Skills.Length} 个");
	}

	public static void LoadDialog(string path)
		{
			var dto = ReadAndDeserialize<DialogDto>(path);
			if (dto == null) return;

			var data = new DialogData
			{
				DialogId = dto.DialogId,
				Background = LoadTexture(dto.Background),
				Entries = dto.Entries?.Select(ToDialogEntry).ToArray() ?? [],
			};

			_dialogs[data.DialogId] = data;
			GD.Print($"[JsonDataLoader] 对话: {data.DialogId}, {data.Entries?.Length ?? 0} 条");
		}

		/// <summary>
		/// 根据角色ID和表情名称解析立绘贴图
		/// </summary>
		public static Texture2D ResolvePortrait(string characterId, string expression = "default")
		{
			var character = GetCharacter(characterId);
			if (character == null) return null;

			if (string.IsNullOrEmpty(expression) || expression == "default")
				return character.PortraitDefault;

			if (character.PortraitExpressions != null && character.PortraitExpressions.Length > 0)
			{
				if (int.TryParse(expression.Replace("expr_", ""), out int index)
					&& index >= 0 && index < character.PortraitExpressions.Length)
				{
					return character.PortraitExpressions[index];
				}
				return character.PortraitExpressions[0];
			}

			return character.PortraitDefault;
		}

		/// <summary>
		/// 根据角色ID获取显示名称
		/// </summary>
		public static string GetCharacterDisplayName(string characterId)
		{
			var character = GetCharacter(characterId);
			return character?.DisplayName ?? characterId ?? "";
		}

		// ===== 内部转换方法 =====

	private static LootDrop ToLootDrop(LootDropDto dto)
	{
		return new LootDrop
		{
			Item = !string.IsNullOrEmpty(dto.ItemId) ? GetItem(dto.ItemId) : null,
			DropChance = dto.DropChance,
			MinCount = dto.MinCount,
			MaxCount = dto.MaxCount,
		};
	}

	private static SpawnPoint ToSpawnPoint(SpawnPointDto dto)
	{
		return new SpawnPoint
		{
			Position = dto.Position != null ? new Vector2(dto.Position[0], dto.Position[1]) : Vector2.Zero,
			Enemy = !string.IsNullOrEmpty(dto.EnemyId) ? GetEnemy(dto.EnemyId) : null,
		};
	}

	private static DoorPosition ToDoorPosition(DoorDto dto)
	{
		return new DoorPosition
		{
			Position = dto.Position != null ? new Vector2(dto.Position[0], dto.Position[1]) : Vector2.Zero,
			TargetRoomIndex = dto.TargetRoomIndex,
		};
	}

	private static Decoration ToDecoration(DecorationDto dto)
	{
		return new Decoration
		{
			Position = dto.Position != null ? new Vector2(dto.Position[0], dto.Position[1]) : Vector2.Zero,
			Sprite = LoadTexture(dto.Sprite),
			HasCollision = dto.HasCollision,
			CollisionSize = dto.CollisionSize != null ? new Vector2(dto.CollisionSize[0], dto.CollisionSize[1]) : Vector2.Zero,
		};
	}

	private static WallData ToWallData(WallDto dto)
	{
		return new WallData
		{
			Position = dto.Position != null ? new Vector2(dto.Position[0], dto.Position[1]) : Vector2.Zero,
			Size = dto.Size != null ? new Vector2(dto.Size[0], dto.Size[1]) : new Vector2(1600, 40),
		};
	}

	private static SkillData[] ResolveSkills(string[] skillIds)
	{
		if (skillIds == null || skillIds.Length == 0) return [];
		return skillIds.Select(id =>
		{
			var skill = GetSkill(id);
			if (skill == null) GD.PrintErr($"[JsonDataLoader] 技能不存在: {id}");
			return skill;
		}).Where(s => s != null).ToArray();
	}

	private static DialogEntry ToDialogEntry(DialogEntryDto dto)
		{
			return new DialogEntry
			{
				SpeakerId = dto.SpeakerId ?? "",
				Text = dto.Text ?? "",
				PortraitExpression = dto.Expression ?? "default",
				Layout = ParseEnum<DialogLayout>(dto.Layout),
				PortraitSide = ParseEnum<DialogPortraitSide>(dto.PortraitSide),
				CutsceneId = dto.CutsceneId ?? "",
				CutsceneDelay = dto.CutsceneDelay,
			};
		}

			// ===== 工具方法 =====

	private static T ReadAndDeserialize<T>(string resPath) where T : class
	{
		string json = ReadJsonFile(resPath);
		if (json == null) return null;

		try
		{
			return JsonSerializer.Deserialize<T>(json, JsonOpts);
		}
		catch (JsonException ex)
		{
			GD.PrintErr($"[JsonDataLoader] JSON 解析失败: {resPath}, 错误: {ex.Message}");
			return null;
		}
	}

	private static string ReadJsonFile(string resPath)
	{
		using var file = FileAccess.Open(resPath, FileAccess.ModeFlags.Read);
		if (file == null)
		{
			GD.PrintErr($"[JsonDataLoader] 无法打开: {resPath}, 错误: {FileAccess.GetOpenError()}");
			return null;
		}
		return file.GetAsText();
	}

	private static Texture2D LoadTexture(string path)
	{
		if (string.IsNullOrEmpty(path)) return null;
		if (!ResourceLoader.Exists(path)) return null;
		return GD.Load<Texture2D>(path);
	}

	private static T ParseEnum<T>(string value) where T : struct, System.Enum
	{
		if (string.IsNullOrEmpty(value)) return default;
		if (System.Enum.TryParse<T>(value, true, out var result)) return result;
		GD.PrintErr($"[JsonDataLoader] 枚举解析失败: {typeof(T).Name}.{value}");
		return default;
	}
}
