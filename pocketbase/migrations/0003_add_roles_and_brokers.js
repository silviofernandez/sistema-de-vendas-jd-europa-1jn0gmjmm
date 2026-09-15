migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')

    // 1. Adicionar campo 'role' ('master' | 'corretor') caso não exista
    if (!users.fields.getByName('role')) {
      users.fields.add(
        new SelectField({
          name: 'role',
          required: false,
          maxSelect: 1,
          values: ['master', 'corretor'],
        }),
      )
    }

    // 2. Adicionar campo 'telefone' para contato/WhatsApp do corretor caso não exista
    if (!users.fields.getByName('telefone')) {
      users.fields.add(
        new TextField({
          name: 'telefone',
          required: false,
        }),
      )
    }

    // 3. Atualizar regras de acesso de users:
    // listRule e viewRule: autenticado pode ver (necessário para master listar corretores e para checar perfis)
    // createRule: master pode criar novo usuário (ou se for o primeiro)
    // updateRule: master pode atualizar qualquer um, ou próprio usuário
    // deleteRule: apenas master pode deletar corretores
    users.listRule = "@request.auth.id != ''"
    users.viewRule = "@request.auth.id != ''"
    users.createRule = "@request.auth.id != '' && @request.auth.role = 'master'"
    users.updateRule =
      "@request.auth.id != '' && (@request.auth.role = 'master' || id = @request.auth.id)"
    users.deleteRule =
      "@request.auth.id != '' && @request.auth.role = 'master' && id != @request.auth.id"

    app.save(users)

    // 4. Garantir que gabsilvio@gmail.com vire master
    try {
      const adminUser = app.findAuthRecordByEmail('_pb_users_auth_', 'gabsilvio@gmail.com')
      adminUser.set('role', 'master')
      adminUser.set('name', 'Silvio (Master)')
      app.save(adminUser)
    } catch (_) {}
  },
  (app) => {
    // Reverter regras e campos caso necessário
    try {
      const users = app.findCollectionByNameOrId('_pb_users_auth_')
      users.listRule = 'id = @request.auth.id'
      users.viewRule = 'id = @request.auth.id'
      users.createRule = ''
      users.updateRule = 'id = @request.auth.id'
      users.deleteRule = 'id = @request.auth.id'
      app.save(users)
    } catch (_) {}
  },
)
