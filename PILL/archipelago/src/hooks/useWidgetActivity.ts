import { useEffect } from 'react';
import { useMedia } from './useMedia';
import { useFocusTimer } from './useFocusTimer';
import { useWidgetStore } from '../store/widgetStore';

export function useWidgetActivity() {
  const { hasMedia } = useMedia();
  const { status } = useFocusTimer();

  const activateWidget = useWidgetStore(
    (state) => state.activateWidget,
  );

  const deactivateWidget = useWidgetStore(
    (state) => state.deactivateWidget,
  );

  useEffect(() => {
    if (hasMedia) {
      activateWidget('media');
    } else {
      deactivateWidget('media');
    }
  }, [
    hasMedia,
    activateWidget,
    deactivateWidget,
  ]);

  useEffect(() => {
    if (status !== 'idle') {
      activateWidget('focusTimer');
    } else {
      deactivateWidget('focusTimer');
    }
  }, [
    status,
    activateWidget,
    deactivateWidget,
  ]);
}