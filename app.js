
const $ = id => document.getElementById(id);
const STORAGE_KEY = "arsip_ia_sk_demo_v1";

let docs = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null") || [
  {id:1,number:"001/IA/2026",title:"Implementasi Kerja Sama Akademik",type:"IA",program:"Informatika",department:"Departemen Akademik",issued:"2026-01-15",expires:"2027-01-15",notes:""},
  {id:2,number:"012/SK/2025",title:"Penetapan Tim Pengelola Dokumen",type:"SK",program:"Administrasi",department:"Departemen Umum",issued:"2025-11-20",expires:"2026-11-10",notes:""},
  {id:3,number:"004/IA/2024",title:"Perjanjian Kerja Sama Institusi",type:"IA",program:"Manajemen",department:"Departemen Kerja Sama",issued:"2024-05-01",expires:"2026-05-01",notes:""}
];

let sessionFiles = {};

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(docs));
}

function dateText(value) {
  if (!value) return "—";
  const d = new Date(value + "T00:00:00");
  return isNaN(d) ? "—" : d.toLocaleDateString("id-ID", {
    day:"2-digit", month:"short", year:"numeric"
  });
}

function statusOf(doc) {
  if (!doc.expires) return "Aktif";

  const today = new Date();
  today.setHours(0,0,0,0);

  const end = new Date(doc.expires + "T00:00:00");

  if (end < today) return "Tidak Aktif";

  const diff = Math.ceil((end - today) / 86400000);
  return diff <= 30 ? "Akan Berakhir" : "Aktif";
}

function safe(value) {
  return String(value ?? "").replace(/[&<>"']/g, c => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;",
    '"':"&quot;", "'":"&#39;"
  }[c]));
}

function pill(status) {
  const cls = status === "Aktif" ? "active" :
    status === "Akan Berakhir" ? "soon" : "inactive";

  return `<span class="pill ${cls}">${status}</span>`;
}

function rowHtml(d, i, withActions = false) {
  return `<tr>
    <td>${i + 1}</td>
    <td><span class="doc-number">${safe(d.number)}</span></td>
    <td>${safe(d.title)}</td>
    <td>${safe(d.type)}</td>
    <td>${safe(d.program)}</td>
    <td>${safe(d.department)}</td>
    ${withActions ? `<td>${dateText(d.issued)}</td>` : ""}
    <td>${dateText(d.expires)}</td>
    <td>${pill(statusOf(d))}</td>
    ${withActions ? `<td><div class="actions">
      ${d.fileName && sessionFiles[d.id]
        ? `<button class="action-btn" data-action="pdf" data-id="${d.id}">PDF</button>`
        : ""}
      <button class="action-btn delete" data-action="delete" data-id="${d.id}">Hapus</button>
    </div></td>` : ""}
  </tr>`;
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
    .sort((a,b) => b.id - a.id)
    .slice(0,10);

  $("recentRows").innerHTML =
    latest.map((d,i) => rowHtml(d,i)).join("");

  $("recentEmpty").classList.toggle("hidden", latest.length > 0);

  renderDocuments();
  renderGroups();
}

function renderDocuments() {
  const q = $("searchInput").value.trim().toLowerCase();
  const status = $("statusFilter").value;
  const type = $("typeFilter").value;

  const filtered = docs.filter(d =>
    (!q || [d.number,d.title,d.program,d.department]
      .some(v => String(v).toLowerCase().includes(q))) &&
    (!status || statusOf(d) === status) &&
    (!type || d.type === type)
  ).sort((a,b) => b.id - a.id);

  $("documentRows").innerHTML =
    filtered.map((d,i) => rowHtml(d,i,true)).join("");

  $("documentsEmpty").classList.toggle("hidden", filtered.length > 0);
}

function renderGroups() {
  function groups(key, container) {
    const map = {};

    docs.forEach(d => {
      const name = d[key] || "Belum diisi";
      map[name] = (map[name] || 0) + 1;
    });

    const entries = Object.entries(map)
      .sort((a,b) => a[0].localeCompare(b[0]));

    $(container).innerHTML = entries.length
      ? entries.map(([name,count]) =>
        `<div class="simple-row">
          <strong>${safe(name)}</strong>
          <span>${count} dokumen</span>
        </div>`
      ).join("")
      : '<div class="empty-state">Belum ada data.</div>';
  }

  groups("program","programList");
  groups("department","departmentList");
}

