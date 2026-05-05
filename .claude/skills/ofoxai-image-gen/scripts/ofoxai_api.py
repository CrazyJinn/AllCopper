#!/usr/bin/env python3
"""
OfoxAI Images API - 图片生成脚本

支持文生图和图生图两种模式，兼容 gpt-image-2 / dall-e-3 / dall-e-2 等模型。

使用方式:
    # 文生图
    python ofoxai_api.py submit "提示词" --size 1024x1024
    python ofoxai_api.py submit "提示词" --model openai/gpt-image-2 --size 1024x1024 --quality high

    # 图生图（单图）
    python ofoxai_api.py submit "提示词" --image ./设计图.png --size 1024x1024

    # 多图引用
    python ofoxai_api.py submit "提示词" --image ./图1.png --image ./图2.png --size 1024x1024

    # 保存结果（支持 JSON 字符串或文件路径）
    python ofoxai_api.py wait '<json_result>' ./output.png
    python ofoxai_api.py wait ./result.json ./output.png

    # 下载图片
    python ofoxai_api.py download <url> ./output.png
"""

import base64
import json
import sys
from pathlib import Path
from typing import Optional, List, Dict, Any

import requests


def load_settings() -> dict:
    script_dir = Path(__file__).parent
    settings_path = script_dir.parent.parent.parent.parent / "settings.json"
    if not settings_path.exists():
        raise FileNotFoundError(f"配置文件不存在: {settings_path}")
    with open(settings_path, "r", encoding="utf-8") as f:
        return json.load(f)


_settings = load_settings()

API_BASE = "https://api.ofox.ai/v1"
API_KEY = _settings.get("ofox", "")
DEFAULT_MODEL = "openai/gpt-image-2"


def submit_task(
    prompt: str,
    model: str = DEFAULT_MODEL,
    size: str = "1024x1024",
    n: int = 1,
    quality: Optional[str] = "low",
    image: Optional[List[str]] = None,
    response_format: str = "b64_json",
) -> dict:
    has_images = image and len(image) > 0

    if has_images:
        # 图生图: multipart/form-data
        url = f"{API_BASE}/images/edits"
        files: List[tuple] = []
        # 多图用 image[]，单图用 image
        if len(image) > 1:
            for img_path in image:
                files.append(("image[]", open(img_path, "rb")))
        else:
            files.append(("image", open(image[0], "rb")))

        data = {"prompt": prompt, "model": model, "n": str(n), "size": size, "response_format": response_format}
        if quality:
            data["quality"] = quality

        resp = requests.post(
            url,
            headers={"Authorization": f"Bearer {API_KEY}"},
            data=data,
            files=files,
            timeout=180,
        )
        # 关闭文件句柄
        for _, f in files:
            f.close()
    else:
        # 文生图: JSON
        url = f"{API_BASE}/images/generations"
        body: Dict[str, Any] = {
            "model": model,
            "prompt": prompt,
            "n": n,
            "size": size,
            "response_format": response_format,
        }
        if quality:
            body["quality"] = quality

        resp = requests.post(
            url,
            headers={"Authorization": f"Bearer {API_KEY}", "Content-Type": "application/json"},
            json=body,
            timeout=180,
        )

    result = resp.json()
    if resp.status_code != 200:
        raise Exception(f"API error ({resp.status_code}): {json.dumps(result, ensure_ascii=False)}")
    return result


def save_result(result: dict, output_path: str) -> dict:
    if "error" in result:
        return {"status": "error", "message": result["error"].get("message", "未知错误"), "code": result["error"].get("code")}

    data_list = result.get("data", [])
    if not data_list:
        return {"status": "error", "message": "返回结果中没有图片数据"}

    saved = []
    for i, item in enumerate(data_list):
        path = Path(output_path)
        save_path = str(path.parent / f"{path.stem}_{i+1}{path.suffix}") if len(data_list) > 1 else output_path
        path.parent.mkdir(parents=True, exist_ok=True)

        if "b64_json" in item:
            with open(save_path, "wb") as f:
                f.write(base64.b64decode(item["b64_json"]))
            saved.append(save_path)
        elif "url" in item:
            resp = requests.get(item["url"], timeout=60)
            resp.raise_for_status()
            with open(save_path, "wb") as f:
                f.write(resp.content)
            saved.append(save_path)

    if saved:
        return {
            "status": "done",
            "image_path": saved[0] if len(saved) == 1 else saved,
            "image_paths": saved,
        }
    return {"status": "error", "message": "未能获取图片数据"}


