migrate(
  (app) => {
    // 1. configuracoes
    const configuracoes = new Collection({
      name: 'configuracoes',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'valor_m2', type: 'number', required: true },
        { name: 'entrada_minima', type: 'number', required: true },
        { name: 'fator_24', type: 'number', required: true },
        { name: 'fator_36', type: 'number', required: true },
        { name: 'fator_48', type: 'number', required: true },
        { name: 'ipca_anual', type: 'number', required: true },
        { name: 'max_parcelas', type: 'number', required: true },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(configuracoes)

    // 2. lotes
    const lotes = new Collection({
      name: 'lotes',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'quadra',
          type: 'select',
          required: true,
          maxSelect: 1,
          values: ['S1', 'T1', 'U1', 'V1', 'W1', 'Y1'],
        },
        { name: 'nome', type: 'text' },
        { name: 'largura', type: 'number', required: true, min: 0 },
        { name: 'comprimento', type: 'number', required: true, min: 0 },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_lotes_quadra ON lotes (quadra)'],
    })
    app.save(lotes)

    // 3. clientes
    const clientes = new Collection({
      name: 'clientes',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'nome', type: 'text', required: true },
        { name: 'telefone', type: 'text' },
        { name: 'email', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_clientes_nome ON clientes (nome)'],
    })
    app.save(clientes)

    // 4. propostas
    const clientesCol = app.findCollectionByNameOrId('clientes')
    const lotesCol = app.findCollectionByNameOrId('lotes')

    const propostas = new Collection({
      name: 'propostas',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'cliente',
          type: 'relation',
          collectionId: clientesCol.id,
          cascadeDelete: false,
          maxSelect: 1,
        },
        {
          name: 'lote',
          type: 'relation',
          collectionId: lotesCol.id,
          cascadeDelete: false,
          maxSelect: 1,
        },
        { name: 'quadra', type: 'text', required: true },
        { name: 'area_m2', type: 'number', required: true },
        { name: 'valor_m2', type: 'number', required: true },
        { name: 'valor_total_lote', type: 'number', required: true },
        { name: 'entrada', type: 'number', required: true },
        { name: 'valor_financiado', type: 'number', required: true },
        { name: 'num_parcelas', type: 'number', required: true },
        { name: 'parcela_mensal', type: 'number', required: true },
        { name: 'ipca_anual', type: 'number', required: true },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_propostas_cliente ON propostas (cliente)',
        'CREATE INDEX idx_propostas_created ON propostas (created DESC)',
      ],
    })
    app.save(propostas)
  },
  (app) => {
    try {
      const propostas = app.findCollectionByNameOrId('propostas')
      app.delete(propostas)
    } catch (_) {}
    try {
      const clientes = app.findCollectionByNameOrId('clientes')
      app.delete(clientes)
    } catch (_) {}
    try {
      const lotes = app.findCollectionByNameOrId('lotes')
      app.delete(lotes)
    } catch (_) {}
    try {
      const configuracoes = app.findCollectionByNameOrId('configuracoes')
      app.delete(configuracoes)
    } catch (_) {}
  },
)
