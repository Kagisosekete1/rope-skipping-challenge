const THEMES=[
 {kind:'court',name:'Neighbourhood Court',sky:'#82e0e8',ground:'#f49b88'},
 {kind:'park',name:'Playtime Park',sky:'#a6e3ec',ground:'#f0c686'},
 {kind:'creche',name:'Rainbow Crèche',sky:'#ffe5b1',ground:'#e5b4cf',indoor:true},
 {kind:'beach',name:'Seaside Promenade',sky:'#8ddfef',ground:'#f9d68e'},
 {kind:'forest',name:'Woodland Adventure',sky:'#b9dfbc',ground:'#c8b17a'},
 {kind:'night',name:'Starlight Playground',sky:'#273661',ground:'#9a90b9'},
];
export function levelTheme(level=1){
 const value=Math.max(1,Math.floor(Number.isFinite(Number(level))?Number(level):1)),group=Math.floor((value-1)/10),tour=Math.floor(group/THEMES.length);
 const theme=THEMES[group%THEMES.length];const variation=tour?{sky:`hsl(${(tour*137.508+group%6*35)%360} 48% ${theme.kind==='night'?23:82}%)`,ground:`hsl(${(tour*73.25+group%6*27)%360} 46% 76%)`}:{};return {...theme,...variation,tour,start:group*10+1,end:group*10+10,name:theme.name+(tour?' · Tour '+(tour+1):'')};
}
export function spectatorMotion(index,time,width){
 const direction=index%2===0?1:-1,speed=15+(index%3)*5,span=width+200,travel=((time*speed+index*293)%span+span)%span;
 return {x:direction===1?travel-100:width+100-travel,direction};
}
