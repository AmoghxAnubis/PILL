# PILL next version: local desktop assistant

## Product direction

Evolve PILL 0.1 from a passive Windows island into an opt-in, local-first desktop assistant. Keep media, telemetry and focus useful without the assistant. The first release should understand a small set of typed and spoken requests, show what it understood, and perform bounded Windows actions with visible feedback.

### Reference and limits

The 18-second reference shows a small dark island at the top of a Windows desktop, two glowing marks, expansion into a narrow status/transcript panel, a YouTube search results page, and a video opening. The overlay text calls it a fully offline assistant. These observations come from sampled video frames; audio, exact commands, activation method, timing, implementation, and actual offline operation were not verified. YouTube search and playback require network access even if speech and command processing run locally.

## Experience design

- **Idle:** small, quiet island with a recognizable two-dot identity; existing widgets continue to surface useful activity.
- **Invoke:** configurable global shortcut or click opens text input; push-to-talk is optional and explicitly enabled. Always-listening wake words are deferred.
- **Listen:** clearly show microphone status, live or final transcript, cancel and a keyboard alternative. Never imply the microphone is active when it is not.
- **Understand:** show the interpreted request and target; ask a concise clarification for ambiguity. A user can correct a transcript before execution.
- **Act:** show a short progress label and cancellation where feasible. Result or error remains readable long enough to act on it; collapse afterward according to settings.
- **Return:** restore the prior widget state, including a running focus timer. Assistant interaction temporarily takes precedence over automatic split/collapse and fullscreen evasion follows an explicit user preference.

Initial supported requests: open a user-selected application, start/pause/reset a focus timer, control the active media session, and open a web search in the default browser. A YouTube search can open a search URL after the user requests it; automatic selection and playback of a search result is a later, separately validated feature. Text works without audio models. Local timer and media actions work offline; web searches are explicitly online.

## Design specification

Use the current top-centered, transparent, always-on-top Tauri window. Retain a dark rounded surface with restrained glow and high-contrast text; use motion to communicate state rather than decorate. Proposed states are idle, input/listening, processing, confirmation, success and error. Keep controls and transcript readable at common Windows scaling factors; support keyboard focus, Escape to cancel, visible focus, screen-reader labels and reduced motion. Provide a text-only fallback and never rely on color alone for status. Size the native window to the visible content, test hit areas, and avoid clipping or covering critical controls on small displays.

PILL Control gets an Assistant section: enable/disable, shortcut, microphone and push-to-talk controls, selected input device, model installation/status, data retention, and per-action permissions. Show whether each capability is local or uses the network, plus model size and hardware requirements before download.

## Architecture and repository changes

1. **UI and coordination:** extend `PILL/archipelago/src/components/Island` and add assistant components and a dedicated store. Define a single transition arbiter so `useWidgetLayoutSync`, hover/collapse, fullscreen evasion and assistant sessions cannot overwrite each other. Restore prior widget layout after each session. Update both frontend dimensions and the Rust state parser/window resizing together; current idle sizes differ between frontend (44×14) and startup configuration (110×32), so establish one authoritative sizing contract.
2. **Command pipeline:** typed or transcribed input → deterministic intent parser → typed action proposal → policy/confirmation → Rust executor → structured result. Use request IDs, cancellation, timeouts and explicit error states. Model output is untrusted data: validate against a fixed action schema; never execute generated shell commands. Start with rules for the narrow command set and evaluate a local language model only if measurements justify it.
3. **Native adapters:** reuse existing media and focus timer commands. Add a controlled application launcher backed by user-selected installed applications, and construct encoded search URLs opened through the default browser. Treat browser search as network activity and do not claim that results or playback are offline. Avoid screen-coordinate clicking; playback automation needs a separate feasibility prototype and explicit browser integration.
4. **Voice:** isolate capture, voice activity detection and local speech recognition behind interfaces. Evaluate Windows-compatible offline engines and model licenses, hardware, quality, latency and package size on target machines before selecting one. Run inference off the UI thread, support cancellation and missing devices, and stop capture on completion or disable. Voice output is optional and deferred until the core interaction is reliable.
5. **Settings:** extend `PILL/shared/settings/PillSettings.ts` and both Rust settings implementations with a versioned migration. Default assistant and microphone off. Validate settings, preserve version 1 choices, handle malformed files and coordinate writes between the two apps. Add controls in `PILL/pill-control`.
6. **Privacy and permissions:** no raw audio or transcripts retained by default; disclose and control any diagnostics or history. Separate microphone consent from action permissions. Confirm ambiguous targets and higher-impact actions; exclude deletion, purchases, arbitrary shell execution and unrestricted automation from the first release. Provide an emergency stop and clear errors. Downloaded models are an explicit network operation; local processing must remain usable with networking disabled after setup.

## Delivery phases and gates

1. **Baseline and design (1 week):** record existing Windows behavior, performance, settings and window-size issues; create state and interaction specification. Gate: agree supported commands and acceptance scenarios.
2. **Typed assistant vertical slice (1–2 weeks):** shortcut/input, state arbitration, typed intent schema, focus/media adapters and result feedback. Gate: commands work end-to-end without a model and existing widgets do not regress.
3. **Safe desktop actions (1–2 weeks):** allowlisted app launcher and explicit browser search, permission prompts and failure handling. Gate: unknown/ambiguous commands cannot execute; offline actions pass with networking disabled.
4. **Local voice prototype and integration (2–4 weeks):** benchmark candidate engines on representative machines, select and package/download a model, add push-to-talk and device management. Gate: acceptable accuracy, responsiveness, resource usage and license review; otherwise ship typed assistant first.
5. **Polish and release (1–2 weeks):** accessibility, multi-monitor/DPI/fullscreen, settings migration, installer/model setup, documentation and Windows validation. Gate: release criteria below. Estimates are rough, depend on team capacity and voice-engine feasibility, and exclude unplanned browser automation.

## Verification and release criteria

- Run existing frontend tests/build, Rust tests, and Control lint/build; add meaningful tests for intent validation, action policy, cancellation, state arbitration and settings migration.
- On Windows, test shortcut and keyboard-only flow, denied or disconnected microphones, noisy speech, no model, no internet, failed app launch, cancelled request, mixed-DPI and multiple monitors, fullscreen apps, sleep/resume and running widgets. Test a clean install and an upgrade preserving version 1 settings.
- Benchmark on at least a low-end and a typical target PC. Record idle memory/CPU, model storage and cold/warm request latency; set release thresholds after baseline measurements. Test speech recognition with a documented set of commands and accents/noise conditions; publish measured success rates rather than promise universal accuracy.
- Release when local actions work offline after setup, online actions are labelled, microphone state is accurate, prohibited or malformed actions cannot execute, cancellation and failure are understandable, and baseline overlay features remain usable.

## Later opportunities

Wake word, spoken responses, optional local conversational model, richer context and browser result selection can follow measured demand and separate feasibility/privacy reviews. A screen-reading or arbitrary desktop automation system is outside the initial scope.
