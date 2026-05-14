require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const pageRoutes = require('./RUTAS/rutas.js');
const path = require('path');
const multer = require('multer');
const cors = require('cors');
const app = express();
const session = require('express-session');
const passportConfig = require('./config/passport');
const logger = require('./logger');


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
    password: 'root',
    database: 'pia_pw2',
    port: 3306
});

db.connect((error) => {
    if (error) { logger.info('Error de conexión:', error); return; }
    logger.info('Conectado a la base de datos MySQL');
});

const passport = passportConfig(db);

app.use(session({
    secret: 'clave_secreta_segura',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
}));
app.use(passport.initialize());
app.use(passport.session());


app.get('/auth/google',
    (req, res, next) => passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next)
);

app.get('/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/HTML/login.html' }),
    (req, res) => {
        const u = req.user;
        const info = {
            id: u.ID_Usuario,
            nombre: u.Nombre,
            correo: u.Correo,
            descripcion: u.Biografia || 'Sin biografía',
            fdn: u.fecha_nacimiento,
            foto: u.foto_google || u.fdp
        };
        const encoded = encodeURIComponent(JSON.stringify(info));
        res.redirect(`/landing?usuario=${encoded}`);
    }
);

app.get('/auth/logout', (req, res) => {
    req.logout((err) => {
        if (err) return res.status(500).json({ msg: 'Error al cerrar sesión' });
        res.redirect('/HTML/login.html');
    });
});

app.get('/auth/facebook',
    passport.authenticate('facebook', { scope: ['email'] })
);

app.get('/auth/facebook/callback',
    passport.authenticate('facebook', {
        failureRedirect: '/HTML/login.html'
    }),
    (req, res) => {

        const u = req.user;

        const info = {
            id: u.ID_Usuario,
            nombre: u.Nombre,
            correo: u.Correo,
            descripcion: u.Biografia || 'Sin biografía',
            foto: u.foto_facebook || u.fdp
        };

        const encoded = encodeURIComponent(JSON.stringify(info));

        res.redirect(`/landing?usuario=${encoded}`);
    }
);

// --- ENDPOINT DE REGISTRO ---
app.post('/usuario/registrar', upload.single('foto'), async (req, res) => {
    const { nombre, correo, contrasena, biografia, fecha_nacimiento } = req.body;

    if (!nombre || !correo || !contrasena || !fecha_nacimiento || !req.file) {
        return res.json({ msg: "Error: Campos incompletos" });
    }

    try {
        const [usuariosEncontrados] = await db.promise().query(
            'SELECT Correo FROM Usuario WHERE Correo = ?',
            [correo]
        );

        if (usuariosEncontrados.length > 0) {
            return res.json({ msg: "Correo ya registrado" });
        }

        const fotoBuffer = req.file.buffer.toString('base64');
        const dataUri = `data:${req.file.mimetype};base64,${fotoBuffer}`;

        const queryInsert = 'INSERT INTO Usuario (Nombre, Correo, contrasena, Biografia, fdp, fecha_nacimiento) VALUES (?, ?, ?, ?, ?, ?)';

        await db.promise().query(queryInsert, [
            nombre,
            correo,
            contrasena,
            biografia || 'Sin biografía',
            dataUri,
            fecha_nacimiento
        ]);

        // Fix: obtener el ID del usuario recién registrado
        const [rows] = await db.promise().query(
            'SELECT ID_Usuario FROM Usuario WHERE Correo = ?', [correo]
        );

        return res.json({
            msg: "Registrado",
            //devolvemos todos los datos del usuario para el session storage
            info: {

                id: usuario.ID_Usuario,
                nombre: nombre,
                correo: correo,
                descripcion: biografia || 'Sin biografía',
                fdn: fecha_nacimiento,
                foto: dataUri
            }
        });

    } catch (err) {
        logger.info('Conectado a la base de datos MySQL');
        return res.status(500).json({ msg: "Error interno del servidor" });
    }
});


