(function () {
    var started = false;
    var newsFallbackTimer = null;
    var serverTimeOffset = 0;
    var storageKey = "appk-theme";
    var scheduleProfileStorageKey = "appk-schedule-profile";
    var currentMobileSection = "section-timer";
    var selectedScheduleProfile = "auto";
    var scheduleProfiles = {
        regular: {
            label: "Обычные занятия",
            items: [
                { number: 1, label: "1 пара", start: "08:30", end: "10:05", note: "Учебное занятие" },
                { number: 2, label: "2 пара", start: "10:15", end: "11:50", note: "Учебное занятие" },
                { number: 3, label: "3 пара", start: "12:20", end: "13:55", note: "Учебное занятие" },
                { number: 4, label: "4 пара", start: "14:00", end: "15:35", note: "Учебное занятие" },
                { number: 5, label: "5 пара", start: "15:40", end: "17:15", note: "Ну тут если вы дошли до сюда, поздравляю! Вы выполнили самое сложное достижение!" }
            ]
        },
        monday: {
            label: "Понедельник",
            items: [
                { number: 1, label: "1 пара", start: "08:15", end: "09:45", note: "Понедельничное расписание" },
                { number: 2, label: "2 пара", start: "09:55", end: "11:25", note: "Понедельничное расписание" },
                { number: 3, label: "3 пара", start: "11:45", end: "13:15", note: "Понедельничное расписание" },
                { number: 4, label: "4 пара", start: "13:25", end: "14:55", note: "Понедельничное расписание" },
                { number: 5, label: "5 пара", start: "15:05", end: "16:35", note: "Дополнительное занятие" }
            ]
        },
        short: {
            label: "Сокращённые занятия",
            items: [
                { number: 1, label: "1 пара", start: "08:30", end: "09:45", note: "Сокращённый формат" },
                { number: 2, label: "2 пара", start: "09:55", end: "11:10", note: "Сокращённый формат" },
                { number: 3, label: "3 пара", start: "11:40", end: "12:55", note: "Сокращённый формат" },
                { number: 4, label: "4 пара", start: "13:00", end: "14:15", note: "Сокращённый формат" },
                { number: 5, label: "5 пара", start: "14:20", end: "15:35", note: "Сокращённый формат" }
            ]
        }
    };

    var dayNames = ["Воскресенье", "Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота"];
    var monthNames = ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"];

    function byId(id) {
        return document.getElementById(id);
    }

    function safeGetStorage() {
        try {
            if (window.localStorage) {
                return window.localStorage;
            }
        } catch (e) {}
        return null;
    }

    function getSavedTheme() {
        var storage = safeGetStorage();
        if (storage) {
            return storage.getItem(storageKey) || "theme-metro";
        }
        return "theme-metro";
    }

    function getSavedScheduleProfile() {
        var storage = safeGetStorage();
        if (storage) {
            return storage.getItem(scheduleProfileStorageKey) || "auto";
        }
        return "auto";
    }

    function saveScheduleProfile(profileName) {
        var storage = safeGetStorage();
        if (storage) {
            storage.setItem(scheduleProfileStorageKey, profileName);
        }
    }

    function saveTheme(themeName) {
        var storage = safeGetStorage();
        if (storage) {
            storage.setItem(storageKey, themeName);
        }
    }

    function applyTheme(themeName) {
        var body = document.body;
        var selector = byId("themeSelector");
        var themes = ["theme-metro", "theme-classic", "theme-luna", "theme-aero", "theme-holo", "theme-aqua"];
        var i;

        if (!body) {
            return;
        }

        for (i = 0; i < themes.length; i++) {
            body.className = body.className.replace(new RegExp("(^|\\s)" + themes[i] + "(?=\\s|$)", "g"), " ");
        }
        body.className = body.className.replace(/^\s+|\s+$/g, "");
        body.className += (body.className ? " " : "") + themeName;

        if (selector) {
            selector.value = themeName;
        }
        saveTheme(themeName);
    }

    function bindThemeSelector() {
        var selector = byId("themeSelector");
        if (!selector) {
            return;
        }

        if (selector.addEventListener) {
            selector.addEventListener("change", function () {
                applyTheme(selector.value);
            }, false);
        } else if (selector.attachEvent) {
            selector.attachEvent("onchange", function () {
                applyTheme(selector.value);
            });
        } else {
            selector.onchange = function () {
                applyTheme(selector.value);
            };
        }
    }

    function setRibbonActive(targetId) {
        var tabs = [byId("ribbonTabTimer"), byId("ribbonTabSchedule"), byId("ribbonTabNews")];
        var sections = [byId("section-timer"), byId("section-schedule"), byId("section-news")];
        var i;
        var map = {
            "section-timer": 0,
            "section-schedule": 1,
            "section-news": 2
        };

        for (i = 0; i < tabs.length; i++) {
            if (tabs[i]) {
                tabs[i].className = tabs[i].className.replace(/\sis-active/g, "").replace(/^is-active\s*/g, "");
            }
            if (sections[i]) {
                sections[i].className = sections[i].className.replace(/\smobile-section-active/g, "").replace(/^mobile-section-active\s*/g, "");
            }
        }

        if (typeof map[targetId] !== "undefined") {
            currentMobileSection = targetId;
            if (tabs[map[targetId]]) {
                tabs[map[targetId]].className += " is-active";
            }
            if (sections[map[targetId]]) {
                sections[map[targetId]].className += " mobile-section-active";
            }
        }
    }

    function isMobileRibbonMode() {
        var ribbon = byId("mobileRibbon");
        if (!ribbon) {
            return false;
        }
        return ribbon.offsetWidth > 0;
    }

    function syncRibbonLayout() {
        var tabs = [byId("ribbonTabTimer"), byId("ribbonTabSchedule"), byId("ribbonTabNews")];
        if (tabs[2]) {
            tabs[2].className = tabs[2].className.replace(/\smobile-ribbon-tab-last/g, "").replace(/^mobile-ribbon-tab-last\s*/g, "");
            tabs[2].className += " mobile-ribbon-tab-last";
        }

        if (isMobileRibbonMode()) {
            setRibbonActive(currentMobileSection);
        } else {
            var sections = [byId("section-timer"), byId("section-schedule"), byId("section-news")];
            var i;
            for (i = 0; i < sections.length; i++) {
                if (sections[i]) {
                    sections[i].className = sections[i].className.replace(/\smobile-section-active/g, "").replace(/^mobile-section-active\s*/g, "");
                }
            }
        }
    }

    function bindMobileRibbon() {
        var tabs = [byId("ribbonTabTimer"), byId("ribbonTabSchedule"), byId("ribbonTabNews")];
        var i;
        var attachHandler = function (tab) {
            var handler = function () {
                if (isMobileRibbonMode()) {
                    setRibbonActive(tab.getAttribute("data-target"));
                    return false;
                }
            };

            if (tab.addEventListener) {
                tab.addEventListener("click", function (evt) {
                    if (handler() === false) {
                        if (evt && evt.preventDefault) {
                            evt.preventDefault();
                        }
                        evt.returnValue = false;
                    }
                }, false);
            } else if (tab.attachEvent) {
                tab.attachEvent("onclick", function () {
                    if (handler() === false) {
                        window.event.returnValue = false;
                    }
                });
            } else {
                tab.onclick = handler;
            }
        };

        for (i = 0; i < tabs.length; i++) {
            if (tabs[i]) {
                attachHandler(tabs[i]);
            }
        }
    }

    function text(node, value) {
        if (node) {
            node.innerHTML = value;
        }
    }

    function pad(value) {
        return value < 10 ? "0" + value : "" + value;
    }

    function toMinutes(value) {
        var parts = value.split(":");
        return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
    }

    function makeDateFromTime(baseDate, timeValue) {
        var parts = timeValue.split(":");
        return new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), parseInt(parts[0], 10), parseInt(parts[1], 10), 0, 0);
    }

    function formatDuration(ms) {
        if (ms < 0) {
            ms = 0;
        }
        var total = Math.floor(ms / 1000);
        var hours = Math.floor(total / 3600);
        var minutes = Math.floor((total % 3600) / 60);
        var seconds = total % 60;
        return pad(hours) + ":" + pad(minutes) + ":" + pad(seconds);
    }

    function formatDateLabel(dateObj) {
        return dayNames[dateObj.getDay()] + ", " + dateObj.getDate() + " " + monthNames[dateObj.getMonth()] + " " + dateObj.getFullYear();
    }

    function getEffectiveScheduleProfile(now) {
        if (selectedScheduleProfile === "monday" || selectedScheduleProfile === "short" || selectedScheduleProfile === "regular") {
            return selectedScheduleProfile;
        }
        if (now.getDay() === 1) {
            return "monday";
        }
        return "regular";
    }

    function getActiveSchedule(now) {
        var profileName = getEffectiveScheduleProfile(now);
        return scheduleProfiles[profileName].items;
    }

    function getScheduleProfileLabel(now) {
        var profileName = getEffectiveScheduleProfile(now);
        return scheduleProfiles[profileName].label;
    }

    function bindScheduleProfileSelector() {
        var selector = byId("scheduleProfileSelector");
        if (!selector) {
            return;
        }

        selector.value = selectedScheduleProfile;

        if (selector.addEventListener) {
            selector.addEventListener("change", function () {
                selectedScheduleProfile = selector.value;
                saveScheduleProfile(selectedScheduleProfile);
                updateClock();
            }, false);
        } else if (selector.attachEvent) {
            selector.attachEvent("onchange", function () {
                selectedScheduleProfile = selector.value;
                saveScheduleProfile(selectedScheduleProfile);
                updateClock();
            });
        } else {
            selector.onchange = function () {
                selectedScheduleProfile = selector.value;
                saveScheduleProfile(selectedScheduleProfile);
                updateClock();
            };
        }
    }

    function getCurrentInfo(now) {
        var i;
        var schedule = getActiveSchedule(now);
        var currentMinutes = now.getHours() * 60 + now.getMinutes();
        var currentPair = null;
        var nextPair = null;
        var intervalEnd = null;
        var intervalLabel = "Занятий сейчас нет";
        var status = "До первой пары";

        for (i = 0; i < schedule.length; i++) {
            var item = schedule[i];
            var start = toMinutes(item.start);
            var end = toMinutes(item.end);

            if (currentMinutes >= start && currentMinutes < end) {
                currentPair = item;
                intervalEnd = makeDateFromTime(now, item.end);
                intervalLabel = item.label + " · до конца занятия";
                status = "Идёт " + item.label;
                nextPair = schedule[i + 1] || null;
                return {
                    mode: "lesson",
                    currentPair: currentPair,
                    nextPair: nextPair,
                    intervalEnd: intervalEnd,
                    intervalLabel: intervalLabel,
                    status: status
                };
            }

            if (i < schedule.length - 1) {
                var nextItem = schedule[i + 1];
                var breakStart = end;
                var breakEnd = toMinutes(nextItem.start);

                if (currentMinutes >= breakStart && currentMinutes < breakEnd) {
                    intervalEnd = makeDateFromTime(now, nextItem.start);
                    intervalLabel = "Перемена · до начала " + nextItem.label;
                    status = "Перемена перед " + nextItem.label;
                    return {
                        mode: "break",
                        currentPair: item,
                        nextPair: nextItem,
                        intervalEnd: intervalEnd,
                        intervalLabel: intervalLabel,
                        status: status
                    };
                }
            }
        }

        if (currentMinutes < toMinutes(schedule[0].start)) {
            nextPair = schedule[0];
            intervalEnd = makeDateFromTime(now, nextPair.start);
            intervalLabel = "До начала " + nextPair.label;
            status = "До начала занятий";
        } else {
            nextPair = null;
            intervalEnd = new Date(now.getTime());
            intervalLabel = "Учебный день завершён";
            status = "Пары закончились";
        }

        return {
            mode: "idle",
            currentPair: null,
            nextPair: nextPair,
            intervalEnd: intervalEnd,
            intervalLabel: intervalLabel,
            status: status
        };
    }

    function renderSchedule(info, now) {
        var i;
        var html = "";
        var schedule = getActiveSchedule(now);
        for (i = 0; i < schedule.length; i++) {
            var item = schedule[i];
            var cls = "schedule-row";
            if (i === 0) {
                cls += " schedule-row-first";
            }
            if (info.currentPair && info.currentPair.number === item.number && info.mode === "lesson") {
                cls += " schedule-row-active";
            }
            html += '<div class="' + cls + '">';
            html += '<div class="schedule-time">' + item.start + '<br />' + item.end + '</div>';
            html += '<div class="schedule-copy">';
            html += '<span class="schedule-index">Пара ' + item.number + '</span>';
            html += '<strong>' + item.label + '</strong>';
            html += '<span>' + item.note + '</span>';
            html += '</div>';
            html += '<div style="clear: both;"></div>';
            html += '</div>';
        }
        html = '<div class="footer-note">Активный профиль: ' + getScheduleProfileLabel(now) + '</div>' + html;
        byId("scheduleList").innerHTML = html;
    }

    function parseJson(textValue) {
        if (window.JSON && window.JSON.parse) {
            return window.JSON.parse(textValue);
        }
        return eval("(" + textValue + ")");
    }

    function makeRequest(url, success, failure) {
        var xhr = null;
        if (window.XMLHttpRequest) {
            xhr = new XMLHttpRequest();
        } else if (window.ActiveXObject) {
            try {
                xhr = new ActiveXObject("Msxml2.XMLHTTP");
            } catch (e1) {
                try {
                    xhr = new ActiveXObject("Microsoft.XMLHTTP");
                } catch (e2) {}
            }
        }

        if (!xhr) {
            failure();
            return;
        }

        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                if ((xhr.status >= 200 && xhr.status < 300) || xhr.status === 304 || xhr.status === 0) {
                    success(xhr.responseText);
                } else {
                    failure();
                }
            }
        };

        xhr.open("GET", url, true);
        xhr.send(null);
    }

    function getNow() {
        return new Date(new Date().getTime() + serverTimeOffset);
    }

    function syncClock() {
        makeRequest("time-proxy.php?_=" + new Date().getTime(), function (responseText) {
            var data = null;
            try {
                data = parseJson(responseText);
            } catch (e) {
                data = null;
            }

            if (data && data.ok && typeof data.serverUnixMs !== "undefined") {
                serverTimeOffset = parseInt(data.serverUnixMs, 10) - new Date().getTime();
            }

            updateClock();
        }, function () {
            serverTimeOffset = 0;
            updateClock();
        });
    }

    function renderNews(items, sourceLabel) {
        var html = "";
        var i;
        if (!items || !items.length) {
            byId("newsList").innerHTML = '<div class="empty-state">Новости пока недоступны. Проверьте `news-proxy.php` или обновите локальный резервный список.</div>';
            text(byId("newsState"), "Нет данных");
            return;
        }

        for (i = 0; i < items.length; i++) {
            var item = items[i];
            var cls = i === 0 ? "news-card news-card-first" : "news-card";
            html += '<div class="' + cls + '">';
            html += '<span class="news-time">' + (item.time || "VK") + '</span>';
            html += '<h3><a href="' + item.url + '" target="_blank">' + item.title + '</a></h3>';
            html += '<p>' + item.excerpt + '</p>';
            html += '</div>';
        }
        html += '<div class="footer-note">Источник: ' + sourceLabel + '</div>';
        byId("newsList").innerHTML = html;
        text(byId("newsState"), sourceLabel);
    }

    function showFallbackNews() {
        var host = byId("newsEmbedHost");
        var fallback = byId("newsFallback");
        if (host) {
            host.style.display = "none";
        }
        if (fallback) {
            fallback.style.display = "block";
        }
        renderNews(window.APPK_FALLBACK_NEWS || [], "Локальный резерв");
    }

    function showEmbeddedNews() {
        var mask = byId("newsFrameMask");
        var fallback = byId("newsFallback");
        var host = byId("newsEmbedHost");
        if (newsFallbackTimer) {
            window.clearTimeout(newsFallbackTimer);
            newsFallbackTimer = null;
        }
        if (host) {
            host.style.display = "block";
        }
        if (fallback) {
            fallback.style.display = "none";
        }
        if (mask) {
            mask.style.display = "none";
        }
        text(byId("newsState"), "VK embedded");
    }

    function loadNews() {
        var frame = byId("newsFrame");
        var mask = byId("newsFrameMask");

        if (!frame) {
            showFallbackNews();
            return;
        }

        if (mask) {
            mask.style.display = "block";
        }

        frame.onload = function () {
            showEmbeddedNews();
        };

        newsFallbackTimer = window.setTimeout(function () {
            showFallbackNews();
        }, 4500);

        try {
            frame.src = "https://m.vk.com/wall-217232463";
        } catch (e) {
            showFallbackNews();
        }
    }

    function updateClock() {
        var now = getNow();
        var info = getCurrentInfo(now);
        var nextBellValue = "--:--";
        var currentSlot = "Нет активного интервала";
        var countdownLabel = info.intervalLabel;

        text(byId("todayLabel"), formatDateLabel(now));
        text(byId("currentStatus"), info.status);
        text(byId("countdown"), formatDuration(info.intervalEnd.getTime() - now.getTime()));
        text(byId("countdownLabel"), countdownLabel);

        if (info.mode === "lesson" && info.currentPair) {
            currentSlot = info.currentPair.label + " · " + info.currentPair.start + " - " + info.currentPair.end;
            nextBellValue = info.currentPair.end;
        } else if (info.mode === "break" && info.nextPair) {
            currentSlot = "Перемена · следующая " + info.nextPair.label;
            nextBellValue = info.nextPair.start;
        } else if (info.nextPair) {
            currentSlot = "Следующая " + info.nextPair.label + " · " + info.nextPair.start;
            nextBellValue = info.nextPair.start;
        } else {
            currentSlot = "Пары завершены";
        }

        text(byId("currentSlot"), currentSlot);
        text(byId("nextBell"), nextBellValue);
        renderSchedule(info, now);
    }

    function init() {
        if (started) {
            return;
        }
        started = true;
        selectedScheduleProfile = getSavedScheduleProfile();
        applyTheme(getSavedTheme());
        bindThemeSelector();
        bindScheduleProfileSelector();
        bindMobileRibbon();
        syncRibbonLayout();
        loadNews();
        syncClock();
        updateClock();
        window.setInterval(updateClock, 1000);
        window.setInterval(syncClock, 300000);
        window.setInterval(syncRibbonLayout, 700);
    }

    if (document.readyState === "complete") {
        init();
    } else if (document.addEventListener) {
        document.addEventListener("DOMContentLoaded", init, false);
        window.addEventListener("load", init, false);
    } else if (document.attachEvent) {
        document.attachEvent("onreadystatechange", function () {
            if (document.readyState === "complete") {
                init();
            }
        });
        window.attachEvent("onload", init);
    } else {
        window.onload = init;
    }
})();
