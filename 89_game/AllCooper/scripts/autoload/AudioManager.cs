using Godot;

/// <summary>
/// 音频管理器 - Autoload单例
/// BGM淡入淡出切换、音效多通道播放、分通道音量控制
/// </summary>
public partial class AudioManager : Node
{
    public static AudioManager Instance { get; private set; }

    [Signal] public delegate void BgmChangedEventHandler(string bgmId);

    public bool IsPlaying => _bgmPlayer?.Playing ?? false;

    private AudioStreamPlayer _bgmPlayer;
    private AudioStreamPlayer _bgmFadePlayer;
    private Node _sfxPool;

    private float _masterVolume = 1f;
    private float _bgmVolume = 0.8f;
    private float _sfxVolume = 1f;

    private const int MaxSfxChannels = 8;
    private const float BgmFadeDuration = 1f;
    private float _bgmFadeTimer;
    private bool _bgmFading;
    private string _pendingBgm;

    public override void _EnterTree()
    {
        Instance = this;
    }

    public override void _Ready()
    {
        _bgmPlayer = new AudioStreamPlayer { Name = "BGMPlayer" };
        _bgmFadePlayer = new AudioStreamPlayer { Name = "BGMFadePlayer" };
        _sfxPool = new Node { Name = "SFXPool" };

        AddChild(_bgmPlayer);
        AddChild(_bgmFadePlayer);
        AddChild(_sfxPool);

        for (int i = 0; i < MaxSfxChannels; i++)
        {
            var player = new AudioStreamPlayer { Name = $"SFX_{i}" };
            _sfxPool.AddChild(player);
        }
    }

    public override void _Process(double delta)
    {
        if (!_bgmFading) return;

        _bgmFadeTimer += (float)delta;
        float t = _bgmFadeTimer / BgmFadeDuration;

        if (t >= 1f)
        {
            _bgmPlayer.Stream = _bgmFadePlayer.Stream;
            _bgmPlayer.Play();
            _bgmPlayer.VolumeDb = Mathf.LinearToDb(_bgmVolume * _masterVolume);
            _bgmFadePlayer.Stop();
            _bgmFading = false;
            EmitSignal(SignalName.BgmChanged, _pendingBgm);
        }
        else
        {
            _bgmPlayer.VolumeDb = Mathf.LinearToDb((1f - t) * _bgmVolume * _masterVolume);
            _bgmFadePlayer.VolumeDb = Mathf.LinearToDb(t * _bgmVolume * _masterVolume);
        }
    }

    /// <summary>播放BGM，支持淡入淡出</summary>
    public void PlayBgm(string resourcePath, string bgmId = "")
    {
        var stream = GD.Load<AudioStream>(resourcePath);
        if (stream == null) return;

        _pendingBgm = bgmId;

        if (_bgmPlayer.Playing)
        {
            _bgmFadePlayer.Stream = stream;
            _bgmFadePlayer.Play();
            _bgmFadeTimer = 0f;
            _bgmFading = true;
        }
        else
        {
            _bgmPlayer.Stream = stream;
            _bgmPlayer.VolumeDb = Mathf.LinearToDb(_bgmVolume * _masterVolume);
            _bgmPlayer.Play();
            EmitSignal(SignalName.BgmChanged, bgmId);
        }
    }

    /// <summary>播放音效</summary>
    public void PlaySfx(string resourcePath)
    {
        var stream = GD.Load<AudioStream>(resourcePath);
        if (stream == null) return;

        foreach (AudioStreamPlayer player in _sfxPool.GetChildren())
        {
            if (!player.Playing)
            {
                player.Stream = stream;
                player.VolumeDb = Mathf.LinearToDb(_sfxVolume * _masterVolume);
                player.Play();
                return;
            }
        }
    }

    /// <summary>停止BGM</summary>
    public void StopBgm()
    {
        _bgmPlayer.Stop();
        _bgmFadePlayer.Stop();
        _bgmFading = false;
    }

    public void SetMasterVolume(float volume) => _masterVolume = Mathf.Clamp(volume, 0f, 1f);
    public void SetBgmVolume(float volume) => _bgmVolume = Mathf.Clamp(volume, 0f, 1f);
    public void SetSfxVolume(float volume) => _sfxVolume = Mathf.Clamp(volume, 0f, 1f);
}
