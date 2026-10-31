import {
  useEffect,
  useRef,
} from 'react';

import {
  AnimatePresence,
  motion,
} from 'framer-motion';

import {
  recordReactRender,
  startPerfDiagnostics,
} from '../../lib/perfDiagnostics';

import { useWeatherSource } from '../../hooks/useWeatherSource';
import { QuickSettings } from './QuickSettings';
import { useEvasion } from '../../hooks/useEvasion';
import { useDesktopPreferences } from '../../hooks/useDesktopPreferences';
import { cancelCollapse, synchronizeIslandWindow } from '../../lib/islandCoordinator';
import { useFeatureCoordinator } from '../../hooks/useFeatureCoordinator';
import { useFeatureSources } from '../../hooks/useFeatureSources';
import { useIslandState } from '../../hooks/useIslandState';
import { useSettingsSource } from '../../hooks/useSettingsSource';
import { useWidgetLayoutSync } from '../../hooks/useWidgetLayoutSync';
import { useWidgetOrchestrator } from '../../hooks/useWidgetOrchestrator';

import {
  ISLAND_DIMENSIONS,
  isIslandVisible,
  SPRING_CONFIG,
  useIslandStore,
} from '../../store/islandStore';

import {
  useSettingsStore,
} from '../../store/settingsStore';

import { IdleState } from '../states/IdleState';
import { CompactState } from '../states/CompactState';
import { ModuleDashboard } from '../modules/ModuleDashboard';
import { SplitState } from '../states/SplitState';

import './Island.css';

const INSTANT_TRANSITION = {
  duration: 0,
} as const;

