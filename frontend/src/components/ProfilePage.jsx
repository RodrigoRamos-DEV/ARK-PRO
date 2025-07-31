import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import API_URL from '../apiConfig';

function ProfilePage() {
    const [profileData, setProfileData] = useState({
        company_name: '',
        contact_phone: '',
        full_address: ''
    });
    const [logoPreview, setLogoPreview] = useState(null);
    const [logoFile, setLogoFile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const token = localStorage.getItem('token');
    const DATA_API_URL = `${API_URL}/api/data`;

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await axios.get(`${DATA_API_URL}/profile`, { headers: { 'x-auth-token': token } });
                setProfileData(response.data);
                
                // --- CORREÇÃO DEFINITIVA AQUI ---
                // Agora, ele usa o link completo 'logo_url' que o backend envia.
                if (response.data.logo_url) {
                    setLogoPreview(response.data.logo_url);
                }

            } catch (error) {
                toast.error("Erro ao carregar os dados do perfil.");
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [token]);

    const handleInputChange = (e) => {
        setProfileData({ ...profileData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setLogoFile(file);
            // Cria uma pré-visualização local temporária
            setLogoPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        
        const formData = new FormData();
        formData.append('companyName', profileData.company_name);
        formData.append('contactPhone', profileData.contact_phone);
        formData.append('fullAddress', profileData.full_address);
        if (logoFile) {
            formData.append('logo', logoFile);
        }

        try {
            const response = await axios.put(`${DATA_API_URL}/profile`, formData, {
                headers: { 
                    'x-auth-token': token,
                    'Content-Type': 'multipart/form-data'
                }
            });
            toast.success("Perfil atualizado com sucesso!");
            // Atualiza a pré-visualização com o link final da S3 após o upload
            if (response.data.updatedProfile && response.data.updatedProfile.logo_url) {
                setLogoPreview(response.data.updatedProfile.logo_url);
            }
            setLogoFile(null); // Limpa o ficheiro após o upload
        } catch (error) {
            toast.error(error.response?.data?.error || "Erro ao salvar o perfil.");
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) {
        return <div className="card"><p>A carregar perfil...</p></div>;
    }

    return (
        <div>
            <h2>Perfil da Empresa</h2>
            <p>As informações preenchidas aqui serão usadas para gerar o cabeçalho dos seus relatórios de fechamento.</p>
            <div className="card">
                <form onSubmit={handleSubmit}>
                    <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                        {logoPreview ? (
                            <img src={logoPreview} alt="Logo da Empresa" style={{ width: '150px', height: '150px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--cor-borda)' }} />
                        ) : (
                            <div style={{ width: '150px', height: '150px', borderRadius: '50%', backgroundColor: 'var(--cor-borda)', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: 'auto' }}>
                                <span>Sem Logo</span>
                            </div>
                        )}
                        <div className="input-group" style={{maxWidth: '300px', margin: '10px auto'}}>
                             <label htmlFor="logo-upload" className="btn" style={{cursor: 'pointer'}}>Mudar Logo</label>
                             <input id="logo-upload" type="file" accept="image/*" onChange={handleFileChange} style={{display: 'none'}}/>
                        </div>
                    </div>

                    <div className="input-group">
                        <label>Nome da Empresa (para o relatório)</label>
                        <input
                            type="text"
                            name="company_name"
                            value={profileData.company_name || ''}
                            onChange={handleInputChange}
                        />
                    </div>
                    <div className="input-group">
                        <label>Telefone de Contato (para o relatório)</label>
                        <input
                            type="text"
                            name="contact_phone"
                            value={profileData.contact_phone || ''}
                            onChange={handleInputChange}
                        />
                    </div>
                    <div className="input-group">
                        <label>Endereço Completo (para o relatório)</label>
                        <textarea
                            name="full_address"
                            value={profileData.full_address || ''}
                            onChange={handleInputChange}
                            rows="3"
                            style={{marginTop: '5px', width: '100%', padding: '10px', border: '1px solid var(--cor-borda)', borderRadius: '6px', boxSizing: 'border-box'}}
                        ></textarea>
                    </div>

                    <button type="submit" className="btn" disabled={isSaving} style={{maxWidth: '200px', margin: '0 auto'}}>
                        {isSaving ? 'A salvar...' : 'Salvar Alterações'}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default ProfilePage;