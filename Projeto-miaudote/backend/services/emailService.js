const FRONTEND_URL = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
const REMETENTE_PADRAO = {
  name: 'Miaudote',
  email: process.env.EMAIL_USER,
};

function lerRemetente(from) {
  if (!from) return REMETENTE_PADRAO;
  const casou = /^\s*(.*?)\s*<\s*([^>]+?)\s*>\s*$/.exec(from);
  if (!casou) return { name: REMETENTE_PADRAO.name, email: String(from).trim() };
  return { name: casou[1] || REMETENTE_PADRAO.name, email: casou[2] };
}

function lerDestinatarios(to) {
  const lista = Array.isArray(to) ? to : String(to || '').split(',');
  return lista
    .map((endereco) => ({ email: String(endereco).trim() }))
    .filter((item) => item.email);
}

const transporter = {
  async sendMail({ from, to, subject, html, text }) {
    if (!process.env.BREVO_API_KEY) {
      throw new Error('BREVO_API_KEY nao definida');
    }

    const destinatarios = lerDestinatarios(to);
    if (destinatarios.length === 0) {
      throw new Error('E-mail sem destinatario');
    }

    const resposta = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': process.env.BREVO_API_KEY,
        'content-type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify({
        sender: lerRemetente(from),
        to: destinatarios,
        subject: subject || '(sem assunto)',
        htmlContent: html || `<p>${text || ''}</p>`,
      }),
    });

    if (!resposta.ok) {
      const detalhe = await resposta.text();
      throw new Error(`Brevo respondeu ${resposta.status}: ${detalhe}`);
    }

    return resposta.json();
  },

  verify(callback) {
    const erro = process.env.BREVO_API_KEY
      ? null
      : new Error('BREVO_API_KEY nao definida');
    if (typeof callback === 'function') return callback(erro, !erro);
    if (erro) throw erro;
    return true;
  },
};

// Verificar configuração
transporter.verify((error) => {
  if (error) {
    console.error('❌ Erro na configuração do email:', error.message);
  } else {
    console.log('✅ Servidor de email pronto! (Brevo API)');
  }
});

// Email de interesse em adoção
exports.enviarEmailInteresse = async (donoPet, interessado, pet) => {
  try {
    const mailOptions = {
      from: `Miaudote <${process.env.EMAIL_USER}>`,
      to: donoPet.email,
      subject: `🎉 Interesse em adotar ${pet.nome}!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1976d2;">Alguém está interessado no ${pet.nome}! 🐾</h2>
          
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Informações do Interessado:</h3>
            <p><strong>Nome:</strong> ${interessado.nome}</p>
            <p><strong>Email:</strong> ${interessado.email}</p>
            <p><strong>Telefone:</strong> ${interessado.telefone || 'Não informado'}</p>
          </div>

          <div style="background: #e3f2fd; padding: 15px; border-radius: 8px;">
            <h3>Sobre o Pet:</h3>
            <p><strong>Nome:</strong> ${pet.nome}</p>
            <p><strong>Espécie:</strong> ${pet.especie}</p>
            <p><strong>Raça:</strong> ${pet.raca || 'Não informada'}</p>
          </div>

          <p style="margin-top: 20px;">
            Entre em contato com o interessado o mais breve possível para conversarem sobre a adoção!
          </p>

          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
            <p style="color: #666; font-size: 14px;">
              Atenciosamente,<br>
              Equipe Miaudote 🐕🐈
            </p>
          </div>
        </div>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Email real enviado');
    return result;
  } catch (error) {
    console.error('❌ Erro ao enviar email real:', error.message);
    throw error;
  }
};

// Email de nova mensagem
exports.enviarEmailNovaMensagem = async (destinatario, remetente, pet) => {
  try {
    const mailOptions = {
      from: `Miaudote <${process.env.EMAIL_USER}>`,
      to: destinatario.email,
      subject: `💬 Nova mensagem sobre ${pet?.nome || 'adoção'}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1976d2;">Nova mensagem no Miaudote! ✉️</h2>
          
          <p>Você recebeu uma nova mensagem de <strong>${remetente.nome}</strong>.</p>
          
          ${pet ? `
          <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <p><strong>Pet:</strong> ${pet.nome}</p>
          </div>
          ` : ''}

          <p>
            <a href="${FRONTEND_URL}/mensagens"  
               style="background: #1976d2; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 4px; display: inline-block;">
              Ver Mensagem
            </a>
          </p>

          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
            <p style="color: #666; font-size: 14px;">
              Atenciosamente,<br>
              Equipe Miaudote 🐕🐈
            </p>
          </div>
        </div>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Email de mensagem enviado');
    return result;
  } catch (error) {
    console.error('❌ Erro ao enviar email de mensagem:', error.message);
    throw error;
  }
};