// ╔══════════════════════════════════════════════════════════╗
// ║  index.js — SERVIDOR PRINCIPAL DE NEXUS (Turso)         ║
// ╠══════════════════════════════════════════════════════════╣
// ║  Backend Node.js con base de datos Turso (SQLite nube)  ║
// ╚══════════════════════════════════════════════════════════╝
require('dotenv').config();
const express          = require('express');
const cors             = require('cors');
const path             = require('path');
const bcrypt           = require('bcrypt');
const { createClient } = require('@libsql/client');
const SALT_ROUNDS      = 10;

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: process.env.ALLOWED_ORIGIN || '*' }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── Base de datos Turso ───────────────────────────────────
const db = createClient({
    url:       process.env.TURSO_URL        || 'file:database.db',
    authToken: process.env.TURSO_AUTH_TOKEN || undefined
});

console.log('TURSO_URL:', process.env.TURSO_URL);
console.log('TOKEN length:', process.env.TURSO_AUTH_TOKEN?.length);

async function dbRun(sql, args = []) { return db.execute({ sql, args }); }
async function dbGet(sql, args = []) {
    const r = await db.execute({ sql, args });
    return r.rows[0] ?? null;
}
async function dbAll(sql, args = []) {
    const r = await db.execute({ sql, args });
    return r.rows;
}

// ── Inicializar tablas ────────────────────────────────────
async function initDB() {
    await dbRun(`CREATE TABLE IF NOT EXISTS items (
        id               INTEGER PRIMARY KEY AUTOINCREMENT,
        tipo             TEXT    NOT NULL,
        titulo           TEXT    NOT NULL,
        estado           TEXT,
        fecha            TEXT,
        imagen           TEXT,
        plataforma       TEXT,
        logros           TEXT,
        dlcs             TEXT,
        temporadas       TEXT,
        progreso         TEXT,
        estadoSerie      TEXT,
        capitulosTotales INTEGER,
        capituloActual   INTEGER,
        paginasTotales   INTEGER,
        paginaActual     INTEGER,
        tomos            TEXT,
        progresoManga    TEXT,
        valoracion       INTEGER DEFAULT 0,
        relacionados     TEXT,
        saga             TEXT,
        ordenPublicacion INTEGER,
        ordenCronologico INTEGER,
        generos          TEXT,
        creador          TEXT,
        anio             INTEGER,
        duracion         TEXT,
        links            TEXT,
        titulos_alt      TEXT
    )`);

    for (const sql of [
        `ALTER TABLE items ADD COLUMN relacionados     TEXT`,
        `ALTER TABLE items ADD COLUMN saga             TEXT`,
        `ALTER TABLE items ADD COLUMN ordenPublicacion INTEGER`,
        `ALTER TABLE items ADD COLUMN ordenCronologico INTEGER`,
        `ALTER TABLE items ADD COLUMN generos          TEXT`,
        `ALTER TABLE items ADD COLUMN creador          TEXT`,
        `ALTER TABLE items ADD COLUMN anio             INTEGER`,
        `ALTER TABLE items ADD COLUMN duracion         TEXT`,
        `ALTER TABLE items ADD COLUMN links            TEXT`,
        `ALTER TABLE items ADD COLUMN titulos_alt      TEXT`,
    ]) { try { await dbRun(sql); } catch (_) {} }

    await dbRun(`CREATE TABLE IF NOT EXISTS usuarios (
        id       INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT    NOT NULL UNIQUE,
        password TEXT    NOT NULL,
        rol      TEXT    NOT NULL DEFAULT 'user'
    )`);

    const adminExiste = await dbGet(`SELECT id FROM usuarios WHERE username = 'admin'`);
    if (!adminExiste) {
        const hash = await bcrypt.hash('admin123', SALT_ROUNDS);
        await dbRun(`INSERT INTO usuarios (username, password, rol) VALUES ('admin', ?, 'admin')`, [hash]);
    }

    await dbRun(`CREATE TABLE IF NOT EXISTS dashboard_usuario (
        id             INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario_id     INTEGER NOT NULL,
        item_id        INTEGER NOT NULL,
        fecha_agregado TEXT,
        dlcs_usuario   TEXT,
        logros_usuario TEXT,
        UNIQUE(usuario_id, item_id),
        FOREIGN KEY(usuario_id) REFERENCES usuarios(id),
        FOREIGN KEY(item_id)    REFERENCES items(id)
    )`);

    for (const sql of [
        `ALTER TABLE dashboard_usuario ADD COLUMN fecha_agregado TEXT`,
        `ALTER TABLE dashboard_usuario ADD COLUMN dlcs_usuario   TEXT`,
        `ALTER TABLE dashboard_usuario ADD COLUMN logros_usuario TEXT`,
    ]) { try { await dbRun(sql); } catch (_) {} }

    await dbRun(`CREATE TABLE IF NOT EXISTS usuario_progreso (
        id             INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario_id     INTEGER NOT NULL,
        item_id        INTEGER NOT NULL,
        estado         TEXT,
        valoracion     INTEGER DEFAULT 0,
        capituloActual INTEGER,
        paginaActual   INTEGER,
        progresoManga  TEXT,
        progreso       TEXT,
        UNIQUE(usuario_id, item_id),
        FOREIGN KEY(usuario_id) REFERENCES usuarios(id),
        FOREIGN KEY(item_id)    REFERENCES items(id)
    )`);

    // Migrar contraseñas planas a bcrypt si las hubiera
    const usuarios = await dbAll(`SELECT id, password FROM usuarios`);
    for (const u of usuarios) {
        if (u.password && !u.password.startsWith('$2b$')) {
            const hash = await bcrypt.hash(u.password, SALT_ROUNDS);
            await dbRun(`UPDATE usuarios SET password = ? WHERE id = ?`, [hash, u.id]);
        }
    }

    console.log('✓ Base de datos lista');
}

