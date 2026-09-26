import React, { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, Phone, Search } from 'lucide-react';
import { useApp } from '../store/AppContext';

type FAQ = { id: string; question: string; answer: string; order: number; active: boolean };

const DEFAULT_FAQS: FAQ[] = [
  ['O que é a Umbanda?', 'A Umbanda é uma religião brasileira que valoriza a fé, a caridade, o respeito e o equilíbrio espiritual. Em seus trabalhos podem estar presentes orações, pontos cantados, passes, defumações e manifestações mediúnicas, conforme os fundamentos de cada terreiro.'],
  ['O que é um terreiro de Umbanda?', 'O terreiro é o espaço onde acontecem os trabalhos religiosos e espirituais da Umbanda. É um lugar destinado à prática da fé, da caridade, do desenvolvimento mediúnico, das orientações e dos trabalhos realizados pela corrente espiritual da casa.'],
  ['Preciso ser umbandista para visitar o terreiro?', 'Não. Uma pessoa pode conhecer um terreiro mesmo sem ser praticante da Umbanda. Quem está conhecendo a religião pode participar de atividades abertas ao público, buscar orientação ou simplesmente conhecer o trabalho da casa. O mais importante é chegar com respeito.'],
  ['O que é uma gira?', 'A gira é uma sessão de trabalho espiritual realizada no terreiro. Dependendo do tipo de gira, podem acontecer momentos de oração, cantos, pontos, defumação, incorporação e atendimento espiritual. Cada gira possui sua finalidade e organização.'],
  ['O que significa incorporação?', 'Na Umbanda, a incorporação é compreendida como uma forma de manifestação espiritual através do médium. O médium oferece seu corpo e sua mediunidade para que uma entidade possa se manifestar e realizar seu trabalho espiritual, de acordo com os fundamentos da casa.'],
  ['Quem são as entidades da Umbanda?', 'As entidades são compreendidas, dentro da tradição umbandista, como espíritos que trabalham em diferentes linhas e falanges. Entre as linhas presentes em diversas casas estão Caboclos, Pretos-Velhos, Erês, Exus, Pombagiras, Baianos, Boiadeiros, Marinheiros e Malandros. A organização pode variar conforme cada terreiro.'],
  ['Quem são os Caboclos?', 'Os Caboclos são entidades muito presentes na Umbanda e geralmente associados à força, coragem, proteção, conhecimento e ligação com a natureza. Nos trabalhos espirituais podem oferecer orientações, passes e outras formas de auxílio, conforme os fundamentos da casa.'],
  ['Quem são os Pretos-Velhos?', 'Os Pretos-Velhos são entidades tradicionalmente associadas à sabedoria, humildade, paciência e aconselhamento. Sua forma de trabalho costuma ser marcada por palavras tranquilizadoras, ensinamentos e orientações espirituais.'],
  ['Quem são Exus e Pombagiras?', 'Exus e Pombagiras fazem parte de importantes linhas de trabalho em muitas tradições de Umbanda. Dentro da religião, não devem ser automaticamente associados à ideia de demônios ou ao mal. Suas formas de atuação e seus fundamentos variam conforme cada casa e podem envolver proteção, orientação, equilíbrio e abertura de caminhos.'],
  ['Pombagira é uma entidade ruim?', 'Não é correto simplesmente definir Pombagira como uma entidade ruim. Dentro da Umbanda, Pombagiras são entidades espirituais que trabalham conforme os fundamentos de sua linha e da casa. Existem diferentes Pombagiras, com características e formas de trabalho próprias.'],
  ['O que é um passe?', 'O passe é uma prática espiritual realizada em diversas casas de Umbanda. Por meio de gestos, oração, concentração e outros fundamentos da casa, busca-se oferecer auxílio e equilíbrio espiritual à pessoa que recebe o passe.'],
  ['O que é uma defumação?', 'A defumação é uma prática realizada em muitos terreiros utilizando ervas e outros elementos tradicionalmente preparados. Dentro dos fundamentos da casa, pode ser utilizada para preparar o ambiente, os médiuns e os participantes antes de determinados trabalhos.'],
  ['O que são pontos cantados?', 'Os pontos cantados são cantos utilizados durante os trabalhos de Umbanda. Eles podem saudar entidades, linhas espirituais e Orixás, iniciar trabalhos ou acompanhar momentos específicos da gira. O ritmo e a energia do canto também fazem parte da experiência religiosa.'],
  ['O que são Orixás?', 'Os Orixás são divindades ou forças sagradas cultuadas em diferentes tradições de matriz africana e também presentes em diversas vertentes da Umbanda. Cada Orixá possui características, símbolos, elementos e formas de culto próprias. A maneira de cultuá-los pode variar entre as tradições.'],
  ['O terreiro faz previsão do futuro?', 'Algumas casas oferecem práticas de orientação espiritual, como consultas com cartas ou búzios. Essas práticas podem ter diferentes significados e fundamentos dependendo da tradição. Uma consulta espiritual deve ser entendida como orientação e não como garantia absoluta de que determinado acontecimento acontecerá.'],
  ['O que é o jogo de búzios?', 'O jogo de búzios é uma prática oracular presente em tradições de matriz africana e também pode ser utilizado em determinadas casas. A interpretação depende do conhecimento, dos fundamentos e da tradição do sacerdote ou sacerdotisa responsável pelo atendimento.'],
  ['O que é uma consulta com cartas?', 'A consulta com cartas pode ser utilizada como ferramenta de orientação e reflexão. O consulente apresenta o tema ou as questões que deseja compreender melhor, e a leitura é conduzida conforme a prática e os fundamentos da pessoa ou da casa responsável pelo atendimento.'],
  ['Como devo me vestir para ir ao terreiro?', 'As orientações podem variar conforme cada casa. De maneira geral, recomenda-se usar roupas confortáveis, discretas e respeitosas. Se for sua primeira visita, confirme previamente se o terreiro possui alguma orientação específica sobre vestimenta.'],
  ['Preciso levar alguma coisa para a gira?', 'Isso depende do tipo de trabalho e das orientações do terreiro. Para uma primeira visita, o melhor é verificar previamente se existe alguma recomendação. Não leve velas, bebidas, alimentos, ervas ou outros elementos por conta própria sem antes perguntar à casa.'],
  ['É permitido tirar fotos ou gravar durante a gira?', 'Não faça fotos ou gravações sem autorização. Durante uma gira existem momentos de concentração e práticas religiosas que podem envolver a privacidade dos participantes e dos médiuns. Sempre pergunte à organização da casa antes de fotografar ou filmar.'],
  ['Posso participar mesmo sendo de outra religião?', 'Isso depende das regras e fundamentos de cada terreiro. Muitas casas recebem pessoas de diferentes religiões e crenças, mas cada casa possui sua própria organização. O ideal é conversar com o terreiro e verificar suas orientações antes do atendimento.'],
  ['Preciso acreditar em tudo para participar?', 'Não é necessário chegar sabendo tudo ou ter todas as respostas. É natural ter perguntas e não compreender determinadas práticas no início. O importante é manter uma postura respeitosa e buscar conhecimento antes de tirar conclusões.'],
  ['Crianças podem ir ao terreiro?', 'Essa questão depende da organização e das regras de cada casa. Algumas atividades permitem a participação de crianças, enquanto outras possuem orientações específicas. Caso queira levar uma criança, consulte previamente o terreiro.'],
  ['Posso ir ao terreiro apenas para conhecer?', 'Sim, desde que a atividade permita a visita. Você pode conhecer o espaço, acompanhar uma atividade aberta ao público e conversar com os responsáveis. Não é necessário assumir um compromisso religioso simplesmente por visitar um terreiro.'],
  ['Tenho medo de ir a um terreiro. O que devo fazer?', 'É normal sentir insegurança ao entrar em um ambiente religioso que ainda não conhecemos. Você não precisa saber cantar pontos, conhecer as entidades ou entender todos os procedimentos antes de visitar. Observe, respeite as orientações da casa e pergunte sempre que tiver dúvidas.'],
  ['Como posso começar a conhecer melhor a Umbanda?', 'Uma boa maneira é conversar com pessoas responsáveis por uma casa de confiança, participar de atividades abertas ao público e estudar sobre a história e as diferentes tradições da Umbanda. Conhecimento, respeito e diálogo são bons caminhos para quem está começando.'],
  ['Posso tirar dúvidas antes de ir ao terreiro?', 'Sim. Se você tiver dúvidas sobre horários, giras, vestimenta, atendimento ou qualquer orientação relacionada à visita, entre em contato com a casa antes de comparecer. É melhor perguntar do que chegar inseguro ou sem conhecer as orientações daquele dia.'],
].map(([question, answer], index) => ({
  id: `default-${String(index + 1).padStart(2, '0')}`,
  question, answer, order: index + 1, active: true,
}));

