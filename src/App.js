import React, { useState, useEffect, useRef } from 'react';
import { Stage, Layer, Rect, Circle } from 'react-konva';
import { Howl } from 'howler';

const App = () => {
  const [ball, setBall] = useState({ x: 200, y: 200, dx: 2, dy: 2 });
  const [platform, setPlatform] = useState({ x: 150, y: 400, width: 100, height: 10 });
  const [blocks, setBlocks] = useState(
    Array.from({ length: 5 }, (_, i) => ({ x: i * 80, y: 50, width: 60, height: 20 }))
  );
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [destroyedBlocks, setDestroyedBlocks] = useState([]);

  const hitSound = new Howl({ src: ['hit.wav'] });
  const blockBreakSound = new Howl({ src: ['block-break.wav'] });

  const stageRef = useRef(null);

  // Инициализация телеги
  useEffect(() => {
    console.log(window)
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.ready();
      tg.MainButton.color = "#3498db";
    } else {
      console.error("Telegram Web App API не доступен. Убедитесь, что приложение запущено через Telegram.");
    }
  }, []);

  // Получение данных из телеги
  useEffect(() => {
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      console.log("Пользователь:", tg.initDataUnsafe?.user?.first_name);
    } else {
      console.error("Telegram Web App API не доступен. Убедитесь, что приложение запущено через Telegram.");
    }
  }, []);

  // Логика движения шарика
  useEffect(() => {
    const interval = setInterval(() => {
      setBall((prev) => {
        let newBall = { ...prev, x: prev.x + prev.dx, y: prev.y + prev.dy };

        // Проверка столкновений с границами
        if (newBall.x <= 0 || newBall.x >= 400) newBall.dx *= -1;
        if (newBall.y <= 0) newBall.dy *= -1;

        // Проверка проигрыша
        if (newBall.y >= 450) {
          clearInterval(interval);
        }

        // Столкновение с платформой
        if (
          newBall.y + 10 >= platform.y &&
          newBall.x >= platform.x &&
          newBall.x <= platform.x + platform.width
        ) {
          hitSound.play();
          newBall.dy *= -1;
        }

        // Проверка столкновения с блоками
        blocks.forEach((block, index) => {
          if (
            newBall.y - 10 <= block.y + block.height &&
            newBall.x >= block.x &&
            newBall.x <= block.x + block.width
          ) {
            blockBreakSound.play();
            setDestroyedBlocks((prev) => [...prev, index]); // Добавляем индекс блока в список уничтоженных
            setBlocks((prev) => prev.filter((_, idx) => idx !== index));
            setScore((prev) => prev + 10); // Увеличиваем очки
            newBall.dy *= -1;
          }
        });

        if (blocks.length === 0) {
          setLevel((prev) => prev + 1); // Переходим на следующий уровень
          setBlocks(
            Array.from({ length: 5 + level }, (_, i) => ({
              x: (i % 5) * 80,
              y: Math.floor(i / 5) * 30 + 50,
              width: 60,
              height: 20,
            }))
          );
          setBall({
            x: 200,
            y: 200,
            dx: prev.dx > 0 ? prev.dx + 0.5 : prev.dx - 0.5, // Увеличиваем скорость
            dy: prev.dy > 0 ? prev.dy + 0.5 : prev.dy - 0.5,
          }); // Сбрасываем позицию шарика
        }

        return newBall;
      });
    }, 8);

    return () => clearInterval(interval);
  }, [platform, blocks, level]);

  // Управление платформой с клавиатуры
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft' && platform.x > 0) {
        setPlatform((prev) => ({ ...prev, x: prev.x - 30 }));
      }
      if (e.key === 'ArrowRight' && platform.x < 300) {
        setPlatform((prev) => ({ ...prev, x: prev.x + 30 }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [platform]);

  return (
    <div style={{border: '1px solid black', width: 'min-content'}}>
      <div style={{ textAlign: 'center', marginBottom: '10px', fontSize: '20px' }}>
        Очки: {score} | Уровень: {level}
      </div>
      <Stage width={400} height={450} ref={stageRef}>
        <Layer>
          <Rect width={400} height={450} fill="#000" />
          {/* Шарик */}
          <Circle x={ball.x} y={ball.y} radius={10} fill="yellow" />
          {/* Платформа */}
          <Rect
            x={platform.x}
            y={platform.y}
            width={platform.width}
            height={platform.height}
            fill="#3498db"
          />
          {/* Блоки */}
          {blocks.map((block, index) => (
            <Rect
              key={index}
              x={block.x}
              y={block.y}
              width={block.width}
              height={block.height}
              fill={destroyedBlocks.includes(index) ? 'transparent' : 'green'}
              opacity={destroyedBlocks.includes(index) ? 0.5 : 1}
            />
          ))}
        </Layer>
      </Stage>
      <button
        style={{
          display: 'block',
          margin: '10px auto',
          padding: '10px 20px',
          fontSize: '16px',
        }}
        onClick={() => {
          setScore(0);
          setLevel(1);
          setBlocks(
            Array.from({ length: 5 }, (_, i) => ({
              x: i * 80,
              y: 50,
              width: 60,
              height: 20,
            }))
          );
          setBall({ x: 200, y: 200, dx: 2, dy: 2 });
        }}
      >
        Начать заново
      </button>
    </div>
  );
};

export default App;
