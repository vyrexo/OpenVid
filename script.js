var translations = {
  en: {
    search: "Search by title...",
    videoFeed: "Video Feed",
    nothingFound: "Nothing found. Try another query.",
    enableJS: "Enable JavaScript to see videos.",
    noVideos: "No videos available",
    settings: "Settings",
    theme: "Theme",
    english: "English",
    russian: "Русский",
    fullscreen: "Fullscreen",
    close: "Close"
  },
  ru: {
    search: "Поиск по названию...",
    videoFeed: "Лента видео",
    nothingFound: "Ничего не найдено. Попробуйте другой запрос.",
    enableJS: "Включите JavaScript для просмотра видео.",
    noVideos: "Видео недоступны",
    settings: "Настройки",
    theme: "Тема",
    english: "English",
    russian: "Русский",
    fullscreen: "На весь экран",
    close: "Закрыть"
  }
};
var videos = [];
var filteredVideos = [];
var currentLang = "en";
var currentFilter = "";
var currentPage = 1;
var videosPerPage = 50;
var grid = document.getElementById("grid");
var searchInput = document.getElementById("search");
var emptyMsg = document.getElementById("empty");
var paginationEl = document.getElementById("pagination");
var modal = document.getElementById("modal");
var modalTitle = document.getElementById("modal-title");
var playerWrap = document.getElementById("player-wrap");
var settingsToggle = document.getElementById("settings-toggle");
var settingsMenu = document.getElementById("settings-menu");
var langEnBtn = document.getElementById("lang-en");
var langRuBtn = document.getElementById("lang-ru");
var pageTitleEl = document.getElementById("page-title");
function t(key) {
  return (translations[currentLang] && translations[currentLang][key]) || translations.en[key] || key;
}
function updatePageTitle() {
  document.title = "OpenVid - " + t("videoFeed");
}
function applyLanguage() {
  searchInput.placeholder = t("search");
  pageTitleEl.textContent = t("videoFeed");
  emptyMsg.textContent = t("nothingFound");
  var noscript = grid.querySelector("noscript");
  if (noscript) {
    noscript.innerHTML = "<p>" + t("enableJS") + "</p>";
  }
  settingsToggle.title = t("settings");
  settingsToggle.setAttribute("aria-label", t("settings"));
  themeToggle.title = t("theme");
  themeToggle.setAttribute("aria-label", t("theme"));
  langEnBtn.textContent = t("english");
  langRuBtn.textContent = t("russian");
  updateLangButtons();
  updatePageTitle();
}
function updateLangButtons() {
  langEnBtn.className = "dropdown-item" + (currentLang === "en" ? " active" : "");
  langRuBtn.className = "dropdown-item" + (currentLang === "ru" ? " active" : "");
}
function getSavedLang() {
  try {
    if (typeof localStorage !== "undefined" && localStorage.getItem) {
      return localStorage.getItem("openvid-lang");
    }
  } catch (e) {}
  return null;
}
function saveLang(lang) {
  try {
    if (typeof localStorage !== "undefined" && localStorage.setItem) {
      localStorage.setItem("openvid-lang", lang);
    }
  } catch (e) {}
}
function setLanguage(lang) {
  if (lang !== "en" && lang !== "ru") return;
  currentLang = lang;
  saveLang(lang);
  applyLanguage();
  render(currentFilter);
}
function getSavedPage() {
  try {
    if (typeof localStorage !== "undefined" && localStorage.getItem) {
      var p = parseInt(localStorage.getItem("openvid-page"), 10);
      if (!isNaN(p) && p > 0) return p;
    }
  } catch (e) {}
  return 1;
}
function savePage(page) {
  try {
    if (typeof localStorage !== "undefined" && localStorage.setItem) {
      localStorage.setItem("openvid-page", page.toString());
    }
  } catch (e) {}
}
function loadVideos() {
  if (window.location.protocol === "file:") {
    console.log("Запустите сайт через локальный сервер: python -m http.server 8000");
    showNoVideos();
    return;
  }
  var xhr = new XMLHttpRequest();
  xhr.open("GET", "res/vid/videos.txt", true);
  xhr.onreadystatechange = function () {
    if (xhr.readyState === 4) {
      if (xhr.status === 200 && xhr.responseText.trim()) {
        parseVideos(xhr.responseText);
      } else {
        showNoVideos();
      }
    }
  };
  xhr.send();
}
function parseVideos(text) {
  var lines = text.split("\n");
  videos = [];
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i].trim();
    if (!line) continue;
    var parts = line.split(";");
    if (parts.length >= 6) {
      var poster = parts.length >= 7 ? parts[6] : "";
      videos.push({
        platform: parts[0],
        title: parts[1],
        desc: parts[2],
        time: parts[3],
        lang: parts[4],
        src: parts[5],
        poster: poster
      });
    }
  }
  currentPage = getSavedPage();
  render(currentFilter);
}
function showNoVideos() {
  grid.innerHTML = "";
  emptyMsg.textContent = t("noVideos");
  emptyMsg.style.display = "block";
  paginationEl.style.display = "none";
}
function filterVideos(filter) {
  var result = [];
  for (var i = 0; i < videos.length; i++) {
    var v = videos[i];
    if (v.lang && v.lang !== currentLang) continue;
    if (filter && v.title.toLowerCase().indexOf(filter) === -1) continue;
    result.push(v);
  }
  return result;
}
function renderPagination() {
  var totalPages = Math.ceil(filteredVideos.length / videosPerPage);
  if (totalPages <= 1) {
    paginationEl.style.display = "none";
    return;
  }
  if (currentFilter) {
    paginationEl.style.display = "none";
    return;
  }
  var html = "";
  for (var p = 1; p <= totalPages; p++) {
    html += '<button class="pagination-btn' + (p === currentPage ? " active" : "") + '" data-page="' + p + '">' + p + "</button>";
  }
  paginationEl.innerHTML = html;
  paginationEl.style.display = "flex";
  var btns = paginationEl.getElementsByClassName("pagination-btn");
  for (var i = 0; i < btns.length; i++) {
    btns[i].onclick = function () {
      goToPage(parseInt(this.getAttribute("data-page"), 10));
    };
  }
}
function goToPage(page) {
  var totalPages = Math.ceil(filteredVideos.length / videosPerPage);
  if (page < 1 || page > totalPages) return;
  currentPage = page;
  savePage(page);
  render(currentFilter);
  window.scrollTo(0, 0);
}
function render(filter) {
  currentFilter = filter || "";
  filteredVideos = filterVideos(currentFilter);
  var start = (currentPage - 1) * videosPerPage;
  var end = start + videosPerPage;
  var pageVideos = filteredVideos.slice(start, end);
  var html = "";
  var count = 0;
  for (var i = 0; i < pageVideos.length; i++) {
    var v = pageVideos[i];
    count++;
    var imgPart = "";
    if (v.poster) {
      imgPart = '<img src="' + v.poster + '" alt="" onerror="this.style.display=\'none\'">';
    }
    var originalIndex = videos.indexOf(v);
    html += '<div class="card" data-i="' + originalIndex + '">'
      + '<div class="thumb"><div class="thumb-inner">' + imgPart + '<div class="play"></div></div>'
      + '<span class="time">' + v.time + '</span></div>'
      + '<div class="card-body"><div class="card-title">' + v.title + '</div></div>'
      + "</div>";
  }
  grid.innerHTML = html;
  emptyMsg.style.display = (filteredVideos.length === 0) ? "block" : "none";
  var cards = grid.getElementsByClassName("card");
  for (i = 0; i < cards.length; i++) {
    cards[i].onclick = function () {
      var idx = parseInt(this.getAttribute("data-i"), 10);
      openModal(idx);
    };
  }
  renderPagination();
}
function openModal(index) {
  var v = videos[index];
  modalTitle.innerHTML = v.title;
  playerWrap.innerHTML = '<iframe src="' + v.src + '" allowfullscreen></iframe>';
  modal.style.display = "flex";
  document.title = "OpenVid - " + v.title;
}
function closeModal() {
  modal.style.display = "none";
  playerWrap.innerHTML = "";
  updatePageTitle();
}
modal.onclick = function (e) {
  e = e || window.event;
  if (e.target === modal || e.target === document.querySelector(".modal-overlay")) {
    closeModal();
  }
};
document.onkeydown = function (e) {
  e = e || window.event;
  if (e.keyCode === 27) {
    if (settingsMenu.style.display !== "none") {
      closeSettingsMenu();
    } else {
      closeModal();
    }
  }
};
function onSearch() {
  currentPage = 1;
  savePage(1);
  render(searchInput.value.toLowerCase());
}
if (searchInput.addEventListener) {
  searchInput.addEventListener("input", onSearch, false);
  searchInput.addEventListener("keyup", onSearch, false);
} else {
  searchInput.attachEvent("onkeyup", onSearch);
}
function toggleSettingsMenu() {
  var isOpen = settingsMenu.style.display !== "none";
  settingsMenu.style.display = isOpen ? "none" : "block";
  settingsToggle.setAttribute("aria-expanded", !isOpen);
}
function closeSettingsMenu() {
  settingsMenu.style.display = "none";
  settingsToggle.setAttribute("aria-expanded", "false");
}
settingsToggle.onclick = function (e) {
  e.stopPropagation();
  toggleSettingsMenu();
};
document.onclick = function (e) {
  e = e || window.event;
  if (settingsMenu.style.display !== "none" && e.target !== settingsToggle && e.target !== settingsMenu && !settingsMenu.contains(e.target)) {
    closeSettingsMenu();
  }
};
langEnBtn.onclick = function () { setLanguage("en"); closeSettingsMenu(); };
langRuBtn.onclick = function () { setLanguage("ru"); closeSettingsMenu(); };
function initLanguage() {
  var saved = getSavedLang();
  if (saved === "ru" || saved === "en") {
    currentLang = saved;
  }
  applyLanguage();
}
var themeToggle = document.getElementById("theme-toggle");
function getSavedTheme() {
  try {
    if (typeof localStorage !== "undefined" && localStorage.getItem) {
      return localStorage.getItem("openvid-theme");
    }
  } catch (e) {}
  return null;
}
function saveTheme(theme) {
  try {
    if (typeof localStorage !== "undefined" && localStorage.setItem) {
      localStorage.setItem("openvid-theme", theme);
    }
  } catch (e) {}
}
function themeIconHtml() {
  return '<img src="res/theme.webp" alt="Theme" width="24" height="24">';
}
function applyTheme(theme) {
  var body = document.body || document.getElementsByTagName("body")[0];
  var cls = body.className || "";
  cls = (" " + cls + " ").replace(" dark-theme ", " ");
  cls = cls.replace(/^\s+|\s+$/g, "");
  if (theme === "dark") {
    body.className = cls ? (cls + " dark-theme") : "dark-theme";
  } else {
    body.className = cls;
  }
  themeToggle.innerHTML = themeIconHtml();
}
themeToggle.onclick = function () {
  var body = document.body || document.getElementsByTagName("body")[0];
  var isDark = (" " + (body.className || "") + " ").indexOf(" dark-theme ") !== -1;
  if (isDark) {
    applyTheme("light");
    saveTheme("light");
  } else {
    applyTheme("dark");
    saveTheme("dark");
  }
};
(function init() {
  initLanguage();
  var savedTheme = getSavedTheme();
  if (savedTheme === "dark") {
    applyTheme("dark");
  } else {
    applyTheme("light");
  }
  loadVideos();
})();