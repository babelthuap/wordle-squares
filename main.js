fetch('wordle_squares.txt').then(resp => resp.text()).then(wsData => {
  const squares = split(wsData, 25);
  solution.addEventListener('input', () => update(squares));
  hardmode.addEventListener('input', () => update(squares));
  asymmetric.addEventListener('input', () => update(squares));
  update(squares);
});

function update(squares) {
  const soln = solution.value.toUpperCase();
  if (soln.length !== 5) {
    output.innerText = 'Enter solution above';
    return;
  }
  const hardmodeOnly = Boolean(hardmode.checked);
  const asymmetricOnly = Boolean(asymmetric.checked);
  const validSquares = squares.filter(x => x.endsWith(soln))
                           .map(x => split(x, 5))
                           .filter(x => !hardmodeOnly || validHardmode(x))
                           .filter(x => !asymmetricOnly || isAsymmetric(x));
  if (validSquares.length === 0) {
    output.innerText = 'NO SOLUTIONS';
    return;
  }
  output.innerText = '';
  for (const square of validSquares) {
    const div = document.createElement('div');
    div.innerText = square.join(' ');
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
