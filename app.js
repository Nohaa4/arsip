const STORAGE_KEY = "arsip_ia_sk_demo_v1";

const defaultData = {
  documents: [],
  programs: [
    {
      id: "p1",
      name: "Program Kerja Sama",
      notes: "Program kerja sama",
      status: "Aktif"
    },
    {
      id: "p2",
      name: "Program Pendidikan",
      notes: "Program pendidikan",
      status: "Aktif"
    }
  ],
  departments: [
    {
      id: "d1",
      name: "Departemen Akademik",
      notes: "Pengelolaan akademik",
      status: "Aktif"
    },
    {
      id: "d2",
      name: "Departemen Kerja Sama",
      notes: "Pengelolaan kerja sama",
      status: "Aktif"
    }
  ]
};

let data = loadData();
let toastTimer;

function loadData() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));

    if (
      saved &&
      Array.isArray(saved.documents) &&
      Array.isArray(saved.programs) &&
      Array.isArray(saved.departments)
    ) {
      return saved;
    }
  } catch (error) {}

  return structuredClone(defaultData);
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[char]));
}

function formatDate(value) {
  if (!value) return "-";

  const date = new Date(value + "T00:00:00");

  return Number.isNaN(date.getTime())
    ? "-"
    : date.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric"
      });
}

function getStatus(expiry) {
  if (!expiry) return "Aktif";

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const end = new Date(expiry + "T00:00:00");
  const diff = Math.ceil((end - today) / 86400000);

  if (diff < 0) return "Tidak Aktif";
  if (diff <= 30) return "Akan Berakhir";

  return "Aktif";
}

function statusPill(status) {
  const cls =
    status === "Aktif"
      ? "active"
      : status === "Akan Berakhir"
      ? "soon"
      : "inactive";

  return `<span class="pill ${cls}">${escapeHTML(status)}</span>`;
}

function showToast(message) {
  const toast = document.getElementById("toast");

  toast.textContent = message;
  toast.classList.remove("hidden");

  clearTimeout(toastTimer);

  toastTimer = setTimeout(() => {
    toast.classList.add("hidden");
  }, 2800);
}

function openModal(id) {
  document.getElementById(id).classList.remove("hidden");
}

function closeModal(id) {
  document.getElementById(id).classList.add("hidden");
}

function byId(id) {
  return document.getElementById(id);
}

/* NAVIGASI HALAMAN */

const pageInfo = {
  beranda: [
    "Beranda",
    "Selamat datang, Admin",
    "Berikut ringkasan pengelolaan dokumen IA / SK."
  ],

  dokumen: [
    "Data IA / SK",
    "Data IA / SK",
    "Kelola, cari, dan lihat dokumen IA / SK."
  ],

  program: [
    "Program",
    "Program",
    "Kelola daftar program yang tersedia."
  ],

  departemen: [
    "Departemen",
    "Departemen",
    "Kelola daftar departemen yang tersedia."
  ]
};

function showPage(page) {
  const pages = {
    beranda: "dashboardPage",
    dokumen: "documentsPage",
    program: "programPage",
    departemen: "departemenPage"
  };

  Object.entries(pages).forEach(([key, id]) => {
    byId(id).classList.toggle("hidden", key !== page);
  });

  document.querySelectorAll(".menu-link").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.page === page);
  });

  const info = pageInfo[page] || pageInfo.beranda;

  byId("topTitle").textContent = info[0];
  byId("pageTitle").textContent = info[1];
  byId("pageDesc").textContent = info[2];

  byId("addBtn").classList.toggle(
    "hidden",
    page !== "beranda" && page !== "dokumen"
  );

  byId("sidebar").classList.remove("open");

  if (page === "beranda") renderDashboard();
  if (page === "dokumen") renderDocuments();
  if (page === "program") renderPrograms();
  if (page === "departemen") renderDepartments();
}

/* DROPDOWN PROGRAM DAN DEPARTEMEN */

function refreshSelects() {
  const p = byId("programSelect");
  const d = byId("departmentSelect");

  const pValue = p.value;
  const dValue = d.value;

  p.innerHTML =
    '<option value="">Pilih program</option>' +
    data.programs
      .filter(x => x.status === "Aktif")
      .map(x => `
        <option value="${escapeHTML(x.id)}">
          ${escapeHTML(x.name)}
        </option>
      `)
      .join("");

  d.innerHTML =
    '<option value="">Pilih departemen</option>' +
    data.departments
      .filter(x => x.status === "Aktif")
      .map(x => `
        <option value="${escapeHTML(x.id)}">
          ${escapeHTML(x.name)}
        </option>
      `)
      .join("");

  if ([...p.options].some(o => o.value === pValue)) {
    p.value = pValue;
  }

  if ([...d.options].some(o => o.value === dValue)) {
    d.value = dValue;
  }
}