//-- ENDPOINT DE LOGIN --
app.post('/usuario/login', async (req, res) => {
    const { correo, contrasena } = req.body;

    if (!correo || !contrasena) {
        return res.json({ msg: "Error: Campos incompletos" });
    }

    try {
        // buscar solo por correo
        const [result] = await db.promise().query(
            'SELECT * FROM usuario WHERE Correo = ?',
            [correo]
        );

        if (result.length === 0) {
            return res.json({ msg: "No encontrado" });
        }

        const usuario = result[0];

        // verificar si es cuenta de Google (sin contraseña)
        if (!usuario.contrasena) {
            return res.json({ msg: "Cuenta de Google" }); // maneja esto en tu JS frontend
        }

        // validar contraseña normal
        if (usuario.contrasena !== contrasena) {
            return res.json({ msg: "No encontrado" });
        }

        logger.info(`Intento de login: ${correo}`);

        // Todo bien, devolver info
        return res.json({
            msg: "Registrado",
            info: {
                id: usuario.ID_Usuario,
                nombre: usuario.Nombre,
                correo: usuario.Correo,
                descripcion: usuario.Biografia,
                fdn: usuario.fecha_nacimiento,
                foto: usuario.fdp
            }
        });

    } catch (err) {
        logger.error(`Login fallido para ${correo}: ${err.message}`);
        return res.status(500).json({ msg: "Error en la base de datos" });
    }
});

//-- ENDPOINT DEL PERFIL--
app.get('/api/perfil', async (req, res) => {
    const { correo } = req.query;

    if (!correo) {
        return res.status(400).json({ msg: "Error: Falta el correo" });
    }

    try {
        const [result] = await db.promise().query(
            'SELECT Nombre, fdp FROM usuario WHERE Correo = ?',
            [correo]
        );

        if (result.length === 0) {
            return res.status(404).json({ msg: "Usuario no encontrado" });
        }

        const usuario = result[0];
        return res.json({
            nombre: usuario.Nombre,
            foto: usuario.fdp
        });

    } catch (err) {
        logger.error("Error al obtener perfil:", err);
        return res.status(500).json({ msg: "Error interno del servidor" });
    }
});

// --- OBTENER TAGS DE UN USUARIO ---
app.get('/api/tags/:id_usuario', async (req, res) => {
    const { id_usuario } = req.params;
    try {
        const [tags] = await db.promise().query(
            'SELECT ID_Tag, Nombre FROM usuario_tags WHERE ID_Usuario = ?',
            [id_usuario]
        );
        res.json(tags);
    } catch (err) {
        logger.error(err.message);
        res.status(500).json({ msg: "Error al obtener tags" });
    }
});

// --- GUARDAR TAGS (reemplaza todos los del usuario) ---
app.put('/api/tags/:id_usuario', async (req, res) => {
    const { id_usuario } = req.params;
    const { tags } = req.body; // array de strings ["Animator", "Chibi"]

    try {
        await db.promise().query(
            'DELETE FROM usuario_tags WHERE ID_Usuario = ?',
            [id_usuario]
        );

        if (tags && tags.length > 0) {
            const values = tags.map(t => [id_usuario, t.trim()]);
            await db.promise().query(
                'INSERT INTO usuario_tags (ID_Usuario, Nombre) VALUES ?',
                [values]
            );
        }

        res.json({ msg: "Tags actualizados" });
    } catch (err) {
        logger.error(err.message);
        res.status(500).json({ msg: "Error al guardar tags" });
    }
});

// --- ACTUALIZAR NOMBRE Y BIOGRAFÍA ---
app.put('/api/perfil/:id_usuario', async (req, res) => {
    const { id_usuario } = req.params;
    const { nombre, biografia } = req.body;

    try {
        await db.promise().query(
            'UPDATE usuario SET Nombre = ?, Biografia = ? WHERE ID_Usuario = ?',
            [nombre, biografia, id_usuario]
        );
        res.json({ msg: "Perfil actualizado" });
    } catch (err) {
        logger.error(err.message);
        res.status(500).json({ msg: "Error al actualizar perfil" });
    }
});

