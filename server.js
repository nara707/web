console.log("🟢 SERVER VERSIÓN NUEVA CARGADA");
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
    password: '12345',
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
            //devolvemos todos los datos del usuario para el session storage usando las variables definidas en este este endpoint
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
        console.error("Error en el servidor:", err);
        return res.status(500).json({ msg: "Error interno del servidor" });
    }
});


//-- ENDPOINT DE LOGIN --
app.post('/usuario/login', async (req, res) => {
    const { correo, contrasena } = req.body;
    if (!correo || !contrasena) {
        return res.json({ msg: "Error: Campos incompletos" });
    }


    db.query(
        'SELECT * FROM usuario WHERE correo = ? AND contrasena = ?',
        [correo, contrasena],
        (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ msg: "Error en la base de datos" });
            }

            if (result.length > 0) {
                const usuario = result[0];


                return res.json({
                    msg: "Registrado",
                    //traemos todos los datos del usuario para el session storage
                    info: {
                        id: usuario.ID_Usuario, 
                        nombre: usuario.Nombre,
                        correo: usuario.Correo,
                        descripcion: usuario.Biografia,
                        fdn: usuario.fecha_nacimiento,
                        foto: usuario.fdp

                    }
                });
            } else {
                return res.json({ msg: "No encontrado" });
            }
        }
    );
});

//-- ENDPOINT DEL PERFIL (SOLO DATOS DEL USUARIO POR AHORA) --
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
        console.error("Error al obtener perfil:", err);
        return res.status(500).json({ msg: "Error interno del servidor" });
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
        console.error(error);
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
        console.log("BODY:", req.body);
        console.log("ID_USUARIO:", id_usuario);
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

        //Insertar la imagen en imagenes_publicacion
        const imagenBase64 = req.file.buffer.toString('base64');
        const queryImagen = `
            INSERT INTO imagenes_publicacion (ID_Publicacion, URL_Imagen, Portada, Orden)
            VALUES (?, ?, 1, 1)
        `;
        await db.promise().query(queryImagen, [id_publicacion, imagenBase64,]);

        return res.status(201).json({ msg: "Publicación creada con éxito", id_publicacion });

    } catch (err) {
        console.error("Error al crear publicación:", err);
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
        console.error("Error al obtener publicaciones:", err);
        return res.status(500).json({ msg: "Error en el servidor" });
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

        // si NO es all, filtra por categoría
        if (id_categoria !== 'all') {
            query += ` AND p.ID_Categoria = ?`;
            params.push(id_categoria);
        }

        query += ` ORDER BY p.FechaPublicacion DESC`;

        const [rows] = await db.promise().query(query, params);

        res.json(rows);

    } catch (err) {
        console.error(err);
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
        console.error("Error al obtener publicación:", err);
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
        console.error(err);
        return res.status(500).json({ msg: "Error en el servidor" });
    }
});


