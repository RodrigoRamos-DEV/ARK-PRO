require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

// Importa os ficheiros de rotas
const authRoutes = require('./src/routes/authRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const dataRoutes = require('./src/routes/dataRoutes');
const partnerRoutes = require('./src/routes/partnerRoutes'); // <-- ADICIONADO

const app = express();

// Middlewares Globais
app.use(cors());
app.use(express.json());

// Torna a pasta 'uploads' publicamente acessível
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// --- Definição das Rotas da API ---
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/data', dataRoutes);
app.use('/api/partners', partnerRoutes); // <-- ADICIONADO


app.get('/', (req, res) => {
  res.send('Servidor ARK Backend está no ar!');
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});