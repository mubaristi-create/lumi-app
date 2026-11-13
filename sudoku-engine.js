(function(root){
'use strict';
const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
function options(b,i){if(b[i])return [];const r=i/9|0,c=i%9;return [1,2,3,4,5,6,7,8,9].filter(n=>!b.some((v,j)=>v===n&&((j/9|0)===r||j%9===c||((j/27|0)===(r/3|0)&&(j%9/3|0)===(c/3|0)))))}
function count(b,limit=2){b=b.slice();let total=0;function visit(){let at=-1,opts;for(let i=0;i<81;i++)if(!b[i]){const o=options(b,i);if(!o.length)return;if(!opts||o.length<opts.length){at=i;opts=o;if(o.length===1)break}}if(at<0){total++;return}for(const n of opts){b[at]=n;visit();if(total>=limit)break}b[at]=0}visit();return total}
function singles(b){b=b.slice();let rounds=0;while(b.includes(0)){let moved=false;for(let i=0;i<81;i++)if(!b[i]){const o=options(b,i);if(o.length===1){b[i]=o[0];moved=true}}rounds++;if(!moved)return {solved:false,rounds}}return {solved:true,rounds}}
function generate(level){const groups=()=>shuffle([0,1,2]).flatMap(g=>shuffle([0,1,2]).map(x=>g*3+x));const rows=groups(),cols=groups(),digits=shuffle([1,2,3,4,5,6,7,8,9]);const solution=rows.flatMap(r=>cols.map(c=>digits[(r*3+(r/3|0)+c)%9]));const puzzle=solution.slice();const target={easy:54,medium:45,hard:36}[level];let clues=81;for(const i of shuffle([...Array(81).keys()])){if(clues<=target)break;const n=puzzle[i];puzzle[i]=0;if(count(puzzle)!==1||(level==='easy'&&!singles(puzzle).solved))puzzle[i]=n;else clues--}return {puzzle,solution,clues,rating:singles(puzzle).solved?'Tək namizəd üsulu':'Namizəd analizi və axtarış',level}}
function valid(b){return b.length===81&&b.every((n,i)=>Number.isInteger(n)&&n>=1&&n<=9&&options(b.map((v,j)=>j===i?0:v),i).includes(n))}
const api={options,count,singles,generate,valid};if(typeof module!=='undefined')module.exports=api;else root.Sudoku=api;
})(globalThis);
