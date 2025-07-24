import React from 'react';

function DashboardPage() {
  const user = JSON.parse(localStorage.getItem('user'));
  // O email do admin não vem do banco, então tratamos esse caso.
  const userEmail = user ? (user.role === 'admin' ? 'Admin' : user.email) : 'Usuário';

  return (
    <div className="card">
      <h1>Seja Bem-vindo ao Sistema ARK</h1>
      <p>Você está logado como: <strong>{userEmail}</strong></p>
      <p>Selecione uma opção na barra de navegação acima para começar.</p>
    </div>
  );
}

export default DashboardPage;