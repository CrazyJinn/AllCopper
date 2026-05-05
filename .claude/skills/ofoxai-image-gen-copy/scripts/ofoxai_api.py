#!/usr/bin/env python3
"""
OfoxAI Images API - 图片生成脚本（支持 Batch 模式）

支持文生图和图生图，兼容 gpt-image-2 / dall-e-3 / dall-e-2。
支持 OpenAI Batch API 异步批量生成，50% 成本折扣。

使用方式:
    # === Batch 模式（推荐） ===

    # 1. 提交批量任务（从 .jsonl 文件）
    python ofoxai_api.py batch-submit ./batch_input.jsonl

    # 2. 查询批量状态
    python ofoxai_api.py batch-status <batch_id>

    # 3. 下载批量结果
    python ofoxai_api.py batch-results <batch_id> ./output_dir

    # 4. 取消批量任务
    python ofoxai_api.py batch-cancel <batch_id>

    # 5. 上传文件（用于图生图 batch 引用）
    python ofoxai_api.py upload-file ./ref.png --purpose batch

    # === 直接模式（向后兼容） ===

    python ofoxai_api.py submit "提示词" --size 1024x1024
    python ofoxai_api.py submit "编辑指令" --image ./ref.png --size 2048x2048
    python ofoxai_api.py wait '<json_result>' ./output.png
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

HEADERS = {"Authorization": f"Bearer {API_KEY}"}
HEADERS_JSON = {"Authorization": f"Bearer {API_KEY}", "Content-Type": "application/json"}


# ─── 直接模式 ──────────────────────────────────────────────


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
        url = f"{API_BASE}/images/edits"
        files: List[tuple] = []
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
        for _, f in files:
            f.close()
    else:
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
            headers=HEADERS_JSON,
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


# ─── Batch 模式 ────────────────────────────────────────────


def upload_file(file_path: str, purpose: str = "batch") -> dict:
    """Upload a file via Files API."""
    url = f"{API_BASE}/files"
    with open(file_path, "rb") as f:
        resp = requests.post(
            url,
            headers={"Authorization": f"Bearer {API_KEY}"},
            files={"file": (Path(file_path).name, f)},
            data={"purpose": purpose},
            timeout=60,
        )
    result = resp.json()
    if resp.status_code not in (200, 201):
        raise Exception(f"File upload error ({resp.status_code}): {json.dumps(result, ensure_ascii=False)}")
    return result


def batch_submit(jsonl_path: str) -> dict:
    """Upload .jsonl and create a batch."""
    # Read first line to detect endpoint
    with open(jsonl_path, "r", encoding="utf-8") as f:
        first_line = f.readline().strip()
        if not first_line:
            raise ValueError("Empty .jsonl file")
        first_req = json.loads(first_line)
        endpoint = first_req.get("url", "/v1/images/generations")

    # Upload .jsonl file
    file_info = upload_file(jsonl_path, purpose="batch")
    input_file_id = file_info["id"]

    # Create batch
    resp = requests.post(
        f"{API_BASE}/batches",
        headers=HEADERS_JSON,
        json={
            "input_file_id": input_file_id,
            "endpoint": endpoint,
            "completion_window": "24h",
        },
        timeout=30,
    )
    result = resp.json()
    if resp.status_code not in (200, 201):
        raise Exception(f"Batch create error ({resp.status_code}): {json.dumps(result, ensure_ascii=False)}")
    return result


def batch_status(batch_id: str) -> dict:
    """Check batch status."""
    resp = requests.get(f"{API_BASE}/batches/{batch_id}", headers=HEADERS, timeout=30)
    result = resp.json()
    if resp.status_code != 200:
        raise Exception(f"Batch status error ({resp.status_code}): {json.dumps(result, ensure_ascii=False)}")
    return result


def batch_results(batch_id: str, output_dir: str) -> dict:
    """Download and save results from a completed batch."""
    info = batch_status(batch_id)
    status = info.get("status")
    if status != "completed":
        return {
            "status": "pending",
            "batch_status": status,
            "request_counts": info.get("request_counts", {}),
            "message": f"Batch status: {status}. Call batch-results again when completed.",
        }

    output_file_id = info.get("output_file_id")
    if not output_file_id:
        return {"status": "error", "message": "Batch completed but no output file"}

    # Download output file
    resp = requests.get(
        f"{API_BASE}/files/{output_file_id}/content",
        headers=HEADERS,
        timeout=120,
    )
    resp.raise_for_status()

    out = Path(output_dir)
    out.mkdir(parents=True, exist_ok=True)

    saved = []
    errors = []

    for line in resp.text.strip().split("\n"):
        if not line:
            continue
        item = json.loads(line)
        cid = item.get("custom_id", "unknown")

        if item.get("error"):
            errors.append({"custom_id": cid, "code": item["error"].get("code"), "message": item["error"].get("message")})
            continue

        response = item.get("response", {})
        if response.get("status_code") != 200:
            errors.append({"custom_id": cid, "message": f"HTTP {response.get('status_code')}"})
            continue

        body = response.get("body", {})
        data_list = body.get("data", [])

        for i, data in enumerate(data_list):
            suffix = f"_{i+1}" if len(data_list) > 1 else ""
            save_path = str(out / f"{cid}{suffix}.png")

            if "b64_json" in data:
                with open(save_path, "wb") as f:
                    f.write(base64.b64decode(data["b64_json"]))
                saved.append(save_path)
            elif "url" in data:
                dl = requests.get(data["url"], timeout=60)
                dl.raise_for_status()
                with open(save_path, "wb") as f:
                    f.write(dl.content)
                saved.append(save_path)

    # Check error file
    error_file_id = info.get("error_file_id")
    if error_file_id:
        err_resp = requests.get(
            f"{API_BASE}/files/{error_file_id}/content",
            headers=HEADERS,
            timeout=30,
        )
        if err_resp.status_code == 200:
            for line in err_resp.text.strip().split("\n"):
                if line:
                    err_item = json.loads(line)
                    if err_item.get("error"):
                        errors.append({
                            "custom_id": err_item.get("custom_id", "unknown"),
                            "code": err_item["error"].get("code"),
                            "message": err_item["error"].get("message"),
                        })

    return {
        "status": "done",
        "batch_id": batch_id,
        "saved_count": len(saved),
        "error_count": len(errors),
        "saved": saved,
        "errors": errors if errors else None,
    }


def batch_cancel(batch_id: str) -> dict:
    """Cancel a running batch."""
    resp = requests.post(
        f"{API_BASE}/batches/{batch_id}/cancel",
        headers=HEADERS_JSON,
        timeout=30,
    )
    result = resp.json()
    if resp.status_code not in (200, 201):
        raise Exception(f"Batch cancel error ({resp.status_code}): {json.dumps(result, ensure_ascii=False)}")
    return result


def batch_list(limit: int = 10) -> dict:
    """List recent batches."""
    resp = requests.get(
        f"{API_BASE}/batches",
        headers=HEADERS,
        params={"limit": limit},
        timeout=30,
    )
    result = resp.json()
    if resp.status_code != 200:
        raise Exception(f"Batch list error ({resp.status_code}): {json.dumps(result, ensure_ascii=False)}")
    return result


def encode_image(file_path: str) -> str:
    """Encode an image file to a base64 data URI."""
    path = Path(file_path)
    if not path.exists():
        raise FileNotFoundError(f"文件不存在: {file_path}")
    ext = path.suffix.lower().lstrip(".")
    mime_map = {"png": "image/png", "jpg": "image/jpeg", "jpeg": "image/jpeg", "gif": "image/gif", "webp": "image/webp"}
    mime = mime_map.get(ext, "image/png")
    with open(file_path, "rb") as f:
        b64 = base64.b64encode(f.read()).decode("utf-8")
    return f"data:{mime};base64,{b64}"


# ─── CLI ───────────────────────────────────────────────────


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)

    cmd = sys.argv[1]

    try:
        if cmd == "submit":
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
                sys.exit(1)

            prompt = sys.argv[2]
            model = DEFAULT_MODEL
            size = "1024x1024"
            n = 1
            quality = None
            image = []
            response_format = "b64_json"

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
                else:
                    i += 1

            for img in image:
                if not Path(img).exists():
                    print(json.dumps({"error": f"图片不存在: {img}"}, ensure_ascii=False))
                    sys.exit(1)

            result = submit_task(prompt=prompt, model=model, size=size, n=n, quality=quality, image=image or None, response_format=response_format)
            print(json.dumps(result, indent=2, ensure_ascii=False))

        elif cmd == "wait":
            if len(sys.argv) < 4:
                print("用法: python ofoxai_api.py wait '<json_result>|<json_file>' <output_path>")
                sys.exit(1)
            raw = sys.argv[2]
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

        elif cmd == "download":
            if len(sys.argv) < 4:
                print("用法: python ofoxai_api.py download <url> <output_path>")
                sys.exit(1)
            result = download_image(sys.argv[2], sys.argv[3])
            print(json.dumps(result, ensure_ascii=False))

        elif cmd == "upload-file":
            if len(sys.argv) < 3:
                print("用法: python ofoxai_api.py upload-file <file_path> [--purpose batch|assistants|vision]")
                sys.exit(1)
            purpose = "batch"
            if "--purpose" in sys.argv and sys.argv.index("--purpose") + 1 < len(sys.argv):
                purpose = sys.argv[sys.argv.index("--purpose") + 1]
            result = upload_file(sys.argv[2], purpose=purpose)
            print(json.dumps(result, indent=2, ensure_ascii=False))

        elif cmd == "batch-submit":
            if len(sys.argv) < 3:
                print("用法: python ofoxai_api.py batch-submit <jsonl_path>")
                sys.exit(1)
            result = batch_submit(sys.argv[2])
            print(json.dumps(result, indent=2, ensure_ascii=False))

        elif cmd == "batch-status":
            if len(sys.argv) < 3:
                print("用法: python ofoxai_api.py batch-status <batch_id>")
                sys.exit(1)
            result = batch_status(sys.argv[2])
            counts = result.get("request_counts", {})
            print(json.dumps({
                "id": result.get("id"),
                "status": result.get("status"),
                "endpoint": result.get("endpoint"),
                "request_counts": counts,
                "created_at": result.get("created_at"),
                "in_progress_at": result.get("in_progress_at"),
                "completed_at": result.get("completed_at"),
                "expires_at": result.get("expires_at"),
            }, indent=2, ensure_ascii=False))

        elif cmd == "batch-results":
            if len(sys.argv) < 4:
                print("用法: python ofoxai_api.py batch-results <batch_id> <output_dir>")
                sys.exit(1)
            result = batch_results(sys.argv[2], sys.argv[3])
            print(json.dumps(result, indent=2, ensure_ascii=False))

        elif cmd == "batch-cancel":
            if len(sys.argv) < 3:
                print("用法: python ofoxai_api.py batch-cancel <batch_id>")
                sys.exit(1)
            result = batch_cancel(sys.argv[2])
            print(json.dumps(result, indent=2, ensure_ascii=False))

        elif cmd == "batch-list":
            limit = 10
            if "--limit" in sys.argv and sys.argv.index("--limit") + 1 < len(sys.argv):
                limit = int(sys.argv[sys.argv.index("--limit") + 1])
            result = batch_list(limit=limit)
            batches = result.get("data", [])
            for b in batches:
                counts = b.get("request_counts", {})
                print(f"{b.get('id')} | {b.get('status')} | total={counts.get('total', 0)} completed={counts.get('completed', 0)} failed={counts.get('failed', 0)}")

        elif cmd == "encode-image":
            if len(sys.argv) < 3:
                print("用法: python ofoxai_api.py encode-image <image_path>")
                sys.exit(1)
            data_uri = encode_image(sys.argv[2])
            print(data_uri)

        else:
            print(f"未知命令: {cmd}")
            print("可用命令: submit, wait, download, upload-file, batch-submit, batch-status, batch-results, batch-cancel, batch-list")
            sys.exit(1)

    except Exception as e:
        print(json.dumps({"error": str(e)}, ensure_ascii=False))
        sys.exit(1)


if __name__ == "__main__":
    main()
