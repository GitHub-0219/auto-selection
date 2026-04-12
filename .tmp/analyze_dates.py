#!/usr/bin/env python3
import os
import re
from pathlib import Path

# 当前日期
CURRENT_DATE = "2026-04-12"

# 排除的目录
EXCLUDE_DIRS = ['node_modules', '.git', '.tmp', '.skills', 'venv', '__pycache__']

def extract_all_dates():
    """提取所有文档中的日期并分类"""
    results = {
        'docs_to_update': [],      # 需要更新的文档（创建日期是昨天的）
        'past_date_docs': [],     # 包含过去日期的文档（可能是过期的）
        'current_docs': [],       # 当前日期的文档
        'future_docs': [],         # 未来日期的文档（可能是计划）
    }
    
    # 获取所有markdown文件
    all_files = []
    for root, dirs, files in os.walk('.'):
        dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]
        for file in files:
            if file.endswith(('.md', '.txt')):
                filepath = os.path.join(root, file)
                try:
                    with open(filepath, 'r', encoding='utf-8') as f:
                        content = f.read()
                        lines = content.split('\n')
                        
                        # 检查文件开头3行（通常包含创建日期）
                        header_dates = []
                        for i, line in enumerate(lines[:5]):
                            # 匹配各种日期格式
                            matches = re.findall(r'(\d{4}[-/年]\d{1,2}[-/月]\d{1,2}[日]?)', line)
                            for match in matches:
                                header_dates.append({
                                    'line_num': i + 1,
                                    'line': line.strip()[:100],
                                    'date': match,
                                    'type': 'header'
                                })
                        
                        # 检查文档中的所有日期
                        all_dates = []
                        for i, line in enumerate(lines):
                            matches = re.findall(r'(\d{4}[-/年]\d{1,2}[-/月]\d{1,2}[日]?)', line)
                            for match in matches:
                                all_dates.append({
                                    'line_num': i + 1,
                                    'line': line.strip()[:100],
                                    'date': match,
                                    'type': 'body'
                                })
                        
                        if all_dates:
                            results['current_docs'].append({
                                'file': filepath,
                                'header_dates': header_dates[:3],
                                'all_dates_count': len(all_dates)
                            })
                            
                except Exception as e:
                    pass
    
    return results

