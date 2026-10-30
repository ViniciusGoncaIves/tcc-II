require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const app = express();
const db = require('./configs');
const agendador = require('./jobs/alertas');
const tempo = require('./configs/tempo');
const whatsapp = require('./integrations/whatsapp');
const respostas = require('./services/respostas');
const {
  rotaNaoEncontrada,
  tratarErros
} = require('./middlewares/tratadorErros');
const PORT = process.env.PORT || 3000;

app.use(helmet());
// Só o endereço do front pode chamar a API pelo navegador; sem FRONTEND_URL, nenhum site é liberado.
app.use(cors({ origin: process.env.FRONTEND_URL || false }));
app.use(express.json());

app.get('/', async (req, res) => {
  try {
    await db.query('SELECT 1');
    return res.status(200).json({
      mensagem: 'conexão com o banco de dados realizada com sucesso'
    });
  } catch (LErro) {
    console.error(
      `erro ao conectar ao banco de dados: ${LErro.message || LErro.code}`
    );
    return res.status(500).json({
      erro: 'não foi possível conectar ao banco de dados'
    });
  }
});

require('./routes')(app);

app.use(rotaNaoEncontrada);
app.use(tratarErros);

app.listen(PORT, () => {
  console.log(`api rodando na porta ${PORT}`);
  if (tempo.TESTE_ACELERADO) {
    console.warn(
      `MODO DE TESTE ACELERADO: 1 hora = ${tempo.MINUTOS_POR_HORA_TESTE} minuto(s). Não use com pacientes reais.`
    );
  }
  whatsapp.definirTratadores(respostas.tratadores);
  whatsapp.iniciar();
  agendador.iniciarAgendador();
});
