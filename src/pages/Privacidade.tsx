import React from 'react';
import { Shield } from 'lucide-react';

export const Privacidade: React.FC = () => (
  <div className="min-h-screen bg-[#0d0505]">
    <div className="relative py-32 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[rgba(139,26,26,0.2)] to-[#0d0505]" />
      <div className="relative z-10 text-center px-4">
        <Shield size={40} className="text-[#c9a84c] mx-auto mb-4" />
        <h1 className="section-title mb-4">Política de Privacidade</h1>
        <div className="gold-divider" />
      </div>
    </div>
    <div className="max-w-3xl mx-auto px-4 pb-24">
      <div className="card-spiritual p-8 space-y-6">
        {[
          { title: '1. Informações que Coletamos', text: 'Coletamos apenas as informações necessárias para o funcionamento do site: nome, e-mail, WhatsApp e mensagens de contato voluntariamente fornecidas pelo usuário.' },
          { title: '2. Como Utilizamos suas Informações', text: 'As informações são utilizadas exclusivamente para responder suas dúvidas, enviar informações sobre nossos serviços e eventos (quando solicitado), e melhorar sua experiência em nosso site.' },
          { title: '3. Compartilhamento de Dados', text: 'Não vendemos, alugamos ou compartilhamos suas informações pessoais com terceiros. Seus dados são utilizados apenas pela equipe do Centro de Umbanda Zé do Laço.' },
          { title: '4. Segurança', text: 'Adotamos medidas de segurança para proteger suas informações contra acesso não autorizado, alteração, divulgação ou destruição.' },
          { title: '5. Seus Direitos (LGPD)', text: 'Em conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei 13.709/2018), você tem o direito de acessar, corrigir ou solicitar a exclusão de seus dados pessoais a qualquer momento.' },
          { title: '6. Informações Espirituais', text: 'Não solicitamos e não armazenamos informações sensíveis de natureza espiritual, religiosa ou pessoal além do necessário para contato.' },
          { title: '7. Contato', text: 'Para exercer seus direitos ou tirar dúvidas sobre esta política, entre em contato pelo WhatsApp (11) 94008-7119 ou e-mail contato@zedolaco.com.br.' },
          { title: '8. Atualizações', text: 'Esta política pode ser atualizada periodicamente. Recomendamos que você a revise regularmente.' },
        ].map((section, i) => (
          <div key={i}>
            <h2 className="font-cinzel font-bold text-[#c9a84c] text-base mb-2">{section.title}</h2>
            <p className="font-crimson text-[rgba(245,240,232,0.65)] text-base leading-relaxed">{section.text}</p>
          </div>
        ))}
        <div className="border-t border-[rgba(201,168,76,0.1)] pt-4">
          <p className="font-inter text-[rgba(245,240,232,0.3)] text-xs">
            Última atualização: {new Date().toLocaleDateString('pt-BR')} — Centro de Umbanda Zé do Laço
          </p>
        </div>
      </div>
    </div>
  </div>
);
