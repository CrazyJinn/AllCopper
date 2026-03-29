#!/usr/bin/env python3
"""
火山引擎豆包图片生成API - 一体化脚本

支持文生图和图生图两种模式，使用统一的 API 接口。

使用方式:
    # 文生图
    python doubao_api.py submit "提示词" --size 2048x2048
    python doubao_api.py submit "提示词" --model doubao-seedream-4.5 --size 2K

    # 图生图
    python doubao_api.py submit "提示词" --image ./设计图.jpg
    python doubao_api.py submit "提示词" --image-url https://xxx.jpg --model doubao-seededit-3.0-i2i

    # 查询和下载
    python doubao_api.py query <task_id>
    python doubao_api.py download <url> <output_path>
    python doubao_api.py wait <json_result> <output_path>
"""

import base64
import json
import os
import sys
import time
from pathlib import Path
from typing import Optional, List, Dict, Any

import requests


def load_settings() -> dict:
    """从项目根目录的 settings.json 加载配置"""
    script_dir = Path(__file__).parent
    # 脚本在 .claude/skills/图片生成(api)/scripts/ 下，需要往上4级到项目根目录
    settings_path = script_dir.parent.parent.parent.parent / "settings.json"

    if not settings_path.exists():
        raise FileNotFoundError(f"配置文件不存在: {settings_path}")

    with open(settings_path, "r", encoding="utf-8") as f:
        return json.load(f)


# 加载配置
_settings = load_settings()

# API配置
API_BASE_URL = "https://ark.cn-beijing.volces.com/api/v3"
IMAGES_ENDPOINT = f"{API_BASE_URL}/images/generations"

# API密钥
API_KEY = _settings.get("doubao_api_key", "")

# 默认模型
DEFAULT_MODEL = _settings.get("doubao_model", "doubao-seedream-5.0-lite")


def get_headers() -> dict:
    """获取请求头"""
    return {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json",
    }


def image_to_base64(image_path: str) -> str:
    """将本地图片转换为base64格式"""
    with open(image_path, "rb") as f:
        data = base64.b64encode(f.read()).decode("utf-8")

    # 根据文件扩展名确定 MIME 类型
    ext = Path(image_path).suffix.lower()
    mime_types = {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".webp": "image/webp",
        ".bmp": "image/bmp",
        ".tiff": "image/tiff",
        ".gif": "image/gif",
    }
    mime_type = mime_types.get(ext, "image/jpeg")
    return f"data:{mime_type};base64,{data}"


def submit_task(
    prompt: str,
    model: str = DEFAULT_MODEL,
    size: str = "2048x2048",
    image: Optional[str] = None,
    image_url: Optional[str] = None,
    seed: int = -1,
    guidance_scale: Optional[float] = None,
    response_format: str = "url",
    output_format: str = "jpeg",
    watermark: bool = False,
    stream: bool = False,
    sequential_image_generation: str = "disabled",
    max_images: int = 1,
) -> dict:
    """
    提交图片生成任务

    Args:
        prompt: 提示词
        model: 模型名称
        size: 输出尺寸，如 "2048x2048" 或 "2K"
        image: 本地图片路径（图生图）
        image_url: 图片URL（图生图）
        seed: 随机种子（仅3.0-t2i/seededit-3.0-i2i支持）
        guidance_scale: 文本权重（仅3.0-t2i/seededit-3.0-i2i支持）
        response_format: 返回格式，"url" 或 "b64_json"
        output_format: 输出格式，"jpeg" 或 "png"（仅5.0-lite支持）
        watermark: 是否添加水印
        stream: 是否流式输出
        sequential_image_generation: 组图模式，"auto" 或 "disabled"
        max_images: 组图最大图片数

    Returns:
        API 返回结果
    """
    body: Dict[str, Any] = {
        "model": model,
        "prompt": prompt,
        "response_format": response_format,
        "watermark": watermark,
    }

    # 尺寸设置
    body["size"] = size

    # 图生图：添加输入图片
    if image:
        body["image"] = image_to_base64(image)
    elif image_url:
        body["image"] = image_url

    # 模型特定参数
    if model in ["doubao-seedream-3.0-t2i", "doubao-seededit-3.0-i2i"]:
        body["seed"] = seed
        if guidance_scale is not None:
            body["guidance_scale"] = guidance_scale
    else:
        # 5.0-lite/4.5/4.0 支持组图和流式输出
        body["stream"] = stream
        body["sequential_image_generation"] = sequential_image_generation
        if sequential_image_generation == "auto":
            body["sequential_image_generation_options"] = {
                "max_images": max_images
            }
        # 5.0-lite 支持 output_format
        if model == "doubao-seedream-5.0-lite":
            body["output_format"] = output_format

    response = requests.post(
        IMAGES_ENDPOINT,
        headers=get_headers(),
        json=body,
        timeout=120,
    )

    result = response.json()

    if response.status_code != 200:
        raise Exception(f"API请求失败: {result}")

    return result


