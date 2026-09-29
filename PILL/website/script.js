const demoStates = [
  {
    state: "IDLE",
    label: "PILL",
    value: "Ready",
  },
  {
    state: "MEDIA",
    label: "NOW PLAYING",
    value: "Midnight City",
  },
  {
    state: "TELEMETRY",
    label: "SYSTEM",
    value: "42% CPU",
  },
  {
    state: "FOCUS",
    label: "FOCUS",
    value: "24:58",
  },
  {
    state: "EXPANDED",
    label: "PILL",
    value: "Everything at a glance",
  },
];

const pillDemo = document.getElementById("pillDemo");
const pillLabel = document.getElementById("pillLabel");
const pillValue = document.getElementById("pillValue");
const pillTime = document.getElementById("pillTime");
const visualState = document.getElementById("visualState");
const siteHeader = document.querySelector(".site-header");

let stateIndex = 0;
let demoTimer = null;
let demoPaused = false;
let swapTimer = null;

/* ----------------------------------------------------------
   HERO PILL DEMO
---------------------------------------------------------- */

function applyDemoState(nextState) {
  const current = demoStates[nextState];

  if (
    !pillDemo ||
    !pillLabel ||
    !pillValue ||
    !pillTime ||
    !visualState
  ) {
    return;
  }

  pillDemo.classList.add("is-swapping");

  clearTimeout(swapTimer);

  swapTimer = setTimeout(() => {
    visualState.textContent = current.state;
    pillLabel.textContent = current.label;
    pillValue.textContent = current.value;

    pillDemo.dataset.state = current.state;

    if (current.state === "EXPANDED") {
      pillDemo.style.minWidth = "290px";
      pillDemo.style.borderRadius = "22px";
    } else if (current.state === "MEDIA") {
      pillDemo.style.minWidth = "230px";
      pillDemo.style.borderRadius = "999px";
    } else {
      pillDemo.style.minWidth = "172px";
      pillDemo.style.borderRadius = "999px";
    }

    pillTime.textContent =
      current.state === "FOCUS"
        ? "24:58"
        : "09:41";

    pillDemo.classList.remove("is-swapping");
  }, 90);
}

function updateDemo(nextIndex = stateIndex) {
  stateIndex =
    (nextIndex + demoStates.length) %
    demoStates.length;

  applyDemoState(stateIndex);
}

function advanceDemo() {
  updateDemo(stateIndex + 1);
}

function startDemoTimer() {
  if (demoTimer || demoPaused) {
    return;
  }

  demoTimer = window.setInterval(() => {
    advanceDemo();
  }, 2600);
}

function stopDemoTimer() {
  if (!demoTimer) {
    return;
  }

  window.clearInterval(demoTimer);
  demoTimer = null;
}

if (pillDemo) {
  pillDemo.setAttribute("role", "button");
  pillDemo.setAttribute("tabindex", "0");
  pillDemo.setAttribute(
    "aria-label",
    "Interact with the PILL product preview"
  );

  pillDemo.addEventListener("mouseenter", () => {
    demoPaused = true;
    stopDemoTimer();
  });

  pillDemo.addEventListener("mouseleave", () => {
    demoPaused = false;
    startDemoTimer();
  });

  pillDemo.addEventListener("focusin", () => {
    demoPaused = true;
    stopDemoTimer();
  });

  pillDemo.addEventListener("focusout", () => {
    demoPaused = false;
    startDemoTimer();
  });

  pillDemo.addEventListener("click", () => {
    advanceDemo();
  });

  pillDemo.addEventListener("keydown", (event) => {
    if (
      event.key === "Enter" ||
      event.key === " "
    ) {
      event.preventDefault();
      advanceDemo();
    }
  });
}

updateDemo(0);
startDemoTimer();

/* ----------------------------------------------------------
   SCROLL PROGRESS
---------------------------------------------------------- */

const progressBar = document.createElement("div");
const progressFill = document.createElement("span");

progressBar.className = "scroll-progress";
progressBar.setAttribute("aria-hidden", "true");
progressBar.appendChild(progressFill);

document.body.appendChild(progressBar);

