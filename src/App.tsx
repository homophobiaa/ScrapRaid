import { useMemo, useRef } from 'react';
import { AppHeader } from './components/AppHeader';
import { AppFooter } from './components/AppFooter';
import { CropConsole } from './components/CropConsole';
import { ResultPanel } from './components/ResultPanel';
import { MobileTotalBar } from './components/MobileTotalBar';
import { useFarm } from './hooks/useFarm';
import { useOnScreen } from './hooks/useOnScreen';
import { calculateRaid } from './lib/raidCalc';
import styles from './App.module.css';

export default function App() {
  const farm = useFarm();
  const readoutRef = useRef<HTMLDivElement>(null);
  const readoutOnScreen = useOnScreen(readoutRef);

  const jumpToForecast = () =>
    readoutRef.current?.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      block: 'center',
    });

  const result = useMemo(
    () => calculateRaid(farm.quantities, farm.players),
    [farm.quantities, farm.players],
  );

  return (
    <div className={styles.shell}>
      <AppHeader />

      <main className={styles.console}>
        <div className={styles.cropColumn}>
          <CropConsole
            contributions={result.contributions}
            isEmpty={farm.isEmpty}
            onSet={farm.setQuantity}
            onAdjust={farm.adjustQuantity}
            onClear={farm.clearFarm}
          />
        </div>

        <div className={styles.resultColumn}>
          <ResultPanel
            result={result}
            players={farm.players}
            isEmpty={farm.isEmpty}
            onPlayersChange={farm.setPlayers}
            readoutRef={readoutRef}
          />
        </div>
      </main>

      <AppFooter />

      <MobileTotalBar
        tier={result.tier}
        totalValue={result.totalValue}
        pointsToNext={result.pointsToNext}
        nextLabel={result.nextTier?.label ?? null}
        hidden={readoutOnScreen}
        onJumpToForecast={jumpToForecast}
      />
    </div>
  );
}
