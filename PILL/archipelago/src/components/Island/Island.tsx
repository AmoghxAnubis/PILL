import { AnimatePresence, motion } from 'framer-motion';

import { useEvasion } from '../../hooks/useEvasion';
import { useIslandState } from '../../hooks/useIslandState';
import {
  ISLAND_DIMENSIONS,
  SPRING_CONFIG,
  useIslandStore,
} from '../../store/islandStore';

import { IdleState } from '../states/IdleState';
import { CompactState } from '../states/CompactState';
import { ExpandedState } from '../states/ExpandedState';
import { SplitState } from '../states/SplitState';

import './Island.css';

/**
 * Main Island container component.
 *
 * Manages:
 * - Island state transitions
 * - Spring-based size animations
 * - Fullscreen/evasion visibility
 * - Rendering of the appropriate state content
 */
export function Island() {
  // Subscribe to fullscreen/evasion events.
  useEvasion();

  const {
    state,
    handleMouseEnter,
    handleMouseLeave,
    handleClick,
    handleCollapse,
  } = useIslandState();

  const isEvasionActive = useIslandStore(
    (store) => store.isEvasionActive,
  );

  const dims = ISLAND_DIMENSIONS[state];

  return (
    <div className="island-wrapper">
      <motion.div
        className={`island island--${state}`}
        layout
        animate={{
          width: dims.width,
          height: dims.height,
          opacity: isEvasionActive ? 0 : 1,
        }}
        transition={SPRING_CONFIG}
        style={{
          pointerEvents: isEvasionActive ? 'none' : 'auto',
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={state === 'compact' ? handleClick : undefined}
      >
        {/* Glassmorphism background layer */}
        <div className="island__glass" />

        {/* Content layer */}
        <div className="island__content">
          <AnimatePresence mode="wait">
            {state === 'idle' && (
              <motion.div
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <IdleState />
              </motion.div>
            )}

            {state === 'compact' && (
              <motion.div
                key="compact"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <CompactState />
              </motion.div>
            )}

            {state === 'expanded' && (
              <motion.div
                key="expanded"
                initial={{
                  opacity: 0,
                  scale: 0.95,
                }}
                animate={{
                  opacity: 1,
                  scale: 1,
                }}
                exit={{
                  opacity: 0,
                  scale: 0.95,
                }}
                transition={{ duration: 0.2 }}
              >
                <ExpandedState
                  onCollapse={handleCollapse}
                />
              </motion.div>
            )}

            {state === 'split' && (
              <motion.div
                key="split"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <SplitState />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}