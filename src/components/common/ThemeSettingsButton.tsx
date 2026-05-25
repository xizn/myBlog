import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
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

type SettingsTab = 'theme' | 'custom';

function ThemeSettingsHint({ title, children }: { title: string; children: ReactNode }) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!open || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const panelWidth = 220;
    let left = rect.right - panelWidth;
    const top = rect.bottom + 6;
    if (left < 16) left = 16;
    if (left + panelWidth > window.innerWidth - 16) {
      left = Math.max(16, window.innerWidth - 16 - panelWidth);
    }
    setPos({ top, left });
  }, [open]);

  return (
    <span
      className="theme-settings__hint"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setOpen(false);
      }}
    >
      <button
        ref={triggerRef}
        type="button"
        className="theme-settings__hint-trigger"
        aria-label={title}
        tabIndex={0}
      >
        ?
      </button>
      {open &&
        createPortal(
          <div
            className="theme-settings__hint-panel"
            role="tooltip"
            style={{ top: pos.top, left: pos.left }}
          >
            <div className="theme-settings__hint-body">{children}</div>
          </div>,
          document.body
        )}
    </span>
  );
}

/** 顶栏主题设置：主题配色 / 自定义背景图 */
export function ThemeSettingsButton() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<SettingsTab>('theme');
  const [draft, setDraft] = useState<ThemeSettings>(() => loadThemeSettings());
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const closeDialog = () => {
    applyThemeSettings(loadThemeSettings());
    setOpen(false);
  };

  const openDialog = () => {
    const saved = loadThemeSettings();
    setDraft(saved);
    setTab(saved.backgroundImage ? 'custom' : 'theme');
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
    setTab('theme');
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
      setTab('custom');
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

              <div className="theme-settings__tabs" role="tablist" aria-label="主题设置分类">
                <button
                  type="button"
                  role="tab"
                  id="theme-settings-tab-theme"
                  aria-selected={tab === 'theme'}
                  aria-controls="theme-settings-panel-theme"
                  className={`theme-settings__tab ${tab === 'theme' ? 'theme-settings__tab--active' : ''}`}
                  onClick={() => setTab('theme')}
                >
                  主题
                </button>
                <button
                  type="button"
                  role="tab"
                  id="theme-settings-tab-custom"
                  aria-selected={tab === 'custom'}
                  aria-controls="theme-settings-panel-custom"
                  className={`theme-settings__tab ${tab === 'custom' ? 'theme-settings__tab--active' : ''}`}
                  onClick={() => setTab('custom')}
                >
                  自定义
                </button>
              </div>

              {tab === 'theme' && (
                <div
                  id="theme-settings-panel-theme"
                  role="tabpanel"
                  aria-labelledby="theme-settings-tab-theme"
                  className="theme-settings__panel"
                >
                  <div className="theme-settings__presets">
                    <div className="theme-settings__section-head">
                      <span className="theme-settings__label">快捷配色</span>
                      <ThemeSettingsHint title="主题说明">
                        <p>预设背景色与光晕色；无背景图时文字对比度随主题自动调整。</p>
                      </ThemeSettingsHint>
                    </div>
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
                </div>
              )}

              {tab === 'custom' && (
                <div
                  id="theme-settings-panel-custom"
                  role="tabpanel"
                  aria-labelledby="theme-settings-tab-custom"
                  className="theme-settings__panel"
                >
                  <div className="theme-settings__image">
                    <div className="theme-settings__section-head">
                      <span className="theme-settings__label">背景图片（可选，≤2MB）</span>
                      <ThemeSettingsHint title="背景图说明">
                        <p>
                          上传后可调不透明度与编辑区样式；文字看不清时在下方切换浅色/深色字。
                        </p>
                      </ThemeSettingsHint>
                    </div>
                    <div className="theme-settings__image-actions">
                      <Button
                        type="button"
                        variant="outline"
                        className="theme-settings__pick-image"
                        onClick={() => fileRef.current?.click()}
                      >
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

                    {draft.backgroundImage ? (
                      <>
                        <label className="app-dialog-field theme-settings__opacity">
                          <span>背景图不透明度：{draft.backgroundImageOpacity}%</span>
                          <input
                            type="range"
                            min={0}
                            max={100}
                            value={draft.backgroundImageOpacity}
                            style={
                              {
                                '--range-pct': `${draft.backgroundImageOpacity}%`,
                              } as React.CSSProperties
                            }
                            onChange={(e) =>
                              applyDraft({
                                ...draft,
                                backgroundImageOpacity: Number(e.target.value),
                              })
                            }
                          />
                        </label>

                        <div className="theme-settings__surface">
                          <span className="theme-settings__label">编辑区表面</span>
                          <div className="theme-settings__surface-row" role="radiogroup" aria-label="编辑区表面">
                            <button
                              type="button"
                              role="radio"
                              aria-checked={draft.backgroundSurfaceMode === 'glass'}
                              className={`theme-settings__surface-option ${
                                draft.backgroundSurfaceMode === 'glass'
                                  ? 'theme-settings__surface-option--active'
                                  : ''
                              }`}
                              onClick={() => applyDraft({ ...draft, backgroundSurfaceMode: 'glass' })}
                            >
                              磨砂玻璃
                            </button>
                            <button
                              type="button"
                              role="radio"
                              aria-checked={draft.backgroundSurfaceMode === 'transparent'}
                              className={`theme-settings__surface-option ${
                                draft.backgroundSurfaceMode === 'transparent'
                                  ? 'theme-settings__surface-option--active'
                                  : ''
                              }`}
                              onClick={() =>
                                applyDraft({ ...draft, backgroundSurfaceMode: 'transparent' })
                              }
                            >
                              透明
                            </button>
                          </div>
                        </div>

                        <div className="theme-settings__surface">
                          <span className="theme-settings__label">背景图文字颜色</span>
                          <div
                            className="theme-settings__surface-row theme-settings__surface-row--3"
                            role="radiogroup"
                            aria-label="背景图文字颜色"
                          >
                            <button
                              type="button"
                              role="radio"
                              aria-checked={draft.backgroundImageTextMode === 'auto'}
                              className={`theme-settings__surface-option ${
                                draft.backgroundImageTextMode === 'auto'
                                  ? 'theme-settings__surface-option--active'
                                  : ''
                              }`}
                              onClick={() => applyDraft({ ...draft, backgroundImageTextMode: 'auto' })}
                            >
                              自动
                            </button>
                            <button
                              type="button"
                              role="radio"
                              aria-checked={draft.backgroundImageTextMode === 'light'}
                              className={`theme-settings__surface-option ${
                                draft.backgroundImageTextMode === 'light'
                                  ? 'theme-settings__surface-option--active'
                                  : ''
                              }`}
                              onClick={() => applyDraft({ ...draft, backgroundImageTextMode: 'light' })}
                            >
                              浅色字
                            </button>
                            <button
                              type="button"
                              role="radio"
                              aria-checked={draft.backgroundImageTextMode === 'dark'}
                              className={`theme-settings__surface-option ${
                                draft.backgroundImageTextMode === 'dark'
                                  ? 'theme-settings__surface-option--active'
                                  : ''
                              }`}
                              onClick={() => applyDraft({ ...draft, backgroundImageTextMode: 'dark' })}
                            >
                              深色字
                            </button>
                          </div>
                        </div>
                      </>
                    ) : (
                      <p className="theme-settings__empty-hint">尚未上传背景图，点击「选择图片」开始自定义。</p>
                    )}
                  </div>
                </div>
              )}

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