function programName(id) {
  return data.programs.find(x => x.id === id)?.name || "-";
}

function departmentName(id) {
  return data.departments.find(x => x.id === id)?.name || "-";
}

/* DASHBOARD */

function renderDashboard() {
  const docs = data.documents;

  const statuses = docs.map(x => getStatus(x.expires));

  byId("totalCount").textContent = docs.length;

  byId("activeCount").textContent =
    statuses.filter(x => x === "Aktif").length;

  byId("soonCount").textContent =
    statuses.filter(x => x === "Akan Berakhir").length;

  byId("inactiveCount").textContent =
    statuses.filter(x => x === "Tidak Aktif").length;

  const recent = [...docs]
    .sort((a, b) =>
      (b.createdAt || "").localeCompare(a.createdAt || "")
    )
    .slice(0, 5);

  byId("recentRows").innerHTML = recent.map((doc, i) => `
    <tr>
      <td>${i + 1}</td>
      <td class="doc-number">${escapeHTML(doc.number)}</td>
      <td>${escapeHTML(doc.title)}</td>
      <td>${escapeHTML(doc.type)}</td>
      <td>${escapeHTML(programName(doc.program))}</td>
      <td>${escapeHTML(departmentName(doc.department))}</td>
      <td>${formatDate(doc.expires)}</td>
      <td>${statusPill(getStatus(doc.expires))}</td>
    </tr>
  `).join("");

  byId("recentEmpty").classList.toggle(
    "hidden",
    recent.length > 0
  );
}

/* DATA IA / SK */

function renderDocuments() {
  const query = byId("searchInput").value.trim().toLowerCase();
  const status = byId("statusFilter").value;
  const type = byId("typeFilter").value;

  const docs = [...data.documents]
    .filter(doc => {
      const matchesText =
        `${doc.number} ${doc.title}`.toLowerCase().includes(query);

      return (
        matchesText &&
        (!status || getStatus(doc.expires) === status) &&
        (!type || doc.type === type)
      );
    })
    .sort((a, b) =>
      (b.createdAt || "").localeCompare(a.createdAt || "")
    );

  byId("documentRows").innerHTML = docs.map((doc, i) => `
    <tr>
      <td>${i + 1}</td>
      <td class="doc-number">${escapeHTML(doc.number)}</td>
      <td>${escapeHTML(doc.title)}</td>
      <td>${escapeHTML(doc.type)}</td>
      <td>${escapeHTML(programName(doc.program))}</td>
      <td>${escapeHTML(departmentName(doc.department))}</td>
      <td>${formatDate(doc.issued)}</td>
      <td>${formatDate(doc.expires)}</td>
      <td>${statusPill(getStatus(doc.expires))}</td>
      <td>
        <div class="actions">
          ${
            doc.pdfData
              ? `<button class="action-btn" data-action="view" data-id="${doc.id}">Lihat PDF</button>`
              : `<button class="action-btn" disabled title="Tidak ada PDF">PDF -</button>`
          }

          <button
            class="action-btn delete"
            data-action="delete-doc"
            data-id="${doc.id}">
            Hapus
          </button>
        </div>
      </td>
    </tr>
  `).join("");

  byId("documentsEmpty").classList.toggle(
    "hidden",
    docs.length > 0
  );
}

/* DAFTAR PROGRAM */

function renderPrograms() {
  byId("programCountLabel").textContent =
    `Menampilkan ${data.programs.length} program.`;

  byId("programList").innerHTML = data.programs.map((item, i) => `
    <tr>
      <td>${i + 1}</td>
      <td><strong>${escapeHTML(item.name)}</strong></td>
      <td>${escapeHTML(item.notes || "-")}</td>
      <td>
        <span class="mini-status ${
          item.status === "Aktif" ? "is-active" : "is-inactive"
        }">
          ${escapeHTML(item.status)}
        </span>
      </td>
      <td>
        <button
          class="action-btn delete"
          data-action="delete-program"
          data-id="${item.id}">
          Hapus
        </button>
      </td>
    </tr>
  `).join("");

  byId("programEmpty").classList.toggle(
    "hidden",
    data.programs.length > 0
  );
}

/* DAFTAR DEPARTEMEN */