app.put('/api/perfil/:id_usuario/foto', async (req, res) => {
    const { id_usuario } = req.params;
    const { foto } = req.body; // base64 completo con el data:image/...
    if (!foto) return res.status(400).json({ msg: "Falta la foto" });
    try {
        await db.promise().query(
            'UPDATE usuario SET fdp = ? WHERE ID_Usuario = ?',
            [foto, id_usuario]
        );
        res.json({ msg: "Foto actualizada" });
    } catch (err) {
        logger.error(err.message);
        res.status(500).json({ msg: "Error al actualizar foto" });
    }
});

// --- OBTENER CATEGORÍAS ---
app.get('/categorias', async (req, res) => {
    try {
        const [categorias] = await db.promise().query(
            'SELECT ID_Categoria, Nombre FROM categorias'
        );
        res.json(categorias);
    } catch (error) {
        logger.error(err.message);
        res.status(500).json({ msg: 'Error al obtener categorías' });
    }
});


//--- ENDPOINT PARA CREAR PUBLICACIÓN ---
app.post('/publicaciones/crear', upload.single('imagen'), async (req, res) => {
    const { titulo, descripcion, terminos, precio, id_usuario, id_categoria, metodo_pago } = req.body;
    const fechaActual = new Date();

    if (!titulo || !descripcion || !terminos || !precio || !id_usuario || !id_categoria) {
        return res.status(400).json({ msg: "Faltan campos obligatorios" });
    }

    if (!req.file) {
        return res.status(400).json({ msg: "Debes subir al menos una imagen" });
    }

    try {
        logger.info(`BODY: ${JSON.stringify(req.body)}`);
        logger.info(`ID_USUARIO: ${id_usuario}`);
        const queryPublicacion = `
          INSERT INTO publicaciones (ID_Usuario, Titulo, Descripcion, Precio, TerminosCondiciones, FechaPublicacion, Activa, ID_Categoria, MetodoPago)
          VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)
        `;
        const [result] = await db.promise().query(queryPublicacion, [
            id_usuario, titulo, descripcion,
            parseFloat(precio), terminos, fechaActual,
            id_categoria, metodo_pago
        ]);

        const id_publicacion = result.insertId;

        const imagenBase64 = req.file.buffer.toString('base64');
        const queryImagen = `
            INSERT INTO imagenes_publicacion (ID_Publicacion, URL_Imagen, Portada, Orden)
            VALUES (?, ?, 1, 1)
        `;
        await db.promise().query(queryImagen, [id_publicacion, imagenBase64]);

        logger.info(`Usuario ${id_usuario} creó publicación "${titulo}"`);
        return res.status(201).json({ msg: "Publicación creada con éxito", id_publicacion });

    } catch (err) {
        logger.error("Error al crear publicación:", err);
        return res.status(500).json({ msg: "Error en el servidor" });
    }
});

//--- ENDPOINT PARA MOSTRAR PUBLICACIONES ---
// --- OBTENER PUBLICACIONES DEL USUARIO ---
app.get('/api/publicaciones/:id_usuario', async (req, res) => {
    const { id_usuario } = req.params;

    try {
        const [publicaciones] = await db.promise().query(`
            SELECT 
                p.ID_Publicacion,
                p.Titulo,
                p.Descripcion,
                p.Precio,
                p.FechaPublicacion,
                p.ID_Categoria,
                c.Nombre AS Categoria,
                i.URL_Imagen
            FROM publicaciones p
            LEFT JOIN categorias c ON p.ID_Categoria = c.ID_Categoria
            LEFT JOIN imagenes_publicacion i ON p.ID_Publicacion = i.ID_Publicacion AND i.Portada = 1
            WHERE p.ID_Usuario = ? AND p.Activa = 1
            ORDER BY p.FechaPublicacion DESC
        `, [id_usuario]);

        return res.json(publicaciones);
    } catch (err) {
        logger.error("Error al obtener publicaciones:", err);
        return res.status(500).json({ msg: "Error en el servidor" });
    }
});

