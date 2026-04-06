#!/usr/bin/env python3
"""
火山引擎 Seedance 视频生成 API - 异步脚本

支持图生视频（首帧/首尾帧）和文生视频。

使用方式:
    # 图生视频 - 首帧模式
    python seedance_api.py submit --first-frame ./image.png --prompt "提示词"
    python seedance_api.py submit --first-frame ./image.png --prompt "提示词" --last-frame ./end.png

    # 文生视频
    python seedance_api.py submit --prompt "提示词" --text-only

    # 查询任务
    python seedance_api.py query <task_id>

    # 下载视频
    python seedance_api.py download <video_url> <output_path>

    # 等待并下载（轮询直到完成）
    python seedance_api.py wait <task_id> <output_path>
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
    """从项目根目录 settings.json 加载配置（支持 // 注释）"""
    import re
    script_dir = Path(__file__).parent
    settings_path = script_dir.parent.parent.parent.parent / "settings.json"

    if not settings_path.exists():
        raise FileNotFoundError(f"配置文件不存在: {settings_path}")

    with open(settings_path, "r", encoding="utf-8") as f:
        text = f.read()
    # 移除单行注释
    text = re.sub(r'//[^\n]*', '', text)
    return json.loads(text)


_settings = load_settings()
_seedance = _settings.get("seedance", {})

API_BASE_URL = "https://ark.cn-beijing.volces.com/api/v3"
TASKS_ENDPOINT = f"{API_BASE_URL}/contents/generations/tasks"

API_KEY = _settings.get("doubao_api_key", "")
DEFAULT_MODEL = _seedance.get("model", "doubao-seedance-2-0-260128")
DEFAULT_RESOLUTION = _seedance.get("resolution", "720p")
DEFAULT_RATIO = _seedance.get("ratio", "adaptive")
DEFAULT_DURATION = _seedance.get("duration", 5)


def get_headers() -> dict:
    return {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json",
    }


def image_to_base64(image_path: str) -> str:
    """本地图片转 base64"""
    with open(image_path, "rb") as f:
        data = base64.b64encode(f.read()).decode("utf-8")

    ext = Path(image_path).suffix.lower()
    mime_types = {
        ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png",
        ".webp": "image/webp", ".bmp": "image/bmp",
        ".tiff": "image/tiff", ".gif": "image/gif",
    }
    mime_type = mime_types.get(ext, "image/jpeg")
    return f"data:{mime_type};base64,{data}"


def submit_task(
    prompt: Optional[str] = None,
    first_frame: Optional[str] = None,
    first_frame_url: Optional[str] = None,
    last_frame: Optional[str] = None,
    last_frame_url: Optional[str] = None,
    reference_images: Optional[List[str]] = None,
    reference_video: Optional[str] = None,
    reference_audio: Optional[str] = None,
    text_only: bool = False,
    model: str = DEFAULT_MODEL,
    resolution: str = "720p",
    ratio: str = "adaptive",
    duration: int = 5,
    seed: int = -1,
    camera_fixed: bool = False,
    watermark: bool = False,
    generate_audio: bool = False,
    return_last_frame: bool = False,
) -> dict:
    """
    提交视频生成任务（异步）。

    Returns:
        包含 task_id 的字典
    """
    content: List[Dict[str, Any]] = []

    # 文本提示词
    if prompt:
        content.append({"type": "text", "text": prompt})

    # 首帧图片
    if first_frame:
        url = image_to_base64(first_frame)
        content.append({"type": "image_url", "image_url": {"url": url}, "role": "first_frame"})
    elif first_frame_url:
        content.append({"type": "image_url", "image_url": {"url": first_frame_url}, "role": "first_frame"})

    # 尾帧图片
    if last_frame:
        url = image_to_base64(last_frame)
        content.append({"type": "image_url", "image_url": {"url": url}, "role": "last_frame"})
    elif last_frame_url:
        content.append({"type": "image_url", "image_url": {"url": last_frame_url}, "role": "last_frame"})

    # 参考图片（Seedance 2.0 / 1.0 lite）
    if reference_images:
        for img_path in reference_images:
            url = image_to_base64(img_path)
            content.append({"type": "image_url", "image_url": {"url": url}, "role": "reference_image"})

    # 参考视频（仅 Seedance 2.0）
    if reference_video:
        content.append({"type": "video_url", "video_url": {"url": reference_video}, "role": "reference_video"})

    # 参考音频（仅 Seedance 2.0）
    if reference_audio:
        content.append({"type": "audio_url", "audio_url": {"url": reference_audio}, "role": "reference_audio"})

    if not text_only and not first_frame and not first_frame_url and not last_frame and not last_frame_url:
        if not reference_images and not reference_video:
            print("WARNING: 未指定图片或视频输入，将执行文生视频", file=sys.stderr)

    body: Dict[str, Any] = {
        "model": model,
        "content": content,
        "resolution": resolution,
        "ratio": ratio,
        "duration": duration,
        "seed": seed,
        "camera_fixed": camera_fixed,
        "watermark": watermark,
        "generate_audio": generate_audio,
        "return_last_frame": return_last_frame,
    }

    response = requests.post(
        TASKS_ENDPOINT,
        headers=get_headers(),
        json=body,
        timeout=60,
    )

    result = response.json()

    if response.status_code not in (200, 201):
        raise Exception(f"API请求失败 (HTTP {response.status_code}): {json.dumps(result, ensure_ascii=False)}")

    return result


