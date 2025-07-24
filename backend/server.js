require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./src/config/db');

const authRoutes = require('./src/routes/authRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const dataRoutes = require('./src/routes/dataRoutes'); // IMPORTAMOS AS ROTAS DE DADOS
const authMiddleware = require('./src/middleware/authMiddleware');

const app = express();

app.use(cors());
app.use(express.json());

// O servidor agora conhece todos os nossos conjuntos de rotas
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/data', dataRoutes); // USAMOS AS ROTAS DE DADOS

// Rota de teste geral (não precisa mais da /api/dados-protegidos)
app.get('/', (req, res) => {
    res.send('Servidor ARK Backend está no ar e funcionando!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});