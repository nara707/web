const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;

module.exports = (db) => {  // ← recibe db como parámetro directo

  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: 'http://localhost:3001/auth/google/callback'
  },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;
        const nombre = profile.displayName;
        const googleId = profile.id;
        const foto = profile.photos?.[0]?.value || null;

        const [rows] = await db.promise().query(
          'SELECT * FROM Usuario WHERE google_id = ? OR Correo = ?',
          [googleId, email]
        );

        if (rows.length > 0) {
          await db.promise().query(
            'UPDATE Usuario SET google_id = ?, foto_google = ? WHERE Correo = ?',
            [googleId, foto, email]
          );
          return done(null, rows[0]);
        }

        const [result] = await db.promise().query(
          `INSERT INTO Usuario (Nombre, Correo, google_id, foto_google, Activo, Fecha_Registro)
           VALUES (?, ?, ?, ?, 1, NOW())`,
          [nombre, email, googleId, foto]
        );

        const [newUser] = await db.promise().query(
          'SELECT * FROM Usuario WHERE ID_Usuario = ?',
          [result.insertId]
        );

        return done(null, newUser[0]);

      } catch (err) {
        return done(err, null);
      }
    }
  ));

  passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_CLIENT_ID,
    clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
    callbackURL: "http://localhost:3001/auth/facebook/callback",
    profileFields: ['id', 'displayName', 'emails', 'photos']
  },
    async (accessToken, refreshToken, profile, done) => {

      try {

        const correo = profile.emails?.[0]?.value;

        // Buscar usuario existente
        const [rows] = await db.promise().query(
          'SELECT * FROM usuario WHERE facebook_id = ? OR Correo = ?',
          [profile.id, correo]
        );

        let usuario;

        if (rows.length > 0) {

          usuario = rows[0];

          // actualizar facebook_id si no existe
          if (!usuario.facebook_id) {
            await db.promise().query(
              'UPDATE usuario SET facebook_id = ? WHERE ID_Usuario = ?',
              [profile.id, usuario.ID_Usuario]
            );
          }

        } else {

          const foto = profile.photos?.[0]?.value || null;

          const [result] = await db.promise().query(`
                INSERT INTO usuario
                (Nombre, Correo, facebook_id, foto_facebook, Biografia)
                VALUES (?, ?, ?, ?, ?)
            `, [
            profile.displayName,
            correo,
            profile.id,
            foto,
            'Sin biografía'
          ]);

          const [nuevoUsuario] = await db.promise().query(
            'SELECT * FROM usuario WHERE ID_Usuario = ?',
            [result.insertId]
          );

          usuario = nuevoUsuario[0];
        }

        return done(null, usuario);

      } catch (err) {
        console.error(err);
        return done(err, null);
      }

    }));

  passport.serializeUser((user, done) => {
    done(null, user.ID_Usuario);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const [rows] = await db.promise().query(
        'SELECT * FROM Usuario WHERE ID_Usuario = ?', [id]
      );
      done(null, rows[0]);
    } catch (err) {
      done(err, null);
    }
  });

  return passport;
};