def query_task(task_id: str) -> dict:
    """
    查询任务状态（兼容旧版 API）

    注意：新版 API 是同步的，不需要查询。
    此方法保留用于向后兼容。
    """
    return {
        "status": "done",
        "message": "新版 API 同步返回结果，无需查询",
        "task_id": task_id
    }


def download_image(url: str, output_path: str) -> str:
    """下载图片到指定路径"""
    response = requests.get(url, timeout=60)
    response.raise_for_status()

    # 确保目录存在
    Path(output_path).parent.mkdir(parents=True, exist_ok=True)

    with open(output_path, "wb") as f:
        f.write(response.content)

    return output_path


def wait_and_download(
    result: dict,
    output_path: str,
    poll_interval: int = 10,
    max_wait: int = 300
) -> dict:
    """
    等待任务完成并下载图片

    注意：新版 API 是同步的，直接从返回结果中提取图片 URL。

    Args:
        result: submit_task 的返回结果
        output_path: 输出路径
        poll_interval: 轮询间隔（保留参数，新版 API 不需要）
        max_wait: 最大等待时间（保留参数，新版 API 不需要）

    Returns:
        包含状态和信息的字典
    """
    # 检查是否有错误
    if "error" in result:
        return {
            "status": "error",
            "message": result["error"].get("message", "未知错误"),
            "code": result["error"].get("code")
        }

    # 获取图片数据
    data_list = result.get("data", [])
    if not data_list:
        return {"status": "error", "message": "返回结果中没有图片数据"}

    # 检查每张图片是否有错误
    downloaded_paths = []
    for i, item in enumerate(data_list):
        if "error" in item:
            error = item["error"]
            return {
                "status": "error",
                "message": f"图片{i+1}生成失败: {error.get('message', '未知错误')}",
                "code": error.get("code")
            }

        # 获取图片 URL 或 base64 数据
        if "url" in item:
            url = item["url"]
            # 为多图生成添加序号
            if len(data_list) > 1:
                path = Path(output_path)
                save_path = str(path.parent / f"{path.stem}_{i+1}{path.suffix}")
            else:
                save_path = output_path

            download_image(url, save_path)
            downloaded_paths.append(save_path)
        elif "b64_json" in item:
            # 处理 base64 数据
            b64_data = item["b64_json"]
            img_data = base64.b64decode(b64_data)

            if len(data_list) > 1:
                path = Path(output_path)
                save_path = str(path.parent / f"{path.stem}_{i+1}{path.suffix}")
            else:
                save_path = output_path

            Path(save_path).parent.mkdir(parents=True, exist_ok=True)
            with open(save_path, "wb") as f:
                f.write(img_data)
            downloaded_paths.append(save_path)

    if downloaded_paths:
        return {
            "status": "done",
            "image_path": downloaded_paths[0] if len(downloaded_paths) == 1 else downloaded_paths,
            "image_paths": downloaded_paths,
            "generated_images": result.get("usage", {}).get("generated_images", len(downloaded_paths))
        }
    else:
        return {"status": "error", "message": "未能获取图片数据"}


