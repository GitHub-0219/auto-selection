"""
凭证获取模块

自动获取identity_ticket凭证，无需用户手动配置。
"""

import os


def get_identity_ticket() -> str:
    """
    自动获取identity_ticket，无需用户配置

    Returns:
        str: identity_ticket

    Raises:
        ValueError: 无法获取凭证
    """
    # 尝试从多个环境变量获取凭证
    credential = os.getenv("identity_ticket") or os.getenv("IDENTITY_TICKET")

    if not credential:
        # 如果环境变量中没有，尝试从默认位置或使用内部机制获取
        # 这里可以添加自动获取凭证的逻辑
        raise ValueError("无法自动获取凭证，请确保已登录Coze平台")

    return credential
