/**
 * 背景随鼠标移动效果
 */
function initMouseTracker() {
    const bgCanvas = document.getElementById('bg-canvas');
    
    if (!bgCanvas) return;
    
    document.addEventListener('mousemove', (e) => {
        const { clientX, clientY } = e;
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        
        // 计算鼠标偏离中心的距离比例 (-1 到 1)
        const moveX = (clientX - centerX) / centerX * 10;  // 最大偏移 10px
        const moveY = (clientY - centerY) / centerY * 10;  // 最大偏移 10px
        
        bgCanvas.style.transform = `translate(${moveX}px, ${moveY}px)`;
    });
}

/**
 * MD3 Dynamic Color Engine
 */

/**
 * 下拉菜单管理
 */
function initDropdown() {
    const dropdowns = document.querySelectorAll('.dropdown');

    if (!dropdowns.length) return;

    dropdowns.forEach((dropdown) => {
        const trigger = dropdown.querySelector('.dropdown-trigger');
        if (!trigger) return;

        trigger.addEventListener('click', (e) => {
            e.preventDefault();
            dropdown.classList.toggle('active');
        });

        // 防止播放器内部点击冒泡关闭下拉菜单
        const content = dropdown.querySelector('.dropdown-content');
        if (content) {
            content.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        }
    });

    // 点击外部关闭所有下拉
    document.addEventListener('click', (e) => {
        dropdowns.forEach((dropdown) => {
            if (!dropdown.contains(e.target)) {
                dropdown.classList.remove('active');
            }
        });
    });
}

// 在DOM加载完成后执行
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initDropdown();
        initBackgroundEngine();
        initMouseTracker();
    });
} else {
    initDropdown();
    initBackgroundEngine();
    initMouseTracker();
}

/**
 * 背景色彩引擎
 */
function initBackgroundEngine() {
    const img = document.getElementById('bg-canvas');
    
    if (!img) {
        console.error("Background image element not found!");
        return;
    }
    
    console.log("Background image element found, src:", img.src);

    // 图片加载失败处理
    img.onerror = function() {
        console.warn("Background image not found. Using default blue palette.");
        this.style.opacity = '0';
    };

    // 图片加载成功后的动态色彩提取
    img.onload = function() {
        console.log("Background image loaded successfully");
        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // 从图片中心采样 100x100 的区域以获取更准确的色调
            const sampleSize = 100;
            canvas.width = sampleSize;
            canvas.height = sampleSize;
            
            // 计算中心位置
            const centerX = (img.width - sampleSize) / 2;
            const centerY = (img.height - sampleSize) / 2;
            
            // 从中心裁剪并绘制
            ctx.drawImage(img, centerX, centerY, sampleSize, sampleSize, 0, 0, sampleSize, sampleSize);
            
            // 获取采样区域的所有像素数据
            const imageData = ctx.getImageData(0, 0, sampleSize, sampleSize);
            const data = imageData.data;
            
            // 计算平均RGB（忽略透明度）
            let r = 0, g = 0, b = 0;
            const pixelCount = data.length / 4;
            
            for (let i = 0; i < data.length; i += 4) {
                r += data[i];
                g += data[i + 1];
                b += data[i + 2];
            }
            
            r = Math.round(r / pixelCount);
            g = Math.round(g / pixelCount);
            b = Math.round(b / pixelCount);
            
            console.log(`Extracted accent color - R: ${r}, G: ${g}, B: ${b}`);
            window.lastExtractedColor = {r, g, b};
            updateColors(r, g, b);
        } catch (e) {
            // 处理跨域图片限制
            console.error("Canvas error: Possibly CORS related.", e);
        }
    };

    // 如果图片已经缓存加载了
    if (img.complete) {
        console.log("Image already cached, triggering onload manually");
        img.onload?.call(img);
    }
}

/**
 * 根据提取的 RGB 更新全局 CSS 变量
 */
function updateColors(r, g, b) {
    const [h, s, l] = rgbToHsl(r, g, b);
    
    // 提升饱和度以获得更鲜艳的颜色
    // 如果饱和度过低（灰色背景），使用更高的默认饱和度
    let targetSaturation = s < 15 ? 60 : Math.min(s * 1.3, 100);  // 提升饱和度到最多 130%
    const root = document.documentElement;

    // 深色模式色彩配置 - 使用更高的饱和度获得更鲜艳的效果
    const primary = `hsl(${h}, ${Math.max(targetSaturation, 50)}%, 75%)`;
    const onPrimary = `hsl(${h}, ${targetSaturation}%, 15%)`;
    const primaryContainer = `hsl(${h}, ${Math.max(targetSaturation, 45)}%, 35%)`;
    const onPrimaryContainer = `hsl(${h}, ${Math.max(targetSaturation, 40)}%, 95%)`;
    
    const surface = `hsl(${h}, 10%, 10%)`;
    const onSurface = `hsl(${h}, 10%, 90%)`;
    const surfaceVariant = `hsl(${h}, 15%, 25%)`;
    const onSurfaceVariant = `hsl(${h}, 10%, 80%)`;
    const outline = `hsl(${h}, 10%, 60%)`;

    root.style.setProperty('--md-sys-color-primary', primary);
    root.style.setProperty('--md-sys-color-on-primary', onPrimary);
    root.style.setProperty('--md-sys-color-primary-container', primaryContainer);
    root.style.setProperty('--md-sys-color-on-primary-container', onPrimaryContainer);
    root.style.setProperty('--md-sys-color-surface', surface);
    root.style.setProperty('--md-sys-color-on-surface', onSurface);
    root.style.setProperty('--md-sys-color-surface-variant', surfaceVariant);
    root.style.setProperty('--md-sys-color-on-surface-variant', onSurfaceVariant);
    root.style.setProperty('--md-sys-color-outline', outline);
    
    console.log(`Applied vibrant dark mode colors - H: ${h}°, S: ${targetSaturation}%`);
}

/**
 * 辅助函数：RGB 转 HSL
 */
function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
        h = s = 0;
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}