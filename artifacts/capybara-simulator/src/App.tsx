import { GameScene } from './components/game/GameScene';
import { HUD } from './components/ui/HUD';
import { MainMenu } from './components/ui/MainMenu';
import { RaceHUD } from './components/ui/RaceHUD';

function App() {
  return (
    <>
      <GameScene />
      <MainMenu />
      <HUD />
      <RaceHUD />
    </>
  );
}

export default App;
