use crate::events::TIMER_TICK;
use serde::{Deserialize, Serialize};
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};
use tauri::{AppHandle, Emitter};

pub const DEFAULT_FOCUS_DURATION_SECS: u64 = 25 * 60;
pub const TIMER_POLL_INTERVAL: Duration = Duration::from_millis(100);

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub struct TimerSnapshot {
    pub seconds_remaining: u64,
    pub is_running: bool,
}

#[derive(Debug)]
struct FocusTimerState {
    duration_secs: u64,
    remaining_secs: u64,
    is_running: bool,
    deadline: Option<Instant>,
}

impl Default for FocusTimerState {
    fn default() -> Self {
        Self {
            duration_secs: DEFAULT_FOCUS_DURATION_SECS,
            remaining_secs: DEFAULT_FOCUS_DURATION_SECS,
            is_running: false,
            deadline: None,
        }
    }
}

#[derive(Debug, Clone)]
pub struct FocusTimer {
    state: Arc<Mutex<FocusTimerState>>,
}

impl FocusTimer {
    pub fn new() -> Self {
        Self {
            state: Arc::new(Mutex::new(FocusTimerState::default())),
        }
    }

    pub fn snapshot(&self) -> TimerSnapshot {
        let mut state = self.lock_state();

        Self::refresh_state(&mut state, Instant::now());

        TimerSnapshot {
            seconds_remaining: state.remaining_secs,
            is_running: state.is_running,
        }
    }

    pub fn start(&self) -> TimerSnapshot {
        let mut state = self.lock_state();

        Self::start_at(&mut state, Instant::now())
    }

    pub fn pause(&self) -> TimerSnapshot {
        let mut state = self.lock_state();

        Self::pause_at(&mut state, Instant::now())
    }

    pub fn reset(&self) -> TimerSnapshot {
        let mut state = self.lock_state();

        state.remaining_secs = state.duration_secs;
        state.is_running = false;
        state.deadline = None;

        TimerSnapshot {
            seconds_remaining: state.remaining_secs,
            is_running: false,
        }
    }

    fn tick(&self) -> Option<TimerSnapshot> {
        let mut state = self.lock_state();

        let previous = TimerSnapshot {
            seconds_remaining: state.remaining_secs,
            is_running: state.is_running,
        };

        Self::refresh_state(&mut state, Instant::now());

        let current = TimerSnapshot {
            seconds_remaining: state.remaining_secs,
            is_running: state.is_running,
        };

        if current != previous {
            Some(current)
        } else {
            None
        }
    }

    fn start_at(
        state: &mut FocusTimerState,
        now: Instant,
    ) -> TimerSnapshot {
        if state.remaining_secs == 0 {
            state.remaining_secs = state.duration_secs;
        }

        state.is_running = true;
        state.deadline = Some(
            now + Duration::from_secs(state.remaining_secs),
        );

        TimerSnapshot {
            seconds_remaining: state.remaining_secs,
            is_running: true,
        }
    }

    fn pause_at(
        state: &mut FocusTimerState,
        now: Instant,
    ) -> TimerSnapshot {
        Self::refresh_state(state, now);

        if state.is_running {
            let deadline = state
                .deadline
                .expect("running focus timer must have a deadline");

            state.remaining_secs =
                remaining_seconds(deadline.saturating_duration_since(now));
        }

        state.is_running = false;
        state.deadline = None;

        TimerSnapshot {
            seconds_remaining: state.remaining_secs,
            is_running: false,
        }
    }

    fn refresh_state(
        state: &mut FocusTimerState,
        now: Instant,
    ) {
        if !state.is_running {
            return;
        }

        let deadline = match state.deadline {
            Some(deadline) => deadline,
            None => {
                state.is_running = false;
                return;
            }
        };

        let remaining = deadline.saturating_duration_since(now);

        if remaining.is_zero() {
            state.remaining_secs = 0;
            state.is_running = false;
            state.deadline = None;
        } else {
            state.remaining_secs = remaining_seconds(remaining);
        }
    }

    fn lock_state(
        &self,
    ) -> std::sync::MutexGuard<'_, FocusTimerState> {
        self.state
            .lock()
            .expect("focus timer state mutex was poisoned")
    }
}

impl Default for FocusTimer {
    fn default() -> Self {
        Self::new()
    }
}

