/**
 * 前端行为检测模块 - Client-side Behavior Detection
 * 功能：鼠标轨迹检测、点击频率检测、页面停留时间、键盘模式分析
 */

class BehaviorDetector {
  constructor(options = {}) {
    this.config = {
      suspiciousClickThreshold: 20,        // 可疑点击阈值（1分钟内）
      suspiciousMoveThreshold: 500,       // 可疑移动阈值（移动点数量）
      minHumanMovePoints: 5,              // 认定为人类的最少移动点数
      idleTimeout: 30000,                 // 空闲超时（毫秒）
      honeypotDecay: 3000,                // 蜜罐字段过期时间
      ...options
    };
    
    // 状态
    this.state = {
      clickCount: 0,
      clickTimestamps: [],
      mouseMoves: [],
      lastActivity: Date.now(),
      isHuman: true,
      suspicionLevel: 0,
      keystrokes: [],
      scrollPatterns: [],
      touchEvents: [],
      formCompletionTime: null,
      honeypotTriggered: false
    };
    
    // 蜜罐字段
    this.honeypotFields = ['website', 'url', 'emailConfirm', 'phone_home'];
    
    // 初始化
    this.init();
  }
  
  init() {
    if (typeof window === 'undefined') return;
    
    // 绑定事件监听
    this.bindEvents();
    
    // 启动空闲检测
    this.startIdleDetection();
    
    // 生成蜜罐字段
    this.injectHoneypots();
    
    console.log('[BehaviorDetector] 前端行为检测已初始化');
  }
  
  bindEvents() {
    // 鼠标移动
    document.addEventListener('mousemove', this.handleMouseMove.bind(this), { passive: true });
    
    // 鼠标点击
    document.addEventListener('click', this.handleClick.bind(this), { passive: true });
    
    // 键盘输入
    document.addEventListener('keydown', this.handleKeydown.bind(this), { passive: true });
    
    // 滚动
    document.addEventListener('scroll', this.handleScroll.bind(this), { passive: true });
    
    // 触摸事件
    document.addEventListener('touchstart', this.handleTouch.bind(this), { passive: true });
    document.addEventListener('touchmove', this.handleTouch.bind(this), { passive: true });
    
    // 页面可见性
    document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
    
    // 页面卸载前发送数据
    window.addEventListener('beforeunload', () => {
      this.reportBehavior();
    });
  }
  
  handleMouseMove(e) {
    const now = Date.now();
    this.state.lastActivity = now;
    
    // 只记录部分移动点以节省资源
    if (this.state.mouseMoves.length < this.config.suspiciousMoveThreshold) {
      this.state.mouseMoves.push({
        x: e.clientX,
        y: e.clientY,
        t: now
      });
    }
    
    // 实时检测异常模式
    this.detectMouseAnomaly();
  }
  
  handleClick(e) {
    const now = Date.now();
    this.state.lastActivity = now;
    this.state.clickCount++;
    this.state.clickTimestamps.push(now);
    
    // 清理过旧的点击记录
    const oneMinuteAgo = now - 60000;
    this.state.clickTimestamps = this.state.clickTimestamps.filter(t => t > oneMinuteAgo);
    
    // 检测点击频率异常
    if (this.state.clickTimestamps.length > this.config.suspiciousClickThreshold) {
      this.increaseSuspicion(20, '异常高点击频率');
    }
    
    // 检测点击是否在蜜罐上
    const target = e.target;
    if (target && (target.id || target.name)) {
      if (this.honeypotFields.includes(target.id) || this.honeypotFields.includes(target.name)) {
        this.state.honeypotTriggered = true;
        this.increaseSuspicion(50, '蜜罐字段被触发');
      }
    }
    
    this.detectClickPattern();
  }
  
  handleKeydown(e) {
    const now = Date.now();
    this.state.lastActivity = now;
    
    this.state.keystrokes.push({
      key: e.key,
      t: now,
      ctrlKey: e.ctrlKey,
      shiftKey: e.shiftKey,
      altKey: e.altKey
    });
    
    // 清理过旧的按键记录
    const oneMinuteAgo = now - 60000;
    this.state.keystrokes = this.state.keystrokes.filter(k => k.t > oneMinuteAgo);
    
    // 检测异常键盘模式（如Tab键连续使用）
    this.detectKeystrokeAnomaly();
  }
  
