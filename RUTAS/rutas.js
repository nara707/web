const express = require('express');
const router = express.Router();
const path = require('path');

router.get('/', (req, res) => {
    
    res.sendFile(path.join(__dirname, '../HTML/registro.html'));
});

router.get('/registro', (req, res) => {
    
    res.sendFile(path.join(__dirname, '../HTML/registro.html'));
});


router.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../HTML/log_in.html'));
});

router.get('/landing', (req, res) => {
    res.sendFile(path.join(__dirname, '../HTML/landing.html'));
});

router.get('/mi-perfil', (req, res) => {
    res.sendFile(path.join(__dirname, '../HTML/perfil.html'));
});

router.get('/new-post', (req, res) => {
    res.sendFile(path.join(__dirname, '../HTML/CrearPublicacion.html'));
});

router.get('/basket', (req, res) => {
    res.sendFile(path.join(__dirname, '../HTML/Basket.html'));
});

router.get('/artwork', (req, res) => {
    res.sendFile(path.join(__dirname, '../HTML/artwork.html'));
});

router.get('/comisionar', (req, res) => {
    res.sendFile(path.join(__dirname, '../HTML/comisionar.html'));
});

router.get('/perfil-usuario', (req, res) => {
    res.sendFile(path.join(__dirname, '../HTML/perfil-user.html'));
});

module.exports = router;