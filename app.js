
if (sessionStorage.getItem("arsipDemoLogin") !== "true") {
  window.location.replace("login.html");
}

const $ = id => document.getElementById(id);

const STORAGE_KEY = "arsip_ia_sk_demo_v1";
const PROGRAM_KEY = "arsip_demo_programs";
const DEPARTMENT_KEY = "arsip_demo_departments";

let docs = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null") || [
  {
    id: 1,
    number: "001/IA/2026",
    title: "Implementasi Kerja Sama Akademik",
    type: "IA",
    program: "Informatika",
    department: "Departemen Akademik",
    issued: "2026-01-15",
    expires: "2027-01-15",
    notes: "",
    fileName: ""
  },
  {
    id: 2,
    number: "012/SK/2025",
    title: "Penetapan Tim Pengelola Dokumen",
    type: "SK",
    program: "Administrasi",
    department: "Departemen Umum",
    issued: "2025-11-20",
    expires: "2026-11-10",
    notes: "",
    fileName: ""
  },
  {
    id: 3,
    number: "004/IA/2024",
    title: "Perjanjian Kerja Sama Institusi",
    type: "IA",
    program: "Manajemen",
    department: "Departemen Kerja Sama",
    issued: "2024-05-01",
    expires: "2026-05-01",
    notes: "",
    fileName: ""
  }
];

let programs = JSON.parse(localStorage.getItem(PROGRAM_KEY) || "null") || [
  { name: "Admin", notes: "-", active: true },
  { name: "Dealer Support", notes: "-", active: true },
  { name: "Quality Control", notes: "-", active: true }
];

let departments = JSON.parse(localStorage.getItem(DEPARTMENT_KEY) || "null") || [
  { name: "Testing", notes: "-", active: true },
  { name: "Finance", notes: "-", active: true },
  { name: "QC", notes: "-", active: true },
  { name: "Sales", notes: "-", active: true }
];

const sessionFiles = {};

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(docs));
}

function saveGroups() {
  localStorage.setItem(PROGRAM_KEY, JSON.stringify(programs));
  localStorage.setItem(DEPARTMENT_KEY, JSON.stringify(departments));
}