  handleScroll(e) {
    const now = Date.now();
    this.state.lastActivity = now;
    
    this.state.scrollPatterns.push({
      scrollY: window.scrollY,
      t: now
    });
    
    // 清理过旧的滚动记录
    if (this.state.scrollPatterns.length > 100) {
      this.state.scrollPatterns = this.state.scrollPatterns.slice(-50);
    }
  }
  
  handleTouch(e) {
    const now = Date.now();
    this.state.lastActivity = now;
    
    const touch = e.touches[0];
    if (touch) {
      this.state.touchEvents.push({
        x: touch.clientX,
        y: touch.clientY,
        t: now,
        type: e.type
      });
    }
  }
  
  handleVisibilityChange() {
    if (document.hidden) {
      this.state.pageHiddenAt = Date.now();
    } else if (this.state.pageHiddenAt) {
      const hiddenDuration = Date.now() - this.state.pageHiddenAt;
      this.state.hiddenDuration = hiddenDuration;
      
      // 如果标签页在后台停留时间过长，可能是自动化工具
      if (hiddenDuration > 300000) { // 5分钟
        this.increaseSuspicion(15, '页面长时间后台停留');
      }
    }
  }
  
  injectHoneypots() {
    // 创建隐藏的蜜罐表单字段
    const form = document.querySelector('form');
    if (!form) return;
    
    this.honeypotFields.forEach(fieldName => {
      const exists = form.querySelector(`[name="${fieldName}"]`);
      if (exists) return;
      
      const input = document.createElement('input');
      input.type = 'text';
      input.name = fieldName;
      input.id = fieldName;
      input.tabindex = -1;
      input.autocomplete = 'off';
      input.style.cssText = `
        position: absolute;
        left: -9999px;
        top: -9999px;
        opacity: 0;
        pointer-events: none;
      `;
      form.appendChild(input);
    });
  }
  
  detectMouseAnomaly() {
    const moves = this.state.mouseMoves;
    if (moves.length < 3) return;
    
    // 检测1：移动速度是否过于均匀（机器人特征）
    const velocities = [];
    for (let i = 1; i < moves.length; i++) {
      const dx = moves[i].x - moves[i-1].x;
      const dy = moves[i].y - moves[i-1].y;
      const dt = moves[i].t - moves[i-1].t;
      if (dt > 0) {
        velocities.push(Math.sqrt(dx*dx + dy*dy) / dt);
      }
    }
    
    if (velocities.length > 10) {
      const avg = velocities.reduce((a, b) => a + b, 0) / velocities.length;
      const variance = velocities.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / velocities.length;
      
      // 速度方差过小说明是自动化移动
      if (variance < 0.01) {
        this.increaseSuspicion(30, '鼠标移动模式异常');
      }
    }
    
    // 检测2：移动是否沿直线（机器人特征）
    if (moves.length >= 4) {
      const directions = [];
      for (let i = 2; i < moves.length; i++) {
        const angle1 = Math.atan2(
          moves[i-1].y - moves[i-2].y,
          moves[i-1].x - moves[i-2].x
        );
        const angle2 = Math.atan2(
          moves[i].y - moves[i-1].y,
          moves[i].x - moves[i-1].x
        );
        directions.push(Math.abs(angle2 - angle1));
      }
      
      // 方向变化过少说明是直线移动
      const avgDirectionChange = directions.reduce((a, b) => a + b, 0) / directions.length;
      if (avgDirectionChange < 0.1) {
        this.increaseSuspicion(25, '鼠标直线移动检测');
      }
    }
  }
  
  detectClickPattern() {
    const timestamps = this.state.clickTimestamps;
    if (timestamps.length < 3) return;
    
    // 检测点击间隔是否过于规律
    const intervals = [];
    for (let i = 1; i < timestamps.length; i++) {
      intervals.push(timestamps[i] - timestamps[i-1]);
    }
    
    const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance = intervals.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / intervals.length;
    
    // 点击间隔方差过小说明是自动化点击
    if (variance < 100) {
      this.increaseSuspicion(35, '点击间隔过于规律');
    }
  }
  
