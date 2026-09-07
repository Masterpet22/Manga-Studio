import test from'node:test';
import assert from'node:assert/strict';
import{readFile}from'node:fs/promises';

const html=await readFile(new URL('../src/index.html',import.meta.url),'utf8');
const css=await readFile(new URL('../src/styles.css',import.meta.url),'utf8');
const editor=await readFile(new URL('../src/editor.js',import.meta.url),'utf8');

test('provides the primary keyboard and assistive-technology landmarks',()=>{
  assert.match(html,/class="skip-link"[^>]+href="#editorMain"/);
  assert.match(html,/id="mangaCanvas"[^>]+tabindex="0"[^>]+aria-label=/);
  assert.match(html,/id="liveRegion"[^>]+role="status"[^>]+aria-live="polite"/);
  assert.match(html,/role="dialog"[^>]+aria-modal="true"/);
  assert.match(css,/:focus-visible/);
  assert.match(css,/@media\s*\(prefers-reduced-motion\s*:\s*reduce\)/);
});

test('keeps the heavyweight 3D editor off the initial critical path',()=>{
  assert.doesNotMatch(html,/src="poser3d\.js"/);
  assert.match(editor,/import\(moduleUrl\)/);
});

test('offers responsive workspace navigation and persistent preferences',()=>{
  assert.match(html,/class="mobile-dock"/);
  assert.match(html,/id="settingsModal"/);
  assert.match(editor,/PREFERENCES_KEY/);
  assert.match(editor,/data-workspace-view/);
});

test('exposes stable preferences and the v0.7.5 panel controls',()=>{
  assert.match(html,/class="preference-options" data-preference="density"/);
  assert.doesNotMatch(html,/id="densityPreference"/);
  assert.match(html,/id="panelEffectSelect"/);
  assert.match(html,/id="clipToPanel"/);
  assert.match(html,/id="modelYaw"/);
});