function updateScrollUI() {
  const scrollTop = window.scrollY;

  if (siteHeader) {
    siteHeader.classList.toggle(
      "is-scrolled",
      scrollTop > 16
    );
  }

  const scrollableHeight =
    document.documentElement.scrollHeight -
    window.innerHeight;

  const progress =
    scrollableHeight > 0
      ? (scrollTop / scrollableHeight) * 100
      : 0;

  progressFill.style.width =
    `${Math.min(progress, 100)}%`;
}

window.addEventListener(
  "scroll",
  updateScrollUI,
  { passive: true }
);

window.addEventListener(
  "resize",
  updateScrollUI
);

updateScrollUI();

/* ----------------------------------------------------------
   SCROLL REVEALS
---------------------------------------------------------- */

const revealTargets = [
  ".hero-copy",
  ".hero-visual",
  ".intro > div:last-child",
  ".section-heading",
  ".feature-card",
  ".control-copy",
  ".control-visual",
  ".install-card",
  ".faq-content",
  ".final-cta",
];

const revealElements = document.querySelectorAll(
  revealTargets.join(",")
);

revealElements.forEach((element, index) => {
  element.classList.add("reveal");

  const delay =
    Math.min(index % 5, 4) * 70;

  element.style.setProperty(
    "--reveal-delay",
    `${delay}ms`
  );
});

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries, currentObserver) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        entry.target.classList.add("is-visible");

        currentObserver.unobserve(
          entry.target
        );
      });
    },
    {
      threshold: 0.14,
      rootMargin: "0px 0px -50px 0px",
    }
  );

  revealElements.forEach((element) => {
    observer.observe(element);
  });
} else {
  revealElements.forEach((element) => {
    element.classList.add("is-visible");
  });
}

/* ----------------------------------------------------------
   FEATURE CARD INTERACTIONS
---------------------------------------------------------- */

const featureCards =
  document.querySelectorAll(".feature-card");

const finePointer =
  window.matchMedia("(pointer: fine)").matches;

const prefersReducedMotion =
  window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  );

function setupFeatureCard(card) {
  const visual =
    card.querySelector(".feature-visual");

  if (!visual) {
    return;
  }

  const glow =
    document.createElement("div");

  glow.className = "feature-glow";

  Object.assign(glow.style, {
    position: "absolute",
    inset: "0",
    zIndex: "0",
    pointerEvents: "none",
    borderRadius: "inherit",
    opacity: "0",
    transition:
      "opacity 220ms ease",
    background:
      "radial-gradient(circle 220px at 50% 50%, rgba(255,255,255,0.075), transparent 72%)",
  });

  card.insertBefore(
    glow,
    card.firstChild
  );

  [
    ...card.children,
  ].forEach((child) => {
    if (child === glow) {
      return;
    }

    child.style.position =
      child.style.position || "relative";

    child.style.zIndex = "1";
  });

  visual.style.transition =
    "transform 260ms cubic-bezier(0.22, 1, 0.36, 1)";

  if (!finePointer) {
    return;
  }

  card.addEventListener(
    "pointermove",
    (event) => {
      if (prefersReducedMotion.matches) {
        return;
      }

      const rect =
        card.getBoundingClientRect();

      const x =
        event.clientX - rect.left;

      const y =
        event.clientY - rect.top;

      const percentX =
        (x / rect.width) * 100;

      const percentY =
        (y / rect.height) * 100;

      glow.style.background =
        `radial-gradient(circle 230px at ${percentX}% ${percentY}%, rgba(255,255,255,0.075), transparent 72%)`;

      glow.style.opacity = "1";

      const normalizedX =
        (x / rect.width - 0.5) * 2;

      const normalizedY =
        (y / rect.height - 0.5) * 2;

      const moveX =
        normalizedX * 5;

      const moveY =
        normalizedY * 5;

      visual.style.transform =
        `translate3d(${moveX}px, ${moveY}px, 0)`;
    }
  );

  card.addEventListener(
    "pointerenter",
    () => {
      if (prefersReducedMotion.matches) {
        return;
      }

      glow.style.opacity = "1";
    }
  );

  card.addEventListener(
    "pointerleave",
    () => {
      glow.style.opacity = "0";

      visual.style.transform =
        "translate3d(0, 0, 0)";
    }
  );
}

featureCards.forEach(setupFeatureCard);

/* ----------------------------------------------------------
   PILL CONTROL DEMO
---------------------------------------------------------- */

const controlWindow =
  document.querySelector(".control-window");

const controlSidebar =
  document.querySelector(".control-sidebar");

