create database pia_pw2;
use pia_pw2;

CREATE TABLE Usuario (
    ID_Usuario INT AUTO_INCREMENT PRIMARY KEY,
    Nombre VARCHAR(100) NOT NULL,
    Correo VARCHAR(100) UNIQUE NOT NULL,
    Contraseña VARCHAR(255) NOT NULL,
    Biografia TEXT,
    Avatar_URL VARCHAR(500),
    FechaNacimiento DATE,
    Fecha_Registro DATETIME DEFAULT CURRENT_TIMESTAMP,
    Activo BOOLEAN DEFAULT TRUE
);


CREATE TABLE Categorias (
    ID_Categoria INT AUTO_INCREMENT PRIMARY KEY,
    Nombre VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE Publicaciones (
    ID_Publicacion INT AUTO_INCREMENT PRIMARY KEY,
    ID_Usuario INT NOT NULL,
    Titulo VARCHAR(200) NOT NULL,
    Descripcion TEXT,
    Precio DECIMAL(10,2) NOT NULL,
    TerminosCondiciones TEXT,
    FechaPublicacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    Activa BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (ID_Usuario) REFERENCES Usuario(ID_Usuario) ON DELETE RESTRICT
);

CREATE TABLE Imagenes_Publicacion (
    ID_Imagen INT AUTO_INCREMENT PRIMARY KEY,
    ID_Publicacion INT NOT NULL,
    URL_Imagen VARCHAR(500) NOT NULL,
    Portada BOOLEAN DEFAULT FALSE,
    Orden INT DEFAULT 0,
    FOREIGN KEY (ID_Publicacion) REFERENCES Publicaciones(ID_Publicacion) ON DELETE CASCADE
);

CREATE TABLE Pedidos (
    ID_Pedido INT AUTO_INCREMENT PRIMARY KEY,
    ID_Usuario INT NOT NULL, -- El cliente que hace el pedido
    ID_Artista INT NOT NULL, -- El artista que recibe el pedido
    Fecha_Pedido DATETIME DEFAULT CURRENT_TIMESTAMP,
    Estado ENUM('pendiente', 'aprobado', 'En proceso', 'Revision', 'Completado', 'Cancelado') DEFAULT 'pendiente',
    Personalizacion TEXT, 
    Total DECIMAL(10,2) NOT NULL,
    MetodoPago VARCHAR(50),
    FOREIGN KEY (ID_Usuario) REFERENCES Usuario(ID_Usuario) ON DELETE RESTRICT,
    FOREIGN KEY (ID_Artista) REFERENCES Usuario(ID_Usuario) ON DELETE RESTRICT
);

CREATE TABLE Reseñas (
    ID_Reseña INT AUTO_INCREMENT PRIMARY KEY,
    ID_Pedido INT NOT NULL, 
    ID_Usuario INT NOT NULL, 
    ID_Artista INT NOT NULL, 
    Puntuacion INT CHECK (Puntuacion BETWEEN 1 AND 5),
    Comentario TEXT,
    Fecha_Reseña DATETIME DEFAULT CURRENT_TIMESTAMP,
    Activa BOOLEAN DEFAULT TRUE,
    UNIQUE KEY unique_pedido (ID_Pedido),
    FOREIGN KEY (ID_Pedido) REFERENCES Pedidos(ID_Pedido) ON DELETE CASCADE,
    FOREIGN KEY (ID_Usuario) REFERENCES Usuario(ID_Usuario) ON DELETE CASCADE,
    FOREIGN KEY (ID_Artista) REFERENCES Usuario(ID_Usuario) ON DELETE CASCADE
);

CREATE TABLE Historial (
    ID_Historial INT AUTO_INCREMENT PRIMARY KEY,
    ID_Usuario INT NOT NULL,
    ID_Pedido INT NOT NULL, 
    Tipo ENUM('compra', 'venta') NOT NULL, 
    FOREIGN KEY (ID_Usuario) REFERENCES Usuario(ID_Usuario) ON DELETE CASCADE,
    FOREIGN KEY (ID_Pedido) REFERENCES Pedidos(ID_Pedido) ON DELETE CASCADE
);


CREATE TABLE Publicacion_Categoria (
    ID_Pub_Cat INT AUTO_INCREMENT PRIMARY KEY,
    ID_Publicacion INT NOT NULL,
    ID_Categoria INT NOT NULL,
    UNIQUE KEY unique_publicacion_categoria (ID_Publicacion, ID_Categoria),
    FOREIGN KEY (ID_Publicacion) REFERENCES Publicaciones(ID_Publicacion) ON DELETE CASCADE,
    FOREIGN KEY (ID_Categoria) REFERENCES Categorias(ID_Categoria) ON DELETE CASCADE
);


CREATE TABLE Mensajes_Pedido (
    ID_Mensaje INT AUTO_INCREMENT PRIMARY KEY,
    ID_Pedido INT NOT NULL,
    ID_Emisor INT NOT NULL,
    Contenido TEXT NOT NULL,
    Boceto_URL VARCHAR(500), 
    FechaEnvio DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ID_Pedido) REFERENCES Pedidos(ID_Pedido),
    FOREIGN KEY (ID_Emisor) REFERENCES Usuario(ID_Usuario)
);


ALTER TABLE Usuario 
CHANGE Contraseña contrasena VARCHAR(255) NOT NULL;


ALTER TABLE Usuario 
CHANGE Avatar_URL fdp LONGTEXT;

ALTER TABLE Usuario 
CHANGE FechaNacimiento fecha_nacimiento DATE;


select * from Usuario;
select * from publicaciones;

INSERT INTO categorias (Nombre) VALUES ('Ilustracion'), ('Moda'), ('Fotografia'), ('Diseño'), ('Tatuajes'),('Animacion'),('Diseño de Personajes') ;

ALTER TABLE imagenes_publicacion
CHANGE URL_Imagen URL_Imagen LONGTEXT;

ALTER TABLE publicaciones 
ADD COLUMN ID_Categoria INT,
ADD COLUMN MetodoPago VARCHAR(50);

-- modificacion de la tabla de usuario y nuevas tablas relacionadas --