fetch('wordle_squares.txt').then(resp => resp.text()).then(wsData => {
  const squares = split(wsData, 25);
  const validSolutions = [...new Set(squares.map(s => s.slice(-5)))].sort();

  const handleInput = (pushState = true) => update(squares, validSolutions, pushState);
  solution.addEventListener('input', handleInput);
  hardmode.addEventListener('input', handleInput);
  asymmetric.addEventListener('input', handleInput);
  handleInput();
  solution.focus();

  output.addEventListener('click', e => {
    if (e.target.nodeName !== 'A') {
      return;
    }
    e.preventDefault();
    solution.value = e.target.innerText;
    handleInput();
  });

  window.addEventListener("popstate", e => {
    const word = e.state && e.state.word;
    if (word && word.length === 5) {
      solution.value = word;
      handleInput(/* pushState= */ false);
    }
  });
});

function update(squares, validSolutions, pushState) {
  output.innerHTML = '';
  const soln = solution.value.toUpperCase();
  if (soln.length !== 5) {
    output.innerText = '<enter solution above>';
    return;
  }
  const hardmodeOnly = Boolean(hardmode.checked);
  const asymmetricOnly = Boolean(asymmetric.checked);
  const validSquares = squares.filter(x => x.endsWith(soln))
                           .map(x => split(x, 5))
                           .filter(x => !hardmodeOnly || validHardmode(x))
                           .filter(x => !asymmetricOnly || isAsymmetric(x));
  if (validSquares.length === 0) {
    output.innerHTML = '<p>NOT A VALID WORDLE SOLUTION</p>';
    console.time('closest');
    const closest =
        validSolutions.map(word => ({word, dist: wordDist(word, soln)}))
            .sort((a, b) => a.dist - b.dist)
            .slice(0, 4)
            .map(({word}) => word);
    console.timeEnd('closest');
    output.innerHTML += '<p><em>Did you mean:</em> ' +
        closest.map(w => `<a href>${w}</a>`).join(', ') + '</p>';
    return;
  }
  if (pushState) {
    modifyQueryParam('word', soln);
  }
  for (const square of validSquares) {
    const div = document.createElement('div');
    div.innerText = square.map(word => word.split('').join(' ')).join('\n');
    output.append(div);
  }
}

function split(str, wordLength) {
  const words = [];
  for (let i = 0; i < str.length; i += wordLength) {
    words.push(str.slice(i, i + wordLength));
  }
  return words;
}

function isAsymmetric(soln) {
  for (let i = 0; i < 5; i++) {
    let colWord = '';
    for (const rowWord of soln) {
      colWord += rowWord[i];
    }
    if (colWord !== soln[i]) {
      return true;
    }
  }
  return false;
}

function validHardmode(soln) {
  const final = soln[4];
  const match = [false, false, false, false, false];
  for (let i = 0; i < 4; i++) {
    const word = soln[i];
    for (let c = 0; c < 5; c++) {
      if (match[c] && (word[c] !== final[c])) {
        return false;
      }
      match[c] = (word[c] === final[c]);
    }
  }
  return true;
}

function modifyQueryParam(key, value) {
  const url = new URL(window.location.href);
  url.searchParams.set(key, value);
  window.history.pushState({[key]: value}, '', url.toString());
}

const KEY_COORDS = {
  Q: {x: 0, y: 0},
  W: {x: 1, y: 0},
  E: {x: 2, y: 0},
  R: {x: 3, y: 0},
  T: {x: 4, y: 0},
  Y: {x: 5, y: 0},
  U: {x: 6, y: 0},
  I: {x: 7, y: 0},
  O: {x: 8, y: 0},
  P: {x: 9, y: 0},
  '[': {x: 10, y: 2},
  '{': {x: 10, y: 2},
  A: {x: 0.25, y: 1},
  S: {x: 1.25, y: 1},
  D: {x: 2.25, y: 1},
  F: {x: 3.25, y: 1},
  G: {x: 4.25, y: 1},
  H: {x: 5.25, y: 1},
  J: {x: 6.25, y: 1},
  K: {x: 7.25, y: 1},
  L: {x: 8.25, y: 1},
  ';': {x: 9.25, y: 1},
  ':': {x: 9.25, y: 1},
  Z: {x: 0.75, y: 2},
  X: {x: 1.75, y: 2},
  C: {x: 2.75, y: 2},
  V: {x: 3.75, y: 2},
  B: {x: 4.75, y: 2},
  N: {x: 5.75, y: 2},
  M: {x: 6.75, y: 2},
  ',': {x: 7.75, y: 2},
  '<': {x: 7.75, y: 2},
  '.': {x: 8.75, y: 2},
  '>': {x: 8.75, y: 2},
};

function wordDist(a, b) {
  a = a.toUpperCase();
  b = b.toUpperCase();
  if (a === b) return 0;
  let dist = 0;
  for (let i = 0; i < 5; i++) {
    dist += charDist(a[i], b[i]);
  }
  return dist;
}

// Use the actual Euclidean metric because we wanna add these together
function charDist(c1, c2) {
  const coords1 = KEY_COORDS[c1];
  const coords2 = KEY_COORDS[c2];
  if (coords1 === undefined || coords2 === undefined) {
    // sqrt(1 + 1.5**2), i.e. the distance from the top row to the number row
    return 1.803;
  }
  return Math.sqrt((coords1.x - coords2.x) ** 2 + (coords1.y - coords2.y) ** 2);
}
