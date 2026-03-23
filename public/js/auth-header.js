// ╔══════════════════════════════════════════════════════════╗
// ║  auth-header.js — Botón de sesión compartido            ║
// ║  Se incluye en todas las páginas que tienen header      ║
// ╚══════════════════════════════════════════════════════════╝

function getSesion() {
    try {
        return JSON.parse(localStorage.getItem("nexus_user"))
            || JSON.parse(sessionStorage.getItem("nexus_user"));
    } catch { return null; }
}
function setSesion(user, recordar = false) {
    if (recordar) {
        localStorage.setItem("nexus_user", JSON.stringify(user));
        sessionStorage.removeItem("nexus_user");
    } else {
        sessionStorage.setItem("nexus_user", JSON.stringify(user));
        localStorage.removeItem("nexus_user");
    }
}

function actualizarBtnSesion() {
    const user     = getSesion();
    const btn      = document.getElementById("btn-login-topbar");
    const btnAvatar = document.getElementById("btn-login-avatar");
    const dropdown = document.getElementById("user-dropdown");
    const adminRow = document.getElementById("user-dropdown-admin");
    const dashRow  = document.getElementById("user-dropdown-dashboard");
    if (!btn) return;
    if (user) {
        btn.textContent = user.username;
        btn.setAttribute("data-inicial", user.username[0].toUpperCase());
        btn.onclick = (e) => toggleDropdown(e);
        if (adminRow) adminRow.style.display = user.rol === "admin" ? "block" : "none";
        if (dashRow)  dashRow.style.display  = "block";
        // Avatar móvil
        if (btnAvatar) {
            btnAvatar.textContent = user.username[0].toUpperCase();
            btnAvatar.style.display = "none"; // se muestra via CSS en móvil
            btnAvatar.onclick = (e) => toggleDropdown(e);
        }
    } else {
        btn.textContent = "Iniciar sesión";
        btn.setAttribute("data-inicial", "");
        btn.onclick = abrirModalAuth;
        if (dropdown) dropdown.style.display = "none";
        if (dashRow)  dashRow.style.display  = "none";
        if (btnAvatar) {
            btnAvatar.textContent = "?";
            btnAvatar.style.display = "none";
            btnAvatar.onclick = abrirModalAuth;
        }
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
    localStorage.removeItem("nexus_user");
    sessionStorage.removeItem("nexus_user");
    // Señal para otras pestañas
    localStorage.setItem("nexus_logout", Date.now());
    localStorage.removeItem("nexus_logout");
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

    // Enter en cualquier campo del login dispara hacerLogin
    ["auth-username", "auth-password"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.onkeydown = (e) => { if (e.key === "Enter") hacerLogin(); };
    });
}
function mostrarRegistro() {
    document.getElementById("auth-titulo").textContent = "CREAR CUENTA";
    document.getElementById("auth-form-login").style.display = "none";
    document.getElementById("auth-form-registro").style.display = "block";
    document.getElementById("auth-error").style.display = "none";
}
function mostrarLogin() { mostrarLoginAuth(); }

