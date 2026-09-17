onRecordCreate((e) => {
  const record = e.record
  const auth = e.auth

  // Se a criação for feita anonimamente (auto-registro público) ou por um usuário não-master:
  // Força incondicionalmente a role como 'corretor'
  // E define status inicial como 'pendente' (precisa de autorização do master)
  const isMaster = auth && auth.getString('role') === 'master'

  if (!isMaster) {
    record.set('role', 'corretor')
    // Se não especificado ou se auto-registro, coloca pendente
    record.set('status', 'pendente')
  } else {
    // Se criado pelo master diretamente, já nasce aprovado se não informado
    if (!record.getString('status')) {
      record.set('status', 'aprovado')
    }
  }

  e.next()
}, 'users')