function safe(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function dateText(value) {
  if (!value) return "—";

  const date = new Date(value + "T00:00:00");

  if (isNaN(date)) return "—";

  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

function statusOf(doc) {
  if (!doc.expires) return "Aktif";

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expiry = new Date(doc.expires + "T00:00:00");

  if (expiry < today) return "Tidak Aktif";

  const difference = Math.ceil(
    (expiry - today) / 86400000
  );

  return difference <= 30 ? "Akan Berakhir" : "Aktif";
}

function pill(status) {
  const cls = status === "Aktif"
    ? "active"
    : status === "Akan Berakhir"
      ? "soon"
      : "inactive";

  return `<span class="pill ${cls}">${status}</span>`;
}

function rowHtml(doc, index, withActions = false) {
  return `
    <tr>
      <td>${index + 1}</td>
      <td><span class="doc-number">${safe(doc.number)}</span></td>
      <td>${safe(doc.title)}</td>
      <td>${safe(doc.type)}</td>
      <td>${safe(doc.program)}</td>
      <td>${safe(doc.department)}</td>
      ${withActions ? `<td>${dateText(doc.issued)}</td>` : ""}
      <td>${dateText(doc.expires)}</td>
      <td>${pill(statusOf(doc))}</td>
      ${withActions ? `
        <td>
          <div class="actions">
            ${sessionFiles[doc.id] ? `
              <button class="action-btn"
                data-action="pdf" data-id="${doc.id}">PDF</button>
            ` : ""}
            <button class="action-btn delete"
              data-action="delete" data-id="${doc.id}">Hapus</button>
          </div>
        </td>
      ` : ""}
    </tr>
  `;
}

function render() {
  const active = docs.filter(d => statusOf(d) === "Aktif").length;
  const soon = docs.filter(d => statusOf(d) === "Akan Berakhir").length;
  const inactive = docs.filter(d => statusOf(d) === "Tidak Aktif").length;

  $("totalCount").textContent = docs.length;
  $("activeCount").textContent = active;
  $("soonCount").textContent = soon;
  $("inactiveCount").textContent = inactive;

  const latest = [...docs]
    .sort((a, b) => b.id - a.id)
    .slice(0, 10);

  $("recentRows").innerHTML = latest
    .map((doc, index) => rowHtml(doc, index))
    .join("");

  $("recentEmpty").classList.toggle("hidden", latest.length > 0);

  renderDocuments();
  renderGroups();
}

function renderDocuments() {
  const query = $("searchInput").value.trim().toLowerCase();
  const status = $("statusFilter").value;
  const type = $("typeFilter").value;

  const filtered = docs.filter(doc => {
    const matchesQuery = !query || [
      doc.number,
      doc.title,
      doc.program,
      doc.department
    ].some(value => String(value).toLowerCase().includes(query));

    return matchesQuery &&
      (!status || statusOf(doc) === status) &&
      (!type || doc.type === type);
  }).sort((a, b) => b.id - a.id);

  $("documentRows").innerHTML = filtered
    .map((doc, index) => rowHtml(doc, index, true))
    .join("");

  $("documentsEmpty").classList.toggle("hidden", filtered.length > 0);
}

function renderGroups() {
  renderGroupTable(
    programs,
    "programList",
    "programCountLabel",
    "programEmpty",
    "program"
  );

  renderGroupTable(
    departments,
    "departmentList",
    "departmentCountLabel",
    "departmentEmpty",
    "department"
  );
}

function renderGroupTable(list, tbodyId, countId, emptyId, type) {
  const label = type === "program" ? "program" : "departemen";

  $(countId).textContent = `Menampilkan ${list.length} ${label}.`;

  $(tbodyId).innerHTML = list.map((item, index) => `
    <tr>
      <td>${index + 1}</td>
      <td><strong>${safe(item.name)}</strong></td>
      <td>${safe(item.notes || "-")}</td>
      <td>
        <span class="mini-status ${item.active ? "is-active" : "is-inactive"}">
          ${item.active ? "aktif" : "tidak aktif"}
        </span>
      </td>
      <td>
        <div class="actions">
          <button class="action-btn edit"
            data-group-action="edit"
            data-group="${type}"
            data-index="${index}"
            title="Edit">✎</button>
          <button class="action-btn delete"
            data-group-action="delete"
            data-group="${type}"
            data-index="${index}"
            title="Hapus">▤</button>
        </div>
      </td>
    </tr>
  `).join("");

  $(emptyId).classList.toggle("hidden", list.length > 0);
}

function showPage(page) {
  const pages = {
    beranda: "dashboardPage",
    dokumen: "documentsPage",
    program: "programPage",
    departemen: "departemenPage"
  };

  Object.entries(pages).forEach(([key, id]) => {
    $(id).classList.toggle("hidden", key !== page);
  });

  document.querySelectorAll(".menu-link").forEach(button => {
    button.classList.toggle("active", button.dataset.page === page);
  });

  const names = {
    beranda: [
      "Beranda",
      "Selamat datang, Administrator",
      "Berikut ringkasan pengelolaan dokumen IA / SK."
    ],
    dokumen: [
      "Data IA / SK",
      "Data Dokumen IA / SK",
      "Cari dan kelola arsip dokumen IA / SK."
    ],
    program: [
      "Program",
      "Program",
      "Kelola data program yang digunakan dalam dokumen IA / SK."
    ],
    departemen: [
      "Departemen",
      "Departemen",
      "Kelola data departemen yang digunakan dalam dokumen IA / SK."
    ]
  };

  $("topTitle").textContent = names[page][0];
  $("pageTitle").textContent = names[page][1];
  $("pageDesc").textContent = names[page][2];

  $("addBtn").classList.toggle(
    "hidden",
    page === "program" || page === "departemen"
  );

  $("sidebar").classList.remove("open");
}

function openModal() {
  $("modalBackdrop").classList.remove("hidden");
}

function closeModal() {
  $("modalBackdrop").classList.add("hidden");
  $("documentForm").reset();
}

function toast(message) {
  $("toast").textContent = message;
  $("toast").classList.remove("hidden");

  setTimeout(() => {
    $("toast").classList.add("hidden");
  }, 2600);
}

/* Navigasi */
document.querySelectorAll(".menu-link").forEach(button => {
  button.addEventListener("click", () => showPage(button.dataset.page));
});

$("mobileMenu").addEventListener("click", () => {
  $("sidebar").classList.toggle("open");
});

$("viewAllBtn").addEventListener("click", () => showPage("dokumen"));

$("addBtn").addEventListener("click", openModal);
$("closeModal").addEventListener("click", closeModal);
$("cancelModal").addEventListener("click", closeModal);

$("modalBackdrop").addEventListener("click", event => {
  if (event.target === $("modalBackdrop")) closeModal();
});

["searchInput", "statusFilter", "typeFilter"].forEach(id => {
  $(id).addEventListener("input", renderDocuments);
});

/* Tambah dokumen */
$("documentForm").addEventListener("submit", event => {
  event.preventDefault();

  const form = event.currentTarget;
  const data = new FormData(form);
  const file = form.elements.pdf.files[0];
  const id = Date.now();

  if (file && file.type !== "application/pdf") {
    alert("Silakan pilih file PDF.");
    return;
  }

  const doc = {
    id,
    number: data.get("number").trim(),
    type: data.get("type"),
    title: data.get("title").trim(),
    program: data.get("program").trim(),
    department: data.get("department").trim(),
    issued: data.get("issued"),
    expires: data.get("expires"),
    notes: data.get("notes").trim(),
    fileName: file ? file.name : ""
  };

  docs.push(doc);
  save();

  if (file) {
    sessionFiles[id] = URL.createObjectURL(file);
  }

  closeModal();
  render();
  showPage("dokumen");
  toast("Dokumen berhasil ditambahkan.");
});

/* Hapus dokumen dan buka PDF */
document.addEventListener("click", event => {
  const button = event.target.closest("[data-action]");
  if (!button) return;

  const id = Number(button.dataset.id);
  const doc = docs.find(item => item.id === id);

  if (!doc) return;

  if (button.dataset.action === "delete") {
    if (confirm(`Hapus dokumen "${doc.title}"?`)) {
      docs = docs.filter(item => item.id !== id);

      if (sessionFiles[id]) {
        URL.revokeObjectURL(sessionFiles[id]);
        delete sessionFiles[id];
      }

      save();
      render();
      toast("Dokumen berhasil dihapus.");
    }
  }

  if (button.dataset.action === "pdf" && sessionFiles[id]) {
    window.open(sessionFiles[id], "_blank", "noopener");
  }
});

/* Ekspor CSV */
$("exportBtn").addEventListener("click", () => {
  const rows = [
    [
      "Nomor IA/SK", "Judul", "Jenis", "Program", "Departemen",
      "Tanggal Terbit", "Berlaku Sampai", "Status", "Keterangan"
    ],
    ...docs.map(doc => [
      doc.number,
      doc.title,
      doc.type,
      doc.program,
      doc.department,
      doc.issued,
      doc.expires,
      statusOf(doc),
      doc.notes || ""
    ])
  ];

  const csv = rows.map(row =>
    row.map(value =>
      `"${String(value ?? "").replace(/"/g, '""')}"`
    ).join(",")
  ).join("\r\n");

  const blob = new Blob(["\ufeff" + csv], {
    type: "text/csv;charset=utf-8;"
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "data-arsip-ia-sk.csv";
  link.click();

  URL.revokeObjectURL(url);
});

/* Tambah Program dan Departemen */
$("addProgramBtn").addEventListener("click", () => addGroup("program"));
$("addDepartmentBtn").addEventListener("click", () => addGroup("department"));

function addGroup(type) {
  const isProgram = type === "program";
  const label = isProgram ? "Program" : "Departemen";
  const list = isProgram ? programs : departments;

  const name = prompt(`Masukkan nama ${label}:`);

  if (!name || !name.trim()) return;

  if (list.some(item =>
    item.name.toLowerCase() === name.trim().toLowerCase()
  )) {
    alert(`${label} tersebut sudah tersedia.`);
    return;
  }

  const notes = prompt("Masukkan keterangan:", "-");
  if (notes === null) return;

  list.push({
    name: name.trim(),
    notes: notes.trim() || "-",
    active: true
  });

  saveGroups();
  renderGroups();
  toast(`${label} berhasil ditambahkan.`);
}

/* Edit dan hapus Program atau Departemen */
document.addEventListener("click", event => {
  const button = event.target.closest("[data-group-action]");
  if (!button) return;

  const list = button.dataset.group === "program"
    ? programs
    : departments;

  const index = Number(button.dataset.index);
  const item = list[index];

  if (!item) return;

  if (button.dataset.groupAction === "edit") {
    const name = prompt("Nama:", item.name);
    if (!name || !name.trim()) return;

    const notes = prompt("Keterangan:", item.notes || "-");
    if (notes === null) return;

    if (list.some((other, i) =>
      i !== index &&
      other.name.toLowerCase() === name.trim().toLowerCase()
    )) {
      alert("Nama tersebut sudah digunakan.");
      return;
    }

    item.name = name.trim();
    item.notes = notes.trim() || "-";
    item.active = confirm(
      "Klik OK untuk status aktif, atau Batal untuk tidak aktif."
    );

    saveGroups();
    renderGroups();
    toast("Data berhasil diperbarui.");
  }

  if (button.dataset.groupAction === "delete") {
    if (confirm(`Yakin ingin menghapus "${item.name}"?`)) {
      list.splice(index, 1);
      saveGroups();
      renderGroups();
      toast("Data berhasil dihapus.");
    }
  }
});

/* Keluar */
$("logoutBtn").addEventListener("click", () => {
  if (confirm("Apakah Anda yakin ingin keluar?")) {
    sessionStorage.removeItem("arsipDemoLogin");
    window.location.href = "login.html";
  }
});

/* Tampilkan data awal */
saveGroups();
render();
