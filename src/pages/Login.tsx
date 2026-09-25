import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Star, LogIn, UserPlus } from 'lucide-react';
import { useApp } from '../store/AppContext';

export const Login: React.FC = () => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [name, setName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useApp();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const success = await login(email, password);
    if (success) {
      navigate('/');
    } else {
      setError('E-mail ou senha incorretos. Verifique seus dados e tente novamente.');
    }
    setLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError('Preencha todos os campos obrigatórios.');
      return;
    }
    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    setLoading(true);
    setError('');
    const success = await register({ name, email, password, whatsapp });
    if (success) {
      navigate('/minha-conta');
    } else {
      setError('Não foi possível criar sua conta. Verifique se o e-mail já está em uso.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0d0505] flex items-center justify-center px-4 py-24">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(ellipse at 50% 30%, rgba(201,168,76,0.06) 0%, transparent 60%)'
        }} />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3 group mb-4">
            <div className="w-12 h-12 rounded-full border-2 border-[#c9a84c] flex items-center justify-center bg-[rgba(201,168,76,0.1)]">
              <Star size={18} className="text-[#c9a84c] animate-candle" fill="currentColor" />
            </div>
            <div className="text-left">
              <div className="font-cinzel font-bold text-[#c9a84c] text-sm tracking-wider">CENTRO DE UMBANDA</div>
              <div className="font-cinzel font-black text-white text-lg tracking-widest">ZÉ DO LAÇO</div>
            </div>
          </Link>
        </div>

        {/* Card */}
        <div className="card-spiritual p-8">
          {/* Tabs */}
          <div className="flex mb-8 border-b border-[rgba(201,168,76,0.15)]">
            {[
              { key: 'login', label: 'Entrar', icon: LogIn },
              { key: 'register', label: 'Cadastrar', icon: UserPlus },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => { setMode(tab.key as any); setError(''); }}
                className={`flex-1 flex items-center justify-center gap-2 pb-3 font-cinzel text-sm tracking-wider transition-all ${
                  mode === tab.key
                    ? 'text-[#c9a84c] border-b-2 border-[#c9a84c] -mb-px'
                    : 'text-[rgba(245,240,232,0.4)] hover:text-[rgba(245,240,232,0.7)]'
                }`}
              >
                <tab.icon size={14} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Login Form */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="form-label">E-mail *</label>
                <input
                  type="email"
                  required
                  className="form-input"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="form-label">Senha *</label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    required
                    className="form-input pr-10"
                    placeholder="Sua senha"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[rgba(245,240,232,0.4)] hover:text-[#c9a84c]"
                  >
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-[rgba(139,26,26,0.2)] border border-[rgba(139,26,26,0.4)] rounded">
                  <p className="font-inter text-red-400 text-sm">{error}</p>
                </div>
              )}

              <button type="submit" disabled={loading} className="btn-gold w-full justify-center">
                {loading ? (
                  <div className="w-4 h-4 border-2 border-[rgba(13,5,5,0.3)] border-t-[#0d0505] rounded-full animate-spin" />
                ) : (
                  <LogIn size={16} />
                )}
                {loading ? 'Entrando...' : 'Entrar'}
              </button>
            </form>
          )}

          {/* Register Form */}
          {mode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-5">
              <div>
                <label className="form-label">Nome Completo *</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="Seu nome completo"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </div>
              <div>
                <label className="form-label">E-mail *</label>
                <input
                  type="email"
                  required
                  className="form-input"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="form-label">WhatsApp</label>
                <input
                  type="tel"
                  className="form-input"
                  placeholder="(11) 99999-9999"
                  value={whatsapp}
                  onChange={e => setWhatsapp(e.target.value)}
                />
              </div>
              <div>
                <label className="form-label">Senha *</label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    required
                    className="form-input pr-10"
                    placeholder="Mínimo 6 caracteres"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[rgba(245,240,232,0.4)] hover:text-[#c9a84c]"
                  >
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-[rgba(139,26,26,0.2)] border border-[rgba(139,26,26,0.4)] rounded">
                  <p className="font-inter text-red-400 text-sm">{error}</p>
                </div>
              )}

              <div className="p-3 bg-[rgba(201,168,76,0.05)] border border-[rgba(201,168,76,0.15)] rounded">
                <p className="font-inter text-[rgba(245,240,232,0.5)] text-xs">
                  Ao se cadastrar, você concorda com nossa{' '}
                  <Link to="/privacidade" className="text-[#c9a84c] hover:underline">Política de Privacidade</Link>
                  {' '}e nossos{' '}
                  <Link to="/termos" className="text-[#c9a84c] hover:underline">Termos de Uso</Link>.
                </p>
              </div>

              <button type="submit" disabled={loading} className="btn-gold w-full justify-center">
                {loading ? (
                  <div className="w-4 h-4 border-2 border-[rgba(13,5,5,0.3)] border-t-[#0d0505] rounded-full animate-spin" />
                ) : (
                  <UserPlus size={16} />
                )}
                {loading ? 'Cadastrando...' : 'Criar Conta'}
              </button>
            </form>
          )}
        </div>

        <div className="text-center mt-6">
          <Link to="/" className="font-inter text-[rgba(245,240,232,0.35)] text-xs hover:text-[#c9a84c] transition-colors">
            ← Voltar ao Site
          </Link>
        </div>
      </div>
    </div>
  );
};
