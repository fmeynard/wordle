const fs = require('fs');
const prompt = require('prompt-sync')({sigint: true});
const cliProgress = require('cli-progress');

function countLettersDic(str) {
    let dic = {};
    for(let i=0; i<5;i++) {
        dic[str[i]] = typeof dic[str[i]] == 'undefined' ? 1 : dic[str[i]]+1;
    }

    return dic;
}

function getGuessScore (word, guess) {
    let score = '';
    let toFind = countLettersDic(word);

    for(let i=0; i<5;i++) {
        let letter = guess[i];
        if (letter === word[i]) {
            score += 2;
            toFind[letter]--;
            continue;
        }

        if (word.indexOf(letter) < 0) {
            score += 0;
            continue;
        }

        if (toFind[letter] > 0) {
            score += 1;
            toFind[letter]--;
        } else {
            score += 0;
        }
    }

    return score;
};


function getMatrix(words, initialGuess = null) {
    let patternsMatrix = {};

    const bar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
    let x=0;
    bar.start(words.length, 0);
    let guessScoreSet = new Set();
    const guesses = initialGuess === null ? words : [initialGuess];
    for (let word of words) {
        for (let guess of guesses) {
            const score = getGuessScore(word, guess);
            const key = guess + '_' + score;
            if (!guessScoreSet.has(key)) {
                guessScoreSet.add(key);
                patternsMatrix[key] = [word];
            } else {
                patternsMatrix[key].push(word);
            }
        }

        bar.update(++x);
    }
    bar.stop();

    return patternsMatrix;
}

function getAllWords(filePath) {
    return fs
        .readFileSync(filePath, {encoding:'utf8', flag:'r'})
        .split("\n")
        .map(s => s.trim());
}

function getInitialMatrix(filePath, initialGuess = null) {
    if (null !== initialGuess) {
        return getMatrix(getAllWords(filePath), initialGuess);
    }

    return getMatrix(getAllWords(filePath));
}

function getResults(patternsMatrix) {
    let ranks = [];
    for (let key in patternsMatrix) {
        let [guess,] = key.split('_');

        if (!ranks.hasOwnProperty(guess)) {
            ranks[guess] = {
                words:  patternsMatrix[key].length,
                count: 1
            }
        } else {
            ranks[guess]['words'] += patternsMatrix[key].length;
            ranks[guess]['count']++;
        }
    }

    return Object.keys(ranks)
        .map(guess => { return { guess, score: ranks[guess]['words']/ranks[guess]['count'] }; })
        .sort((a,b) => a.score - b.score)
        .slice(0, 10);
}

async function play() {
    initialGuess = prompt('Initial guess :');
    if (initialGuess.length === 0) {
        initialGuess = null;
    }
    const initialMatrix = getInitialMatrix('./data/combined.txt', initialGuess);

    let matrix = initialMatrix;
    while (true) {
        console.table(getResults(matrix));

        word = prompt('Word :');
        if (word.length === 0) {
            console.log('reset game');
            matrix = initialMatrix;
            continue;
        }

        score = prompt('SCORE :');

        const key = word + '_' + score;
        if (typeof matrix[key] == 'undefined') {
            console.log('word not found', { word, score, key });

            continue;
        }

        matrix = getMatrix(matrix[key]);
    }
}

play();