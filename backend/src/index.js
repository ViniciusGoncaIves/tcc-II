require('dotenv').config();
const express = require('express');
const app = express();
const db = require('./configs');
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/', async (req, res) => {
  try {
    await db.query('SELECT 1');
    return res.status(200).json({
      message: 'conexão com o banco de dados realizada com sucesso'
    });
  } catch (erro) {
    return res.status(500).json({
      erro: `erro ao conectar ao banco de dados: ${erro.message}`
    });
  }
});

require('./routes')(app);

app.listen(PORT, () => {
  console.log(`api rodando na porta ${PORT}`)
});
