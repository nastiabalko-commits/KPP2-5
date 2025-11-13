
const { app, BrowserWindow } = require('electron');
const path = require('path');

// Функція для створення вікна
const createWindow = () => {
  // Створюємо нове вікно браузера
  const win = new BrowserWindow({
    width: 800,
    height: 600
  });

  // Завантажуємо файл index.html у це вікно
  win.loadFile('index.html');
};

// Викликаємо функцію createWindow(), коли Electron готовий
app.whenReady().then(() => {
  createWindow();

  
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});


app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