  detectKeystrokeAnomaly() {
    const keystrokes = this.state.keystrokes;
    if (keystrokes.length < 10) return;
    
    // 检测输入速度是否过于均匀
    const intervals = [];
    for (let i = 1; i < keystrokes.length; i++) {
      intervals.push(keystrokes[i].t - keystrokes[i-1].t);
    }
    
    const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    
    // 输入速度过快（平均间隔小于50ms）
    if (avg < 50) {
      this.increaseSuspicion(40, '打字速度异常快');
    }
    
    // 检测Tab键使用模式
    const tabCount = keystrokes.filter(k => k.key === 'Tab').length;
    if (tabCount > keystrokes.length * 0.5) {
      this.increaseSuspicion(20, '大量使用Tab键');
    }
  }
  
  increaseSuspicion(points, reason) {
    this.state.suspicionLevel += points;
    console.warn(`[BehaviorDetector] 嫌疑度增加 +${points}: ${reason}`);
    
    if (this.state.suspicionLevel >= 100) {
      this.state.isHuman = false;
      this.triggerVerification();
    }
  }
  
  triggerVerification() {
    // 触发验证码
    if (window.triggerCaptcha) {
      window.triggerCaptcha({
        reason: '行为异常',
        suspicionLevel: this.state.suspicionLevel
      });
    }
  }
  
  startIdleDetection() {
    setInterval(() => {
      const idleTime = Date.now() - this.state.lastActivity;
      
      // 超过空闲超时但有大量活动记录，说明是后台脚本
      if (idleTime > this.config.idleTimeout && this.state.clickCount > 0) {
        const avgInterval = this.state.lastActivity / this.state.clickCount;
        if (avgInterval < 100) {
          this.increaseSuspicion(30, '无操作时间与活动量不匹配');
        }
      }
    }, 10000);
  }
  
  reportBehavior() {
    const report = {
      clickCount: this.state.clickCount,
      mouseMoveCount: this.state.mouseMoves.length,
      keystrokeCount: this.state.keystrokes.length,
      suspicionLevel: this.state.suspicionLevel,
      isHuman: this.state.isHuman,
      honeypotTriggered: this.state.honeypotTriggered,
      sessionDuration: Date.now() - this.state.lastActivity,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      screenResolution: `${screen.width}x${screen.height}`,
      language: navigator.language,
      platform: navigator.platform
    };
    
    // 发送报告到服务器
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/behavior/report', JSON.stringify(report));
    }
    
    return report;
  }
  
  getBehaviorReport() {
    return {
      suspicionLevel: this.state.suspicionLevel,
      isHuman: this.state.isHuman,
      clickCount: this.state.clickCount,
      mouseMoves: this.state.mouseMoves.length,
      keystrokes: this.state.keystrokes.length,
      honeypotTriggered: this.state.honeypotTriggered
    };
  }
  
  reset() {
    this.state = {
      clickCount: 0,
      clickTimestamps: [],
      mouseMoves: [],
      lastActivity: Date.now(),
      isHuman: true,
      suspicionLevel: 0,
      keystrokes: [],
      scrollPatterns: [],
      touchEvents: [],
      formCompletionTime: null,
      honeypotTriggered: false
    };
  }
  
  // 获取验证Token
  getVerificationToken() {
    const timestamp = Date.now();
    const data = `${timestamp}:${this.state.suspicionLevel}:${navigator.userAgent}`;
    return btoa(data);
  }
}

// 创建全局实例
let behaviorDetector = null;

function initBehaviorDetector(options) {
  if (behaviorDetector) {
    return behaviorDetector;
  }
  behaviorDetector = new BehaviorDetector(options);
  return behaviorDetector;
}

function getBehaviorDetector() {
  return behaviorDetector;
}

module.exports = {
  BehaviorDetector,
  initBehaviorDetector,
  getBehaviorDetector
};
