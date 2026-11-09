// Shared articulated-body envelope and depth-sorted rope, projected into the 2D court.
import {cartoonRope} from './cartoon-art';
export function bodyDepthAt(x,y,{floor,scale,jump=0,kind=0}){
 const stretch=jump>0?1+.07*Math.sin(jump*Math.PI):1;
 const lx=(x-500)*stretch/scale,ly=(y-(floor-jump*92*scale))/(scale*stretch);
 const parts=[[0,-239,69,75,32],[0,-138,48,51,30],[-22,-51,20,43,18],[22,-51,20,43,18],[8,-1,60,19,23]];
 parts.push(kind===0?[-65,-289,87,69,34]:kind===2?[0,-297,84,42,30]:[0,-295,67,34,30]);
 let depth=0;for(const [cx,cy,rx,ry,rz] of parts){const d=((lx-cx)/rx)**2+((ly-cy)/ry)**2;if(d<1)depth=Math.max(depth,Math.sqrt(1-d)*rz*scale);}return depth;
}
export function ropeFrame(phase,{floor,scale,jump=0,kind=0},count=96){
 const curve=cartoonRope(phase,floor,scale),nodes=[];
 for(let i=0;i<=count;i++){
  const u=i/count,v=1-u,wx=v*v*curve.start[0]+2*v*u*curve.control[0]+u*u*curve.end[0],wy=v*v*curve.start[1]+2*v*u*curve.control[1]+u*u*curve.end[1];
  let z=-Math.sin(phase)*Math.sin(Math.PI*u)*(235*scale-8);
  nodes.push({x:wx+z*.25,y:wy+z*.20,z,wx,wy,u});
 }
 return nodes;
}
export function drawRopeLayer(c,nodes,front,color,time=0){
 let run=[];
 const paint=()=>{if(run.length<2)return;c.beginPath();c.moveTo(run[0].x,run[0].y);for(const p of run.slice(1))c.lineTo(p.x,p.y);c.lineCap='round';c.lineJoin='round';c.strokeStyle='#26313b';c.lineWidth=front?11:9;c.stroke();c.strokeStyle=color;c.lineWidth=front?7:5.5;c.stroke();c.save();c.setLineDash([3,10]);c.lineDashOffset=-time*18;c.strokeStyle='#fff4c4';c.lineWidth=1.4;c.stroke();c.restore();run=[];};
 for(let i=1;i<nodes.length;i++){const a=nodes[i-1],b=nodes[i],near=(a.z+b.z)/2>=0;if(near===front){if(!run.length)run.push(a);run.push(b);}else paint();}paint();
}
