import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_URL from '../apiConfig'; // <-- ADICIONADO

function FuncionarioManager() {
    // "Estados" para guardar a lista de funcionários, o nome do novo funcionário, erros e estado de carregamento
    const [funcionarios, setFuncionarios] = useState([]);
    const [novoFuncionario, setNovoFuncionario] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // ANTES: const API_URL = 'http://localhost:3000/api/data'; (Removido)
    const DATA_API_URL = `${API_URL}/api/data`; // <-- ADICIONADO para simplificar

    // Função para buscar os funcionários no backend
    const fetchFuncionarios = async () => {
        const token = localStorage.getItem('token');
        try {
            const response = await axios.get(`${DATA_API_URL}/employees`, { // <-- ALTERADO
                headers: { 'x-auth-token': token }
            });
            setFuncionarios(response.data); // Guarda a lista recebida no estado
        } catch (err) {
            setError('Não foi possível carregar os funcionários.');
        } finally {
            setLoading(false);
        }
    };

    // useEffect: Este código roda automaticamente assim que o componente aparece na tela
    useEffect(() => {
        fetchFuncionarios();
    }, []); // O array vazio [] significa que ele só roda uma vez

    // Função para lidar com a adição de um novo funcionário
    const handleAddFuncionario = async (e) => {
        e.preventDefault();
        if (!novoFuncionario.trim()) return;

        const token = localStorage.getItem('token');
        try {
            const response = await axios.post(`${DATA_API_URL}/employees`, // <-- ALTERADO
                { name: novoFuncionario },
                { headers: { 'x-auth-token': token } }
            );
            // Adiciona o novo funcionário à lista existente, sem precisar recarregar tudo
            setFuncionarios([...funcionarios, response.data]);
            setNovoFuncionario(''); // Limpa o campo de input
        } catch (err) {
            setError(err.response?.data?.error || 'Não foi possível adicionar o funcionário.');
        }
    };

    if (loading) {
        return <p>Carregando funcionários...</p>;
    }

    if (error) {
        return <p className="error-message">{error}</p>;
    }

    return (
        <div>
            <h3>Gerenciar Funcionários</h3>
            <form onSubmit={handleAddFuncionario} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <input
                    type="text"
                    value={novoFuncionario}
                    onChange={(e) => setNovoFuncionario(e.target.value)}
                    placeholder="Nome do novo funcionário"
                />
                <button type="submit" className="btn" style={{width: 'auto'}}>Adicionar</button>
            </form>

            <ul style={{ listStyle: 'none', padding: 0 }}>
                {funcionarios.length > 0 ? (
                    funcionarios.map(func => (
                        <li key={func.id} style={{ padding: '8px', borderBottom: '1px solid var(--cor-borda)' }}>
                            {func.name}
                        </li>
                    ))
                ) : (
                    <p>Nenhum funcionário cadastrado.</p>
                )}
            </ul>
        </div>
    );
}

export default FuncionarioManager;