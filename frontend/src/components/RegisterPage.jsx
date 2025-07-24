import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate, Link } from 'react-router-dom';

function RegisterPage() {
    const [formData, setFormData] = useState({
        registrationToken: '',
        email: '',
        password: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const response = await axios.post('http://localhost:3000/api/auth/register', formData);
            toast.success(response.data.msg);
            navigate('/'); // Redireciona para o login após o sucesso
        } catch (error) {
            toast.error(error.response?.data?.msg || 'Erro ao efetuar o registo.');
            setIsLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="card login-card">
                <h1>Registar Conta</h1>
                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label>Token de Registo</label>
                        <input type="text" name="registrationToken" value={formData.registrationToken} onChange={handleChange} required />
                    </div>
                    <div className="input-group">
                        <label>Seu Email</label>
                        <input type="email" name="email" value={formData.email} onChange={handleChange} required />
                    </div>
                    <div className="input-group">
                        <label>Sua Senha</label>
                        <input type="password" name="password" value={formData.password} onChange={handleChange} required minLength="6" />
                    </div>
                    <button type="submit" className="btn" disabled={isLoading}>
                        {isLoading ? 'A registar...' : 'Registar'}
                    </button>
                </form>
                <p style={{ marginTop: '20px' }}>Já tem uma conta? <Link to="/">Faça o login</Link></p>
            </div>
        </div>
    );
}

export default RegisterPage;