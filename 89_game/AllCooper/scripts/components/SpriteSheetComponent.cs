using Godot;

/// <summary>
/// 精灵表动画组件
/// 加载 .tpsheet 文件，通过内部 AnimatedSprite2D 播放帧动画
/// 支持在 _Ready 时自动加载，也支持通过 Initialize() 延迟加载
/// </summary>
[GlobalClass]
public partial class SpriteSheetComponent : Node2D
{
	/// <summary>.tpsheet 文件的 res:// 路径</summary>
	[Export]
	public string TpsheetPath { get; set; }

	/// <summary>默认帧率</summary>
	[Export]
	public float DefaultFps { get; set; } = 4f;

	/// <summary>默认播放的动画名（可选）</summary>
	[Export]
	public string DefaultAnimation { get; set; } = "";

	private AnimatedSprite2D _animatedSprite;
	private bool _framesLoaded;

	public override void _Ready()
	{
		EnsureAnimatedSprite();

		GD.Print($"[SpriteSheet] _Ready, TpsheetPath={TpsheetPath}, framesLoaded={_framesLoaded}");

		if (!_framesLoaded && !string.IsNullOrEmpty(TpsheetPath))
			LoadSpriteSheet();
	}

	/// <summary>
	/// 延迟初始化：设置路径并加载精灵表
	/// </summary>
	public void Initialize(string tpsheetPath, float fps = 4f)
	{
		GD.Print($"[SpriteSheet] Initialize: {tpsheetPath}, fps={fps}");
		TpsheetPath = tpsheetPath;
		DefaultFps = fps;
		EnsureAnimatedSprite();
		LoadSpriteSheet();
	}

	/// <summary>播放指定动画（循环）</summary>
	public void Play(string animName)
	{
		if (_animatedSprite == null) return;
		if (_animatedSprite.Animation == animName && _animatedSprite.IsPlaying()) return;

		if (_animatedSprite.SpriteFrames == null)
		{
			GD.PrintErr($"[SpriteSheet] Play(\"{animName}\") 失败: SpriteFrames 为空");
			return;
		}

		if (!_animatedSprite.SpriteFrames.HasAnimation(animName))
		{
			GD.PrintErr($"[SpriteSheet] Play(\"{animName}\") 失败: 动画不存在, 可用: [{string.Join(", ", _animatedSprite.SpriteFrames.GetAnimationNames())}]");
			return;
		}

		_animatedSprite.SpriteFrames.SetAnimationLoop(animName, true);
		_animatedSprite.Play(animName);
	}

	/// <summary>播放指定动画（不循环），播完自动停止</summary>
	public void PlayOnce(string animName)
	{
		if (_animatedSprite == null) return;
		if (_animatedSprite.Animation == animName && _animatedSprite.IsPlaying()) return;

		if (_animatedSprite.SpriteFrames == null)
		{
			GD.PrintErr($"[SpriteSheet] PlayOnce(\"{animName}\") 失败: SpriteFrames 为空");
			return;
		}

		if (!_animatedSprite.SpriteFrames.HasAnimation(animName))
		{
			GD.PrintErr($"[SpriteSheet] PlayOnce(\"{animName}\") 失败: 动画不存在, 可用: [{string.Join(", ", _animatedSprite.SpriteFrames.GetAnimationNames())}]");
			return;
		}

		_animatedSprite.SpriteFrames.SetAnimationLoop(animName, false);
		_animatedSprite.Play(animName);
	}

	/// <summary>停止播放</summary>
	public void Stop()
	{
		_animatedSprite?.Stop();
	}

	/// <summary>设置水平翻转</summary>
	public void SetFlipH(bool flip)
	{
		if (_animatedSprite != null)
			_animatedSprite.FlipH = flip;
	}

	/// <summary>设置播放速度倍率</summary>
	public void SetSpeedScale(float scale)
	{
		if (_animatedSprite != null)
			_animatedSprite.SpeedScale = scale;
	}

	/// <summary>当前播放的动画名</summary>
	public string CurrentAnimation => _animatedSprite?.Animation ?? "";

	/// <summary>是否正在播放</summary>
	public bool IsPlaying => _animatedSprite?.IsPlaying() ?? false;

	/// <summary>当前帧索引</summary>
	public int CurrentFrame => _animatedSprite?.Frame ?? 0;

	/// <summary>当前动画总帧数</summary>
	public int FrameCount
	{
		get
		{
			if (_animatedSprite?.SpriteFrames == null) return 0;
			return _animatedSprite.SpriteFrames.GetFrameCount(_animatedSprite.Animation);
		}
	}

	/// <summary>暴露内部 AnimatedSprite2D 以供高级使用</summary>
	public AnimatedSprite2D AnimatedSprite => _animatedSprite;

	private void EnsureAnimatedSprite()
	{
		if (_animatedSprite != null) return;

		_animatedSprite = new AnimatedSprite2D();
		_animatedSprite.Name = "AnimatedSprite";
		AddChild(_animatedSprite);
		_animatedSprite.Owner = this;
	}

	private void LoadSpriteSheet()
	{
		if (string.IsNullOrEmpty(TpsheetPath)) return;

		var spriteFrames = TpsheetLoader.Load(TpsheetPath, DefaultFps);
		if (spriteFrames != null)
		{
			_animatedSprite.SpriteFrames = spriteFrames;
			_framesLoaded = true;
			GD.Print($"[SpriteSheet] SpriteFrames 加载成功");

			if (!string.IsNullOrEmpty(DefaultAnimation) &&
				spriteFrames.HasAnimation(DefaultAnimation))
			{
				_animatedSprite.Play(DefaultAnimation);
			}
		}
		else
		{
			GD.PrintErr($"[SpriteSheet] SpriteFrames 加载失败");
		}
	}
}
