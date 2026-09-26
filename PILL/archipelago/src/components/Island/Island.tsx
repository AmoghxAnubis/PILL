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
import { ExpandedState } from '../states/ExpandedState';
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

  const animationsEnabled =
    useSettingsStore(
      (settingsState) =>
        settingsState.settings.appearance
          .animations,
    );

  const widgetOrchestration =
    useWidgetOrchestrator();

  const {
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
        onClick={
          state === 'compact'
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
                <ExpandedState
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