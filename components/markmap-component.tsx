'use client'

import React, { useEffect, useRef } from 'react';
import { Markmap } from 'markmap-view';
import { Transformer } from 'markmap-lib';
import { IMarkmapOptions } from 'markmap-common';

interface MarkmapProps {
  markdown: string;
  taskId?: string;
  theme?: 'light' | 'dark';
}

const MarkmapComponent: React.FC<MarkmapProps> = ({ markdown, taskId, theme = 'light' }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const mmRef = useRef<any>(null);
  const scaleRef = useRef(1);  // 保存当前缩放比例

  useEffect(() => {
    if (svgRef.current && markdown) {
      try {
        if (svgRef.current) {
          svgRef.current.innerHTML = '';
        }
        
        const transformer = new Transformer();
        const { root } = transformer.transform(markdown);

        const options: IMarkmapOptions = {
          embedGlobalCSS: true,
          scrollForPan: true,
          pan: true,
          zoom: true,
          nodeMinHeight: 16,
          paddingX: 20,
          spacingHorizontal: 100,
          spacingVertical: 5,
          initialExpandLevel: -1,
          maxInitialScale: 1,
          duration: 500,
          maxWidth: 300,
          toggleRecursively: true,
          autoFit: true,
          fitRatio: 0.95,
          color: (node: any) => {
            const colors = ['#90caf9', '#a5d6a7', '#ffcc80', '#ef9a9a'];
            return colors[node.depth % colors.length];
          },
        };

        // 创建 markmap 实例
        mmRef.current = Markmap.create(svgRef.current, options, root);

        // 初始化视图
        requestAnimationFrame(() => {
          if (mmRef.current) {
            mmRef.current.fit();
            mmRef.current.rescale(scaleRef.current);
            mmRef.current.setData(root);
          }
        });

        const svg = svgRef.current;
        svg.style.backgroundColor = 'transparent';
        
        // 设置文本和线条颜色
        const textElements = svg.getElementsByTagName('text');
        for (let i = 0; i < textElements.length; i++) {
          textElements[i].style.fill = '#ffffff';
        }

        const pathElements = svg.getElementsByTagName('path');
        for (let i = 0; i < pathElements.length; i++) {
          pathElements[i].style.stroke = '#ffffff80';
        }

        // 修改滚轮缩放的处理函数
        const handleWheel = (e: WheelEvent) => {
          e.preventDefault();
          if (!mmRef.current) return;

          // 使用更小的缩放步进值，让缩放更平滑
          const scaleStep = 0.05;  // 从 0.1 改为 0.05
          
          // 使用 deltaY 的实际值来计算缩放因子，而不是简单的正负号
          const delta = -e.deltaY / Math.abs(e.deltaY);
          const scaleFactor = 1 + (delta * scaleStep);
          
          // 更新缩放比例
          scaleRef.current *= scaleFactor;
          
          // 限制缩放范围，使用更精细的范围
          scaleRef.current = Math.min(Math.max(scaleRef.current, 0.2), 3);

          // 获取鼠标相对于 SVG 的位置
          const rect = svg.getBoundingClientRect();
          const offsetX = (e.clientX - rect.left) / svg.clientWidth;
          const offsetY = (e.clientY - rect.top) / svg.clientHeight;

          // 使用 requestAnimationFrame 来平滑缩放动画
          requestAnimationFrame(() => {
            mmRef.current.rescale(scaleRef.current);
            
            // 如果缩放比例太小，平滑过渡到自适应视图
            if (scaleRef.current <= 0.3) {
              requestAnimationFrame(() => {
                mmRef.current.fit();
                scaleRef.current = mmRef.current.state.scale;
              });
            }
          });
        };

        // 添加拖动功能
        let isDragging = false;
        let lastX = 0;
        let lastY = 0;

        const handleMouseDown = (e: MouseEvent) => {
          isDragging = true;
          lastX = e.clientX;
          lastY = e.clientY;
          svg.style.cursor = 'grabbing';
        };

        const handleMouseMove = (e: MouseEvent) => {
          if (!isDragging || !mmRef.current) return;
          
          const dx = e.clientX - lastX;
          const dy = e.clientY - lastY;
          lastX = e.clientX;
          lastY = e.clientY;

          const { x, y } = mmRef.current.state;
          mmRef.current.setPosition(x + dx, y + dy);
        };

        const handleMouseUp = () => {
          isDragging = false;
          svg.style.cursor = 'grab';
        };

        // 添加事件监听器
        svg.addEventListener('wheel', handleWheel, { passive: false });
        svg.addEventListener('mousedown', handleMouseDown);
        svg.addEventListener('mousemove', handleMouseMove);
        svg.addEventListener('mouseup', handleMouseUp);
        svg.addEventListener('mouseleave', handleMouseUp);
        
        // 设置初始光标样式
        svg.style.cursor = 'grab';

        // 清理函数
        return () => {
          svg.removeEventListener('wheel', handleWheel);
          svg.removeEventListener('mousedown', handleMouseDown);
          svg.removeEventListener('mousemove', handleMouseMove);
          svg.removeEventListener('mouseup', handleMouseUp);
          svg.removeEventListener('mouseleave', handleMouseUp);
          if (mmRef.current) {
            mmRef.current.destroy?.();
            mmRef.current = null;
          }
        };
      } catch (error) {
        console.error('渲染思维导图失败:', error);
      }
    }
  }, [markdown]);

  return (
    <div className="w-full min-h-[500px] bg-transparent rounded-lg p-4" data-task-id={taskId}>
      <svg 
        ref={svgRef} 
        className="w-full h-[500px]"
        style={{
          background: 'transparent',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
        }}
      />
    </div>
  );
};

export default MarkmapComponent;