async function hacerLogin() {
    const username  = document.getElementById("auth-username").value.trim();
    const password  = document.getElementById("auth-password").value;
    const recordar  = document.getElementById("auth-recordar")?.checked ?? false;
    if (!username || !password) return mostrarAuthError("Completa todos los campos");
    try {
        const res  = await fetch("/auth/login", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        if (!res.ok) return mostrarAuthError(data.error || "Usuario o contraseña incorrectos");
        setSesion(data, recordar);
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
              ${(() => {
                const sesion   = getSesion();
                const esMismo  = sesion?.id === u.id;
                const esSuperAdmin = sesion?.id === 1;
                if (esMismo) return `<span style="font-size:0.72rem;color:var(--muted);padding:0.3rem 0.65rem">Tú</span>`;
                if (u.rol === "admin") return esSuperAdmin
                    ? `<div style="display:flex;gap:0.4rem">
                        <button onclick="toggleAdminUsuario(${u.id}, 'user', this)" style="padding:0.3rem 0.65rem;background:#f59e0b15;border:1px solid #f59e0b30;color:#f59e0b;border-radius:6px;cursor:pointer;font-size:0.78rem"
                          onmouseover="this.style.background='#f59e0b25'" onmouseout="this.style.background='#f59e0b15'">Quitar admin</button>
                        <button onclick="eliminarUsuario(${u.id}, this)" style="padding:0.3rem 0.65rem;background:#ef444415;border:1px solid #ef444430;color:#ef4444;border-radius:6px;cursor:pointer;font-size:0.78rem"
                          onmouseover="this.style.background='#ef444425'" onmouseout="this.style.background='#ef444415'">Eliminar</button>
                      </div>`
                    : `<span style="font-size:0.72rem;color:var(--muted);padding:0.3rem 0.65rem">👑 Admin</span>`;
                return `
                  <div style="display:flex;gap:0.4rem">
                    <button onclick="toggleAdminUsuario(${u.id}, 'admin', this)" style="padding:0.3rem 0.65rem;background:#7c5cfc15;border:1px solid #7c5cfc30;color:#7c5cfc;border-radius:6px;cursor:pointer;font-size:0.78rem"
                      onmouseover="this.style.background='#7c5cfc25'" onmouseout="this.style.background='#7c5cfc15'">👑 Hacer admin</button>
                    <button onclick="eliminarUsuario(${u.id}, this)" style="padding:0.3rem 0.65rem;background:#ef444415;border:1px solid #ef444430;color:#ef4444;border-radius:6px;cursor:pointer;font-size:0.78rem"
                      onmouseover="this.style.background='#ef444425'" onmouseout="this.style.background='#ef444415'">Eliminar</button>
                  </div>`;
              })()}
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
        const sesion = getSesion();
        const res = await fetch(`/admin/usuarios/${id}`, {
            method: "DELETE",
            headers: { "x-user-id": sesion?.id ?? "" }
        });
        if (res.ok) btn.closest("div[style]").remove();
        else { btn.disabled = false; btn.textContent = "Eliminar"; }
    } catch { btn.disabled = false; btn.textContent = "Eliminar"; }
}

async function toggleAdminUsuario(id, nuevoRol, btn) {
    btn.disabled = true; btn.textContent = "...";
    try {
        const res = await fetch(`/admin/usuarios/${id}/rol`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ rol: nuevoRol })
        });
        if (res.ok) cargarListaUsuarios();
        else { btn.disabled = false; btn.textContent = nuevoRol === "admin" ? "👑 Hacer admin" : "Quitar admin"; }
    } catch { btn.disabled = false; btn.textContent = nuevoRol === "admin" ? "👑 Hacer admin" : "Quitar admin"; }
}

// actualizarBtnSesion la llama auth-header-html.js tras inyectar el HTML

// ── Sincronizar sesión entre pestañas (sin "permanecer conectado") ──
// Cuando se abre una pestaña nueva, pide la sesión a las otras pestañas
if (!getSesion()) {
    localStorage.setItem("nexus_pedir_sesion", Date.now());
    localStorage.removeItem("nexus_pedir_sesion");
}

// Escuchar peticiones de otras pestañas y respuestas
window.addEventListener("storage", (e) => {
    if (e.key === "nexus_pedir_sesion") {
        const sesion = sessionStorage.getItem("nexus_user");
        if (sesion) {
            localStorage.setItem("nexus_sesion_broadcast", sesion);
            localStorage.removeItem("nexus_sesion_broadcast");
        }
        // No hacer nada más — esta pestaña ya tiene sesión
        return;
    }
    if (e.key === "nexus_sesion_broadcast" && e.newValue) {
        // Solo aplicar si esta pestaña NO tiene sesión propia
        if (!sessionStorage.getItem("nexus_user") && !localStorage.getItem("nexus_user")) {
            sessionStorage.setItem("nexus_user", e.newValue);
            actualizarBtnSesion();
            if (typeof cargarHome === "function") cargarHome();
            if (typeof cargar    === "function") cargar();
        }
    }
    if (e.key === "nexus_user" && !e.newValue) {
        sessionStorage.removeItem("nexus_user");
        actualizarBtnSesion();
    }
    // Cierre de sesión desde otra pestaña — redirigir inmediatamente
    if (e.key === "nexus_logout") {
        sessionStorage.removeItem("nexus_user");
        window.location.href = "/";
    }
});

(function() {
    const paginasProtegidas = ["/dashboard.html", "/pages/categoria.html", "/pages/item.html"];
    const esProtegida = paginasProtegidas.some(p => window.location.pathname.startsWith(p));
    if (!esProtegida) return;

    // Si ya hay sesión, continuar normal
    if (getSesion()) {
        instalarFetchGuard();
        return;
    }

    // Sin sesión — esperar brevemente por el broadcast de otra pestaña
    const timeout = setTimeout(() => {
        // Pasado el tiempo, si aún no hay sesión, redirigir
        if (!getSesion()) window.location.href = "/";
    }, 400);

    // Si llega la sesión antes del timeout (via broadcast), cancelar la redirección
    window.addEventListener("storage", function onSesion(e) {
        if (e.key === "nexus_sesion_broadcast" && e.newValue) {
            clearTimeout(timeout);
            window.removeEventListener("storage", onSesion);
            instalarFetchGuard();
        }
    });

    function instalarFetchGuard() {
        const _fetchOriginal = window.fetch;
        window.fetch = function(...args) {
            if (!getSesion()) {
                window.location.href = "/";
                return Promise.reject(new Error("Sin sesión"));
            }
            return _fetchOriginal.apply(this, args);
        };
    }
})();

