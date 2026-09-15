migrate(
  (app) => {
    // 1. Seed Usuário Admin/Corretor
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    try {
      app.findAuthRecordByEmail('_pb_users_auth_', 'gabsilvio@gmail.com')
    } catch (_) {
      const user = new Record(users)
      user.setEmail('gabsilvio@gmail.com')
      user.setPassword('Skip@Pass')
      user.setVerified(true)
      user.set('name', 'Silvio Corretor')
      app.save(user)
    }

    // 2. Seed Configurações (registro padrão se não existir)
    const configCol = app.findCollectionByNameOrId('configuracoes')
    const existingConfigs = app.findRecordsByFilter(
      'configuracoes',
      'valor_m2 > 0',
      '-created',
      1,
      0,
    )
    if (existingConfigs.length === 0) {
      const configRecord = new Record(configCol)
      configRecord.set('valor_m2', 450)
      configRecord.set('entrada_minima', 20000)
      configRecord.set('fator_24', 0.0470735)
      configRecord.set('fator_36', 0.0332143)
      configRecord.set('fator_48', 0.0263338)
      configRecord.set('ipca_anual', 4.5)
      configRecord.set('max_parcelas', 48)
      app.save(configRecord)
    }

    // 3. Seed Lotes de Exemplo
    const lotesCol = app.findCollectionByNameOrId('lotes')
    const lotesCount = app.countRecords('lotes')
    if (lotesCount === 0) {
      const lotesData = [
        { quadra: 'S1', nome: 'Lote 04', largura: 12, comprimento: 25 }, // 300m²
        { quadra: 'T1', nome: 'Lote 12', largura: 15, comprimento: 30 }, // 450m²
        { quadra: 'U1', nome: 'Lote 08', largura: 10, comprimento: 25 }, // 250m²
        { quadra: 'V1', nome: 'Lote 15', largura: 14, comprimento: 28 }, // 392m²
        { quadra: 'W1', nome: 'Lote 20', largura: 12.5, comprimento: 26 }, // 325m²
        { quadra: 'Y1', nome: 'Lote 01', largura: 16, comprimento: 30 }, // 480m²
      ]

      for (let i = 0; i < lotesData.length; i++) {
        const item = lotesData[i]
        const rec = new Record(lotesCol)
        rec.set('quadra', item.quadra)
        rec.set('nome', item.nome)
        rec.set('largura', item.largura)
        rec.set('comprimento', item.comprimento)
        app.save(rec)
      }
    }

    // 4. Seed Clientes de Exemplo
    const clientesCol = app.findCollectionByNameOrId('clientes')
    const clientesCount = app.countRecords('clientes')
    if (clientesCount === 0) {
      const clientesData = [
        {
          nome: 'Carlos Eduardo Mendes',
          telefone: '(11) 98765-4321',
          email: 'carlos.mendes@email.com',
        },
        { nome: 'Ana Paula Ferreira', telefone: '(11) 97654-3210', email: 'ana.paula@email.com' },
        {
          nome: 'Roberto Silva Santos',
          telefone: '(19) 99123-4567',
          email: 'roberto.santos@email.com',
        },
        {
          nome: 'Juliana Martins Costa',
          telefone: '(19) 98877-6655',
          email: 'juliana.martins@email.com',
        },
      ]

      for (let i = 0; i < clientesData.length; i++) {
        const item = clientesData[i]
        const rec = new Record(clientesCol)
        rec.set('nome', item.nome)
        rec.set('telefone', item.telefone)
        rec.set('email', item.email)
        app.save(rec)
      }
    }

    // 5. Seed Propostas de Exemplo
    const propostasCol = app.findCollectionByNameOrId('propostas')
    const propostasCount = app.countRecords('propostas')
    if (propostasCount === 0) {
      try {
        const primeiroCliente = app.findFirstRecordByData(
          'clientes',
          'nome',
          'Carlos Eduardo Mendes',
        )
        const primeiroLote = app.findFirstRecordByData('lotes', 'nome', 'Lote 04')

        // Lote 04: 300m² * 450 = R$ 135.000. Entrada 25.000 -> Financiado 110.000. 48x -> fator 0.0263338 -> 2.896,72
        const prop1 = new Record(propostasCol)
        prop1.set('cliente', primeiroCliente.id)
        prop1.set('lote', primeiroLote.id)
        prop1.set('quadra', 'S1')
        prop1.set('area_m2', 300)
        prop1.set('valor_m2', 450)
        prop1.set('valor_total_lote', 135000)
        prop1.set('entrada', 25000)
        prop1.set('valor_financiado', 110000)
        prop1.set('num_parcelas', 48)
        prop1.set('parcela_mensal', 2896.72)
        prop1.set('ipca_anual', 4.5)
        app.save(prop1)

        const segundoCliente = app.findFirstRecordByData('clientes', 'nome', 'Ana Paula Ferreira')
        // Lote 250m² * 450 = R$ 112.500. Entrada 20.000 -> Financiado 92.500. 36x -> fator 0.0332143 -> 3.072,32
        const prop2 = new Record(propostasCol)
        prop2.set('cliente', segundoCliente.id)
        prop2.set('quadra', 'U1')
        prop2.set('area_m2', 250)
        prop2.set('valor_m2', 450)
        prop2.set('valor_total_lote', 112500)
        prop2.set('entrada', 20000)
        prop2.set('valor_financiado', 92500)
        prop2.set('num_parcelas', 36)
        prop2.set('parcela_mensal', 3072.32)
        prop2.set('ipca_anual', 4.5)
        app.save(prop2)
      } catch (_) {}
    }
  },
  (app) => {
    // Revert seed if needed
  },
)
