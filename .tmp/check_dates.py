#!/usr/bin/env python3
import os
import re
from pathlib import Path

# 当前日期
CURRENT_DATE = "2026年4月12日"
CURRENT_DATE_SHORT = "2026-04-12"
CURRENT_YEAR = "2026"

# 排除的目录
EXCLUDE_DIRS = ['node_modules', '.git', '.tmp', '.skills', 'venv', '__pycache__']

def get_date_patterns():
    """返回需要检查的日期模式"""
    patterns = [
        # 标准日期格式
        (r'(\d{4}[-/年]\d{1,2}[-/月]\d{1,2}[日]?)', '标准日期格式'),
        # 年月日单独格式
        (r'(\d{4}年\d{1,2}月\d{1,2}日)', '年月日格式'),
        # YYYY-MM-DD
        (r'(\d{4}-\d{2}-\d{2})', 'ISO日期格式'),
        # 各种变体
        (r'(20\d{2}[-/年]\d{1,2}[-/月]\d{1,2})', '年份开头日期'),
        # 截止日期
        (r'截止[时分到\-]?\s*(\d{4}[-/年]\d{1,2}[-/月]\d{1,2})', '截止日期'),
        (r'截止[:：]\s*(\d{4}[-/年]\d{1,2}[-/月]\d{1,2})', '截止日期'),
    ]
    return patterns

def extract_dates_from_file(filepath):
    """从文件中提取所有日期"""
    dates = []
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
            for pattern, pattern_type in get_date_patterns():
                matches = re.findall(pattern, content)
                for match in matches:
                    dates.append({
                        'type': pattern_type,
                        'date': match,
                        'line': content[:content.find(match)].count('\n') + 1
                    })
    except Exception as e:
        pass
    return dates

def normalize_date(date_str):
    """将日期标准化"""
    # 替换各种分隔符
    normalized = re.sub(r'[/年月]', '-', date_str)
    normalized = re.sub(r'日', '', normalized)
    return normalized.strip('-')

def is_reasonable_date(date_str):
    """检查日期是否合理（不应早于2020年，不应晚于2027年）"""
    normalized = normalize_date(date_str)
    year_match = re.search(r'(\d{4})', normalized)
    if year_match:
        year = int(year_match.group(1))
        if year < 2020 or year > 2027:
            return False
    return True

def check_date_accuracy(date_str):
    """检查日期是否与当前日期一致"""
    normalized = normalize_date(date_str)
    # 提取年月日
    parts = re.split(r'[-/]', normalized)
    if len(parts) >= 3:
        year, month, day = parts[0], parts[1], parts[2]
        # 标准化月份和日期（去掉前导零）
        month = str(int(month))
        day = str(int(day))
        
        # 检查是否与2026年4月12日相同或接近
        if year == '2026':
            return 'ok'  # 2026年在合理范围内
    
    # 检查是否是合理的其他年份
    if is_reasonable_date(date_str):
        return 'ok_other_year'
    
    return 'invalid'

def main():
    results = {
        'files_checked': 0,
        'files_with_dates': 0,
        'current_date_docs': [],  # 使用当前日期的文档
        'other_date_docs': [],     # 使用其他日期的文档
        'potential_issues': [],     # 潜在问题
    }
    
    # 获取所有markdown文件
    all_files = []
    for root, dirs, files in os.walk('.'):
        # 跳过排除的目录
        dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]
        for file in files:
            if file.endswith(('.md', '.txt')):
                all_files.append(os.path.join(root, file))
    
    results['files_checked'] = len(all_files)
    
    for filepath in all_files:
        dates = extract_dates_from_file(filepath)
        if dates:
            results['files_with_dates'] += 1
            # 检查每个日期
            for date_info in dates:
                status = check_date_accuracy(date_info['date'])
                if status == 'ok' or status == 'ok_other_year':
                    if status == 'ok':
                        results['current_date_docs'].append({
                            'file': filepath,
                            'date': date_info['date'],
                            'line': date_info['line'],
                            'type': date_info['type']
                        })
                    else:
                        results['other_date_docs'].append({
                            'file': filepath,
                            'date': date_info['date'],
                            'line': date_info['line'],
                            'type': date_info['type']
                        })
    
    # 打印结果
    print("=" * 60)
    print("文档时间核查报告")
    print("当前日期: 2026年4月12日（周日）")
    print("=" * 60)
    print(f"\n检查文件总数: {results['files_checked']}")
    print(f"包含日期的文件: {results['files_with_dates']}")
    
    print("\n" + "=" * 60)
    print("一、使用2026年4月12日相关日期的文档")
    print("=" * 60)
    for item in results['current_date_docs']:
        print(f"  [{item['type']}] {item['file']} (第{item['line']}行)")
        print(f"      日期: {item['date']}")
    
    print("\n" + "=" * 60)
    print("二、使用其他年份日期的文档")
    print("=" * 60)
    for item in results['other_date_docs'][:50]:  # 限制显示前50个
        print(f"  [{item['type']}] {item['file']} (第{item['line']}行)")
        print(f"      日期: {item['date']}")
    
    if len(results['other_date_docs']) > 50:
        print(f"  ... 还有 {len(results['other_date_docs']) - 50} 个文档")
    
    return results

if __name__ == '__main__':
    main()