function abrirModalCuenta() {
    const sesion = getSesion();
    if (!sesion) return;
    document.getElementById("cuenta-username").value  = sesion.username;
    // Botón borrar solo visible para usuarios normales (no admins)
    const wrapBorrar = document.getElementById("cuenta-btn-borrar-wrap");
    if (wrapBorrar) wrapBorrar.style.display = sesion.rol === "admin" ? "none" : "block";
    document.getElementById("cuenta-pass-actual").value  = "";
    document.getElementById("cuenta-pass-nueva").value   = "";
    document.getElementById("cuenta-pass-confirm").value = "";
    document.getElementById("cuenta-error").style.display = "none";
    document.getElementById("cuenta-ok").style.display    = "none";
    document.getElementById("modal-cuenta").classList.remove("oculto");
    document.getElementById("user-dropdown").style.display = "none";
}
function cerrarModalCuenta() {
    document.getElementById("modal-cuenta").classList.add("oculto");
}
async function guardarCuenta() {
    const sesion      = getSesion();
    if (!sesion) return;
    const errorEl     = document.getElementById("cuenta-error");
    const okEl        = document.getElementById("cuenta-ok");
    const username    = document.getElementById("cuenta-username").value.trim();
    const passActual  = document.getElementById("cuenta-pass-actual").value;
    const passNueva   = document.getElementById("cuenta-pass-nueva").value;
    const passConfirm = document.getElementById("cuenta-pass-confirm").value;

    errorEl.style.display = "none";
    okEl.style.display    = "none";

    if (!username) { errorEl.textContent = "El nombre de usuario no puede estar vacío."; errorEl.style.display = "block"; return; }

    // Validar contraseña solo si quiere cambiarla
    if (passNueva || passConfirm) {
        if (!passActual) { errorEl.textContent = "Debes introducir tu contraseña actual."; errorEl.style.display = "block"; return; }
        if (passNueva !== passConfirm) { errorEl.textContent = "Las contraseñas nuevas no coinciden."; errorEl.style.display = "block"; return; }
        if (passNueva.length < 4) { errorEl.textContent = "La nueva contraseña debe tener al menos 4 caracteres."; errorEl.style.display = "block"; return; }
    }

    try {
        const body = { username };
        if (passNueva) { body.passwordActual = passActual; body.passwordNueva = passNueva; }

        const res  = await fetch(`/auth/cuenta/${sesion.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });
        const data = await res.json();
        if (!res.ok) { errorEl.textContent = data.error ?? "Error al guardar."; errorEl.style.display = "block"; return; }

        // Actualizar sesión local con el nuevo username
        const nuevaSesion = { ...sesion, username };
        setSesion(nuevaSesion, !!localStorage.getItem("nexus_user"));
        actualizarBtnSesion();
        okEl.textContent   = "Cambios guardados correctamente.";
        okEl.style.display = "block";
        document.getElementById("cuenta-pass-actual").value  = "";
        document.getElementById("cuenta-pass-nueva").value   = "";
        document.getElementById("cuenta-pass-confirm").value = "";
    } catch { errorEl.textContent = "Error de conexión."; errorEl.style.display = "block"; }
}

function confirmarBorrarCuenta() {
    document.getElementById("borrar-cuenta-pass").value = "";
    document.getElementById("borrar-cuenta-error").style.display = "none";
    document.getElementById("modal-borrar-cuenta").classList.remove("oculto");
}
function cerrarModalBorrarCuenta() {
    document.getElementById("modal-borrar-cuenta").classList.add("oculto");
}
async function ejecutarBorrarCuenta() {
    const sesion   = getSesion();
    if (!sesion) return;
    const pass     = document.getElementById("borrar-cuenta-pass").value;
    const errorEl  = document.getElementById("borrar-cuenta-error");
    errorEl.style.display = "none";
    if (!pass) { errorEl.textContent = "Introduce tu contraseña para confirmar."; errorEl.style.display = "block"; return; }

    try {
        const res  = await fetch(`/auth/cuenta/${sesion.id}`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ password: pass })
        });
        const data = await res.json();
        if (!res.ok) { errorEl.textContent = data.error ?? "Error al eliminar."; errorEl.style.display = "block"; return; }
        // Cerrar sesión y redirigir
        localStorage.removeItem("nexus_user");
        sessionStorage.removeItem("nexus_user");
        localStorage.setItem("nexus_logout", Date.now());
        localStorage.removeItem("nexus_logout");
        window.location.href = "/";
    } catch { errorEl.textContent = "Error de conexión."; errorEl.style.display = "block"; }
}