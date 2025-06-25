/**
 * 防止移动设备上双击缩放的工具函数
 */

// 上次触摸时间
let lastTouchEnd = 0;

/**
 * 初始化防止双击缩放功能
 */
export function setupPreventZoom() {
  // 阻止双指缩放
  document.addEventListener('touchstart', function(event) {
    if (event.touches.length > 1) {
      event.preventDefault();
    }
  }, { passive: false });
  
  // 阻止双击缩放
  document.addEventListener('touchend', function(event) {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) {
      event.preventDefault();
    }
    lastTouchEnd = now;
  }, { passive: false });
}

export default setupPreventZoom;