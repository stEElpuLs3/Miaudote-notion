// Uso unico: marca como confirmadas todas as contas que ja existiam
// antes de a confirmacao de e-mail entrar no ar.
require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const User = require('../models/User');

(async () => {
    try {
        if (!process.env.MONGODB_URI) {
            console.error('MONGODB_URI nao encontrado. Rode a partir da pasta backend.');
            process.exit(1);
        }

        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Conectado ao banco.');

        const antes = await User.countDocuments({ emailConfirmado: { $ne: true } });
        console.log('Contas sem confirmacao encontradas:', antes);

        const resultado = await User.updateMany(
            { emailConfirmado: { $ne: true } },
            { $set: { emailConfirmado: true } }
        );

        console.log('Contas atualizadas:', resultado.modifiedCount);
        await mongoose.disconnect();
        console.log('Pronto.');
    } catch (erro) {
        console.error('Falhou:', erro.message);
        process.exit(1);
    }
})();