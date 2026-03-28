import { useState, useEffect } from 'react';

export default function ComplianceModal() {
  const [show, setShow] = useState(false);
  const [check1, setCheck1] = useState(false);
  const [check2, setCheck2] = useState(false);

  useEffect(() => {
    const agreed = localStorage.getItem('personalens_compliance_agreed');
    if (agreed !== 'true') {
      queueMicrotask(() => setShow(true));
    }
  }, []);

  function handleEnter() {
    if (check1 && check2) {
      localStorage.setItem('personalens_compliance_agreed', 'true');
      setShow(false);
    }
  }

  if (!show) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '16px'
    }}>
      <div style={{
        backgroundColor: '#FFFBF5', borderRadius: '20px',
        padding: '32px', maxWidth: '480px', width: '100%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.15)'
      }}>
        <h2 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '16px', textAlign: 'center' }}>
          ⚠️ 重要提示
        </h2>
        <p style={{ fontSize: '15px', lineHeight: '1.8', marginBottom: '24px', color: '#2D2D2D' }}>
          本工具仅用于个人合法的自我人格分析学习使用。<br /><br />
          严禁上传任何第三方的个人信息。<br /><br />
          非法收集、处理他人个人信息属于违法行为，将承担行政、民事甚至刑事责任。
        </p>

        <label style={{ display: 'flex', gap: '10px', marginBottom: '14px', cursor: 'pointer', fontSize: '14px', lineHeight: '1.6' }}>
          <input type="checkbox" checked={check1} onChange={(e) => setCheck1(e.target.checked)} style={{ marginTop: '4px', width: '18px', height: '18px' }} />
          <span>我承诺仅上传本人的个人信息，已取得所有上传内容的合法授权，充分知晓违规使用的法律后果，所有使用行为的责任由本人承担。</span>
        </label>

        <label style={{ display: 'flex', gap: '10px', marginBottom: '24px', cursor: 'pointer', fontSize: '14px', lineHeight: '1.6' }}>
          <input type="checkbox" checked={check2} onChange={(e) => setCheck2(e.target.checked)} style={{ marginTop: '4px', width: '18px', height: '18px' }} />
          <span>我已阅读并同意《用户协议》和《隐私政策》</span>
        </label>

        <button
          onClick={handleEnter}
          disabled={!check1 || !check2}
          style={{
            width: '100%', padding: '14px', borderRadius: '12px', border: 'none',
            fontSize: '16px', fontWeight: 'bold', cursor: check1 && check2 ? 'pointer' : 'not-allowed',
            backgroundColor: check1 && check2 ? '#FF6B6B' : '#ccc',
            color: '#fff', transition: 'background-color 0.2s'
          }}
        >
          🔮 进入工具
        </button>
      </div>
    </div>
  );
}
