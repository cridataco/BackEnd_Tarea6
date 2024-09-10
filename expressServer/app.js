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
app.post('/citas', upload.single('authorisation'), (req, res) => {
  const { cc, date } = req.body;
  const authorisation = req.file;
  if (!cc || !date) {
    return res.status(400).send('Faltan datos requeridos');
  }
  const nuevaCita = {
    id: uuidv4(),
    cc,
    date,
    authorisation: authorisation != null ? authorisation.path : null,
    cancelada: false
  };
  citas.push(nuevaCita);
  res.json({ codigoCita: nuevaCita.id });
});

// Consultar citas en un rango de fechas
app.get('/citas', (req, res) => {
  const { fechaInicio, fechaFin } = req.query;
  console.log(fechaInicio, fechaFin);
  
  if (!fechaInicio || !fechaFin) {
    return res.status(400).send('Faltan los parámetros de fecha');
  }
  const citasEnRango = citas.filter(cita => 
    new Date(cita.date) >= new Date(fechaInicio) && new Date(cita.date) <= new Date(fechaFin)
  );
  console.log(citasEnRango);
  res.json(citasEnRango);
});

// Cancelar una cita
app.patch('/citas/:id/cancelar', (req, res) => {
  const { id } = req.params;
  console.log(id);
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



