// ╔══════════════════════════════════════════════════════════╗
// ║  auth-header.js — Botón de sesión compartido            ║
// ║  Se incluye en todas las páginas que tienen header      ║
// ╚══════════════════════════════════════════════════════════╝

function getSesion() {
    try { return JSON.parse(sessionStorage.getItem("nexus_user")); } catch { return null; }
}
function setSesion(user) {
    sessionStorage.setItem("nexus_user", JSON.stringify(user));
}

function actualizarBtnSesion() {
    const user     = getSesion();
    const btn      = document.getElementById("btn-login-topbar");
    const dropdown = document.getElementById("user-dropdown");
    const adminRow = document.getElementById("user-dropdown-admin");
    const dashRow  = document.getElementById("user-dropdown-dashboard");
    if (!btn) return;
    if (user) {
        btn.textContent = user.username;
        btn.onclick = (e) => toggleDropdown(e);
        if (adminRow) adminRow.style.display = user.rol === "admin" ? "block" : "none";
        if (dashRow)  dashRow.style.display  = "block";
    } else {
        btn.textContent = "Iniciar sesión";
        btn.onclick = abrirModalAuth;
        if (dropdown) dropdown.style.display = "none";
        if (dashRow)  dashRow.style.display  = "none";
    }
}

function toggleDropdown(e) {
    e.stopPropagation();
    const dd = document.getElementById("user-dropdown");
    if (!dd) return;
    dd.style.display = dd.style.display === "block" ? "none" : "block";
}

document.addEventListener("click", (e) => {
    const wrap = document.getElementById("user-menu-wrap");
    const dd   = document.getElementById("user-dropdown");
    if (dd && wrap && !wrap.contains(e.target)) dd.style.display = "none";
});

function confirmarCerrarSesion() {
    document.getElementById("user-dropdown").style.display = "none";
    const user = getSesion();
    document.getElementById("cerrar-sesion-msg").textContent = `¿Quieres cerrar sesión como ${user?.username}?`;
    document.getElementById("modal-cerrar-sesion").classList.remove("oculto");
}
function cerrarModalCerrarSesion() {
    document.getElementById("modal-cerrar-sesion").classList.add("oculto");
}
function ejecutarCerrarSesion() {
    sessionStorage.removeItem("nexus_user");
    cerrarModalCerrarSesion();
    window.dispatchEvent(new Event("sesion-cambiada"));
    window.location.href = "/";
}

function abrirModalAuth() {
    document.getElementById("modal-auth").classList.remove("oculto");
    document.getElementById("auth-error").style.display = "none";
    mostrarLoginAuth();
}
function cerrarModalAuth() {
    document.getElementById("modal-auth").classList.add("oculto");
}
function mostrarLoginAuth() {
    document.getElementById("auth-titulo").textContent = "INICIAR SESIÓN";
    document.getElementById("auth-form-login").style.display = "block";
    document.getElementById("auth-form-registro").style.display = "none";
    document.getElementById("auth-error").style.display = "none";
}
function mostrarRegistro() {
    document.getElementById("auth-titulo").textContent = "CREAR CUENTA";
    document.getElementById("auth-form-login").style.display = "none";
    document.getElementById("auth-form-registro").style.display = "block";
    document.getElementById("auth-error").style.display = "none";
}
function mostrarLogin() { mostrarLoginAuth(); }

