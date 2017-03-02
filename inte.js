/**
 * 读取单词文件， 按照单词长度分组，分组求最大频率字母
 */
const fs = require('fs');
const fetch = require('node-fetch');
const getGroup = require('./result.js');
let lenGroup = getGroup();

function nextWord(id, total) {
    if (total === 80) {
        //查看分数
        let finalResult = fetch('https://strikingly-hangman.herokuapp.com/game/on', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'getResult',
                sessionId: id
            })
        });
        finalResult.then(res => res.json())
            .then(result => {
                //将分数和sessionId放进文件，再进行下一次游戏
                fs.appendFileSync('score.txt', JSON.stringify(result)+"\n");
                lenGroup = getGroup();
                aGame();
            }).catch(err => { console.log(err) });
        return;
    }

    let nextw = fetch('https://strikingly-hangman.herokuapp.com/game/on', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            action: 'nextWord',
            sessionId: id
        })
    });
    nextw.then(res => res.json())
        .then(response => {
            //拿到了一个单词，进行猜测
            let word = response.data.word;
            console.log(response);
            
            let letterArr = [].concat(lenGroup[word.length].frequency),
                wordArr = [].concat(lenGroup[word.length].words);
            guess(response, letterArr, wordArr);
        })
        .catch(err => {
            nextWord(id);
        });
}

function guess(response, letterArr, wordArr) {
    let id = response.sessionId,
        letter = letterArr[0].letter.toUpperCase();
    console.log(letter);
    if(letter === "*"){
        letter = letterArr.shift().letter;
    }
    let aTry = fetch('https://strikingly-hangman.herokuapp.com/game/on', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            action: 'guessWord',
            sessionId: id,
            guess: letter
        })
    });
    aTry.then(resp => resp.json()).then(res => {
        let guessData = res.data,
            total = guessData.totalWordCount;
        console.log(guessData.word);
        letterArr.shift();
        //如果单词猜对了或者猜错量到上限，猜下一个单词
        if (guessData.word.indexOf("*") === -1 || guessData.wrongGuessCountOfCurrentWord >= 10 || letterArr.length === 0) {
            if (wordArr.length === 0) {
                learnWord(guessData.word);
            }
            nextWord(id, total);
        } else {
            //如果还没全猜对，猜下一个字母
            if (guessData.word.indexOf(letter) !== -1) {
                //猜对一个单词,缩小一下范围
                let changeArr = arrFilter(guessData.word, letterArr, wordArr);
                letterArr = changeArr.frequency;
                wordArr = changeArr.words;
            }
            guess(res, letterArr, wordArr);
        }
    }).catch(err => {
        guess(response, letterArr, wordArr);
    });
}

function arrFilter(word, letterArr, wordArr) {
    //在wordArr中匹配
    let reg2 = "[^" + [...new Set([...word].filter(item => item !== "*"))].join("") + "]";
    let str = [...word].map(item => {
        return item === "*" ? reg2 : item;
    }).join("");
    let reg = new RegExp("^" + str + "$", "i");

    let words = wordArr.filter(item => {
        reg.lastIndex = 0;
        return reg.test(item);
        console.log(reg.lastIndex);
    });
    console.log(words);
    console.log(reg);
    let letterHash = {};
    letterArr = letterArr.map((item) => {
        letterHash[item.letter] = 0;
    });
    words.map(item => {
        [...new Set([...item])].map(letter => {
            (letterHash[letter] !== undefined) && letterHash[letter]++;
        });
    });
    let frequency = [];
    //转化为数组
    Object.keys(letterHash).map(letter => {
        frequency.push({
            letter,
            times: letterHash[letter]
        });
    });
    frequency = frequency.sort((a, b) => {
        return b.times - a.times;
    });
    return { words, frequency };
}

//学习能力,学习词库中不存在的单词
function learnWord(str) {
    let word = str.toLowerCase(),
        len = str.length;
    console.log("学习" + word);
    //检查文本中是否存在这个单词，如果存在，不管，如果不存在，插入到文本末尾
    let flag = lenGroup[len].words.some(item => {
        return item === word;
    });
    if (!flag) {
        fs.appendFileSync('words.txt', "\r\n" + word);
    }
}

function aGame() {
    let start = fetch('https://strikingly-hangman.herokuapp.com/game/on', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            action: 'startGame',
            playerId: 'playerId' //游戏ID私信获取：w1020269294 (微信)
        })
    });

    start.then(res => res.json())
        .then(json => json.sessionId)
        .then(id => {
            //拿到sessessionId
            nextWord(id, 0);
        })
}
aGame();