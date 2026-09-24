import React from 'react';
import { FileText } from 'lucide-react';

export const Termos: React.FC = () => (
  <div className="min-h-screen bg-[#0d0505]">
    <div className="relative py-32 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[rgba(139,26,26,0.2)] to-[#0d0505]" />
      <div className="relative z-10 text-center px-4">
        <FileText size={40} className="text-[#c9a84c] mx-auto mb-4" />
        <h1 className="section-title mb-4">Termos de Uso</h1>
        <div className="gold-divider" />
      </div>
    </div>
    <div className="max-w-3xl mx-auto px-4 pb-24">
      <div className="card-spiritual p-8 space-y-6">
        {[
          { title: '1. Aceite dos Termos', text: 'Ao acessar e utilizar o site do Centro de Umbanda Zé do Laço, você concorda com estes Termos de Uso. Se não concordar, por favor, não utilize o site.' },
          { title: '2. Finalidade do Site', text: 'Este site tem como finalidade apresentar o Centro de Umbanda Zé do Laço, informar sobre suas atividades, facilitar o contato entre consulentes e a equipe, e divulgar a agenda de giras e eventos.' },
          { title: '3. Informações Religiosas', text: 'O conteúdo deste site sobre a Umbanda é informativo e baseado na tradição da nossa casa. Não nos responsabilizamos pelo uso inadequado das informações aqui contidas fora do contexto do nosso Centro.' },
          { title: '4. Respeito e Conduta', text: 'Esperamos que todos os usuários utilizem este site com respeito. Mensagens ou comportamentos desrespeitosos, preconceituosos ou que prejudiquem a imagem do terreiro não serão tolerados.' },
          { title: '5. Cadastro de Usuários', text: 'Ao criar uma conta, você assume a responsabilidade pela veracidade das informações fornecidas e pela segurança de sua senha. Não compartilhe suas credenciais de acesso.' },
          { title: '6. Propriedade Intelectual', text: 'Todo o conteúdo deste site, incluindo textos, imagens e elementos de design, é de propriedade do Centro de Umbanda Zé do Laço e não pode ser reproduzido sem autorização.' },
          { title: '7. Limitação de Responsabilidade', text: 'O Centro de Umbanda Zé do Laço não se responsabiliza por decisões tomadas com base nas informações deste site. Nosso conteúdo é orientativo e não substitui o atendimento espiritual presencial.' },
          { title: '8. Modificações', text: 'Reservamo-nos o direito de alterar estes termos a qualquer momento. O uso continuado do site após as alterações implica na aceitação dos novos termos.' },
          { title: '9. Contato', text: 'Dúvidas sobre estes termos podem ser esclarecidas pelo WhatsApp (11) 94008-7119.' },
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
