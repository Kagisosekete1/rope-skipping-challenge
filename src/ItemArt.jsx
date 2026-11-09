import React from 'react';
import {ITEMS,SKIN,COLORS} from './game';
const ink='#26313b';
function Portrait({skin,hair,style=0,kind=0}){
 return <>
 {kind===0&&(style===0?<path d="M60 49 C26 2 3 35 19 59 C-5 80 20 110 46 91 C16 76 56 71 60 49Z" fill={hair}/>:style===1?<path d="M64 45 C41 11 89 -9 108 19 Q121 40 97 48Z" fill={hair}/>:<><circle cx="38" cy="50" r="28" fill={hair}/><circle cx="139" cy="51" r="27" fill={hair}/></>)}
 {kind===2&&[-1,1].map(side=>[0,1,2].map(n=><ellipse key={side+':'+n} cx={90+side*54} cy={112+n*11} rx="9" ry="11" fill={hair}/>))}
 <ellipse cx="49" cy="84" rx="12" ry="16" fill={skin}/><ellipse cx="132" cy="84" rx="12" ry="16" fill={skin}/>
 <path d="M51 51 Q83 21 119 50 Q140 74 129 106 Q118 133 87 133 Q54 130 49 103 Q38 80 51 51Z" fill={skin}/>
 <path d="M47 82 C20 45 62 17 91 28 C125 17 147 47 133 81 L121 67 Q108 70 100 49 Q85 77 67 59 L53 82Z" fill={hair}/>
 <path d="M51 52 Q72 35 89 40 M100 38 Q125 40 129 56" fill="none" stroke="#b68b69" strokeWidth="2"/>
 {kind===1&&[0,1,2,3,4].map(n=><ellipse key={n} cx={51+n*19} cy={40-Math.sin(n)*4} rx="14" ry="15" fill={hair}/>)}
 {kind===2&&<><path d="M46 44 Q60 8 99 14 Q126 15 134 43Z" fill="#ffd867"/><path d="M45 44 Q83 33 142 45 Q158 55 139 57L46 53Z" fill="#ffd867"/></>}
 {[70,110].map((x,i)=><g key={x}><ellipse cx={x} cy="87" rx="18" ry="23" fill="#fffdf4"/><ellipse cx={x+3} cy="90" rx="10" ry="14" fill={['#59afd0','#73ad70','#9680ba'][kind]||'#59afd0'}/><ellipse cx={x+4} cy="91" rx="5" ry="9" fill={ink}/><circle cx={x+7} cy="85" r="3.5" fill="#fff" stroke="none"/><path d={`M${x-13} 60 Q${x} 52 ${x+11} 60`} fill="none" stroke={hair} strokeWidth="3"/></g>)}
 <path d="M87 99 Q99 91 102 102 Q96 108 87 102" fill={skin} strokeWidth="2"/>
 <path d="M68 111 Q91 127 116 108 Q108 136 84 129Z" fill="#753d41" strokeWidth="2"/><path d="M75 115 Q91 123 108 115 L102 122 L84 124Z" fill="#fffdf4" stroke="none"/>
 <ellipse cx="56" cy="107" rx="8" ry="4" fill="#e9957e" stroke="none"/><ellipse cx="125" cy="106" rx="8" ry="4" fill="#e9957e" stroke="none"/>
 {kind===0&&style===0&&<ellipse cx="52" cy="48" rx="10" ry="7" fill="#ef6ca1"/>}
 </>;
}
export default function ItemArt({category,item={},index=0,className='item-model',look={},label,kind=0}){
 const color=item.color||COLORS[look.outfit??0],hair=ITEMS.hair[category==='hair'?index:look.hair??0]?.color||'#4e2c20',skin=category==='skin'?SKIN[index]:SKIN[look.skin??2];
 return <svg className={className+' illustrated-item'} viewBox="0 0 180 150" role="img" aria-label={label||item.name||({skin:'Cartoon face',style:'Cartoon hairstyle'}[category])||'Cartoon item'} stroke={ink} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round">
 {['hair','skin','style'].includes(category)?<g transform="translate(4 10) scale(.94)"><Portrait kind={kind} hair={hair} skin={skin} style={category==='style'?index:look.style??0}/></g>:category==='outfit'?<>
 <path d="M57 36 Q90 17 123 36 L158 83 137 101 118 78 121 134 H59 L61 78 44 101 22 83Z" fill={color}/>
 <path d="M56 37 Q88 63 123 37 L111 16 Q91 2 69 17Z" fill={color}/><path d="M71 23 Q88 41 110 23 L102 14 Q90 9 78 17Z" fill="#37414a"/>
 <path d="M75 101 Q89 94 106 101 L105 122 H76Z" fill={color}/><path d="M90 55 V131 M68 48 Q62 61 62 76 M113 49 Q119 60 118 77 M30 82L45 94 M136 94L151 82 M62 126H118" fill="none" strokeWidth="2"/>
 <path d="M78 49L76 82 M102 49L105 81" stroke="#fff9e4" strokeWidth="4"/><path d="M70 102L76 110 M112 102L106 110" fill="none"/>
 <path d="M125 62L137 79 M48 63L37 78" stroke="#fff5d6" strokeWidth="2" opacity=".65"/>
 </>:category==='shoes'?<>
 <g transform="translate(18 2) scale(.88)"><path d="M29 38 L63 32 79 74 132 85 Q149 90 145 110 H26Z" fill={color}/><path d="M26 105H145 V120H26Z" fill="#fff9e4"/><path d="M40 39L47 75 75 91 M67 65L86 74 M50 53L73 48 M54 64L79 59 M59 76L84 70" fill="none" strokeWidth="2"/><path d="M49 52L72 49 M54 63L77 60 M59 74L83 71" stroke="#fff9e4" strokeWidth="4"/></g>
 <g transform="translate(17 27)"><path d="M29 38 L63 32 79 74 132 85 Q149 90 145 110 H26Z" fill={color}/><path d="M26 105H145 V120H26Z" fill="#fff9e4"/><path d="M38 37L45 76 76 91 M66 65L86 75" fill="none" strokeWidth="2"/><path d="M49 52L72 49 M54 63L77 60 M59 74L83 71" stroke="#fff9e4" strokeWidth="4"/><path d="M35 111 H138" stroke="#b0b9b5" strokeWidth="2"/><circle cx="100" cy="93" r="6" fill="#fff9e4" strokeWidth="2"/></g>
 </>:<>
 <ellipse cx="90" cy="62" rx="66" ry="43" fill="none" strokeWidth="11"/><ellipse cx="90" cy="62" rx="66" ry="43" fill="none" stroke={color} strokeWidth="6"/><ellipse cx="90" cy="62" rx="66" ry="43" fill="none" stroke="#fff6da" strokeWidth="2" strokeDasharray="3 11"/>
 <path d="M38 88L29 116 M143 88L153 117" fill="none" strokeWidth="5"/><path d="M29 108L20 137 M152 108L162 137" strokeWidth="15"/><path d="M29 108L20 137 M152 108L162 137" stroke={color} strokeWidth="10"/><path d="M24 113L32 116 M21 122L29 125 M151 116L158 113 M154 125L161 122" stroke="#fff5d8" strokeWidth="2"/>
 </>}
 </svg>;
}
