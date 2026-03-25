#!/usr/bin/env python3
"""
火山引擎即梦API - 图片生成一体化脚本

使用方式:
    python jimeng_api.py submit <prompt> [--width W] [--height H]
    python jimeng_api.py query <task_id>
    python jimeng_api.py download <url> <output_path>
"""

import datetime
import hashlib
import hmac
import json
import os
import sys
import time
from pathlib import Path
from urllib.parse import quote

import requests


def load_settings():
    """从项目根目录的 settings.json 加载配置"""
    script_dir = Path(__file__).parent
    # 脚本在 .claude/skills/t2i(api)/scripts/ 下，需要往上4级到项目根目录
    settings_path = script_dir.parent.parent.parent.parent / "settings.json"

    if not settings_path.exists():
        raise FileNotFoundError(f"配置文件不存在: {settings_path}")

    with open(settings_path, "r", encoding="utf-8") as f:
        return json.load(f)


# 加载配置
_settings = load_settings()

# API配置
SERVICE = "cv"
VERSION = "2022-08-31"
REGION = "cn-north-1"
HOST = "visual.volcengineapi.com"
CONTENT_TYPE = "application/json"
REQ_KEY = _settings.get("t2i_model", "jimeng_t2i_v31")

# API密钥
AK = _settings.get("AccessKeyId", "")
SK = _settings.get("SecretAccessKey", "")


def norm_query(params):
    """规范化查询字符串"""
    query = ""
    for key in sorted(params.keys()):
        if type(params[key]) == list:
            for k in params[key]:
                query = query + quote(key, safe="-_.~") + "=" + quote(k, safe="-_.~") + "&"
        else:
            query = query + quote(key, safe="-_.~") + "=" + quote(params[key], safe="-_.~") + "&"
    query = query[:-1]
    return query.replace("+", "%20")


def hmac_sha256(key: bytes, content: str) -> bytes:
    """HMAC-SHA256签名"""
    return hmac.new(key, content.encode("utf-8"), hashlib.sha256).digest()


def hash_sha256(content: str) -> str:
    """SHA256哈希"""
    return hashlib.sha256(content.encode("utf-8")).hexdigest()


def utc_now():
    """获取UTC时间"""
    try:
        from datetime import timezone
        return datetime.datetime.now(timezone.utc)
    except ImportError:
        class UTC(datetime.tzinfo):
            def utcoffset(self, _dt):
                return datetime.timedelta(0)
            def tzname(self, _dt):
                return "UTC"
            def dst(self, _dt):
                return datetime.timedelta(0)
        return datetime.datetime.now(UTC())


def request(method, date, query, header, ak, sk, action, body):
    """发送签名请求"""
    # 创建身份证明
    credential = {
        "access_key_id": ak,
        "secret_access_key": sk,
        "service": SERVICE,
        "region": REGION,
    }

    # 初始化签名结构体
    request_param = {
        "body": body,
        "host": HOST,
        "path": "/",
        "method": method,
        "content_type": CONTENT_TYPE,
        "date": date,
        "query": {"Action": action, "Version": VERSION, **query},
    }
    if body is None:
        request_param["body"] = ""

    # 计算签名参数
    x_date = request_param["date"].strftime("%Y%m%dT%H%M%SZ")
    short_x_date = x_date[:8]
    x_content_sha256 = hash_sha256(request_param["body"])

    sign_result = {
        "Host": request_param["host"],
        "X-Content-Sha256": x_content_sha256,
        "X-Date": x_date,
        "Content-Type": request_param["content_type"],
    }

    # 计算 Signature 签名
    signed_headers_str = ";".join(["content-type", "host", "x-content-sha256", "x-date"])

    canonical_request_str = "\n".join([
        request_param["method"].upper(),
        request_param["path"],
        norm_query(request_param["query"]),
        "\n".join([
            "content-type:" + request_param["content_type"],
            "host:" + request_param["host"],
            "x-content-sha256:" + x_content_sha256,
            "x-date:" + x_date,
        ]),
        "",
        signed_headers_str,
        x_content_sha256,
    ])

    hashed_canonical_request = hash_sha256(canonical_request_str)
    credential_scope = "/".join([short_x_date, credential["region"], credential["service"], "request"])
    string_to_sign = "\n".join(["HMAC-SHA256", x_date, credential_scope, hashed_canonical_request])

    # 派生签名密钥
    k_date = hmac_sha256(credential["secret_access_key"].encode("utf-8"), short_x_date)
    k_region = hmac_sha256(k_date, credential["region"])
    k_service = hmac_sha256(k_region, credential["service"])
    k_signing = hmac_sha256(k_service, "request")
    signature = hmac_sha256(k_signing, string_to_sign).hex()

    # 构建 Authorization
    sign_result["Authorization"] = "HMAC-SHA256 Credential={}, SignedHeaders={}, Signature={}".format(
        credential["access_key_id"] + "/" + credential_scope,
        signed_headers_str,
        signature,
    )

    header = {**header, **sign_result}

    # 发送请求
    r = requests.request(
        method=method,
        url="https://{}{}".format(request_param["host"], request_param["path"]),
        headers=header,
        params=request_param["query"],
        data=request_param["body"],
    )
    return r.json()


