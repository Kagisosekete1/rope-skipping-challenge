import test from 'node:test';
import assert from 'node:assert/strict';
import {levelTheme,spectatorMotion} from '../src/themes.js';
test('themes follow ten-level groups and continue through unlimited tours',()=>{
 for(const n of [1,5,10])assert.equal(levelTheme(n).kind,'court');
 for(const n of [11,17,20])assert.equal(levelTheme(n).kind,'park');
 for(const n of [21,25,30])assert.equal(levelTheme(n).kind,'creche');
 assert.equal(levelTheme(31).kind,'beach');assert.equal(levelTheme(41).kind,'forest');assert.equal(levelTheme(51).kind,'night');
 assert.equal(levelTheme(61).kind,'court');assert.equal(levelTheme(61).tour,1);assert.notEqual(levelTheme(61).sky,levelTheme(1).sky);
 for(const n of [999,100000,9999999]){const theme=levelTheme(n);assert.ok(theme.start<=n&&theme.end>=n);assert.ok(theme.name);}
});
test('pedestrians face their actual travel direction and walk both ways',()=>{
 const directions=new Set();for(let i=0;i<4;i++){const a=spectatorMotion(i,1,1000),b=spectatorMotion(i,1.1,1000);assert.equal(Math.sign(b.x-a.x),a.direction);directions.add(a.direction);}assert.equal(directions.size,2);
});