function showPage(page) {
  const pages = {
    beranda:"dashboardPage",
    dokumen:"documentsPage",
    program:"programPage",
    departemen:"departemenPage"
  };

  Object.entries(pages).forEach(([key,id]) => {
    $(id).classList.toggle("hidden", key !== page);
  });

  document.querySelectorAll(".menu-link").forEach(button => {
    button.classList.toggle("active", button.dataset.page === page);
  });

  const names = {
    beranda:["Beranda","Selamat datang, Administrator","Berikut ringkasan pengelolaan dokumen IA / SK."],
    dokumen:["Data IA / SK","Data Dokumen IA / SK","Cari dan kelola arsip dokumen IA / SK."],
    program:["Program","Data Program","Ringkasan program yang tercatat dalam dokumen."],
    departemen:["Departemen","Data Departemen","Ringkasan departemen yang tercatat dalam dokumen."]
  };

  $("topTitle").textContent = names[page][0];
  $("pageTitle").textContent = names[page][1];
  $("pageDesc").textContent = names[page][2];

  $("addBtn").classList.toggle(
    "hidden", page === "program" || page === "departemen"
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

// Navigasi halaman
document.querySelectorAll(".menu-link").forEach(button => {
  button.addEventListener("click", () => showPage(button.dataset.page));
});

$("addBtn").addEventListener("click", openModal);
$("closeModal").addEventListener("click", closeModal);
$("cancelModal").addEventListener("click", closeModal);

$("modalBackdrop").addEventListener("click", e => {
  if (e.target === $("modalBackdrop")) closeModal();
});

$("viewAllBtn").addEventListener("click", () => showPage("dokumen"));

$("mobileMenu").addEventListener("click", () => {
  $("sidebar").classList.toggle("open");
});

["searchInput","statusFilter","typeFilter"].forEach(id => {
  $(id).addEventListener("input", renderDocuments);
});

// Tambah dokumen
$("documentForm").addEventListener("submit", e => {
  e.preventDefault();

  const form = e.currentTarget;
  const fd = new FormData(form);
  const file = form.elements.pdf.files[0];
  const id = Date.now();

  const item = {
    id,
    number: fd.get("number").trim(),
    type: fd.get("type"),
    title: fd.get("title").trim(),
    program: fd.get("program").trim(),
    department: fd.get("department").trim(),
    issued: fd.get("issued"),
    expires: fd.get("expires"),
    notes: fd.get("notes").trim(),
    fileName: file ? file.name : ""
  };

  docs.push(item);
  save();

  if (file) {
    sessionFiles[id] = URL.createObjectURL(file);
  }

  closeModal();
  render();
  showPage("dokumen");
  toast("Dokumen berhasil ditambahkan pada browser ini.");
});

// Hapus dokumen dan buka PDF sementara
document.addEventListener("click", e => {
  const button = e.target.closest("[data-action]");
  if (!button) return;

  const id = Number(button.dataset.id);
  const doc = docs.find(d => d.id === id);
  if (!doc) return;

  if (button.dataset.action === "delete") {
    if (confirm(`Hapus dokumen "${doc.title}" dari data browser ini?`)) {
      docs = docs.filter(d => d.id !== id);

      if (sessionFiles[id]) {
        URL.revokeObjectURL(sessionFiles[id]);
        delete sessionFiles[id];
      }

      save();
      render();
      toast("Dokumen dihapus.");
    }
  }

  if (button.dataset.action === "pdf" && sessionFiles[id]) {
    window.open(sessionFiles[id], "_blank", "noopener");
  }
});

// Ekspor CSV
$("exportBtn").addEventListener("click", () => {
  const rows = [
    ["Nomor IA/SK","Judul","Jenis","Program","Departemen",
      "Tanggal Terbit","Berlaku Sampai","Status","Keterangan"],
    ...docs.map(d => [
      d.number,d.title,d.type,d.program,d.department,
      d.issued,d.expires,statusOf(d),d.notes || ""
    ])
  ];

  const csv = rows.map(row =>
    row.map(value =>
      `"${String(value ?? "").replace(/"/g,'""')}"`
    ).join(",")
  ).join("\r\n");

  const blob = new Blob(["\ufeff" + csv], {
    type:"text/csv;charset=utf-8;"
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "data-arsip-ia-sk.csv";
  a.click();

  URL.revokeObjectURL(url);
});

// Tombol keluar demo
$("logoutBtn").addEventListener("click", () => {
  if (confirm("Keluar dari tampilan demo? Data demo tetap tersimpan di browser ini.")) {
    showPage("beranda");
    toast("Anda sedang menggunakan demo statis.");
  }
});

render();
