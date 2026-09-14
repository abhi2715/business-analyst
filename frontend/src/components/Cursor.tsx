import React, { useEffect, useState } from 'react';

const Cursor: React.FC = () => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [clicked, setClicked] = useState(false);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
    };

    const handleMouseDown = () => setClicked(true);
    const handleMouseUp = () => setClicked(false);
    
    // Quick hack for hovering interactables
    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName.toLowerCase() === 'button' ||
        target.tagName.toLowerCase() === 'a' ||
        target.tagName.toLowerCase() === 'input' ||
        target.closest('button') ||
        target.closest('a')
      ) {
        setHovered(true);
      } else {
        setHovered(false);
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mouseover', handleMouseOver);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mouseover', handleMouseOver);
    };
  }, []);

  return (
    <>
      <div
        className={`custom-cursor-dot ${clicked ? 'clicked' : ''} ${hovered ? 'hovered' : ''}`}
        style={{ left: `${position.x}px`, top: `${position.y}px` }}
      />
      <div
        className={`custom-cursor-ring ${clicked ? 'clicked' : ''} ${hovered ? 'hovered' : ''}`}
        style={{ left: `${position.x}px`, top: `${position.y}px` }}
      />
      <style>{`
        .custom-cursor-dot {
          position: fixed;
          width: 8px;
          height: 8px;
          background-color: var(--accent-primary);
          border-radius: 50%;
          transform: translate(-50%, -50%);
          pointer-events: none;
          z-index: 9999;
          transition: width 0.2s, height 0.2s, background-color 0.2s;
        }
        .custom-cursor-ring {
          position: fixed;
          width: 32px;
          height: 32px;
          border: 1px solid var(--accent-primary);
          border-radius: 50%;
          transform: translate(-50%, -50%);
          pointer-events: none;
          z-index: 9998;
          transition: width 0.2s, height 0.2s, border-color 0.2s, top 0.1s ease-out, left 0.1s ease-out;
        }
        .custom-cursor-dot.hovered {
          width: 12px;
          height: 12px;
          background-color: #a855f7;
        }
        .custom-cursor-ring.hovered {
          width: 48px;
          height: 48px;
          border-color: #a855f7;
          background-color: rgba(168, 85, 247, 0.1);
        }
        .custom-cursor-dot.clicked {
          transform: translate(-50%, -50%) scale(0.7);
        }
        .custom-cursor-ring.clicked {
          transform: translate(-50%, -50%) scale(1.2);
          background-color: rgba(99, 102, 241, 0.2);
        }
      `}</style>
    </>
  );
};

export default Cursor;
