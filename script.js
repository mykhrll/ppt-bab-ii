const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];
const icons = () => window.lucide?.createIcons?.();

document.addEventListener('DOMContentLoaded', () => {
  icons();
  const slides = $$('.slide');
  const progress = $('#progressBar');
  const count = $('#slideCount');
  const prev = $('#prevButton');
  const next = $('#nextButton');
  let current = 0;
  function showSlide(index) {
    current = Math.max(0, Math.min(slides.length - 1, index));
    slides.forEach((slide, i) => slide.classList.toggle('active', i === current));
    progress.style.width = `${100 * (current + 1) / slides.length}%`;
    count.textContent = `${current + 1} / ${slides.length}`;
    prev.disabled = current === 0;
    next.disabled = current === slides.length - 1;
    slides[current]?.scrollTo(0, 0);
  }
  prev.addEventListener('click', () => showSlide(current - 1));
  next.addEventListener('click', () => showSlide(current + 1));
  $('#startButton').addEventListener('click', () => showSlide(1));
  $('#conceptButton').addEventListener('click', () => showSlide(3));
  document.addEventListener('keydown', e => {
    if (e.target.matches('textarea,input,button,a')) return;
    if (e.key === 'ArrowRight') showSlide(current + 1);
    if (e.key === 'ArrowLeft') showSlide(current - 1);
  });

  const full = $('#fullscreenToggle');
  full.addEventListener('click', async () => {
    if (!document.fullscreenElement) await document.documentElement.requestFullscreen?.();
    else await document.exitFullscreen?.();
  });
  document.addEventListener('fullscreenchange', () => {
    full.innerHTML = `<i data-lucide="${document.fullscreenElement ? 'minimize' : 'maximize'}"></i>`;
    full.setAttribute('aria-label', document.fullscreenElement ? 'Keluar layar penuh' : 'Layar penuh'); icons();
  });

  let seconds = 900, timer = null;
  const timerDisplay = $('#timerDisplay'), timerButton = $('#timerToggle');
  function drawTimer() { timerDisplay.textContent = `${String(Math.floor(seconds / 60)).padStart(2,'0')}:${String(seconds % 60).padStart(2,'0')}`; }
  timerButton.addEventListener('click', () => {
    if (timer) { clearInterval(timer); timer = null; timerDisplay.classList.remove('timer-run'); timerButton.innerHTML = '<i data-lucide="play"></i>'; }
    else { timerDisplay.classList.add('timer-run'); timerButton.innerHTML = '<i data-lucide="pause"></i>'; timer = setInterval(() => { if (seconds > 0) { seconds--; drawTimer(); } else { clearInterval(timer); timer = null; timerDisplay.classList.remove('timer-run'); timerButton.innerHTML = '<i data-lucide="play"></i>'; } icons(); }, 1000); }
    icons();
  });
  drawTimer();

  const stack = [];
  const queue = [];
  function updateSim() {
    $('#stackState').textContent = `Isi stack (bawah → atas): ${stack.join(', ') || 'kosong'}`;
    $('#queueState').textContent = `Isi queue (depan → belakang): ${queue.join(', ') || 'kosong'}`;
  }
  $$('[data-sim]').forEach(button => button.addEventListener('click', () => {
    const mode = button.dataset.sim, op = button.dataset.op;
    const arr = mode === 'stack' ? stack : queue;
    const output = mode === 'stack' ? $('#stackOut') : $('#queueOut');
    if (op === 'reset') { arr.length = 0; output.textContent = 'Nilai keluar: —'; }
    else if (op === 'push4' || op === 'enq4') { arr.push(4); output.textContent = 'Nilai keluar: —'; }
    else if (op === 'push7' || op === 'enq7') { arr.push(7); output.textContent = 'Nilai keluar: —'; }
    else if (op === 'pop' || op === 'deq') { const value = mode === 'stack' ? arr.pop() : arr.shift(); output.textContent = `Nilai keluar: ${value ?? 'struktur kosong'}`; }
    updateSim();
  }));

  const cases = $$('.case-card');
  const caseAnswers = new Map();
  $$('.case-choice').forEach(button => button.addEventListener('click', () => {
    const card = button.closest('.case-card');
    const isCorrect = button.dataset.choice === card.dataset.correct;
    caseAnswers.set(card, isCorrect);
    $$('.case-choice', card).forEach(b => b.classList.toggle('selected', b === button));
    $('.case-feedback', card).textContent = isCorrect ? 'Tepat, cocokkan dengan urutan masuk dan keluar.' : 'Coba periksa lagi urutan datanya.';
    const box = $('#caseScore');
    if (caseAnswers.size === cases.length) {
      const score = [...caseAnswers.values()].filter(Boolean).length;
      box.hidden = false; box.textContent = `Hasil latihan: ${score} dari ${cases.length} kasus tepat.`;
    }
  }));

  const questions = $$('.question');
  let answers = Array(questions.length).fill(null), q = 0;
  const feedback = $('#quizFeedback'), scoreButton = $('#showScore'), scoreBox = $('#scoreBox');
  $$('.answer').forEach(button => button.addEventListener('click', () => {
    if (answers[q] !== null) return;
    const ok = button.dataset.correct === 'true'; answers[q] = ok;
    button.classList.add(ok ? 'correct' : 'wrong');
    $$('.answer', questions[q]).forEach(b => { b.disabled = true; if (b.dataset.correct === 'true') b.classList.add('correct'); });
    feedback.hidden = false; feedback.className = `feedback ${ok ? 'good' : 'warn'}`;
    feedback.textContent = ok ? 'Benar. Lanjut ke soal berikutnya.' : 'Belum tepat. Perhatikan jawaban yang ditandai hijau.';
    scoreButton.disabled = answers.some(a => a === null);
    const answered = q;
    setTimeout(() => { if (answered < questions.length - 1) { questions[answered].classList.remove('active-q'); q = answered + 1; questions[q].classList.add('active-q'); feedback.hidden = true; } }, 650);
  }));
  scoreButton.addEventListener('click', () => {
    if (answers.some(a => a === null)) return;
    const score = answers.filter(Boolean).length; scoreBox.classList.add('show');
    $('#scoreText').textContent = `Skor: ${score}/${questions.length}`;
    $('#followUp').textContent = score === questions.length ? 'Bagus. Terapkan LIFO dan FIFO pada kasus lain.' : 'Ulangi urutan data masuk dan keluar pada stack dan queue.';
    scoreBox.scrollIntoView({behavior:'smooth',block:'nearest'});
  });
  $('#resetQuiz').addEventListener('click', () => {
    answers = Array(questions.length).fill(null); q = 0; scoreButton.disabled = true;
    questions.forEach((question,i) => { question.classList.toggle('active-q',i===0); $$('.answer',question).forEach(b => { b.disabled=false; b.classList.remove('correct','wrong'); }); });
    feedback.hidden = true; scoreBox.classList.remove('show'); $('#scoreText').textContent=''; $('#followUp').textContent='';
  });
  showSlide(0);
});