def parse_size(size_str: str) -> str:
    """解析尺寸参数"""
    size_str = size_str.strip()

    # 预设分辨率
    presets = {
        "1k": "1024x1024",
        "2k": "2048x2048",
        "3k": "3072x3072",
        "4k": "4096x4096",
    }

    lower = size_str.lower()
    if lower in presets:
        return presets[lower]

    # 像素格式 (如 2048x2048)
    if "x" in size_str.lower():
        return size_str

    # 默认返回原值
    return size_str


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)

    command = sys.argv[1]

    if command == "submit":
        if len(sys.argv) < 3:
            print("用法: python doubao_api.py submit <prompt> [options]")
            print("")
            print("选项:")
            print("  --model <name>       模型名称 (默认: doubao-seedream-5.0-lite)")
            print("  --size <WxH|preset>  输出尺寸 (如 2048x2048 或 2K)")
            print("  --image <path>       本地图片路径 (图生图)")
            print("  --image-url <url>    图片URL (图生图)")
            print("  --seed <int>         随机种子 (仅3.0-t2i/seededit-3.0-i2i)")
            print("  --guidance-scale <n> 文本权重 1-10 (仅3.0-t2i/seededit-3.0-i2i)")
            print("  --response-format    url 或 b64_json (默认: url)")
            print("  --output-format      jpeg 或 png (仅5.0-lite, 默认: jpeg)")
            print("  --no-watermark       禁用水印")
            print("  --sequential auto    启用组图模式")
            print("  --max-images <n>     组图最大图片数 (默认: 1)")
            sys.exit(1)

        prompt = sys.argv[2]
        model = DEFAULT_MODEL
        size = "2048x2048"
        image = None
        image_url = None
        seed = -1
        guidance_scale = None
        response_format = "url"
        output_format = "jpeg"
        watermark = False
        sequential_image_generation = "disabled"
        max_images = 1

        i = 3
        while i < len(sys.argv):
            arg = sys.argv[i]
            if arg == "--model" and i + 1 < len(sys.argv):
                model = sys.argv[i + 1]
                i += 2
            elif arg == "--size" and i + 1 < len(sys.argv):
                size = parse_size(sys.argv[i + 1])
                i += 2
            elif arg == "--image" and i + 1 < len(sys.argv):
                image = sys.argv[i + 1]
                i += 2
            elif arg == "--image-url" and i + 1 < len(sys.argv):
                image_url = sys.argv[i + 1]
                i += 2
            elif arg == "--seed" and i + 1 < len(sys.argv):
                seed = int(sys.argv[i + 1])
                i += 2
            elif arg == "--guidance-scale" and i + 1 < len(sys.argv):
                guidance_scale = float(sys.argv[i + 1])
                i += 2
            elif arg == "--response-format" and i + 1 < len(sys.argv):
                response_format = sys.argv[i + 1]
                i += 2
            elif arg == "--output-format" and i + 1 < len(sys.argv):
                output_format = sys.argv[i + 1]
                i += 2
            elif arg == "--no-watermark":
                watermark = False
                i += 1
            elif arg == "--sequential" and i + 1 < len(sys.argv):
                sequential_image_generation = sys.argv[i + 1]
                i += 2
            elif arg == "--max-images" and i + 1 < len(sys.argv):
                max_images = int(sys.argv[i + 1])
                sequential_image_generation = "auto"
                i += 2
            else:
                i += 1

        try:
            result = submit_task(
                prompt=prompt,
                model=model,
                size=size,
                image=image,
                image_url=image_url,
                seed=seed,
                guidance_scale=guidance_scale,
                response_format=response_format,
                output_format=output_format,
                watermark=watermark,
                sequential_image_generation=sequential_image_generation,
                max_images=max_images,
            )
            print(json.dumps(result, indent=2, ensure_ascii=False))
        except Exception as e:
            print(json.dumps({"error": str(e)}, ensure_ascii=False))
            sys.exit(1)

    elif command == "query":
        if len(sys.argv) < 3:
            print("用法: python doubao_api.py query <task_id>")
            print("注意: 新版 API 是同步返回的，此命令保留用于兼容")
            sys.exit(1)

        task_id = sys.argv[2]
        result = query_task(task_id)
        print(json.dumps(result, indent=2, ensure_ascii=False))

    elif command == "download":
        if len(sys.argv) < 4:
            print("用法: python doubao_api.py download <url> <output_path>")
            sys.exit(1)

        url = sys.argv[2]
        output_path = sys.argv[3]
        try:
            download_image(url, output_path)
            print(json.dumps({"status": "success", "path": output_path}, ensure_ascii=False))
        except Exception as e:
            print(json.dumps({"status": "error", "message": str(e)}, ensure_ascii=False))
            sys.exit(1)

    elif command == "wait":
        if len(sys.argv) < 4:
            print("用法: python doubao_api.py wait '<json_result>' <output_path>")
            print("示例: python doubao_api.py wait '{\"data\":[{\"url\":\"...\"}]}' ./output.jpg")
            sys.exit(1)

        json_result = sys.argv[2]
        output_path = sys.argv[3]

        try:
            result = json.loads(json_result)
        except json.JSONDecodeError:
            print(json.dumps({"status": "error", "message": "无效的 JSON 输入"}, ensure_ascii=False))
            sys.exit(1)

        poll_interval = 10
        max_wait = 300

        if "--interval" in sys.argv:
            idx = sys.argv.index("--interval")
            if idx + 1 < len(sys.argv):
                poll_interval = int(sys.argv[idx + 1])

        if "--max-wait" in sys.argv:
            idx = sys.argv.index("--max-wait")
            if idx + 1 < len(sys.argv):
                max_wait = int(sys.argv[idx + 1])

        result = wait_and_download(result, output_path, poll_interval, max_wait)
        print(json.dumps(result, ensure_ascii=False))

    else:
        print(f"未知命令: {command}")
        print("可用命令: submit, query, download, wait")
        sys.exit(1)


if __name__ == "__main__":
    main()
