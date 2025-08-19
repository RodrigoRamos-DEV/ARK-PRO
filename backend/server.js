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
const fixRoutes = require('./src/routes/fixRoutes');


const app = express();

// Middlewares Globais
app.use(cors({
    origin: [
        'http://localhost:5173',
        'https://ark-pro-app.onrender.com'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
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
app.use('/api/fix', fixRoutes);



// Middleware de tratamento de erro global
app.use((err, req, res, next) => {
    console.error('Erro não tratado:', err);
    console.error('Stack:', err.stack);
    res.status(500).json({ 
        error: 'Erro interno do servidor', 
        message: err.message,
        timestamp: new Date().toISOString()
    });
});

app.get('/', (req, res) => {
  res.send('Servidor ARK Backend está no ar!');
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});