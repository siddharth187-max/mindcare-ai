import React, { useImperativeHandle, forwardRef, useRef } from 'react';

const ConfettiCanvas = forwardRef((props, ref) => {
  const containerRef = useRef(null);

  useImperativeHandle(ref, () => ({
    triggerConfetti: () => {
      const canvas = document.createElement('canvas');
      canvas.className = 'fixed top-0 left-0 w-full h-full pointer-events-none z-50';
      
      if (containerRef.current) {
        containerRef.current.appendChild(canvas);
      } else {
        document.body.appendChild(canvas);
      }

      const ctx = canvas.getContext('2d');
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      
      const particles = Array.from({ length: 60 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height * 0.4,
        size: Math.random() * 8 + 6,
        color: ['#397F7A', '#8DB7A5', '#4F8A5B', '#D9A441', '#263B42', '#79A391'][Math.floor(Math.random() * 6)],
        speedY: Math.random() * 3 + 2,
        speedX: Math.random() * 4 - 2,
        rotation: Math.random() * 360
      }));
      
      let frame = 0;
      function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(p => {
          p.y += p.speedY;
          p.x += p.speedX;
          p.rotation += 4;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
          ctx.restore();
        });
        frame++;
        if (frame < 90) {
          requestAnimationFrame(animate);
        } else {
          canvas.remove();
        }
      }
      animate();
    }
  }));

  return <div ref={containerRef} className="absolute inset-0 pointer-events-none" />;
});

export default ConfettiCanvas;
