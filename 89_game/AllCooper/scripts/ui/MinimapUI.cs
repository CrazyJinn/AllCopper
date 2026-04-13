using Godot;

/// <summary>
/// 小地图UI
/// 显示玩家在当前房间中的位置
/// </summary>
[GlobalClass]
public partial class MinimapUI : Control
{
    private TextureRect _mapImage;
    private Sprite2D _playerDot;
    private Vector2 _mapScale = Vector2.One;

    public override void _Ready()
    {
        BuildScene();
    }

    /// <summary>
    /// 设置地图图片和世界尺寸
    /// </summary>
    /// <param name="mapTexture">地图贴图</param>
    /// <param name="worldSize">世界尺寸（用于坐标映射）</param>
    public void SetMap(Texture2D mapTexture, Vector2 worldSize)
    {
        if (_mapImage != null)
        {
            _mapImage.Texture = mapTexture;
        }

        if (mapTexture != null && worldSize.Length() > 0)
        {
            _mapScale = new Vector2(mapTexture.GetWidth(), mapTexture.GetHeight()) / worldSize;
        }
    }

    /// <summary>
    /// 更新玩家位置
    /// </summary>
    /// <param name="pos">世界坐标位置</param>
    public void UpdatePlayerPosition(Vector2 pos)
    {
        if (_playerDot != null)
        {
            _playerDot.Position = pos * _mapScale;
        }
    }

    /// <summary>
    /// 代码构建子节点
    /// </summary>
    private void BuildScene()
    {
        CustomMinimumSize = new Vector2(150, 150);

        var border = new Panel();
        border.Name = "Border";
        border.SetAnchorsPreset(Control.LayoutPreset.FullRect);
        AddChild(border);
        border.Owner = this;

        _mapImage = new TextureRect();
        _mapImage.Name = "MapImage";
        _mapImage.SetAnchorsPreset(Control.LayoutPreset.FullRect);
        _mapImage.StretchMode = TextureRect.StretchModeEnum.KeepAspectCentered;
        AddChild(_mapImage);
        _mapImage.Owner = this;

        _playerDot = new Sprite2D();
        _playerDot.Name = "PlayerDot";
        // 使用简单圆形作为玩家标记
        var dotTexture = ImageTexture.CreateFromImage(
            Image.CreateEmpty(8, 8, false, Image.Format.Rgba8)
        );
        _playerDot.Texture = dotTexture;
        AddChild(_playerDot);
        _playerDot.Owner = this;
    }
}
