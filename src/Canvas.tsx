import React, { useRef, useEffect, useState } from 'react';

// Определяем интерфейс для шаров
export interface Ball {
  id: number; // Уникальный идентификатор шара
  x: number; // Координата X центра шара
  y: number; // Координата Y центра шара
  radius: number; // Радиус шара
  color: string; // Цвет шара
  vx: number; // Скорость по оси X
  vy: number; // Скорость по оси Y
}

// Определяем интерфейс для свойств компонента Canvas
interface CanvasProps {
  balls: Ball[]; // Массив шаров
  setBalls: React.Dispatch<React.SetStateAction<Ball[]>>; // Функция для обновления массива шаров
}

const Canvas: React.FC<CanvasProps> = ({ balls, setBalls }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null); // Ссылка на элемент canvas
  const [selectedBall, setSelectedBall] = useState<Ball | null>(null); // Выбранный шар
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number } | null>(null); // Смещение для перетаскивания

  useEffect(() => {
    // Функция для отрисовки шаров на canvas
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const updateCanvas = () => {
      // Очищаем canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      // Рисуем каждый шар
      balls.forEach(ball => {
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        ctx.fillStyle = ball.color;
        ctx.fill();
        ctx.closePath();
      });
    };
    // Вызываем функцию отрисовки
    updateCanvas();

    const handleCollision = (ball: Ball) => {
      if (ball.x - ball.radius < 0 || ball.x + ball.radius > canvas.width) {
        ball.vx *= -1; // Отражаем шар по оси x
        // Скорректируем позицию, чтобы шар не выходил за пределы
        if (ball.x - ball.radius < 0) {
          ball.x = ball.radius;
        } else {
          ball.x = canvas.width - ball.radius;
        }
      }
      if (ball.y - ball.radius < 0 || ball.y + ball.radius > canvas.height) {
        ball.vy *= -1; // Отражаем шар по оси y
        // Скорректируем позицию, чтобы шар не выходил за пределы
        if (ball.y - ball.radius < 0) {
          ball.y = ball.radius;
        } else {
          ball.y = canvas.height - ball.radius;
        }
      }

      // Обработка столкновений с другими шарами
      balls.forEach(otherBall => {
        if (ball.id !== otherBall.id) {
          const dx = ball.x - otherBall.x;
          const dy = ball.y - otherBall.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance < ball.radius + otherBall.radius) {
            const angle = Math.atan2(dy, dx);
            const sine = Math.sin(angle);
            const cosine = Math.cos(angle);

            let vx = ball.vx * cosine + ball.vy * sine;
            let vy = ball.vy * cosine - ball.vx * sine;
            let vx2 = otherBall.vx * cosine + otherBall.vy * sine;
            let vy2 = otherBall.vy * cosine - otherBall.vx * sine;

            const vxTotal = vx - vx2;
            vx = ((ball.radius - otherBall.radius) * vx + 2 * otherBall.radius * vx2) / (ball.radius + otherBall.radius);
            vx2 = vxTotal + vx;

            ball.vx = vx * cosine - vy * sine;
            ball.vy = vy * cosine + vx * sine;
            otherBall.vx = vx2 * cosine - vy2 * sine;
            otherBall.vy = vy2 * cosine + vx2 * sine;

            const overlap = ball.radius + otherBall.radius - distance;
            const moveX = overlap * Math.cos(angle);
            const moveY = overlap * Math.sin(angle);

            ball.x -= moveX / 2;
            ball.y -= moveY / 2;
            otherBall.x += moveX / 2;
            otherBall.y += moveY / 2;
          }
        }
      });
    };
    // Функция для обновления состояния шаров
    const updateBalls = () => {
      setBalls(prevBalls =>
        prevBalls.map(ball => {
          // Логика обновления позиции шаров
          handleCollision(ball);
          return {
            ...ball,
            x: ball.x + ball.vx,
            y: ball.y + ball.vy,
          };
        })
      );
    };
    // Устанавливаем интервал для обновления позиции шаров
    const intervalId = setInterval(updateBalls, 1000 / 60);
    // Очищаем интервал при размонтировании компонента
    return () => clearInterval(intervalId);
  }, [balls, setBalls]);
  // Обработчик события нажатия на canvas
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // Получаем координаты мыши относительно canvas
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    // Проверяем, попадает ли нажатие на какой-либо шар
    balls.forEach(ball => {
      const dx = ball.x - mouseX;
      const dy = ball.y - mouseY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < ball.radius) {
        setSelectedBall(ball);
        setDragOffset({ x: dx, y: dy });
      }
    });
  };
  // Обработчик события перемещения мыши по canvas
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!selectedBall || !dragOffset) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    // Получаем координаты мыши относительно canvas
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    // Вычисляем новые координаты для перетаскиваемого шара
    const updatedX = mouseX + dragOffset.x;
    const updatedY = mouseY + dragOffset.y;
    // Обновляем позицию перетаскиваемого шара
    setBalls(prevBalls =>
      prevBalls.map(ball => {
        if (ball.id === selectedBall.id) {
          return { ...ball, x: updatedX, y: updatedY };
        }
        return ball;
      })
    );
  };
  // Обработчик события отпускания кнопки мыши
  const handleMouseUp = () => {
    setSelectedBall(null);
    setDragOffset(null);
  };
  // Возвращаем элемент canvas с обработчиками событий
  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={600}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      style={{ border: '1px solid black' }}
    />
  );
};

export default Canvas;
