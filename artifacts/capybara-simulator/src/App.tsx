import { GameScene } from './components/game/GameScene';
import { HUD } from './components/ui/HUD';
import { MainMenu } from './components/ui/MainMenu';
import { RaceHUD } from './components/ui/RaceHUD';
import { MobileControls } from './components/ui/MobileControls';

function App() {
  return (
    <>
      <GameScene />
      <MainMenu />
      <HUD />
      <RaceHUD />
      <MobileControls />
    </>
  );
}

export default App;
