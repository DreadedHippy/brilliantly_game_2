import { mentorLessons } from '../game/data/mentorLessons';

/** Manual carousel in the native modal top layer; no automatic advance or timer. */
export function mountMentorLesson(
  onOpen: () => void,
  onClose: () => void,
  onPractice: () => void,
) {
  const events = new AbortController();
  const dialog = document.createElement('dialog');
  dialog.className = 'mentor-lesson';
  dialog.setAttribute('aria-labelledby', 'mentor-name lesson-title');
  dialog.setAttribute('aria-describedby', 'lesson-line');
  dialog.innerHTML = `
    <header class="lesson-header"><div><p class="eyebrow">Lessons for the journey</p><h2 id="mentor-name">Arojinle</h2><p>Your mentor</p></div><button type="button" class="secondary lesson-close">Close lesson</button></header>
    <div class="lesson-layout">
      <figure class="lesson-portrait"><img src="${import.meta.env.BASE_URL}assets/sprites/tutorial-elder/master.png" alt="Arojinle, the seated elder with a carved staff and patterned robes" width="1024" height="1024"><figcaption>“Prepare well, traveller.”</figcaption></figure>
      <section class="lesson-copy" aria-roledescription="carousel" aria-label="Battle basics">
        <p class="eyebrow" id="lesson-count" aria-live="polite" aria-atomic="true"></p>
        <h3 id="lesson-title" tabindex="-1"></h3><p id="lesson-line"></p><p class="lesson-reminder"></p>
      </section>
    </div>
    <footer class="lesson-footer"><nav class="lesson-dots" aria-label="Choose a lesson"></nav><div class="lesson-actions"><button type="button" class="secondary lesson-back">Back</button><button type="button" class="primary lesson-next">Next</button></div></footer>`;
  document.body.append(dialog);
  const element = <T extends HTMLElement>(selector: string): T => {
    const found = dialog.querySelector<T>(selector);
    if (!found) throw new Error(`Missing lesson element: ${selector}`);
    return found;
  };
  let index = 0;
  let startPractice = false;
  let trigger: HTMLElement | null = null;
  const listen = { signal: events.signal };
  const title = element<HTMLHeadingElement>('#lesson-title');
  const back = element<HTMLButtonElement>('.lesson-back');
  const next = element<HTMLButtonElement>('.lesson-next');
  const dots = mentorLessons.map((lesson, position) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.setAttribute(
      'aria-label',
      `Lesson ${position + 1}: ${lesson.title}`,
    );
    button.addEventListener('click', () => render(position), listen);
    element('.lesson-dots').append(button);
    return button;
  });
  function render(position: number): void {
    index = Math.max(0, Math.min(mentorLessons.length - 1, position));
    const lesson = mentorLessons[index]!;
    dialog.dataset.lesson = lesson.id;
    element('#lesson-count').textContent =
      `Lesson ${index + 1} of ${mentorLessons.length}`;
    title.textContent = lesson.title;
    element('#lesson-line').textContent = lesson.line;
    element('.lesson-reminder').textContent = lesson.reminder;
    element('.lesson-layout').scrollTop = 0;
    back.disabled = index === 0;
    next.textContent =
      index === mentorLessons.length - 1 ? 'Practice with Arojinle' : 'Next';
    dots.forEach((dot, position) => {
      if (position === index) dot.setAttribute('aria-current', 'step');
      else dot.removeAttribute('aria-current');
    });
    if (dialog.open) title.focus({ preventScroll: true });
  }
  back.addEventListener('click', () => render(index - 1), listen);
  next.addEventListener(
    'click',
    () => {
      if (index === mentorLessons.length - 1) {
        startPractice = true;
        dialog.close();
      } else render(index + 1);
    },
    listen,
  );
  element('.lesson-close').addEventListener(
    'click',
    () => dialog.close(),
    listen,
  );
  dialog.addEventListener(
    'keydown',
    (event) => {
      if (event.key === 'Tab') {
        const controls = [
          ...dialog.querySelectorAll<HTMLButtonElement>(
            'button:not(:disabled)',
          ),
        ];
        const first = controls[0]!,
          last = controls[controls.length - 1]!;
        if (
          event.shiftKey &&
          (document.activeElement === first ||
            !controls.includes(document.activeElement as HTMLButtonElement))
        ) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
        return;
      }
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key))
        return;
      event.preventDefault();
      render(
        event.key === 'Home'
          ? 0
          : event.key === 'End'
            ? mentorLessons.length - 1
            : index + (event.key === 'ArrowRight' ? 1 : -1),
      );
    },
    listen,
  );
  dialog.addEventListener(
    'click',
    (event) => {
      const rect = dialog.getBoundingClientRect();
      if (
        event.target === dialog &&
        (event.clientX < rect.left ||
          event.clientX > rect.right ||
          event.clientY < rect.top ||
          event.clientY > rect.bottom)
      )
        dialog.close();
    },
    listen,
  );
  dialog.addEventListener(
    'close',
    () => {
      onClose();
      if (startPractice) {
        startPractice = false;
        onPractice();
      } else if (trigger?.isConnected) trigger.focus({ preventScroll: true });
    },
    listen,
  );
  return {
    open(): void {
      if (dialog.open) return;
      startPractice = false;
      trigger =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;
      onOpen();
      render(0);
      dialog.showModal();
      title.focus({ preventScroll: true });
    },
    destroy(): void {
      events.abort();
      if (dialog.open) dialog.close();
      dialog.remove();
    },
  };
}