async function hacerLogin() {
    const username = document.getElementById("auth-username").value.trim();
    const password = document.getElementById("auth-password").value;
    if (!username || !password) return mostrarAuthError("Completa todos los campos");
    try {
        const res  = await fetch("/auth/login", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        if (!res.ok) return mostrarAuthError(data.error || "Usuario o contraseña incorrectos");
        setSesion(data);
        cerrarModalAuth();
        actualizarBtnSesion();
        if (typeof cargarHome === "function") cargarHome();
        if (typeof cargar === "function") cargar();
    } catch { mostrarAuthError("Error de conexión"); }
}

async function hacerRegistro() {
    const username = document.getElementById("reg-username").value.trim();
    const password = document.getElementById("reg-password").value;
    if (!username || !password) return mostrarAuthError("Completa todos los campos");
    try {
        const res  = await fetch("/auth/register", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        if (!res.ok) return mostrarAuthError(data.error || "Error al registrarse");
        setSesion(data);
        cerrarModalAuth();
        actualizarBtnSesion();
        if (typeof cargarHome === "function") cargarHome();
        if (typeof cargar === "function") cargar();
    } catch { mostrarAuthError("Error de conexión"); }
}

function mostrarAuthError(msg) {
    const el = document.getElementById("auth-error");
    el.textContent = msg;
    el.style.display = "block";
}

async function abrirModalUsuarios() {
    document.getElementById("user-dropdown").style.display = "none";
    document.getElementById("modal-usuarios").classList.remove("oculto");
    await cargarListaUsuarios();
}
function cerrarModalUsuarios() {
    document.getElementById("modal-usuarios").classList.add("oculto");
}

async function cargarListaUsuarios() {
    const lista = document.getElementById("lista-usuarios");
    lista.innerHTML = `<div style="color:var(--muted);font-size:0.85rem;padding:0.5rem">Cargando...</div>`;
    try {
        const res   = await fetch("/admin/usuarios");
        const users = await res.json();
        lista.innerHTML = "";
        users.forEach(u => {
            const row = document.createElement("div");
            row.style.cssText = "display:flex;align-items:center;justify-content:space-between;padding:0.65rem 0.85rem;background:var(--surface);border:1px solid var(--border);border-radius:8px";
            row.innerHTML = `
              <div style="display:flex;align-items:center;gap:0.6rem">
                <div style="width:30px;height:30px;border-radius:50%;background:var(--border);display:flex;align-items:center;justify-content:center;font-size:0.8rem;font-weight:700;color:var(--accent)">${u.username[0].toUpperCase()}</div>
                <div>
                  <div style="font-size:0.88rem;font-weight:600">${u.username}</div>
                  <div style="font-size:0.72rem;color:var(--muted)">${u.rol === "admin" ? "👑 Admin" : "👤 Usuario"}</div>
                </div>
              </div>
              ${u.rol !== "admin" ? `
              <button onclick="eliminarUsuario(${u.id}, this)" style="padding:0.3rem 0.65rem;background:#ef444415;border:1px solid #ef444430;color:#ef4444;border-radius:6px;cursor:pointer;font-size:0.78rem"
                onmouseover="this.style.background='#ef444425'" onmouseout="this.style.background='#ef444415'">Eliminar</button>`
              : `<span style="font-size:0.72rem;color:var(--muted);padding:0.3rem 0.65rem">Protegido</span>`}
            `;
            lista.appendChild(row);
        });
        if (!users.length) lista.innerHTML = `<div style="color:var(--muted);font-size:0.85rem;padding:0.5rem">No hay usuarios.</div>`;
    } catch {
        lista.innerHTML = `<div style="color:#ef4444;font-size:0.85rem">Error al cargar usuarios.</div>`;
    }
}

let _eliminarUsuarioId = null, _eliminarUsuarioBtn = null;
function eliminarUsuario(id, btn) {
    _eliminarUsuarioId  = id;
    _eliminarUsuarioBtn = btn;
    const nombre = btn.closest("div[style]").querySelector("div > div")?.textContent?.trim() || "este usuario";
    document.getElementById("eliminar-usuario-msg").textContent = `¿Eliminar a ${nombre}? Se borrará también su dashboard.`;
    document.getElementById("modal-eliminar-usuario").classList.remove("oculto");
}
function cerrarModalEliminarUsuario() {
    document.getElementById("modal-eliminar-usuario").classList.add("oculto");
    _eliminarUsuarioId = null; _eliminarUsuarioBtn = null;
}
async function ejecutarEliminarUsuario() {
    if (!_eliminarUsuarioId) return;
    const id = _eliminarUsuarioId, btn = _eliminarUsuarioBtn;
    cerrarModalEliminarUsuario();
    btn.disabled = true; btn.textContent = "...";
    try {
        const res = await fetch(`/admin/usuarios/${id}`, { method: "DELETE" });
        if (res.ok) btn.closest("div[style]").remove();
        else { btn.disabled = false; btn.textContent = "Eliminar"; }
    } catch { btn.disabled = false; btn.textContent = "Eliminar"; }
}

// actualizarBtnSesion la llama auth-header-html.js tras inyectar el HTML