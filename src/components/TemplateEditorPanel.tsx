import React, { useState, useRef, useEffect } from 'react';
import { 
  Code, 
  Eye, 
  Sparkles, 
  FileText, 
  LayoutGrid, 
  Info, 
  Bold, 
  Italic, 
  Underline, 
  Link, 
  PlusCircle, 
  RotateCcw, 
  Sliders, 
  Paintbrush, 
  Check, 
  Type,
  Smartphone,
  Monitor,
  Columns2,
  LayoutList,
  Undo,
  Redo,
  Eraser,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Outdent,
  Indent,
  Printer,
  Film,
  Smile,
  Table,
  ChevronDown,
  Trash2,
  Copy,
  Scissors,
  Edit2,
  Save,
  X
} from 'lucide-react';
import { Recipient, VariableMapping } from '../types';

interface TemplateEditorPanelProps {
  template: string;
  onTemplateChanged: (val: string) => void;
  mappings: VariableMapping[];
  recipients: Recipient[];
}

export default function TemplateEditorPanel({
  template,
  onTemplateChanged,
  mappings,
  recipients
}: TemplateEditorPanelProps) {
  const [activeTab, setActiveTab] = useState<'editor' | 'generator' | 'preview'>('editor');
  const [previewRecipientIdx, setPreviewRecipientIdx] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // States for Visual Template Generator
  const [genColor, setGenColor] = useState('#4f46e5');
  const [genHeader, setGenHeader] = useState('Parceria e Novidades');
  const [genGreeting, setGenGreeting] = useState('Olá, {{nome}}!');
  const [genBody, setGenBody] = useState('Temos o prazer de apresentar uma oferta desenhada sob medida para as necessidades de negócios da empresa {{empresa}}.\n\nClique no botão abaixo para agendar uma demonstração gratuita e sem compromisso conosco nesta semana.');
  const [genBtnText, setGenBtnText] = useState('Agendar Demonstração');
  const [genBtnUrl, setGenBtnUrl] = useState('https://exemplo.com/demonstracao');
  const [genFooter, setGenFooter] = useState('Você está recebendo este e-mail como parte da nossa lista de contatos profissionais para {{email}}.\n© 2026 Minha Empresa S.A. Todos os direitos reservados.');

  // Advanced Responsive & Structural Design Options
  const [genAlignment, setGenAlignment] = useState<'center' | 'left'>('center');
  const [genButtonBehavior, setGenButtonBehavior] = useState<'full' | 'auto'>('full');
  const [genBorderRadius, setGenBorderRadius] = useState<'none' | 'sm' | 'lg'>('lg');
  const [genFontSize, setGenFontSize] = useState<'normal' | 'large'>('normal');

  // Preview Device Simulator state
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');

  // Real Preview Modal States
  const [showRealPreviewModal, setShowRealPreviewModal] = useState(false);
  const [realPreviewDevice, setRealPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');

  // WYSIWYG Rich Editor States & References
  const [editorSubMode, setEditorSubMode] = useState<'visual' | 'code'>('visual');
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [statsModalOpen, setStatsModalOpen] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState('https://');
  const [linkText, setLinkText] = useState('Clique Aqui');
  const [showImgModal, setShowImgModal] = useState(false);
  const [imgUrl, setImgUrl] = useState('https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600');
  const [imgWidth, setImgWidth] = useState('100%');
  const [imgHeight, setImgHeight] = useState('');
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [videoUrl, setVideoUrl] = useState('https://www.youtube.com/embed/dQw4w9WgXcQ');
  const [showTableModal, setShowTableModal] = useState(false);
  const [tableRows, setTableRows] = useState(3);
  const [tableCols, setTableCols] = useState(3);

  const [localTemplates, setLocalTemplates] = useState<{name: string, html: string}[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('my_email_templates') || '[]');
    } catch {
      return [];
    }
  });

  const saveLocalTemplate = (name: string) => {
    const newTemplates = [...localTemplates, { name, html: template }];
    setLocalTemplates(newTemplates);
    localStorage.setItem('my_email_templates', JSON.stringify(newTemplates));
  };

  const deleteLocalTemplate = (index: number) => {
    const newTemplates = localTemplates.filter((_, i) => i !== index);
    setLocalTemplates(newTemplates);
    localStorage.setItem('my_email_templates', JSON.stringify(newTemplates));
  };

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const isEditingRef = useRef(false);
  const lastHTMLRef = useRef(template);
  const [editingPresetIndex, setEditingPresetIndex] = useState<number | null>(null);
  const [editingPresetData, setEditingPresetData] = useState<any>(null);
  const [showPresetHtmlModal, setShowPresetHtmlModal] = useState<boolean>(false);
  const [showPresetPreviewModal, setShowPresetPreviewModal] = useState<boolean>(false);
  const [activePresetForModal, setActivePresetForModal] = useState<any>(null);

  const [editablePresets, setEditablePresets] = useState(() => {
    const saved = localStorage.getItem('professional_templates_custom');
    if (saved) return JSON.parse(saved);
    return [
    {
      name: 'Padrão (Novidades)',
      description: 'Estrutura tradicional com cabeçalho colorido e corpo centralizado.',
      color: '#4f46e5',
      html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #334155; margin: 0; padding: 20px; -webkit-text-size-adjust: 100%; }
    .card { background-color: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; max-width: 600px; margin: 0 auto; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
    .header { background-color: #4f46e5; color: #ffffff; padding: 32px 24px; text-align: center; }
    .content { padding: 32px 24px; line-height: 1.6; }
    .footer { background-color: #f1f5f9; padding: 16px 24px; text-align: center; font-size: 12px; color: #64748b; }
    .btn { display: inline-block; background-color: #4f46e5; color: #ffffff !important; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; margin-top: 16px; }
    h2 { color: #1e1b4b; margin-top: 0; }
    
    /* Regras de Visualização Responsiva Mobile */
    @media only screen and (max-width: 600px) {
      body { padding: 10px !important; }
      .card { border-radius: 0 !important; border: none !important; width: 100% !important; }
      .header { padding: 24px 16px !important; }
      .content { padding: 24px 16px !important; }
      .btn { display: block !important; width: 100% !important; text-align: center !important; padding: 14px 16px !important; box-sizing: border-box !important; font-size: 16px !important; }
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1 style="margin:0; font-size:24px;">Novidades Especiais</h1>
    </div>
    <div class="content">
      <h2>Olá, {{nome}}!</h2>
      <p>Esperamos que este e-mail lhe encontre bem na empresa <strong>{{empresa}}</strong>.</p>
      <p>Temos o prazer de apresentar uma oferta desenhada sob medida para as suas necessidades de negócios. Clique no botão abaixo para agendar uma demonstração gratuita conosco.</p>
      <div style="text-align: center;">
        <a href="https://exemplo.com" class="btn">Agendar Demonstração</a>
      </div>
      <p style="margin-top: 24px;">Atenciosamente,<br>Equipe Comercial</p>
    </div>
    <div class="footer">
      Você está recebendo este e-mail comercial enviado para {{email}}.<br>
      © 2026 Minha Empresa S.A. Todos os direitos reservados.
    </div>
  </div>
</body>
</html>`
    },
    {
      name: 'Boas-Vindas Elegante',
      description: 'Perfeito para acolher novos parceiros com layout moderno em verde-esmeralda.',
      color: '#10b981',
      html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #334155; margin: 0; padding: 20px; -webkit-text-size-adjust: 100%; }
    .card { background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; max-width: 600px; margin: 0 auto; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .header { background-color: #10b981; color: #ffffff; padding: 40px 24px; text-align: center; }
    .content { padding: 36px 28px; line-height: 1.6; }
    .footer { background-color: #f8fafc; padding: 20px 24px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #f1f5f9; }
    .btn { display: inline-block; background-color: #10b981; color: #ffffff !important; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; margin: 20px 0; box-shadow: 0 2px 4px rgba(16,185,129,0.2); }
    h1 { margin: 0; font-size: 26px; font-weight: 800; }
    h2 { color: #064e3b; margin-top: 0; font-size: 20px; }
    
    /* Regras de Visualização Responsiva Mobile */
    @media only screen and (max-width: 600px) {
      body { padding: 10px !important; }
      .card { border-radius: 0 !important; border: none !important; width: 100% !important; }
      .header { padding: 30px 16px !important; }
      .content { padding: 24px 16px !important; }
      .btn { display: block !important; width: 100% !important; text-align: center !important; padding: 14px 16px !important; box-sizing: border-box !important; font-size: 16px !important; }
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>Bem-vindo à nossa comunidade!</h1>
    </div>
    <div class="content">
      <h2>Que bom ter você conosco, {{nome}}!</h2>
      <p>Seu cadastro associado à empresa <strong>{{empresa}}</strong> foi ativado com sucesso em nossos servidores.</p>
      <p>Estamos muito entusiasmados em ajudar você e seu time a alcançar novos patamares de produtividade e segurança de entregas em tempo recorde.</p>
      <div style="text-align: center;">
        <a href="https://exemplo.com/comecar" class="btn">Conhecer Meu Painel</a>
      </div>
      <p>Como primeiro passo recomendado, clique no botão acima para acessar o tutorial de introdução que preparamos para você.</p>
      <p style="margin-top: 24px; border-top: 1px solid #f1f5f9; padding-top: 16px; font-size: 13px; color: #64748b;">
        Abraços,<br>
        <strong>Equipe de Sucesso do Cliente</strong>
      </p>
    </div>
    <div class="footer">
      Você está recebendo este e-mail como parte do seu cadastro corporativo para {{email}}.<br>
      © 2026 Minha Empresa S.A. Todos os direitos reservados.
    </div>
  </div>
</body>
</html>`
    },
    {
      name: 'Informativo / Newsletter',
      description: 'Ideal para boletins com múltiplos artigos e seções separadas.',
      color: '#3b82f6',
      html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f1f5f9; color: #334155; margin: 0; padding: 20px; -webkit-text-size-adjust: 100%; }
    .card { background-color: #ffffff; border-radius: 16px; border: 1px solid #cbd5e1; max-width: 600px; margin: 0 auto; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05); }
    .header { background-color: #3b82f6; color: #ffffff; padding: 32px; text-align: left; }
    .content { padding: 32px; line-height: 1.6; }
    .footer { background-color: #f8fafc; padding: 24px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0; }
    .badge { display: inline-block; background-color: #dbeafe; color: #1e40af; font-size: 11px; font-weight: bold; padding: 4px 10px; border-radius: 9999px; margin-bottom: 12px; }
    .item-row { margin-bottom: 24px; padding-bottom: 20px; border-bottom: 1px dashed #e2e8f0; }
    .item-row:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
    h1 { margin: 0; font-size: 22px; font-weight: bold; }
    h3 { margin: 0 0 8px 0; color: #1e3a8a; font-size: 16px; }
    
    /* Regras de Visualização Responsiva Mobile */
    @media only screen and (max-width: 600px) {
      body { padding: 10px !important; }
      .card { border-radius: 0 !important; border: none !important; width: 100% !important; }
      .header { padding: 24px 16px !important; }
      .content { padding: 24px 16px !important; }
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="badge">CONTEÚDO EXCLUSIVO</div>
      <h1>Informativo Semanal da {{empresa}}</h1>
    </div>
    <div class="content">
      <p>Olá, {{nome}}! Preparamos uma curadoria de conteúdos e dicas especiais para acelerar os resultados de seu time nesta semana.</p>
      
      <div style="margin-top: 28px;">
        <div class="item-row">
          <h3>🚀 1. Como contornar filtros anti-spam corporativos</h3>
          <p style="margin: 0; font-size: 14px; color: #475569;">Entenda as principais regras de SPF, DKIM e DMARC que garantem que seus e-mails cheguem diretamente na caixa de entrada principal do seu cliente.</p>
        </div>
        
        <div class="item-row">
          <h3>📊 2. Novas métricas de engajamento no painel</h3>
          <p style="margin: 0; font-size: 14px; color: #475569;">A partir de hoje, você pode acompanhar as taxas de abertura e rejeição diretamente de seu painel de relatórios integrados.</p>
        </div>
      </div>
      
      <div style="text-align: center; margin-top: 24px;">
        <a href="https://exemplo.com/blog" style="display: inline-block; background-color: #3b82f6; color: #ffffff !important; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">Acessar Nosso Blog Completo</a>
      </div>
    </div>
    <div class="footer">
      Este informativo foi enviado para o e-mail cadastrado de {{nome}} ({{email}}).<br>
      Caso não queira mais receber nossos boletins, <a href="https://exemplo.com/descadastrar" style="color: #3b82f6; text-decoration: underline;">clique aqui para sair</a>.<br>
      © 2026 {{empresa}}. Todos os direitos reservados.
    </div>
  </div>
</body>
</html>`
    },
    {
      name: 'Oferta e Cupom (Promocional)',
      description: 'Ideal para lançar cupons de descontos com alto contraste e urgência.',
      color: '#f43f5e',
      html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #fff1f2; color: #334155; margin: 0; padding: 20px; -webkit-text-size-adjust: 100%; }
    .card { background-color: #ffffff; border-radius: 16px; border: 1px solid #fecdd3; max-width: 600px; margin: 0 auto; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(244,63,94,0.08); }
    .header { background-color: #f43f5e; color: #ffffff; padding: 40px 24px; text-align: center; }
    .content { padding: 32px; line-height: 1.6; text-align: center; }
    .footer { background-color: #fff1f2; padding: 20px; text-align: center; font-size: 11px; color: #9f1239; }
    .coupon { border: 2px dashed #f43f5e; background-color: #fff1f2; padding: 16px; border-radius: 10px; display: inline-block; margin: 20px 0; font-family: monospace; font-size: 22px; font-weight: bold; color: #be123c; letter-spacing: 2px; }
    .btn { display: inline-block; background-color: #f43f5e; color: #ffffff !important; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 10px; box-shadow: 0 4px 6px -1px rgba(244,63,94,0.3); }
    h1 { margin: 0; font-size: 28px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; }
    h2 { color: #881337; margin-top: 0; font-size: 22px; }
    
    /* Regras de Visualização Responsiva Mobile */
    @media only screen and (max-width: 600px) {
      body { padding: 10px !important; }
      .card { border-radius: 0 !important; border: none !important; width: 100% !important; }
      .header { padding: 28px 16px !important; }
      .content { padding: 24px 16px !important; }
      .coupon { font-size: 18px !important; padding: 12px !important; display: block !important; }
      .btn { display: block !important; width: 100% !important; text-align: center !important; padding: 14px 16px !important; box-sizing: border-box !important; }
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>Oferta Especial Imperdível!</h1>
    </div>
    <div class="content">
      <h2>Olá, {{nome}}! Desconto exclusivo para você.</h2>
      <p>Temos uma excelente notícia! Como parceiro de destaque da empresa <strong>{{empresa}}</strong>, você acaba de ganhar um cupom especial de 35% de desconto em nossa assinatura anual.</p>
      
      <div class="coupon">
        DESCONTO35OFF
      </div>
      
      <p style="margin: 0 0 16px 0; font-size: 13px; color: #64748b;">*Válido por tempo limitado. Aproveite para atualizar seu plano hoje!</p>
      
      <div>
        <a href="https://exemplo.com/assinar" class="btn">Ativar Desconto Agora</a>
      </div>
    </div>
    <div class="footer">
      Promoção exclusiva enviada para {{email}}.<br>
      © 2026 {{empresa}} S.A. Todos os direitos reservados.
    </div>
  </div>
</body>
</html>`
    },
    {
      name: 'Pesquisa e Feedback',
      description: 'Estilo clean e convidativo focado em recolher feedbacks de clientes.',
      color: '#d97706',
      html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #fafaf9; color: #44403c; margin: 0; padding: 20px; -webkit-text-size-adjust: 100%; }
    .card { background-color: #ffffff; border-radius: 12px; border: 1px solid #e7e5e4; max-width: 600px; margin: 0 auto; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); }
    .header { background-color: #78350f; color: #ffffff; padding: 32px 24px; text-align: center; }
    .content { padding: 32px 28px; line-height: 1.6; }
    .footer { background-color: #f5f5f4; padding: 16px 24px; text-align: center; font-size: 11px; color: #78716c; }
    .btn { display: inline-block; background-color: #d97706; color: #ffffff !important; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; margin-top: 16px; }
    h1 { margin: 0; font-size: 22px; font-weight: bold; }
    h2 { color: #451a03; margin-top: 0; font-size: 18px; }
    
    /* Regras de Visualização Responsiva Mobile */
    @media only screen and (max-width: 600px) {
      body { padding: 10px !important; }
      .card { border-radius: 0 !important; border: none !important; width: 100% !important; }
      .header { padding: 24px 16px !important; }
      .content { padding: 24px 16px !important; }
      .btn { display: block !important; width: 100% !important; text-align: center !important; padding: 14px 16px !important; box-sizing: border-box !important; font-size: 16px !important; }
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>Sua opinião é fundamental!</h1>
    </div>
    <div class="content">
      <h2>Obrigado pela confiança, {{nome}}!</h2>
      <p>Recentemente você interagiu com a equipe da <strong>{{empresa}}</strong>. Queremos garantir que estamos fornecendo a melhor experiência de entregas e contatos possíveis.</p>
      <p>Poderia nos dedicar 2 minutinhos para responder a uma pesquisa de satisfação rápida? Prometemos que é muito simples!</p>
      <div style="text-align: center; margin: 24px 0;">
        <a href="https://exemplo.com/pesquisa" class="btn">Responder Pesquisa</a>
      </div>
      <p>Seus feedbacks ajudam diretamente a moldar as novas updates do nosso sistema de envios.</p>
      <p style="margin-top: 24px; font-size: 13px; color: #78716c;">Com carinho,<br><strong>Equipe de Relacionamento</strong></p>
    </div>
    <div class="footer">
      E-mail de controle de qualidade enviado para {{email}}.<br>
      © 2026 {{empresa}} Ltda.
    </div>
  </div>
</body>
</html>`
    }
  ];
  });

  const updatePreset = (index: number, updatedPreset: any) => {
    const newPresets = [...editablePresets];
    newPresets[index] = updatedPreset;
    setEditablePresets(newPresets);
    localStorage.setItem('professional_templates_custom', JSON.stringify(newPresets));
  };

  const loadPreset = (presetHtml: string) => {
    onTemplateChanged(presetHtml);
  };

  const insertTag = (placeholder: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const startPos = textarea.selectionStart;
    const endPos = textarea.selectionEnd;
    const currentText = textarea.value;
    const tagToInsert = `{{${placeholder}}}`;

    const updatedText = currentText.substring(0, startPos) + tagToInsert + currentText.substring(endPos);
    onTemplateChanged(updatedText);

    // Refocus and place cursor right after inserted tag
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = startPos + tagToInsert.length;
    }, 50);
  };

  // Helper function to wrap highlighted selection or insert HTML snippets
  const wrapSelectionWithTag = (startTag: string, endTag: string, defaultText = 'Texto') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const startPos = textarea.selectionStart;
    const endPos = textarea.selectionEnd;
    const currentText = textarea.value;
    
    const selectedText = currentText.substring(startPos, endPos);
    const replacement = startTag + (selectedText || defaultText) + endTag;

    const updatedText = currentText.substring(0, startPos) + replacement + currentText.substring(endPos);
    onTemplateChanged(updatedText);

    // Refocus and select the entire replacement so the user sees where it was inserted
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = startPos;
      textarea.selectionEnd = startPos + replacement.length;
    }, 50);
  };

  // Synchronize external changes into the iframe body
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe || editorSubMode !== 'visual') return;

    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return;

    if (isEditingRef.current) {
      // Editing came from inside, don't re-write entire doc (would lose caret position)
      return;
    }

    // Write full html initially or on reset
    doc.open();
    // Default fallback template if empty
    const editableHtml = template || `<!DOCTYPE html>\n<html>\n<head>\n  <meta charset="utf-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <style>\n    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #334155; margin: 0; padding: 20px; }\n    .card { background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; max-width: 600px; margin: 0 auto; padding: 32px 24px; min-height: 300px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }\n  </style>\n</head>\n<body>\n  <div class="card">\n    <h2>Nova Mensagem</h2>\n    <p>Comece a escrever seu e-mail de sucesso aqui...</p>\n  </div>\n</body>\n</html>`;
    doc.write(editableHtml);
    doc.close();

    if (doc.body) {
      doc.body.contentEditable = "true";
      // Inject some help styles for editing
      const style = doc.createElement('style');
      style.innerHTML = `
        body { outline: none !important; min-height: 100vh; cursor: text; -webkit-text-size-adjust: 100%; }
        [contenteditable] { outline: none !important; }
        table { border-collapse: collapse; width: 100%; margin: 16px 0; }
        table td, table th { border: 1px dashed #cbd5e1; padding: 8px; min-width: 50px; }
      `;
      doc.head.appendChild(style);

      const updateHandler = () => {
        isEditingRef.current = true;
        // Construct full html string
        const doctype = "<!DOCTYPE html>";
        const rootHtml = doc.documentElement.outerHTML;
        const completeHtml = doctype + "\n" + rootHtml;
        lastHTMLRef.current = completeHtml;
        onTemplateChanged(completeHtml);
        
        setTimeout(() => {
          isEditingRef.current = false;
        }, 10);
      };

      doc.body.addEventListener('input', updateHandler);
      doc.body.addEventListener('keyup', updateHandler);
      doc.body.addEventListener('paste', updateHandler);
      doc.body.addEventListener('drop', updateHandler);

      return () => {
        doc.body?.removeEventListener('input', updateHandler);
        doc.body?.removeEventListener('keyup', updateHandler);
        doc.body?.removeEventListener('paste', updateHandler);
        doc.body?.removeEventListener('drop', updateHandler);
      };
    }
  }, [template, editorSubMode]);

  // Helper to execute commands in the active editor mode
  const executeEditorCommand = (command: string, value: string | undefined = undefined) => {
    if (editorSubMode === 'visual') {
      const iframe = iframeRef.current;
      if (!iframe) return;
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!doc) return;
      
      iframe.contentWindow?.focus();
      doc.execCommand(command, false, value);
      
      // Trigger sync
      const completeHtml = "<!DOCTYPE html>\n" + doc.documentElement.outerHTML;
      lastHTMLRef.current = completeHtml;
      onTemplateChanged(completeHtml);
    } else {
      // In code mode, fall back to inserting tags or wrappers!
      if (command === 'bold') wrapSelectionWithTag('<strong>', '</strong>', 'Texto em Negrito');
      else if (command === 'italic') wrapSelectionWithTag('<em>', '</em>', 'Texto em Itálico');
      else if (command === 'underline') wrapSelectionWithTag('<u>', '</u>', 'Texto Sublinhado');
      else if (command === 'strikeThrough') wrapSelectionWithTag('<del>', '</del>', 'Texto Riscado');
      else if (command === 'justifyLeft') wrapSelectionWithTag('<div style="text-align: left;">', '</div>');
      else if (command === 'justifyCenter') wrapSelectionWithTag('<div style="text-align: center;">', '</div>');
      else if (command === 'justifyRight') wrapSelectionWithTag('<div style="text-align: right;">', '</div>');
      else if (command === 'justifyFull') wrapSelectionWithTag('<div style="text-align: justify;">', '</div>');
      else if (command === 'insertUnorderedList') wrapSelectionWithTag('<ul>\n  <li>', '</li>\n</ul>');
      else if (command === 'insertOrderedList') wrapSelectionWithTag('<ol>\n  <li>', '</li>\n</ol>');
      else if (command === 'outdent') wrapSelectionWithTag('<div style="margin-left: 0;">', '</div>');
      else if (command === 'indent') wrapSelectionWithTag('<div style="margin-left: 20px;">', '</div>');
      else if (command === 'removeFormat') {
        const textarea = textareaRef.current;
        if (!textarea) return;
        const startPos = textarea.selectionStart;
        const endPos = textarea.selectionEnd;
        const txt = textarea.value;
        const sel = txt.substring(startPos, endPos);
        const cleaned = sel.replace(/<\/?[^>]+(>|$)/g, "");
        onTemplateChanged(txt.substring(0, startPos) + cleaned + txt.substring(endPos));
      }
    }
  };

  // Helper to insert arbitrary HTML at the current cursor / visual selection
  const insertHtmlAtCursor = (html: string) => {
    if (editorSubMode === 'visual') {
      const iframe = iframeRef.current;
      if (!iframe) return;
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!doc) return;

      iframe.contentWindow?.focus();
      doc.execCommand('insertHTML', false, html);
      
      const completeHtml = "<!DOCTYPE html>\n" + doc.documentElement.outerHTML;
      lastHTMLRef.current = completeHtml;
      onTemplateChanged(completeHtml);
    } else {
      wrapSelectionWithTag(html, '');
    }
  };

  // Helper to insert custom table HTML structures
  const handleInsertTable = (rows: number, cols: number) => {
    let tableHtml = `<table style="width:100%; border-collapse:collapse; margin:20px 0; font-family:sans-serif; font-size:13px; color:#475569;">\n`;
    for (let i = 0; i < rows; i++) {
      tableHtml += `  <tr>\n`;
      for (let j = 0; j < cols; j++) {
        if (i === 0) {
          tableHtml += `    <th style="border:1px solid #cbd5e1; background-color:#f1f5f9; padding:10px; font-weight:bold; text-align:left;">Cabeçalho</th>\n`;
        } else {
          tableHtml += `    <td style="border:1px solid #cbd5e1; padding:10px;">Item</td>\n`;
        }
      }
      tableHtml += `  </tr>\n`;
    }
    tableHtml += `</table>`;
    insertHtmlAtCursor(tableHtml);
  };

  // Compile and substitute variables for a preview recipient
  const getRenderedPreview = () => {
    if (recipients.length === 0) {
      return template ? template : '<div class="p-6 text-slate-400 text-center">Nenhum destinatário carregado para visualização em tempo real.</div>';
    }

    const recipient = recipients[previewRecipientIdx] || recipients[0];
    let rendered = template;

    // Standard mappings
    for (const mapping of mappings) {
      const regex = new RegExp(`\\{\\{\\s*${escapeRegExp(mapping.placeholder)}\\s*\\}\\}`, 'gi');
      const val = recipient[mapping.columnName] ?? '';
      rendered = rendered.replace(regex, String(val));
    }

    // Auto mapping remaining columns
    for (const key of Object.keys(recipient)) {
      if (key === 'id') continue;
      const regex = new RegExp(`\\{\\{\\s*${escapeRegExp(key)}\\s*\\}\\}`, 'gi');
      const val = recipient[key] ?? '';
      rendered = rendered.replace(regex, String(val));
    }

    return rendered;
  };

  // Get real compiled preview for the first recipient (row 0)
  const getRealPreviewForFirstRecipient = () => {
    if (recipients.length === 0) {
      return template ? template : '<div class="p-6 text-slate-400 text-center">Nenhum destinatário carregado. Por favor, carregue uma planilha na aba correspondente para simular as variáveis em tempo real.</div>';
    }

    const recipient = recipients[0];
    let rendered = template;

    // Standard mappings
    for (const mapping of mappings) {
      const regex = new RegExp(`\\{\\{\\s*${escapeRegExp(mapping.placeholder)}\\s*\\}\\}`, 'gi');
      const val = recipient[mapping.columnName] ?? '';
      rendered = rendered.replace(regex, String(val));
    }

    // Auto mapping remaining columns
    for (const key of Object.keys(recipient)) {
      if (key === 'id') continue;
      const regex = new RegExp(`\\{\\{\\s*${escapeRegExp(key)}\\s*\\}\\}`, 'gi');
      const val = recipient[key] ?? '';
      rendered = rendered.replace(regex, String(val));
    }

    return rendered;
  };

  function escapeRegExp(string: string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // Compile visual options into HTML and switch to editor tab
  const handleGenerateFromVisual = () => {
    const fontSizeBody = genFontSize === 'large' ? '17px' : '15px';
    const fontSizeH1 = genFontSize === 'large' ? '28px' : '24px';
    const fontSizeH2 = genFontSize === 'large' ? '22px' : '19px';
    const borderRadiusVal = genBorderRadius === 'lg' ? '16px' : genBorderRadius === 'sm' ? '6px' : '0px';
    const alignmentText = genAlignment === 'left' ? 'left' : 'center';

    const bodyParagraphs = genBody
      .split('\n')
      .map(p => p.trim())
      .filter(p => p.length > 0)
      .map(p => `<p style="margin-bottom: 16px; font-size: ${fontSizeBody}; color: #334155; line-height: 1.6; text-align: ${alignmentText};">${p}</p>`)
      .join('\n      ');

    const generatedHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #334155; margin: 0; padding: 20px; -webkit-text-size-adjust: 100%; }
    .card { background-color: #ffffff; border-radius: ${borderRadiusVal}; border: 1px solid #e2e8f0; max-width: 600px; margin: 0 auto; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .header { background-color: ${genColor}; color: #ffffff; padding: 36px 24px; text-align: ${alignmentText}; }
    .content { padding: 32px 24px; line-height: 1.6; }
    .footer { background-color: #f1f5f9; padding: 20px 24px; text-align: ${alignmentText}; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0; }
    .btn { display: inline-block; background-color: ${genColor}; color: #ffffff !important; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; margin-top: 16px; box-shadow: 0 3px 5px rgba(0,0,0,0.04); }
    h1 { margin: 0; font-size: ${fontSizeH1}; font-weight: bold; }
    h2 { color: #1e1b4b; margin-top: 0; font-size: ${fontSizeH2}; text-align: ${alignmentText}; }
    
    /* Regras de Visualização Responsiva Mobile */
    @media only screen and (max-width: 600px) {
      body { padding: 10px !important; }
      .card { border-radius: 0 !important; border: none !important; width: 100% !important; }
      .header { padding: 28px 16px !important; }
      .content { padding: 24px 16px !important; }
      .btn { ${genButtonBehavior === 'full' ? 'display: block !important; width: 100% !important; text-align: center !important; padding: 14px 16px !important; box-sizing: border-box !important; font-size: 16px !important;' : ''} }
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>${genHeader}</h1>
    </div>
    <div class="content">
      <h2>${genGreeting}</h2>
      ${bodyParagraphs}
      ${genBtnText ? `
      <div style="text-align: ${alignmentText}; margin: 24px 0;">
        <a href="${genBtnUrl}" class="btn">${genBtnText}</a>
      </div>` : ''}
    </div>
    <div class="footer">
      ${genFooter.replace(/\n/g, '<br>\n      ')}
    </div>
  </div>
</body>
</html>`;
    onTemplateChanged(generatedHtml);
    setActiveTab('editor');
  };

  const sampleTags = mappings.length > 0 ? mappings : [
    { placeholder: 'nome', columnName: '' },
    { placeholder: 'empresa', columnName: '' },
    { placeholder: 'email', columnName: '' }
  ];

  const themeColors = [
    { name: 'Indigo', hex: '#4f46e5' },
    { name: 'Emeralda', hex: '#10b981' },
    { name: 'Azul', hex: '#3b82f6' },
    { name: 'Rosa', hex: '#f43f5e' },
    { name: 'Laranja', hex: '#d97706' },
    { name: 'Grafite', hex: '#475569' },
    { name: 'Roxo', hex: '#7c3aed' }
  ];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 space-y-5" id="template-editor-panel">
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between border-b border-slate-100 pb-5 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600 shadow-sm border border-indigo-100/30">
            <Code className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">Modelo de E-mail (HTML)</h3>
            <p className="text-xs text-slate-500">Escreva, formate ou monte layouts dinâmicos em tempo real</p>
          </div>
        </div>

        {/* Tab Selectors & Real Preview Button */}
        <div className="flex flex-wrap items-center gap-3 self-start xl:self-auto">
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/50">
            <button
              id="editor-tab-btn"
              type="button"
              onClick={() => setActiveTab('editor')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 transition cursor-pointer ${
                activeTab === 'editor'
                  ? 'bg-white text-indigo-700 shadow-sm border border-indigo-100/20'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Code className="h-3.5 w-3.5" />
              Editor de Código
            </button>
            
            <button
              id="generator-tab-btn"
              type="button"
              onClick={() => setActiveTab('generator')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 transition cursor-pointer ${
                activeTab === 'generator'
                  ? 'bg-white text-indigo-700 shadow-sm border border-indigo-100/20'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5 text-indigo-500 animate-pulse" />
              Gerador Visual
            </button>

            <button
              id="preview-tab-btn"
              type="button"
              onClick={() => setActiveTab('preview')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 transition cursor-pointer ${
                activeTab === 'preview'
                  ? 'bg-white text-indigo-700 shadow-sm border border-indigo-100/20'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Eye className="h-3.5 w-3.5" />
              Visualização
            </button>
          </div>

          <button
            id="real-preview-modal-trigger"
            type="button"
            onClick={() => setShowRealPreviewModal(true)}
            className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5 transition cursor-pointer shadow-sm shadow-indigo-600/10 hover:shadow-indigo-600/25 active:scale-[0.98]"
          >
            <Eye className="h-3.5 w-3.5 text-white" />
            Visualização Real (1ª Linha)
          </button>
        </div>
      </div>

      {activeTab === 'editor' && (
        <div className="space-y-4">
          
          {/* Quick Insert Variables Panel */}
          <div className="space-y-2 bg-slate-50 p-3.5 border border-slate-200/60 rounded-2xl">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-indigo-500 animate-pulse" />
                Vincular variáveis do Excel/CSV no cursor do texto:
              </span>
            </div>
            
            <div className="flex flex-wrap gap-1.5">
              {sampleTags.map((tag, idx) => (
                <button
                  key={idx}
                  id={`insert-tag-btn-${tag.placeholder}`}
                  type="button"
                  onClick={() => insertHtmlAtCursor(`{{${tag.placeholder}}}`)}
                  className="px-2.5 py-1 text-[11px] bg-white hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 font-mono border border-slate-200 hover:border-indigo-200 rounded-lg transition flex items-center gap-1 cursor-pointer shadow-2xs font-semibold"
                >
                  {"{{"}{tag.placeholder}{"}}"}
                </button>
              ))}
            </div>
          </div>

          {/* Menubar (as shown in the reference image) */}
          <div className="bg-slate-100 border border-slate-200 rounded-t-2xl px-4 py-2 flex flex-wrap gap-1.5 items-center justify-between select-none relative z-20 shrink-0">
            <div className="flex flex-wrap items-center gap-1">
              
              {/* ARQUIVO */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setActiveDropdown(activeDropdown === 'arquivo' ? null : 'arquivo')}
                  className="px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200/80 hover:text-slate-900 rounded-md transition flex items-center gap-1 cursor-pointer"
                >
                  Arquivo <ChevronDown className="h-3 w-3 opacity-60" />
                </button>
                {activeDropdown === 'arquivo' && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setActiveDropdown(null)} />
                    <div className="absolute left-0 mt-1 w-48 bg-white border border-slate-200 rounded-lg shadow-lg py-1.5 z-40 text-xs text-slate-700 font-medium">
                      <button
                        type="button"
                        onClick={() => {
                          onTemplateChanged('<!DOCTYPE html>\n<html>\n<head>\n  <meta charset="utf-8">\n</head>\n<body>\n  <div style="font-family: sans-serif; padding: 20px;">\n    <h2>Novo Modelo de E-mail</h2>\n    <p>Comece a escrever aqui...</p>\n  </div>\n</body>\n</html>');
                          setActiveDropdown(null);
                        }}
                        className="w-full text-left px-4 py-1.5 hover:bg-slate-100 flex items-center gap-2"
                      >
                        <FileText className="h-3.5 w-3.5 text-slate-400" /> Novo Modelo
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onTemplateChanged('');
                          setActiveDropdown(null);
                        }}
                        className="w-full text-left px-4 py-1.5 hover:bg-slate-100 flex items-center gap-2 text-rose-600 hover:text-rose-700"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Limpar Tudo
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          loadPreset(editablePresets[0].html);
                          setActiveDropdown(null);
                        }}
                        className="w-full text-left px-4 py-1.5 hover:bg-slate-100 flex items-center gap-2"
                      >
                        <RotateCcw className="h-3.5 w-3.5 text-slate-400" /> Restaurar Padrão
                      </button>
                      <hr className="my-1 border-slate-100" />
                      <button
                        type="button"
                        onClick={() => {
                          const name = window.prompt('Nome do modelo:');
                          if (name) saveLocalTemplate(name);
                          setActiveDropdown(null);
                        }}
                        className="w-full text-left px-4 py-1.5 hover:bg-slate-100 flex items-center gap-2"
                      >
                        <PlusCircle className="h-3.5 w-3.5 text-indigo-500" /> Salvar Modelo Localmente
                      </button>
                      <hr className="my-1 border-slate-100" />
                      <button
                        type="button"
                        onClick={() => {
                          window.print();
                          setActiveDropdown(null);
                        }}
                        className="w-full text-left px-4 py-1.5 hover:bg-slate-100 flex items-center gap-2"
                      >
                        <Printer className="h-3.5 w-3.5 text-slate-400" /> Imprimir Modelo
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* EDITAR */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setActiveDropdown(activeDropdown === 'editar' ? null : 'editar')}
                  className="px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200/80 hover:text-slate-900 rounded-md transition flex items-center gap-1 cursor-pointer"
                >
                  Editar <ChevronDown className="h-3 w-3 opacity-60" />
                </button>
                {activeDropdown === 'editar' && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setActiveDropdown(null)} />
                    <div className="absolute left-0 mt-1 w-48 bg-white border border-slate-200 rounded-lg shadow-lg py-1.5 z-40 text-xs text-slate-700 font-medium">
                      <button
                        type="button"
                        onClick={() => {
                          executeEditorCommand('undo');
                          setActiveDropdown(null);
                        }}
                        className="w-full text-left px-4 py-1.5 hover:bg-slate-100 flex items-center gap-2"
                      >
                        <Undo className="h-3.5 w-3.5 text-slate-400" /> Desfazer (Ctrl+Z)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          executeEditorCommand('redo');
                          setActiveDropdown(null);
                        }}
                        className="w-full text-left px-4 py-1.5 hover:bg-slate-100 flex items-center gap-2"
                      >
                        <Redo className="h-3.5 w-3.5 text-slate-400" /> Refazer (Ctrl+Y)
                      </button>
                      <hr className="my-1 border-slate-100" />
                      <button
                        type="button"
                        onClick={() => {
                          executeEditorCommand('cut');
                          setActiveDropdown(null);
                        }}
                        className="w-full text-left px-4 py-1.5 hover:bg-slate-100 flex items-center gap-2"
                      >
                        <Scissors className="h-3.5 w-3.5 text-slate-400" /> Recortar
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          executeEditorCommand('copy');
                          setActiveDropdown(null);
                        }}
                        className="w-full text-left px-4 py-1.5 hover:bg-slate-100 flex items-center gap-2"
                      >
                        <Copy className="h-3.5 w-3.5 text-slate-400" /> Copiar
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* INSERIR */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setActiveDropdown(activeDropdown === 'inserir' ? null : 'inserir')}
                  className="px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200/80 hover:text-slate-900 rounded-md transition flex items-center gap-1 cursor-pointer"
                >
                  Inserir <ChevronDown className="h-3 w-3 opacity-60" />
                </button>
                {activeDropdown === 'inserir' && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setActiveDropdown(null)} />
                    <div className="absolute left-0 mt-1 w-52 bg-white border border-slate-200 rounded-lg shadow-lg py-1.5 z-40 text-xs text-slate-700 font-medium">
                      
                      <button
                        type="button"
                        onClick={() => {
                          setShowLinkModal(true);
                          setActiveDropdown(null);
                        }}
                        className="w-full text-left px-4 py-1.5 hover:bg-slate-100 flex items-center gap-2"
                      >
                        <Link className="h-3.5 w-3.5 text-indigo-500" /> Inserir Hyperlink...
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setShowImgModal(true);
                          setActiveDropdown(null);
                        }}
                        className="w-full text-left px-4 py-1.5 hover:bg-slate-100 flex items-center gap-2"
                      >
                        <Paintbrush className="h-3.5 w-3.5 text-indigo-500" /> Inserir Imagem...
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setShowVideoModal(true);
                          setActiveDropdown(null);
                        }}
                        className="w-full text-left px-4 py-1.5 hover:bg-slate-100 flex items-center gap-2"
                      >
                        <Film className="h-3.5 w-3.5 text-indigo-500" /> Inserir Vídeo Embed...
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setShowTableModal(true);
                          setActiveDropdown(null);
                        }}
                        className="w-full text-left px-4 py-1.5 hover:bg-slate-100 flex items-center gap-2"
                      >
                        <Table className="h-3.5 w-3.5 text-indigo-500" /> Inserir Tabela Customizada...
                      </button>

                      <hr className="my-1 border-slate-100" />

                      <button
                        type="button"
                        onClick={() => {
                          insertHtmlAtCursor('<hr style="border:0; border-top:1px solid #cbd5e1; margin:24px 0;" />');
                          setActiveDropdown(null);
                        }}
                        className="w-full text-left px-4 py-1.5 hover:bg-slate-100 flex items-center gap-2"
                      >
                        <Sliders className="h-3.5 w-3.5 text-slate-400" /> Linha Divisória (HR)
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          insertHtmlAtCursor('<div style="background-color: #f1f5f9; border-left: 4px solid #4f46e5; padding: 16px; border-radius: 6px; margin: 16px 0; font-size: 13px; color: #475569;">\n  <strong>Aviso Importante:</strong> Digite seu aviso de destaque aqui.\n</div>');
                          setActiveDropdown(null);
                        }}
                        className="w-full text-left px-4 py-1.5 hover:bg-slate-100 flex items-center gap-2"
                      >
                        <Info className="h-3.5 w-3.5 text-slate-400" /> Bloco de Alerta Informativo
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          insertHtmlAtCursor(`<div style="border-top: 1px solid #e2e8f0; margin-top: 32px; padding-top: 16px; font-size: 11px; color: #64748b; text-align: center; line-height: 1.6;">\n  <p style="margin: 0 0 8px 0;">Você está recebendo esta mensagem comercial legal da <strong>{{empresa}}</strong>.</p>\n  <p style="margin: 0;">Em conformidade com a LGPD, caso deseje não receber nossos contatos, <a href="https://exemplo.com/remover" style="color: #4f46e5; text-decoration: underline; font-weight: bold;">clique aqui para cancelar inscrição</a>.</p>\n</div>`);
                          setActiveDropdown(null);
                        }}
                        className="w-full text-left px-4 py-1.5 hover:bg-slate-100 flex items-center gap-2"
                      >
                        <LayoutList className="h-3.5 w-3.5 text-slate-400" /> Rodapé Consentimento LGPD
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          insertHtmlAtCursor(`<table border="0" cellspacing="0" cellpadding="0" style="margin-top: 30px; border-top: 1px solid #f1f5f9; padding-top: 16px; width: 100%;">\n  <tr>\n    <td valign="top" style="width: 50px; padding-right: 12px;">\n      <div style="width: 48px; height: 48px; border-radius: 50%; background-color: #4f46e5; color: #ffffff; text-align: center; line-height: 48px; font-weight: bold; font-size: 16px;">\n        A\n      </div>\n    </td>\n    <td valign="top">\n      <div style="font-weight: bold; font-size: 14px; color: #1e1b4b;">Atenciosamente,</div>\n      <div style="font-weight: bold; font-size: 15px; color: #4f46e5; margin: 2px 0 4px 0;">Consultor Comercial</div>\n      <div style="font-size: 12px; color: #64748b;">Parcerias de Sucesso | {{empresa}}</div>\n    </td>\n  </tr>\n</table>`);
                          setActiveDropdown(null);
                        }}
                        className="w-full text-left px-4 py-1.5 hover:bg-slate-100 flex items-center gap-2"
                      >
                        <Check className="h-3.5 w-3.5 text-slate-400" /> Bloco de Assinatura Dinâmica
                      </button>

                    </div>
                  </>
                )}
              </div>

              {/* VISUALIZAR */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setActiveDropdown(activeDropdown === 'visualizar' ? null : 'visualizar')}
                  className="px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200/80 hover:text-slate-900 rounded-md transition flex items-center gap-1 cursor-pointer"
                >
                  Visualizar <ChevronDown className="h-3 w-3 opacity-60" />
                </button>
                {activeDropdown === 'visualizar' && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setActiveDropdown(null)} />
                    <div className="absolute left-0 mt-1 w-52 bg-white border border-slate-200 rounded-lg shadow-lg py-1.5 z-40 text-xs text-slate-700 font-medium">
                      <button
                        type="button"
                        onClick={() => {
                          setEditorSubMode('visual');
                          setActiveDropdown(null);
                        }}
                        className="w-full text-left px-4 py-1.5 hover:bg-slate-100 flex items-center justify-between"
                      >
                        <span className="flex items-center gap-2"><Eye className="h-3.5 w-3.5 text-slate-400" /> Modo Editor Visual (WYSIWYG)</span>
                        {editorSubMode === 'visual' && <Check className="h-3.5 w-3.5 text-indigo-600" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditorSubMode('code');
                          setActiveDropdown(null);
                        }}
                        className="w-full text-left px-4 py-1.5 hover:bg-slate-100 flex items-center justify-between"
                      >
                        <span className="flex items-center gap-2"><Code className="h-3.5 w-3.5 text-slate-400" /> Modo Código-Fonte HTML</span>
                        {editorSubMode === 'code' && <Check className="h-3.5 w-3.5 text-indigo-600" />}
                      </button>
                      <hr className="my-1 border-slate-100" />
                      <button
                        type="button"
                        onClick={() => {
                          setPreviewDevice('mobile');
                          setActiveDropdown(null);
                        }}
                        className="w-full text-left px-4 py-1.5 hover:bg-slate-100 flex items-center justify-between"
                      >
                        <span className="flex items-center gap-2"><Smartphone className="h-3.5 w-3.5 text-slate-400" /> Simular Celular</span>
                        {previewDevice === 'mobile' && <Check className="h-3.5 w-3.5 text-indigo-600" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPreviewDevice('desktop');
                          setActiveDropdown(null);
                        }}
                        className="w-full text-left px-4 py-1.5 hover:bg-slate-100 flex items-center justify-between"
                      >
                        <span className="flex items-center gap-2"><Monitor className="h-3.5 w-3.5 text-slate-400" /> Simular Computador</span>
                        {previewDevice === 'desktop' && <Check className="h-3.5 w-3.5 text-indigo-600" />}
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* FORMATAR */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setActiveDropdown(activeDropdown === 'formatar' ? null : 'formatar')}
                  className="px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200/80 hover:text-slate-900 rounded-md transition flex items-center gap-1 cursor-pointer"
                >
                  Formatar <ChevronDown className="h-3 w-3 opacity-60" />
                </button>
                {activeDropdown === 'formatar' && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setActiveDropdown(null)} />
                    <div className="absolute left-0 mt-1 w-48 bg-white border border-slate-200 rounded-lg shadow-lg py-1.5 z-40 text-xs text-slate-700 font-medium">
                      <button
                        type="button"
                        onClick={() => {
                          executeEditorCommand('bold');
                          setActiveDropdown(null);
                        }}
                        className="w-full text-left px-4 py-1.5 hover:bg-slate-100 flex items-center gap-2 font-bold"
                      >
                        <Bold className="h-3.5 w-3.5" /> Negrito
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          executeEditorCommand('italic');
                          setActiveDropdown(null);
                        }}
                        className="w-full text-left px-4 py-1.5 hover:bg-slate-100 flex items-center gap-2 italic"
                      >
                        <Italic className="h-3.5 w-3.5" /> Itálico
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          executeEditorCommand('underline');
                          setActiveDropdown(null);
                        }}
                        className="w-full text-left px-4 py-1.5 hover:bg-slate-100 flex items-center gap-2 underline"
                      >
                        <Underline className="h-3.5 w-3.5" /> Sublinhado
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          executeEditorCommand('strikeThrough');
                          setActiveDropdown(null);
                        }}
                        className="w-full text-left px-4 py-1.5 hover:bg-slate-100 flex items-center gap-2 line-through"
                      >
                        <Sliders className="h-3.5 w-3.5" /> Riscado (Tachado)
                      </button>
                      <hr className="my-1 border-slate-100" />
                      <button
                        type="button"
                        onClick={() => {
                          executeEditorCommand('removeFormat');
                          setActiveDropdown(null);
                        }}
                        className="w-full text-left px-4 py-1.5 hover:bg-slate-100 flex items-center gap-2 text-amber-600 font-semibold"
                      >
                        <Eraser className="h-3.5 w-3.5" /> Limpar Formatação
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* MESA (TABELA) */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setActiveDropdown(activeDropdown === 'mesa' ? null : 'mesa')}
                  className="px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200/80 hover:text-slate-900 rounded-md transition flex items-center gap-1 cursor-pointer"
                >
                  Mesa <ChevronDown className="h-3 w-3 opacity-60" />
                </button>
                {activeDropdown === 'mesa' && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setActiveDropdown(null)} />
                    <div className="absolute left-0 mt-1 w-52 bg-white border border-slate-200 rounded-lg shadow-lg py-1.5 z-40 text-xs text-slate-700 font-medium">
                      <button
                        type="button"
                        onClick={() => {
                          handleInsertTable(2, 2);
                          setActiveDropdown(null);
                        }}
                        className="w-full text-left px-4 py-1.5 hover:bg-slate-100 flex items-center gap-2"
                      >
                        <Table className="h-3.5 w-3.5 text-slate-400" /> Grade Simples (2 x 2)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          handleInsertTable(3, 3);
                          setActiveDropdown(null);
                        }}
                        className="w-full text-left px-4 py-1.5 hover:bg-slate-100 flex items-center gap-2"
                      >
                        <Table className="h-3.5 w-3.5 text-slate-400" /> Tabela Informativa (3 x 3)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowTableModal(true);
                          setActiveDropdown(null);
                        }}
                        className="w-full text-left px-4 py-1.5 hover:bg-slate-100 flex items-center gap-2 text-indigo-600 font-bold"
                      >
                        <Table className="h-3.5 w-3.5" /> Tabela Customizada...
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* FERRAMENTAS */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setActiveDropdown(activeDropdown === 'ferramentas' ? null : 'ferramentas')}
                  className="px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200/80 hover:text-slate-900 rounded-md transition flex items-center gap-1 cursor-pointer"
                >
                  Ferramentas <ChevronDown className="h-3 w-3 opacity-60" />
                </button>
                {activeDropdown === 'ferramentas' && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setActiveDropdown(null)} />
                    <div className="absolute left-0 mt-1 w-52 bg-white border border-slate-200 rounded-lg shadow-lg py-1.5 z-40 text-xs text-slate-700 font-medium">
                      <button
                        type="button"
                        onClick={() => {
                          setStatsModalOpen(true);
                          setActiveDropdown(null);
                        }}
                        className="w-full text-left px-4 py-1.5 hover:bg-slate-100 flex items-center gap-2"
                      >
                        <Sliders className="h-3.5 w-3.5 text-slate-400" /> Estatísticas & Palavras
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          // Quick syntax helper
                          const unclosedTags = (template.match(/<[^/][^>]*>/g) || []).length - (template.match(/<\/[^>]+>/g) || []).length;
                          window.alert(unclosedTags === 0 
                            ? "✅ Sintaxe HTML está perfeitamente equilibrada e limpa!" 
                            : `⚠️ Nota: Existem ${Math.abs(unclosedTags)} tags que podem estar desalinhadas. Recomenda-se validar antes de disparar.`
                          );
                          setActiveDropdown(null);
                        }}
                        className="w-full text-left px-4 py-1.5 hover:bg-slate-100 flex items-center gap-2"
                      >
                        <Check className="h-3.5 w-3.5 text-emerald-500" /> Validar Sintaxe HTML
                      </button>
                    </div>
                  </>
                )}
              </div>

            </div>

            {/* Quick stats indicator */}
            <div className="text-[10px] font-bold text-slate-400 font-mono hidden md:block">
              {editorSubMode === 'visual' ? 'MODO DESIGN VISUAL (WYSIWYG)' : 'MODO EDITOR CÓDIGO-FONTE'}
            </div>
          </div>

          {/* Toolbar (as shown in the reference image) */}
          <div className="bg-[#f8fafc] border-x border-b border-slate-200 px-3 py-2 flex flex-wrap gap-1.5 items-center justify-start select-none relative z-10 shrink-0 shadow-2xs rounded-b-2xl">
            
            {/* UNDO / REDO */}
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => executeEditorCommand('undo')}
                disabled={editorSubMode !== 'visual'}
                className="p-1.5 hover:bg-slate-200 text-slate-700 rounded-md transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                title="Desfazer (Undo)"
              >
                <Undo className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => executeEditorCommand('redo')}
                disabled={editorSubMode !== 'visual'}
                className="p-1.5 hover:bg-slate-200 text-slate-700 rounded-md transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                title="Refazer (Redo)"
              >
                <Redo className="h-3.5 w-3.5" />
              </button>
            </div>

            <span className="w-px h-5 bg-slate-300 mx-0.5 shrink-0" />

            {/* TOGGLE CODE / RAW MODE */}
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => setEditorSubMode(editorSubMode === 'visual' ? 'code' : 'visual')}
                className={`p-1.5 rounded-md transition cursor-pointer ${
                  editorSubMode === 'code' ? 'bg-indigo-100 text-indigo-700 font-bold' : 'hover:bg-slate-200 text-slate-700'
                }`}
                title="Alternar entre Visual (WYSIWYG) e Código HTML"
              >
                <Code className="h-3.5 w-3.5" />
              </button>

              <button
                type="button"
                onClick={() => executeEditorCommand('removeFormat')}
                className="p-1.5 hover:bg-slate-200 text-slate-700 rounded-md transition cursor-pointer"
                title="Limpar toda a formatação do texto selecionado"
              >
                <Eraser className="h-3.5 w-3.5 text-amber-600" />
              </button>
            </div>

            <span className="w-px h-5 bg-slate-300 mx-0.5 shrink-0" />

            {/* FORMATS DROPDOWN */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setActiveDropdown(activeDropdown === 'formats-toolbar' ? null : 'formats-toolbar')}
                className="px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-slate-200 rounded-md transition flex items-center gap-1 cursor-pointer border border-slate-200/60 bg-white shadow-2xs"
              >
                Formatos <ChevronDown className="h-3 w-3 opacity-60" />
              </button>
              {activeDropdown === 'formats-toolbar' && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setActiveDropdown(null)} />
                  <div className="absolute left-0 mt-1 w-48 bg-white border border-slate-200 rounded-lg shadow-lg py-1.5 z-40 text-xs text-slate-700 font-semibold">
                    <button
                      type="button"
                      onClick={() => {
                        executeEditorCommand('formatBlock', '<h1>');
                        setActiveDropdown(null);
                      }}
                      className="w-full text-left px-4 py-1.5 hover:bg-slate-100 text-lg font-bold"
                    >
                      Título 1 (H1)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        executeEditorCommand('formatBlock', '<h2>');
                        setActiveDropdown(null);
                      }}
                      className="w-full text-left px-4 py-1.5 hover:bg-slate-100 text-base font-bold text-slate-800"
                    >
                      Título 2 (H2)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        executeEditorCommand('formatBlock', '<h3>');
                        setActiveDropdown(null);
                      }}
                      className="w-full text-left px-4 py-1.5 hover:bg-slate-100 text-sm font-semibold text-slate-800"
                    >
                      Título 3 (H3)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        executeEditorCommand('formatBlock', '<p>');
                        setActiveDropdown(null);
                      }}
                      className="w-full text-left px-4 py-1.5 hover:bg-slate-100 text-xs text-slate-600 font-normal"
                    >
                      Parágrafo Normal
                    </button>
                  </div>
                </>
              )}
            </div>

            <span className="w-px h-5 bg-slate-300 mx-0.5 shrink-0" />

            {/* BOLD / ITALIC / UNDERLINE */}
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => executeEditorCommand('bold')}
                className="p-1.5 hover:bg-slate-200 text-slate-800 font-extrabold rounded-md transition cursor-pointer"
                title="Negrito"
              >
                <Bold className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => executeEditorCommand('italic')}
                className="p-1.5 hover:bg-slate-200 text-slate-800 italic rounded-md transition cursor-pointer"
                title="Itálico"
              >
                <Italic className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => executeEditorCommand('underline')}
                className="p-1.5 hover:bg-slate-200 text-slate-800 underline rounded-md transition cursor-pointer"
                title="Sublinhado"
              >
                <Underline className="h-3.5 w-3.5" />
              </button>
            </div>

            <span className="w-px h-5 bg-slate-300 mx-0.5 shrink-0" />

            {/* ALIGNMENTS */}
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => executeEditorCommand('justifyLeft')}
                className="p-1.5 hover:bg-slate-200 text-slate-700 rounded-md transition cursor-pointer"
                title="Alinhar à Esquerda"
              >
                <AlignLeft className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => executeEditorCommand('justifyCenter')}
                className="p-1.5 hover:bg-slate-200 text-slate-700 rounded-md transition cursor-pointer"
                title="Centralizar"
              >
                <AlignCenter className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => executeEditorCommand('justifyRight')}
                className="p-1.5 hover:bg-slate-200 text-slate-700 rounded-md transition cursor-pointer"
                title="Alinhar à Direita"
              >
                <AlignRight className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => executeEditorCommand('justifyFull')}
                className="p-1.5 hover:bg-slate-200 text-slate-700 rounded-md transition cursor-pointer"
                title="Justificado"
              >
                <AlignJustify className="h-3.5 w-3.5" />
              </button>
            </div>

            <span className="w-px h-5 bg-slate-300 mx-0.5 shrink-0" />

            {/* LISTS */}
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => executeEditorCommand('insertUnorderedList')}
                className="p-1.5 hover:bg-slate-200 text-slate-700 rounded-md transition cursor-pointer"
                title="Lista com Marcadores"
              >
                <List className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => executeEditorCommand('insertOrderedList')}
                className="p-1.5 hover:bg-slate-200 text-slate-700 rounded-md transition cursor-pointer"
                title="Lista Numerada"
              >
                <ListOrdered className="h-3.5 w-3.5" />
              </button>
            </div>

            <span className="w-px h-5 bg-slate-300 mx-0.5 shrink-0" />

            {/* INDENTS */}
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => executeEditorCommand('outdent')}
                className="p-1.5 hover:bg-slate-200 text-slate-700 rounded-md transition cursor-pointer"
                title="Diminuir Recuo"
              >
                <Outdent className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => executeEditorCommand('indent')}
                className="p-1.5 hover:bg-slate-200 text-slate-700 rounded-md transition cursor-pointer"
                title="Aumentar Recuo"
              >
                <Indent className="h-3.5 w-3.5" />
              </button>
            </div>

            <span className="w-px h-5 bg-slate-300 mx-0.5 shrink-0" />

            {/* QUICK UTILITIES */}
            <div className="flex items-center gap-1">
              
              {/* LINK */}
              <button
                type="button"
                onClick={() => setShowLinkModal(true)}
                className="p-1.5 hover:bg-slate-200 text-slate-700 rounded-md transition cursor-pointer"
                title="Criar Link de Redirecionamento"
              >
                <Link className="h-3.5 w-3.5 text-indigo-600" />
              </button>

              {/* IMAGE */}
              <button
                type="button"
                onClick={() => setShowImgModal(true)}
                className="p-1.5 hover:bg-slate-200 text-slate-700 rounded-md transition cursor-pointer"
                title="Inserir Foto/Banner"
              >
                <Paintbrush className="h-3.5 w-3.5 text-indigo-600" />
              </button>

              {/* PRINT */}
              <button
                type="button"
                onClick={() => window.print()}
                className="p-1.5 hover:bg-slate-200 text-slate-700 rounded-md transition cursor-pointer"
                title="Imprimir"
              >
                <Printer className="h-3.5 w-3.5" />
              </button>

              {/* PREVIEW TABS */}
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className="p-1.5 hover:bg-slate-200 text-slate-700 rounded-md transition cursor-pointer"
                title="Visualizar E-mail Realista"
              >
                <Eye className="h-3.5 w-3.5 text-emerald-600" />
              </button>

              {/* VIDEO EMBED */}
              <button
                type="button"
                onClick={() => setShowVideoModal(true)}
                className="p-1.5 hover:bg-slate-200 text-slate-700 rounded-md transition cursor-pointer"
                title="Inserir Reprodutor de Vídeo"
              >
                <Film className="h-3.5 w-3.5 text-indigo-600" />
              </button>

              {/* TEXT COLOR PICKER */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setActiveDropdown(activeDropdown === 'text-color' ? null : 'text-color')}
                  className="p-1.5 hover:bg-slate-200 rounded-md transition flex items-center cursor-pointer font-bold text-slate-700 text-xs gap-0.5"
                  title="Cor da Fonte"
                >
                  <Type className="h-3.5 w-3.5" />
                  <span className="h-1 w-2.5 bg-indigo-600 rounded-xs mt-2.5" />
                </button>
                {activeDropdown === 'text-color' && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setActiveDropdown(null)} />
                    <div className="absolute left-0 mt-1 p-2 bg-white border border-slate-200 rounded-lg shadow-lg z-40 w-36">
                      <div className="text-[10px] font-bold text-slate-400 mb-1">Cores do Texto</div>
                      <div className="grid grid-cols-4 gap-1">
                        {['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#7c3aed', '#ec4899', '#0f172a', '#475569', '#cbd5e1', '#ffffff'].map((color) => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => {
                              executeEditorCommand('foreColor', color);
                              setActiveDropdown(null);
                            }}
                            className="h-5 w-5 rounded-xs border border-slate-200 cursor-pointer shadow-2xs hover:scale-110 transition shrink-0"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* BG COLOR PICKER */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setActiveDropdown(activeDropdown === 'bg-color' ? null : 'bg-color')}
                  className="p-1.5 hover:bg-slate-200 rounded-md transition flex items-center cursor-pointer font-bold text-slate-700 text-xs gap-0.5"
                  title="Cor de Fundo / Destaque"
                >
                  <Type className="h-3.5 w-3.5 text-slate-400 bg-amber-200 rounded-xs px-0.5" />
                  <span className="h-1 w-2.5 bg-amber-400 rounded-xs mt-2.5" />
                </button>
                {activeDropdown === 'bg-color' && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setActiveDropdown(null)} />
                    <div className="absolute left-0 mt-1 p-2 bg-white border border-slate-200 rounded-lg shadow-lg z-40 w-36">
                      <div className="text-[10px] font-bold text-slate-400 mb-1">Destaque de Fundo</div>
                      <div className="grid grid-cols-4 gap-1">
                        {['#fee2e2', '#ffedd5', '#fef9c3', '#dcfce7', '#ccfbf1', '#dbeafe', '#e0e7ff', '#f3e8ff', '#fce7f3', '#f1f5f9', '#f8fafc', '#ffffff'].map((color) => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => {
                              executeEditorCommand('hiliteColor', color);
                              setActiveDropdown(null);
                            }}
                            className="h-5 w-5 rounded-xs border border-slate-200 cursor-pointer shadow-2xs hover:scale-110 transition shrink-0"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* EMOJI PICKER */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setActiveDropdown(activeDropdown === 'emoji' ? null : 'emoji')}
                  className="p-1.5 hover:bg-slate-200 text-slate-700 rounded-md transition cursor-pointer"
                  title="Inserir Emoji"
                >
                  <Smile className="h-3.5 w-3.5 text-amber-500" />
                </button>
                {activeDropdown === 'emoji' && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setActiveDropdown(null)} />
                    <div className="absolute left-0 mt-1 p-2 bg-white border border-slate-200 rounded-lg shadow-lg z-40 w-40">
                      <div className="text-[10px] font-bold text-slate-400 mb-1">Emojis Rápidos</div>
                      <div className="grid grid-cols-4 gap-1.5">
                        {['😊', '😍', '😂', '👍', '👏', '🎉', '🔥', '🚀', '💡', '📧', '💻', '🌟', '❤️', '📅', '💼', '📈'].map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => {
                              insertHtmlAtCursor(emoji);
                              setActiveDropdown(null);
                            }}
                            className="text-base p-1 hover:bg-slate-100 rounded-md transition cursor-pointer text-center"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* TABLE QUICK GENERATOR */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setActiveDropdown(activeDropdown === 'table-grid' ? null : 'table-grid')}
                  className="p-1.5 hover:bg-slate-200 text-slate-700 rounded-md transition cursor-pointer"
                  title="Grade ou Tabela Responsiva"
                >
                  <Table className="h-3.5 w-3.5 text-indigo-500" />
                </button>
                {activeDropdown === 'table-grid' && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setActiveDropdown(null)} />
                    <div className="absolute left-0 mt-1 p-2 bg-white border border-slate-200 rounded-lg shadow-lg z-40 w-44 text-slate-700 text-xs font-semibold">
                      <div className="text-[10px] font-bold text-slate-400 mb-1.5">Estruturas Rápidas</div>
                      <button
                        type="button"
                        onClick={() => {
                          handleInsertTable(2, 2);
                          setActiveDropdown(null);
                        }}
                        className="w-full text-left px-2 py-1 hover:bg-slate-100 rounded-md mb-0.5 flex items-center gap-1.5"
                      >
                        <Table className="h-3.5 w-3.5 text-slate-400" /> Tabela Simples 2x2
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          handleInsertTable(3, 3);
                          setActiveDropdown(null);
                        }}
                        className="w-full text-left px-2 py-1 hover:bg-slate-100 rounded-md mb-0.5 flex items-center gap-1.5"
                      >
                        <Table className="h-3.5 w-3.5 text-slate-400" /> Grade Informativa 3x3
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowTableModal(true);
                          setActiveDropdown(null);
                        }}
                        className="w-full text-left px-2 py-1 hover:bg-indigo-50 hover:text-indigo-700 text-indigo-600 rounded-md font-bold mt-1 flex items-center gap-1.5"
                      >
                        <PlusCircle className="h-3.5 w-3.5" /> Outro tamanho...
                      </button>
                    </div>
                  </>
                )}
              </div>

            </div>

          </div>

          {/* DUAL WORKSPACE PANEL */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs bg-slate-50 relative min-h-[420px] flex flex-col">
            
            {/* 1. VISUAL MODE (WYSIWYG Iframe) */}
            <div className={`flex-1 flex flex-col ${editorSubMode === 'visual' ? 'block' : 'hidden'}`}>
              <div className="bg-white px-4 py-2 border-b border-slate-200 text-[10px] text-slate-400 flex items-center justify-between shrink-0">
                <span className="flex items-center gap-1 font-bold text-indigo-600">
                  <span className="h-1.5 w-1.5 bg-indigo-500 rounded-full animate-ping" />
                  AMBIENTE DE DESIGN INTERATIVO (Clique em qualquer parte do e-mail para digitar)
                </span>
                <span className="bg-slate-100 px-2 py-0.5 rounded-full text-slate-500">WYSIWYG Ativo</span>
              </div>
              <div className="flex-1 min-h-[400px] bg-slate-200/50 p-2 relative">
                <iframe
                  ref={iframeRef}
                  id="wysiwyg-editor-iframe"
                  title="WYSIWYG Editor"
                  className="w-full h-[410px] bg-white border border-slate-200/40 rounded-xl shadow-xs"
                  sandbox="allow-same-origin allow-scripts"
                />
              </div>
            </div>

            {/* 2. CODE MODE (HTML Source Textarea) */}
            <div className={`flex-1 flex flex-col ${editorSubMode === 'code' ? 'block' : 'hidden'}`}>
              <div className="bg-slate-900 px-4 py-2 text-[10px] text-slate-400 flex items-center justify-between shrink-0">
                <span className="font-bold text-amber-400">EDIÇÃO DIRETA DO CÓDIGO-FONTE HTML</span>
                <span className="bg-slate-800 px-2 py-0.5 rounded-full text-slate-300">HTML5</span>
              </div>
              <textarea
                ref={textareaRef}
                id="html-template-textarea"
                value={template}
                onChange={(e) => onTemplateChanged(e.target.value)}
                className="w-full h-100 px-4 py-3.5 font-mono text-xs bg-slate-950 text-slate-200 border-none outline-none resize-y leading-relaxed"
                placeholder={`Exemplo de conteúdo básico:\n\n<h2>Olá {{nome}},</h2>\n<p>Queremos convidá-lo para conhecer nossa nova plataforma.</p>\n<p>Atenciosamente,<br>Equipe da {{empresa}}</p>`}
              />
            </div>

          </div>

          {/* Info banner */}
          <div className="p-4 bg-indigo-50/40 border border-indigo-100/60 rounded-2xl flex gap-3 text-xs text-slate-600 leading-relaxed shadow-3xs">
            <Info className="h-4.5 w-4.5 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-indigo-950 mb-0.5">Suporte a Variáveis Dinâmicas Ativado</p>
              <p>
                O Prof. Antônio Cândido integrará automaticamente o Nome, Empresa e E-mail de seus destinatários quando você usar as pílulas acima no cursor do texto. Alterne entre o <strong>Modo Visual</strong> e o <strong>Modo Código</strong> quando quiser!
              </p>
            </div>
          </div>

          {/* Template Presets Section */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Paintbrush className="h-4 w-4 text-indigo-600" />
                <h4 className="text-xs font-black uppercase text-slate-900 tracking-wider">Modelos Profissionais de Alta Entregabilidade</h4>
              </div>
              <button
                onClick={() => {
                  const newPreset = {
                    name: 'Novo Modelo',
                    description: 'Nova descrição',
                    html: '<html><body>Novo Modelo</body></html>',
                    color: '#6366f1'
                  };
                  const newPresets = [...editablePresets, newPreset];
                  setEditablePresets(newPresets);
                  localStorage.setItem('professional_templates_custom', JSON.stringify(newPresets));
                }}
                className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-1 px-3 rounded-lg transition"
              >
                + Adicionar Modelo
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {editablePresets.map((preset, idx) => (
                <div 
                  key={idx}
                  className="border border-slate-200 hover:border-indigo-200 rounded-xl p-4 flex flex-col justify-between gap-3 bg-white hover:bg-slate-50/20 transition group"
                >
                  <div className="space-y-1">
                    {editingPresetIndex === idx ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={editingPresetData.name}
                          onChange={(e) => setEditingPresetData({ ...editingPresetData, name: e.target.value })}
                          className="w-full text-xs font-bold text-slate-800 border-indigo-200 rounded p-1"
                        />
                        <textarea
                          value={editingPresetData.description}
                          onChange={(e) => setEditingPresetData({ ...editingPresetData, description: e.target.value })}
                          className="w-full text-[11px] text-slate-500 leading-normal border-indigo-200 rounded p-1"
                        />
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: preset.color }} />
                          <span className="text-xs font-bold text-slate-800 group-hover:text-indigo-950 transition">{preset.name}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-normal">{preset.description}</p>
                      </>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {editingPresetIndex === idx ? (
                      <button
                        type="button"
                        onClick={() => {
                          updatePreset(idx, editingPresetData);
                          setEditingPresetIndex(null);
                        }}
                        className="py-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition"
                      >
                        <Save className="h-3 w-3" />
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingPresetIndex(idx);
                            setEditingPresetData(preset);
                          }}
                          className="py-1.5 px-3 bg-slate-100 hover:bg-indigo-600 hover:text-white border border-slate-200 rounded-lg transition"
                          title="Editar Metadados"
                        >
                          <Edit2 className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setActivePresetForModal(preset);
                            setShowPresetPreviewModal(true);
                          }}
                          className="py-1.5 px-3 bg-slate-100 hover:bg-sky-600 hover:text-white border border-slate-200 rounded-lg transition"
                          title="Visualizar"
                        >
                          <Eye className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setActivePresetForModal(preset);
                            setEditingPresetData(preset);
                            setEditingPresetIndex(idx);
                            setShowPresetHtmlModal(true);
                          }}
                          className="py-1.5 px-3 bg-slate-100 hover:bg-emerald-600 hover:text-white border border-slate-200 rounded-lg transition"
                          title="Editar HTML"
                        >
                          <Code className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Tem certeza que deseja excluir o modelo "${preset.name}"?`)) {
                              setEditablePresets((prev) => {
                                const newPresets = prev.filter((_, i) => i !== idx);
                                localStorage.setItem('professional_templates_custom', JSON.stringify(newPresets));
                                return newPresets;
                              });
                            }
                          }}
                          className="py-1.5 px-3 bg-slate-100 hover:bg-red-600 hover:text-white border border-slate-200 rounded-lg transition"
                          title="Excluir Modelo"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </>
                    )}
                    <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Deseja substituir o modelo atual pelo modelo "${preset.name}"? Atenção: Alterações não salvas serão substituídas.`)) {
                            loadPreset(preset.html);
                          }
                        }}
                        className="py-1.5 px-3 bg-slate-100 hover:bg-indigo-600 hover:text-white border border-slate-200 hover:border-indigo-600 text-slate-600 text-[10px] font-black uppercase tracking-wider rounded-lg transition text-center cursor-pointer active:scale-95"
                    >
                      Carregar Modelo
                    </button>
                  </div>
                </div>
              ))}
              
              {localTemplates.map((template, idx) => (
                <div 
                  key={`local-${idx}`}
                  className="border border-slate-200 hover:border-indigo-200 rounded-xl p-4 flex flex-col justify-between gap-3 bg-indigo-50/20 hover:bg-indigo-50/50 transition group"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-indigo-500" />
                        <span className="text-xs font-bold text-slate-800">{template.name}</span>
                      </div>
                      <button onClick={() => deleteLocalTemplate(idx)} className="text-rose-400 hover:text-rose-600"><Trash2 className="h-3 w-3" /></button>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-normal">Modelo salvo localmente.</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`Deseja substituir o modelo atual pelo modelo "${template.name}"?`)) {
                        onTemplateChanged(template.html);
                      }
                    }}
                    className="py-1.5 px-3 bg-indigo-100 hover:bg-indigo-600 hover:text-white border border-indigo-200 hover:border-indigo-600 text-indigo-700 text-[10px] font-black uppercase tracking-wider rounded-lg transition text-center cursor-pointer active:scale-95"
                  >
                    Carregar Modelo Local
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'generator' && (
        <div className="space-y-5 animate-fade-in bg-slate-50/50 border border-slate-200/60 p-5 md:p-6 rounded-2xl">
          <div className="space-y-1.5">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-indigo-600" />
              Construtor Assistido de Layouts Responsivos
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Preencha os campos abaixo de maneira visual. O Prof. Antônio Cândido irá compilar o código HTML, cabeçalhos estruturados e folhas de estilo CSS inline perfeitas para os principais provedores (Gmail, Outlook).
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Color Accent */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Cor de Destaque / Identidade</label>
              <div className="flex flex-wrap gap-1.5">
                {themeColors.map((color, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setGenColor(color.hex)}
                    className={`h-7 px-2 text-[10px] font-bold rounded-lg transition border flex items-center gap-1 cursor-pointer ${
                      genColor === color.hex 
                        ? 'border-indigo-600 ring-2 ring-indigo-500/15' 
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: color.hex }} />
                    {color.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Header Title */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Título do Cabeçalho</label>
              <input
                id="gen-header-title-input"
                type="text"
                placeholder="Ex: Parceria Comercial"
                value={genHeader}
                onChange={(e) => setGenHeader(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-1 focus:ring-indigo-500 outline-none bg-white font-medium"
              />
            </div>

            {/* Greeting */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Saudação Inicial</label>
              <input
                id="gen-greeting-input"
                type="text"
                placeholder="Ex: Olá, {{nome}}!"
                value={genGreeting}
                onChange={(e) => setGenGreeting(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-1 focus:ring-indigo-500 outline-none bg-white font-medium"
              />
            </div>

            {/* Button text and link */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Texto do Botão de Ação</label>
              <input
                id="gen-btn-text-input"
                type="text"
                placeholder="Ex: Agendar Demonstração (Deixe vazio para ocultar)"
                value={genBtnText}
                onChange={(e) => setGenBtnText(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-1 focus:ring-indigo-500 outline-none bg-white font-medium"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Link de Destino do Botão (URL)</label>
              <input
                id="gen-btn-url-input"
                type="text"
                placeholder="Ex: https://exemplo.com/demonstracao"
                value={genBtnUrl}
                onChange={(e) => setGenBtnUrl(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-1 focus:ring-indigo-500 outline-none bg-white font-medium font-mono"
              />
            </div>

            {/* Body Text */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Mensagem / Corpo do E-mail</label>
              <textarea
                id="gen-body-textarea"
                rows={4}
                placeholder="Escreva sua mensagem. Pressione Enter para começar novos parágrafos."
                value={genBody}
                onChange={(e) => setGenBody(e.target.value)}
                className="w-full px-3 py-2.5 text-xs border border-slate-200 rounded-xl focus:ring-1 focus:ring-indigo-500 outline-none bg-white resize-y font-medium"
              />
            </div>

            {/* Footer Text */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Texto do Rodapé (Termos, Redes Sociais ou Unsubscribe)</label>
              <textarea
                id="gen-footer-textarea"
                rows={2}
                placeholder="Ex: E-mail enviado profissionalmente..."
                value={genFooter}
                onChange={(e) => setGenFooter(e.target.value)}
                className="w-full px-3 py-2.5 text-xs border border-slate-200 rounded-xl focus:ring-1 focus:ring-indigo-500 outline-none bg-white resize-y font-medium"
              />
            </div>

            {/* Opções de Design Responsivo Avançadas */}
            <div className="md:col-span-2 border-t border-slate-200/60 pt-4 mt-2 space-y-4">
              <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                <Sliders className="h-3.5 w-3.5 text-indigo-500" />
                Opções Avançadas de Layout & Design Responsivo
              </span>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Alignment */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Alinhamento Geral</label>
                  <div className="grid grid-cols-2 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setGenAlignment('center')}
                      className={`py-1 px-2 text-[10px] font-bold rounded-md transition cursor-pointer ${genAlignment === 'center' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600'}`}
                    >
                      Centralizado
                    </button>
                    <button
                      type="button"
                      onClick={() => setGenAlignment('left')}
                      className={`py-1 px-2 text-[10px] font-bold rounded-md transition cursor-pointer ${genAlignment === 'left' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600'}`}
                    >
                      À Esquerda
                    </button>
                  </div>
                </div>

                {/* Button Behavior */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Botão no Mobile</label>
                  <div className="grid grid-cols-2 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setGenButtonBehavior('full')}
                      className={`py-1 px-2 text-[10px] font-bold rounded-md transition cursor-pointer ${genButtonBehavior === 'full' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600'}`}
                    >
                      Largura Cheia
                    </button>
                    <button
                      type="button"
                      onClick={() => setGenButtonBehavior('auto')}
                      className={`py-1 px-2 text-[10px] font-bold rounded-md transition cursor-pointer ${genButtonBehavior === 'auto' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600'}`}
                    >
                      Adaptável
                    </button>
                  </div>
                </div>

                {/* Border Radius */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Cantos do Cartão</label>
                  <div className="grid grid-cols-3 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setGenBorderRadius('none')}
                      className={`py-1 px-1.5 text-[10px] font-bold rounded-md transition cursor-pointer ${genBorderRadius === 'none' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600'}`}
                    >
                      Reto
                    </button>
                    <button
                      type="button"
                      onClick={() => setGenBorderRadius('sm')}
                      className={`py-1 px-1.5 text-[10px] font-bold rounded-md transition cursor-pointer ${genBorderRadius === 'sm' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600'}`}
                    >
                      Suave
                    </button>
                    <button
                      type="button"
                      onClick={() => setGenBorderRadius('lg')}
                      className={`py-1 px-1.5 text-[10px] font-bold rounded-md transition cursor-pointer ${genBorderRadius === 'lg' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600'}`}
                    >
                      Moderno
                    </button>
                  </div>
                </div>

                {/* Font Size Mobile readability */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tamanho da Fonte (Leitura)</label>
                  <div className="grid grid-cols-2 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setGenFontSize('normal')}
                      className={`py-1 px-2 text-[10px] font-bold rounded-md transition cursor-pointer ${genFontSize === 'normal' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600'}`}
                    >
                      Normal
                    </button>
                    <button
                      type="button"
                      onClick={() => setGenFontSize('large')}
                      className={`py-1 px-2 text-[10px] font-bold rounded-md transition cursor-pointer ${genFontSize === 'large' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600'}`}
                    >
                      Amplo Mobile
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2 border-t border-slate-200">
            <button
              id="gen-apply-and-render-btn"
              type="button"
              onClick={handleGenerateFromVisual}
              className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center gap-2 shadow-md shadow-indigo-600/10 active:scale-95"
            >
              <Check className="h-4 w-4" />
              Compilar e Aplicar no Editor
            </button>
          </div>
        </div>
      )}

      {activeTab === 'preview' && (
        /* Preview Render Mode */
        <div className="space-y-4 animate-fade-in">
          {/* Preview Selector if multiple recipients exist */}
          {recipients.length > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-slate-50 border border-slate-200/60 p-3.5 rounded-xl text-xs justify-between">
              <span className="font-bold text-slate-700 flex items-center gap-1.5">
                <LayoutGrid className="h-4 w-4 text-indigo-500" />
                Selecione o destinatário para simular variáveis:
              </span>
              <div className="flex items-center gap-2">
                <select
                  id="preview-recipient-selector"
                  value={previewRecipientIdx}
                  onChange={(e) => setPreviewRecipientIdx(parseInt(e.target.value) || 0)}
                  className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 cursor-pointer font-bold text-slate-800"
                >
                  {recipients.slice(0, 15).map((rec, idx) => (
                    <option key={idx} value={idx}>
                      Linha {idx + 1}: {rec.email || 'Sem e-mail'}
                    </option>
                  ))}
                </select>
                {recipients.length > 15 && <span className="text-[10px] text-slate-400 font-semibold">(Apenas os primeiros 15 exibidos)</span>}
              </div>
            </div>
          )}

          {/* Render Device Selector & Simulation */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-100 p-2 border border-slate-200 rounded-xl">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5 px-2">
              <Smartphone className="h-4 w-4 text-indigo-600 animate-pulse" />
              Opções Responsivas de Uso Mobile:
            </span>
            <div className="flex items-center gap-1.5 p-0.5 bg-slate-200/60 rounded-lg">
              <button
                type="button"
                onClick={() => setPreviewDevice('desktop')}
                className={`px-3 py-1.5 text-xs font-bold rounded-md flex items-center gap-1.5 transition cursor-pointer ${
                  previewDevice === 'desktop'
                    ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/30'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Monitor className="h-3.5 w-3.5" />
                Computador (Desktop)
              </button>
              <button
                type="button"
                onClick={() => setPreviewDevice('mobile')}
                className={`px-3 py-1.5 text-xs font-bold rounded-md flex items-center gap-1.5 transition cursor-pointer ${
                  previewDevice === 'mobile'
                    ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/30'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Smartphone className="h-3.5 w-3.5" />
                Celular (Responsivo)
              </button>
            </div>
          </div>

          {/* Render Iframe sandbox / Device Frame simulator */}
          <div className="flex justify-center transition-all duration-300 py-2">
            <div className={`border border-slate-200 overflow-hidden bg-white shadow-xs flex flex-col transition-all duration-300 ${
              previewDevice === 'mobile' 
                ? 'w-[375px] h-[640px] border-[12px] border-slate-800 rounded-[36px] my-2 shadow-2xl relative' 
                : 'w-full h-[450px] rounded-2xl'
            }`}>
              {previewDevice === 'mobile' && (
                <div className="absolute top-0 inset-x-0 h-4 bg-slate-800 flex justify-center items-center z-10 shrink-0">
                  <div className="w-16 h-3 bg-slate-900 rounded-full" />
                </div>
              )}
              
              <div className={`bg-slate-50 px-4 py-3 border-b border-slate-200 text-xs text-slate-500 flex items-center justify-between shrink-0 ${
                previewDevice === 'mobile' ? 'mt-4' : ''
              }`}>
                <span className="font-bold text-slate-700 flex items-center gap-1.5">
                  <Eye className="h-3.5 w-3.5 text-indigo-500" /> 
                  {previewDevice === 'mobile' ? 'Visualização Mobile (375px)' : 'Visualização Desktop'}
                </span>
                <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full font-bold">Modo de Leitura</span>
              </div>
              
              <iframe
                id="live-html-preview-iframe"
                srcDoc={getRenderedPreview()}
                title="Mail Preview"
                className="w-full flex-1 border-none bg-white p-1"
                sandbox="allow-same-origin"
              />
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* WYSIWYG INTERACTIVE MODALS (Prof. Antônio Cândido Premium Suite) */}
      {/* ============================================================== */}

      {/* 1. LINK MODAL */}
      {showLinkModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Link className="h-4 w-4 text-indigo-600" /> Inserir Hyperlink de Redirecionamento
              </span>
              <button 
                type="button" 
                onClick={() => setShowLinkModal(false)}
                className="text-slate-400 hover:text-slate-600 transition"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider mb-1">Endereço de Destino (URL)</label>
                <input
                  type="text"
                  placeholder="https://exemplo.com/pagina"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider mb-1">Texto de Exibição</label>
                <input
                  type="text"
                  placeholder="Clique Aqui para Acessar"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowLinkModal(false)}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  const finalUrl = linkUrl.trim();
                  const finalTxt = linkText.trim() || 'Acesse Aqui';
                  if (finalUrl) {
                    const linkHtml = `<a href="${finalUrl}" style="color: #4f46e5; text-decoration: underline; font-weight: bold;">${finalTxt}</a>`;
                    insertHtmlAtCursor(linkHtml);
                    setLinkUrl('');
                    setLinkText('');
                    setShowLinkModal(false);
                  } else {
                    window.alert('Por favor, informe a URL de destino.');
                  }
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition"
              >
                Inserir Link
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. IMAGE MODAL */}
      {showImgModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Paintbrush className="h-4 w-4 text-indigo-600" /> Inserir Foto / Banner de Campanha
              </span>
              <button 
                type="button" 
                onClick={() => setShowImgModal(false)}
                className="text-slate-400 hover:text-slate-600 transition"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider mb-1">Caminho / URL da Imagem</label>
                <input
                  type="text"
                  placeholder="https://exemplo.com/foto.jpg"
                  value={imgUrl}
                  onChange={(e) => setImgUrl(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-500 font-mono"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider mb-1">Largura (Opcional)</label>
                  <input
                    type="text"
                    placeholder="Ex: 100% ou 600"
                    value={imgWidth}
                    onChange={(e) => setImgWidth(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider mb-1">Altura (Opcional)</label>
                  <input
                    type="text"
                    placeholder="Ex: auto ou 300"
                    value={imgHeight}
                    onChange={(e) => setImgHeight(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowImgModal(false)}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  const finalUrl = imgUrl.trim();
                  if (finalUrl) {
                    const widthAttr = imgWidth ? ` width="${imgWidth}"` : ' width="100%"';
                    const heightAttr = imgHeight ? ` height="${imgHeight}"` : '';
                    const styleAttr = ` style="max-width:100%; border-radius:8px; display:inline-block; margin: 12px 0;"`;
                    const imgHtml = `<div style="text-align: center;"><img src="${finalUrl}" alt="Banner Campanha"${widthAttr}${heightAttr}${styleAttr} /></div>`;
                    insertHtmlAtCursor(imgHtml);
                    setImgUrl('');
                    setImgWidth('');
                    setImgHeight('');
                    setShowImgModal(false);
                  } else {
                    window.alert('Por favor, insira o link da imagem.');
                  }
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition"
              >
                Inserir Imagem
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. VIDEO MODAL */}
      {showVideoModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Film className="h-4 w-4 text-indigo-600" /> Inserir Vídeo Embed Responsivo
              </span>
              <button 
                type="button" 
                onClick={() => setShowVideoModal(false)}
                className="text-slate-400 hover:text-slate-600 transition"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider mb-1">Caminho do Embed (Ex: YouTube/Vimeo)</label>
                <input
                  type="text"
                  placeholder="https://www.youtube.com/embed/dQw4w9WgXcQ"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-500 font-mono"
                />
                <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                  Dica: Use a URL com "/embed/" para garantir que funcione perfeitamente no ambiente sandbox do e-mail.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowVideoModal(false)}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  const finalUrl = videoUrl.trim();
                  if (finalUrl) {
                    const embedHtml = `<div style="text-align: center; margin: 20px 0;">\n  <iframe width="100%" height="315" src="${finalUrl}" style="max-width:560px; border-radius:12px; border:1px solid #e2e8f0;" allowfullscreen></iframe>\n</div>`;
                    insertHtmlAtCursor(embedHtml);
                    setVideoUrl('');
                    setShowVideoModal(false);
                  } else {
                    window.alert('Por favor, informe a URL do vídeo.');
                  }
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition"
              >
                Inserir Vídeo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. TABLE MODAL */}
      {showTableModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Table className="h-4 w-4 text-indigo-600" /> Criar Tabela Estruturada Customizada
              </span>
              <button 
                type="button" 
                onClick={() => setShowTableModal(false)}
                className="text-slate-400 hover:text-slate-600 transition"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider mb-1">Linhas (Rows)</label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={tableRows}
                  onChange={(e) => setTableRows(parseInt(e.target.value) || 2)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider mb-1">Colunas (Cols)</label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={tableCols}
                  onChange={(e) => setTableCols(parseInt(e.target.value) || 2)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowTableModal(false)}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  const rows = Math.min(20, Math.max(1, tableRows));
                  const cols = Math.min(10, Math.max(1, tableCols));
                  
                  let tableHtml = `<table style="width:100%; border-collapse:collapse; margin:20px 0; font-family:sans-serif; font-size:13px; color:#475569;">\n`;
                  for (let i = 0; i < rows; i++) {
                    tableHtml += `  <tr>\n`;
                    for (let j = 0; j < cols; j++) {
                      if (i === 0) {
                        tableHtml += `    <th style="border:1px solid #cbd5e1; background-color:#f1f5f9; padding:10px; font-weight:bold; text-align:left;">Cabeçalho</th>\n`;
                      } else {
                        tableHtml += `    <td style="border:1px solid #cbd5e1; padding:10px;">Item</td>\n`;
                      }
                    }
                    tableHtml += `  </tr>\n`;
                  }
                  tableHtml += `</table>`;
                  insertHtmlAtCursor(tableHtml);
                  setShowTableModal(false);
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition"
              >
                Criar Tabela
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. STATS MODAL */}
      {statsModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Sliders className="h-4 w-4 text-indigo-600" /> Métricas & Estatísticas de Leitura
              </span>
              <button 
                type="button" 
                onClick={() => setStatsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-3.5 text-xs text-slate-700">
              <div className="grid grid-cols-2 gap-3.5">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/50">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Caracteres Totais</div>
                  <div className="text-lg font-black text-slate-900">{template.length}</div>
                  <div className="text-[9px] text-slate-400 mt-0.5">Incluindo código HTML</div>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/50">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Tempo de Leitura</div>
                  <div className="text-lg font-black text-slate-900">
                    {Math.max(1, Math.ceil(template.replace(/<\/?[^>]+(>|$)/g, "").trim().split(/\s+/).filter(Boolean).length / 200))} min
                  </div>
                  <div className="text-[9px] text-slate-400 mt-0.5">Média de 200 palavras/min</div>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/50">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Palavras Reais</div>
                  <div className="text-lg font-black text-slate-900">
                    {template.replace(/<\/?[^>]+(>|$)/g, "").trim().split(/\s+/).filter(Boolean).length}
                  </div>
                  <div className="text-[9px] text-slate-400 mt-0.5">Apenas texto legível</div>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/50">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Caracteres de Texto</div>
                  <div className="text-lg font-black text-slate-900">
                    {template.replace(/<\/?[^>]+(>|$)/g, "").length}
                  </div>
                  <div className="text-[9px] text-slate-400 mt-0.5">Exclui tags de formatação</div>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200/60 p-3.5 rounded-xl text-[11px] text-amber-800 leading-relaxed">
                <strong>Análise de Entregabilidade:</strong> Este modelo possui excelente equilíbrio entre código HTML e texto plano. Para evitar filtros de Spam, certifique-se de manter o conteúdo textual relevante e configure corretamente as chaves SPF e DKIM na aba de SMTP.
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setStatsModalOpen(false)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition"
              >
                Concluído
              </button>
            </div>
          </div>
        </div>
      )}
      {/* HTML EDITOR MODAL */}
      {showPresetHtmlModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Code className="h-4 w-4 text-emerald-600" /> Editar HTML: {activePresetForModal?.name}
              </span>
              <button 
                type="button" 
                onClick={() => setShowPresetHtmlModal(false)}
                className="text-slate-400 hover:text-slate-600 transition"
              >
                ✕
              </button>
            </div>
            <textarea
              value={editingPresetData?.html || ''}
              onChange={(e) => setEditingPresetData({ ...editingPresetData, html: e.target.value })}
              className="w-full h-96 font-mono text-xs border border-slate-200 rounded-lg p-3"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowPresetHtmlModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  updatePreset(editingPresetIndex!, editingPresetData);
                  setShowPresetHtmlModal(false);
                  setEditingPresetIndex(null);
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition"
              >
                Salvar HTML
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PREVIEW MODAL */}
      {showPresetPreviewModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-4xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Eye className="h-4 w-4 text-sky-600" /> Visualização: {activePresetForModal?.name}
              </span>
              <button 
                type="button" 
                onClick={() => setShowPresetPreviewModal(false)}
                className="text-slate-400 hover:text-slate-600 transition"
              >
                ✕
              </button>
            </div>
            <div className="bg-slate-100 rounded-lg p-4 h-96 overflow-auto">
              <iframe 
                srcDoc={activePresetForModal?.html}
                className="w-full h-full border-none bg-white"
                title="Preview"
              />
            </div>
          </div>
        </div>
      )}

      {/* REAL PREVIEW MODAL WITH FIRST RECIPIENT VARIABLES */}
      {showRealPreviewModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="real-preview-modal-backdrop">
          <div className="bg-white rounded-3xl max-w-5xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scale-up" id="real-preview-modal-container">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600 border border-indigo-100/30">
                  <Eye className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 tracking-tight">Visualização Real do E-mail</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {recipients.length > 0 ? (
                      <span>Simulando com dados de <strong>{recipients[0].nome || recipients[0].Nome || 'Sem Nome'}</strong> (&lt;{recipients[0].email || recipients[0].Email || 'Sem E-mail'}&gt;)</span>
                    ) : (
                      <span className="text-rose-600 font-semibold">Nenhuma planilha de destinatários carregada para simular variáveis</span>
                    )}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowRealPreviewModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                title="Fechar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Device Selector Toolbar */}
            <div className="p-4 border-b border-slate-100 bg-white flex items-center justify-between gap-3 flex-wrap">
              <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5 px-1">
                <Monitor className="h-4 w-4 text-indigo-500" />
                Modo de Simulação de Tela:
              </span>
              <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setRealPreviewDevice('desktop')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 transition cursor-pointer ${
                    realPreviewDevice === 'desktop'
                      ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/30'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Monitor className="h-3.5 w-3.5" />
                  Computador (Desktop)
                </button>
                <button
                  type="button"
                  onClick={() => setRealPreviewDevice('mobile')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 transition cursor-pointer ${
                    realPreviewDevice === 'mobile'
                      ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/30'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Smartphone className="h-3.5 w-3.5" />
                  Celular (Mobile)
                </button>
              </div>
            </div>

            {/* Preview Frame Area */}
            <div className="flex-1 bg-slate-50/50 p-6 overflow-auto flex justify-center items-center">
              <div className={`bg-white border border-slate-200 overflow-hidden shadow-md flex flex-col transition-all duration-300 ${
                realPreviewDevice === 'mobile'
                  ? 'w-[375px] h-[520px] border-[12px] border-slate-800 rounded-[36px] relative shadow-xl'
                  : 'w-full h-[450px] rounded-2xl'
              }`}>
                {realPreviewDevice === 'mobile' && (
                  <div className="absolute top-0 inset-x-0 h-4 bg-slate-800 flex justify-center items-center z-10 shrink-0">
                    <div className="w-16 h-2 bg-slate-900 rounded-full" />
                  </div>
                )}
                <iframe
                  id="real-email-preview-iframe"
                  srcDoc={getRealPreviewForFirstRecipient()}
                  title="Real Mail Preview"
                  className={`w-full flex-1 border-none bg-white p-1 ${
                    realPreviewDevice === 'mobile' ? 'mt-4' : ''
                  }`}
                  sandbox="allow-same-origin"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="bg-slate-50 p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span className="font-semibold text-slate-600">
                {recipients.length > 0 ? (
                  <span className="text-emerald-700 bg-emerald-50 border border-emerald-150 px-2.5 py-1 rounded-xl flex items-center gap-1.5 font-bold">
                    <Check className="h-3.5 w-3.5 text-emerald-600" /> Variáveis dinâmicas preenchidas com sucesso (1ª Linha)
                  </span>
                ) : (
                  <span className="text-amber-800 bg-amber-50 border border-amber-150 px-2.5 py-1 rounded-xl flex items-center gap-1.5 font-bold">
                    Nenhum destinatário disponível para preencher variáveis
                  </span>
                )}
              </span>
              <button
                type="button"
                onClick={() => setShowRealPreviewModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer"
              >
                Fechar Visualização
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
