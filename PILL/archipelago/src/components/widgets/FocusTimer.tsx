import { useFocusTimer } from '../../hooks/useFocusTimer';

function formatTimer(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${minutes}:${remainingSeconds
    .toString()
    .padStart(2, '0')}`;
}

export function FocusTimer() {
  const {
    secondsRemaining,
    isRunning,
    start,
    pause,
    reset,
  } = useFocusTimer();

  const handleToggle = () => {
    if (isRunning) {
      void pause();
    } else {
      void start();
    }
  };

  return (
    <div
      className="focus-timer"
      aria-label="Focus timer"
    >
      <div className="focus-timer__display">
        {formatTimer(secondsRemaining)}
      </div>

      <div className="focus-timer__controls">
        <button
          type="button"
          className="focus-timer__button"
          onClick={handleToggle}
          aria-label={isRunning ? 'Pause focus timer' : 'Start focus timer'}
        >
          {isRunning ? 'Ⅱ' : '▶'}
        </button>

        <button
          type="button"
          className="focus-timer__button"
          onClick={() => void reset()}
          aria-label="Reset focus timer"
        >
          ↻
        </button>
      </div>
    </div>
  );
}