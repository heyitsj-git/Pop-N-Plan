// Party confetti simulation
const shapes = document.querySelector('.floating-shapes');
for (let i = 0; i < 10; i++) {
  const confetti = document.createElement('div');
  confetti.classList.add('shape');
  confetti.style.width = `${Math.random()*20+10}px`;
  confetti.style.height = confetti.style.width;
  confetti.style.left = `${Math.random()*100}%`;
  confetti.style.top = `${Math.random()*100}%`;
  confetti.style.animationDuration = `${Math.random()*10+5}s`;
  shapes.appendChild(confetti);
}
