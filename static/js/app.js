/* ============================================================
   Streamy front end
   All decisions come from the server; this file only renders.
   ============================================================ */
"use strict";

const state = {
  items: [],
  view: "home",
  genre: "All",
  q: "",
  current: null,
};

const el = (id) => document.getElementById(id);

/* ---------------------------------------------------------- helpers */
function hueOf(text) {
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) % 360;
  return h;
}

function posterBackground(text) {
  const h = hueOf(text);
  return `linear-gradient(150deg,
    hsl(${h} 62% 34%) 0%,
    hsl(${(h + 28) % 360} 55% 22%) 48%,
    hsl(${(h + 60) % 360} 42% 12%) 100%)`;
}

function formatSize(bytes) {
  if (!bytes) return "—";
  const mb = bytes / (1024 * 1024);
  return mb >= 1000 ? (mb / 1024).toFixed(2) + " GB" : mb.toFixed(1) + " MB";
}

function toast(message, kind) {
  const box = el("toasts");
  const node = document.createElement("div");
  node.className = "toast " + (kind === "err" ? "err" : "ok");
  node.innerHTML = `<i>${kind === "err" ? "!" : "✓"}</i><div>${message}</div>`;
  box.appendChild(node);
  setTimeout(() => {
    node.style.opacity = "0";
    node.style.transform = "translateX(18px)";
    setTimeout(() => node.remove(), 260);
  }, 3600);
}

/* ---------------------------------------------------------- catalogue */
async function loadCatalogue() {
  const res = await fetch("/api/catalog");
  const data = await res.json();
  state.items = data.items;
  renderHero();
  renderFilters();
  renderGrid();
  loadStats();
}

async function loadStats() {
  const res = await fetch("/api/stats");
  const s = await res.json();
  el("statTitles").textContent = s.titles;
  el("statVideos").textContent = s.withVideo;
  el("statActors").textContent = s.actorCount;
  el("statStorage").textContent = s.storageMB ? s.storageMB + " MB" : "0 MB";
}

function renderHero() {
  const pick =
    state.items.find((i) => i.hasVideo) ||
    state.items[0];

  if (!pick) {
    el("heroTitle").textContent = "Your catalogue is empty";
    el("heroDesc").textContent = "Upload a video to start building the platform.";
    el("heroMeta").innerHTML = "";
    el("heroBg").style.background = "linear-gradient(135deg,#1b1b26,#0d0d13)";
    return;
  }

  state.current = pick;
  el("heroKind").textContent = pick.kind === "show" ? "TV Series" : "Feature Film";
  el("heroTitle").textContent = pick.title;
  el("heroDesc").textContent =
    pick.description ||
    "No synopsis yet — open the title card to see its metadata and playback authorization flow.";

  const bits = [];
  bits.push(`<span class="chip chip-accent">${pick.kind === "show" ? "SERIES" : "FILM"}</span>`);
  bits.push(`<span>${pick.year}</span>`);
  if (pick.genre) bits.push(`<span class="dot"></span><span>${pick.genre}</span>`);
  if (pick.kind === "show" && pick.seasons)
    bits.push(`<span class="dot"></span><span>${pick.seasons} season${pick.seasons > 1 ? "s" : ""}</span>`);
  if (pick.kind === "film" && pick.minutes)
    bits.push(`<span class="dot"></span><span>${pick.minutes} min</span>`);
  if (pick.actors.length)
    bits.push(`<span class="dot"></span><span>${pick.actors.slice(0, 2).join(", ")}</span>`);
  el("heroMeta").innerHTML = bits.join(" ");

  const bg = pick.hasPoster
    ? `url("${pick.posterUrl}") center/cover no-repeat`
    : posterBackground(pick.title);
  el("heroBg").style.background = bg;
}

