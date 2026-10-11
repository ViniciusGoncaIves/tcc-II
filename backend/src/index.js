require('dotenv').config();
const express = require('express');
const app = express();
const db = require('./configs');
const { rotaNaoEncontrada, tratarErros } = require('./middlewares/tratadorErros');
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/', async (req, res) => {
  try {
    await db.query('SELECT 1');
    return res.status(200).json({
      message: 'conexão com o banco de dados realizada com sucesso'
    });
  } catch (LErro) {
    return res.status(500).json({
      erro: `erro ao conectar ao banco de dados: ${LErro.message}`
    });
  }
});

require('./routes')(app);

app.use(rotaNaoEncontrada);
app.use(tratarErros);

app.listen(PORT, () => {
  console.log(`api rodando na porta ${PORT}`)
});
