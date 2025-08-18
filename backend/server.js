require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

// Importa os ficheiros de rotas
const authRoutes = require('./src/routes/authRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const dataRoutes = require('./src/routes/dataRoutes');
const partnerRoutes = require('./src/routes/partnerRoutes');
const licenseRoutes = require('./src/routes/licenseRoutes');
const backupRoutes = require('./src/routes/backupRoutes');
const auditRoutes = require('./src/routes/auditRoutes');
const importExportRoutes = require('./src/routes/importExportRoutes');
const feiraRoutes = require('./src/routes/feira');
const adminNotificationRoutes = require('./src/routes/admin');
const migrateRoutes = require('./src/routes/migrate');
const syncRoutes = require('./src/routes/syncRoutes');


const app = express();

// Middlewares Globais
app.use(cors());
app.use(express.json());

// Log de todas as requisições
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Torna a pasta 'uploads' publicamente acessível
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// --- Definição das Rotas da API ---
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/data', dataRoutes);
app.use('/api/partners', partnerRoutes);
app.use('/api/license', licenseRoutes);
app.use('/api/backup', backupRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api', importExportRoutes);
app.use('/api/feira', feiraRoutes);
app.use('/api/admin', adminNotificationRoutes);
app.use('/api/migrate', migrateRoutes);
app.use('/api/sync', syncRoutes);

// Servir arquivos estáticos do frontend (DEPOIS das rotas da API)
app.use(express.static(path.join(__dirname, 'dist')));

// Rota catch-all para SPA (Single Page Application)
app.get('*', (req, res) => {
  // Se não for uma rota da API, serve o index.html
  if (!req.path.startsWith('/api/')) {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  } else {
    res.status(404).json({ error: 'API endpoint not found' });
  }
});

app.get('/', (req, res) => {
  res.send('Servidor ARK Backend está no ar!');
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});