def submit_task(prompt: str, width: int = 2048, height: int = 2048) -> str:
    """提交图片生成任务"""
    now = utc_now()

    body = {
        "req_key": REQ_KEY,
        "prompt": prompt,
        "seed": -1,
        "width": width,
        "height": height,
        "use_pre_llm": True,
    }
    body_str = json.dumps(body)

    result = request("POST", now, {}, {}, AK, SK, "CVSync2AsyncSubmitTask", body_str)

    if result.get("code") != 10000:
        raise Exception(f"提交任务失败: {result}")

    return result["data"]["task_id"]


def query_task(task_id: str) -> dict:
    """查询任务状态"""
    now = utc_now()

    body = {
        "req_key": REQ_KEY,
        "task_id": task_id,
        "req_json": json.dumps({"return_url": True}),
    }
    body_str = json.dumps(body)

    result = request("POST", now, {}, {}, AK, SK, "CVSync2AsyncGetResult", body_str)
    return result


def download_image(url: str, output_path: str) -> str:
    """下载图片"""
    response = requests.get(url, timeout=60)
    response.raise_for_status()

    with open(output_path, "wb") as f:
        f.write(response.content)

    return output_path


def wait_and_download(task_id: str, output_path: str, poll_interval: int = 10, max_wait: int = 300) -> dict:
    """
    等待任务完成并下载图片

    Args:
        task_id: 任务ID
        output_path: 输出路径
        poll_interval: 轮询间隔（秒）
        max_wait: 最大等待时间（秒）

    Returns:
        包含状态和信息的字典
    """
    start_time = time.time()

    while time.time() - start_time < max_wait:
        result = query_task(task_id)

        if result.get("code") != 10000:
            return {"status": "error", "message": f"查询失败: {result}"}

        status = result.get("data", {}).get("status", "")

        if status == "done":
            image_urls = result.get("data", {}).get("image_urls", [])
            if image_urls:
                download_image(image_urls[0], output_path)
                return {
                    "status": "done",
                    "image_path": output_path,
                    "image_urls": image_urls
                }
            else:
                return {"status": "error", "message": "任务完成但无图片URL"}

        elif status in ["not_found", "expired"]:
            return {"status": "error", "message": f"任务状态异常: {status}"}

        # 任务仍在运行，等待后继续轮询
        time.sleep(poll_interval)

    return {"status": "timeout", "message": f"等待超时（{max_wait}秒）"}


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)

    command = sys.argv[1]

    if command == "submit":
        if len(sys.argv) < 3:
            print("用法: python jimeng_api.py submit <prompt> [--width W] [--height H]")
            sys.exit(1)

        prompt = sys.argv[2]
        width = int(sys.argv[sys.argv.index("--width") + 1]) if "--width" in sys.argv else 2048
        height = int(sys.argv[sys.argv.index("--height") + 1]) if "--height" in sys.argv else 2048

        task_id = submit_task(prompt, width, height)
        print(json.dumps({"task_id": task_id}, ensure_ascii=False))

    elif command == "query":
        if len(sys.argv) < 3:
            print("用法: python jimeng_api.py query <task_id>")
            sys.exit(1)

        task_id = sys.argv[2]
        result = query_task(task_id)
        print(json.dumps(result, indent=2, ensure_ascii=False))

    elif command == "download":
        if len(sys.argv) < 4:
            print("用法: python jimeng_api.py download <url> <output_path>")
            sys.exit(1)

        url = sys.argv[2]
        output_path = sys.argv[3]
        download_image(url, output_path)
        print(json.dumps({"status": "success", "path": output_path}, ensure_ascii=False))

    elif command == "wait":
        if len(sys.argv) < 4:
            print("用法: python jimeng_api.py wait <task_id> <output_path> [--interval 10] [--max-wait 300]")
            sys.exit(1)

        task_id = sys.argv[2]
        output_path = sys.argv[3]
        poll_interval = int(sys.argv[sys.argv.index("--interval") + 1]) if "--interval" in sys.argv else 10
        max_wait = int(sys.argv[sys.argv.index("--max-wait") + 1]) if "--max-wait" in sys.argv else 300

        result = wait_and_download(task_id, output_path, poll_interval, max_wait)
        print(json.dumps(result, ensure_ascii=False))

    else:
        print(f"未知命令: {command}")
        sys.exit(1)


if __name__ == "__main__":
    main()
