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
const state = { current: 0, answers: Array(questions.length).fill(null) };
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

function startAssessment({ reset = false } = {}) {
  if (reset) {
    state.current = 0;
    state.answers.fill(null);
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
    button.className = `option-button${selected ? ' selected' : ''}`;
    button.setAttribute('role', 'radio');
    button.setAttribute('aria-checked', String(selected));
    button.innerHTML = `<span>${label}</span><span class="option-score">${score}</span>`;
    button.addEventListener('click', () => recordAnswer(score));
    options.append(button);
  });
}

function recordAnswer(score) {
  if (!Number.isInteger(score) || score < 0 || score > 4) return;
  state.answers[state.current] = score;
  renderQuestion();
  if (state.current === 32 && score > 0) {
    showImmediateSupport(score);
    return;
  }
  window.setTimeout(advance, 180);
}

function advance() {
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
  return { totalScore, pst, gsi, psdi, dimensionResults, riskScore: state.answers[32] };
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

function showResults() {
  if (state.answers.some((value) => value === null)) {
    state.current = state.answers.findIndex((value) => value === null);
    renderQuestion();
    setView('question');
    return;
  }
  const result = calculateResults();
  const ranked = [...result.dimensionResults].sort((a, b) => b.raw - a.raw);
  const topCodes = new Set(ranked.slice(0, 3).filter((item) => item.raw > 0).map((item) => item.code));
  const topNames = ranked.slice(0, 3).filter((item) => item.raw > 0).map((item) => item.name);
  const riskCard = result.riskScore > 0 ? `
    <section class="result-card risk-card"><p class="section-kicker">优先关注</p><h2>${result.riskScore >= 2 ? '建议尽快寻求支持' : '请额外关注自伤或轻生相关想法'}</h2><p>${result.riskScore >= 2 ? '这项结果需要优先于普通分数处理。如果相关想法仍存在、越来越强烈或已经出现具体计划，请立即联系可信赖的人陪伴，并尽快联系当地紧急医疗服务、危机干预资源或精神科专业人员。' : '如果这类想法持续、增强或开始影响安全，请尽快告诉可信赖的人，并考虑联系专业心理或精神科支持。'}</p></section>` : '';

  resultView.innerHTML = `
    ${riskCard}
    <section class="result-card result-hero">
      <p class="section-kicker">你的本次自评摘要</p><h2>过去7天的主观困扰画像</h2>
      <p class="result-intro">${topNames.length ? `在九个维度中，${topNames.join('、')}的原始均分相对靠前。这里展示的是个人本次结果的相对排序，不代表临床异常。` : '你在本次90项自评中没有报告相关困扰。若实际感受与结果不一致，可在状态变化后重新评估。'}</p>
      <div class="metric-grid"><div><span>GSI</span><strong>${result.gsi.toFixed(2)}</strong><small>总体均分 / 4</small></div><div><span>PST</span><strong>${result.pst}</strong><small>有困扰项目 / 90</small></div><div><span>PSDI</span><strong>${result.psdi.toFixed(2)}</strong><small>阳性项目平均分</small></div></div>
      <div class="no-norm-note"><strong>为什么没有T分？</strong><p>这套原创量表尚未建立正式常模，因此只展示可核算的原始分。网站不会用伪造T分判断“正常、异常或确诊”。</p></div>
    </section>
    <section class="result-card">
      <div class="section-heading"><div><p class="section-kicker">九维结果</p><h2>本次原始均分</h2></div><span class="range-key">0 — 4</span></div>
      <div class="dimension-list">${result.dimensionResults.map((item) => renderDimension(item, topCodes.has(item.code))).join('')}</div>
    </section>
    <section class="result-card">
      <p class="section-kicker">附加观察</p><h2>睡眠、饮食与其他体验</h2>
      <div class="additional-list">${additionalItems.map((item) => `<div><span>${item.label}</span><strong>${state.answers[item.number - 1]} · ${optionLabels[state.answers[item.number - 1]]}</strong></div>`).join('')}</div>
    </section>
    <section class="result-card guidance-card">
      <p class="section-kicker">如何看待结果</p><h2>它是一份线索，不是一张诊断书</h2>
      <p>结果只反映你过去7天的主观心理和身体困扰体验。单个维度分数较高不代表患有对应疾病。若困扰持续存在、明显影响生活，或出现自伤、自杀等安全风险，请及时寻求专业心理、精神科或医疗支持。</p>
      <button id="restart-button" class="secondary-button" type="button">重新作答</button>
    </section>`;
  document.querySelector('#restart-button')?.addEventListener('click', () => {
    consent.checked = true;
    startButton.disabled = false;
    startButton.textContent = '开始测评';
    startAssessment({ reset: true });
  });
  setView('result');
}

consent.addEventListener('change', () => { startButton.disabled = !consent.checked; });
startButton.addEventListener('click', () => startAssessment());
backButton.addEventListener('click', () => { if (state.current > 0) { state.current -= 1; renderQuestion(); } });
exitButton.addEventListener('click', () => {
  startButton.textContent = state.answers.some((answer) => answer !== null) ? '继续测评' : '开始测评';
  startButton.disabled = false;
  consent.checked = true;
  setView('start');
});
document.addEventListener('keydown', (event) => {
  if (questionView.hidden || supportSheet.hidden === false) return;
  const score = Number(event.key);
  if (Number.isInteger(score) && score >= 0 && score <= 4) recordAnswer(score);
});

function registerWebMcpTools() {
  const context = document.modelContext;
  if (!context?.registerTool) return;
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

registerWebMcpTools();
