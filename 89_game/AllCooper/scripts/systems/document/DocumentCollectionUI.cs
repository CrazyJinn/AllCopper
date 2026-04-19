using System.Collections.Generic;
using Godot;

/// <summary>
/// 文献收集UI
/// 显示已收集的文献列表，支持查看详情
/// </summary>
[GlobalClass]
public partial class DocumentCollectionUI : Control
{
    // ===== 信号 =====

    [Signal]
    public delegate void DocumentSelectedEventHandler(string docId);

    // ===== 私有字段 =====

    private readonly HashSet<string> _collectedIds = new();
    private ItemList _docList;
    private RichTextLabel _docContent;

    public override void _Ready()
    {
        BuildScene();
        EventBus.OnDocumentCollected += OnDocumentCollected;
    }

    public override void _ExitTree()
    {
        EventBus.OnDocumentCollected -= OnDocumentCollected;
    }

    /// <summary>
    /// 刷新文献列表显示
    /// </summary>
    public void RefreshCollection()
    {
        _docList?.Clear();

        foreach (var docId in _collectedIds)
        {
            _docList?.AddItem(docId);
        }
    }

    /// <summary>
    /// 显示指定文献的详情
    /// </summary>
    /// <param name="docId">文献ID</param>
    public void ShowDocument(string docId)
    {
        var docData = GD.Load<DocumentData>($"res://data/documents/{docId}.tres");
        if (docData != null && _docContent != null)
        {
            _docContent.Text = $"[b]{docData.Title}[/b]\n\n{docData.Content}";
        }
    }

    /// <summary>
    /// 文献收集事件回调
    /// </summary>
    private void OnDocumentCollected(string docId)
    {
        _collectedIds.Add(docId);
        RefreshCollection();
    }

    /// <summary>
    /// 代码构建子节点
    /// </summary>
    private void BuildScene()
    {
        SetAnchorsPreset(Control.LayoutPreset.FullRect);

        var container = new HBoxContainer();
        container.SetAnchorsAndOffsetsPreset(Control.LayoutPreset.FullRect, Control.LayoutPresetMode.KeepSize, 40);
        AddChild(container);
        container.Owner = this;

        _docList = new ItemList { Name = "DocList", CustomMinimumSize = new Vector2(250, 0) };
        _docList.ItemSelected += (idx) =>
        {
            string docId = _docList.GetItemText((int)idx);
            ShowDocument(docId);
            EmitSignal(SignalName.DocumentSelected, docId);
        };
        container.AddChild(_docList);
        _docList.Owner = this;

        _docContent = new RichTextLabel();
        _docContent.Name = "DocContent";
        _docContent.BbcodeEnabled = true;
        _docContent.SizeFlagsHorizontal = Control.SizeFlags.ExpandFill;
        container.AddChild(_docContent);
        _docContent.Owner = this;
    }
}
