import React, { useState } from 'react';
import Canvas, { Ball } from './Canvas';

const App: React.FC = () => {
  const [balls, setBalls] = useState<Ball[]>([
    { id: 1, x: 100, y: 100, radius: 20, color: 'red', vx: 1, vy: 1 },
    { id: 2, x: 200, y: 200, radius: 30, color: 'blue', vx: -1, vy: -1 },
    { id: 3, x: 300, y: 300, radius: 40, color: 'black', vx: -1, vy: -1 },
  ]);

  return (
    <div className='App'>
      <Canvas balls={balls} setBalls={setBalls} />
    </div>
  );
};

export default App;
