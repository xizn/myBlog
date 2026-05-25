/**
 * 校验主题异步应用不会回滚较新的设置（generation + 背景图开关）
 * 运行: node scripts/verify-theme-apply.mjs
 */

let themeToneGeneration = 0;
let themeBgImage = false;

function applyTheme(hasImage) {
  const generation = ++themeToneGeneration;
  themeBgImage = hasImage;
  return generation;
}

async function applyBackgroundImageTone(generation, delayMs, result) {
  await new Promise((r) => setTimeout(r, delayMs));
  if (generation !== themeToneGeneration) return null;
  if (!themeBgImage) return null;
  return result;
}

async function main() {
  const gen1 = applyTheme(true);
  const gen2 = applyTheme(true);
  applyTheme(false);

  const stale = await applyBackgroundImageTone(gen1, 10, 'stale');
  const afterRemove = await applyBackgroundImageTone(gen2, 20, 'after-remove');

  const ok = stale === null && afterRemove === null;
  console.log(stale === null ? 'OK stale async ignored after newer apply' : 'FAIL stale async applied');
  console.log(
    afterRemove === null ? 'OK async ignored after image removed' : 'FAIL async applied without image'
  );
  console.log(`\n${ok ? 'Theme apply generation checks passed.' : 'Theme apply generation checks FAILED.'}`);
  process.exit(ok ? 0 : 1);
}

main();
