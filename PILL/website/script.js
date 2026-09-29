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

let stateIndex = 0;

function updateDemo() {
  const current = demoStates[stateIndex];

  visualState.textContent = current.state;
  pillLabel.textContent = current.label;
  pillValue.textContent = current.value;

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

  if (current.state === "FOCUS") {
    pillTime.textContent = "24:58";
  } else {
    pillTime.textContent = "09:41";
  }

  stateIndex =
    (stateIndex + 1) %
    demoStates.length;
}

updateDemo();

setInterval(updateDemo, 2600);

document.querySelectorAll(".faq details").forEach((detail) => {
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