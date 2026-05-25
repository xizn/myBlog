import { useRef, useState } from 'react';
import { Button } from '@/components/common/Button';
import { DialogPortal } from '@/components/common/DialogPortal';
import {
  DEFAULT_THEME,
  THEME_PRESETS,
  applyThemeSettings,
  loadThemeSettings,
  saveThemeSettings,
  toColorInputHex,
} from '@/utils/themeSettings';
import type { ThemeSettings } from '@/types/themeSettings';
import './ThemeSettingsButton.css';
import '@/styles/app-dialog.css';

const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

/** 顶栏主题设置：背景色、鼠标光晕色、背景图与不透明度 */
export function ThemeSettingsButton() {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<ThemeSettings>(() => loadThemeSettings());
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const closeDialog = () => {
    applyThemeSettings(loadThemeSettings());
    setOpen(false);
  };

  const openDialog = () => {
    setDraft(loadThemeSettings());
    setError('');
    setOpen(true);
  };

  const applyDraft = (next: ThemeSettings) => {
    setDraft(next);
    applyThemeSettings(next);
  };

  const handleSave = () => {
    setError('');
    try {
      saveThemeSettings(draft);
      applyThemeSettings(draft);
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败');
    }
  };

  const handleReset = () => {
    applyDraft({ ...DEFAULT_THEME });
  };

  const handleImageFile = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('请选择图片文件');
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError('图片请小于 2MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === 'string' ? reader.result : '';
      applyDraft({ ...draft, backgroundImage: dataUrl });
      setError('');
    };
    reader.onerror = () => setError('读取图片失败');
    reader.readAsDataURL(file);
  };

  const bgColor = toColorInputHex(draft.backgroundColor, DEFAULT_THEME.backgroundColor);
  const glowColor = toColorInputHex(draft.glowColor, DEFAULT_THEME.glowColor);

  return (
    <>
      <button
        type="button"
        className="theme-settings-trigger"
        title="主题设置"
        aria-label="主题设置"
        onClick={openDialog}
      >
        主题
      </button>

      {open && (
        <DialogPortal>
          <div className="app-dialog" role="dialog" aria-modal="true" aria-labelledby="theme-settings-title">
            <div className="app-dialog__backdrop" onClick={closeDialog} />
            <div className="app-dialog__panel app-dialog__panel--wide theme-settings__box">
              <h3 id="theme-settings-title" className="app-dialog__title">
                主题设置
              </h3>
              <p className="app-dialog__hint">
                调整页面背景色与鼠标光晕颜色；可上传背景图并调节不透明度。设置会随背景明暗自动调整文字对比度。
              </p>

              <div className="theme-settings__presets">
                <span className="theme-settings__label">快捷配色</span>
                <div className="theme-settings__preset-row">
                  {THEME_PRESETS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      className="theme-settings__preset"
                      title={p.name}
                      style={{
                        background: `linear-gradient(135deg, ${p.backgroundColor} 50%, ${p.glowColor} 50%)`,
                      }}
                      onClick={() =>
                        applyDraft({
                          ...draft,
                          backgroundColor: p.backgroundColor,
                          glowColor: p.glowColor,
                        })
                      }
                    />
                  ))}
                </div>
              </div>

              <label className="app-dialog-field theme-settings__field">
                <span>背景颜色</span>
                <div className="theme-settings__color-row">
                  <input
                    type="color"
                    value={bgColor}
                    onChange={(e) => applyDraft({ ...draft, backgroundColor: e.target.value })}
                  />
                  <input
                    type="text"
                    value={draft.backgroundColor}
                    onChange={(e) => applyDraft({ ...draft, backgroundColor: e.target.value })}
                    spellCheck={false}
                  />
                </div>
              </label>

              <label className="app-dialog-field theme-settings__field">
                <span>鼠标光晕颜色</span>
                <div className="theme-settings__color-row">
                  <input
                    type="color"
                    value={glowColor}
                    onChange={(e) => applyDraft({ ...draft, glowColor: e.target.value })}
                  />
                  <input
                    type="text"
                    value={draft.glowColor}
                    onChange={(e) => applyDraft({ ...draft, glowColor: e.target.value })}
                    spellCheck={false}
                  />
                </div>
              </label>

              <div className="theme-settings__image">
                <span className="theme-settings__label">背景图片（可选，≤2MB）</span>
                <div className="theme-settings__image-actions">
                  <Button type="button" variant="outline" className="btn--sm" onClick={() => fileRef.current?.click()}>
                    选择图片
                  </Button>
                  {draft.backgroundImage && (
                    <Button
                      type="button"
                      variant="ghost"
                      className="btn--sm"
                      onClick={() => applyDraft({ ...draft, backgroundImage: '' })}
                    >
                      移除图片
                    </Button>
                  )}
                  <select
                    className="theme-settings__size-select"
                    value={draft.backgroundImageSize}
                    onChange={(e) =>
                      applyDraft({
                        ...draft,
                        backgroundImageSize: e.target.value as 'cover' | 'contain',
                      })
                    }
                    disabled={!draft.backgroundImage}
                  >
                    <option value="cover">铺满</option>
                    <option value="contain">完整显示</option>
                  </select>
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="theme-settings__file-input"
                  onChange={(e) => {
                    handleImageFile(e.target.files?.[0]);
                    e.target.value = '';
                  }}
                />
                {draft.backgroundImage && (
                  <>
                    <label className="app-dialog-field theme-settings__opacity">
                      <span>背景图不透明度：{draft.backgroundImageOpacity}%</span>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={draft.backgroundImageOpacity}
                        onChange={(e) =>
                          applyDraft({
                            ...draft,
                            backgroundImageOpacity: Number(e.target.value),
                          })
                        }
                      />
                    </label>
                    <div
                      className="theme-settings__preview"
                      style={{
                        backgroundImage: `url(${JSON.stringify(draft.backgroundImage)})`,
                        backgroundSize: draft.backgroundImageSize,
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat',
                        opacity: draft.backgroundImageOpacity / 100,
                      }}
                    />
                  </>
                )}
              </div>

              {error && (
                <p className="app-dialog__error" role="alert">
                  {error}
                </p>
              )}

              <div className="app-dialog__actions app-dialog__actions--spread">
                <Button type="button" variant="ghost" onClick={handleReset}>
                  恢复默认
                </Button>
                <Button type="button" variant="ghost" onClick={closeDialog}>
                  取消
                </Button>
                <Button type="button" variant="primary" onClick={handleSave}>
                  保存
                </Button>
              </div>
            </div>
          </div>
        </DialogPortal>
      )}
    </>
  );
}
