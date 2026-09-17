migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')

    // Permitir criação pública (auto-registro de corretores) ou por master logado:
    // Se não estiver logado (@request.auth.id = ''), role DEVE ser 'corretor' (ou vazio, tratado no hook/fallback) e nunca 'master'
    // Se for master logado (@request.auth.role = 'master'), pode criar
    users.createRule = "@request.auth.id = '' || @request.auth.role = 'master'"

    app.save(users)
  },
  (app) => {
    try {
      const users = app.findCollectionByNameOrId('_pb_users_auth_')
      users.createRule = "@request.auth.id != '' && @request.auth.role = 'master'"
      app.save(users)
    } catch (_) {}
  },
)
