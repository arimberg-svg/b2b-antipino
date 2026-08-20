/* global Chart, REPORT */
(function () {
  const R = window.REPORT;
  const K = R.kpis;

  const money = (n, digits = 0) =>
    new Intl.NumberFormat("ru-RU", {
      maximumFractionDigits: digits,
      minimumFractionDigits: digits,
    }).format(n);

  const rub = (n) => `${money(Math.round(n))} ₽`;
  const mln = (n) => `${money(n / 1e6, 1)} млн ₽`;
  const iso = (s) => {
    if (!s) return "—";
    const [y, m, d] = s.split("-");
    return `${d}.${m}.${y}`;
  };

  const pill = (status) => {
    const map = {
      пропал: "gone",
      уходит: "leaving",
      тишина: "silent",
      живой: "alive",
    };
    const cls = map[status] || "silent";
    return `<span class="pill ${cls}">${status}</span>`;
  };

  const noWork = (name) => /казаров/i.test(name || "");
  const clientLabel = (name) =>
    noWork(name)
      ? `${name} <span class="pill gone">суд · не работать</span>`
      : name;

  document.getElementById("as-of").textContent = `На ${R.as_of}`;
  document.getElementById("lede").textContent =
    `Только склад «Магазин №10/Старый Тобольский тракт 3 км, 6 ст4». Реализации ${iso(R.period.from)} — ${iso(R.period.to)}. ${money(K.docs)} отгрузок, ${K.clients} контрагентов. Другие магазины и РЦ в расчёт не входят.`;

  document.getElementById("a-lost").textContent =
    `Да: ${K.lost_significant} значимых из ${K.clients}`;
  document.getElementById("a-lost-p").textContent =
    `90+ дней без покупки, сумма от 100 тыс. ₽ или от 3 отгрузок. Их история — ${mln(K.lost_revenue)}. Сейчас живых (покупка за 60 дней) только ${K.alive}. Ещё ${K.leaving} «уходят» (90–179 дней).`;

  document.getElementById("a-check").textContent =
    `Да: −${Math.abs(K.avg_check_delta_pct)}% к 2024`;
  document.getElementById("a-check-p").textContent =
    `Средний чек отгрузки ${rub(K.avg_check_2024)} в 2024 → ${rub(K.avg_check_2026)} в 2026. У ${K.like_clients} клиентов, кто покупал в оба года, чек тоже −${Math.abs(K.like_delta_pct)}%. Это не только уход крупных.`;

  document.getElementById("a-mgr").textContent = "ОМ сейчас — Яковлева";
  document.getElementById("a-mgr-p").textContent =
    "Гудилов, Калбаев и Глухов уволены. Никитина переведена в старшие продавцы-консультанты. Цифры ниже — кто выписывал реализации. Книгу Antipino ведёт Александра Яковлева.";

  const y24 = R.years.find((y) => y.year === "2024");
  const y25 = R.years.find((y) => y.year === "2025");
  const y26 = R.years.find((y) => y.year === "2026");
  document.getElementById("stats").innerHTML = [
    [`${mln(K.revenue)}`, "Выручка за период"],
    [`${mln(y24.revenue)}`, "2024"],
    [`${mln(y25.revenue)}`, "2025"],
    [`${mln(y26.revenue)}`, "2026 по 19 авг", true],
    [`${K.alive}`, "Живых клиентов", true],
  ]
    .map(
      ([v, l, hl]) =>
        `<article${hl ? ' class="hl"' : ""}><b>${v}</b><span>${l}</span></article>`
    )
    .join("");

  document.getElementById("top-months").innerHTML = R.top_months
    .map(
      (m) =>
        `<li><span>${m.label}</span><span class="num">${mln(m.revenue)}</span></li>`
    )
    .join("");
  document.getElementById("low-months").innerHTML = R.low_months
    .map(
      (m) =>
        `<li><span>${m.label}</span><span class="num">${mln(m.revenue)}</span></li>`
    )
    .join("");

  const jul24 = R.months.find((m) => m.key === "2024-07");
  const jul25 = R.months.find((m) => m.key === "2025-07");
  const jul26 = R.months.find((m) => m.key === "2026-07");
  document.getElementById("yoy-note").textContent =
    `Июль к июлю: ${mln(jul24.revenue)} (2024) → ${mln(jul25.revenue)} (2025, ${jul25.yoy_pct}%) → ${mln(jul26.revenue)} (2026, ${jul26.yoy_pct}%). Полное дно среди закрытых месяцев — февраль, январь 2026 и январь 2025.`;

  document.getElementById("like-note").textContent =
    `Like-for-like: ${K.like_clients} клиентов с покупками в 2024 и 2026. Их средний чек ${rub(K.like_avg_2024)} → ${rub(K.like_avg_2026)} (${K.like_delta_pct}%). У ${K.like_down} из них чек просел больше чем на 15%.`;

  const colors = R.months.map((m) => {
    if (m.incomplete) return "#c4b5e0";
    if (m.peak) return "#c81e3a";
    if (m.slump) return "#c4a000";
    return "#4208a8";
  });

  new Chart(document.getElementById("revChart"), {
    type: "bar",
    data: {
      labels: R.months.map((m) => m.label),
      datasets: [
        {
          label: "Выручка, ₽",
          data: R.months.map((m) => m.revenue),
          backgroundColor: colors,
          borderRadius: 4,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const m = R.months[ctx.dataIndex];
              return [
                `Выручка: ${rub(m.revenue)}`,
                `Отгрузок: ${m.docs}`,
                `Средний чек: ${rub(m.avg_check)}`,
                `Клиентов: ${m.clients}`,
                m.yoy_pct == null ? "" : `К прошлому году: ${m.yoy_pct}%`,
              ].filter(Boolean);
            },
          },
        },
      },
      scales: {
        x: {
          ticks: { maxRotation: 90, minRotation: 60, font: { size: 10 } },
          grid: { display: false },
        },
        y: {
          ticks: {
            callback: (v) => (v / 1e6).toFixed(1) + " млн",
          },
          title: { display: true, text: "Выручка, млн ₽" },
          grid: { color: "rgba(66,8,168,0.08)" },
        },
      },
    },
  });

  new Chart(document.getElementById("checkChart"), {
    type: "line",
    data: {
      labels: R.months.map((m) => m.label),
      datasets: [
        {
          label: "Средний чек, ₽",
          data: R.months.map((m) => m.avg_check),
          borderColor: "#c81e3a",
          backgroundColor: "rgba(200,30,58,0.08)",
          fill: true,
          tension: 0.25,
          pointRadius: 3,
          pointBackgroundColor: "#c81e3a",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: {
          ticks: { maxRotation: 90, minRotation: 60, font: { size: 10 } },
          grid: { display: false },
        },
        y: {
          ticks: { callback: (v) => money(v) },
          title: { display: true, text: "Средний чек отгрузки, ₽" },
          grid: { color: "rgba(66,8,168,0.08)" },
        },
      },
    },
  });

  const lostBody = document.getElementById("lost-rows");
  const lostCount = document.getElementById("lost-count");
  const renderLost = () => {
    const q = document.getElementById("lost-q").value.trim().toLowerCase();
    const st = document.getElementById("lost-status").value;
    const rows = R.lost_clients.filter((c) => {
      if (st && c.status !== st) return false;
      if (!q) return true;
      return (
        c.client.toLowerCase().includes(q) ||
        (c.manager_short || "").toLowerCase().includes(q)
      );
    });
    lostCount.textContent = `${rows.length} из ${R.lost_clients.length}`;
    lostBody.innerHTML = rows
      .map(
        (c) => `<tr class="${c.status === "пропал" || noWork(c.client) ? "gone" : "leaving"}">
        <td>${clientLabel(c.client)}</td>
        <td>${pill(c.status)}</td>
        <td>${c.manager_short}${c.role === "former" ? ' <span class="pill former">был</span>' : ""}</td>
        <td class="num">${rub(c.revenue)}</td>
        <td class="num">${c.docs}</td>
        <td>${iso(c.last)}</td>
        <td class="num">${c.silent_days} дн.</td>
      </tr>`
      )
      .join("");
  };
  document.getElementById("lost-q").addEventListener("input", renderLost);
  document.getElementById("lost-status").addEventListener("change", renderLost);
  renderLost();

  const focusMgrs = R.managers.filter((m) => m.role !== "other" || m.short === "Касса / прочие");
  let currentMgr = focusMgrs[0];
  const cards = document.getElementById("mgr-cards");
  const mgrRows = document.getElementById("mgr-rows");
  const mgrCount = document.getElementById("mgr-count");

  const drawCards = () => {
    cards.innerHTML = focusMgrs
      .map((m) => {
        const on = m.short === currentMgr.short ? " on" : "";
        const former = m.role === "former" ? " former" : "";
        const who =
          m.role === "b2b" ? "B2B сейчас" : m.role === "former" ? "Бывший лидер" : "Остальные авторы";
        return `<button type="button" class="mgr${on}${former}" data-short="${m.short}">
          <p class="who">${who}</p>
          <h3>${m.short}</h3>
          <div class="sum">${mln(m.revenue)}</div>
          <div class="meta">${m.clients} кл. · ${money(m.docs)} док. · чек ${rub(m.avg_check)}</div>
        </button>`;
      })
      .join("");
    cards.querySelectorAll(".mgr").forEach((btn) => {
      btn.addEventListener("click", () => {
        currentMgr = focusMgrs.find((m) => m.short === btn.dataset.short);
        drawCards();
        renderMgr();
      });
    });
  };

  const renderMgr = () => {
    const q = document.getElementById("mgr-q").value.trim().toLowerCase();
    const list = currentMgr.all_clients || currentMgr.top_clients || [];
    const rows = list.filter((c) => !q || c.client.toLowerCase().includes(q));
    mgrCount.textContent = `${rows.length} клиентов · ${currentMgr.short}`;
    if (!list.length) {
      mgrRows.innerHTML = `<tr><td colspan="4">По кассе и прочим авторам клиентская книга не разворачивается — это не закреплённые B2B-менеджеры.</td></tr>`;
      return;
    }
    mgrRows.innerHTML = rows
      .map(
        (c) => `<tr class="${noWork(c.client) ? "gone" : ""}">
        <td>${clientLabel(c.client)}</td>
        <td class="num">${rub(c.revenue)}</td>
        <td class="num">${c.docs}</td>
        <td>${iso(c.last)}</td>
      </tr>`
      )
      .join("");
  };

  document.getElementById("mgr-q").addEventListener("input", renderMgr);
  drawCards();
  renderMgr();

  document.getElementById("fall-rows").innerHTML = R.falling_check
    .map((c) => {
      const delta = c.avg_delta;
      const cls = delta < 0 ? "delta-neg" : "delta-pos";
      return `<tr class="${noWork(c.client) ? "gone" : ""}">
        <td>${clientLabel(c.client)}</td>
        <td>${c.manager_short}</td>
        <td class="num">${rub(c.avg_first)}</td>
        <td class="num">${rub(c.avg_last)}</td>
        <td class="num ${cls}">${delta < 0 ? "−" : "+"}${rub(Math.abs(delta))}</td>
        <td>${pill(c.status)}</td>
      </tr>`;
    })
    .join("");

  const leavingNow = R.lost_clients
    .filter(
      (c) =>
        c.status === "уходит" &&
        c.revenue >= 100000 &&
        !/калбаев ислам/i.test(c.client) &&
        !noWork(c.client) &&
        ["Калбаев", "Гудилов", "Глухов"].includes(c.manager_short)
    )
    .slice(0, 12);
  document.getElementById("act-leaving").innerHTML = leavingNow
    .map(
      (c) => `<tr class="leaving">
        <td>${clientLabel(c.client)}</td>
        <td>${c.manager_short}</td>
        <td class="num">${rub(c.revenue)}</td>
        <td class="num">${c.silent_days} дн.</td>
      </tr>`
    )
    .join("");

  const claimNow = R.clients
    .filter(
      (c) =>
        ["Калбаев", "Гудилов", "Глухов", "Никитина"].includes(c.manager_short) &&
        c.status === "живой" &&
        c.significant &&
        !noWork(c.client)
    )
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 15);
  document.getElementById("act-claim").innerHTML = claimNow
    .map(
      (c) => `<tr>
        <td>${clientLabel(c.client)}</td>
        <td>${c.manager_short}</td>
        <td class="num">${rub(c.revenue)}</td>
        <td class="num">${c.y2026 ? rub(c.y2026) : "—"}</td>
        <td>${c.silent_days} дн.</td>
      </tr>`
    )
    .join("");

  const A = window.AUGUST;
  if (A) {
    document.getElementById("aug-stats").innerHTML = [
      [`${mln(A.plan)}`, "План августа"],
      [`${rub(A.done)}`, `Факт на ${A.as_of}`],
      [`${rub(A.gap)}`, "Осталось", true],
      [`${rub(A.need_per_day)}`, `${A.days_left} дн. · в день`, true],
    ]
      .map(
        ([v, l, hl]) =>
          `<article${hl ? ' class="hl"' : ""}><b>${v}</b><span>${l}</span></article>`
      )
      .join("");

    document.getElementById("aug-close").innerHTML = A.close
      .map(
        (c) => `<tr>
        <td>${clientLabel(c.client)}</td>
        <td class="num">${c.aug ? rub(c.aug) : "—"}</td>
        <td class="num">${rub(c.sum90)}</td>
        <td class="num">${c.freq90}</td>
        <td class="num">${rub(c.avg)}</td>
        <td>${c.why}</td>
      </tr>`
      )
      .join("");

    document.getElementById("aug-freq").innerHTML = A.freq_big
      .map(
        (c) => `<tr>
        <td>${clientLabel(c.client)}</td>
        <td class="num">${c.freq90}</td>
        <td class="num">${rub(c.sum90)}</td>
        <td class="num">${rub(c.avg)}</td>
        <td class="num">${c.aug ? rub(c.aug) : "—"}</td>
        <td>${iso(c.last)}</td>
      </tr>`
      )
      .join("");
  }

  document.getElementById("foot").textContent =
    `«У Михалыча» · только Магазин №10 / Старый Тобольский тракт 3 км, 6 ст4 · реализации 1С ${iso(R.period.from)} — ${iso(R.period.to)} · собрано ${R.as_of}. Другие магазины и РЦ исключены.`;
})();
