# 火山引擎即梦API参考

## 接口概览

| 属性 | 值 |
|------|-----|
| 接口地址 | https://visual.volcengineapi.com |
| 请求方式 | POST |
| Content-Type | application/json |
| Region | cn-north-1 |
| Service | cv |

## 提交任务接口

### 请求参数

**Query参数：**
```
https://visual.volcengineapi.com?Action=CVSync2AsyncSubmitTask&Version=2022-08-31
```

**Body参数：**

| 参数 | 类型 | 必选 | 说明 |
|-----|------|------|------|
| req_key | string | 是 | 固定值：jimeng_t2i_v31 |
| prompt | string | 是 | 提示词，建议<=120字符，最长800字符 |
| seed | int | 否 | 随机种子，默认-1（随机） |
| width | int | 否 | 图片宽度，需同时传height |
| height | int | 否 | 图片高度，需同时传width |
| use_pre_llm | bool | 否 | 开启文本扩写，默认true |

### 推荐尺寸

**标清1K：**
- 1328 × 1328（1:1）
- 1472 × 1104（4:3）
- 1584 × 1056（3:2）
- 1664 × 936（16:9）
- 2016 × 864（21:9）

**高清2K：**
- 2048 × 2048（1:1）
- 2304 × 1728（4:3）
- 2496 × 1664（3:2）
- 2560 × 1440（16:9）
- 3024 × 1296（21:9）

### 返回参数

| 字段 | 类型 | 说明 |
|-----|------|------|
| code | int | 状态码，10000表示成功 |
| data.task_id | string | 任务ID，用于查询结果 |
| message | string | 状态信息 |

### 请求示例

```json
{
    "req_key": "jimeng_t2i_v31",
    "prompt": "骑士团阵营城镇，室外场景，白天，晴朗...",
    "seed": -1,
    "width": 2048,
    "height": 2048
}
```

### 返回示例

```json
{
    "code": 10000,
    "data": {
        "task_id": "7392616336519610409"
    },
    "message": "Success",
    "request_id": "20240720103939AF0029465CF6A74E51EC"
}
```

## 查询任务接口

### 请求参数

**Query参数：**
```
https://visual.volcengineapi.com?Action=CVSync2AsyncGetResult&Version=2022-08-31
```

**Body参数：**

| 参数 | 类型 | 必选 | 说明 |
|-----|------|------|------|
| req_key | string | 是 | 固定值：jimeng_t2i_v31 |
| task_id | string | 是 | 提交任务返回的task_id |
| req_json | string | 否 | JSON字符串，配置水印和返回URL |

**req_json配置：**
```json
{
    "return_url": true,
    "logo_info": {
        "add_logo": false
    }
}
```

### 返回参数

| 字段 | 类型 | 说明 |
|-----|------|------|
| code | int | 状态码，10000表示成功 |
| data.status | string | 任务状态 |
| data.image_urls | array | 图片URL数组（24小时有效） |
| data.binary_data_base64 | array | Base64图片数组 |

### 任务状态

| 状态 | 说明 |
|-----|------|
| in_queue | 任务已提交，排队中 |
| generating | 任务处理中 |
| done | 处理完成 |
| not_found | 任务未找到或已过期(12小时) |
| expired | 任务已过期 |

### 请求示例

```json
{
    "req_key": "jimeng_t2i_v31",
    "task_id": "7392616336519610409",
    "req_json": "{\"return_url\":true}"
}
```

### 返回示例

```json
{
    "code": 10000,
    "data": {
        "binary_data_base64": null,
        "image_urls": [
            "https://xxxx.jpeg"
        ],
        "status": "done"
    },
    "message": "Success"
}
```

## 错误码

| HttpCode | 错误码 | 说明 | 是否重试 |
|----------|-------|------|---------|
| 200 | 10000 | 请求成功 | - |
| 400 | 50411 | 输入图片审核未通过 | 否 |
| 400 | 50511 | 输出图片审核未通过 | 是 |
| 400 | 50412 | 输入文本审核未通过 | 否 |
| 400 | 50413 | 输入文本含敏感词 | 否 |
| 400 | 50519 | 输出版权图审核未通过 | 是 |
| 429 | 50429 | QPS超限 | 是 |
| 429 | 50430 | 并发超限 | 是 |
| 500 | 50500 | 内部错误 | 否 |
| 500 | 50501 | 内部算法错误 | 否 |

## 鉴权说明

需要在Header中添加签名参数，详见火山引擎签名文档。

必需的环境变量：
- `VOLC_ACCESSKEY`
- `VOLC_SECRETKEY`
