import React, { useState, useEffect } from 'react';

function ClientModal({ isOpen, onClose, onSave, clientToEdit }) {
    const [formData, setFormData] = useState({
        companyName: '',
        licenseStatus: 'Ativo',
        licenseExpiresAt: ''
    });

    const isEditMode = !!clientToEdit;

    useEffect(() => {
        if (isOpen) {
            if (isEditMode) {
                setFormData({
                    companyName: clientToEdit.company_name,
                    licenseStatus: clientToEdit.license_status,
                    licenseExpiresAt: new Date(clientToEdit.license_expires_at).toISOString().split('T')[0]
                });
            } else {
                setFormData({
                    companyName: '',
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
        // Apenas envia os campos necessários para a criação
        const dataToSend = isEditMode ? formData : {
            companyName: formData.companyName,
            licenseExpiresAt: formData.licenseExpiresAt
        };
        onSave(dataToSend, clientToEdit?.id);
    };

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <div className="card" style={{ width: '90%', maxWidth: '500px' }}>
                <h2>{isEditMode ? 'Editar Cliente' : 'Criar Novo Cliente'}</h2>
                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label>Nome da Empresa</label>
                        <input type="text" name="companyName" value={formData.companyName} onChange={handleChange} required />
                    </div>
                    <div className="grid-2-col" style={{alignItems: 'flex-end'}}>
                        <div className="input-group">
                            <label>Data de Vencimento</label>
                            <input type="date" name="licenseExpiresAt" value={formData.licenseExpiresAt} onChange={handleChange} required />
                        </div>
                        {isEditMode && (
                             <div className="input-group">
                                <label>Status da Licença</label>
                                <select name="licenseStatus" value={formData.licenseStatus} onChange={handleChange}>
                                    <option value="Ativo">Ativo</option>
                                    <option value="A Vencer">A Vencer</option>
                                    <option value="Vencido">Vencido</option>
                                </select>
                            </div>
                        )}
                    </div>
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