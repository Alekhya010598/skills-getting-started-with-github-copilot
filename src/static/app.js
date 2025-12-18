document.addEventListener("DOMContentLoaded", () => {
  const apiBase = "/activities";

  const el = {
    activitiesList: document.getElementById("activities-list"),
    activityTemplate: document.getElementById("activity-template"),
    activitySelect: document.getElementById("activity"),
    signupForm: document.getElementById("signup-form"),
    emailInput: document.getElementById("email"),
    message: document.getElementById("message"),
  };

  function showMessage(text, type = "info") {
    el.message.className = `message ${type}`;
    el.message.textContent = text;
    el.message.classList.remove("hidden");
    setTimeout(() => el.message.classList.add("hidden"), 4000);
  }

  async function fetchActivities() {
    try {
      const res = await fetch(apiBase);
      if (!res.ok) throw new Error("Failed to load activities");
      return await res.json();
    } catch (err) {
      showMessage("Could not load activities.", "error");
      return {};
    }
  }

  function clearChildren(node) {
    while (node.firstChild) node.removeChild(node.firstChild);
  }

  function renderParticipantsList(listEl, participants) {
    clearChildren(listEl);
    if (!participants || participants.length === 0) {
      const li = document.createElement("li");
      li.textContent = "No participants yet";
      li.style.opacity = "0.7";
      li.style.background = "transparent";
      li.style.padding = "0";
      li.style.border = "none";
      listEl.appendChild(li);
      return;
    }
    participants.forEach((p) => {
      const li = document.createElement("li");
      li.textContent = p;
      listEl.appendChild(li);
    });
  }

  function renderActivities(activities) {
    // activitiesList
    clearChildren(el.activitiesList);
    // activity select
    clearChildren(el.activitySelect);
    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "-- Select an activity --";
    el.activitySelect.appendChild(placeholder);

    const names = Object.keys(activities);
    if (names.length === 0) {
      el.activitiesList.textContent = "No activities available.";
      return;
    }

    names.forEach((name) => {
      const data = activities[name];
      // populate select
      const opt = document.createElement("option");
      opt.value = name;
      opt.textContent = name;
      el.activitySelect.appendChild(opt);

      // clone template
      const tpl = el.activityTemplate.content.cloneNode(true);
      const card = tpl.querySelector(".activity-card");
      const title = tpl.querySelector(".activity-name");
      const desc = tpl.querySelector(".activity-desc");
      const sched = tpl.querySelector(".activity-schedule");
      const participantsList = tpl.querySelector(".participants-list");

      if (title) title.textContent = name;
      if (desc) desc.textContent = data.description || "";
      if (sched) {
        const scheduleNode = sched;
        scheduleNode.innerHTML = `<strong>Schedule:</strong> ${data.schedule || ""}`;
      }
      renderParticipantsList(participantsList, data.participants);
      el.activitiesList.appendChild(card);
    });
  }

  async function refresh() {
    const activities = await fetchActivities();
    renderActivities(activities);
  }

  el.signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = el.emailInput.value.trim();
    const activity = el.activitySelect.value;
    if (!email || !activity) {
      showMessage("Please enter your email and select an activity.", "error");
      return;
    }

    try {
      const url = `${apiBase}/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`;
      const res = await fetch(url, { method: "POST" });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        const detail = body.detail || body.message || "Signup failed";
        showMessage(detail, "error");
        return;
      }
      showMessage(body.message || "Signed up successfully!", "success");
      el.signupForm.reset();
      await refresh();
    } catch (err) {
      showMessage("Signup request failed.", "error");
    }
  });

  // initial load
  refresh();
});
