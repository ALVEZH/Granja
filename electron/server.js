const express = require('express');
const path = require('path');
const app = express();
const port = 3000;

// Servir archivos estáticos desde la carpeta web-build
app.use(express.static(path.join(__dirname, 'web-build')));

// Ruta para cualquier archivo que no se encuentre
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'web-build', 'index.html'));
});

app.listen(port, () => {
  console.log(`Servidor web ejecutándose en http://localhost:${port}`);
}); 