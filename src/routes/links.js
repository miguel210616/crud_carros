const express = require('express');
const formidable = require('formidable');
const router = express.Router();    
const multer = require("multer");
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

cloudinary.config({
    cloud_name: 'imagecars',
    api_key: 975435936796419,
    api_secret: 'hN-4JCfLMO1vMT2oMltp2cjLNPQ'
  });

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: "CARRITOS",
    },
  });

const upload = multer({ storage: storage });

const pool = require('../database');
const { isLoggedIn } = require('../lib/auth');

router.get('/add', (req, res) => {
    res.render('carros/add');
});



router.post('/add', async (req, res) => {
    const form = new formidable.IncomingForm();
    console.log(form);
    form.parse(req, async (err, fields, files) => {
        // console.log(fields);
        // console.log(files.imagen.newFilename);
        //console.log(files.imagen.filepath);
        await cloudinary.uploader.upload(files.imagen.filepath,{public_id:`${files.imagen.newFilename}`}, function(error, result)  
        {console.log(result, error)});
        
        var imagenurl= await cloudinary.url(`${files.imagen.newFilename}`);
        console.log(imagenurl);
        const { marca, modelo, cantidad, generacion, description } = fields;
        const newLink = {
            marca,
            modelo,
            cantidad,
            generacion,
            description,
            user_id: req.user.id,
            imagen:imagenurl
        };
        await pool.query('INSERT INTO cars set ?', [newLink]);
        req.flash('success', 'Carro almacenado correctamente');
        res.redirect('/carros');
      });
});

router.get('/', isLoggedIn, async (req, res) => {
    const links = await pool.query('SELECT * FROM cars WHERE user_id = ?', [req.user.id]);

    res.render('carros/list', { links });
});

router.get('/delete/:id', async (req, res) => {
    const { id } = req.params;
    await pool.query('DELETE FROM cars WHERE ID = ?', [id]);
    req.flash('success', 'Carro eliminado correctamente');
    res.redirect('/carros');
});

router.get('/edit/:id', async (req, res) => {
    const { id } = req.params;
    const links = await pool.query('SELECT * FROM cars WHERE id = ?', [id]);
    console.log(links);
    res.render('carros/edit', {link: links[0]});
});

router.post('/edit/:id', async (req, res) => {
    const form = new formidable.IncomingForm();
    console.log(form);
    form.parse(req, async (err, fields, files) => {
        await cloudinary.uploader.upload(files.imagen.filepath,{public_id:`${files.imagen.newFilename}`}, function(error, result)  
        {console.log(result, error)});
        var imagenurl2= await cloudinary.url(`${files.imagen.newFilename}`);
        const { id } = req.params;
        const {  marca, modelo, cantidad, generacion, description} = fields; 
        const newLink = {
            marca,
            modelo,
            cantidad,
            generacion,
            description,
            imagen:imagenurl2
        };
        await pool.query('UPDATE cars set ? WHERE id = ?', [newLink, id]);
        req.flash('success', 'Carro actualizado correctamente');
        res.redirect('/carros');
    });
});

module.exports = router;