import { GameScene } from './components/game/GameScene';
import { HUD } from './components/ui/HUD';
import { MainMenu } from './components/ui/MainMenu';

function App() {
  return (
    <>
      <GameScene />
      <MainMenu />
      <HUD />
    </>
  );
}

export default App;
