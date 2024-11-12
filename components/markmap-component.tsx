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

  useEffect(() => {
    let mm: any = null;
    
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

        mm = Markmap.create(svgRef.current, options, root);

        requestAnimationFrame(() => {
          mm.fit();
          mm.rescale(1);
          mm.setData(root);
        });

        const svg = svgRef.current;
        svg.style.backgroundColor = 'transparent';
        
        const textElements = svg.getElementsByTagName('text');
        for (let i = 0; i < textElements.length; i++) {
          textElements[i].style.fill = '#ffffff';
        }

        const pathElements = svg.getElementsByTagName('path');
        for (let i = 0; i < pathElements.length; i++) {
          pathElements[i].style.stroke = '#ffffff80';
        }

      } catch (error) {
        console.error('渲染思维导图失败:', error);
      }
    }

    return () => {
      if (mm) {
        mm.destroy?.();
      }
    };
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