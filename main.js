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

// Based on my Android keyboard
const KEY_COORDS = {
  1: {x: 0, y: 0},
  2: {x: 1, y: 0},
  3: {x: 2, y: 0},
  4: {x: 3, y: 0},
  5: {x: 4, y: 0},
  6: {x: 5, y: 0},
  7: {x: 6, y: 0},
  8: {x: 7, y: 0},
  9: {x: 8, y: 0},
  0: {x: 9, y: 0},
  Q: {x: 0, y: 1.33},
  W: {x: 1, y: 1.33},
  E: {x: 2, y: 1.33},
  R: {x: 3, y: 1.33},
  T: {x: 4, y: 1.33},
  Y: {x: 5, y: 1.33},
  U: {x: 6, y: 1.33},
  I: {x: 7, y: 1.33},
  O: {x: 8, y: 1.33},
  P: {x: 9, y: 1.33},
  A: {x: 0.5, y: 2.71},
  S: {x: 1.5, y: 2.71},
  D: {x: 2.5, y: 2.71},
  F: {x: 3.5, y: 2.71},
  G: {x: 4.5, y: 2.71},
  H: {x: 5.5, y: 2.71},
  J: {x: 6.5, y: 2.71},
  K: {x: 7.5, y: 2.71},
  L: {x: 8.5, y: 2.71},
  Z: {x: 1.5, y: 4.08},
  X: {x: 2.5, y: 4.08},
  C: {x: 3.5, y: 4.08},
  V: {x: 4.5, y: 4.08},
  B: {x: 5.5, y: 4.08},
  N: {x: 6.5, y: 4.08},
  M: {x: 7.5, y: 4.08},
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
