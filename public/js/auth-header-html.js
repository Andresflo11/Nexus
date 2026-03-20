// Inyecta el botón de sesión y todos los modales de auth en cualquier página
(function() {
    // Botón de sesión — se inserta en el header
    const btnHTML = `
    <div style="position:relative" id="user-menu-wrap">
        <button class="cta-btn" id="btn-login-topbar">Iniciar sesión</button>
        <div id="user-dropdown" style="display:none;position:absolute;top:calc(100% + 8px);right:0;background:var(--surface);border:1px solid var(--border);border-radius:10px;min-width:170px;overflow:hidden;z-index:999;box-shadow:0 8px 24px rgba(0,0,0,0.4)">
        <div id="user-dropdown-dashboard" style="display:none">
                <a href="/dashboard.html" style="width:100%;padding:0.65rem 1rem;background:none;border:none;color:var(--text);cursor:pointer;text-align:left;font-size:0.85rem;display:flex;align-items:center;gap:0.5rem;text-decoration:none;box-sizing:border-box" onmouseover="this.style.background='var(--border)'" onmouseout="this.style.background='none'">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
                    Dashboard
                </a>
                <div style="height:1px;background:var(--border)"></div>
            </div>
            <div id="user-dropdown-admin" style="display:none">
                <button onclick="abrirModalUsuarios()" style="width:100%;padding:0.65rem 1rem;background:none;border:none;color:var(--text);cursor:pointer;text-align:left;font-size:0.85rem;display:flex;align-items:center;gap:0.5rem" onmouseover="this.style.background='var(--border)'" onmouseout="this.style.background='none'">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                    Gestionar usuarios
                </button>
                <div style="height:1px;background:var(--border)"></div>
            </div>
            
            <button onclick="confirmarCerrarSesion()" style="width:100%;padding:0.65rem 1rem;background:none;border:none;color:#ef4444;cursor:pointer;text-align:left;font-size:0.85rem;display:flex;align-items:center;gap:0.5rem" onmouseover="this.style.background='var(--border)'" onmouseout="this.style.background='none'">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                Cerrar sesión
            </button>
        </div>
    </div>`;

    const modalesHTML = `
    <!-- Modal Auth -->
    <div class="modal-overlay oculto" id="modal-auth">
      <div class="modal-expandido-inner" style="max-width:420px;overflow-y:auto">
        <div style="padding:2rem">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.5rem">
            <div id="auth-titulo" style="font-family:'Bebas Neue',cursive;font-size:1.4rem;letter-spacing:2px">INICIAR SESIÓN</div>
            <button onclick="cerrarModalAuth()" class="close-btn">✕</button>
          </div>
          <div id="auth-error" style="display:none;color:#ef4444;font-size:0.8rem;margin-bottom:1rem;padding:0.5rem 0.75rem;background:#ef444415;border-radius:6px;border:1px solid #ef444430"></div>
          <div id="auth-form-login">
            <div style="margin-bottom:1rem">
              <label style="display:block;font-size:0.75rem;color:var(--muted);margin-bottom:0.4rem">USUARIO</label>
              <input id="auth-username" type="text" placeholder="Tu usuario" style="width:100%;background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:0.6rem 0.8rem;color:var(--text);font-size:0.9rem;box-sizing:border-box">
            </div>
            <div style="margin-bottom:1.5rem">
              <label style="display:block;font-size:0.75rem;color:var(--muted);margin-bottom:0.4rem">CONTRASEÑA</label>
              <input id="auth-password" type="password" placeholder="Tu contraseña" style="width:100%;background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:0.6rem 0.8rem;color:var(--text);font-size:0.9rem;box-sizing:border-box">
            </div>
            <button onclick="hacerLogin()" style="width:100%;padding:0.75rem;background:var(--accent);color:#000;font-weight:700;border:none;border-radius:8px;cursor:pointer;font-size:0.95rem;margin-bottom:1rem">Entrar</button>
            <div style="text-align:center;font-size:0.82rem;color:var(--muted)">¿No tienes cuenta? <button onclick="mostrarRegistro()" style="background:none;border:none;color:var(--accent);cursor:pointer;font-size:0.82rem;padding:0;text-decoration:underline">Regístrate</button></div>
          </div>
          <div id="auth-form-registro" style="display:none">
            <div style="margin-bottom:1rem">
              <label style="display:block;font-size:0.75rem;color:var(--muted);margin-bottom:0.4rem">USUARIO</label>
              <input id="reg-username" type="text" placeholder="Elige un usuario" style="width:100%;background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:0.6rem 0.8rem;color:var(--text);font-size:0.9rem;box-sizing:border-box">
            </div>
            <div style="margin-bottom:1.5rem">
              <label style="display:block;font-size:0.75rem;color:var(--muted);margin-bottom:0.4rem">CONTRASEÑA</label>
              <input id="reg-password" type="password" placeholder="Elige una contraseña" style="width:100%;background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:0.6rem 0.8rem;color:var(--text);font-size:0.9rem;box-sizing:border-box">
            </div>
            <button onclick="hacerRegistro()" style="width:100%;padding:0.75rem;background:var(--accent);color:#000;font-weight:700;border:none;border-radius:8px;cursor:pointer;font-size:0.95rem;margin-bottom:1rem">Crear cuenta</button>
            <div style="text-align:center;font-size:0.82rem;color:var(--muted)">¿Ya tienes cuenta? <button onclick="mostrarLogin()" style="background:none;border:none;color:var(--accent);cursor:pointer;font-size:0.82rem;padding:0;text-decoration:underline">Iniciar sesión</button></div>
          </div>
        </div>
      </div>
    </div>
    <!-- Modal cerrar sesión -->
    <div class="modal-overlay oculto" id="modal-cerrar-sesion">
      <div class="modal-expandido-inner" style="max-width:360px">
        <div style="padding:2rem;text-align:center">
          <div style="width:48px;height:48px;border-radius:50%;background:#ef444420;border:1px solid #ef444440;display:flex;align-items:center;justify-content:center;margin:0 auto 1rem">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          </div>
          <div style="font-family:'Bebas Neue',cursive;font-size:1.3rem;letter-spacing:2px;margin-bottom:0.5rem">CERRAR SESIÓN</div>
          <div id="cerrar-sesion-msg" style="font-size:0.85rem;color:var(--muted);margin-bottom:1.5rem"></div>
          <div style="display:flex;gap:0.75rem">
            <button onclick="cerrarModalCerrarSesion()" style="flex:1;padding:0.65rem;background:var(--surface);border:1px solid var(--border);border-radius:8px;color:var(--text);cursor:pointer;font-size:0.88rem">Cancelar</button>
            <button onclick="ejecutarCerrarSesion()" style="flex:1;padding:0.65rem;background:#ef444420;border:1px solid #ef444440;border-radius:8px;color:#ef4444;cursor:pointer;font-size:0.88rem;font-weight:600">Cerrar sesión</button>
          </div>
        </div>
      </div>
    </div>
    <!-- Modal gestión usuarios -->
    <div class="modal-overlay oculto" id="modal-usuarios">
      <div class="modal-expandido-inner" style="max-width:480px;overflow-y:auto;max-height:85vh">
        <div style="padding:2rem">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.5rem">
            <div style="font-family:'Bebas Neue',cursive;font-size:1.4rem;letter-spacing:2px">USUARIOS REGISTRADOS</div>
            <button onclick="cerrarModalUsuarios()" class="close-btn">✕</button>
          </div>
          <div id="lista-usuarios" style="display:flex;flex-direction:column;gap:0.5rem"></div>
        </div>
      </div>
    </div>
    <!-- Modal confirmar eliminar usuario -->
    <div class="modal-overlay oculto" id="modal-eliminar-usuario">
      <div class="modal-expandido-inner" style="max-width:360px">
        <div style="padding:2rem;text-align:center">
          <div style="width:48px;height:48px;border-radius:50%;background:#ef444420;border:1px solid #ef444440;display:flex;align-items:center;justify-content:center;margin:0 auto 1rem">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>
          </div>
          <div style="font-family:'Bebas Neue',cursive;font-size:1.3rem;letter-spacing:2px;margin-bottom:0.5rem">ELIMINAR USUARIO</div>
          <div id="eliminar-usuario-msg" style="font-size:0.85rem;color:var(--muted);margin-bottom:1.5rem"></div>
          <div style="display:flex;gap:0.75rem">
            <button onclick="cerrarModalEliminarUsuario()" style="flex:1;padding:0.65rem;background:var(--surface);border:1px solid var(--border);border-radius:8px;color:var(--text);cursor:pointer;font-size:0.88rem">Cancelar</button>
            <button onclick="ejecutarEliminarUsuario()" style="flex:1;padding:0.65rem;background:#ef444420;border:1px solid #ef444440;border-radius:8px;color:#ef4444;cursor:pointer;font-size:0.88rem;font-weight:600">Eliminar</button>
          </div>
        </div>
      </div>
    </div>`;

    // Insertar botón en el header o en la topbar del index
    const contenedor = document.querySelector("header") || document.querySelector(".home-topbar");
    if (contenedor) {
        const div = document.createElement("div");
        div.innerHTML = btnHTML;
        contenedor.appendChild(div.firstElementChild);
    }

    // Insertar modales al final del body
    document.body.insertAdjacentHTML("beforeend", modalesHTML);

    // Llamar actualizarBtnSesion ahora que el HTML ya está en el DOM
    if (typeof actualizarBtnSesion === "function") actualizarBtnSesion();
})();