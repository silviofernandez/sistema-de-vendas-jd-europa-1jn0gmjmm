onRecordAfterCreateSuccess((e) => {
  const record = e.record
  const email = record.getString('email')
  const nome = record.getString('nome') || 'Convidado'
  const telefone = record.getString('telefone') || 'Não informado'
  const token = record.getString('token')

  // Obtém URL do frontend
  let siteUrl = $os.getenv('SITE_URL') || ''
  if (!siteUrl) {
    siteUrl = 'https://sistema-de-vendas-jd-europa-6f1b6.goskip.dev'
  }
  if (siteUrl.endsWith('/')) {
    siteUrl = siteUrl.slice(0, -1)
  }

  const autorizarUrl = `${siteUrl}/autorizar?token=${token}`

  // Enviar e-mail ao master (gabsilvio@gmail.com)
  try {
    const masterEmail = 'gabsilvio@gmail.com'
    const subject = `Novo Pedido de Acesso: ${nome} - Sistema Jd Europa`

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #FAF7F2; border: 1px solid #E6DFD6; border-radius: 16px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h2 style="color: #C2501A; margin: 0;">Loteamento Jd Europa</h2>
          <p style="color: #6E675F; font-size: 14px; margin: 4px 0 0 0;">Sistema de Vendas & Simulador</p>
        </div>

        <div style="background: #ffffff; padding: 20px; border-radius: 12px; border: 1px solid #E6DFD6; margin-bottom: 24px;">
          <h3 style="color: #2E2A25; margin-top: 0; font-size: 18px;">Solicitação de Cadastro de Convidado</h3>
          <p style="color: #4A453E; font-size: 14px; line-height: 1.5;">
            Um novo corretor solicitou acesso ao Sistema de Vendas Jd Europa. Confira os dados informados:
          </p>

          <table style="width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 14px;">
            <tr>
              <td style="padding: 8px 0; color: #6E675F; width: 100px;">Nome:</td>
              <td style="padding: 8px 0; color: #2E2A25; font-weight: bold;">${nome}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6E675F;">E-mail:</td>
              <td style="padding: 8px 0; color: #2E2A25; font-weight: bold;">${email}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6E675F;">WhatsApp:</td>
              <td style="padding: 8px 0; color: #2E2A25; font-weight: bold;">${telefone}</td>
            </tr>
          </table>
        </div>

        <div style="text-align: center; margin-bottom: 24px;">
          <a href="${autorizarUrl}" style="display: inline-block; background-color: #C2501A; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-weight: bold; font-size: 15px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            Autorizar Acesso com 1 Clique
          </a>
        </div>

        <p style="color: #8C827A; font-size: 12px; text-align: center; margin: 0; line-height: 1.4;">
          Você também pode gerenciar todos os pedidos pendentes diretamente na tela de <b>Corretores</b> dentro do sistema.
          <br><br>
          Link direto: <a href="${autorizarUrl}" style="color: #C2501A;">${autorizarUrl}</a>
        </p>
      </div>
    `

    const message = new MailerMessage({
      from: { address: 'sistema@jdeuropa.com.br', name: 'Sistema Jd Europa' },
      to: [{ address: masterEmail, name: 'Silvio (Master)' }],
      subject: subject,
      html: htmlBody,
    })

    $app.newMailClient().send(message)
    console.log(`[notificacao] E-mail de novo pedido enviado para master: ${masterEmail}`)
  } catch (err) {
    // Tratar com fallback gracioso se não houver SMTP configurado
    console.warn(
      `[notificacao] Aviso: Falha ao enviar e-mail ao master (sem SMTP configurado ou indisponível): ${err}`,
    )
  }

  e.next()
}, 'pedidos_cadastro')
