const AUTH_HASH = 'ef2754ffd45a70e88fd7642c21a90c6f1c3f4fac5e74e088d11e7944439bfa1a';
const AUTH_SESSION_KEY = 'psych90_access_granted';
const AUTH_ATTEMPTS_KEY = 'psych90_access_attempts';
const AUTH_LOCK_KEY = 'psych90_access_lock_until';
const LICENSE_TOKEN_KEY = 'psych90_license_token_v1';
const DEVICE_ID_KEY = 'psych90_device_id_v1';
const AUTH_MAX_ATTEMPTS = 5;
const AUTH_LOCK_MS = 60_000;
const RESULT_HISTORY_KEY = 'psych90_result_history_v1';
const RESULT_HISTORY_LIMIT = 5;
const runtimeConfig = window.PSYCH90_CONFIG || {};
const AUTH_API_BASE = String(runtimeConfig.authApiBase || '').trim().replace(/\/$/, '');
const AUTH_PRODUCT_ID = String(runtimeConfig.productId || 'scl90').trim();

const authGate = document.querySelector('#auth-gate');
const authForm = document.querySelector('#auth-form');
const authCode = document.querySelector('#auth-code');
const authSubmit = document.querySelector('#auth-submit');
const authClose = document.querySelector('#auth-close');
const authFeedback = document.querySelector('#auth-feedback');
const authNote = document.querySelector('#auth-note');
const appShell = document.querySelector('.app-shell');
let lockTimer = null;
let webMcpRegistered = false;
let isAuthorized = false;

function storageGet(storage, key) {
  try { return storage.getItem(key); } catch { return null; }
}

function storageSet(storage, key, value) {
  try { storage.setItem(key, value); return true; } catch { return false; }
}

function storageRemove(storage, key) {
  try { storage.removeItem(key); } catch {}
}

function getDeviceId() {
  const existing = storageGet(localStorage, DEVICE_ID_KEY);
  if (existing) return existing;
  const id = typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : Array.from(crypto.getRandomValues(new Uint8Array(24)), (byte) => byte.toString(16).padStart(2, '0')).join('');
  storageSet(localStorage, DEVICE_ID_KEY, id);
  return id;
}

