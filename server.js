const express = require('express');
const mysql = require('mysql2');
const pageRoutes = require('./RUTAS/rutas.js');
const path = require('path');
const multer = require('multer');
const cors = require('cors');
const app = express();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// --- MIDDLEWARES ---
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true, limit: '10mb' })); 

const puerto = 3001;

// --- CONFIGURACIÓN DE ARCHIVOS ESTÁTICOS ---
app.use('/CSS', express.static(path.join(__dirname, 'CSS')));
app.use('/js', express.static(path.join(__dirname, 'js')));
app.use('/HTML', express.static(path.join(__dirname, 'HTML')));

// --- CONEXIÓN A BASE DE DATOS ---
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root', // Asegúrate de que tu password sea 'root'
    database: 'pia_pw2',
    port: 3306
});

db.connect((error) => {
    if (error) {
        console.log("Error de conexión:", error);
        return;
    }
    console.log('Conectado a la base de datos MySQL');
});

// --- RUTAS DE NAVEGACIÓN ---
app.use('/', pageRoutes);

// --- ENDPOINT DE REGISTRO ---
app.post('/usuario/registrar', upload.single('foto'), async (req, res) => {
    const { nombre, correo, contrasena, biografia, fecha_nacimiento } = req.body;

    if (!nombre || !correo || !contrasena || !fecha_nacimiento || !req.file) {
        return res.json({ msg: "Error: Campos incompletos" });
    }

    try {
        // Verificar si el correo ya existe
        const [usuariosEncontrados] = await db.promise().query(
            'SELECT Correo FROM Usuario WHERE Correo = ?',
            [correo]
        );

        if (usuariosEncontrados.length > 0) {
            return res.json({ msg: "Correo ya registrado" });
        }

        // Procesar imagen a Base64
        const fotoBuffer = req.file.buffer.toString('base64');
        const dataUri = `data:${req.file.mimetype};base64,${fotoBuffer}`;

        // Insertar usuario 
        const queryInsert = 'INSERT INTO Usuario (Nombre, Correo, contrasena, Biografia, fdp, fecha_nacimiento) VALUES (?, ?, ?, ?, ?, ?)';
        
        await db.promise().query(queryInsert, [
            nombre, 
            correo, 
            contrasena, 
            biografia || 'Sin biografía', 
            dataUri, 
            fecha_nacimiento
        ]);

        return res.json({
            msg: "Registrado",
            info: { nombre, correo }
        });

    } catch (err) {
        console.error("Error en el servidor:", err);
        return res.status(500).json({ msg: "Error interno del servidor" });
    }
});

// --- INICIO DEL SERVIDOR ---
app.listen(puerto, () => {
    console.log(`Servidor corriendo en http://localhost:${puerto}`);
});