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
   STICKY HEADER + SCROLL PROGRESS
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
   REDUCED MOTION
---------------------------------------------------------- */

const prefersReducedMotion =
  window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  );

if (prefersReducedMotion.matches) {
  stopDemoTimer();

  revealElements.forEach((element) => {
    element.classList.add("is-visible");
  });
}

prefersReducedMotion.addEventListener(
  "change",
  (event) => {
    if (event.matches) {
      stopDemoTimer();

      revealElements.forEach((element) => {
        element.classList.add("is-visible");
      });

      return;
    }

    if (!demoPaused) {
      startDemoTimer();
    }
  }
);

/* ----------------------------------------------------------
   FAQ ACCORDION BEHAVIOR
---------------------------------------------------------- */

document
  .querySelectorAll(".faq details")
  .forEach((detail) => {
    detail.addEventListener("toggle", () => {
      if (!detail.open) {
        return;
      }

      document
        .querySelectorAll(".faq details")
        .forEach((other) => {
          if (other !== detail) {
            other.removeAttribute("open");
          }
        });
    });
  });