// --- ENDPOINT DE BÚSQUEDA ---
app.get('/publicaciones/buscar', async (req, res) => {
    const { q, id_categoria } = req.query;

    try {
        let query = `
            SELECT p.*, i.URL_Imagen
            FROM publicaciones p
            LEFT JOIN imagenes_publicacion i 
              ON p.ID_Publicacion = i.ID_Publicacion AND i.Portada = 1
            WHERE p.Activa = 1
        `;
        let params = [];

        if (q && q.trim() !== '') {
            query += ` AND (p.Titulo LIKE ? OR p.Descripcion LIKE ?)`;
            params.push(`%${q}%`, `%${q}%`);
        }

        if (id_categoria && id_categoria !== 'all') {
            query += ` AND p.ID_Categoria = ?`;
            params.push(id_categoria);
        }

        query += ` ORDER BY p.FechaPublicacion DESC`;

        const [rows] = await db.promise().query(query, params);
        res.json(rows);
    } catch (err) {
        logger.error(err.message);
        res.status(500).json({ msg: "Error al buscar" });
    }
});

//--- ENDPOINT PARA FILTRAR PUBLICACIONES POR CATEGORÍA ---
app.get('/publicaciones/categoria/:id_categoria', async (req, res) => {
    const { id_categoria } = req.params;

    try {
        let query = `
            SELECT p.*, i.URL_Imagen
            FROM publicaciones p
            LEFT JOIN imagenes_publicacion i 
              ON p.ID_Publicacion = i.ID_Publicacion AND i.Portada = 1
            WHERE p.Activa = 1
        `;

        let params = [];

        if (id_categoria !== 'all') {
            query += ` AND p.ID_Categoria = ?`;
            params.push(id_categoria);
        }

        query += ` ORDER BY p.FechaPublicacion DESC`;

        const [rows] = await db.promise().query(query, params);
        res.json(rows);

    } catch (err) {
        logger.error(err.message);
        res.status(500).json({ msg: "Error" });
    }
});


//--ENDPOINT PARA MOSTRAR PUBLICACIONES RANDOM--
app.get('/publicaciones/random', async (req, res) => {
    try {
        const [rows] = await db.promise().query(`
            SELECT p.*, i.URL_Imagen
            FROM publicaciones p
            LEFT JOIN imagenes_publicacion i 
              ON p.ID_Publicacion = i.ID_Publicacion AND i.Portada = 1
            WHERE p.Activa = 1
            ORDER BY RAND()
            LIMIT 4
        `);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ msg: "Error" });
    }
});

