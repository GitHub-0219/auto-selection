"""
技能搜索模块

搜索Coze技能商店中的技能。
"""

import argparse
import json
from get_credential import get_identity_ticket
from coze_workload_identity import requests

HEADERS = {
    'x-use-ppe': '1',
    'x-tt-env': 'ppe_coze_claw',
}


def search_skills(keyword: str) -> list:
    """
    搜索Coze技能商店中的技能

    Args:
        keyword: 搜索关键词，如"股票"、"PDF处理"等

    Returns:
        list: 技能列表，每个元素包含：
            - skill_id: 技能ID
            - name: 技能名称
            - description: 技能描述

    Raises:
        ValueError: 缺少身份凭证
        Exception: API调用失败
    """
    credential = get_identity_ticket()

    url = "https://www.coze.cn/api/coze_claw/skill/skill_hub_shop_search"
    data = {
        "sandbox_identity_ticket": credential,
        "keyword": keyword,
    }

    try:
        response = requests.post(url, json=data, headers=HEADERS, timeout=20)

        if response.status_code != 200:
            raise Exception(f"API调用失败，状态码: {response.status_code}")

        result = response.json()

        skills = [
            {
                "skill_id": item.get("product_id"),
                "name": item.get("name"),
                "description": item.get("description")
            }
            for item in result.get('data', [])
        ]

        return skills

    except requests.exceptions.RequestException as e:
        raise Exception(f"网络请求失败: {str(e)}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="搜索Coze技能商店中的技能")
    parser.add_argument("keyword", help="搜索关键词")
    args = parser.parse_args()

    try:
        skills = search_skills(args.keyword)
        print(json.dumps(skills, ensure_ascii=False, indent=2))
    except Exception as e:
        print(f"错误: {str(e)}")
