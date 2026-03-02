import React, { useRef, useEffect } from 'react';
import './Waveform.css';

function Waveform({ analyserNode, mode = 'idle' }) {
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvas.offsetWidth * dpr;
    canvas.height = canvas.offsetHeight * dpr;
    ctx.scale(dpr, dpr);
    const W = canvas.offsetWidth;
    const H = canvas.offsetHeight;

    if (mode === 'recording' && analyserNode) {
      const bufLen = analyserNode.frequencyBinCount;
      const dataArray = new Uint8Array(bufLen);

      const draw = () => {
        animFrameRef.current = requestAnimationFrame(draw);
        analyserNode.getByteTimeDomainData(dataArray);
        ctx.clearRect(0, 0, W, H);

        // Thick, easy-to-see waveform
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#c0392b';
        ctx.beginPath();

        const sliceWidth = W / bufLen;
        let x = 0;
        for (let i = 0; i < bufLen; i++) {
          const v = dataArray[i] / 128.0;
          const y = (v * H) / 2;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
          x += sliceWidth;
        }
        ctx.lineTo(W, H / 2);
        ctx.stroke();
      };
      draw();
    } else {
      // Static bars - simple and clear
      ctx.clearRect(0, 0, W, H);
      const bars = 30;
      const barWidth = W / bars - 3;
      const color = mode === 'idle' ? '#ccc' : '#1a5632';

      for (let i = 0; i < bars; i++) {
        const seed = Math.sin(i * 12.345 + 6.789) * 0.5 + 0.5;
        const h = seed * H * 0.7 + H * 0.15;
        const x = i * (barWidth + 3);
        const y = (H - h) / 2;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, h, 3);
        ctx.fill();
      }
    }

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [analyserNode, mode]);

  return (
    <div className="waveform-container">
      <canvas ref={canvasRef} className="waveform-canvas" />
    </div>
  );
}

export default Waveform;
