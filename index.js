const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
    origin: process.env.ALLOWED_ORIGIN || '*'
}));
app.use(express.json());
app.use(express.static("public"));

const dbPath = path.join(__dirname, 'database.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error al conectar con la base de datos', err);
    } else {
        console.log('Conectado a la base de datos SQLite');
    }
});

db.run(
    `CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tipo TEXT NOT NULL,
    titulo TEXT NOT NULL,
    estado TEXT,
    fecha TEXT,
    imagen TEXT,
    plataforma TEXT,
    logros INTEGER DEFAULT 0,
    temporadas TEXT,
    progreso TEXT,
    estadoSerie TEXT,
    capitulosTotales INTEGER,
    capituloActual INTEGER,
    paginasTotales INTEGER,
    paginaActual INTEGER,
    valoracion INTEGER
)
    `);

app.get('/', (req, res) => {
  res.send('servidor y sqlite funcionando');
});

app.get("/items/:tipo", (req, res) => {
  const {tipo} = req.params;
  db.all("SELECT * FROM items WHERE tipo = ?", [tipo], (err, rows) => {
    if (err) {
     return res.status(500).json({ error: err.message });
    }

    const parsedRows = rows.map(row => ({
      ...row,
      logros: row.logros === 1,
      temporadas: (() => {
        try {          return row.temporadas ? JSON.parse(row.temporadas) : null;
        } catch (e) { return null; }
      })(),
      progreso: (() => {
        try {          return row.progreso ? JSON.parse(row.progreso) : null;
        } catch (e) { return null; }
      })(),
    }));

    res.json(parsedRows);
  });
});

app.get("/items", (req, res) => {

    const search = req.query.search;

    if (search) {
        db.all(
            `SELECT * FROM items WHERE titulo LIKE ?`,
            [`%${search}%`],
            (err, rows) => {
                if (err) return res.status(500).json(err);
                res.json(rows);
            }
        );
    } else {
        db.all("SELECT * FROM items", (err, rows) => {
            if (err) return res.status(500).json(err);
            res.json(rows);
        });
    }
});

app.post("/items", (req, res) => {
  const { tipo, titulo, estado, fecha, imagen, plataforma, logros, temporadas, progreso, estadoSerie, capitulosTotales, capituloActual, paginasTotales, paginaActual, valoracion } = req.body;
  
  const sql = `INSERT INTO items (tipo, titulo, estado, fecha, imagen, plataforma, logros, temporadas, progreso, estadoSerie, capitulosTotales, capituloActual, paginasTotales, paginaActual, valoracion) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    db.run(sql, [tipo, titulo, estado, fecha, imagen || null, plataforma || null, logros ? 1 : 0,
      JSON.stringify(temporadas || null),
      JSON.stringify(progreso || null),
      estadoSerie || null,
      capitulosTotales || null,
      capituloActual || null,
      paginasTotales || null,
      paginaActual || null,
      valoracion

    ], function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ id: this.lastID, message: 'Item agregado exitosamente' });
    });
});

app.put("/items/:id", (req, res) => {
  const { id } = req.params;
  const item = req.body;

  if (item.logros !== undefined) {
    item.logros = item.logros ? 1 : 0;
  }

 if (item.temporadas !== undefined) {
  item.temporadas = JSON.stringify(item.temporadas);
 }

 if (item.progreso !== undefined) {
  item.progreso = JSON.stringify(item.progreso);
 }

  const columnas = Object.keys(item);
  const valores = Object.values(item);

  const setString = columnas.map(col => `${col} = ?`).join(", ");

  const sql = `UPDATE items SET ${setString} WHERE id = ?`;


  db.run(sql, [ ...valores, id], function(err) {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: err.message });
    } 
    res.json({ update: true });
  });
});

app.delete("/items/:id", (req, res) => {
  const { id } = req.params;
  db.run("DELETE FROM items WHERE id = ?", [id], function(err) {
    if (err) {return res.status(500).json({ error: err.message });
  }
  res.json({ delete: true });
});
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});