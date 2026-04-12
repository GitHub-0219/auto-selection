"""
技能安装模块

安装指定技能到用户的技能库。
"""

import argparse
import json
from get_credential import get_identity_ticket
from coze_workload_identity import requests

HEADERS = {
    'x-use-ppe': '1',
    'x-tt-env': 'ppe_coze_claw',
}


def install_skill(skill_id: str) -> dict:
    """
    安装指定技能到用户的技能库

    Args:
        skill_id: 要安装的技能ID

    Returns:
        dict: 安装结果，包含：
            - code: 状态码
            - msg: 结果消息
            - data: 详细数据

    Raises:
        ValueError: 缺少身份凭证或技能ID
        Exception: API调用失败
    """
    if not skill_id:
        raise ValueError("技能ID不能为空")

    credential = get_identity_ticket()

    url = "https://www.coze.cn/api/coze_claw/skill/skill_hub_add"
    data = {
        "sandbox_identity_ticket": credential,
        "skill_id": skill_id,
    }

    try:
        response = requests.post(url, json=data, headers=HEADERS, timeout=20)

        if response.status_code != 200:
            raise Exception(f"API调用失败，状态码: {response.status_code}")

        result = response.json()
        return {
            "code": result.get("code"),
            "msg": result.get("msg"),
            "data": result.get("data")
        }

    except requests.exceptions.RequestException as e:
        raise Exception(f"网络请求失败: {str(e)}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="安装指定技能到用户的技能库")
    parser.add_argument("skill_id", help="要安装的技能ID")
    args = parser.parse_args()

    try:
        result = install_skill(args.skill_id)
        print(json.dumps(result, ensure_ascii=False, indent=2))
    except Exception as e:
        print(f"错误: {str(e)}")
