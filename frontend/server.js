const express = require('express');
const path = require('path');
const app = express();

// Ruta a la carpeta de producción de Angular
const staticPath = path.join(__dirname, 'dist/frontend/browser');

// 1. Sirve los archivos estáticos (main.js, styles.css, etc.)
//    Si Express encuentra el archivo, lo envía y no continúa.
app.use(express.static(staticPath));

// 2. Middleware "Catch-All".
//    Esta función se ejecutará para CUALQUIER petición que no haya sido
//    manejada por express.static. No analiza la ruta, por lo que no puede fallar.
//    Simplemente devuelve la aplicación principal de Angular.
app.use((req, res, next) => {
    res.sendFile(path.join(staticPath, 'index.html'));
});

// Inicia el servidor
const port = process.env.PORT || 4200;
app.listen(port);

console.log(`Servidor de Frontend (Express) corriendo en http://localhost:${port}`);
