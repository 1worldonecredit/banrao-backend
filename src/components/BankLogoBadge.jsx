// [BANK-LOGO-01] คอมโพเนนต์แสดงโลโก้ธนาคารจาก Database (มี Fallback สีประจำธนาคาร + ตัวย่อ)
import React, { useState } from 'react';

export default function BankLogoBadge({
    bankCode = '',
    logoUrl = '',
    brandColor = '#0f172a',
    size = 38
}) {
    const [imgError, setImgError] = useState(false);
    const code = String(bankCode || 'BANK').toUpperCase();
    const showImage = Boolean(logoUrl) && !imgError;

    return (
        <div
            style={{
                width: `${size}px`,
                height: `${size}px`,
                borderRadius: '10px',
                backgroundColor: showImage ? '#ffffff' : brandColor || '#0f172a',
                border: '1px solid #cbd5e1',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                flexShrink: 0,
                boxShadow: '0 2px 6px rgba(15, 23, 42, 0.08)'
            }}
        >
            {showImage ? (
                <img
                    src={logoUrl}
                    alt={code}
                    onError={() => setImgError(true)}
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        padding: '4px',
                        boxSizing: 'border-box'
                    }}
                />
            ) : (
                <span
                    style={{
                        color: '#ffffff',
                        fontSize: size >= 36 ? '10px' : '9px',
                        fontWeight: 900,
                        letterSpacing: '0.3px',
                        textAlign: 'center',
                        lineHeight: 1.1,
                        padding: '0 2px'
                    }}
                >
                    {code.slice(0, 6)}
                </span>
            )}
        </div>
    );
}