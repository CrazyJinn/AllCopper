using Godot;

/// <summary>
/// 音频管理器（Autoload）
/// 管理BGM播放/淡入淡出、多通道SFX播放、音量控制
/// </summary>
[GlobalClass]
public partial class AudioManager : Node
{
    public static AudioManager Instance { get; private set; }

    /// <summary>SFX通道数量</summary>
    public const int SfxChannelCount = 8;

    private AudioStreamPlayer _bgmPlayer;
    private AudioStreamPlayer[] _sfxPlayers;
    private float _bgmVolume = 1f;
    private float _sfxVolume = 1f;
    private Tween _bgmFadeTween;

    public override void _Ready()
    {
        Instance = this;

        // BGM 播放器
        _bgmPlayer = new AudioStreamPlayer();
        _bgmPlayer.Name = "BGMPlayer";
        AddChild(_bgmPlayer);

        // SFX 多通道播放器
        _sfxPlayers = new AudioStreamPlayer[SfxChannelCount];
        for (int i = 0; i < SfxChannelCount; i++)
        {
            _sfxPlayers[i] = new AudioStreamPlayer();
            _sfxPlayers[i].Name = $"SFXPlayer_{i}";
            AddChild(_sfxPlayers[i]);
        }
    }

    /// <summary>
    /// 播放BGM（带淡入）
    /// </summary>
    /// <param name="path">音频资源路径</param>
    /// <param name="fadeTime">淡入时间（秒）</param>
    public void PlayBGM(string path, float fadeTime = 1f)
    {
        var stream = GD.Load<AudioStream>(path);
        if (stream == null)
        {
            GD.PrintErr($"[AudioManager] BGM not found: {path}");
            return;
        }

        // 淡出当前BGM
        if (_bgmPlayer.Playing)
        {
            _bgmFadeTween?.Kill();
            _bgmFadeTween = CreateTween();
            _bgmFadeTween.TweenProperty(_bgmPlayer, "volume_db", -80f, fadeTime);
            _bgmFadeTween.TweenCallback(Callable.From(() =>
            {
                _bgmPlayer.Stream = stream;
                _bgmPlayer.VolumeDb = Mathf.LinearToDb(_bgmVolume);
                _bgmPlayer.Play();
            }));
        }
        else
        {
            _bgmPlayer.Stream = stream;
            _bgmPlayer.VolumeDb = Mathf.LinearToDb(_bgmVolume);
            _bgmPlayer.Play();
        }
    }

    /// <summary>
    /// 停止BGM（带淡出）
    /// </summary>
    /// <param name="fadeTime">淡出时间（秒）</param>
    public void StopBGM(float fadeTime = 1f)
    {
        if (!_bgmPlayer.Playing) return;

        _bgmFadeTween?.Kill();
        _bgmFadeTween = CreateTween();
        _bgmFadeTween.TweenProperty(_bgmPlayer, "volume_db", -80f, fadeTime);
        _bgmFadeTween.TweenCallback(Callable.From(() => _bgmPlayer.Stop()));
    }

    /// <summary>
    /// 播放SFX音效（自动选择空闲通道）
    /// </summary>
    /// <param name="path">音效资源路径</param>
    /// <param name="volumeDb">音量（dB）</param>
    public void PlaySFX(string path, float volumeDb = 0f)
    {
        var stream = GD.Load<AudioStream>(path);
        if (stream == null)
        {
            GD.PrintErr($"[AudioManager] SFX not found: {path}");
            return;
        }

        // 找到空闲通道
        for (int i = 0; i < SfxChannelCount; i++)
        {
            if (!_sfxPlayers[i].Playing)
            {
                _sfxPlayers[i].Stream = stream;
                _sfxPlayers[i].VolumeDb = Mathf.LinearToDb(_sfxVolume) + volumeDb;
                _sfxPlayers[i].Play();
                return;
            }
        }

        // 全部通道忙碌，强制使用第一个
        _sfxPlayers[0].Stream = stream;
        _sfxPlayers[0].VolumeDb = Mathf.LinearToDb(_sfxVolume) + volumeDb;
        _sfxPlayers[0].Play();
    }

    /// <summary>
    /// 设置BGM音量
    /// </summary>
    /// <param name="linear">线性音量（0~1）</param>
    public void SetMusicVolume(float linear)
    {
        _bgmVolume = Mathf.Clamp(linear, 0f, 1f);
        if (_bgmPlayer.Playing)
        {
            _bgmPlayer.VolumeDb = Mathf.LinearToDb(_bgmVolume);
        }
    }

    /// <summary>
    /// 设置SFX音量
    /// </summary>
    /// <param name="linear">线性音量（0~1）</param>
    public void SetSFXVolume(float linear)
    {
        _sfxVolume = Mathf.Clamp(linear, 0f, 1f);
    }
}
