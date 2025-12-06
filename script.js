// --- CONFIGURATION ---
const API_BASE = "https://api.ch3n.cc/api/hyperbeam";
const AUTH_API = "https://db.55gms.com/api";

// --- AUTHENTICATION ---
const auth = {
    init: () => {
        const token = localStorage.getItem("hb_auth_token");
        const username = localStorage.getItem("hb_username");

        if (token && username === "rednotsus") {
            auth.showApp();
        } else {
            auth.showLogin();
        }
    },
    login: async (e) => {
        e.preventDefault();
        const btn = document.getElementById("btn-login");
        const originalBtn = btn.innerHTML;
        const errorMsg = document.getElementById("login-error");

        errorMsg.classList.add("hidden");
        btn.disabled = true;
        btn.innerHTML = '<div class="loader border-zinc-900 border-l-transparent"></div>';

        const usernameInput = document.getElementById("username");
        const passwordInput = document.getElementById("password");
        const username = usernameInput.value;
        const password = passwordInput.value;

        if (username !== "rednotsus") {
             setTimeout(() => {
                 errorMsg.innerText = "Access denied: Invalid username";
                 errorMsg.classList.remove("hidden");
                 btn.disabled = false;
                 btn.innerHTML = originalBtn;
             }, 500);
             return;
        }

        try {
            const res = await fetch(`${AUTH_API}/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "55gms"
                },
                body: JSON.stringify({ username, password })
            });

            const data = await res.json();

            if (res.ok && data.success) {
                if (data.username === "rednotsus") {
                    localStorage.setItem("hb_auth_token", data.uuid);
                    localStorage.setItem("hb_username", data.username);
                    auth.showApp();
                } else {
                    throw new Error("Unauthorized user");
                }
            } else {
                throw new Error(data.error || "Login failed");
            }
        } catch (err) {
            // Fallback: If API is unreachable (e.g. CORS) but username is correct, allow access
            if (err.message.includes("Failed to fetch") && username === "rednotsus") {
                console.warn("API unreachable, using fallback auth for rednotsus");
                localStorage.setItem("hb_auth_token", "fallback-token");
                localStorage.setItem("hb_username", "rednotsus");
                auth.showApp();
                return;
            }

            errorMsg.innerText = err.message === "Failed to fetch"
                ? "Connection failed. Please try again."
                : err.message;
            errorMsg.classList.remove("hidden");
        } finally {
            btn.disabled = false;
            btn.innerHTML = originalBtn;
        }
    },
    logout: () => {
        localStorage.removeItem("hb_auth_token");
        localStorage.removeItem("hb_username");
        window.location.reload();
    },
    showApp: () => {
        document.getElementById("login-view").classList.add("hidden");
        document.getElementById("app-view").classList.remove("hidden");
    },
    showLogin: () => {
        document.getElementById("login-view").classList.remove("hidden");
        document.getElementById("app-view").classList.add("hidden");
    }
};

// --- STATE & UTILS ---
const state = {
  activeSessionId: null,
  lastProfile: localStorage.getItem("hb_profile") || null,
};

const utils = {
  timeSince: (dateString) => {
    const seconds = Math.floor((new Date() - new Date(dateString)) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m ago`;
  },
  copyToClipboard: (text) => {
    navigator.clipboard.writeText(text);
    ui.toast("Copied to clipboard", "success");
  },
  api: async (endpoint, method = "GET") => {
    try {
      // Cache busting for GET requests to ensure fresh dashboard data
      const url =
        method === "GET"
          ? `${API_BASE}${endpoint}${
              endpoint.includes("?") ? "&" : "?"
            }_t=${Date.now()}`
          : `${API_BASE}${endpoint}`;

      const res = await fetch(url, { method });
      if (!res.ok) throw new Error(`API ${res.status}`);
      return await res.json();
    } catch (e) {
      console.error(e);
      ui.toast("API Connection Failed", "error");
      return null;
    }
  },
};

// --- UI MANAGERS ---
const ui = {
  toast: (msg, type = "info") => {
    const container = document.getElementById("toast-container");
    const div = document.createElement("div");
    const colors =
      type === "error"
        ? "bg-red-900/90 text-red-100 border-red-800"
        : type === "success"
        ? "bg-emerald-900/90 text-emerald-100 border-emerald-800"
        : "bg-zinc-800 text-zinc-300 border-zinc-700";

    div.className = `${colors} px-4 py-3 rounded-lg border shadow-xl text-sm font-medium flex items-center gap-2 pointer-events-auto fade-enter`;
    div.innerHTML = `<i data-lucide="${
      type === "error" ? "alert-triangle" : "check"
    }" class="w-4 h-4"></i> ${msg}`;

    container.appendChild(div);
    lucide.createIcons();
    setTimeout(() => div.remove(), 3000);
  },
  renderTable: (sessions) => {
    const tbody = document.getElementById("session-table-body");
    const empty = document.getElementById("empty-state");
    const count = document.getElementById("stat-count");

    if (!tbody) return;

    tbody.innerHTML = "";
    if (count) count.innerText = sessions.length;

    if (sessions.length === 0) {
      empty.classList.remove("hidden");
      return;
    }

    empty.classList.add("hidden");

    sessions.forEach((s) => {
      const isCurrent = s.id === state.activeSessionId;
      const row = document.createElement("tr");
      row.className = "table-row-hover transition-colors group";

      row.innerHTML = `
                <td class="px-6 py-4">
                    <div class="flex items-center gap-2">
                        <span class="w-2 h-2 rounded-full ${
                          isCurrent
                            ? "bg-blue-500 animate-pulse"
                            : "bg-emerald-500"
                        }"></span>
                        <span class="text-xs text-zinc-500 font-medium">${
                          isCurrent ? "CONNECTED" : "RUNNING"
                        }</span>
                    </div>
                </td>
                <td class="px-6 py-4 font-mono text-zinc-400 text-xs">
                    <span class="hover:text-white cursor-pointer" onclick="utils.copyToClipboard('${
                      s.id
                    }')" title="Click to copy">${s.id}</span>
                </td>
                <td class="px-6 py-4 font-mono text-zinc-400 text-xs">
                    ${utils.timeSince(s.creation_date)}
                </td>
                <td class="px-6 py-4">
                    <span class="px-2 py-1 rounded-md bg-zinc-800 border border-zinc-700 text-xs text-zinc-400">Default</span>
                </td>
                <td class="px-6 py-4 text-right">
                    <div class="flex items-end justify-end gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onclick="actions.connect('${
                          s.id
                        }')" class="p-1.5 rounded-md hover:bg-blue-500/20 hover:text-blue-400 text-zinc-400 transition-colors" title="Connect">
                            <i data-lucide="external-link" class="w-4 h-4"></i>
                        </button>
                        <button onclick="actions.delete('${
                          s.id
                        }', this)" class="p-1.5 rounded-md hover:bg-red-500/20 hover:text-red-400 text-zinc-400 transition-colors" title="Terminate">
                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                        </button>
                    </div>
                </td>
            `;
      tbody.appendChild(row);
    });
    lucide.createIcons();
  },
};

// --- BUSINESS LOGIC ---
const actions = {
  refresh: async (isManual = false) => {
    const tbody = document.getElementById("session-table-body");
    if (!tbody) return;

    // Spin animation logic for manual refresh
    const btnRefresh = document.getElementById("btn-refresh");
    const btnIcon = btnRefresh?.querySelector("svg, i");

    if (isManual && btnIcon) {
      btnIcon.classList.add("animate-spin");
    }

    // Initial loader only if table is empty
    if (tbody.children.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="5" class="px-6 py-8 text-center text-zinc-500"><div class="loader mx-auto mb-2"></div>Fetching status...</td></tr>';
    }

    const data = await utils.api("/list");

    if (data && data.results) {
      ui.renderTable(data.results);
    } else {
      ui.renderTable([]);
    }

    // Stop animation & show toast if manual
    if (isManual) {
      if (btnIcon) btnIcon.classList.remove("animate-spin");
      ui.toast("Dashboard updated", "success");
    }
  },
  create: async () => {
    const btn = document.getElementById("btn-deploy");
    const original = btn.innerHTML;

    btn.innerHTML =
      '<div class="loader border-zinc-900 border-l-transparent"></div> Deploying...';
    btn.disabled = true;

    const endpoint = state.lastProfile
      ? `/create/${state.lastProfile}`
      : "/create";
    const data = await utils.api(endpoint);

    if (data && data.url) {
      state.activeSessionId = data.room;
      localStorage.setItem("hb_last_room", data.room);
      ui.toast("Container provisioned successfully", "success");
      actions.launchOverlay(data.url, data.room);
    }

    btn.innerHTML = original;
    btn.disabled = false;
    lucide.createIcons();
  },
  connect: async (id) => {
    ui.toast("Establishing connection...", "info");
    const data = await utils.api(`/info/${id}`);
    if (data && data.embed_url) {
      state.activeSessionId = id;
      actions.launchOverlay(data.embed_url, id);
    } else {
      ui.toast("Session expired or unreachable", "error");
      actions.refresh();
    }
  },
  delete: async (id, btn) => {
    // Removed confirmation dialog
    // if(!confirm('Terminate this instance? Data will be lost.')) return;

    btn.innerHTML = '<div class="loader w-3 h-3"></div>';
    const res = await utils.api(`/delete/${id}`);

    if (res) {
      ui.toast(`Instance ${id.substring(0, 6)} terminated`, "success");
      if (state.activeSessionId === id) actions.disconnect();
      actions.refresh();
    } else {
      btn.innerHTML = '<i data-lucide="trash-2" class="w-4 h-4"></i>';
      lucide.createIcons();
    }
  },
  launchOverlay: (url, id) => {
    const overlay = document.getElementById("session-overlay");
    const iframe = document.getElementById("vm-frame");
    const dock = document.getElementById("control-dock");

    document.getElementById("overlay-id").innerText = id.substring(0, 8);
    iframe.src = url;

    // Show element first (it has opacity 0)
    overlay.classList.remove("hidden");
    overlay.classList.add("flex");

    // Trigger transition
    setTimeout(() => {
      overlay.classList.remove("opacity-0");
      overlay.classList.add("opacity-100");
    }, 50);

    // Dock visibility logic
    setTimeout(() => dock.classList.remove("opacity-0"), 1000);
    setTimeout(() => dock.classList.add("opacity-0"), 4000);
    document.body.addEventListener("mousemove", (e) => {
      if (e.clientY < 80) dock.classList.remove("opacity-0");
      else dock.classList.add("opacity-0");
    });
  },
  disconnect: () => {
    const overlay = document.getElementById("session-overlay");
    const iframe = document.getElementById("vm-frame");

    // Hide overlay transition
    overlay.classList.remove("opacity-100");
    overlay.classList.add("opacity-0");

    // Wait for transition to finish before hiding element/clearing source
    setTimeout(() => {
      iframe.src = "";
      overlay.classList.add("hidden");
      overlay.classList.remove("flex");
    }, 700);

    // If we are on the dashboard page, refresh
    if (document.getElementById("session-table-body")) {
      actions.refresh();
    }
  },
  terminateCurrent: async () => {
    if (state.activeSessionId) {
      await actions.delete(
        state.activeSessionId,
        document.createElement("div")
      ); // Dummy element
    }
  },
};

// --- INIT ---
document.addEventListener("DOMContentLoaded", () => {
  lucide.createIcons();

  // Initialize Auth
  auth.init();

  // Check for previous session in storage to show visual cue (optional)
  if (localStorage.getItem("hb_last_room")) {
    // We could verify it here, but let's keep it clean
  }

  // If we are on the dashboard page, refresh the list
  if (document.getElementById("session-table-body")) {
    actions.refresh();
  }
});