const controlMain =
  document.querySelector(".control-main");

const controlHeading =
  document.querySelector(
    ".control-main-heading"
  );

const controlPanels =
  document.querySelector(".control-panels");

const controlNavigation =
  document.querySelectorAll(
    ".control-nav"
  );

const controlSections = {
  Overview: {
    kicker: "OVERVIEW",
    title: "Everything in one place.",
    panels: [
      {
        label: "ACTIVE WIDGETS",
        value: "03",
      },
      {
        label: "ANIMATIONS",
        value: "ON",
      },
      {
        label: "FULLSCREEN EVASION",
        toggle: true,
        active: true,
      },
    ],
  },

  Widgets: {
    kicker: "WIDGETS",
    title: "Choose what PILL can surface.",
    panels: [
      {
        label: "ACTIVE WIDGETS",
        value: "03",
      },
      {
        label: "MEDIA",
        toggle: true,
        active: true,
      },
      {
        label: "TELEMETRY + FOCUS",
        toggle: true,
        active: true,
      },
    ],
  },

  Behavior: {
    kicker: "BEHAVIOR",
    title: "Make PILL behave your way.",
    panels: [
      {
        label: "HOVER TO EXPAND",
        toggle: true,
        active: true,
      },
      {
        label: "CLICK TO EXPAND",
        toggle: true,
        active: true,
      },
      {
        label: "AUTO-COLLAPSE",
        toggle: true,
        active: true,
      },
    ],
  },

  Appearance: {
    kicker: "APPEARANCE",
    title: "Tune the way PILL feels.",
    panels: [
      {
        label: "THEME",
        value: "DARK",
      },
      {
        label: "ANIMATIONS",
        toggle: true,
        active: true,
      },
      {
        label: "LIVE EFFECTS",
        toggle: true,
        active: true,
      },
    ],
  },

  System: {
    kicker: "SYSTEM",
    title: "Keep PILL ready in the background.",
    panels: [
      {
        label: "STARTUP",
        toggle: true,
        active: false,
      },
      {
        label: "MINIMIZE TO TRAY",
        toggle: true,
        active: true,
      },
      {
        label: "WINDOWS INTEGRATION",
        value: "READY",
      },
    ],
  },
};

function setControlButtonState(
  navigation,
  selected
) {
  navigation.forEach((item) => {
    const label =
      item.textContent.trim();

    const active =
      label === selected;

    item.classList.toggle(
      "active",
      active
    );

    item.setAttribute(
      "role",
      "button"
    );

    item.setAttribute(
      "tabindex",
      "0"
    );

    item.setAttribute(
      "aria-current",
      active
        ? "page"
        : "false"
    );
  });
}

function createControlPanel(panel) {
  const element =
    document.createElement("div");

  element.className =
    "control-panel";

  const label =
    document.createElement("span");

  label.textContent =
    panel.label;

  element.appendChild(label);

  if (panel.toggle) {
    const toggle =
      document.createElement("div");

    toggle.className =
      "fake-toggle";

    toggle.setAttribute(
      "role",
      "button"
    );

    toggle.setAttribute(
      "tabindex",
      "0"
    );

    toggle.setAttribute(
      "aria-label",
      `${panel.label} toggle`
    );

    toggle.dataset.active =
      panel.active ? "true" : "false";

    if (panel.active) {
      toggle.classList.add(
        "active"
      );
    }

    const knob =
      document.createElement("div");

    toggle.appendChild(knob);
    element.appendChild(toggle);

    toggle.addEventListener(
      "click",
      () => {
        toggleControlToggle(toggle);
      }
    );

    toggle.addEventListener(
      "keydown",
      (event) => {
        if (
          event.key === "Enter" ||
          event.key === " "
        ) {
          event.preventDefault();
          toggleControlToggle(toggle);
        }
      }
    );
  } else {
    const value =
      document.createElement("strong");

    value.textContent =
      panel.value || "";

    element.appendChild(value);
  }

  return element;
}

function toggleControlToggle(
  toggle
) {
  const active =
    toggle.dataset.active === "true";

  const next =
    !active;

  toggle.dataset.active =
    next ? "true" : "false";

  toggle.classList.toggle(
    "active",
    next
  );
}

