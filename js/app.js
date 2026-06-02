// Tab switching
const tabs = document.querySelectorAll('.tab');
const panels = document.querySelectorAll('.game-panel');

tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    const target = tab.dataset.game;

    tabs.forEach(t => {
      t.classList.remove('active');
      t.setAttribute('aria-selected', 'false');
    });
    panels.forEach(p => {
      p.classList.remove('active');
      p.hidden = true;
    });

    tab.classList.add('active');
    tab.setAttribute('aria-selected', 'true');

    const panel = document.getElementById(`panel-${target}`);
    panel.classList.add('active');
    panel.hidden = false;
  });
});
