# Mermaid流程图解析指南

本指南说明如何从README的mermaid流程图中提取工作流定义。

## Mermaid结构分析

### 基本语法

```mermaid
flowchart TB
    %% 节点定义
    A1[节点名称]           %% 方形节点
    B1(圆角节点)           %% 圆角节点

    %% 子图定义
    subgraph S1["子图标题"]
        A1
        B1
    end

    %% 连接关系
    A1 --> B1              %% 单向连接
    A1 & A2 --> B1         %% 多对一连接

    %% 样式定义
    classDef manual fill:#ffebee,stroke:#c62828
    class S6t2i人工 manual  %% 应用样式到子图
```

### 解析要点

#### 1. 提取子图（阶段）

```python
import re

def extract_subgraphs(mermaid_code):
    """提取所有子图定义"""
    pattern = r'subgraph\s+(\w+)\["(.+?)"\]'
    matches = re.findall(pattern, mermaid_code)
    return {id: name for id, name in matches}
```

#### 2. 提取节点（产出物）

```python
def extract_nodes(mermaid_code):
    """提取所有节点定义"""
    pattern = r'(\w+)\[(.+?)\]'
    matches = re.findall(pattern, mermaid_code)
    return {id: name for id, name in matches}
```

#### 3. 提取依赖关系

```python
def extract_dependencies(mermaid_code):
    """提取节点间的依赖关系"""
    deps = {}
    lines = mermaid_code.split('\n')

    for line in lines:
        if '-->' in line:
            # 解析 A1 & A2 --> B1 格式
            parts = line.split('-->')
            if len(parts) == 2:
                sources = re.findall(r'(\w+)', parts[0])
                targets = re.findall(r'(\w+)', parts[1])
                for target in targets:
                    if target not in deps:
                        deps[target] = []
                    deps[target].extend(sources)

    return deps
```

#### 4. 提取样式类（执行方式）

```python
def extract_styles(mermaid_code):
    """提取样式定义和应用"""
    styles = {}
    class_apps = {}

    # 解析样式定义
    style_pattern = r'classDef\s+(\w+)\s+fill:(#[a-fA-F0-9]+)'
    for match in re.finditer(style_pattern, mermaid_code):
        class_name, color = match.groups()
        styles[class_name] = color

    # 解析样式应用
    app_pattern = r'class\s+(\S+)\s+(\w+)'
    for match in re.finditer(app_pattern, mermaid_code):
        targets, class_name = match.groups()
        for target in targets.split(','):
            class_apps[target] = class_name

    return styles, class_apps
```

## 样式类映射

根据README中的样式定义：

| 样式类 | 颜色 | 含义 | 执行方式 |
|--------|------|------|----------|
| `manual` | #ffebee (红) | 纯人工处理 | **人工** |
| `semi` | #fff3e0 (橙) | AI辅助 | API:xxx |
| `auto` | #e8f5e9 (绿) | 自动化 | skill:xxx |
| `input` | #e3f2fd (蓝) | 输入资料 | - |

## 当前项目流程结构

从README解析出的结构：

```
阶段列表:
S0前期准备 → 游戏概览, 世界设定, 剧本大纲
S1需求分析 → 游戏基本信息, 角色需求, 场景需求, 音频需求, 代码需求
S2剧本拆解 → 剧本, 立绘提示词, 动画提示词
S3角色设计 → 角色设计图提示词
S4场景设计 → 大地图, 游戏场景, 对话背景, UI背景
S5代码需求分析 → 需求分析文档
S6t2i人工 → 角色设计图.png [manual]
S7t2iapi → 场景图片.png [auto]
S8i2i图片 → 立绘.png, 动画.png [semi]
S9i2i人工 → Q版设计图.png [manual]
S10i2vapi → Q版动画视频.mp4 [semi]
S11精灵帧提取 → 精灵帧序列, 精灵图集 [auto]
S12音频实现 → BGM, 音效 [auto]
S13代码生成 → 游戏代码 [auto]
S14资源搬运 → 游戏assets目录 [auto]
S15游戏组装 → 游戏成品 [manual]
S16剧本组装 → 剧本.json [manual]
```

## 拓扑排序

生成执行计划时，需要对受影响节点进行拓扑排序：

```python
from collections import deque

def topological_sort(nodes, dependencies):
    """拓扑排序，返回执行顺序"""
    in_degree = {node: 0 for node in nodes}
    result = []

    # 计算入度
    for node in nodes:
        if node in dependencies:
            in_degree[node] = len([d for d in dependencies[node] if d in nodes])

    # BFS
    queue = deque([n for n in nodes if in_degree[n] == 0])
    while queue:
        current = queue.popleft()
        result.append(current)

        for node in nodes:
            if current in dependencies.get(node, []):
                in_degree[node] -= 1
                if in_degree[node] == 0:
                    queue.append(node)

    return result if len(result) == len(nodes) else None  # 有环则返回None
```

## 影响传播算法

```python
def propagate_impact(start_nodes, dependencies):
    """从起点节点传播影响，返回所有受影响节点"""
    affected = set(start_nodes)
    reverse_deps = build_reverse_dependencies(dependencies)

    queue = deque(start_nodes)
    while queue:
        current = queue.popleft()
        downstream = reverse_deps.get(current, [])
        for node in downstream:
            if node not in affected:
                affected.add(node)
                queue.append(node)

    return affected

def build_reverse_dependencies(dependencies):
    """构建反向依赖图（谁依赖我 → 我影响谁）"""
    reverse = {}
    for target, sources in dependencies.items():
        for source in sources:
            if source not in reverse:
                reverse[source] = []
            reverse[source].append(target)
    return reverse
```