export function Island() {
  recordReactRender();
  const islandRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return startPerfDiagnostics();
  }, []);

  useEffect(() => {
    void synchronizeIslandWindow(true);
    return useIslandStore.subscribe((current, previous) => {
      if (current.visible !== previous.visible || current.isEvasionActive !== previous.isEvasionActive) {
        void synchronizeIslandWindow();
      }
    });
  }, []);

  useEvasion();
  useFeatureSources();
  useFeatureCoordinator();
  useSettingsSource();
  useWeatherSource();
  useWidgetLayoutSync();

  const {
    state,
    visible,
    isEvasionActive,
    menuOpen,
  } = useIslandStore();

  const preferences = useDesktopPreferences();
  const appearance = useSettingsStore((store) => store.settings.appearance);
  const theme = appearance.theme;
  const pinExpanded = useSettingsStore((store) => store.settings.behavior.pinExpanded);
  const animationsEnabled =
    useSettingsStore(
      (settingsState) =>
        settingsState.settings.appearance
          .animations,
    ) && !preferences.reducedMotion;

  const widgetOrchestration =
    useWidgetOrchestrator();

  const {
    transitionTo,
    handleMouseEnter,
    handleMouseLeave,
    handleClick,
    handleCollapse,
  } = useIslandState();

  const openQuickSettings = () => {
    cancelCollapse();
    useIslandStore.getState().setMenuOpen(true);
    void transitionTo('expanded');
  };
  const closeQuickSettings = () => {
    useIslandStore.getState().setMenuOpen(false);
    queueMicrotask(() => islandRef.current?.focus());
  };

  useEffect(() => {
    if (pinExpanded) void transitionTo('expanded');
  }, [pinExpanded, transitionTo]);

  useEffect(() => useSettingsStore.subscribe((current, previous) => {
    if (current.settings.appearance.scale !== previous.settings.appearance.scale) void synchronizeIslandWindow(true);
  }), []);

  useEffect(() => { if (isEvasionActive) useIslandStore.getState().setMenuOpen(false); }, [isEvasionActive]);

  const shouldShowIsland =
    isIslandVisible(
      visible,
      isEvasionActive,
    );

  const dims =
    ISLAND_DIMENSIONS[state];

  const islandTransition =
    animationsEnabled
      ? SPRING_CONFIG
      : INSTANT_TRANSITION;

  const contentTransition =
    animationsEnabled
      ? {
          duration: 0.12,
          ease: 'easeOut' as const,
        }
      : INSTANT_TRANSITION;

  return (
    <div className="island-wrapper">
      <motion.div
        ref={islandRef}
        className={`island island--${state}`}
        data-shape={appearance.shape}
        onContextMenu={(event) => { event.preventDefault(); openQuickSettings(); }}
        role={state === 'expanded' ? 'region' : 'button'}
        aria-label={state === 'expanded' ? 'PILL dashboard' : 'Open PILL'}
        aria-expanded={state === 'expanded'}
        inert={!shouldShowIsland}
        tabIndex={shouldShowIsland ? 0 : -1}
        data-theme={theme === 'system' ? (preferences.light ? 'light' : 'dark') : theme}
        layout={animationsEnabled}
        data-widget-layout={
          widgetOrchestration.layout
        }
        data-widget-primary={
          widgetOrchestration.primary ??
          undefined
        }
        data-widget-secondary={
          widgetOrchestration.secondary ??
          undefined
        }
        animate={{
          width: dims.width,
          height: dims.height,
          opacity: shouldShowIsland ? 1 : 0,
        }}
        transition={islandTransition}
        style={{
          zoom: appearance.scale,
          pointerEvents: shouldShowIsland
            ? 'auto'
            : 'none',
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => { if (!menuOpen) handleMouseLeave(); }}
        onFocusCapture={cancelCollapse}
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) handleMouseLeave();
        }}
        onKeyDown={(event) => {
          if (event.key === 'ContextMenu' || (event.shiftKey && event.key === 'F10')) {
            event.preventDefault(); openQuickSettings();
          } else if (event.key === 'Escape') {
            event.stopPropagation();
            if (menuOpen) closeQuickSettings(); else handleCollapse();
          } else if (state !== 'expanded' && event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) {
            event.preventDefault();
            void transitionTo('expanded');
          }
        }}
        onClick={
          state !== 'expanded'
            ? handleClick
            : undefined
        }
      >
        <div className="island__glass" style={{ opacity: appearance.opacity }} />

        <div className="island__content">
          {menuOpen ? <QuickSettings onClose={closeQuickSettings} /> : <AnimatePresence mode="wait">
            {state === 'idle' && (
              <motion.div
                key="idle"
                initial={
                  animationsEnabled
                    ? {
                        opacity: 0,
                      }
                    : false
                }
                animate={{
                  opacity: 1,
                }}
                exit={{
                  opacity: 0,
                }}
                transition={contentTransition}
              >
                <IdleState />
              </motion.div>
            )}

            {state === 'compact' && (
              <motion.div
                key="compact"
                initial={
                  animationsEnabled
                    ? {
                        opacity: 0,
                      }
                    : false
                }
                animate={{
                  opacity: 1,
                }}
                exit={{
                  opacity: 0,
                }}
                transition={contentTransition}
              >
                <CompactState
                  widgetOrchestration={
                    widgetOrchestration
                  }
                />
              </motion.div>
            )}

            {state === 'expanded' && (
              <motion.div
                key="expanded"
                initial={
                  animationsEnabled
                    ? {
                        opacity: 0,
                      }
                    : false
                }
                animate={{
                  opacity: 1,
                }}
                exit={{
                  opacity: 0,
                }}
                transition={contentTransition}
              >
                <ModuleDashboard
                  onCollapse={handleCollapse}
                  widgetOrchestration={
                    widgetOrchestration
                  }
                />
              </motion.div>
            )}

            {state === 'split' && (
              <motion.div
                key="split"
                initial={
                  animationsEnabled
                    ? {
                        opacity: 0,
                      }
                    : false
                }
                animate={{
                  opacity: 1,
                }}
                exit={{
                  opacity: 0,
                }}
                transition={contentTransition}
              >
                <SplitState
                  widgetOrchestration={
                    widgetOrchestration
                  }
                />
              </motion.div>
            )}
          </AnimatePresence>}
        </div>
      </motion.div>
    </div>
  );
}