async function licenseRequest(pathname, payload) {
  let response;
  try {
    response = await fetch(`${AUTH_API_BASE}${pathname}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  } catch {
    throw Object.assign(new Error('暂时无法连接授权服务，请检查网络后重试。'), { code: 'NETWORK_ERROR' });
  }
  const body = await response.json().catch(() => ({}));
  if (!response.ok || !body.success) {
    throw Object.assign(new Error(body.message || '授权验证失败，请稍后重试。'), {
      code: body.code || 'AUTH_ERROR',
      retryAfter: Number(body.retryAfter || response.headers.get('Retry-After') || 0)
    });
  }
  return body;
}

async function sha256(value) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function closeAuthorization() {
  document.body.classList.remove('auth-open');
  authGate.hidden = true;
  appShell.removeAttribute('inert');
  startButton?.focus();
}

function openAuthorization() {
  document.body.classList.add('auth-open');
  authGate.hidden = false;
  appShell.setAttribute('inert', '');
  enforceExistingLock();
  window.setTimeout(() => authCode.focus(), 0);
}

function markAuthorized() {
  storageSet(sessionStorage, AUTH_SESSION_KEY, '1');
  storageRemove(sessionStorage, AUTH_ATTEMPTS_KEY);
  storageRemove(sessionStorage, AUTH_LOCK_KEY);
  isAuthorized = true;
  registerWebMcpTools();
}

function unlockSite() {
  markAuthorized();
  closeAuthorization();
  startAssessment({ reset: true });
}

function updateLockMessage() {
  const remaining = Math.ceil((Number(sessionStorage.getItem(AUTH_LOCK_KEY) || 0) - Date.now()) / 1000);
  if (remaining <= 0) {
    window.clearInterval(lockTimer);
    lockTimer = null;
    sessionStorage.removeItem(AUTH_LOCK_KEY);
    authSubmit.disabled = false;
    authCode.disabled = false;
    authFeedback.textContent = '现在可以重新尝试。';
    authFeedback.className = 'auth-feedback success';
    authCode.focus();
    return;
  }
  authSubmit.disabled = true;
  authCode.disabled = true;
  authFeedback.textContent = `输入次数过多，请 ${remaining} 秒后再试。`;
  authFeedback.className = 'auth-feedback';
}

function enforceExistingLock() {
  const lockUntil = Number(sessionStorage.getItem(AUTH_LOCK_KEY) || 0);
  if (lockUntil <= Date.now()) return false;
  updateLockMessage();
  lockTimer = window.setInterval(updateLockMessage, 1000);
  return true;
}

authCode.addEventListener('input', () => {
  authCode.value = authCode.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
  authCode.setAttribute('aria-invalid', 'false');
  authFeedback.textContent = '';
  authFeedback.className = 'auth-feedback';
});

authClose.addEventListener('click', closeAuthorization);
authGate.addEventListener('click', (event) => {
  if (event.target === authGate) closeAuthorization();
});

authForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (enforceExistingLock()) return;
  const code = authCode.value.trim().toUpperCase();
  if (!/^[A-Z0-9]{6}$/.test(code)) {
    authCode.setAttribute('aria-invalid', 'true');
    authFeedback.textContent = '请输入六位英文与数字组合授权码。';
    authCode.focus();
    return;
  }
  authSubmit.disabled = true;
  authSubmit.textContent = '正在验证…';
  if (AUTH_API_BASE) {
    try {
      const result = await licenseRequest('/api/licenses/activate', {
        code,
        productId: AUTH_PRODUCT_ID,
        deviceId: getDeviceId()
      });
      storageSet(localStorage, LICENSE_TOKEN_KEY, result.token);
      authFeedback.textContent = '验证成功，正在进入…';
      authFeedback.className = 'auth-feedback success';
      window.setTimeout(unlockSite, 180);
    } catch (error) {
      authSubmit.disabled = false;
      authCode.setAttribute('aria-invalid', 'true');
      authCode.select();
      authFeedback.textContent = error.message;
      authFeedback.className = 'auth-feedback';
    } finally {
      authSubmit.textContent = '验证并进入';
    }
    return;
  }
  const matches = await sha256(code).then((hash) => hash === AUTH_HASH).catch(() => false);
  authSubmit.textContent = '验证并进入';
  if (matches) {
    authFeedback.textContent = '验证成功';
    authFeedback.className = 'auth-feedback success';
    window.setTimeout(unlockSite, 180);
    return;
  }
  const attempts = Number(sessionStorage.getItem(AUTH_ATTEMPTS_KEY) || 0) + 1;
  authCode.setAttribute('aria-invalid', 'true');
  authCode.select();
  if (attempts >= AUTH_MAX_ATTEMPTS) {
    sessionStorage.setItem(AUTH_ATTEMPTS_KEY, '0');
    sessionStorage.setItem(AUTH_LOCK_KEY, String(Date.now() + AUTH_LOCK_MS));
    enforceExistingLock();
    return;
  }
  sessionStorage.setItem(AUTH_ATTEMPTS_KEY, String(attempts));
  authSubmit.disabled = false;
  authFeedback.textContent = `授权码不正确，还可尝试 ${AUTH_MAX_ATTEMPTS - attempts} 次。`;
});

const questions = [
  '遇到不顺心的事情时，我很容易变得烦躁或生气。',
  '我会出现头痛、头部发胀或类似的不适。',
  '最近我对亲密关系或性方面的兴趣和愉悦感明显降低。',
  '我有时会感到头晕、身体发飘或站立不稳。',
  '我经常怀疑别人接近自己可能另有目的。',
  '在空旷场所、街道或类似环境中，我会明显感到害怕。',
  '一些自己并不想去想的念头，会反复闯入脑海。',
  '和别人比较时，我很容易觉得自己不如对方。',
  '我经常感觉精力不足，行动或思考都比平时迟缓。',
  '我经常感到情绪低落、心情沉重。',
  '我经常处于紧张、神经绷紧的状态。',
  '有时恐惧感会突然出现，即使当时没有明显危险。',
  '我经常觉得别人可能正在议论、观察或特别注意我。',
  '做完事情以后，我常常需要重新检查才能放心。',
  '我有时会因为很小的事情突然大发脾气。',
  '生气时，我会产生摔东西、砸东西或破坏物品的冲动。',
  '一个人外出或离家较远时，我会明显感到害怕。',
  '我觉得如果不保持警惕，别人可能会欺骗、利用或伤害我。',
  '我经常感觉身体和精神都处于紧绷状态，很难完全放松。',
  '极度愤怒时，我会产生推搡、攻击或伤害别人的冲动。',
  '我有时会突然出现非常强烈的恐慌感。',
  '最近我的食欲明显下降，或者经常没有胃口。',
  '有时我会觉得某些出现在脑中的想法不像是自己主动产生的。',
  '乘坐公共汽车、地铁、火车等公共交通工具时，我会明显感到害怕。',
  '我对未来缺少希望，很难相信事情会真正变好。',
  '我的胸口或心脏附近会出现疼痛、发紧等不适。',
  '我的情绪很容易低落，有时会忍不住想哭。',
  '我有一些看法或信念，与周围大多数人的想法明显不同。',
  '别人的批评、冷淡或否定很容易让我受到伤害。',
  '出现问题以后，我经常过度责怪自己。',
  '因为害怕，我会主动回避某些地方、活动或环境。',
  '我经常觉得自己没有价值，或者不值得被肯定。',
  '我曾出现过不想继续活下去，或者伤害自己的念头。',
  '我经常需要很长时间才能入睡。',
  '即使没有明确原因，我也经常担心坏事情即将发生。',
  '有些与性有关的想法会反复出现，并让我感到明显困扰。',
  '我做事情时经常必须非常缓慢、仔细，否则就会感到不安。',
  '即使身边有人，我仍然经常感到孤独。',
  '当别人注视我或关注我的表现时，我会明显不自在。',
  '即使面对普通决定，我也会反复权衡，很难做出选择。',
  '在拥挤、人很多的地方，我会明显害怕或想尽快离开。',
  '我有时觉得别人故意不给我应得的认可，或者刻意贬低我的表现。',
  '紧张时，我会坐立不安，很难安静下来。',
  '我经常出现恶心、胃部不适或消化系统方面的不舒服。',
  '很多普通事情对我来说都像需要付出很大的力气才能完成。',
  '有时我会听到一些周围其他人似乎没有听到的声音。',
  '我的腰部或背部经常出现疼痛、酸胀或明显不适。',
  '思考或做事情时，我有时会突然脑子一片空白。',
  '我经常觉得自己的处境很难改变，像被困住了一样。',
  '我的脑中有时会突然出现让我明显害怕的画面或想法。',
  '和别人相处时，我会过度在意自己说话、动作或表现是否得体。',
  '我经常觉得自己与别人之间隔着明显的距离，很难建立真正亲近的关系。',
  '我发现自己有时会过度挑剔或批评别人。',
  '我的手脚或身体某些部位会出现麻木、刺痛等异常感觉。',
  '我有时会感觉喉咙发紧，像有东西堵在那里一样。',
  '在公共场合，我有时会因为担心晕倒或发生意外而感到明显害怕。',
  '我的手或身体有时会因为紧张而明显发抖。',
  '我有时觉得自己应该因为某些过错而受到惩罚。',
  '我有时会感觉呼吸不顺畅、气不够用或需要刻意深呼吸。',
  '最近我会反复想到死亡、生命结束或自己可能死去。',
  '我很难长时间集中注意力，思绪容易被打断。',
  '我有时会担心自己的身体存在某种严重问题。',
  '紧张或害怕时，我会明显感觉心跳很快、心脏怦怦跳。',
  '即使知道没有必要，我仍然会忍不住重复某些动作或步骤。',
  '我的手臂、腿部或身体其他部位有时会明显无力。',
  '最近我有时会明显吃得过多，或者很难控制进食量。',
  '我最近比平时更容易和别人争吵或发生正面冲突。',
  '我经常比计划时间更早醒来，而且醒后难以再次入睡。',
  '我有时会产生明显的害怕感，即使说不清具体在害怕什么。',
  '我的睡眠不安稳，经常醒来、翻身或睡得很浅。',
  '和别人相处时，我经常担心对方不喜欢自己。',
  '我有时会觉得自己的精神或思维出了严重问题。',
  '当只剩下自己一个人时，我有时会明显感到害怕。',
  '在别人面前吃东西、说话或完成某些事情时，我会觉得尴尬或不自然。',
  '和自己感兴趣的人或异性相处时，我容易明显紧张、局促或不自在。',
  '有时我会觉得自己的思维似乎受到了某种外部力量的干扰或影响。',
  '我经常因为过去做过或没做过的事情产生明显的内疚感。',
  '我的身体有时会突然发冷、发热、出汗或潮红。',
  '生气时，我会忍不住大喊大叫，或者把手边的东西扔出去。',
  '我经常觉得自己与周围的人格格不入，像是不属于他们中的一员。',
  '我的手臂或腿部有时会感觉异常沉重。',
  '遇到问题时，我容易认为主要责任在别人，而不是自己。',
  '我最近经常忘记刚做过、刚听过或原本准备去做的事情。',
  '我经常担心自己做事太草率、粗心，或者遗漏了重要细节。',
  '我经常觉得别人并不真正理解我，也不太能体谅我的感受。',
  '我经常对很多事情担心得过多，很难停止反复担心。',
  '很多以前能够让我开心的事情，现在很难让我真正感到愉快。',
  '我的肌肉经常出现酸痛、疼痛或明显的不舒服。',
  '做事情时，我经常感觉被卡住，很难顺利完成原本要做的任务。',
  '有时我会感觉别人似乎能够知道自己没有说出口的想法。'
];

const dimensions = [
  { code: 'SOM', name: '躯体化', color: '#2f8f83', items: [2,4,26,44,47,54,55,59,65,78,81,88], description: '反映头痛、胸闷、胃部不适、乏力、麻木和肌肉疼痛等主观身体困扰。身体症状也可能来自生理原因，持续不适时应同时考虑医疗评估。' },
  { code: 'O-C', name: '强迫特征', color: '#4769a6', items: [7,14,37,40,48,61,64,83,84,89], description: '反映反复思考、检查、犹豫、担心出错，以及注意力或任务效率受到影响的体验。' },
  { code: 'I-S', name: '人际敏感', color: '#8b62a8', items: [8,29,39,51,53,71,74,75,85], description: '反映在人际交往中对评价、否定和比较的敏感，以及自卑、拘谨或受伤感。' },
  { code: 'DEP', name: '抑郁相关体验', color: '#4c728b', items: [3,9,10,25,27,30,32,33,38,45,49,86,87], description: '反映情绪低落、兴趣和动力下降、自责、无价值感、疲惫和对未来缺少希望等近期体验。' },
  { code: 'ANX', name: '焦虑', color: '#d28a3c', items: [11,12,19,21,35,43,50,57,63,69], description: '反映持续紧张、过度担忧、坐立不安、恐慌，以及心悸、发抖和难以放松等体验。' },
  { code: 'HOS', name: '敌对', color: '#b45353', items: [1,15,16,20,67,79], description: '反映烦躁、愤怒、争吵，以及摔东西或伤害他人的冲动。分数较高时应优先留意情绪失控和安全风险。' },
  { code: 'PHOB', name: '恐怖焦虑', color: '#5b7ab8', items: [6,17,24,31,41,56,73], description: '反映对独处、外出、人群、公共交通或特定环境的恐惧和回避体验。' },
  { code: 'PAR', name: '偏执观念', color: '#9a6c45', items: [5,13,18,28,42,82], description: '反映对他人动机的警觉、怀疑、不信任、被议论感或受到不公平对待的体验。' },
  { code: 'PSY', name: '精神病性相关体验', color: '#6b648f', items: [23,36,46,52,58,62,72,76,80,90], description: '反映较少见的思维、知觉、人际疏离或现实感体验。若这类体验明显、持续或影响安全，建议尽快接受专业评估。' }
];

const additionalItems = [
  { number: 22, label: '食欲下降' }, { number: 34, label: '入睡困难' },
  { number: 60, label: '死亡相关想法' }, { number: 66, label: '进食过量' },
  { number: 68, label: '早醒' }, { number: 70, label: '睡眠不稳' },
  { number: 77, label: '罪疚感' }
];

const optionLabels = ['完全没有', '轻微', '中等', '明显', '非常严重'];
const state = {
  current: 0,
  answers: Array(questions.length).fill(null),
  isAdvancing: false,
  advanceTimer: null,
  completedAt: null
};
const startView = document.querySelector('#start-view');
const questionView = document.querySelector('#question-view');
const resultView = document.querySelector('#result-view');
const consent = document.querySelector('#consent');
const startButton = document.querySelector('#start-button');
const questionText = document.querySelector('#question-text');
const progressLabel = document.querySelector('#progress-label');
const progressFill = document.querySelector('#progress-fill');
const options = document.querySelector('#options');
const backButton = document.querySelector('#back-button');
const exitButton = document.querySelector('#exit-button');
const supportSheet = document.querySelector('#support-sheet');

function setView(view) {
  startView.hidden = view !== 'start';
  questionView.hidden = view !== 'question';
  resultView.hidden = view !== 'result';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function cancelPendingAdvance() {
  if (state.advanceTimer !== null) window.clearTimeout(state.advanceTimer);
  state.advanceTimer = null;
  state.isAdvancing = false;
}

function startAssessment({ reset = false } = {}) {
  cancelPendingAdvance();
  if (reset) {
    state.current = 0;
    state.answers.fill(null);
    state.completedAt = null;
  } else {
    const firstUnanswered = state.answers.findIndex((value) => value === null);
    state.current = firstUnanswered >= 0 ? firstUnanswered : 0;
  }
  renderQuestion();
  setView('question');
}

function renderQuestion() {
  const number = state.current + 1;
  progressLabel.textContent = `第 ${number} / ${questions.length} 题`;
  progressFill.style.width = `${(number / questions.length) * 100}%`;
  questionText.textContent = questions[state.current];
  backButton.disabled = state.current === 0;
  backButton.style.opacity = state.current === 0 ? '.35' : '1';
  options.replaceChildren();
  optionLabels.forEach((label, score) => {
    const button = document.createElement('button');
    const selected = state.answers[state.current] === score;
    button.type = 'button';
    button.disabled = state.isAdvancing;
    button.className = `option-button${selected ? ' selected' : ''}`;
    button.setAttribute('role', 'radio');
    button.setAttribute('aria-checked', String(selected));
    button.innerHTML = `<span>${label}</span><span class="option-score">${score}</span>`;
    button.addEventListener('click', () => recordAnswer(score));
    options.append(button);
  });
}

function recordAnswer(score) {
  if (state.isAdvancing || !Number.isInteger(score) || score < 0 || score > 4) return;
  state.isAdvancing = true;
  state.answers[state.current] = score;
  renderQuestion();
  if ((state.current === 32 || state.current === 59) && score > 0) {
    showImmediateSupport(score);
    return;
  }
  state.advanceTimer = window.setTimeout(advance, 220);
}

function advance() {
  cancelPendingAdvance();
  if (state.current < questions.length - 1) {
    state.current += 1;
    renderQuestion();
    return;
  }
  showResults();
}

function showImmediateSupport(score) {
  const urgent = score >= 2;
  supportSheet.hidden = false;
  supportSheet.innerHTML = `
    <div class="sheet-backdrop"></div>
    <section class="sheet-card" role="alertdialog" aria-modal="true" aria-labelledby="support-title">
      <span class="support-icon" aria-hidden="true">+</span>
      <p class="section-kicker">优先关注安全</p>
      <h2 id="support-title">${urgent ? '建议尽快寻求支持' : '这项回答值得额外关注'}</h2>
      <p>${urgent ? '你报告了较明显的自伤或轻生相关想法。这项信息比普通测试分数更需要优先关注。' : '你报告了轻微的自伤或轻生相关想法。请认真观察它是否持续、增强或开始影响你的安全。'}</p>
      <div class="support-actions">
        <strong>如果这些想法目前仍存在、正在增强，或已经出现具体计划：</strong>
        <ol><li>立即联系一位可信赖的人，请对方陪在你身边。</li><li>远离可能用于伤害自己的物品或环境。</li><li>尽快联系当地紧急医疗服务、危机干预资源或精神科专业人员。</li></ol>
      </div>
      <button class="primary-button" id="support-continue" type="button">我知道了，继续作答</button>
    </section>`;
  document.querySelector('#support-continue')?.focus();
  document.querySelector('#support-continue')?.addEventListener('click', () => {
    supportSheet.hidden = true;
    supportSheet.replaceChildren();
    advance();
  });
}

function calculateResults() {
  const totalScore = state.answers.reduce((sum, score) => sum + Number(score || 0), 0);
  const pst = state.answers.filter((score) => Number(score) > 0).length;
  const gsi = totalScore / questions.length;
  const psdi = pst > 0 ? totalScore / pst : 0;
  const dimensionResults = dimensions.map((dimension) => {
    const sum = dimension.items.reduce((subtotal, itemNumber) => subtotal + state.answers[itemNumber - 1], 0);
    return { ...dimension, raw: sum / dimension.items.length };
  });
  return { totalScore, pst, gsi, psdi, dimensionResults, riskScore: Math.max(state.answers[32], state.answers[59]) };
}

const dimensionGuidance = {
  SOM: { title: '先区分身体与压力信号', text: '记录不适出现的时间、持续多久和当时情境；若疼痛、胸闷、头晕等持续或加重，应优先接受医疗评估。' },
  'O-C': { title: '给反复检查设定停止点', text: '把任务拆成更小步骤，并预先约定检查次数；若反复想法或行为明显占用时间，可考虑寻求专业支持。' },
  'I-S': { title: '观察评价触发点', text: '记录哪些互动最容易引发自我否定，尝试把“事实”和“对方可能怎么看我”分开书写。' },
  DEP: { title: '先恢复最小日常节律', text: '从规律起床、进食、短时活动和联系可信赖的人开始；若低落持续或影响生活，请尽快寻求专业评估。' },
  ANX: { title: '降低持续警觉', text: '减少过量咖啡因和睡前刺激，练习缓慢呼气，并把担忧写成可以处理的下一步。' },
  HOS: { title: '为冲突设置暂停动作', text: '情绪升高时先离开冲突现场、放下可能伤人的物品，等身体反应下降后再继续沟通。' },
  PHOB: { title: '从可承受的小步骤开始', text: '不要强迫自己一次克服全部恐惧；在安全前提下逐级接近，并记录实际发生的结果。' },
  PAR: { title: '核对证据与推断', text: '把已经发生的事实、自己的解释和仍需核实的信息分开，必要时向可信赖的人获取第二视角。' },
  PSY: { title: '优先确认现实感与安全', text: '如果异常知觉、思维受影响感持续、增强或影响安全，请尽快联系精神科或专业心理人员进行评估。' }
};

function formatReportDate(value) {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false
  }).format(new Date(value)).replaceAll('/', '.');
}

function getHistory() {
  try {
    const value = JSON.parse(localStorage.getItem(RESULT_HISTORY_KEY) || '[]');
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function serializeResult(result) {
  return {
    createdAt: state.completedAt,
    gsi: Number(result.gsi.toFixed(3)),
    pst: result.pst,
    psdi: Number(result.psdi.toFixed(3)),
    dimensions: Object.fromEntries(result.dimensionResults.map((item) => [item.code, Number(item.raw.toFixed(3))]))
  };
}

function saveResultHistory(result) {
  const history = getHistory();
  const record = serializeResult(result);
  const withoutDuplicate = history.filter((item) => item.createdAt !== record.createdAt);
  localStorage.setItem(RESULT_HISTORY_KEY, JSON.stringify([record, ...withoutDuplicate].slice(0, RESULT_HISTORY_LIMIT)));
}

function deltaLabel(value, digits = 2) {
  if (Math.abs(value) < 0.005) return '基本持平';
  return `较上次 ${value > 0 ? '+' : ''}${value.toFixed(digits)}`;
}

function renderTrend(previous, result) {
  if (!previous?.dimensions) {
    return `
      <section class="result-card trend-card">
        <p class="section-kicker">前后测记录</p>
        <h2>从下一次开始看见变化</h2>
        <p>如果你愿意，可以主动把本次摘要保存在这个浏览器中。再次完成测评后，这里会比较两次结果。数据不会上传。</p>
      </section>`;
  }
  const changes = result.dimensionResults.map((item) => ({
    ...item,
    delta: item.raw - Number(previous.dimensions[item.code] || 0)
  })).sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
  const largest = changes[0];
  return `
    <section class="result-card trend-card">
      <div class="section-heading">
        <div><p class="section-kicker">前后测记录</p><h2>与上次本机记录对比</h2></div>
        <span class="range-key">${formatReportDate(previous.createdAt)}</span>
      </div>
      <div class="trend-grid">
        <div><span>总体均分 GSI</span><strong>${deltaLabel(result.gsi - previous.gsi)}</strong></div>
        <div><span>有困扰项目 PST</span><strong>${deltaLabel(result.pst - previous.pst, 0)}</strong></div>
        <div><span>变化最明显维度</span><strong>${largest.name} ${largest.delta > 0 ? '+' : ''}${largest.delta.toFixed(2)}</strong></div>
      </div>
      <p class="trend-note">这里只比较两次作答差异，不代表病情好转或恶化。作答情境、睡眠和近期事件都可能影响结果。</p>
    </section>`;
}

function radarPoint(index, value, count, cx, cy, radius) {
  const angle = -Math.PI / 2 + (Math.PI * 2 * index) / count;
  return {
    x: cx + Math.cos(angle) * radius * value,
    y: cy + Math.sin(angle) * radius * value
  };
}

function makeRadarSvg(results) {
  const width = 360;
  const height = 340;
  const cx = 180;
  const cy = 158;
  const radius = 105;
  const count = results.length;
  const shortNames = ['躯体', '强迫', '人际', '抑郁', '焦虑', '敌对', '恐怖', '偏执', '精神'];
  const polygon = (level) => Array.from({ length: count }, (_, index) => {
    const point = radarPoint(index, level, count, cx, cy, radius);
    return `${point.x.toFixed(1)},${point.y.toFixed(1)}`;
  }).join(' ');
  const axes = Array.from({ length: count }, (_, index) => {
    const point = radarPoint(index, 1, count, cx, cy, radius);
    return `<line x1="${cx}" y1="${cy}" x2="${point.x.toFixed(1)}" y2="${point.y.toFixed(1)}" />`;
  }).join('');
  const values = results.map((item, index) => {
    const point = radarPoint(index, item.raw / 4, count, cx, cy, radius);
    return `${point.x.toFixed(1)},${point.y.toFixed(1)}`;
  }).join(' ');
  const dots = results.map((item, index) => {
    const point = radarPoint(index, item.raw / 4, count, cx, cy, radius);
    return `<circle cx="${point.x.toFixed(1)}" cy="${point.y.toFixed(1)}" r="3.2"><title>${item.name} ${item.raw.toFixed(2)} / 4</title></circle>`;
  }).join('');
  const labels = results.map((item, index) => {
    const point = radarPoint(index, 1.28, count, cx, cy, radius);
    const anchor = point.x < cx - 8 ? 'end' : point.x > cx + 8 ? 'start' : 'middle';
    return `<text x="${point.x.toFixed(1)}" y="${(point.y + 4).toFixed(1)}" text-anchor="${anchor}">${shortNames[index]}</text>`;
  }).join('');
  return `
    <svg class="radar-chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="九维原始均分雷达图，越靠外表示本次报告的困扰强度越高">
      <g class="radar-grid">${[.25, .5, .75, 1].map((level) => `<polygon points="${polygon(level)}" />`).join('')}${axes}</g>
      <polygon class="radar-area" points="${values}" />
      <g class="radar-dots">${dots}</g>
      <g class="radar-labels">${labels}</g>
      <text class="radar-scale" x="${cx}" y="${height - 8}" text-anchor="middle">中心 0 · 外圈 4</text>
    </svg>`;
}

function renderTopDimensions(ranked) {
  const top = ranked.slice(0, 3);
  if (!top.some((item) => item.raw > 0)) {
    return '<p class="empty-insight">本次九个维度均未报告相关困扰。若实际感受与结果不一致，可以在状态发生变化后重新作答。</p>';
  }
  return `<div class="top-dimension-list">${top.map((item, index) => `
    <article>
      <span class="top-rank">0${index + 1}</span>
      <div><h3>${item.name}</h3><p>${item.description}</p></div>
      <strong>${item.raw.toFixed(2)}<small>/4</small></strong>
    </article>`).join('')}</div>`;
}

function renderRecommendations(ranked) {
  const relevant = ranked.filter((item) => item.raw > 0).slice(0, 3);
  if (relevant.length === 0) {
    return `<ol class="recommendation-list">
      <li><span>01</span><div><strong>维持基本生活节律</strong><p>继续保持相对规律的睡眠、进食和日常活动。</p></div></li>
      <li><span>02</span><div><strong>定期做一次状态回顾</strong><p>每隔一段时间观察情绪、身体和人际状态是否出现持续变化。</p></div></li>
      <li><span>03</span><div><strong>需要时及时求助</strong><p>如果实际困扰与本次结果不一致，或之后开始影响生活，可以重新评估并考虑专业支持。</p></div></li>
    </ol>`;
  }
  return `<ol class="recommendation-list">${relevant.map((item, index) => {
    const advice = dimensionGuidance[item.code];
    return `<li><span>0${index + 1}</span><div><strong>${advice.title}</strong><p>${advice.text}</p><small>对应：${item.name} ${item.raw.toFixed(2)} / 4</small></div></li>`;
  }).join('')}</ol>`;
}

function renderDimension(result, relativeTop) {
  const width = Math.max(0, Math.min(100, (result.raw / 4) * 100));
  return `
    <article class="dimension-card">
      <div class="dimension-heading">
        <div><span class="dimension-code">${result.code}</span><h3>${result.name}</h3></div>
        <div class="dimension-score"><strong>${result.raw.toFixed(2)}</strong><span>/ 4</span></div>
      </div>
      <div class="score-track" aria-label="${result.name}本次自评均分 ${result.raw.toFixed(2)}，满分4分"><span style="width:${width}%;background:${result.color}"></span></div>
      ${relativeTop ? '<p class="relative-flag">本次九维结果中相对靠前</p>' : ''}
      <p>${result.description}</p>
    </article>`;
}

function roundedCanvasRect(ctx, x, y, width, height, radius, fill) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}

function wrapCanvasText(ctx, text, x, y, maxWidth, lineHeight, maxLines = Infinity) {
  const lines = [];
  let line = '';
  for (const character of text) {
    if (ctx.measureText(line + character).width > maxWidth && line) {
      lines.push(line);
      line = character;
    } else {
      line += character;
    }
  }
  if (line) lines.push(line);
  const visible = lines.slice(0, maxLines);
  if (lines.length > maxLines) visible[maxLines - 1] = `${visible[maxLines - 1].slice(0, -1)}…`;
  visible.forEach((item, index) => ctx.fillText(item, x, y + index * lineHeight));
  return y + visible.length * lineHeight;
}

function drawCanvasRadar(ctx, results, cx, cy, radius) {
  const count = results.length;
  ctx.save();
  ctx.strokeStyle = '#d5dce8';
  ctx.lineWidth = 2;
  [.25, .5, .75, 1].forEach((level) => {
    ctx.beginPath();
    for (let index = 0; index < count; index += 1) {
      const point = radarPoint(index, level, count, cx, cy, radius);
      if (index === 0) ctx.moveTo(point.x, point.y);
      else ctx.lineTo(point.x, point.y);
    }
    ctx.closePath();
    ctx.stroke();
  });
  for (let index = 0; index < count; index += 1) {
    const point = radarPoint(index, 1, count, cx, cy, radius);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
  }
  ctx.beginPath();
  results.forEach((item, index) => {
    const point = radarPoint(index, item.raw / 4, count, cx, cy, radius);
    if (index === 0) ctx.moveTo(point.x, point.y);
    else ctx.lineTo(point.x, point.y);
  });
  ctx.closePath();
  ctx.fillStyle = 'rgba(4, 75, 181, .18)';
  ctx.strokeStyle = '#044bb5';
  ctx.lineWidth = 5;
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#044bb5';
  results.forEach((item, index) => {
    const point = radarPoint(index, item.raw / 4, count, cx, cy, radius);
    ctx.beginPath();
    ctx.arc(point.x, point.y, 7, 0, Math.PI * 2);
    ctx.fill();
  });
  const names = ['躯体', '强迫', '人际', '抑郁', '焦虑', '敌对', '恐怖', '偏执', '精神'];
  ctx.font = '600 30px "PingFang SC", "Microsoft YaHei", sans-serif';
  ctx.fillStyle = '#435574';
  names.forEach((name, index) => {
    const point = radarPoint(index, 1.22, count, cx, cy, radius);
    ctx.textAlign = point.x < cx - 10 ? 'right' : point.x > cx + 10 ? 'left' : 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(name, point.x, point.y);
  });
  ctx.restore();
}

function createReportCanvas(result, ranked) {
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 2200;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#edf0f5';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#0c1f3d';
  ctx.fillRect(0, 0, canvas.width, 255);
  ctx.fillStyle = '#bbff5c';
  ctx.font = '700 30px "PingFang SC", "Microsoft YaHei", sans-serif';
  ctx.fillText('近7天状态回顾', 72, 72);
  ctx.fillStyle = '#ffffff';
  ctx.font = '800 58px "PingFang SC", "Microsoft YaHei", sans-serif';
  ctx.fillText('心理困扰90项自评报告', 72, 142);
  ctx.fillStyle = 'rgba(255,255,255,.72)';
  ctx.font = '400 28px "PingFang SC", "Microsoft YaHei", sans-serif';
  ctx.fillText(`完成时间 ${formatReportDate(state.completedAt)}`, 72, 202);

  roundedCanvasRect(ctx, 60, 310, 960, 290, 34, '#ffffff');
  ctx.fillStyle = '#0c1f3d';
  ctx.font = '800 38px "PingFang SC", "Microsoft YaHei", sans-serif';
  ctx.fillText('本次自评摘要', 96, 375);
  const metrics = [
    ['GSI', result.gsi.toFixed(2), '总体均分 / 4'],
    ['PST', String(result.pst), '有困扰项目 / 90'],
    ['PSDI', result.psdi.toFixed(2), '阳性项目平均分']
  ];
  metrics.forEach(([label, value, note], index) => {
    const x = 96 + index * 302;
    ctx.fillStyle = '#044bb5';
    ctx.font = '800 25px "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.fillText(label, x, 440);
    ctx.fillStyle = '#0c1f3d';
    ctx.font = '800 54px "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.fillText(value, x, 505);
    ctx.fillStyle = '#627087';
    ctx.font = '400 22px "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.fillText(note, x, 548);
  });

  roundedCanvasRect(ctx, 60, 650, 960, 820, 34, '#ffffff');
  ctx.fillStyle = '#0c1f3d';
  ctx.font = '800 38px "PingFang SC", "Microsoft YaHei", sans-serif';
  ctx.fillText('九维原始均分', 96, 720);
  ctx.fillStyle = '#627087';
  ctx.font = '400 23px "PingFang SC", "Microsoft YaHei", sans-serif';
  ctx.fillText('越靠外表示本次报告的主观困扰强度越高', 96, 765);
  drawCanvasRadar(ctx, result.dimensionResults, 540, 1050, 245);
  const top = ranked.slice(0, 3);
  if (top.some((item) => item.raw > 0)) {
    top.forEach((item, index) => {
      const x = 112 + index * 300;
      ctx.fillStyle = '#044bb5';
      ctx.font = '700 24px "PingFang SC", "Microsoft YaHei", sans-serif';
      ctx.fillText(`0${index + 1}  ${item.name}`, x, 1390);
      ctx.fillStyle = '#0c1f3d';
      ctx.font = '800 34px "PingFang SC", "Microsoft YaHei", sans-serif';
      ctx.fillText(`${item.raw.toFixed(2)} / 4`, x, 1435);
    });
  } else {
    ctx.fillStyle = '#627087';
    ctx.font = '500 28px "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.fillText('本次九个维度均未报告相关困扰', 112, 1415);
  }

  roundedCanvasRect(ctx, 60, 1520, 960, 490, 34, '#ffffff');
  ctx.fillStyle = '#0c1f3d';
  ctx.font = '800 38px "PingFang SC", "Microsoft YaHei", sans-serif';
  ctx.fillText('从现在开始的三个小步骤', 96, 1590);
  const guidance = top.filter((item) => item.raw > 0).map((item) => dimensionGuidance[item.code]);
  const canvasSteps = guidance.length ? guidance : [
    { title: '维持基本生活节律', text: '继续保持相对规律的睡眠、进食和日常活动。' },
    { title: '定期做一次状态回顾', text: '观察情绪、身体和人际状态是否出现持续变化。' },
    { title: '需要时及时求助', text: '若之后的困扰开始影响生活，可以重新评估并考虑专业支持。' }
  ];
  canvasSteps.forEach((advice, index) => {
    const y = 1665 + index * 115;
    ctx.fillStyle = '#efffd8';
    ctx.beginPath();
    ctx.arc(116, y - 8, 28, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#044bb5';
    ctx.font = '800 22px "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(String(index + 1).padStart(2, '0'), 116, y);
    ctx.textAlign = 'left';
    ctx.fillStyle = '#0c1f3d';
    ctx.font = '700 27px "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.fillText(advice.title, 168, y - 15);
    ctx.fillStyle = '#627087';
    ctx.font = '400 21px "PingFang SC", "Microsoft YaHei", sans-serif';
    wrapCanvasText(ctx, advice.text, 168, y + 22, 760, 30, 2);
  });

  ctx.fillStyle = '#0c1f3d';
  ctx.font = '700 25px "PingFang SC", "Microsoft YaHei", sans-serif';
  ctx.fillText('请正确理解这份结果', 72, 2080);
  ctx.fillStyle = '#627087';
  ctx.font = '400 20px "PingFang SC", "Microsoft YaHei", sans-serif';
  wrapCanvasText(ctx, '本报告展示的是本次自评原始分和个人内部相对排序，不代表临床异常，也不能替代专业心理、精神科或医疗评估。', 72, 2120, 920, 31, 3);
  return canvas;
}

function showReportImagePreview(blob, filename) {
  const url = URL.createObjectURL(blob);
  supportSheet.hidden = false;
  supportSheet.innerHTML = `
    <div class="sheet-backdrop" data-close-report></div>
    <section class="sheet-card report-preview-sheet" role="dialog" aria-modal="true" aria-labelledby="report-preview-title">
      <p class="section-kicker">结果长图已生成</p>
      <h2 id="report-preview-title">长按图片保存到手机</h2>
      <p>也可以点击下方按钮下载PNG原图。图片只在当前浏览器生成，不会上传。</p>
      <img class="report-preview-image" src="${url}" alt="本次心理困扰90项自评结果长图" />
      <a class="primary-button report-download-link" href="${url}" download="${filename}">下载PNG原图</a>
      <button class="secondary-button" id="close-report-preview" type="button">关闭预览</button>
    </section>`;
  const close = () => {
    supportSheet.hidden = true;
    supportSheet.replaceChildren();
    URL.revokeObjectURL(url);
  };
  document.querySelector('#close-report-preview')?.addEventListener('click', close);
  document.querySelector('[data-close-report]')?.addEventListener('click', close);
  document.querySelector('#close-report-preview')?.focus();
}

async function saveReportImage(result, ranked, button) {
  const original = button.textContent;
  button.disabled = true;
  button.textContent = '正在生成…';
  try {
    const canvas = createReportCanvas(result, ranked);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png', 1));
    if (!blob) throw new Error('无法生成图片');
    const filename = `心理困扰90项自评-${new Date(state.completedAt).toISOString().slice(0, 10)}.png`;
    showReportImagePreview(blob, filename);
    button.textContent = '结果长图已生成';
  } catch (error) {
    button.textContent = '生成失败，请重试';
  } finally {
    button.disabled = false;
    window.setTimeout(() => { button.textContent = original; }, 2200);
  }
}

function renderScoreTable(ranked) {
  return `
    <div class="score-table-wrap">
      <table class="score-table">
        <thead><tr><th>排序</th><th>维度</th><th>均分</th><th>本次位置</th></tr></thead>
        <tbody>${ranked.map((item, index) => `
          <tr><td>${String(index + 1).padStart(2, '0')}</td><td>${item.name}</td><td><strong>${item.raw.toFixed(2)}</strong> / 4</td><td>${index < 3 && item.raw > 0 ? '<span>相对靠前</span>' : '—'}</td></tr>`).join('')}</tbody>
      </table>
    </div>`;
}

function showResults() {
  if (state.answers.some((value) => value === null)) {
    state.current = state.answers.findIndex((value) => value === null);
    renderQuestion();
    setView('question');
    return;
  }
  state.completedAt ||= new Date().toISOString();
  const result = calculateResults();
  const ranked = [...result.dimensionResults].sort((a, b) => b.raw - a.raw);
  const topCodes = new Set(ranked.slice(0, 3).filter((item) => item.raw > 0).map((item) => item.code));
  const topNames = ranked.slice(0, 3).filter((item) => item.raw > 0).map((item) => item.name);
  const previous = getHistory().find((item) => item.createdAt !== state.completedAt);
  const riskCard = result.riskScore > 0 ? `
    <section class="result-card risk-card"><p class="section-kicker">优先关注</p><h2>${result.riskScore >= 2 ? '建议尽快寻求支持' : '请额外关注自伤或轻生相关想法'}</h2><p>${result.riskScore >= 2 ? '这项结果需要优先于普通分数处理。如果相关想法仍存在、越来越强烈或已经出现具体计划，请立即联系可信赖的人陪伴，并尽快联系当地紧急医疗服务、危机干预资源或精神科专业人员。' : '如果这类想法持续、增强或开始影响安全，请尽快告诉可信赖的人，并考虑联系专业心理或精神科支持。'}</p></section>` : '';

  resultView.innerHTML = `
    ${riskCard}
    <section class="result-card result-hero">
      <div class="report-meta"><p class="section-kicker">你的本次自评摘要</p><span>${formatReportDate(state.completedAt)}</span></div>
      <h2>过去7天的主观困扰画像</h2>
      <p class="result-intro">${topNames.length ? `在九个维度中，${topNames.join('、')}的原始均分相对靠前。这里展示的是个人本次结果的相对排序，不代表临床异常。` : '你在本次90项自评中没有报告相关困扰。若实际感受与结果不一致，可在状态变化后重新评估。'}</p>
      <div class="metric-grid"><div><span>GSI</span><strong>${result.gsi.toFixed(2)}</strong><small>总体均分 / 4</small></div><div><span>PST</span><strong>${result.pst}</strong><small>有困扰项目 / 90</small></div><div><span>PSDI</span><strong>${result.psdi.toFixed(2)}</strong><small>阳性项目平均分</small></div></div>
      <div class="no-norm-note"><strong>为什么没有T分？</strong><p>这套原创量表尚未建立正式常模，因此只展示可核算的原始分。网站不会用伪造T分判断“正常、异常或确诊”。</p></div>
    </section>
    <section class="result-card radar-card">
      <div class="section-heading"><div><p class="section-kicker">结果总览</p><h2>九维困扰画像</h2></div><span class="range-key">0 — 4</span></div>
      <p>雷达图只表示本次九个维度之间的相对分布。越靠外，表示你在该维度报告的主观困扰越多。</p>
      <div class="radar-layout">
        <div class="radar-frame">${makeRadarSvg(result.dimensionResults)}</div>
        <div class="radar-summary"><span>本次相对靠前</span>${renderTopDimensions(ranked)}</div>
      </div>
    </section>
    <section class="result-card score-table-card">
      <div class="section-heading"><div><p class="section-kicker">九维明细</p><h2>原始均分与内部排序</h2></div><span class="range-key">非临床排名</span></div>
      ${renderScoreTable(ranked)}
    </section>
    <section class="result-card">
      <div class="section-heading"><div><p class="section-kicker">维度解读</p><h2>每一项分数代表什么</h2></div><span class="range-key">详细报告</span></div>
      <div class="dimension-list">${result.dimensionResults.map((item) => renderDimension(item, topCodes.has(item.code))).join('')}</div>
    </section>
    <section class="result-card action-card">
      <p class="section-kicker">个性化行动建议</p><h2>从三个可执行的小步骤开始</h2>
      <p>建议根据本次相对靠前的维度生成，不是治疗方案。选择其中一个最容易做到的步骤即可。</p>
      ${renderRecommendations(ranked)}
    </section>
    ${renderTrend(previous, result)}
    <section class="result-card">
      <p class="section-kicker">附加观察</p><h2>睡眠、饮食与其他体验</h2>
      <div class="additional-list">${additionalItems.map((item) => `<div><span>${item.label}</span><strong>${state.answers[item.number - 1]} · ${optionLabels[state.answers[item.number - 1]]}</strong></div>`).join('')}</div>
    </section>
    <section class="result-card guidance-card">
      <p class="section-kicker">如何看待结果</p><h2>它是一份线索，不是一张诊断书</h2>
      <p>结果只反映你过去7天的主观心理和身体困扰体验。单个维度分数较高不代表患有对应疾病。若困扰持续存在、明显影响生活，或出现自伤、自杀等安全风险，请及时寻求专业心理、精神科或医疗支持。</p>
      <div class="report-actions">
        <button id="save-image-button" class="primary-button" type="button">查看并保存结果长图</button>
        <button id="save-history-button" class="secondary-button" type="button">保存到本机作前后测</button>
        <button id="print-report-button" class="secondary-button" type="button">打印或存为PDF</button>
      </div>
      <p id="history-feedback" class="history-feedback" aria-live="polite">本机记录由你主动保存，最多保留5次，不会上传。</p>
      ${getHistory().length ? '<button id="clear-history-button" class="clear-history-button" type="button">清除本机前后测记录</button>' : ''}
      <button id="restart-button" class="secondary-button" type="button">重新作答</button>
    </section>`;
  document.querySelector('#save-image-button')?.addEventListener('click', (event) => saveReportImage(result, ranked, event.currentTarget));
  document.querySelector('#print-report-button')?.addEventListener('click', () => window.print());
  document.querySelector('#save-history-button')?.addEventListener('click', (event) => {
    saveResultHistory(result);
    event.currentTarget.disabled = true;
    event.currentTarget.textContent = '本次记录已保存';
    const feedback = document.querySelector('#history-feedback');
    if (feedback) feedback.textContent = '已保存到这个浏览器。下一次完成测评后会自动显示对比。';
  });
  document.querySelector('#clear-history-button')?.addEventListener('click', () => {
    localStorage.removeItem(RESULT_HISTORY_KEY);
    const feedback = document.querySelector('#history-feedback');
    if (feedback) feedback.textContent = '本机前后测记录已清除。';
    document.querySelector('#clear-history-button')?.remove();
  });
  document.querySelector('#restart-button')?.addEventListener('click', () => {
    consent.checked = true;
    startButton.disabled = false;
    startButton.textContent = '开始测试';
    startAssessment({ reset: true });
  });
  setView('result');
}

consent.addEventListener('change', () => { startButton.disabled = !consent.checked; });
startButton.addEventListener('click', () => {
  if (isAuthorized || storageGet(sessionStorage, AUTH_SESSION_KEY) === '1') {
    isAuthorized = true;
    startAssessment();
    return;
  }
  openAuthorization();
});
backButton.addEventListener('click', () => {
  cancelPendingAdvance();
  if (state.current > 0) { state.current -= 1; renderQuestion(); }
});
exitButton.addEventListener('click', () => {
  cancelPendingAdvance();
  startButton.textContent = state.answers.some((answer) => answer !== null) ? '继续测试' : '开始测试';
  startButton.disabled = false;
  consent.checked = true;
  setView('start');
});
document.addEventListener('keydown', (event) => {
  if (!authGate.hidden) {
    if (event.key === 'Escape') closeAuthorization();
    return;
  }
  if (questionView.hidden || supportSheet.hidden === false) return;
  const score = Number(event.key);
  if (Number.isInteger(score) && score >= 0 && score <= 4) recordAnswer(score);
});

function registerWebMcpTools() {
  if (webMcpRegistered || sessionStorage.getItem(AUTH_SESSION_KEY) !== '1') return;
  const context = document.modelContext;
  if (!context?.registerTool) return;
  webMcpRegistered = true;
  const lifecycle = new AbortController();
  const register = (tool) => Promise.resolve(context.registerTool(tool, { signal: lifecycle.signal })).catch(() => {});
  register({ name: 'start_self_assessment', title: '开始心理困扰自评', description: '清空现有答案并从第1题开始90项自评。', inputSchema: { type: 'object', properties: {}, additionalProperties: false }, annotations: { readOnlyHint: false, untrustedContentHint: false }, execute() { consent.checked = true; startButton.disabled = false; startAssessment({ reset: true }); return { status: 'started', totalQuestions: questions.length }; } });
  register({
    name: 'answer_assessment_items', title: '批量填写自评答案', description: '填写一道或多道题的分数。题号为1到90，分数为0到4。',
    inputSchema: { type: 'object', properties: { answers: { type: 'array', minItems: 1, maxItems: 90, items: { type: 'object', properties: { question: { type: 'integer', minimum: 1, maximum: 90 }, score: { type: 'integer', minimum: 0, maximum: 4 } }, required: ['question', 'score'], additionalProperties: false } } }, required: ['answers'], additionalProperties: false },
    annotations: { readOnlyHint: false, untrustedContentHint: true },
    execute(input) {
      if (!Array.isArray(input?.answers) || input.answers.length === 0) throw new Error('answers不能为空');
      input.answers.forEach(({ question, score }) => { if (!Number.isInteger(question) || question < 1 || question > 90 || !Number.isInteger(score) || score < 0 || score > 4) throw new Error('题号或分数超出范围'); state.answers[question - 1] = score; });
      const firstUnanswered = state.answers.findIndex((value) => value === null);
      if (firstUnanswered >= 0) { state.current = firstUnanswered; renderQuestion(); setView('question'); }
      return { answered: state.answers.filter((value) => value !== null).length, remaining: state.answers.filter((value) => value === null).length };
    }
  });
  register({ name: 'get_assessment_progress', title: '读取自评进度', description: '读取当前已答题数、剩余题数和当前题号，不返回具体答案。', inputSchema: { type: 'object', properties: {}, additionalProperties: false }, annotations: { readOnlyHint: true, untrustedContentHint: false }, execute() { const answered = state.answers.filter((value) => value !== null).length; const remaining = questions.length - answered; return { answered, remaining, currentQuestion: remaining === 0 ? null : state.current + 1 }; } });
  register({ name: 'complete_self_assessment', title: '完成并查看自评结果', description: '在90题全部作答后计算原始分并打开结果页。', inputSchema: { type: 'object', properties: {}, additionalProperties: false }, annotations: { readOnlyHint: false, untrustedContentHint: false }, execute() { const missing = state.answers.filter((value) => value === null).length; if (missing > 0) throw new Error(`仍有${missing}题未作答`); showResults(); const result = calculateResults(); return { status: 'completed', gsi: Number(result.gsi.toFixed(2)), pst: result.pst, psdi: Number(result.psdi.toFixed(2)), riskNotice: result.riskScore > 0 }; } });
}

async function initializeAuthorization() {
  if (!AUTH_API_BASE) {
    if (storageGet(sessionStorage, AUTH_SESSION_KEY) === '1') markAuthorized();
    return;
  }

  authNote.textContent = '每个授权码首次使用后绑定当前浏览器；更换设备请联系售后换绑。';
  const token = storageGet(localStorage, LICENSE_TOKEN_KEY);
  if (!token) return;

  authSubmit.disabled = true;
  try {
    await licenseRequest('/api/licenses/session', { token, deviceId: getDeviceId() });
    markAuthorized();
  } catch {
    storageRemove(localStorage, LICENSE_TOKEN_KEY);
    storageRemove(sessionStorage, AUTH_SESSION_KEY);
    authSubmit.disabled = false;
    authFeedback.textContent = '授权已失效，请重新输入授权码。';
  }
}

initializeAuthorization();
