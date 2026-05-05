using Godot;
using System.Collections.Generic;

/// <summary>
/// 精灵表动画组件
/// 管理静态默认图（front/back）和帧动画的切换
/// </summary>
[GlobalClass]
public partial class SpriteSheetComponent : Node2D
{
	[Signal]
	public delegate void AnimationFinishedEventHandler(string animName);

	[Export]
	public string TpsheetPath { get; set; }

	[Export]
	public float DefaultFps { get; set; } = 8f;

	private Sprite2D _defaultSprite;
	private AnimatedSprite2D _animatedSprite;
	private bool _framesLoaded;
	private string _missingAnimWarning;
	private string _currentDirection = "front";

	private Texture2D _defaultFront;
	private Texture2D _defaultBack;

	private static readonly Dictionary<string, float> AnimFpsMap = new()
	{
		{ "dodge", 8f },
		{ "move", 8f },
		{ "idle", 4f },
		{ "attack", 10f },
		{ "cast", 8f },
		{ "death", 6f },
	};

	public override void _Ready()
	{
		EnsureNodes();

		if (!_framesLoaded && !string.IsNullOrEmpty(TpsheetPath))
			LoadSpriteSheet();
	}

	public void Initialize(string tpsheetPath, float fps = 0f)
	{
		TpsheetPath = tpsheetPath;
		if (fps > 0f) DefaultFps = fps;
		EnsureNodes();
		LoadSpriteSheet();
		LoadDefaultTextures();
	}

	public void Play(string animName)
	{
		if (_animatedSprite == null) return;
		if (_animatedSprite.SpriteFrames == null) return;
		if (!_animatedSprite.SpriteFrames.HasAnimation(animName))
		{
			WarnMissing(animName);
			return;
		}

		HideDefault();
		_animatedSprite.SpriteFrames.SetAnimationLoop(animName, true);
		_animatedSprite.Play(animName);
	}

	public void PlayOnce(string animName)
	{
		if (_animatedSprite == null) return;
		if (_animatedSprite.SpriteFrames == null) return;
		if (!_animatedSprite.SpriteFrames.HasAnimation(animName))
		{
			WarnMissing(animName);
			return;
		}

		HideDefault();
		_animatedSprite.SpriteFrames.SetAnimationLoop(animName, false);
		_animatedSprite.Play(animName);
	}

	public void Stop()
	{
		_animatedSprite?.Stop();
		ShowDefault();
	}

	public void SetFlipH(bool flip)
	{
		if (_defaultSprite != null)
			_defaultSprite.FlipH = flip;
		if (_animatedSprite != null)
			_animatedSprite.FlipH = flip;
	}

	public void SetDirection(string direction)
	{
		_currentDirection = direction;
		UpdateDefaultTexture();
	}

	public void SetSpeedScale(float scale)
	{
		if (_animatedSprite != null)
			_animatedSprite.SpeedScale = scale;
	}

	public string CurrentAnimation => _animatedSprite?.Animation ?? "";
	public bool IsPlaying => _animatedSprite?.IsPlaying() ?? false;
	public int CurrentFrame => _animatedSprite?.Frame ?? 0;

	public int FrameCount
	{
		get
		{
			if (_animatedSprite?.SpriteFrames == null) return 0;
			return _animatedSprite.SpriteFrames.GetFrameCount(_animatedSprite.Animation);
		}
	}

	public AnimatedSprite2D AnimatedSprite => _animatedSprite;

	// ===== 内部方法 =====

	private void EnsureNodes()
	{
		if (_defaultSprite != null) return;

		_defaultSprite = new Sprite2D();
		_defaultSprite.Name = "DefaultSprite";
		AddChild(_defaultSprite);
		_defaultSprite.Owner = this;

		_animatedSprite = new AnimatedSprite2D();
		_animatedSprite.Name = "AnimatedSprite";
		_animatedSprite.Visible = false;
		_animatedSprite.AnimationFinished += OnAnimationFinished;
		AddChild(_animatedSprite);
		_animatedSprite.Owner = this;
	}

	private void LoadDefaultTextures()
	{
		if (string.IsNullOrEmpty(TpsheetPath)) return;

		string charDir = TpsheetPath.GetBaseDir();
		string frontPath = charDir + "/default_front.png";
		string backPath = charDir + "/default_back.png";

		if (ResourceLoader.Exists(frontPath))
			_defaultFront = GD.Load<Texture2D>(frontPath);
		if (ResourceLoader.Exists(backPath))
			_defaultBack = GD.Load<Texture2D>(backPath);

		UpdateDefaultTexture();
		ShowDefault();
	}

	private void UpdateDefaultTexture()
	{
		if (_defaultSprite == null) return;

		_defaultSprite.Texture = _currentDirection == "back" && _defaultBack != null
			? _defaultBack
			: _defaultFront;
	}

	private void OnAnimationFinished()
	{
		string finishedAnim = _animatedSprite?.Animation ?? "";
		ShowDefault();
		EmitSignal(SignalName.AnimationFinished, finishedAnim);
	}

	private void ShowDefault()
	{
		UpdateDefaultTexture();
		_defaultSprite.Visible = true;
		_animatedSprite.Visible = false;
	}

	private void HideDefault()
	{
		_defaultSprite.Visible = false;
		_animatedSprite.Visible = true;
	}

	private void LoadSpriteSheet()
	{
		if (string.IsNullOrEmpty(TpsheetPath)) return;

		SpriteFrames spriteFrames = TpsheetPath.EndsWith(".tpsheet")
			? TpsheetLoader.Load(TpsheetPath, DefaultFps)
			: TpsheetLoader.LoadDirectory(TpsheetPath, DefaultFps);

		if (spriteFrames != null)
		{
			ApplyFpsOverrides(spriteFrames);
			_animatedSprite.SpriteFrames = spriteFrames;
			_framesLoaded = true;
		}
		else
		{
			GD.PrintErr($"[SpriteSheet] 加载失败: {TpsheetPath}");
		}
	}

	private void ApplyFpsOverrides(SpriteFrames spriteFrames)
	{
		foreach (string animName in spriteFrames.GetAnimationNames())
		{
			float fps = ResolveFps(animName);
			spriteFrames.SetAnimationSpeed(animName, fps);
		}
	}

	private float ResolveFps(string animName)
	{
		string prefix = animName.Contains('_') ? animName.Split('_')[0] : animName;
		return AnimFpsMap.TryGetValue(prefix, out float fps) ? fps : DefaultFps;
	}

	private void WarnMissing(string animName)
	{
		string msg = $"[SpriteSheet] 动画不存在: {animName}";
		if (_missingAnimWarning != msg)
		{
			_missingAnimWarning = msg;
			GD.PrintErr($"{msg}, 可用: [{string.Join(", ", _animatedSprite.SpriteFrames.GetAnimationNames())}]");
		}
	}
}
