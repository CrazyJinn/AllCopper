using Godot;

/// <summary>
/// 过场播放器 - 图片序列自动播放
/// </summary>
public partial class CutscenePlayer : CanvasLayer
{
    [Signal] public delegate void CutsceneStartedEventHandler(string cutsceneId);
    [Signal] public delegate void CutsceneEndedEventHandler(string cutsceneId);
    [Signal] public delegate void CutsceneSkippedEventHandler(string cutsceneId);

    public bool IsPlaying { get; private set; }
    public int CurrentFrame { get; private set; }

    private TextureRect _display;
    private Texture2D[] _frames;
    private string _cutsceneId;
    private float _frameInterval = 3f;
    private float _frameTimer;
    private bool _canSkip = true;

    public override void _Ready()
    {
        Layer = 50;

        _display = new TextureRect { Name = "Display" };
        _display.SetAnchorsPreset(Control.LayoutPreset.FullRect);
        _display.StretchMode = TextureRect.StretchModeEnum.KeepAspectCentered;
        _display.MouseFilter = Control.MouseFilterEnum.Stop;
        AddChild(_display);
    }

    public override void _Process(double delta)
    {
        if (!IsPlaying || _frames == null) return;

        _frameTimer += (float)delta;
        if (_frameTimer >= _frameInterval)
        {
            _frameTimer = 0f;
            CurrentFrame++;

            if (CurrentFrame >= _frames.Length)
            {
                End();
            }
            else
            {
                _display.Texture = _frames[CurrentFrame];
            }
        }
    }

    public override void _Input(InputEvent @event)
    {
        if (!IsPlaying || !_canSkip) return;

        if (@event.IsActionPressed("ui_cancel") || @event.IsActionPressed("interact"))
        {
            Skip();
        }
    }

    /// <summary>播放过场</summary>
    public void Play(string cutsceneId, Texture2D[] frames, float frameInterval = 3f)
    {
        _cutsceneId = cutsceneId;
        _frames = frames;
        _frameInterval = frameInterval;

        if (_frames == null || _frames.Length == 0)
        {
            EmitSignal(SignalName.CutsceneEnded, cutsceneId);
            return;
        }

        IsPlaying = true;
        CurrentFrame = 0;
        _frameTimer = 0f;
        _display.Texture = _frames[0];
        _display.Visible = true;

        GameManager.Instance?.ChangeState(GameEnums.GameState.Cutscene);
        EmitSignal(SignalName.CutsceneStarted, cutsceneId);
    }

    /// <summary>跳过过场</summary>
    public void Skip()
    {
        EmitSignal(SignalName.CutsceneSkipped, _cutsceneId);
        End();
    }

    private void End()
    {
        IsPlaying = false;
        _display.Visible = false;
        _display.Texture = null;
        _frames = null;

        EmitSignal(SignalName.CutsceneEnded, _cutsceneId);
        GameManager.Instance?.RestorePreviousState();
    }
}