function renderControlSection(
  sectionName,
  animate = true
) {
  if (
    !controlHeading ||
    !controlPanels
  ) {
    return;
  }

  const section =
    controlSections[sectionName];

  if (!section) {
    return;
  }

  if (
    animate &&
    !prefersReducedMotion.matches
  ) {
    controlHeading.style.opacity =
      "0";

    controlHeading.style.transform =
      "translateY(7px)";

    controlPanels.style.opacity =
      "0";

    controlPanels.style.transform =
      "translateY(10px)";
  }

  const updateContent = () => {
    const kicker =
      controlHeading.querySelector(
        "span"
      );

    const title =
      controlHeading.querySelector(
        "strong"
      );

    if (kicker) {
      kicker.textContent =
        section.kicker;
    }

    if (title) {
      title.textContent =
        section.title;
    }

    controlPanels.innerHTML = "";

    section.panels.forEach(
      (panel, index) => {
        const element =
          createControlPanel(panel);

        if (
          index ===
            section.panels.length - 1
        ) {
          element.classList.add(
            "control-panel-wide"
          );
        }

        controlPanels.appendChild(
          element
        );
      }
    );

    setControlButtonState(
      controlNavigation,
      sectionName
    );

    if (
      animate &&
      !prefersReducedMotion.matches
    ) {
      requestAnimationFrame(() => {
        controlHeading.style.opacity =
          "1";

        controlHeading.style.transform =
          "translateY(0)";

        controlPanels.style.opacity =
          "1";

        controlPanels.style.transform =
          "translateY(0)";
      });
    }
  };

  if (
    animate &&
    !prefersReducedMotion.matches
  ) {
    window.setTimeout(
      updateContent,
      110
    );
  } else {
    updateContent();
  }
}

if (
  controlHeading &&
  controlPanels
) {
  controlHeading.style.transition =
    "opacity 180ms ease, transform 180ms ease";

  controlPanels.style.transition =
    "opacity 200ms ease, transform 200ms ease";
}

controlNavigation.forEach(
  (navigation) => {
    const label =
      navigation.textContent.trim();

    navigation.addEventListener(
      "click",
      () => {
        renderControlSection(
          label
        );
      }
    );

    navigation.addEventListener(
      "keydown",
      (event) => {
        if (
          event.key === "Enter" ||
          event.key === " "
        ) {
          event.preventDefault();

          renderControlSection(
            label
          );
        }
      }
    );

    navigation.addEventListener(
      "mouseenter",
      () => {
        if (
          navigation.classList.contains(
            "active"
          )
        ) {
          return;
        }

        navigation.style.transform =
          "translateX(2px)";

        navigation.style.background =
          "rgba(255, 255, 255, 0.025)";
      }
    );

    navigation.addEventListener(
      "mouseleave",
      () => {
        navigation.style.transform =
          "";

        navigation.style.background =
          "";
      }
    );
  }
);

renderControlSection(
  "Overview",
  false
);

/* ----------------------------------------------------------
   REDUCED MOTION
---------------------------------------------------------- */

if (prefersReducedMotion.matches) {
  stopDemoTimer();

  revealElements.forEach(
    (element) => {
      element.classList.add(
        "is-visible"
      );
    }
  );
}

prefersReducedMotion.addEventListener(
  "change",
  (event) => {
    if (event.matches) {
      stopDemoTimer();

      revealElements.forEach(
        (element) => {
          element.classList.add(
            "is-visible"
          );
        }
      );

      featureCards.forEach(
        (card) => {
          const visual =
            card.querySelector(
              ".feature-visual"
            );

          const glow =
            card.querySelector(
              ".feature-glow"
            );

          if (visual) {
            visual.style.transform =
              "translate3d(0, 0, 0)";
          }

          if (glow) {
            glow.style.opacity =
              "0";
          }
        }
      );

      return;
    }

    if (!demoPaused) {
      startDemoTimer();
    }
  }
);

/* ----------------------------------------------------------
   FAQ ACCORDION
---------------------------------------------------------- */

document
  .querySelectorAll(".faq details")
  .forEach((detail) => {
    detail.addEventListener(
      "toggle",
      () => {
        if (!detail.open) {
          return;
        }

        document
          .querySelectorAll(
            ".faq details"
          )
          .forEach((other) => {
            if (other !== detail) {
              other.removeAttribute(
                "open"
              );
            }
          });
      }
    );
  });