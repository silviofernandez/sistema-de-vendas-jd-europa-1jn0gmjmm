migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')

    // 1. Adicionar campo 'status' ('aprovado' | 'pendente' | 'rejeitado') em users
    if (!users.fields.getByName('status')) {
      users.fields.add(
        new SelectField({
          name: 'status',
          required: false,
          maxSelect: 1,
          values: ['aprovado', 'pendente', 'rejeitado'],
        }),
      )
    }

    // 2. Atualizar regras de users:
    // listRule e viewRule: autenticado pode ver
    // createRule: aberto para novos registros (como corretor) ou master
    users.listRule = "@request.auth.id != ''"
    users.viewRule = "@request.auth.id != ''"
    users.createRule = "@request.auth.id = '' || @request.auth.role = 'master'"
    users.updateRule =
      "@request.auth.id != '' && (@request.auth.role = 'master' || id = @request.auth.id)"
    users.deleteRule =
      "@request.auth.id != '' && @request.auth.role = 'master' && id != @request.auth.id"

    app.save(users)

    // Atualiza status dos usuários existentes para 'aprovado'
    app
      .db()
      .newQuery("UPDATE users SET status = 'aprovado' WHERE status IS NULL OR status = ''")
      .execute()

    // 3. Criar collection 'pedidos_cadastro'
    // Armazena solicitações de cadastro, token exclusivo de aprovação e histórico
    try {
      app.findCollectionByNameOrId('pedidos_cadastro')
    } catch (_) {
      const pedidos = new Collection({
        name: 'pedidos_cadastro',
        type: 'base',
        // Master pode listar, visualizar, atualizar e deletar pedidos.
        // Público (convidado não logado) pode criar pedidos ao preencher "Criar Conta".
        // Leitura com token específico é tratada no endpoint público /backend/v1/autorizar ou regras
        listRule: "@request.auth.id != '' && @request.auth.role = 'master'",
        viewRule: "(@request.auth.id != '' && @request.auth.role = 'master') || token != ''",
        createRule: '', // público pode solicitar cadastro
        updateRule: "@request.auth.id != '' && @request.auth.role = 'master'",
        deleteRule: "@request.auth.id != '' && @request.auth.role = 'master'",
        fields: [
          { name: 'nome', type: 'text', required: true },
          { name: 'email', type: 'email', required: true },
          { name: 'telefone', type: 'text', required: false },
          {
            name: 'status',
            type: 'select',
            required: false,
            values: ['pendente', 'aprovado', 'rejeitado'],
            maxSelect: 1,
          },
          { name: 'token', type: 'text', required: true },
          {
            name: 'user_id',
            type: 'relation',
            required: false,
            collectionId: '_pb_users_auth_',
            maxSelect: 1,
          },
          { name: 'observacao', type: 'text', required: false },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE UNIQUE INDEX idx_pedidos_token ON pedidos_cadastro (token)',
          'CREATE INDEX idx_pedidos_status ON pedidos_cadastro (status)',
          'CREATE INDEX idx_pedidos_email ON pedidos_cadastro (email)',
        ],
      })
      app.save(pedidos)
    }
  },
  (app) => {
    try {
      const pedidos = app.findCollectionByNameOrId('pedidos_cadastro')
      app.delete(pedidos)
    } catch (_) {}
  },
)