function renderDepartments() {
  byId("departmentCountLabel").textContent =
    `Menampilkan ${data.departments.length} departemen.`;

  byId("departmentList").innerHTML = data.departments.map((item, i) => `
    <tr>
      <td>${i + 1}</td>
      <td><strong>${escapeHTML(item.name)}</strong></td>
      <td>${escapeHTML(item.notes || "-")}</td>
      <td>
        <span class="mini-status ${
          item.status === "Aktif" ? "is-active" : "is-inactive"
        }">
          ${escapeHTML(item.status)}
        </span>
      </td>
      <td>
        <button
          class="action-btn delete"
          data-action="delete-department"
          data-id="${item.id}">
          Hapus
        </button>
      </td>
    </tr>
  `).join("");

  byId("departmentEmpty").classList.toggle(
    "hidden",
    data.departments.length > 0
  );
}

/* RENDER SEMUA DATA */

function renderAll() {
  refreshSelects();
  renderDashboard();
  renderDocuments();
  renderPrograms();
  renderDepartments();
}

/* TOMBOL MODAL */

byId("addBtn").addEventListener("click", () => {
  openModal("modalBackdrop");
});

byId("closeModal").addEventListener("click", () => {
  closeModal("modalBackdrop");
});

byId("cancelModal").addEventListener("click", () => {
  closeModal("modalBackdrop");
});

/* MODAL PROGRAM */

byId("addProgramBtn").addEventListener("click", () => {
  openModal("programModalBackdrop");
});

byId("closeProgramModal").addEventListener("click", () => {
  closeModal("programModalBackdrop");
});

byId("cancelProgramModal").addEventListener("click", () => {
  closeModal("programModalBackdrop");
});

/* MODAL DEPARTEMEN */

byId("addDepartmentBtn").addEventListener("click", () => {
  openModal("departmentModalBackdrop");
});

byId("closeDepartmentModal").addEventListener("click", () => {
  closeModal("departmentModalBackdrop");
});

byId("cancelDepartmentModal").addEventListener("click", () => {
  closeModal("departmentModalBackdrop");
});

/* TUTUP MODAL */

[
  "modalBackdrop",
  "programModalBackdrop",
  "departmentModalBackdrop"
].forEach(id => {
  byId(id).addEventListener("click", event => {
    if (event.target === byId(id)) {
      closeModal(id);
    }
  });
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    [
      "modalBackdrop",
      "programModalBackdrop",
      "departmentModalBackdrop"
    ].forEach(closeModal);
  }
});

/* SIMPAN DOKUMEN */

byId("documentForm").addEventListener("submit", event => {
  event.preventDefault();

  const form = event.currentTarget;
  const fd = new FormData(form);
  const file = fd.get("pdf");

  if (file && file.size > 5 * 1024 * 1024) {
    showToast("Ukuran PDF maksimal 5 MB.");
    return;
  }

  if (file && file.type !== "application/pdf") {
    showToast("File harus berformat PDF.");
    return;
  }

  const saveDocument = pdfData => {
    data.documents.push({
      id: crypto.randomUUID
        ? crypto.randomUUID()
        : String(Date.now()),

      number: fd.get("number").trim(),
      type: fd.get("type"),
      title: fd.get("title").trim(),
      program: fd.get("program"),
      department: fd.get("department"),
      issued: fd.get("issued"),
      expires: fd.get("expires"),
      notes: fd.get("notes").trim(),

      pdfName: file && file.size ? file.name : "",
      pdfData: pdfData || "",
      createdAt: new Date().toISOString()
    });

    saveData();
    renderAll();
    form.reset();
    closeModal("modalBackdrop");

    showToast("Dokumen berhasil disimpan.");
  };

  if (file && file.size) {
    const reader = new FileReader();

    reader.onload = () => {
      saveDocument(reader.result);
    };

    reader.onerror = () => {
      showToast("File PDF gagal dibaca.");
    };

    reader.readAsDataURL(file);
  } else {
    saveDocument("");
  }
});

/* SIMPAN PROGRAM */

byId("programForm").addEventListener("submit", event => {
  event.preventDefault();

  const fd = new FormData(event.currentTarget);
  const name = fd.get("name").trim();

  const duplicate = data.programs.some(
    x => x.name.toLowerCase() === name.toLowerCase()
  );

  if (duplicate) {
    showToast("Nama program sudah tersedia.");
    return;
  }

  data.programs.push({
    id: crypto.randomUUID
      ? crypto.randomUUID()
      : String(Date.now()),

    name: name,
    notes: fd.get("notes").trim(),
    status: fd.get("status")
  });

  saveData();
  event.currentTarget.reset();
  closeModal("programModalBackdrop");
  renderAll();

  showToast("Program berhasil ditambahkan.");
});