function renderFilters() {
  const genres = ["All", ...new Set(state.items.map((i) => i.genre).filter(Boolean))];
  el("filters").innerHTML = genres
    .map(
      (g) =>
        `<button class="filter ${state.genre === g ? "active" : ""}" data-genre="${g}">${g}</button>`
    )
    .join("");

  el("filters").querySelectorAll(".filter").forEach((b) => {
    b.onclick = () => {
      state.genre = b.dataset.genre;
      renderFilters();
      renderGrid();
    };
  });
}

function visibleItems() {
  let list = state.items.slice();

  if (state.view === "films") list = list.filter((i) => i.kind === "film");
  if (state.view === "shows") list = list.filter((i) => i.kind === "show");
  if (state.view === "mine") list = list.filter((i) => i.hasVideo);
  if (state.genre !== "All") list = list.filter((i) => i.genre === state.genre);

  const q = state.q.trim().toLowerCase();
  if (q) {
    list = list.filter((i) =>
      [i.title, i.genre, i.network, ...(i.actors || [])]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }

  return list.sort((a, b) => (a.created < b.created ? 1 : -1));
}

function renderGrid() {
  const list = visibleItems();
  el("countLabel").textContent = list.length + " title" + (list.length === 1 ? "" : "s");

  if (!list.length) {
    el("grid").innerHTML = `
      <div class="empty">
        <h3>Nothing matches this filter</h3>
        <p>Try another genre, clear the search box, or upload a video.</p>
        <button class="btn btn-primary" onclick="document.getElementById('openUpload').click()">Upload video</button>
      </div>`;
    return;
  }

  el("grid").innerHTML = list
    .map((item) => {
      const art = item.hasPoster
        ? `<img src="${item.posterUrl}" alt="${item.title} poster">`
        : `<div class="poster-art" style="background:${posterBackground(item.title)}">
             <span class="poster-initial">${item.title.slice(0, 1).toUpperCase()}</span>
           </div>`;

      const sub = [
        item.year,
        item.kind === "show"
          ? `${item.seasons || 1} season${(item.seasons || 1) > 1 ? "s" : ""}`
          : `${item.minutes || 0} min`,
        item.genre,
      ].filter(Boolean);

      return `
        <article class="card" data-id="${item.id}">
          <div class="poster">
            ${art}
            <span class="badge-kind">${item.kind === "show" ? "Series" : "Film"}</span>
            <span class="badge-file ${item.hasVideo ? "" : "no-file"}" title="${item.hasVideo ? "Video file attached" : "Metadata only"}">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M4 5h16v14H4z"/><path d="M9 9l6 3-6 3z"/>
              </svg>
            </span>
            <div class="play-float">
              <i><svg viewBox="0 0 24 24" fill="#fff"><path d="M8 5l11 7-11 7z"/></svg></i>
            </div>
          </div>
          <div class="card-body">
            <h3 class="card-title">${item.title}</h3>
            <div class="card-sub">
              ${sub.map((s) => `<span>${s}</span>`).join('<span class="dot"></span>')}
            </div>
            <div class="card-bar"><i style="width:${item.hasVideo ? 100 : 26}%"></i></div>
          </div>
        </article>`;
    })
    .join("");

  el("grid").querySelectorAll(".card").forEach((card) => {
    card.onclick = () => openPlayer(state.items.find((i) => i.id === card.dataset.id));
  });
}

/* ---------------------------------------------------------- player */
function openPlayer(item) {
  state.current = item;
  el("playerTitle").textContent = item.title;
  el("playerSub").textContent = `${item.kind === "show" ? "TV Series" : "Film"} · ${item.year} · ${
    item.genre || "Drama"
  }`;

  const video = el("video");
  video.pause();
  video.removeAttribute("src");
  video.load();

  el("gate").style.display = "grid";
  el("tokenInput").value = "VALID_STREAM_TOKEN_2026";
  el("playLog").textContent = "// authorization trace will appear here";
  el("playLog").className = "log";

  const meta = [];
  if (item.kind === "show" && item.seasons) meta.push(`<span>Seasons: <b>${item.seasons}</b></span>`);
  if (item.kind === "film" && item.minutes) meta.push(`<span>Runtime: <b>${item.minutes} min</b></span>`);
  if (item.network) meta.push(`<span>Network: <b>${item.network}</b></span>`);
  meta.push(`<span>Actors: <b>${item.actors.length ? item.actors.join(", ") : "none linked"}</b></span>`);
  meta.push(`<span>File: <b>${item.hasVideo ? formatSize(item.size) : "not attached"}</b></span>`);
  el("playerMeta").innerHTML = meta.join("");

  el("playerOverlay").classList.add("open");
}

async function authorize(token) {
  const item = state.current;
  if (!item) return;

  const res = await fetch(`/api/play/${item.id}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });
  const data = await res.json();

  el("playLog").className = "log" + (data.granted ? "" : " bad");
  el("playLog").textContent = data.logs.join("\n");

  if (!data.granted) {
    el("gate").classList.remove("shake");
    void el("gate").offsetWidth;
    el("gate").classList.add("shake");
    toast("401 Unauthorized — token rejected by play_media()", "err");
    return;
  }

  el("gate").style.display = "none";

  if (data.stream) {
    const video = el("video");
    video.src = data.stream;
    // Browsers block autoplay with sound, so start muted; the user can unmute
    // from the player controls.
    video.muted = true;
    video.play().catch(() => {});
    toast("200 OK — stream endpoint granted");
  } else {
    toast("200 OK — authorized, but no video file is attached to this title");
  }
}

/* ---------------------------------------------------------- upload */
function wireUpload() {
  const fileInput = el("videoFile");
  const posterInput = el("fPoster");

  fileInput.onchange = () => {
    const f = fileInput.files[0];
    el("dzFile").textContent = f ? `${f.name} · ${formatSize(f.size)}` : "";
    el("uploadHint").textContent = f ? "Ready to publish" : "No file selected";
    if (f) {
      const guess = f.name.replace(/\.(mp4|webm|ogv|ogg|mov|m4v|mkv)$/i, "");
      if (!el("fTitle").value) el("fTitle").value = guess.replace(/[_-]+/g, " ");
    }
  };

  const zone = el("dropzone");
  ["dragenter", "dragover"].forEach((ev) =>
    zone.addEventListener(ev, (e) => {
      e.preventDefault();
      zone.classList.add("hot");
    })
  );
  ["dragleave", "drop"].forEach((ev) =>
    zone.addEventListener(ev, (e) => {
      e.preventDefault();
      zone.classList.remove("hot");
    })
  );
  zone.addEventListener("drop", (e) => {
    const f = e.dataTransfer.files[0];
    if (!f) return;
    const dt = new DataTransfer();
    dt.items.add(f);
    fileInput.files = dt.files;
    fileInput.onchange();
  });

  el("uploadForm").onsubmit = (event) => {
    event.preventDefault();
    const file = fileInput.files[0];
    if (!file) {
      toast("Choose a video file first", "err");
      return;
    }

    const form = new FormData();
    form.append("video", file);
    form.append("title", el("fTitle").value);
    form.append("year", el("fYear").value);
    form.append("kind", el("fKind").value);
    form.append("genre", el("fGenre").value);
    form.append("actors", el("fActors").value);
    form.append("minutes", el("fMinutes").value);
    form.append("seasons", el("fSeasons").value);
    form.append("network", el("fNetwork").value);
    form.append("description", el("fDesc").value);
    if (posterInput.files[0]) form.append("poster", posterInput.files[0]);

    const bar = el("progressBar");
    const wrap = el("progress");
    wrap.classList.add("on");
    bar.style.width = "0%";
    el("submitUpload").disabled = true;

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/upload");
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) bar.style.width = Math.round((e.loaded / e.total) * 100) + "%";
    };
    xhr.onload = async () => {
      el("submitUpload").disabled = false;
      wrap.classList.remove("on");
      let data = {};
      try {
        data = JSON.parse(xhr.responseText);
      } catch (_) {}

      if (xhr.status === 201) {
        toast("Published — the title is now in the catalogue");
        el("uploadForm").reset();
        el("dzFile").textContent = "";
        el("uploadHint").textContent = "No file selected";
        el("uploadOverlay").classList.remove("open");
        await loadCatalogue();
      } else {
        toast(data.error || "Upload failed", "err");
      }
    };
    xhr.onerror = () => {
      el("submitUpload").disabled = false;
      wrap.classList.remove("on");
      toast("Network error while uploading", "err");
    };
    xhr.send(form);
  };
}

/* ---------------------------------------------------------- lab panel */
async function runPurge() {
  const show = state.items.find((i) => i.kind === "show");
  if (!show) {
    toast("No TV show in the catalogue to purge", "err");
    return;
  }
  const res = await fetch(`/api/purge/${show.id}`, { method: "POST" });
  const data = await res.json();
  if (!data.ok) {
    toast(data.error || "Purge failed", "err");
    return;
  }
  el("labLog").textContent = data.logs.join("\n") +
    `\n\nResult → seasons after purge: ${data.seasonsAfter} · actors after purge: ${data.actorsAfter}`;
  toast(`Composition cleared (${data.seasonsAfter} seasons left), aggregation kept ${data.actorsAfter} actors`);
}

async function runPlayDemo() {
  const item = state.items.find((i) => i.hasVideo) || state.items[0];
  if (!item) return;

  const expired = await (
    await fetch(`/api/play/${item.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: "EXPIRED_TOKEN" }),
    })
  ).json();

  const valid = await (
    await fetch(`/api/play/${item.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: "VALID_STREAM_TOKEN_2026" }),
    })
  ).json();

  el("labLog").textContent =
    `=== ${item.title} ===\n` +
    `[EXPIRED_TOKEN] granted = ${expired.granted}\n` +
    expired.logs.join("\n") +
    `\n\n[VALID_STREAM_TOKEN_2026] granted = ${valid.granted}\n` +
    valid.logs.join("\n");
}

/* ---------------------------------------------------------- wiring */
function wire() {
  el("openUpload").onclick = () => el("uploadOverlay").classList.add("open");
  el("heroPlay").onclick = () => state.current && openPlayer(state.current);
  el("heroLab").onclick = () => el("lab").classList.toggle("open");
  el("labClose").onclick = () => el("lab").classList.remove("open");

  document.querySelectorAll("[data-close]").forEach((b) => {
    b.onclick = () => {
      el(b.dataset.close).classList.remove("open");
      const video = el("video");
      video.pause();
    };
  });

  document.querySelectorAll(".overlay").forEach((ov) => {
    ov.onclick = (e) => {
      if (e.target === ov) {
        ov.classList.remove("open");
        el("video").pause();
      }
    };
  });

  document.querySelectorAll(".nav-item").forEach((b) => {
    b.onclick = () => {
      document.querySelectorAll(".nav-item").forEach((x) => x.classList.remove("active"));
      b.classList.add("active");
      state.view = b.dataset.view;
      renderGrid();
    };
  });

  el("search").oninput = (e) => {
    state.q = e.target.value;
    renderGrid();
  };

  el("authorize").onclick = () => authorize(el("tokenInput").value.trim());
  el("tokenInput").onkeydown = (e) => {
    if (e.key === "Enter") authorize(el("tokenInput").value.trim());
  };

  document.querySelectorAll(".quick button").forEach((b) => {
    b.onclick = () => {
      el("tokenInput").value = b.dataset.token;
      authorize(b.dataset.token);
    };
  });

  el("runPurge").onclick = runPurge;
  el("runPlay").onclick = runPlayDemo;

  wireUpload();
}

wire();
loadCatalogue();
