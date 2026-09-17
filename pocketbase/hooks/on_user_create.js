onRecordCreate((e) => {
  const record = e.record
  const auth = e.auth

  // Se a criação for feita anonimamente (auto-registro público) ou por um usuário não-master,
  // força incondicionalmente a role como 'corretor'
  const isMaster = auth && auth.getString('role') === 'master'

  if (!isMaster) {
    record.set('role', 'corretor')
  }

  e.next()
}, 'users')