// ── Helpers de parseo ─────────────────────────────────────
function parseJSON(str) {
    try { return str ? JSON.parse(str) : null; }
    catch { return null; }
}
function parsearFila(row) {
    if (!row) return null;
    return {
        ...row,
        tomos:         parseJSON(row.tomos),
        progresoManga: parseJSON(row.progresoManga),
        dlcs:          parseJSON(row.dlcs),
        temporadas:    parseJSON(row.temporadas),
        progreso:      parseJSON(row.progreso),
        relacionados:  parseJSON(row.relacionados),
        generos:       parseJSON(row.generos),
        links:         parseJSON(row.links),
        plataforma:    parseJSON(row.plataforma),
        titulos_alt:   parseJSON(row.titulos_alt),
    };
}

// ── Rutas HTML ────────────────────────────────────────────
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
app.get('/categoria', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'pages', 'categoria.html'));
});

// ── API: GET items por lista de IDs (relacionados) ────────
// ⚠️ Esta ruta va ANTES de /items/:tipo para que no la capture
app.get('/items/bulk/:ids', async (req, res) => {
    try {
        const ids = req.params.ids.split(',').map(Number).filter(Boolean);
        if (!ids.length) return res.json([]);
        const ph   = ids.map(() => '?').join(',');
        const rows = await dbAll(`SELECT * FROM items WHERE id IN (${ph})`, ids);
        res.json(rows.map(parsearFila));
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── API: GET todos los items ──────────────────────────────
app.get('/items', async (req, res) => {
    try {
        const search = req.query.search?.trim();
        const rows = search
            ? await dbAll(
                `SELECT * FROM items WHERE titulo LIKE ? OR titulos_alt LIKE ? ORDER BY id DESC`,
                [`%${search}%`, `%${search}%`]
              )
            : await dbAll(`SELECT * FROM items ORDER BY id DESC`);
        res.json(rows.map(parsearFila));
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── API: GET item por ID ──────────────────────────────────
app.get('/items/id/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' });
        const row = await dbGet(`SELECT * FROM items WHERE id = ?`, [id]);
        if (!row) return res.status(404).json({ error: 'No encontrado' });
        res.json(parsearFila(row));
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── API: GET items de una categoría ──────────────────────
app.get('/items/:tipo', async (req, res) => {
    try {
        const { tipo } = req.params;
        if (/^\d+$/.test(tipo)) return res.status(400).json({ error: 'Usa /items?id=N para buscar por ID' });
        const rows = await dbAll(`SELECT * FROM items WHERE tipo = ? ORDER BY id DESC`, [tipo]);
        res.json(rows.map(parsearFila));
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── API: POST — añadir item nuevo ─────────────────────────
app.post('/items', async (req, res) => {
    try {
        const {
            tipo, titulo, estado, fecha, imagen, plataforma,
            logros, temporadas, progreso, estadoSerie,
            capitulosTotales, capituloActual,
            paginasTotales,   paginaActual,
            valoracion, dlcs, tomos, progresoManga,
            saga, ordenPublicacion, ordenCronologico,
            generos, creador, anio, duracion, links, titulos_alt
        } = req.body;

        const sql = `INSERT INTO items
            (tipo, titulo, estado, fecha, imagen, plataforma, logros, temporadas, progreso,
             estadoSerie, capitulosTotales, capituloActual, paginasTotales, paginaActual,
             valoracion, dlcs, tomos, progresoManga,
             saga, ordenPublicacion, ordenCronologico, generos, creador, anio, duracion, links, titulos_alt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

        const result = await dbRun(sql, [
            tipo, titulo, estado, fecha,
            imagen     ?? null,
            plataforma ? JSON.stringify(plataforma) : null,
            logros     ?? null,
            JSON.stringify(temporadas    ?? null),
            JSON.stringify(progreso      ?? null),
            estadoSerie      ?? null,
            capitulosTotales ?? null,
            capituloActual   ?? null,
            paginasTotales   ?? null,
            paginaActual     ?? null,
            valoracion       ?? 0,
            JSON.stringify(dlcs          ?? null),
            JSON.stringify(tomos         ?? null),
            JSON.stringify(progresoManga ?? null),
            saga             ?? null,
            ordenPublicacion ?? null,
            ordenCronologico ?? null,
            JSON.stringify(generos ?? null),
            creador  ?? null,
            anio     ?? null,
            duracion ?? null,
            JSON.stringify(links ?? null),
            JSON.stringify(titulos_alt ?? null)
        ]);
        res.json({ id: Number(result.lastInsertRowid), message: 'Item añadido ✓' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── API: PUT — actualizar item existente ──────────────────
app.put('/items/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const item   = { ...req.body };

        if (item.temporadas    !== undefined) item.temporadas    = JSON.stringify(item.temporadas);
        if (item.progreso      !== undefined) item.progreso      = JSON.stringify(item.progreso);
        if (item.dlcs          !== undefined) item.dlcs          = JSON.stringify(item.dlcs);
        if (item.tomos         !== undefined) item.tomos         = JSON.stringify(item.tomos);
        if (item.progresoManga !== undefined) item.progresoManga = JSON.stringify(item.progresoManga);
        if (item.relacionados  !== undefined) item.relacionados  = JSON.stringify(item.relacionados);
        if (item.generos       !== undefined) item.generos       = JSON.stringify(item.generos);
        if (item.links         !== undefined) item.links         = JSON.stringify(item.links);
        if (item.plataforma    !== undefined) item.plataforma    = JSON.stringify(item.plataforma);
        if (item.titulos_alt   !== undefined) item.titulos_alt   = JSON.stringify(item.titulos_alt);
        delete item.id;

        const columnas = Object.keys(item);
        const valores  = Object.values(item);
        if (!columnas.length) return res.status(400).json({ error: 'Sin campos para actualizar' });

        const setStr = columnas.map(c => `${c} = ?`).join(', ');
        const result = await dbRun(`UPDATE items SET ${setStr} WHERE id = ?`, [...valores, id]);
        res.json({ updated: true, changes: Number(result.rowsAffected) });
    } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

// ── API: DELETE — borrar item ─────────────────────────────
app.delete('/items/:id', async (req, res) => {
    try {
        const result = await dbRun(`DELETE FROM items WHERE id = ?`, [req.params.id]);
        res.json({ deleted: true, changes: Number(result.rowsAffected) });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── ADMIN: Listar usuarios ────────────────────────────────
app.get('/admin/usuarios', async (req, res) => {
    try {
        const rows = await dbAll(`SELECT id, username, rol FROM usuarios ORDER BY id ASC`);
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── ADMIN: Eliminar usuario ───────────────────────────────
app.delete('/admin/usuarios/:id', async (req, res) => {
    try {
        const id          = parseInt(req.params.id);
        const solicitante = req.headers['x-user-id'] ? parseInt(req.headers['x-user-id']) : null;
        const row         = await dbGet(`SELECT id, username, rol FROM usuarios WHERE id = ?`, [id]);
        if (!row) return res.status(404).json({ error: 'Usuario no encontrado' });
        if (row.username === 'admin') return res.status(403).json({ error: 'No permitido' });
        if (row.rol === 'admin' && solicitante !== 1) return res.status(403).json({ error: 'Solo el super-admin puede eliminar admins' });
        await dbRun(`DELETE FROM usuarios WHERE id = ?`, [id]);
        await dbRun(`DELETE FROM dashboard_usuario WHERE usuario_id = ?`, [id]);
        res.json({ deleted: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── ADMIN: Cambiar rol ────────────────────────────────────
app.put('/admin/usuarios/:id/rol', async (req, res) => {
    try {
        const id      = parseInt(req.params.id);
        const { rol } = req.body;
        if (!['admin', 'user'].includes(rol)) return res.status(400).json({ error: 'Rol inválido' });
        const row = await dbGet(`SELECT rol FROM usuarios WHERE id = ?`, [id]);
        if (!row) return res.status(404).json({ error: 'Usuario no encontrado' });
        await dbRun(`UPDATE usuarios SET rol = ? WHERE id = ?`, [rol, id]);
        res.json({ updated: true, rol });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Sugerencias: crear ────────────────────────────────
app.post('/sugerencias', async (req, res) => {
    try {
        await dbRun(`CREATE TABLE IF NOT EXISTS sugerencias (
            id        INTEGER PRIMARY KEY AUTOINCREMENT,
            titulo    TEXT NOT NULL,
            categoria TEXT,
            detalle   TEXT,
            fecha     TEXT,
            leida     INTEGER DEFAULT 0
        )`);
        const { titulo, categoria, detalle } = req.body;
        const fecha = new Date().toISOString().split('T')[0];
        const result = await dbRun(
            `INSERT INTO sugerencias (titulo, categoria, detalle, fecha) VALUES (?, ?, ?, ?)`,
            [titulo, categoria || null, detalle || null, fecha]
        );
        res.json({ id: Number(result.lastInsertRowid), ok: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Sugerencias: listar (solo admins) ─────────────────
app.get('/sugerencias', async (req, res) => {
    try {
        await dbRun(`CREATE TABLE IF NOT EXISTS sugerencias (
            id        INTEGER PRIMARY KEY AUTOINCREMENT,
            titulo    TEXT NOT NULL,
            categoria TEXT,
            detalle   TEXT,
            fecha     TEXT,
            leida     INTEGER DEFAULT 0
        )`);
        const rows = await dbAll(`SELECT * FROM sugerencias ORDER BY id DESC`);
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Sugerencias: marcar como leída ────────────────────
app.put('/sugerencias/:id/leida', async (req, res) => {
    try {
        await dbRun(`UPDATE sugerencias SET leida = 1 WHERE id = ?`, [req.params.id]);
        res.json({ ok: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Sugerencias: eliminar ─────────────────────────────
app.delete('/sugerencias/:id', async (req, res) => {
    try {
        await dbRun(`DELETE FROM sugerencias WHERE id = ?`, [req.params.id]);
        res.json({ deleted: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Contacto: crear ───────────────────────────────────
app.post('/contacto', async (req, res) => {
    try {
        await dbRun(`CREATE TABLE IF NOT EXISTS contacto (
            id       INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre   TEXT NOT NULL,
            email    TEXT NOT NULL,
            mensaje  TEXT NOT NULL,
            fecha    TEXT,
            leido    INTEGER DEFAULT 0
        )`);
        const { nombre, email, mensaje } = req.body;
        const fecha = new Date().toISOString().split('T')[0];
        const result = await dbRun(
            `INSERT INTO contacto (nombre, email, mensaje, fecha) VALUES (?, ?, ?, ?)`,
            [nombre, email, mensaje, fecha]
        );
        res.json({ id: Number(result.lastInsertRowid), ok: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Contacto: listar (solo admins) ────────────────────
app.get('/contacto', async (req, res) => {
    try {
        await dbRun(`CREATE TABLE IF NOT EXISTS contacto (
            id       INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre   TEXT NOT NULL,
            email    TEXT NOT NULL,
            mensaje  TEXT NOT NULL,
            fecha    TEXT,
            leido    INTEGER DEFAULT 0
        )`);
        const rows = await dbAll(`SELECT * FROM contacto ORDER BY id DESC`);
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Contacto: marcar como leído ───────────────────────
app.put('/contacto/:id/leido', async (req, res) => {
    try {
        await dbRun(`UPDATE contacto SET leido = 1 WHERE id = ?`, [req.params.id]);
        res.json({ ok: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Contacto: eliminar ────────────────────────────────
app.delete('/contacto/:id', async (req, res) => {
    try {
        await dbRun(`DELETE FROM contacto WHERE id = ?`, [req.params.id]);
        res.json({ deleted: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── AUTH: Registro ────────────────────────────────────────
app.post('/auth/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) return res.status(400).json({ error: 'Faltan datos' });
        const hash   = await bcrypt.hash(password, SALT_ROUNDS);
        const result = await dbRun(
            `INSERT INTO usuarios (username, password, rol) VALUES (?, ?, 'user')`,
            [username, hash]
        );
        res.json({ id: Number(result.lastInsertRowid), username, rol: 'user' });
    } catch (err) { res.status(409).json({ error: 'El usuario ya existe' }); }
});

// ── AUTH: Login ───────────────────────────────────────────
app.post('/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const row = await dbGet(`SELECT * FROM usuarios WHERE username = ?`, [username]);
        if (!row) return res.status(401).json({ error: 'Credenciales incorrectas' });
        const match = await bcrypt.compare(password, row.password);
        if (!match) return res.status(401).json({ error: 'Credenciales incorrectas' });
        res.json({ id: row.id, username: row.username, rol: row.rol });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── AUTH: Actualizar cuenta ───────────────────────────────
app.put('/auth/cuenta/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const { username, passwordActual, passwordNueva } = req.body;
        if (!username) return res.status(400).json({ error: 'El nombre no puede estar vacío' });
        const row = await dbGet(`SELECT * FROM usuarios WHERE id = ?`, [id]);
        if (!row) return res.status(404).json({ error: 'Usuario no encontrado' });
        const otro = await dbGet(`SELECT id FROM usuarios WHERE username = ? AND id != ?`, [username, id]);
        if (otro) return res.status(409).json({ error: 'Ese nombre de usuario ya está en uso' });
        let nuevaPass = row.password;
        if (passwordNueva) {
            const match = await bcrypt.compare(passwordActual, row.password);
            if (!match) return res.status(401).json({ error: 'La contraseña actual no es correcta' });
            nuevaPass = await bcrypt.hash(passwordNueva, SALT_ROUNDS);
        }
        await dbRun(`UPDATE usuarios SET username = ?, password = ? WHERE id = ?`, [username, nuevaPass, id]);
        res.json({ updated: true, username });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── AUTH: Eliminar cuenta ─────────────────────────────────
app.delete('/auth/cuenta/:id', async (req, res) => {
    try {
        const id           = parseInt(req.params.id);
        const { password } = req.body;
        if (!password) return res.status(400).json({ error: 'Contraseña requerida' });
        const row = await dbGet(`SELECT * FROM usuarios WHERE id = ?`, [id]);
        if (!row) return res.status(404).json({ error: 'Usuario no encontrado' });
        if (row.rol === 'admin') return res.status(403).json({ error: 'Los admins no pueden borrar su cuenta desde aquí' });
        const match = await bcrypt.compare(password, row.password);
        if (!match) return res.status(401).json({ error: 'Contraseña incorrecta' });
        await dbRun(`DELETE FROM usuarios WHERE id = ?`, [id]);
        await dbRun(`DELETE FROM dashboard_usuario WHERE usuario_id = ?`, [id]);
        await dbRun(`DELETE FROM usuario_progreso WHERE usuario_id = ?`, [id]);
        res.json({ deleted: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Dashboard usuario: GET sus items ─────────────────────
app.get('/mi-dashboard/:userId', async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        const rows   = await dbAll(
            `SELECT items.*, dashboard_usuario.fecha_agregado, dashboard_usuario.dlcs_usuario, dashboard_usuario.logros_usuario
             FROM items
             JOIN dashboard_usuario ON items.id = dashboard_usuario.item_id
             WHERE dashboard_usuario.usuario_id = ?
             ORDER BY dashboard_usuario.id DESC`,
            [userId]
        );
        res.json(rows.map(r => ({
            ...parsearFila(r),
            dlcs_usuario:   r.dlcs_usuario  ? JSON.parse(r.dlcs_usuario) : null,
            logros_usuario: r.logros_usuario ?? null
        })));
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Dashboard usuario: Agregar item ──────────────────────
app.post('/mi-dashboard', async (req, res) => {
    try {
        const { userId, itemId } = req.body;
        const hoy = new Date().toISOString().split('T')[0];
        await dbRun(
            `INSERT OR IGNORE INTO dashboard_usuario (usuario_id, item_id, fecha_agregado) VALUES (?, ?, ?)`,
            [userId, itemId, hoy]
        );
        res.json({ added: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Dashboard usuario: Quitar item ───────────────────────
app.delete('/mi-dashboard/:userId/:itemId', async (req, res) => {
    try {
        const { userId, itemId } = req.params;
        await dbRun(`DELETE FROM dashboard_usuario WHERE usuario_id = ? AND item_id = ?`, [userId, itemId]);
        res.json({ removed: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Dashboard usuario: Actualizar item ───────────────────
app.put('/mi-dashboard/:userId/:itemId', async (req, res) => {
    try {
        const { userId, itemId } = req.params;
        const { fecha_agregado, dlcs_usuario, logros_usuario } = req.body;
        await dbRun(
            `UPDATE dashboard_usuario SET fecha_agregado=?, dlcs_usuario=?, logros_usuario=?
             WHERE usuario_id=? AND item_id=?`,
            [
                fecha_agregado ?? null,
                dlcs_usuario   ? JSON.stringify(dlcs_usuario) : null,
                logros_usuario ?? null,
                userId, itemId
            ]
        );
        res.json({ updated: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Dashboard usuario: Quitar item de progreso ───────────
app.delete('/progreso/:userId/:itemId', async (req, res) => {
    try {
        const { userId, itemId } = req.params;
        await dbRun(`DELETE FROM usuario_progreso WHERE usuario_id=? AND item_id=?`, [userId, itemId]);
        res.json({ deleted: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── API: GET progreso de usuario en todos sus items ───────
app.get('/progreso/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const rows = await dbAll(`SELECT * FROM usuario_progreso WHERE usuario_id=?`, [userId]);
        const map  = {};
        rows.forEach(r => { map[r.item_id] = r; });
        res.json(map);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── API: GET progreso de usuario en un item ───────────────
app.get('/progreso/:userId/:itemId', async (req, res) => {
    try {
        const { userId, itemId } = req.params;
        const row = await dbGet(`SELECT * FROM usuario_progreso WHERE usuario_id=? AND item_id=?`, [userId, itemId]);
        res.json(row || null);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── API: PUT progreso de usuario en un item ───────────────
app.put('/progreso/:userId/:itemId', async (req, res) => {
    try {
        const { userId, itemId } = req.params;
        const { estado, valoracion, capituloActual, paginaActual, progresoManga, progreso } = req.body;
        await dbRun(
            `INSERT INTO usuario_progreso (usuario_id, item_id, estado, valoracion, capituloActual, paginaActual, progresoManga, progreso)
             VALUES (?,?,?,?,?,?,?,?)
             ON CONFLICT(usuario_id, item_id) DO UPDATE SET
                 estado=excluded.estado,
                 valoracion=excluded.valoracion,
                 capituloActual=excluded.capituloActual,
                 paginaActual=excluded.paginaActual,
                 progresoManga=excluded.progresoManga,
                 progreso=excluded.progreso`,
            [
                userId, itemId,
                estado         ?? null,
                valoracion     ?? 0,
                capituloActual ?? null,
                paginaActual   ?? null,
                progresoManga  ? JSON.stringify(progresoManga) : null,
                progreso       ? JSON.stringify(progreso)      : null
            ]
        );
        res.json({ ok: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/rawg', async (req, res) => {
    try {
        const query = req.query.search;
        if (!query) return res.json({ results: [] });
        const key = process.env.RAWG_KEY;
        const url = `https://api.rawg.io/api/games?key=${key}&search=${encodeURIComponent(query)}&page_size=8&ordering=-rating`;
        const r   = await fetch(url);
        const d   = await r.json();
        res.json(d);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/tmdb/movie', async (req, res) => {
    try {
        const query = req.query.search;
        if (!query) return res.json({ results: [] });
        const key = process.env.TMDB_KEY;
        const url = `https://api.themoviedb.org/3/search/movie?api_key=${key}&query=${encodeURIComponent(query)}&language=es-ES&page=1`;
        const r   = await fetch(url);
        const d   = await r.json();
        res.json(d);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/tmdb/tv', async (req, res) => {
    try {
        const query = req.query.search;
        if (!query) return res.json({ results: [] });
        const key = process.env.TMDB_KEY;
        const url = `https://api.themoviedb.org/3/search/tv?api_key=${key}&query=${encodeURIComponent(query)}&language=es-ES&page=1`;
        const r   = await fetch(url);
        const d   = await r.json();
        res.json(d);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/tmdb/genres/:type', async (req, res) => {
    try {
        const key  = process.env.TMDB_KEY;
        const type = req.params.type; // movie o tv
        const url  = `https://api.themoviedb.org/3/genre/${type}/list?api_key=${key}&language=es-ES`;
        const r    = await fetch(url);
        const d    = await r.json();
        res.json(d);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Arrancar servidor ─────────────────────────────────────
initDB().then(() => {
    app.listen(PORT, () => {
        console.log(`\n🚀 NEXUS corriendo en http://localhost:${PORT}`);
    });
}).catch(err => {
    console.error('Error al inicializar la BD:', err);
    process.exit(1);
});