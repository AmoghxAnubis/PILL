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
import { useWidgetLayoutSync } from '../../hooks/useWidgetLayoutSync';
import { useWidgetOrchestrator } from '../../hooks/useWidgetOrchestrator';

import {
  ISLAND_DIMENSIONS,
  isIslandVisible,
  SPRING_CONFIG,
  useIslandStore,
} from '../../store/islandStore';

import { IdleState } from '../states/IdleState';
import { CompactState } from '../states/CompactState';
import { ExpandedState } from '../states/ExpandedState';
import { SplitState } from '../states/SplitState';

import './Island.css';

export function Island() {
  recordReactRender();

  useEffect(() => {
    return startPerfDiagnostics();
  }, []);

  useEvasion();
  useFeatureSources();
  useFeatureCoordinator();
  useWidgetLayoutSync();

  const {
    state,
    visible,
    isEvasionActive,
  } = useIslandStore();

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

  return (
    <div className="island-wrapper">
      <motion.div
        className={`island island--${state}`}
        layout
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
        transition={SPRING_CONFIG}
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
                initial={{
                  opacity: 0,
                }}
                animate={{
                  opacity: 1,
                }}
                exit={{
                  opacity: 0,
                }}
                transition={{
                  duration: 0.12,
                  ease: 'easeOut',
                }}
              >
                <IdleState />
              </motion.div>
            )}

            {state === 'compact' && (
              <motion.div
                key="compact"
                initial={{
                  opacity: 0,
                }}
                animate={{
                  opacity: 1,
                }}
                exit={{
                  opacity: 0,
                }}
                transition={{
                  duration: 0.12,
                  ease: 'easeOut',
                }}
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
                initial={{
                  opacity: 0,
                  scale: 0.96,
                  y: 4,
                }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  y: 0,
                }}
                exit={{
                  opacity: 0,
                  scale: 0.97,
                  y: 4,
                }}
                transition={{
                  duration: 0.2,
                  ease: 'easeOut',
                }}
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
                initial={{
                  opacity: 0,
                }}
                animate={{
                  opacity: 1,
                }}
                exit={{
                  opacity: 0,
                }}
                transition={{
                  duration: 0.12,
                  ease: 'easeOut',
                }}
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