// --- ENDPOINT PARA OBTENER UNA PUBLICACIÓN POR ID ---
app.get('/api/publicacion/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await db.promise().query(`
            SELECT 
                p.ID_Publicacion,
                p.Titulo,
                p.Descripcion,
                p.Precio,
                p.TerminosCondiciones,
                p.FechaPublicacion,
                p.MetodoPago,
                p.ID_Categoria,
                c.Nombre AS Categoria,
                u.Nombre AS NombreArtista,
                u.ID_Usuario AS ID_Usuario_Artista,
                u.Correo AS CorreoArtista,
                u.Biografia,
                u.fdp AS FotoArtista,
                i.URL_Imagen
            FROM publicaciones p
            LEFT JOIN categorias c ON p.ID_Categoria = c.ID_Categoria
            LEFT JOIN usuario u ON p.ID_Usuario = u.ID_Usuario
            LEFT JOIN imagenes_publicacion i ON p.ID_Publicacion = i.ID_Publicacion AND i.Portada = 1
            WHERE p.ID_Publicacion = ? AND p.Activa = 1
        `, [id]);

        if (rows.length === 0) {
            return res.status(404).json({ msg: "Publicación no encontrada" });
        }

        return res.json(rows[0]);
    } catch (err) {
        logger.error("Error al obtener publicación:", err);
        return res.status(500).json({ msg: "Error en el servidor" });
    }
});

// --- ENDPOINT PERFIL PÚBLICO DE OTRO USUARIO ---
app.get('/api/perfil-publico', async (req, res) => {
    const { id } = req.query;
    if (!id) return res.status(400).json({ msg: "Falta el id" });

    try {
        const [result] = await db.promise().query(
            'SELECT Nombre, fdp, Biografia FROM usuario WHERE ID_Usuario = ?',
            [id]
        );
        if (result.length === 0) return res.status(404).json({ msg: "Usuario no encontrado" });

        const u = result[0];
        return res.json({ nombre: u.Nombre, foto: u.fdp, biografia: u.Biografia });
    } catch (err) {
        logger.error(err.message);
        return res.status(500).json({ msg: "Error en el servidor" });
    }
});


// --- ENDPOINT PARA COMISIONAR ---
app.post('/pedidos/crear', async (req, res) => {
    logger.info(`BODY RECIBIDO: ${JSON.stringify(req.body)}`);
    const { id_usuario, id_artista, id_publicacion, personalizacion, total, metodo_pago } = req.body;

//     if (!id_usuario || !id_artista || !total) {
//         return res.status(400).json({ msg: "Faltan campos obligatorios" });
//     }

    try {
        await db.promise().beginTransaction();

        const [result] = await db.promise().query(
            `INSERT INTO pedidos (ID_Usuario, ID_Artista, ID_Publicacion, Personalizacion, Total, MetodoPago, Estado)
             VALUES (?, ?, ?, ?, ?, ?, 'pendiente')`,
            [id_usuario, id_artista, id_publicacion || null, personalizacion || '', total, metodo_pago || '']
        );

        const id_pedido = result.insertId;

        await db.promise().query(
            `INSERT INTO historial (ID_Usuario, ID_Pedido, Tipo) VALUES (?, ?, 'compra')`,
            [id_usuario, id_pedido]
        );

        await db.promise().query(
            `INSERT INTO historial (ID_Usuario, ID_Pedido, Tipo) VALUES (?, ?, 'venta')`,
            [id_artista, id_pedido]
        );

        await db.promise().commit();

        return res.status(201).json({ msg: "Pedido creado", id_pedido });

    } catch (err) {
        logger.error("Error al crear pedido:", err);
        return res.status(500).json({ msg: "Error en el servidor" });
    }
});

// ==================== PEDIDOS / COMISIONES ====================

// --- OBTENER PEDIDOS DE UN CLIENTE (para Canasta) ---
app.get('/pedidos/usuario/:id_usuario', async (req, res) => {
    const { id_usuario } = req.params;

    try {
        const [pedidos] = await db.promise().query(`
            SELECT 
                p.ID_Pedido,
                p.Estado,
                p.Personalizacion,
                p.Total,
                p.MetodoPago,
                p.Fecha_Pedido,
                p.ID_Publicacion,
                pub.Titulo AS PublicacionTitulo,
                pub.ID_Categoria,
                art.Nombre AS ArtistaNombre,
                art.fdp AS ArtistaFoto,
                img.URL_Imagen AS Portada
            FROM pedidos p
            LEFT JOIN publicaciones pub ON p.ID_Publicacion = pub.ID_Publicacion
            LEFT JOIN usuario art ON p.ID_Artista = art.ID_Usuario
            LEFT JOIN imagenes_publicacion img ON pub.ID_Publicacion = img.ID_Publicacion AND img.Portada = 1
            WHERE p.ID_Usuario = ?
            ORDER BY p.Fecha_Pedido DESC
        `, [id_usuario]);

        res.json(pedidos);
    } catch (err) {
        console.error("Error al obtener pedidos del usuario:", err);
        res.status(500).json({ msg: "Error en el servidor" });
    }
});

// --- OBTENER PEDIDOS RECIBIDOS POR UN ARTISTA (para Ventas) ---
app.get('/pedidos/artista/:id_artista', async (req, res) => {
    const { id_artista } = req.params;
    console.log(`📦 Consultando ventas del artista ${id_artista}`);

    try {
        const [pedidos] = await db.promise().query(`
            SELECT 
                p.ID_Pedido,
                p.Estado,
                p.Personalizacion,
                p.Total,
                p.MetodoPago,
                p.Fecha_Pedido,
                p.ID_Publicacion,
                pub.Titulo AS PublicacionTitulo,
                pub.ID_Categoria,
                cli.Nombre AS ClienteNombre,
                cli.fdp AS ClienteFoto,
                img.URL_Imagen AS Portada
            FROM pedidos p
            LEFT JOIN publicaciones pub ON p.ID_Publicacion = pub.ID_Publicacion
            LEFT JOIN usuario cli ON p.ID_Usuario = cli.ID_Usuario
            LEFT JOIN imagenes_publicacion img ON pub.ID_Publicacion = img.ID_Publicacion AND img.Portada = 1
            WHERE p.ID_Artista = ?
            ORDER BY p.Fecha_Pedido DESC
        `, [id_artista]);

        console.log(`✅ Encontradas ${pedidos.length} ventas`);
        res.json(pedidos);
    } catch (err) {
        console.error("Error al obtener pedidos del artista:", err);
        res.status(500).json({ msg: "Error en el servidor", error: err.message });
    }
});

// --- CREAR PEDIDO 
app.post('/pedidos/crear', async (req, res) => {
    const { id_usuario, id_artista, id_publicacion, personalizacion, total, metodo_pago } = req.body;

    if (!id_usuario || !id_artista || !total) {
        return res.status(400).json({ msg: "Faltan campos obligatorios" });
    }

    try {
        // Iniciar transacción
        await db.promise().beginTransaction();

        // 1. Insertar pedido
        const [result] = await db.promise().query(
            `INSERT INTO pedidos (ID_Usuario, ID_Artista, ID_Publicacion, Personalizacion, Total, MetodoPago, Estado)
             VALUES (?, ?, ?, ?, ?, ?, 'pendiente')`,
            [id_usuario, id_artista, id_publicacion || null, personalizacion || '', total, metodo_pago || '']
        );

        const id_pedido = result.insertId;

        // 2. Registrar en Historial para el CLIENTE (compra)
        await db.promise().query(
            `INSERT INTO historial (ID_Usuario, ID_Pedido, Tipo) VALUES (?, ?, 'compra')`,
            [id_usuario, id_pedido]
        );

        // 3. Registrar en Historial para el ARTISTA (venta)
        await db.promise().query(
            `INSERT INTO historial (ID_Usuario, ID_Pedido, Tipo) VALUES (?, ?, 'venta')`,
            [id_artista, id_pedido]
        );

        // Confirmar transacción
        await db.promise().commit();

        return res.status(201).json({ msg: "Pedido creado", id_pedido });

    } catch (err) {
        await db.promise().rollback();
        console.error("Error al crear pedido:", err);
        return res.status(500).json({ msg: "Error en el servidor" });
    }
});

// --- RUTAS DE NAVEGACIÓN ---
app.use('/', pageRoutes);

// ============================================
// SOCKET.IO
// ============================================
const http = require('http');
const { Server } = require('socket.io');
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

io.on('connection', (socket) => {
    console.log('🔌 Cliente conectado al chat');
    socket.on('unirse_pedido', (id_pedido) => {
        socket.join(`pedido_${id_pedido}`);
        console.log(`👥 Cliente unido a sala pedido_${id_pedido}`);
    });
    socket.on('disconnect', () => {
        console.log('🔌 Cliente desconectado del chat');
    });
});


// --- INICIO DEL SERVIDOR ---
app.listen(puerto, () => {
    logger.info(`Servidor corriendo en http://localhost:${puerto}`);
});