def query_task(task_id: str) -> dict:
    """查询视频生成任务状态"""
    url = f"{TASKS_ENDPOINT}/{task_id}"

    response = requests.get(url, headers=get_headers(), timeout=30)
    result = response.json()

    if response.status_code != 200:
        raise Exception(f"查询失败 (HTTP {response.status_code}): {json.dumps(result, ensure_ascii=False)}")

    return result


def download_video(url: str, output_path: str) -> str:
    """下载视频到指定路径"""
    response = requests.get(url, timeout=300, stream=True)
    response.raise_for_status()

    Path(output_path).parent.mkdir(parents=True, exist_ok=True)

    with open(output_path, "wb") as f:
        for chunk in response.iter_content(chunk_size=8192):
            f.write(chunk)

    return output_path


def wait_and_download(
    task_id: str,
    output_path: str,
    poll_interval: int = 15,
    max_wait: int = 1800,
    download_last_frame: bool = False,
) -> dict:
    """
    轮询任务状态直到完成，下载视频。

    Args:
        task_id: 任务ID
        output_path: 视频保存路径
        poll_interval: 轮询间隔（秒）
        max_wait: 最大等待时间（秒）
        download_last_frame: 是否同时下载尾帧图片

    Returns:
        包含状态和路径的字典
    """
    start_time = time.time()

    while True:
        elapsed = time.time() - start_time
        if elapsed > max_wait:
            return {
                "status": "timeout",
                "message": f"等待超时 ({max_wait}s)",
                "task_id": task_id,
            }

        result = query_task(task_id)
        status = result.get("status", "unknown")

        print(f"  任务 {task_id} 状态: {status} (已等待 {int(elapsed)}s)", file=sys.stderr)

        if status == "succeeded":
            # 提取视频URL
            video_url = None
            last_frame_url = None

            content_data = result.get("content", {})
            if isinstance(content_data, dict):
                # content.video_url 是字符串（mp4 URL）
                video_url = content_data.get("video_url")
                # content.last_frame_url 是字符串（png URL）
                if download_last_frame:
                    last_frame_url = content_data.get("last_frame_url")

            if not video_url:
                return {
                    "status": "error",
                    "message": "任务成功但未找到视频URL",
                    "raw_response": result,
                }

            # 下载视频
            download_video(video_url, output_path)

            output = {
                "status": "done",
                "video_path": output_path,
                "video_url": video_url,
                "task_id": task_id,
            }

            # 下载尾帧
            if last_frame_url and download_last_frame:
                lf_path = str(Path(output_path).with_suffix(".last_frame.png"))
                download_video(last_frame_url, lf_path)
                output["last_frame_path"] = lf_path

            return output

        elif status == "failed":
            error_msg = result.get("error", {})
            return {
                "status": "failed",
                "message": f"任务失败: {error_msg}",
                "task_id": task_id,
            }

        elif status == "expired":
            return {
                "status": "expired",
                "message": "任务已过期",
                "task_id": task_id,
            }

        # queued or running - 继续等待
        time.sleep(poll_interval)


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)

    command = sys.argv[1]

    if command == "submit":
        prompt = None
        first_frame = None
        first_frame_url = None
        last_frame = None
        last_frame_url = None
        reference_images = []
        reference_video = None
        reference_audio = None
        text_only = False
        model = DEFAULT_MODEL
        resolution = DEFAULT_RESOLUTION
        ratio = DEFAULT_RATIO
        duration = DEFAULT_DURATION
        seed = -1
        camera_fixed = False
        watermark = False
        generate_audio = False
        return_last_frame = False

        i = 2
        while i < len(sys.argv):
            arg = sys.argv[i]
            if arg == "--prompt" and i + 1 < len(sys.argv):
                prompt = sys.argv[i + 1]
                i += 2
            elif arg == "--first-frame" and i + 1 < len(sys.argv):
                first_frame = sys.argv[i + 1]
                i += 2
            elif arg == "--first-frame-url" and i + 1 < len(sys.argv):
                first_frame_url = sys.argv[i + 1]
                i += 2
            elif arg == "--last-frame" and i + 1 < len(sys.argv):
                last_frame = sys.argv[i + 1]
                i += 2
            elif arg == "--last-frame-url" and i + 1 < len(sys.argv):
                last_frame_url = sys.argv[i + 1]
                i += 2
            elif arg == "--ref-image" and i + 1 < len(sys.argv):
                reference_images.append(sys.argv[i + 1])
                i += 2
            elif arg == "--ref-video" and i + 1 < len(sys.argv):
                reference_video = sys.argv[i + 1]
                i += 2
            elif arg == "--ref-audio" and i + 1 < len(sys.argv):
                reference_audio = sys.argv[i + 1]
                i += 2
            elif arg == "--text-only":
                text_only = True
                i += 1
            elif arg == "--model" and i + 1 < len(sys.argv):
                model = sys.argv[i + 1]
                i += 2
            elif arg == "--resolution" and i + 1 < len(sys.argv):
                resolution = sys.argv[i + 1]
                i += 2
            elif arg == "--ratio" and i + 1 < len(sys.argv):
                ratio = sys.argv[i + 1]
                i += 2
            elif arg == "--duration" and i + 1 < len(sys.argv):
                duration = int(sys.argv[i + 1])
                i += 2
            elif arg == "--seed" and i + 1 < len(sys.argv):
                seed = int(sys.argv[i + 1])
                i += 2
            elif arg == "--camera-fixed":
                camera_fixed = True
                i += 1
            elif arg == "--watermark":
                watermark = True
                i += 1
            elif arg == "--audio":
                generate_audio = True
                i += 1
            elif arg == "--return-last-frame":
                return_last_frame = True
                i += 1
            else:
                i += 1

        try:
            result = submit_task(
                prompt=prompt,
                first_frame=first_frame,
                first_frame_url=first_frame_url,
                last_frame=last_frame,
                last_frame_url=last_frame_url,
                reference_images=reference_images if reference_images else None,
                reference_video=reference_video,
                reference_audio=reference_audio,
                text_only=text_only,
                model=model,
                resolution=resolution,
                ratio=ratio,
                duration=duration,
                seed=seed,
                camera_fixed=camera_fixed,
                watermark=watermark,
                generate_audio=generate_audio,
                return_last_frame=return_last_frame,
            )
            print(json.dumps(result, indent=2, ensure_ascii=False))
        except Exception as e:
            print(json.dumps({"error": str(e)}, ensure_ascii=False))
            sys.exit(1)

    elif command == "query":
        if len(sys.argv) < 3:
            print("用法: python seedance_api.py query <task_id>")
            sys.exit(1)

        task_id = sys.argv[2]
        try:
            result = query_task(task_id)
            print(json.dumps(result, indent=2, ensure_ascii=False))
        except Exception as e:
            print(json.dumps({"error": str(e)}, ensure_ascii=False))
            sys.exit(1)

    elif command == "download":
        if len(sys.argv) < 4:
            print("用法: python seedance_api.py download <video_url> <output_path>")
            sys.exit(1)

        url = sys.argv[2]
        output_path = sys.argv[3]
        try:
            download_video(url, output_path)
            print(json.dumps({"status": "success", "path": output_path}, ensure_ascii=False))
        except Exception as e:
            print(json.dumps({"status": "error", "message": str(e)}, ensure_ascii=False))
            sys.exit(1)

    elif command == "wait":
        if len(sys.argv) < 4:
            print("用法: python seedance_api.py wait <task_id> <output_path> [options]")
            print("选项: --interval <秒>  轮询间隔 (默认15)")
            print("      --max-wait <秒>  最大等待 (默认1800)")
            print("      --with-last-frame  同时下载尾帧")
            sys.exit(1)

        task_id = sys.argv[2]
        output_path = sys.argv[3]

        poll_interval = 15
        max_wait = 1800
        download_last_frame = False

        i = 4
        while i < len(sys.argv):
            arg = sys.argv[i]
            if arg == "--interval" and i + 1 < len(sys.argv):
                poll_interval = int(sys.argv[i + 1])
                i += 2
            elif arg == "--max-wait" and i + 1 < len(sys.argv):
                max_wait = int(sys.argv[i + 1])
                i += 2
            elif arg == "--with-last-frame":
                download_last_frame = True
                i += 1
            else:
                i += 1

        try:
            result = wait_and_download(
                task_id, output_path,
                poll_interval=poll_interval,
                max_wait=max_wait,
                download_last_frame=download_last_frame,
            )
            print(json.dumps(result, ensure_ascii=False))
        except Exception as e:
            print(json.dumps({"status": "error", "message": str(e)}, ensure_ascii=False))
            sys.exit(1)

    else:
        print(f"未知命令: {command}")
        print("可用命令: submit, query, download, wait")
        sys.exit(1)


if __name__ == "__main__":
    main()