/* SIMPAN DEPARTEMEN */

byId("departmentForm").addEventListener("submit", event => {
  event.preventDefault();

  const fd = new FormData(event.currentTarget);
  const name = fd.get("name").trim();

  const duplicate = data.departments.some(
    x => x.name.toLowerCase() === name.toLowerCase()
  );

  if (duplicate) {
    showToast("Nama departemen sudah tersedia.");
    return;
  }

  data.departments.push({
    id: crypto.randomUUID
      ? crypto.randomUUID()
      : String(Date.now()),

    name: name,
    notes: fd.get("notes").trim(),
    status: fd.get("status")
  });

  saveData();
  event.currentTarget.reset();
  closeModal("departmentModalBackdrop");
  renderAll();

  showToast("Departemen berhasil ditambahkan.");
});

/* AKSI TABEL */

document.addEventListener("click", event => {
  const button = event.target.closest("[data-action]");

  if (!button) return;

  const { action, id } = button.dataset;

  /* LIHAT PDF */
  if (action === "view") {
    const doc = data.documents.find(x => x.id === id);

    if (doc?.pdfData) {
      const win = window.open();

      if (win) {
        win.document.write(`
          <title>${escapeHTML(doc.pdfName || "Dokumen PDF")}</title>
          <iframe
            src="${doc.pdfData}"
            style="border:0;width:100%;height:100vh">
          </iframe>
        `);

        win.document.close();
      } else {
        showToast("Izinkan pop-up browser untuk melihat PDF.");
      }
    }
  }

  /* HAPUS DOKUMEN */
  if (
    action === "delete-doc" &&
    confirm("Hapus dokumen ini?")
  ) {
    data.documents = data.documents.filter(
      x => x.id !== id
    );

    saveData();
    renderAll();

    showToast("Dokumen berhasil dihapus.");
  }

  /* HAPUS PROGRAM */
  if (
    action === "delete-program" &&
    confirm("Hapus program ini? Dokumen terkait akan tetap tersimpan.")
  ) {
    data.programs = data.programs.filter(
      x => x.id !== id
    );

    saveData();
    renderAll();

    showToast("Program berhasil dihapus.");
  }

  /* HAPUS DEPARTEMEN */
  if (
    action === "delete-department" &&
    confirm("Hapus departemen ini? Dokumen terkait akan tetap tersimpan.")
  ) {
    data.departments = data.departments.filter(
      x => x.id !== id
    );

    saveData();
    renderAll();

    showToast("Departemen berhasil dihapus.");
  }
});

/* PENCARIAN DAN FILTER */

["searchInput", "statusFilter", "typeFilter"].forEach(id => {
  byId(id).addEventListener(
    id === "searchInput" ? "input" : "change",
    renderDocuments
  );
});

/* NAVIGASI */

byId("viewAllBtn").addEventListener("click", () => {
  showPage("dokumen");
});

document.querySelectorAll(".menu-link").forEach(btn => {
  btn.addEventListener("click", () => {
    showPage(btn.dataset.page);
  });
});

byId("mobileMenu").addEventListener("click", () => {
  byId("sidebar").classList.toggle("open");
});

/* KELUAR */

byId("logoutBtn").addEventListener("click", () => {
  if (confirm("Keluar dari halaman demo Arsip IA / SK?")) {
    showToast("Ini merupakan demo statis, tidak ada sesi login yang aktif.");
  }
});

/* EKSPOR CSV */

byId("exportBtn").addEventListener("click", () => {
  const headers = [
    "Nomor IA/SK",
    "Judul Dokumen",
    "Jenis",
    "Program",
    "Departemen",
    "Tanggal Terbit",
    "Berlaku Sampai",
    "Status",
    "Keterangan"
  ];

  const rows = data.documents.map(doc => [
    doc.number,
    doc.title,
    doc.type,
    programName(doc.program),
    departmentName(doc.department),
    doc.issued,
    doc.expires,
    getStatus(doc.expires),
    doc.notes
  ]);

  const csv = [headers, ...rows]
    .map(row =>
      row.map(value =>
        `"${String(value ?? "").replace(/"/g, '""')}"`
      ).join(";")
    )
    .join("\r\n");

  const blob = new Blob(
    ["\uFEFF" + csv],
    { type: "text/csv;charset=utf-8;" }
  );

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");

  a.href = url;
  a.download = "data_arsip_ia_sk.csv";
  a.click();

  URL.revokeObjectURL(url);

  showToast("File CSV berhasil diekspor.");
});

/* JALANKAN APLIKASI */

renderAll();
showPage("beranda");
