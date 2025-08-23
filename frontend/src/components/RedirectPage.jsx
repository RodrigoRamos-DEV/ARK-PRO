import React, { useEffect, useState } from 'react';

const RedirectPage = () => {
    const [countdown, setCountdown] = useState(10);

    useEffect(() => {
        const timer = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    window.location.href = 'https://sistema.arksistemas.com.br';
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const handleWhatsApp = () => {
        window.open('https://wa.me/5521973047049?text=Olá! Gostaria de saber mais sobre o Sistema ARK.', '_blank');
    };

    const handleWebsite = () => {
        window.open('https://www.arksistemas.com.br', '_blank');
    };

    const handleSystemAccess = () => {
        window.location.href = 'https://sistema.arksistemas.com.br';
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'Arial, sans-serif',
            padding: '20px'
        }}>
            <div style={{
                background: 'rgba(255, 255, 255, 0.95)',
                borderRadius: '20px',
                padding: '40px',
                maxWidth: '600px',
                width: '100%',
                textAlign: 'center',
                boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                backdropFilter: 'blur(10px)',
                animation: 'fadeInUp 0.8s ease-out'
            }}>
                <div style={{ marginBottom: '30px' }}>
                    <img 
                        src="https://i.postimg.cc/Qd98gFMF/Sistema-ARK.webp" 
                        alt="Sistema ARK" 
                        style={{
                            maxWidth: '200px',
                            height: 'auto',
                            filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))'
                        }}
                    />
                </div>

                <h1 style={{
                    color: '#2c3e50',
                    fontSize: '2.5em',
                    marginBottom: '20px',
                    fontWeight: 'bold'
                }}>
                    🚀 Sistema Migrado!
                </h1>

                <p style={{
                    color: '#34495e',
                    fontSize: '1.2em',
                    lineHeight: '1.6',
                    marginBottom: '30px'
                }}>
                    Nosso sistema foi migrado para um novo endereço mais rápido e seguro!
                    <br />
                    <strong>Você será redirecionado automaticamente em {countdown} segundos...</strong>
                </p>

                <div style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    background: `conic-gradient(#4CAF50 ${(10-countdown)*36}deg, #e0e0e0 0deg)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '20px auto',
                    fontSize: '24px',
                    fontWeight: 'bold',
                    color: '#2c3e50'
                }}>
                    {countdown}
                </div>

                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '15px',
                    marginTop: '30px'
                }}>
                    <button
                        onClick={handleSystemAccess}
                        style={{
                            background: 'linear-gradient(45deg, #4CAF50, #45a049)',
                            color: 'white',
                            border: 'none',
                            padding: '15px 30px',
                            borderRadius: '50px',
                            fontSize: '18px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            boxShadow: '0 4px 15px rgba(76, 175, 80, 0.3)'
                        }}
                    >
                        🔗 Acessar Sistema Agora
                    </button>

                    <div style={{
                        display: 'flex',
                        gap: '15px',
                        justifyContent: 'center',
                        flexWrap: 'wrap'
                    }}>
                        <button
                            onClick={handleWhatsApp}
                            style={{
                                background: 'linear-gradient(45deg, #25D366, #128C7E)',
                                color: 'white',
                                border: 'none',
                                padding: '12px 25px',
                                borderRadius: '50px',
                                fontSize: '16px',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                boxShadow: '0 4px 15px rgba(37, 211, 102, 0.3)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                            </svg>
                            WhatsApp
                        </button>

                        <button
                            onClick={handleWebsite}
                            style={{
                                background: 'linear-gradient(45deg, #3498db, #2980b9)',
                                color: 'white',
                                border: 'none',
                                padding: '12px 25px',
                                borderRadius: '50px',
                                fontSize: '16px',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                boxShadow: '0 4px 15px rgba(52, 152, 219, 0.3)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}
                        >
                            🌐 Site Oficial
                        </button>
                    </div>
                </div>

                <div style={{
                    marginTop: '30px',
                    padding: '20px',
                    background: 'rgba(52, 152, 219, 0.1)',
                    borderRadius: '15px',
                    border: '1px solid rgba(52, 152, 219, 0.2)'
                }}>
                    <h3 style={{ color: '#2c3e50', margin: '0 0 10px 0' }}>📍 Novo Endereço</h3>
                    <p style={{ color: '#34495e', margin: '5px 0', fontWeight: 'bold' }}>
                        sistema.arksistemas.com.br
                    </p>
                    <p style={{ color: '#7f8c8d', margin: '5px 0', fontSize: '14px' }}>
                        Mais rápido, mais seguro, mais funcionalidades!
                    </p>
                </div>
            </div>

            <style>
                {`
                    @keyframes fadeInUp {
                        from {
                            opacity: 0;
                            transform: translateY(30px);
                        }
                        to {
                            opacity: 1;
                            transform: translateY(0);
                        }
                    }
                `}
            </style>
        </div>
    );
};

export default RedirectPage;