def download_image(url: str, output_path: str) -> dict:
    resp = requests.get(url, timeout=60)
    resp.raise_for_status()
    Path(output_path).parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "wb") as f:
        f.write(resp.content)
    return {"status": "success", "path": output_path}


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)

    command = sys.argv[1]

    if command == "submit":
        if len(sys.argv) < 3:
            print("用法: python ofoxai_api.py submit <prompt> [options]")
            print("")
            print("选项:")
            print("  --model <name>       模型 (默认: openai/gpt-image-2)")
            print("  --size <WxH>         输出尺寸 (默认: 1024x1024)")
            print("  --n <int>            生成数量 (默认: 1)")
            print("  --quality <val>      gpt-image: low/medium/high; dall-e-3: standard/hd")
            print("  --image <path>       参考图片路径 (可多次指定)")
            print("  --response-format    b64_json 或 url (默认: b64_json)")
            print("  -o, --output <path>  直接保存到指定路径（跳过 wait 步骤）")
            sys.exit(1)

        prompt = sys.argv[2]
        model = DEFAULT_MODEL
        size = "1024x1024"
        n = 1
        quality = None
        image = []
        response_format = "b64_json"
        output = None

        i = 3
        while i < len(sys.argv):
            arg = sys.argv[i]
            if arg == "--model" and i + 1 < len(sys.argv):
                model = sys.argv[i + 1]; i += 2
            elif arg == "--size" and i + 1 < len(sys.argv):
                size = sys.argv[i + 1]; i += 2
            elif arg == "--n" and i + 1 < len(sys.argv):
                n = int(sys.argv[i + 1]); i += 2
            elif arg == "--quality" and i + 1 < len(sys.argv):
                quality = sys.argv[i + 1]; i += 2
            elif arg == "--image" and i + 1 < len(sys.argv):
                image.append(sys.argv[i + 1]); i += 2
            elif arg == "--response-format" and i + 1 < len(sys.argv):
                response_format = sys.argv[i + 1]; i += 2
            elif arg in ("-o", "--output") and i + 1 < len(sys.argv):
                output = sys.argv[i + 1]; i += 2
            else:
                i += 1

        # 校验图片文件
        for img in image:
            if not Path(img).exists():
                print(json.dumps({"error": f"图片不存在: {img}"}, ensure_ascii=False))
                sys.exit(1)

        try:
            result = submit_task(prompt=prompt, model=model, size=size, n=n, quality=quality, image=image or None, response_format=response_format)
            if output:
                result = save_result(result, output)
            print(json.dumps(result, ensure_ascii=False))
        except Exception as e:
            print(json.dumps({"error": str(e)}, ensure_ascii=False))
            sys.exit(1)

    elif command == "wait":
        if len(sys.argv) < 4:
            print("用法: python ofoxai_api.py wait '<json_result>|<json_file>' <output_path>")
            sys.exit(1)
        raw = sys.argv[2]
        # 支持从文件读取 JSON（处理大响应）
        if Path(raw).exists():
            with open(raw, encoding="utf-8") as f:
                result = json.load(f)
        else:
            try:
                result = json.loads(raw)
            except json.JSONDecodeError:
                print(json.dumps({"status": "error", "message": "无效的 JSON"}, ensure_ascii=False))
                sys.exit(1)
        output_path = sys.argv[3]
        result = save_result(result, output_path)
        print(json.dumps(result, ensure_ascii=False))

    elif command == "download":
        if len(sys.argv) < 4:
            print("用法: python ofoxai_api.py download <url> <output_path>")
            sys.exit(1)
        try:
            result = download_image(sys.argv[2], sys.argv[3])
            print(json.dumps(result, ensure_ascii=False))
        except Exception as e:
            print(json.dumps({"status": "error", "message": str(e)}, ensure_ascii=False))
            sys.exit(1)

    else:
        print(f"未知命令: {command}")
        print("可用命令: submit, wait, download")
        sys.exit(1)


if __name__ == "__main__":
    main()
