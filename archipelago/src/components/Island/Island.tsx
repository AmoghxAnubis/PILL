import { motion, AnimatePresence } from 'framer-motion';
import { useIslandState } from '../../hooks/useIslandState';
import { ISLAND_DIMENSIONS, SPRING_CONFIG } from '../../store/islandStore';
import { IdleState } from '../states/IdleState';
import { CompactState } from '../states/CompactState';
import { ExpandedState } from '../states/ExpandedState';
import './Island.css';

/**
 * Main Island container component.
 * Manages the morphing pill shape with spring-physics animations
 * and renders the appropriate state content.
 */
export function Island() {
  const {
    state,
    handleMouseEnter,
    handleMouseLeave,
    handleClick,
    handleCollapse,
  } = useIslandState();

  const dims = ISLAND_DIMENSIONS[state];

  return (
    <div className="island-wrapper">
      <motion.div
        className={`island island--${state}`}
        layout
        animate={{
          width: dims.width,
          height: dims.height,
        }}
        transition={SPRING_CONFIG}
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
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <ExpandedState onCollapse={handleCollapse} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
