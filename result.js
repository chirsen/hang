/**
 * 读取单词文件， 按照单词长度分组，分组求最大频率字母
 */
const fs = require('fs');



module.exports = function () {
    let lenGroup = [];
    let data = fs.readFileSync("words.txt", 'utf8');
    let words = data.split("\r\n");


    for (let i = 0, len = words.length; i < len; i++) {
        let under = words[i].length;
        if (lenGroup[under] === undefined) {
            lenGroup[under] = {};
            lenGroup[under].words = [words[i]];
        } else {
            lenGroup[under].words.push(words[i]);
        }
        //获得对应长度的的单词数组，各个字母出现的频率
        [...new Set([...words[i]])].map(letter => {
            if (lenGroup[under][letter] === undefined) {
                lenGroup[under][letter] = 1;
            } else {
                lenGroup[under][letter] += 1;
            }
        });
    }
    /*返回一个[
        {
            words:[],
            frequency:[]
        },
    ]*/
    let resultGroup = [];
    lenGroup.map((item, index) => {
        let frequency = [];
        Object.keys(item).filter(pro => {
            return /[a-zA-Z]/.test(pro) && (pro.length === 1);
        }).map(letter => {
            frequency.push({
                letter: letter,
                times: item[letter]
            });
        });
        resultGroup[index] = {
            words: item.words,
            frequency: frequency.sort((a, b) => {
                return b.times - a.times;
            })
        };
    });
    
    return resultGroup;
}