fn remaining_seconds(duration: Duration) -> u64 {
    let seconds = duration.as_secs();

    if duration.subsec_nanos() > 0 {
        seconds.saturating_add(1)
    } else {
        seconds
    }
}

fn emit_snapshot(
    app: &AppHandle,
    snapshot: TimerSnapshot,
) {
    if let Err(error) = app.emit(TIMER_TICK, snapshot) {
        eprintln!(
            "[Archipelago][Timer] Failed to emit timer update: {}",
            error
        );
    }
}

pub fn spawn_focus_timer_monitor(
    app: AppHandle,
    timer: FocusTimer,
) {
    tauri::async_runtime::spawn(async move {
        println!(
            "[Archipelago][Timer] Focus timer monitor started"
        );

        let mut interval =
            tokio::time::interval(TIMER_POLL_INTERVAL);

        loop {
            interval.tick().await;

            if let Some(snapshot) = timer.tick() {
                emit_snapshot(&app, snapshot);

                if !snapshot.is_running
                    && snapshot.seconds_remaining == 0
                {
                    println!(
                        "[Archipelago][Timer] Focus session completed"
                    );
                }
            }
        }
    });
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn default_timer_is_25_minutes_and_stopped() {
        let timer = FocusTimer::new();
        let snapshot = timer.snapshot();

        assert_eq!(
            snapshot,
            TimerSnapshot {
                seconds_remaining: DEFAULT_FOCUS_DURATION_SECS,
                is_running: false,
            }
        );
    }

    #[test]
    fn starting_timer_sets_running_state() {
        let mut state = FocusTimerState::default();
        let now = Instant::now();

        let snapshot = FocusTimer::start_at(
            &mut state,
            now,
        );

        assert_eq!(
            snapshot.seconds_remaining,
            DEFAULT_FOCUS_DURATION_SECS
        );
        assert!(snapshot.is_running);
        assert!(state.deadline.is_some());
    }

    #[test]
    fn timer_counts_down_by_elapsed_seconds() {
        let mut state = FocusTimerState::default();
        let now = Instant::now();

        FocusTimer::start_at(
            &mut state,
            now,
        );

        FocusTimer::refresh_state(
            &mut state,
            now + Duration::from_secs(1),
        );

        assert_eq!(
            state.remaining_secs,
            DEFAULT_FOCUS_DURATION_SECS - 1
        );
        assert!(state.is_running);
    }

    #[test]
    fn pause_freezes_remaining_time() {
        let mut state = FocusTimerState::default();
        let now = Instant::now();

        FocusTimer::start_at(
            &mut state,
            now,
        );

        let snapshot = FocusTimer::pause_at(
            &mut state,
            now + Duration::from_secs(10),
        );

        assert_eq!(
            snapshot.seconds_remaining,
            DEFAULT_FOCUS_DURATION_SECS - 10
        );
        assert!(!snapshot.is_running);
        assert!(state.deadline.is_none());
    }

    #[test]
    fn reset_restores_default_duration() {
        let timer = FocusTimer::new();

        timer.start();

        let snapshot = timer.reset();

        assert_eq!(
            snapshot,
            TimerSnapshot {
                seconds_remaining: DEFAULT_FOCUS_DURATION_SECS,
                is_running: false,
            }
        );
    }

    #[test]
    fn timer_completes_at_zero() {
        let mut state = FocusTimerState {
            duration_secs: 5,
            remaining_secs: 5,
            is_running: false,
            deadline: None,
        };

        let now = Instant::now();

        FocusTimer::start_at(
            &mut state,
            now,
        );

        FocusTimer::refresh_state(
            &mut state,
            now + Duration::from_secs(5),
        );

        assert_eq!(state.remaining_secs, 0);
        assert!(!state.is_running);
        assert!(state.deadline.is_none());
    }

    #[test]
    fn starting_completed_timer_starts_a_fresh_session() {
        let mut state = FocusTimerState {
            duration_secs: 5,
            remaining_secs: 0,
            is_running: false,
            deadline: None,
        };

        let snapshot = FocusTimer::start_at(
            &mut state,
            Instant::now(),
        );

        assert_eq!(snapshot.seconds_remaining, 5);
        assert!(snapshot.is_running);
    }
}