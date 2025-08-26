const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');
const isDev = process.env.NODE_ENV === 'development';

function createWindow() {
  // Crear la ventana del navegador
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      webSecurity: false,
      allowRunningInsecureContent: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, 'assets', 'icon.ico'),
    show: false,
    titleBarStyle: 'default'
  });

  // Cargar la aplicación web
  const startUrl = isDev 
    ? 'http://localhost:19006' 
    : `file://${path.join(__dirname, '../web-build/index.html')}`;
  
  mainWindow.loadURL(startUrl);

  // Mostrar la ventana cuando esté lista
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
    // Abrir DevTools para debug
    mainWindow.webContents.openDevTools();
  });

  // Manejar cuando se cierra la ventana
  mainWindow.on('closed', () => {
    // En macOS es común que las aplicaciones permanezcan activas
    // hasta que se cierren explícitamente con Cmd + Q
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  // Crear menú personalizado
  const template = [
    {
      label: 'Archivo',
      submenu: [
        {
          label: 'Salir',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Ver',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// Este método se llamará cuando Electron haya terminado
// de inicializar y esté listo para crear ventanas del navegador
app.whenReady().then(createWindow);

// Salir cuando todas las ventanas estén cerradas
app.on('window-all-closed', () => {
  // En macOS es común que las aplicaciones permanezcan activas
  // hasta que se cierren explícitamente con Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // En macOS es común recrear una ventana en la aplicación cuando
  // se hace clic en el icono del dock y no hay otras ventanas abiertas
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// En este archivo puedes incluir el resto del código específico
// del proceso principal de tu aplicación. También puedes
// ponerlos en archivos separados y requerirlos aquí. 