// --- ENDPOINT PARA COMISIONAR ---
app.post('/pedidos/crear', async (req, res) => {
    console.log("BODY RECIBIDO:", req.body);
    const { id_usuario, id_artista, id_publicacion, personalizacion, total, metodo_pago } = req.body;

    if (!id_usuario || !id_artista || !total) {
        return res.status(400).json({ msg: "Faltan campos obligatorios" });
    }

    try {
        const [result] = await db.promise().query(
            `INSERT INTO pedidos (ID_Usuario, ID_Artista, ID_Publicacion, Personalizacion, Total, MetodoPago, Estado)
             VALUES (?, ?, ?, ?, ?, ?, 'pendiente')`,
            [id_usuario, id_artista, id_publicacion || null, personalizacion || '', total, metodo_pago || '']
        );

        return res.status(201).json({ msg: "Pedido creado", id_pedido: result.insertId });
    } catch (err) {
        console.error("Error al crear pedido:", err);
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

// --- CANCELAR PEDIDO (solo si está pendiente o aprobado) ---
app.put('/pedidos/:id/cancelar', async (req, res) => {
    const { id } = req.params;

    try {
        // Verificar estado actual
        const [pedido] = await db.promise().query(
            'SELECT Estado FROM pedidos WHERE ID_Pedido = ?',
            [id]
        );

        if (pedido.length === 0) {
            return res.status(404).json({ msg: "Pedido no encontrado" });
        }

        const estadoActual = pedido[0].Estado;
        const permitidosCancelar = ['pendiente', 'aprobado'];

        if (!permitidosCancelar.includes(estadoActual)) {
            return res.status(400).json({ 
                msg: `No se puede cancelar el pedido porque está en estado "${estadoActual}". Solo se pueden cancelar pedidos pendientes o aprobados.` 
            });
        }

        await db.promise().query(
            'UPDATE pedidos SET Estado = "Cancelado" WHERE ID_Pedido = ?',
            [id]
        );

        res.json({ msg: "Pedido cancelado correctamente" });
    } catch (err) {
        console.error("Error al cancelar pedido:", err);
        res.status(500).json({ msg: "Error en el servidor" });
    }
});

// --- APROBAR PEDIDO (artista acepta la comisión) ---
app.put('/pedidos/:id/aprobar', async (req, res) => {
    const { id } = req.params;

    try {
        const [pedido] = await db.promise().query(
            'SELECT Estado FROM pedidos WHERE ID_Pedido = ?',
            [id]
        );

        if (pedido.length === 0) {
            return res.status(404).json({ msg: "Pedido no encontrado" });
        }

        if (pedido[0].Estado !== 'pendiente') {
            return res.status(400).json({ msg: "Solo se pueden aprobar pedidos en estado 'pendiente'" });
        }

        await db.promise().query(
            'UPDATE pedidos SET Estado = "aprobado" WHERE ID_Pedido = ?',
            [id]
        );

        res.json({ msg: "Pedido aprobado correctamente" });
    } catch (err) {
        console.error("Error al aprobar pedido:", err);
        res.status(500).json({ msg: "Error en el servidor" });
    }
});

// --- RECHAZAR PEDIDO (artista rechaza la comisión) ---
app.put('/pedidos/:id/rechazar', async (req, res) => {
    const { id } = req.params;

    try {
        const [pedido] = await db.promise().query(
            'SELECT Estado FROM pedidos WHERE ID_Pedido = ?',
            [id]
        );

        if (pedido.length === 0) {
            return res.status(404).json({ msg: "Pedido no encontrado" });
        }

        if (pedido[0].Estado !== 'pendiente') {
            return res.status(400).json({ msg: "Solo se pueden rechazar pedidos en estado 'pendiente'" });
        }

        await db.promise().query(
            'UPDATE pedidos SET Estado = "Cancelado" WHERE ID_Pedido = ?',
            [id]
        );

        res.json({ msg: "Pedido rechazado correctamente" });
    } catch (err) {
        console.error("Error al rechazar pedido:", err);
        res.status(500).json({ msg: "Error en el servidor" });
    }
});

// --- PAGAR PEDIDO (cliente paga, cambia a 'En proceso') ---
app.put('/pedidos/:id/pagar', async (req, res) => {
    const { id } = req.params;

    try {
        const [pedido] = await db.promise().query(
            'SELECT Estado FROM pedidos WHERE ID_Pedido = ?',
            [id]
        );

        if (pedido.length === 0) {
            return res.status(404).json({ msg: "Pedido no encontrado" });
        }

        if (pedido[0].Estado !== 'aprobado') {
            return res.status(400).json({ msg: "Solo se pueden pagar pedidos en estado 'aprobado'" });
        }

        await db.promise().query(
            'UPDATE pedidos SET Estado = "En proceso" WHERE ID_Pedido = ?',
            [id]
        );

        res.json({ msg: "Pago realizado. El pedido está en proceso." });
    } catch (err) {
        console.error("Error al procesar pago:", err);
        res.status(500).json({ msg: "Error en el servidor" });
    }
});

// --- ACTUALIZAR ESTADO GENERAL (para artista: Revision, Completado, etc.) ---
app.put('/pedidos/:id/estado', async (req, res) => {
    const { id } = req.params;
    const { nuevoEstado } = req.body;
    
    console.log(`🔄 Actualizando pedido ${id} a estado: ${nuevoEstado}`);

    const estadosValidos = ['pendiente', 'aprobado', 'En proceso', 'Revision', 'Completado', 'Cancelado'];

    if (!nuevoEstado || !estadosValidos.includes(nuevoEstado)) {
        return res.status(400).json({ msg: "Estado no válido" });
    }

    try {
        const [pedido] = await db.promise().query(
            'SELECT Estado FROM pedidos WHERE ID_Pedido = ?',
            [id]
        );

        if (pedido.length === 0) {
            return res.status(404).json({ msg: "Pedido no encontrado" });
        }

        // Validar transiciones permitidas
        const estadoActual = pedido[0].Estado;
        
        if (estadoActual === 'Completado' || estadoActual === 'Cancelado') {
            return res.status(400).json({ msg: `No se puede cambiar un pedido ${estadoActual}` });
        }

        await db.promise().query(
            'UPDATE pedidos SET Estado = ? WHERE ID_Pedido = ?',
            [nuevoEstado, id]
        );

        res.json({ msg: `Estado actualizado a "${nuevoEstado}"` });
    } catch (err) {
        console.error("Error al actualizar estado:", err);
        res.status(500).json({ msg: "Error en el servidor" });
    }
});

// --- ACTUALIZAR PUBLICACIÓN CON VALIDACIÓN DE PEDIDOS ACTIVOS ---
app.put('/api/publicacion/:id', async (req, res) => {
    console.log("🚨 ENTRÓ AL PUT", req.params.id, req.body);
    const { id } = req.params;
    const { titulo, descripcion, terminos, precio, id_categoria, metodo_pago, id_usuario } = req.body;

    if (!titulo || !descripcion || !precio || !id_categoria) {
        return res.status(400).json({ msg: "Faltan campos obligatorios" });
    }

    try {
        // 1. Verificar que la publicación pertenece al usuario
        const [publicacion] = await db.promise().query(
            'SELECT ID_Usuario, Precio FROM publicaciones WHERE ID_Publicacion = ?',
            [id]
        );

        if (publicacion.length === 0) {
            return res.status(404).json({ msg: "Publicación no encontrada" });
        }

        if (publicacion[0].ID_Usuario !== parseInt(id_usuario)) {
            return res.status(403).json({ msg: "No tienes permiso para editar esta publicación" });
        }

        // 2. Bloquear si hay pedidos activos
        const [pedidosActivos] = await db.promise().query(`
            SELECT ID_Pedido, Estado 
            FROM pedidos 
            WHERE ID_Publicacion = ? AND Estado IN ('aprobado', 'En proceso', 'Revision')
        `, [id]);

        console.log(`📊 Pedidos activos: ${pedidosActivos.length}`);

        if (pedidosActivos.length > 0) {
            const estadosList = pedidosActivos.map(p => p.Estado).join(', ');
            return res.status(400).json({ 
                msg: `No puedes editar esta publicación porque tiene ${pedidosActivos.length} pedido(s) en estado: ${estadosList}. Finaliza o cancela esos pedidos primero.`,
                pedidosActivos: pedidosActivos.length
            });
        }

        // 3. Actualizar
        await db.promise().query(`
            UPDATE publicaciones 
            SET Titulo = ?, Descripcion = ?, Precio = ?, TerminosCondiciones = ?, ID_Categoria = ?, MetodoPago = ?
            WHERE ID_Publicacion = ?
        `, [titulo, descripcion, parseFloat(precio), terminos, id_categoria, metodo_pago, id]);

        console.log("✅ Publicación actualizada");
        res.json({ msg: "Publicación actualizada correctamente" });

    } catch (err) {
        console.error("Error:", err);
        res.status(500).json({ msg: "Error en el servidor" });
    }
});



// --- OBTENER CATEGORÍAS ---
app.get('/categorias', async (req, res) => {
    try {
        const [categorias] = await db.promise().query('SELECT ID_Categoria, Nombre FROM categorias');
        res.json(categorias);
    } catch (err) {
        console.error("Error al obtener categorías:", err);
        res.status(500).json({ msg: "Error en el servidor" });
    }
});


// --- RUTAS DE NAVEGACIÓN ---
app.use('/', pageRoutes);

// --- INICIO DEL SERVIDOR ---
app.listen(puerto, () => {
    console.log(`Servidor corriendo en http://localhost:${puerto}`);
});