const FAQItem: React.FC<{ item: FAQ; index: number }> = ({ item, index }) => {
  const [open, setOpen] = useState(false);
  return (
    <div
      className={`border border-[rgba(201,168,76,0.15)] rounded transition-all duration-300 overflow-hidden ${
        open ? 'border-[rgba(201,168,76,0.4)] bg-[rgba(201,168,76,0.03)]' : 'hover:border-[rgba(201,168,76,0.3)]'
      }`}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="w-full flex items-center justify-between p-5 text-left gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <span className="font-cinzel text-[#c9a84c] text-xs opacity-60 flex-shrink-0 hidden sm:block">{String(index + 1).padStart(2, '0')}</span>
          <span className="font-cinzel font-semibold text-[#f5f0e8] text-base leading-snug">{item.question}</span>
        </div>
        <div className="flex-shrink-0">
          {open ? <ChevronUp size={18} className="text-[#c9a84c]" /> : <ChevronDown size={18} className="text-[rgba(245,240,232,0.4)]" />}
        </div>
      </button>
      {open && (
        <div className="px-5 pb-5 pt-0 border-t border-[rgba(201,168,76,0.1)]">
          <div className="pt-4 pl-0 sm:pl-10">
            <p className="font-crimson text-[rgba(245,240,232,0.75)] text-lg leading-relaxed">{item.answer}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export const Duvidas: React.FC = () => {
  const { faqItems, siteConfig } = useApp();
  const [search, setSearch] = useState('');

  const activeFAQs = useMemo(() => {
    const databaseFAQs = faqItems.filter(f => f.active);
    const existingQuestions = new Set(databaseFAQs.map(f => f.question.trim().toLowerCase()));
    return [...databaseFAQs, ...DEFAULT_FAQS.filter(f => !existingQuestions.has(f.question.trim().toLowerCase()))]
      .filter(f => f.question.toLowerCase().includes(search.toLowerCase()) || f.answer.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => a.order - b.order);
  }, [faqItems, search]);

  return (
    <div className="min-h-screen bg-[#0d0505]">
      <div className="relative py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[rgba(139,26,26,0.2)] to-[#0d0505]" />
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(ellipse at center, rgba(201,168,76,0.06) 0%, transparent 60%)' }} />
        <div className="relative z-10 text-center px-4">
          <p className="font-cinzel text-[#c9a84c] text-xs tracking-widest uppercase mb-3">Esclarecimentos</p>
          <h1 className="section-title mb-4" style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}>Tire Suas Dúvidas</h1>
          <div className="gold-divider mb-4" />
          <p className="font-crimson text-[rgba(245,240,232,0.6)] text-xl italic">Perguntas frequentes sobre o terreiro e a Umbanda</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 pb-24">
        <div className="mb-10">
          <div className="relative">
            <input type="text" placeholder="Buscar pergunta ou assunto..." value={search} onChange={e => setSearch(e.target.value)} aria-label="Buscar nas dúvidas" className="form-input pl-10" />
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgba(201,168,76,0.4)]" />
          </div>
        </div>

        {activeFAQs.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🔍</div>
            <p className="font-crimson text-[rgba(245,240,232,0.5)] text-xl">Nenhuma pergunta encontrada.</p>
          </div>
        ) : (
          <div className="space-y-3">{activeFAQs.map((item, index) => <FAQItem key={item.id} item={item} index={index} />)}</div>
        )}

        <div className="mt-16 p-8 border border-[rgba(201,168,76,0.2)] rounded bg-[rgba(201,168,76,0.03)] text-center">
          <div className="text-4xl mb-4">💬</div>
          <h3 className="font-cinzel font-bold text-[#c9a84c] text-xl mb-3">Não encontrou sua resposta?</h3>
          <p className="font-crimson text-[rgba(245,240,232,0.6)] text-lg italic mb-6">Entre em contato conosco pelo WhatsApp. Estamos prontos para esclarecer qualquer dúvida com respeito e carinho.</p>
          <button
            type="button"
            onClick={() => window.open(`https://wa.me/${siteConfig.whatsapp}?text=${encodeURIComponent('Olá! Tenho uma dúvida sobre o Centro de Umbanda Zé do Laço.')}`, '_blank')}
            className="btn-wine inline-flex items-center gap-2"
          >
            <Phone size={16} />
            Tirar Dúvida pelo WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
};