# 需要更新的文档类型
def get_docs_needing_update():
    """获取需要更新创建日期的文档"""
    docs = []
    
    # 文档整理报告.md - 昨天日期
    docs.append({
        'file': './文档整理报告.md',
        'issue': '创建日期为 2026-04-11，应更新为 2026-04-12',
        'old_date': '2026-04-11',
        'new_date': '2026-04-12'
    })
    
    # 文档索引.md - 昨天日期
    docs.append({
        'file': './文档索引.md',
        'issue': '创建日期为 2026-04-11，部分日期为 2026-04-10',
        'old_date': '2026-04-11',
        'new_date': '2026-04-12'
    })
    
    # AI数字人视频制作成本分析.md - 4月10日（2天前）
    docs.append({
        'file': './AI数字人视频制作成本分析.md',
        'issue': '创建日期为 2026-04-10，应更新为 2026-04-12',
        'old_date': '2026-04-10',
        'new_date': '2026-04-12'
    })
    
    # 安全深度分析报告.md - 4月10日
    docs.append({
        'file': './Auto选品项目/auto-selection/项目文档/安全深度分析报告.md',
        'issue': '创建日期为 2026年04月10日，应更新为 2026年04月12日',
        'old_date': '2026年04月10日',
        'new_date': '2026年04月12日'
    })
    
    # 测试报告.md - 4月10日
    docs.append({
        'file': './Auto选品项目/auto-selection/项目文档/测试报告.md',
        'issue': '创建日期为 2026年04月10日，应更新为 2026年04月12日',
        'old_date': '2026年04月10日',
        'new_date': '2026年04月12日'
    })
    
    # 问题跟踪清单.md - 4月10日
    docs.append({
        'file': './Auto选品项目/auto-selection/项目文档/问题跟踪清单.md',
        'issue': '创建日期为 2026年04月10日，应更新为 2026年04月12日',
        'old_date': '2026年04月10日',
        'new_date': '2026年04月12日'
    })
    
    # 验收标准.md - 4月10日
    docs.append({
        'file': './Auto选品项目/auto-selection/项目文档/验收标准.md',
        'issue': '创建日期为 2026年04月10日，应更新为 2026年04月12日',
        'old_date': '2026年04月10日',
        'new_date': '2026年04月12日'
    })
    
    # UI设计方案_5套.md - 3月20日（过期的创建日期）
    docs.append({
        'file': './Auto选品项目/auto-selection/项目文档/UI设计方案_5套.md',
        'issue': '文档日期为 2026年3月20日，可能已过期',
        'old_date': '2026年3月20日',
        'new_date': '2026年04月12日',
        'note': '可能是设计完成日期，但今天应更新创建日期'
    })
    
    # 数字人与真实人类协作规范.md - 4月9日
    docs.append({
        'file': './02_公司管理/制度规范/数字人与真实人类协作规范.md',
        'issue': '文档日期为 2026-04-09',
        'old_date': '2026-04-09',
        'new_date': '2026-04-12'
    })
    
    # MEMORY.md - 多处4月9日、4月10日
    docs.append({
        'file': './Auto选品项目/auto-selection/MEMORY.md',
        'issue': '包含 2026-04-09、2026-04-10 日期',
        'old_date': '2026-04-09',
        'new_date': '2026-04-12'
    })
    
    # 基础设定整理/MEMORY.md - 多处日期
    docs.append({
        'file': './基础设定整理/MEMORY.md',
        'issue': '包含 2026-04-09、2026-04-10、2026-04-11 日期',
        'old_date': '2026-04-09',
        'new_date': '2026-04-12'
    })
    
    # Bug修复记录.md - 4月9日
    docs.append({
        'file': './项目/Auto选品/报告/Bug修复记录.md',
        'issue': '创建日期为 2026-04-09，应更新为 2026-04-12',
        'old_date': '2026-04-09',
        'new_date': '2026-04-12'
    })
    
    # 团队通讯录.md - 3月27日
    docs.append({
        'file': './公司管理/团队通讯录.md',
        'issue': '创建日期为 2026-03-27，应更新为 2026-04-12',
        'old_date': '2026-03-27',
        'new_date': '2026-04-12'
    })
    
    # 组织架构.md - 4月9日
    docs.append({
        'file': './公司管理/组织架构.md',
        'issue': '文档日期为 2026-04-09，应更新为 2026-04-12',
        'old_date': '2026-04-09',
        'new_date': '2026-04-12'
    })
    
    # 本地Demo演示教程.md - 4月9日
    docs.append({
        'file': './项目/本地Demo演示教程.md',
        'issue': '文档日期为 2026年4月9日，应更新为 2026年4月12日',
        'old_date': '2026年4月9日',
        'new_date': '2026年4月12日'
    })
    
    # 用户使用手册.md - 4月9日
    docs.append({
        'file': './项目/用户使用手册.md',
        'issue': '文档日期为 2026年4月9日，应更新为 2026年4月12日',
        'old_date': '2026年4月9日',
        'new_date': '2026年4月12日'
    })
    
    # 课程优化建议.md - 4月9日
    docs.append({
        'file': './内容创作整理/课程/课程优化建议.md',
        'issue': '创建日期为 2026-04-09，应更新为 2026-04-12',
        'old_date': '2026-04-09',
        'new_date': '2026-04-12'
    })
    
    # 入门篇README.md - 4月9日
    docs.append({
        'file': './内容创作整理/课程/入门篇/README.md',
        'issue': '文档日期为 2026-04-09',
        'old_date': '2026-04-09',
        'new_date': '2026-04-12'
    })
    
    # 案例库.md - 4月9日
    docs.append({
        'file': './内容创作整理/课程/入门篇/案例库.md',
        'issue': '创建日期为 2026-04-09，应更新为 2026-04-12',
        'old_date': '2026-04-09',
        'new_date': '2026-04-12'
    })
    
    return docs

if __name__ == '__main__':
    print("=" * 70)
    print("文档时间核查分析报告")
    print("当前日期: 2026年4月12日（周日）")
    print("=" * 70)
    
    docs_to_update = get_docs_needing_update()
    
    print(f"\n需要更新的文档数量: {len(docs_to_update)}")
    print("\n" + "=" * 70)
    print("需要更新的文档列表")
    print("=" * 70)
    
    for i, doc in enumerate(docs_to_update, 1):
        print(f"\n{i}. {doc['file']}")
        print(f"   问题: {doc['issue']}")
        print(f"   修正: {doc['old_date']} → {doc['new_date']}")
        if 'note' in doc:
            print(f"   备注: {doc['note']}")
    
    print("\n" + "=" * 70)
    print("不需要修改的文档类型")
    print("=" * 70)
    print("""
1. 日报文档（日报_20260411.md, 日报_20260412.md）- 保持原日期，因为是历史记录
2. 会议纪要文档（第1次/第2次/第3次团队会议纪要）- 保持原会议日期
3. 问题跟踪清单中的未来日期（04-15, 04-20, 04-25）- 合理的截止日期
4. 公司管理文档中的1月1日日期 - 年度计划/制度开始日期
5. 2026年7月11日等未来日期 - 合理的计划日期
6. 2025年、2024年日期 - 历史项目文档，保持原样
""")

