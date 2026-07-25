(() => {
  const controls = Array.from(document.querySelectorAll('[data-filter]'));
  const cards = Array.from(document.querySelectorAll('#insight-grid [data-topic]'));
  const empty = document.querySelector('#insight-empty');

  if (!controls.length || !cards.length) return;

  const applyFilter = (selected) => {
    let visible = 0;

    controls.forEach((control) => {
      const active = control.dataset.filter === selected;
      control.classList.toggle('is-active', active);
      control.setAttribute('aria-pressed', String(active));
    });

    cards.forEach((card) => {
      const show = selected === 'all' || card.dataset.topic === selected;
      card.hidden = !show;
      if (show) visible += 1;
    });

    if (empty) empty.hidden = visible > 0;
  };

  controls.forEach((control) => {
    control.addEventListener('click', () => applyFilter(control.dataset.filter));
  });
})();
