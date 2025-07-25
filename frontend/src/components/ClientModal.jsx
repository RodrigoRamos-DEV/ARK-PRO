import React, { useState, useEffect } from 'react';

function ClientModal({ isOpen, onClose, onSave, clientToEdit }) {
    const [formData, setFormData] = useState({
        companyName: '',
        razao_social: '',
        cnpj: '',
        inscricao_estadual: '',
        inscricao_municipal: '',
        responsavel_nome: '',
        telefone: '',
        endereco_logradouro: '',
        endereco_numero: '',
        endereco_bairro: '',
        endereco_cidade: '',
        endereco_uf: '',
        endereco_cep: '',
        regime_tributario: 'Simples Nacional',
        licenseStatus: 'Ativo',
        licenseExpiresAt: ''
    });

    const isEditMode = !!clientToEdit;

    useEffect(() => {
        if (isOpen) {
            if (isEditMode) {
                setFormData({
                    companyName: clientToEdit.company_name || '',
                    razao_social: clientToEdit.razao_social || '',
                    cnpj: clientToEdit.cnpj || '',
                    inscricao_estadual: clientToEdit.inscricao_estadual || '',
                    inscricao_municipal: clientToEdit.inscricao_municipal || '',
                    responsavel_nome: clientToEdit.responsavel_nome || '',
                    telefone: clientToEdit.telefone || '',
                    endereco_logradouro: clientToEdit.endereco_logradouro || '',
                    endereco_numero: clientToEdit.endereco_numero || '',
                    endereco_bairro: clientToEdit.endereco_bairro || '',
                    endereco_cidade: clientToEdit.endereco_cidade || '',
                    endereco_uf: clientToEdit.endereco_uf || '',
                    endereco_cep: clientToEdit.endereco_cep || '',
                    regime_tributario: clientToEdit.regime_tributario || 'Simples Nacional',
                    licenseStatus: clientToEdit.license_status || 'Ativo',
                    licenseExpiresAt: clientToEdit.license_expires_at ? new Date(clientToEdit.license_expires_at).toISOString().split('T')[0] : ''
                });
            } else {
                // Reseta para o estado inicial ao criar novo cliente
                setFormData({
                    companyName: '',
                    razao_social: '',
                    cnpj: '',
                    inscricao_estadual: '',
                    inscricao_municipal: '',
                    responsavel_nome: '',
                    telefone: '',
                    endereco_logradouro: '',
                    endereco_numero: '',
                    endereco_bairro: '',
                    endereco_cidade: '',
                    endereco_uf: '',
                    endereco_cep: '',
                    regime_tributario: 'Simples Nacional',
                    licenseStatus: 'Ativo',
                    licenseExpiresAt: ''
                });
            }
        }
    }, [isOpen, clientToEdit]);

    if (!isOpen) return null;

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData, clientToEdit?.id);
    };

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <div className="card" style={{ width: '90%', maxWidth: '700px' }}>
                <h2>{isEditMode ? 'Editar Cliente' : 'Criar Novo Cliente'}</h2>
                <form onSubmit={handleSubmit} style={{ maxHeight: '70vh', overflowY: 'auto', padding: '15px' }}>
                    
                    <h4>Informações da Empresa</h4>
                    <div className="grid-2-col">
                        <div className="input-group"><label>Nome Fantasia*</label><input type="text" name="companyName" value={formData.companyName} onChange={handleChange} required /></div>
                        <div className="input-group"><label>Razão Social*</label><input type="text" name="razao_social" value={formData.razao_social} onChange={handleChange} required /></div>
                    </div>
                    <div className="grid-2-col">
                        <div className="input-group"><label>CNPJ*</label><input type="text" name="cnpj" value={formData.cnpj} onChange={handleChange} required /></div>
                        <div className="input-group"><label>Inscrição Estadual</label><input type="text" name="inscricao_estadual" value={formData.inscricao_estadual} onChange={handleChange} /></div>
                    </div>

                    <h4>Informações de Contato</h4>
                    <div className="grid-2-col">
                        <div className="input-group"><label>Nome do Responsável*</label><input type="text" name="responsavel_nome" value={formData.responsavel_nome} onChange={handleChange} required /></div>
                        <div className="input-group"><label>Telefone*</label><input type="text" name="telefone" value={formData.telefone} onChange={handleChange} required /></div>
                    </div>
                    
                    <h4>Endereço</h4>
                    <div className="grid-2-col">
                        <div className="input-group"><label>CEP</label><input type="text" name="endereco_cep" value={formData.endereco_cep} onChange={handleChange} /></div>
                        <div className="input-group"><label>Logradouro (Rua, Av.)</label><input type="text" name="endereco_logradouro" value={formData.endereco_logradouro} onChange={handleChange} /></div>
                    </div>
                    <div className="grid-2-col">
                        <div className="input-group"><label>Número</label><input type="text" name="endereco_numero" value={formData.endereco_numero} onChange={handleChange} /></div>
                        <div className="input-group"><label>Bairro</label><input type="text" name="endereco_bairro" value={formData.endereco_bairro} onChange={handleChange} /></div>
                    </div>
                    <div className="grid-2-col">
                        <div className="input-group"><label>Cidade</label><input type="text" name="endereco_cidade" value={formData.endereco_cidade} onChange={handleChange} /></div>
                        <div className="input-group"><label>UF</label><input type="text" name="endereco_uf" value={formData.endereco_uf} onChange={handleChange} maxLength="2" /></div>
                    </div>

                    <h4>Dados Fiscais e Licença</h4>
                    <div className="grid-2-col">
                         <div className="input-group"><label>Regime Tributário</label><select name="regime_tributario" value={formData.regime_tributario} onChange={handleChange}><option>Simples Nacional</option><option>Lucro Presumido</option><option>Lucro Real</option></select></div>
                         <div className="input-group"><label>Data de Vencimento*</label><input type="date" name="licenseExpiresAt" value={formData.licenseExpiresAt} onChange={handleChange} required /></div>
                    </div>
                    {isEditMode && (
                        <div className="input-group">
                            <label>Status da Licença</label>
                            <select name="licenseStatus" value={formData.licenseStatus} onChange={handleChange}>
                                <option value="Ativo">Ativo</option><option value="A Vencer">A Vencer</option><option value="Vencido">Vencido</option>
                            </select>
                        </div>
                    )}
                    
                    <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                        <button type="button" onClick={onClose} className="btn" style={{ backgroundColor: '#888', width: 'auto' }}>Cancelar</button>
                        <button type="submit" className="btn" style={{ width: 'auto' }}>Salvar</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
export default ClientModal;