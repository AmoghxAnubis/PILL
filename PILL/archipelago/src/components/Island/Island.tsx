import {
  useEffect,
} from 'react';

import {
  AnimatePresence,
  motion,
} from 'framer-motion';

import {
  recordReactRender,
  startPerfDiagnostics,
} from '../../lib/perfDiagnostics';

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
  useWidgetLayoutSync();

  const {
    state,
    visible,
    isEvasionActive,
  } = useIslandStore();

  const preferences = useDesktopPreferences();
  const theme = useSettingsStore((store) => store.settings.appearance.theme);
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
        className={`island island--${state}`}
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
          pointerEvents: shouldShowIsland
            ? 'auto'
            : 'none',
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocusCapture={cancelCollapse}
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) handleMouseLeave();
        }}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.stopPropagation();
            handleCollapse();
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
        <div className="island__glass" />

        <div className="island__content">
          <AnimatePresence mode="wait">
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
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
