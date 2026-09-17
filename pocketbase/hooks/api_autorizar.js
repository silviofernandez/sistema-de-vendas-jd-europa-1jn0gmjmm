// Endpoint público para consulta e aprovação de pedidos com token seguro
routerAdd('GET', '/backend/v1/autorizar', (e) => {
  const token = e.requestInfo().query.token || ''
  if (!token) {
    return e.json(400, { error: 'Token não fornecido' })
  }

  try {
    const pedido = $app.findFirstRecordByData('pedidos_cadastro', 'token', token)
    return e.json(200, {
      id: pedido.id,
      nome: pedido.getString('nome'),
      email: pedido.getString('email'),
      telefone: pedido.getString('telefone'),
      status: pedido.getString('status'),
      created: pedido.getString('created'),
    })
  } catch (err) {
    return e.json(404, { error: 'Pedido ou token não encontrado' })
  }
})

routerAdd('POST', '/backend/v1/autorizar', (e) => {
  const body = e.requestInfo().body || {}
  const token = body.token || ''
  const action = body.action || 'aprovar' // 'aprovar' ou 'rejeitar'

  if (!token) {
    return e.json(400, { error: 'Token não fornecido' })
  }

  let pedido
  try {
    pedido = $app.findFirstRecordByData('pedidos_cadastro', 'token', token)
  } catch (_) {
    return e.json(404, { error: 'Pedido não encontrado ou token inválido' })
  }

  if (pedido.getString('status') !== 'pendente') {
    return e.json(400, {
      error: `Este pedido já foi ${pedido.getString('status')}.`,
      status: pedido.getString('status'),
    })
  }

  const userId = pedido.getString('user_id')
  const email = pedido.getString('email')
  const nome = pedido.getString('nome')

  let userRecord = null
  if (userId) {
    try {
      userRecord = $app.findRecordById('_pb_users_auth_', userId)
    } catch (_) {}
  }
  if (!userRecord && email) {
    try {
      userRecord = $app.findAuthRecordByEmail('_pb_users_auth_', email)
    } catch (_) {}
  }

  if (action === 'rejeitar') {
    pedido.set('status', 'rejeitado')
    $app.save(pedido)

    if (userRecord) {
      userRecord.set('status', 'rejeitado')
      $app.save(userRecord)
    }

    return e.json(200, {
      success: true,
      status: 'rejeitado',
      message: 'Pedido rejeitado com sucesso.',
    })
  }

  // Ação de aprovar
  pedido.set('status', 'aprovado')
  $app.save(pedido)

  if (userRecord) {
    userRecord.set('status', 'aprovado')
    $app.save(userRecord)
  }

  // Enviar e-mail de confirmação ao corretor
  let emailEnviado = false
  try {
    let siteUrl = $os.getenv('SITE_URL') || ''
    if (!siteUrl) {
      siteUrl = 'https://sistema-de-vendas-jd-europa-6f1b6.goskip.dev'
    }
    if (siteUrl.endsWith('/')) {
      siteUrl = siteUrl.slice(0, -1)
    }
    const loginUrl = `${siteUrl}/login`

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #FAF7F2; border: 1px solid #E6DFD6; border-radius: 16px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h2 style="color: #C2501A; margin: 0;">Loteamento Jd Europa</h2>
          <p style="color: #6E675F; font-size: 14px; margin: 4px 0 0 0;">Sistema de Vendas & Simulador</p>
        </div>

        <div style="background: #ffffff; padding: 20px; border-radius: 12px; border: 1px solid #E6DFD6; margin-bottom: 24px; text-align: center;">
          <div style="display: inline-block; background-color: #E8F5E9; color: #2E7D32; font-size: 28px; width: 56px; height: 56px; line-height: 56px; border-radius: 28px; margin-bottom: 12px;">✓</div>
          <h3 style="color: #2E2A25; margin: 0 0 8px 0; font-size: 20px;">Olá, ${nome}! Seu acesso foi autorizado!</h3>
          <p style="color: #4A453E; font-size: 14px; line-height: 1.6; margin: 0 0 16px 0;">
            O administrador autorizou o seu cadastro no Sistema de Vendas Jd Europa. Você já pode acessar a plataforma utilizando o seu e-mail e a <b>senha que você definiu no momento do cadastro</b>.
          </p>

          <a href="${loginUrl}" style="display: inline-block; background-color: #C2501A; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: bold; font-size: 16px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            Entrar no Sistema
          </a>
        </div>

        <p style="color: #8C827A; font-size: 12px; text-align: center; margin: 0; line-height: 1.5;">
          Dica: Você também pode instalar o aplicativo direto no seu celular, tablet ou computador para acesso rápido!
          <br>
          Link de acesso: <a href="${loginUrl}" style="color: #C2501A;">${loginUrl}</a>
        </p>
      </div>
    `

    const message = new MailerMessage({
      from: { address: 'sistema@jdeuropa.com.br', name: 'Sistema Jd Europa' },
      to: [{ address: email, name: nome }],
      subject: 'Seu acesso ao Sistema Jd Europa foi autorizado! Entre agora',
      html: htmlBody,
    })

    $app.newMailClient().send(message)
    emailEnviado = true
    console.log(`[notificacao] E-mail de autorização enviado para corretor: ${email}`)
  } catch (err) {
    console.warn(`[notificacao] Falha ao enviar e-mail ao corretor (sem SMTP ou erro): ${err}`)
  }

  return e.json(200, {
    success: true,
    status: 'aprovado',
    emailEnviado: emailEnviado,
    message: 'Acesso autorizado com sucesso! O corretor já pode logar com a senha que definiu.',
  })
})
