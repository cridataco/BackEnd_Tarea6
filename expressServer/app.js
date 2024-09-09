const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

const app = express();
const IP_ADDRESS = "localhost";

app.use(express.json()); 
app.use(cors());

let citas = [];

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${uuidv4()}-${file.originalname}`);
  }
});

const upload = multer({ storage });

// Crear una nueva cita médica
app.post('/citas', upload.single('autorizacion'), (req, res) => {
  const { cc, fecha } = req.body;
  const autorizacion = req.file;
  if (!cc || !fecha || !autorizacion) {
    return res.status(400).send('Faltan datos requeridos');
  }
  const nuevaCita = {
    id: uuidv4(),
    cc,
    fecha,
    autorizacion: autorizacion.path,
    cancelada: false
  };
  citas.push(nuevaCita);
  res.json({ codigoCita: nuevaCita.id });
});

// Consultar citas en un rango de fechas
app.get('/citas', (req, res) => {
  const { fechaInicio, fechaFin } = req.query;

  if (!fechaInicio || !fechaFin) {
    return res.status(400).send('Faltan los parámetros de fecha');
  }
  const citasEnRango = citas.filter(cita => 
    new Date(cita.fecha) >= new Date(fechaInicio) && new Date(cita.fecha) <= new Date(fechaFin)
  );

  res.json(citasEnRango);
});

// Cancelar una cita
app.patch('/citas/:id/cancelar', (req, res) => {
  const { id } = req.params;

  const cita = citas.find(c => c.id === id);
  if (!cita) {
    return res.status(404).send('Cita no encontrada');
  }

  cita.cancelada = true;
  res.send('Cita cancelada exitosamente');
});

app.use((req, res, next) => {
  console.log(`${req.method} ${req.url} - ${new Date().toLocaleString()}`);
  next();
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something went wrong!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, IP_ADDRESS, () => {
  console.log(`Servidor escuchando en http://${IP_ADDRESS}:3000`);
});

const logStream = fs.createWriteStream('server.log', { flags: 'a' });
app.use((req, res, next) => {
  const logMessage = `${req.method} ${req.url} - ${new Date().toLocaleString()}\n`;
  logStream.write(logMessage);
  next();
});



