import express from 'express';
import path from 'path';
import nodemailer from 'nodemailer';
import fs from 'fs';
import dns from 'dns';
import { htmlToText } from 'html-to-text';
import { SmtpConfig, AntiSpamConfig, Recipient, VariableMapping, LogEntry, CampaignStatus } from '../src/types';

function getHistoryFile(workspaceId: string): string {
  const safeId = (workspaceId || 'default').replace(/[^a-zA-Z0-9_\-]/g, '') || 'default';
  const baseDir = process.env.VERCEL ? '/tmp' : process.cwd();
  return path.join(baseDir, `campaign_history_${safeId}.json`);
}

function getCampaignStateFile(workspaceId: string): string {
  const safeId = (workspaceId || 'default').replace(/[^a-zA-Z0-9_\-]/g, '') || 'default';
  const baseDir = process.env.VERCEL ? '/tmp' : process.cwd();
  return path.join(baseDir, `active_campaign_state_${safeId}.json`);
}

function getHistory(workspaceId: string): any[] {
  try {
    const file = getHistoryFile(workspaceId);
    if (fs.existsSync(file)) {
      const data = fs.readFileSync(file, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error(`Error reading history file for workspace ${workspaceId}:`, err);
  }
  return [];
}

function saveToHistory(workspaceId: string, campaign: any) {
  try {
    const file = getHistoryFile(workspaceId);
    const history = getHistory(workspaceId);
    const existsIdx = history.findIndex((item: any) => item.id === campaign.id);
    const historyEntry = {
      id: campaign.id,
      date: campaign.startTime || new Date().toISOString(),
      subject: campaign.smtpConfig?.subject || 'Sem Assunto',
      templateName: campaign.templateName || 'Modelo Geral',
      template: campaign.template,
      total: campaign.total,
      sent: campaign.sent,
      failed: campaign.failed,
      status: campaign.status,
      recipients: campaign.recipients || []
    };
    if (existsIdx >= 0) {
      history[existsIdx] = historyEntry;
    } else {
      history.unshift(historyEntry);
    }
    fs.writeFileSync(file, JSON.stringify(history, null, 2), 'utf8');
  } catch (err) {
    console.error(`Error saving to history file for workspace ${workspaceId}:`, err);
  }
}

// Setup Express
const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Rewrite middleware to normalize Vercel serverless requests
app.use((req, res, next) => {
  if (req.url.startsWith('/api/server/')) {
    req.url = req.url.replace('/api/server/', '/api/');
  }
  next();
});

// Workspace Campaign States & Timeouts
interface WorkspaceCampaign {
  activeCampaign: (CampaignStatus & {
    recipients: Recipient[];
    smtpConfig: SmtpConfig;
    template: string;
    antiSpamConfig: AntiSpamConfig;
    mappings: VariableMapping[];
    currentIndex: number;
    templateName?: string;
  }) | null;
  campaignTimeout: NodeJS.Timeout | null;
}

const activeCampaigns = new Map<string, WorkspaceCampaign>();

function getWorkspace(workspaceId: string): WorkspaceCampaign {
  const cleanId = (workspaceId || 'default').replace(/[^a-zA-Z0-9_\-]/g, '') || 'default';
  if (!activeCampaigns.has(cleanId)) {
    const stateFile = getCampaignStateFile(cleanId);
    let loaded: any = null;
    try {
      if (fs.existsSync(stateFile)) {
        const data = fs.readFileSync(stateFile, 'utf8');
        loaded = JSON.parse(data);
      }
    } catch (err) {
      console.error(`Error loading state file for workspace ${cleanId}:`, err);
    }
    activeCampaigns.set(cleanId, {
      activeCampaign: loaded,
      campaignTimeout: null
    });
  }
  return activeCampaigns.get(cleanId)!;
}

function saveCampaignState(workspaceId: string, campaign: any) {
  try {
    const file = getCampaignStateFile(workspaceId);
    if (campaign) {
      fs.writeFileSync(file, JSON.stringify(campaign, null, 2), 'utf8');
    } else {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
      }
    }
  } catch (err) {
    console.error(`Error saving campaign state for workspace ${workspaceId}:`, err);
  }
}

// Helpers
function getFriendlySmtpError(err: any, host: string): string {
  const errMsg = err?.message || '';
  const errCode = err?.code || '';
  
  if (errCode === 'ENOTFOUND' || errMsg.includes('ENOTFOUND') || errMsg.includes('getaddrinfo')) {
    if (host.toLowerCase().includes('estacio.br')) {
      return `Não foi possível encontrar o servidor SMTP "${host}". O domínio "estacio.br" utiliza o Microsoft Office 365 corporativo. Altere o Host SMTP para "smtp.office365.com" (Porta: 587, Segurança: STARTTLS/desmarcar SSL) para corrigir automaticamente.`;
    }
    return `Não foi possível encontrar o servidor SMTP "${host}". Verifique se o endereço do servidor (Host) está correto (ex: smtp.gmail.com) e se há conexão com a internet.`;
  }
  
  if (errCode === 'ETIMEDOUT' || errMsg.includes('ETIMEDOUT') || errMsg.includes('timeout')) {
    return `Tempo limite de conexão excedido ao tentar se conectar a "${host}". Isso ocorre se a porta SMTP (ex: 465 ou 587) estiver errada, se o servidor estiver fora do ar ou bloqueado por firewalls/provedor de internet.`;
  }
  
  if (errCode === 'ECONNREFUSED' || errMsg.includes('ECONNREFUSED')) {
    return `A conexão foi recusada pelo servidor SMTP "${host}". Certifique-se de que a porta SMTP e o protocolo de segurança (SSL/TLS) selecionados estão corretos para o seu provedor.`;
  }

  // Specific check for Outlook / Office 365 SMTP Auth block (535 5.7.139)
  if (errMsg.includes('5.7.139') || errMsg.includes('535 5.7.139') || errMsg.includes('criteria to be authenticated')) {
    return `Erro de Autenticação do Outlook/Office 365 (535 5.7.139). Por padrão, a Microsoft bloqueia o protocolo antigo SMTP AUTH nas contas modernas. Para resolver isso:
1. Se sua conta for Pessoal (@outlook.com, @hotmail.com): Ative a Verificação em Duas Etapas e crie uma "Senha de App" (App Password) nas configurações de segurança da sua conta Microsoft. Use essa senha gerada aqui, e não sua senha normal de login.
2. Se sua conta for Corporativa (Office 365): O Administrador de TI da sua empresa precisa ativar a opção "SMTP Autenticado" (SMTP AUTH) nas configurações do seu usuário ativo dentro do painel do Administrador do Microsoft 365.`;
  }
  
  if (errMsg.includes('535') || errMsg.includes('auth') || errMsg.includes('credentials') || errMsg.includes('Authentication') || errMsg.includes('Username and Password not accepted')) {
    return `Falha de autenticação (E-mail ou Senha inválidos). IMPORTANTE: Provedores como Gmail e Outlook exigem uma "Senha de App" gerada nas configurações de segurança de sua conta de e-mail, em vez de sua senha comum.`;
  }
  
  return `Erro de conexão SMTP: ${errMsg}`;
}

function addLog(workspaceId: string, type: 'success' | 'error' | 'info', message: string) {
  const ws = getWorkspace(workspaceId);
  if (!ws.activeCampaign) return;
  const now = new Date();
  const timestamp = now.toLocaleTimeString('pt-BR');
  const log: LogEntry = { timestamp, type, message };
  
  // Prepend or append. Let's append, but keep size within 1000 items
  ws.activeCampaign.logs.push(log);
  if (ws.activeCampaign.logs.length > 1000) {
    ws.activeCampaign.logs.shift();
  }
}

function getRandomDelay(min: number, max: number): number {
  if (min >= max) return min;
  // Jitter factor: add a random variation of +/- 20%
  const baseDelay = Math.floor(Math.random() * (max - min + 1)) + min;
  const jitter = (Math.random() * 0.4 - 0.2) * baseDelay;
  return Math.max(min, Math.round(baseDelay + jitter));
}

function replacePlaceholders(template: string, recipient: Recipient, mappings: VariableMapping[]): string {
  let output = template;

  // Replace mapped placeholders
  if (mappings && Array.isArray(mappings)) {
    for (const mapping of mappings) {
      if (!mapping.placeholder) continue;
      const placeholderRegex = new RegExp(`\\{\\{\\s*${escapeRegExp(mapping.placeholder)}\\s*\\}\\}`, 'gi');
      const val = recipient[mapping.columnName] ?? '';
      output = output.replace(placeholderRegex, String(val));
    }
  }

  // Also automatically replace other keys from recipient dictionary directly
  for (const key of Object.keys(recipient)) {
    if (key === 'id') continue;
    const placeholderRegex = new RegExp(`\\{\\{\\s*${escapeRegExp(key)}\\s*\\}\\}`, 'gi');
    const val = recipient[key] ?? '';
    output = output.replace(placeholderRegex, String(val));
  }

  return output;
}

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function recalculateEstimatedTime(workspaceId: string) {
  const ws = getWorkspace(workspaceId);
  if (!ws.activeCampaign) return;
  const { recipients, currentIndex, antiSpamConfig } = ws.activeCampaign;
  const remaining = recipients.length - currentIndex;
  
  if (remaining <= 0) {
    ws.activeCampaign.estimatedTimeRemaining = 0;
    return;
  }

  // Average delay in seconds
  const avgDelay = (antiSpamConfig.minDelay + antiSpamConfig.maxDelay) / 2;
  let timeInSecs = remaining * avgDelay;

  // If there are batches and pauses
  if (antiSpamConfig.batchSize > 0 && antiSpamConfig.batchPauseTime > 0) {
    const sentCount = ws.activeCampaign.sent + ws.activeCampaign.failed;
    // Calculate how many sends are remaining before next pauses
    let relativeIndex = sentCount;
    let pauseCount = 0;
    for (let i = 0; i < remaining; i++) {
      relativeIndex++;
      if (relativeIndex % antiSpamConfig.batchSize === 0 && i < remaining - 1) {
        pauseCount++;
      }
    }
    timeInSecs += pauseCount * antiSpamConfig.batchPauseTime * 60;
  }

  ws.activeCampaign.estimatedTimeRemaining = Math.round(timeInSecs);
}

function scheduleNext(workspaceId: string, ms: number) {
  const ws = getWorkspace(workspaceId);
  if (ws.campaignTimeout) {
    clearTimeout(ws.campaignTimeout);
  }
  ws.campaignTimeout = setTimeout(() => {
    processNextEmail(workspaceId);
  }, ms);
}

async function processNextEmail(workspaceId: string) {
  const ws = getWorkspace(workspaceId);
  if (!ws.activeCampaign) return;
  if (ws.activeCampaign.status !== 'running') return;

  const { recipients, smtpConfig, template, antiSpamConfig, mappings, currentIndex } = ws.activeCampaign;

  if (currentIndex >= recipients.length) {
    ws.activeCampaign.status = 'completed';
    ws.activeCampaign.estimatedTimeRemaining = 0;
    addLog(workspaceId, 'info', '✅ Envio de Mala Direta concluído! Todos os destinatários foram processados.');
    saveToHistory(workspaceId, ws.activeCampaign);
    saveCampaignState(workspaceId, null);
    ws.activeCampaign = null;
    return;
  }

  const recipient = recipients[currentIndex];
  ws.activeCampaign.currentEmail = recipient.email || 'Nenhum';

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const emailVal = recipient.email ? String(recipient.email).trim() : '';

  if (!emailVal || !emailRegex.test(emailVal)) {
    ws.activeCampaign.failed++;
    addLog(workspaceId, 'error', `⚠️ Linha ${currentIndex + 1} ignorada. E-mail inválido ou em branco: "${emailVal || 'vazio'}"`);
    ws.activeCampaign.currentIndex++;
    recalculateEstimatedTime(workspaceId);
    scheduleNext(workspaceId, 100); // go to next immediately
    return;
  }

  // Replace tags
  const customizedSubject = replacePlaceholders(smtpConfig.subject, recipient, mappings);
  const customizedHtml = replacePlaceholders(template, recipient, mappings);
  const customizedText = htmlToText(customizedHtml, { wordwrap: 130 });

  try {
    const transporter = nodemailer.createTransport({
      host: smtpConfig.host,
      port: Number(smtpConfig.port),
      secure: smtpConfig.secure,
      auth: {
        user: smtpConfig.auth.user,
        pass: smtpConfig.auth.pass,
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
    });

    await transporter.sendMail({
      from: `"${smtpConfig.fromName}" <${smtpConfig.fromEmail || smtpConfig.auth.user}>`,
      to: emailVal,
      subject: customizedSubject,
      html: customizedHtml,
      text: customizedText,
    });

    ws.activeCampaign.sent++;
    addLog(workspaceId, 'success', `📧 E-mail enviado com sucesso para ${emailVal}`);
  } catch (err: any) {
    console.error(`Erro ao enviar para ${emailVal} no workspace ${workspaceId}:`, err);
    ws.activeCampaign.failed++;
    const friendlyError = getFriendlySmtpError(err, smtpConfig.host);
    addLog(workspaceId, 'error', `❌ Falha no envio para ${emailVal}: ${friendlyError}`);
  }

  ws.activeCampaign.currentIndex++;
  recalculateEstimatedTime(workspaceId);
  saveCampaignState(workspaceId, ws.activeCampaign); // Persist state

  if (ws.activeCampaign.currentIndex >= recipients.length) {
    ws.activeCampaign.status = 'completed';
    ws.activeCampaign.estimatedTimeRemaining = 0;
    addLog(workspaceId, 'info', '✅ Envio de Mala Direta concluído! Todos os destinatários foram processados.');
    saveToHistory(workspaceId, ws.activeCampaign);
    saveCampaignState(workspaceId, null);
    ws.activeCampaign = null;
    return;
  }

  // Check Batch limit
  const processedSinceStart = ws.activeCampaign.sent + ws.activeCampaign.failed;
  if (antiSpamConfig.batchSize > 0 && processedSinceStart % antiSpamConfig.batchSize === 0) {
    ws.activeCampaign.status = 'paused';
    addLog(workspaceId, 'info', `⏸️ Lote de ${antiSpamConfig.batchSize} e-mails enviado. Pausando por ${antiSpamConfig.batchPauseTime} minutos para evitar bloqueio SPAM...`);
    
    recalculateEstimatedTime(workspaceId);
    saveCampaignState(workspaceId, ws.activeCampaign);

    ws.campaignTimeout = setTimeout(() => {
      const currentWs = getWorkspace(workspaceId);
      if (currentWs.activeCampaign && currentWs.activeCampaign.status === 'paused') {
        currentWs.activeCampaign.status = 'running';
        addLog(workspaceId, 'info', `▶️ Retomando envios após pausa programada.`);
        processNextEmail(workspaceId);
      }
    }, antiSpamConfig.batchPauseTime * 60 * 1000);
    return;
  }

  // Normal random delay between emails
  const delaySecs = getRandomDelay(antiSpamConfig.minDelay, antiSpamConfig.maxDelay);
  addLog(workspaceId, 'info', `⏱️ Aguardando delay anti-spam de ${delaySecs} segundos antes do próximo envio...`);
  scheduleNext(workspaceId, delaySecs * 1000);
}


// --- API ROUTES ---

// Test SMTP connection
app.post('/api/test-smtp', async (req, res) => {
  const { smtpConfig } = req.body;
  if (!smtpConfig || !smtpConfig.host || !smtpConfig.port || !smtpConfig.auth?.user || !smtpConfig.auth?.pass) {
    return res.json({ success: false, error: 'Configuração SMTP incompleta para teste.' });
  }

  try {
    const transporter = nodemailer.createTransport({
      host: smtpConfig.host,
      port: Number(smtpConfig.port),
      secure: smtpConfig.secure,
      auth: {
        user: smtpConfig.auth.user,
        pass: smtpConfig.auth.pass,
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
    });

    // 1. Verify Connection credentials
    await transporter.verify();

    // 2. Send actual test email to "the user themselves"
    const testRecipient = (smtpConfig.fromEmail || smtpConfig.auth.user || '').trim();
    if (!testRecipient || !testRecipient.includes('@')) {
      return res.json({ 
        success: true, 
        message: 'Conexão SMTP validada com sucesso! (Nenhum e-mail de teste foi enviado porque o usuário ou remetente não é um e-mail válido).' 
      });
    }

    const testSenderName = smtpConfig.fromName || 'Mala Direta Base44';
    const testSenderEmail = smtpConfig.fromEmail || smtpConfig.auth.user;

    await transporter.sendMail({
      from: `"${testSenderName}" <${testSenderEmail}>`,
      to: testRecipient,
      subject: '🧪 E-mail de Teste de Conexão - Mala Direta Base44',
      html: `
        <div style="font-family: system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 30px; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          <div style="text-align: center; margin-bottom: 24px;">
            <span style="font-size: 40px;">⚡</span>
            <h1 style="font-size: 20px; font-weight: 800; color: #1e1b4b; margin: 12px 0 4px 0; letter-spacing: -0.025em;">Mala Direta Base44</h1>
            <p style="font-size: 13px; color: #64748b; margin: 0;">Validação de Credenciais SMTP</p>
          </div>
          
          <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 16px; margin-bottom: 24px; text-align: center;">
            <p style="font-size: 14px; font-weight: 700; color: #166534; margin: 0;">🎉 Conexão SMTP Estabelecida com Sucesso!</p>
          </div>

          <div style="font-size: 13px; color: #334155; line-height: 1.6;">
            <p style="margin: 0 0 12px 0;">Olá,</p>
            <p style="margin: 0 0 12px 0;">Este é um e-mail de teste enviado automaticamente para validar as configurações de envio do seu servidor SMTP no aplicativo <strong>Mala Direta Base44</strong>.</p>
            <p style="margin: 0 0 12px 0;">Se você recebeu esta mensagem, significa que seu provedor de e-mail autorizou o disparo e você está pronto para enviar suas campanhas em massa com total segurança!</p>
            
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px; margin: 20px 0;">
              <h4 style="font-size: 11px; font-weight: 800; color: #475569; text-transform: uppercase; margin: 0 0 8px 0; letter-spacing: 0.05em;">Detalhes da Conexão:</h4>
              <table style="width: 100%; border-collapse: collapse; font-size: 12px; color: #475569;">
                <tr>
                  <td style="padding: 3px 0; font-weight: 600; width: 100px;">Host SMTP:</td>
                  <td style="padding: 3px 0; font-family: monospace; color: #0f172a;">${smtpConfig.host}</td>
                </tr>
                <tr>
                  <td style="padding: 3px 0; font-weight: 600;">Porta:</td>
                  <td style="padding: 3px 0; font-family: monospace; color: #0f172a;">${smtpConfig.port}</td>
                </tr>
                <tr>
                  <td style="padding: 3px 0; font-weight: 600;">Segurança:</td>
                  <td style="padding: 3px 0; color: #0f172a;">${smtpConfig.secure ? 'SSL/TLS (Criptografada)' : 'STARTTLS / Sem criptografia direta'}</td>
                </tr>
                <tr>
                  <td style="padding: 3px 0; font-weight: 600;">Usuário:</td>
                  <td style="padding: 3px 0; font-family: monospace; color: #0f172a;">${smtpConfig.auth.user}</td>
                </tr>
                <tr>
                  <td style="padding: 3px 0; font-weight: 600;">Remetente:</td>
                  <td style="padding: 3px 0; font-family: monospace; color: #0f172a;">&quot;${testSenderName}&quot; &lt;${testSenderEmail}&gt;</td>
                </tr>
              </table>
            </div>

            <p style="margin: 0 0 12px 0; font-weight: 700; color: #1e1b4b;">Qual o próximo passo?</p>
            <ul style="margin: 0 0 20px 0; padding-left: 20px; color: #475569; line-height: 1.6;">
              <li style="margin-bottom: 4px;">Retorne ao painel da aplicação.</li>
              <li style="margin-bottom: 4px;">Importe sua planilha de destinatários (caso ainda não tenha feito).</li>
              <li style="margin-bottom: 4px;">Defina as variáveis no seu modelo HTML e inicie os disparos.</li>
            </ul>
          </div>

          <div style="border-top: 1px solid #f1f5f9; padding-top: 16px; text-align: center;">
            <p style="font-size: 11px; color: #94a3b8; margin: 0;">Mala Direta Base44 • Envio Inteligente de Campanhas</p>
          </div>
        </div>
      `
    });

    return res.json({ 
      success: true, 
      message: `Sucesso total! SMTP autenticado e e-mail de teste enviado para: ${testRecipient}. Verifique sua caixa de entrada!` 
    });
  } catch (error: any) {
    console.error('Test SMTP Error:', error);
    const friendlyError = getFriendlySmtpError(error, smtpConfig.host);
    return res.json({ 
      success: false, 
      error: friendlyError
    });
  }
});

// Check SPF, DKIM, DMARC, and MX DNS Records for domain health
app.post('/api/check-dns', async (req, res) => {
  const { domain, selector } = req.body;
  
  if (!domain) {
    return res.json({ success: false, error: 'O domínio do e-mail é obrigatório para realizar o diagnóstico.' });
  }

  // Sanitize the domain
  let cleanDomain = domain.trim().toLowerCase();
  
  // If the user provided a full email, extract the domain
  if (cleanDomain.includes('@')) {
    cleanDomain = cleanDomain.split('@')[1];
  }

  // Remove protocol / slashes / www
  cleanDomain = cleanDomain
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .split('/')[0];

  const activeSelector = (selector || 'default').trim();

  try {
    const results = {
      domain: cleanDomain,
      spf: {
        status: 'missing', // 'valid' | 'invalid' | 'missing'
        record: null as string | null,
        message: 'Nenhum registro SPF encontrado para este domínio.'
      },
      dkim: {
        status: 'missing', // 'valid' | 'missing'
        record: null as string | null,
        message: `Nenhum registro DKIM encontrado no seletor "${activeSelector}".`
      },
      dmarc: {
        status: 'missing', // 'valid' | 'missing'
        record: null as string | null,
        message: 'Nenhum registro DMARC encontrado para este domínio.'
      },
      mx: {
        status: 'missing', // 'valid' | 'missing'
        records: [] as string[],
        message: 'Nenhum registro MX encontrado.'
      }
    };

    // 1. Resolve MX
    try {
      const mxRecords = await dns.promises.resolveMx(cleanDomain);
      if (mxRecords && mxRecords.length > 0) {
        results.mx.status = 'valid';
        results.mx.records = mxRecords.map(r => `${r.exchange} (prioridade: ${r.priority})`);
        results.mx.message = `Encontrados ${mxRecords.length} servidores de e-mail (MX) para receber mensagens.`;
      }
    } catch (e) {
      results.mx.message = 'Nenhum registro MX encontrado. O domínio pode não receber e-mails diretamente.';
    }

    // 2. Resolve SPF
    try {
      const txtRecords = await dns.promises.resolveTxt(cleanDomain);
      const spfRecords = txtRecords
        .map(arr => arr.join(''))
        .filter(record => record.toLowerCase().startsWith('v=spf1'));
      
      if (spfRecords.length === 1) {
        results.spf.status = 'valid';
        results.spf.record = spfRecords[0];
        results.spf.message = `Registro SPF válido encontrado: "${spfRecords[0]}"`;
      } else if (spfRecords.length > 1) {
        results.spf.status = 'invalid';
        results.spf.record = spfRecords[0];
        results.spf.message = `Múltiplos registros SPF encontrados (${spfRecords.length}). Isso invalida a verificação SPF segundo a RFC 7208! Una todos os parâmetros em um único TXT.`;
      }
    } catch (e: any) {
      results.spf.message = `Sem SPF configurado ou domínio inexistente: ${e.message || e}`;
    }

    // 3. Resolve DKIM (on [selector]._domainkey.[domain])
    const dkimDomain = `${activeSelector}._domainkey.${cleanDomain}`;
    try {
      const dkimTxt = await dns.promises.resolveTxt(dkimDomain);
      const dkimRecords = dkimTxt.map(arr => arr.join(''));
      const dkimRecord = dkimRecords.find(rec => rec.toLowerCase().includes('v=dkim') || rec.includes('p='));
      if (dkimRecord) {
        results.dkim.status = 'valid';
        results.dkim.record = dkimRecord;
        results.dkim.message = `Registro DKIM encontrado com sucesso para o seletor "${activeSelector}": "${dkimRecord}"`;
      } else if (dkimRecords.length > 0) {
        results.dkim.status = 'valid';
        results.dkim.record = dkimRecords[0];
        results.dkim.message = `Registro TXT encontrado em _domainkey, mas não parece com DKIM padrão: "${dkimRecords[0]}"`;
      }
    } catch (e: any) {
      results.dkim.message = `DKIM não encontrado em "${dkimDomain}". Certifique-se de usar o seletor correto da sua hospedagem (ex: "default", "google", "k1", "smtp").`;
    }

    // 4. Resolve DMARC (on _dmarc.[domain])
    try {
      const dmarcDomain = `_dmarc.${cleanDomain}`;
      const dmarcTxt = await dns.promises.resolveTxt(dmarcDomain);
      const dmarcRecords = dmarcTxt.map(arr => arr.join(''));
      const dmarcRecord = dmarcRecords.find(rec => rec.toLowerCase().startsWith('v=dmarc1'));
      if (dmarcRecord) {
        results.dmarc.status = 'valid';
        results.dmarc.record = dmarcRecord;
        results.dmarc.message = `Registro DMARC encontrado: "${dmarcRecord}"`;
      }
    } catch (e: any) {
      results.dmarc.message = 'DMARC ausente. Recomendamos criar um registro TXT em "_dmarc" com pelo menos "v=DMARC1; p=none;" para monitorar spams.';
    }

    return res.json({ success: true, results });
  } catch (err: any) {
    console.error('DNS Lookup Error:', err);
    return res.json({ success: false, error: err.message || 'Falha ao consultar DNS.' });
  }
});

const getWorkspaceId = (req: express.Request): string => {
  return (req.headers['x-workspace-id'] as string) || 'default';
};

// Start campaign
app.post('/api/campaign/start', (req, res, next) => {
  try {
    const workspaceId = getWorkspaceId(req);
    const ws = getWorkspace(workspaceId);
    const { recipients, smtpConfig, template, antiSpamConfig, mappings, templateName } = req.body;

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return res.json({ success: false, error: 'A lista de destinatários está vazia ou é inválida.' });
    }
    if (!smtpConfig || !smtpConfig.host || !smtpConfig.auth?.user || !smtpConfig.auth?.pass) {
      return res.json({ success: false, error: 'Configure as credenciais SMTP antes de enviar.' });
    }
    if (!template) {
      return res.json({ success: false, error: 'O modelo de e-mail está em branco.' });
    }

    // Cancel any existing active campaign first
    if (ws.campaignTimeout) {
      clearTimeout(ws.campaignTimeout);
      ws.campaignTimeout = null;
    }

    const campaignId = 'campaign_' + Date.now();
    
    ws.activeCampaign = {
      id: campaignId,
      status: 'running',
      total: recipients.length,
      sent: 0,
      failed: 0,
      currentEmail: '',
      estimatedTimeRemaining: 0,
      logs: [],
      startTime: new Date().toISOString(),
      recipients,
      smtpConfig,
      template,
      antiSpamConfig: antiSpamConfig || { minDelay: 2, maxDelay: 5, batchSize: 50, batchPauseTime: 15 },
      mappings: mappings || [],
      currentIndex: 0,
      templateName: templateName || 'Modelo Geral'
    };

    addLog(workspaceId, 'info', `🚀 Campanha iniciada! Processando ${recipients.length} destinatários.`);
    recalculateEstimatedTime(workspaceId);
    saveCampaignState(workspaceId, ws.activeCampaign);

    // Start sending
    processNextEmail(workspaceId);

    return res.json({ success: true, campaignId, status: ws.activeCampaign });
  } catch (err) {
    next(err);
  }
});

// Get active campaign status
app.get('/api/campaign/status', (req, res, next) => {
  try {
    const workspaceId = getWorkspaceId(req);
    const ws = getWorkspace(workspaceId);

    if (!ws.activeCampaign) {
      return res.json({
        id: '',
        status: 'idle',
        total: 0,
        sent: 0,
        failed: 0,
        currentEmail: '',
        estimatedTimeRemaining: 0,
        logs: [],
        startTime: null
      });
    }

    return res.json({
      id: ws.activeCampaign.id,
      status: ws.activeCampaign.status,
      total: ws.activeCampaign.total,
      sent: ws.activeCampaign.sent,
      failed: ws.activeCampaign.failed,
      currentEmail: ws.activeCampaign.currentEmail,
      estimatedTimeRemaining: ws.activeCampaign.estimatedTimeRemaining,
      logs: ws.activeCampaign.logs,
      startTime: ws.activeCampaign.startTime
    });
  } catch (err) {
    next(err);
  }
});

// Pause / Resume campaign
app.post('/api/campaign/toggle', (req, res, next) => {
  try {
    const workspaceId = getWorkspaceId(req);
    const ws = getWorkspace(workspaceId);

    if (!ws.activeCampaign) {
      return res.json({ success: false, error: 'Nenhuma campanha ativa encontrada.' });
    }

    if (ws.activeCampaign.status === 'running') {
      ws.activeCampaign.status = 'paused';
      if (ws.campaignTimeout) {
        clearTimeout(ws.campaignTimeout);
        ws.campaignTimeout = null;
      }
      addLog(workspaceId, 'info', '⏸️ Campanha pausada manualmente pelo usuário.');
      saveCampaignState(workspaceId, ws.activeCampaign);
    } else if (ws.activeCampaign.status === 'paused') {
      ws.activeCampaign.status = 'running';
      addLog(workspaceId, 'info', '▶️ Campanha retomada manualmente pelo usuário.');
      saveCampaignState(workspaceId, ws.activeCampaign);
      processNextEmail(workspaceId);
    }

    return res.json({ success: true, status: ws.activeCampaign.status });
  } catch (err) {
    next(err);
  }
});

// Cancel active campaign
app.post('/api/campaign/cancel', (req, res, next) => {
  try {
    const workspaceId = getWorkspaceId(req);
    const ws = getWorkspace(workspaceId);

    if (ws.campaignTimeout) {
      clearTimeout(ws.campaignTimeout);
      ws.campaignTimeout = null;
    }

    if (ws.activeCampaign) {
      ws.activeCampaign.status = 'cancelled';
      addLog(workspaceId, 'error', '🛑 Campanha cancelada pelo usuário.');
      saveToHistory(workspaceId, ws.activeCampaign);
      saveCampaignState(workspaceId, null);
      const finalState = { ...ws.activeCampaign };
      ws.activeCampaign = null;
      return res.json({ success: true, message: 'Campanha cancelada com sucesso.', finalState });
    }

    return res.json({ success: true, message: 'Nenhuma campanha em execução.' });
  } catch (err) {
    next(err);
  }
});

// Clear campaign / reset
app.post('/api/campaign/reset', (req, res, next) => {
  try {
    const workspaceId = getWorkspaceId(req);
    const ws = getWorkspace(workspaceId);

    if (ws.campaignTimeout) {
      clearTimeout(ws.campaignTimeout);
      ws.campaignTimeout = null;
    }
    ws.activeCampaign = null;
    saveCampaignState(workspaceId, null);
    return res.json({ success: true, message: 'Estado resetado com sucesso.' });
  } catch (err) {
    next(err);
  }
});

// GET campaign history
app.get('/api/campaign/history', (req, res, next) => {
  try {
    const workspaceId = getWorkspaceId(req);
    const history = getHistory(workspaceId);
    return res.json({ success: true, history });
  } catch (err) {
    next(err);
  }
});

// DELETE single campaign history entry
app.delete('/api/campaign/history/:id', (req, res) => {
  const workspaceId = getWorkspaceId(req);
  const { id } = req.params;
  try {
    const history = getHistory(workspaceId);
    const filtered = history.filter((item: any) => item.id !== id);
    const file = getHistoryFile(workspaceId);
    fs.writeFileSync(file, JSON.stringify(filtered, null, 2), 'utf8');
    return res.json({ success: true, message: 'Registro de histórico excluído com sucesso.' });
  } catch (err: any) {
    return res.json({ success: false, error: 'Erro ao excluir do histórico: ' + err.message });
  }
});

// DELETE clear all history
app.delete('/api/campaign/history', (req, res) => {
  const workspaceId = getWorkspaceId(req);
  try {
    const file = getHistoryFile(workspaceId);
    fs.writeFileSync(file, JSON.stringify([], null, 2), 'utf8');
    return res.json({ success: true, message: 'Todo o histórico foi limpo com sucesso.' });
  } catch (err: any) {
    return res.json({ success: false, error: 'Erro ao limpar histórico: ' + err.message });
  }
});

// Middleware global para tratamento de erros não capturados (Express)
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled server exception:', err);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    success: false,
    error: err.message || 'Ocorreu um erro interno inesperado no servidor.'
  });
});


// --- VITE MIDDLEWARE SETUP ---

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

// Export the app instance for Vercel Serverless Functions
export default app;

// Only bind to local port when not in a serverless environment like Vercel
if (!process.env.VERCEL) {
  startServer();
}
