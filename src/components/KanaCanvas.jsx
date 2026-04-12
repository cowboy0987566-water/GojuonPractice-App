import React, { useRef, useEffect, useState, useImperativeHandle, forwardRef } from 'react';

/**
 * KanaCanvas 組件
 * 提供米字格背景、筆劃順序引導 SVG 以及 Canvas 手寫功能。
 */
export const KanaCanvas = forwardRef(({ char, strokeColor = '#000000', lineWidth = 6 }, ref) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [svgUrl, setSvgUrl] = useState('');

  // 將假名轉換為 KanjiVG 格式的 Unicode 字串 (例如 'あ' -> 03042)
  useEffect(() => {
    if (!char) return;
    const codePoint = char.charCodeAt(0).toString(16).padStart(5, '0');
    setSvgUrl(`https://raw.githubusercontent.com/KanjiVG/kanjivg/master/kanji/${codePoint}.svg`);
    clearCanvas();
  }, [char]);

  // 暴露清除方法給父組件
  useImperativeHandle(ref, () => ({
    clear: clearCanvas
  }));

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  // 初始化 Canvas 尺寸
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // 處理高解析度螢幕 (Retina)
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = lineWidth;
  }, [strokeColor, lineWidth]);

  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    // 支援 Pointer Events (包括滑鼠和觸控)
    let clientX, clientY;
    if (e.clientX !== undefined) {
      clientX = e.clientX;
      clientY = e.clientY;
    } else if (e.touches && e.touches[0]) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startDrawing = (e) => {
    e.preventDefault();
    const { x, y } = getCoordinates(e);
    const ctx = canvasRef.current.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const { x, y } = getCoordinates(e);
    const ctx = canvasRef.current.getContext('2d');
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (isDrawing) {
      const ctx = canvasRef.current.getContext('2d');
      ctx.closePath();
      setIsDrawing(false);
    }
  };

  return (
    <div className="relative w-52 h-52 bg-white rounded-2xl border-2 border-rose-100 shadow-inner overflow-hidden flex items-center justify-center select-none touch-none">
      {/* 1. 米字格背景 */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        {/* 十字線 */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-full h-[1px] border-t border-dashed border-rose-500"></div>
          <div className="h-full w-[1px] border-l border-dashed border-rose-500 absolute"></div>
        </div>
        {/* 斜對角線 */}
        <div className="absolute inset-0 flex items-center justify-center rotate-45">
          <div className="w-full h-[1px] border-t border-dashed border-rose-500"></div>
          <div className="h-full w-[1px] border-l border-dashed border-rose-500 absolute"></div>
        </div>
      </div>

      {/* 2. 筆劃引導層 (SVG) */}
      {svgUrl && (
        <img 
          src={svgUrl} 
          alt={char}
          className="absolute inset-0 w-full h-full pointer-events-none opacity-20 transition-opacity duration-300 scale-[1.2]"
          style={{ filter: 'grayscale(100%) brightness(50%)' }}
          onError={(e) => { e.target.style.display = 'none'; }}
        />
      )}

      {/* 3. 手寫 Canvas 層 */}
      <canvas
        ref={canvasRef}
        className="relative z-10 w-full h-full cursor-crosshair"
        onPointerDown={startDrawing}
        onPointerMove={draw}
        onPointerUp={stopDrawing}
        onPointerLeave={stopDrawing}
      />
    </div>
  );
});
