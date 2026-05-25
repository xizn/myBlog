import { useRef, useState } from 'react';
import { Button } from '@/components/common/Button';
import { DialogPortal } from '@/components/common/DialogPortal';
import { DEFAULT_AI_SETTINGS, hasAiApiKey, loadAiSettings, saveAiSettings } from '@/utils/aiSettings';
import {
  formatMarkdownWithAi,
  listMarkdownH2Titles,
  type AiChatMessage,
} from '@/utils/formatMarkdownWithAi';
import {
  addKnowledgeFile,
  listKnowledgeEntries,
  searchKnowledge,
  shouldQueryKnowledge,
} from '@/utils/knowledgeBase';
import type { AiSettings } from '@/types/aiSettings';
import './AiFormatButton.css';
import '@/styles/app-dialog.css';

interface AiFormatButtonProps {
  content: string;
  noteTitle?: string;
  disabled?: boolean;
  variant?: 'inline' | 'toolbar';
  onFormatted: (markdown: string) => void | Promise<void>;
}

/** 学习笔记正文：AI 整理为 Markdown（多轮对话 + 知识库） */
export function AiFormatButton({
  content,
  noteTitle,
  disabled,
  variant = 'inline',
  onFormatted,
}: AiFormatButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formatting, setFormatting] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [formatOpen, setFormatOpen] = useState(false);
  const [userInstructions, setUserInstructions] = useState('');
  const [targetSection, setTargetSection] = useState('');
  const [chatHistory, setChatHistory] = useState<AiChatMessage[]>([]);
  const [workingMarkdown, setWorkingMarkdown] = useState('');
  const [originalBackup, setOriginalBackup] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [draft, setDraft] = useState<AiSettings>(() => loadAiSettings());
  const [kbFiles, setKbFiles] = useState(() => listKnowledgeEntries());

  const sectionOptions = listMarkdownH2Titles(workingMarkdown || content);

  const openFormatDialog = () => {
    setError('');
    const raw = content.trim();
    if (!raw) {
      setError('请先输入正文内容');
      return;
    }

    const settings = loadAiSettings();
    if (!hasAiApiKey(settings)) {
      setDraft(settings);
      setSettingsOpen(true);
      return;
    }

    setUserInstructions('');
    setTargetSection('');
    setChatHistory([]);
    setWorkingMarkdown(raw);
    setKbFiles(listKnowledgeEntries());
    setFormatOpen(true);
  };

  const runFormat = async () => {
    setError('');
    const raw = (workingMarkdown || content).trim();
    if (!raw) {
      setError('请先输入正文内容');
      return;
    }

    const settings = loadAiSettings();
    if (!hasAiApiKey(settings)) {
      setDraft(settings);
      setSettingsOpen(true);
      setFormatOpen(false);
      return;
    }

    const instructions = userInstructions.trim();
    const useKb = shouldQueryKnowledge(instructions);
    const knowledgeContext = useKb ? searchKnowledge(instructions || raw).join('\n\n') : undefined;

    setFormatting(true);
    const backup = originalBackup ?? content;
    try {
      const markdown = await formatMarkdownWithAi({
        rawText: raw,
        noteTitle,
        userInstructions: instructions || undefined,
        messages: chatHistory,
        targetSection: targetSection.trim() || undefined,
        knowledgeContext,
        settings,
      });

      const userMsg = instructions || (targetSection ? `微调章节：${targetSection}` : '开始整理');
      setChatHistory((prev) => [
        ...prev,
        { role: 'user', content: userMsg },
        { role: 'assistant', content: markdown.slice(0, 500) + (markdown.length > 500 ? '…' : '') },
      ]);
      setWorkingMarkdown(markdown);
      setOriginalBackup(backup);
      setUserInstructions('');
      await onFormatted(markdown);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AI 整理失败');
    } finally {
      setFormatting(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const text = await file.text();
      addKnowledgeFile(file.name, text);
      setKbFiles(listKnowledgeEntries());
    } catch {
      setError('读取文件失败');
    }
  };

  const restoreOriginal = async () => {
    if (originalBackup === null) return;
    try {
      await onFormatted(originalBackup);
      setWorkingMarkdown(originalBackup);
      setOriginalBackup(null);
      setChatHistory([]);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : '恢复原文失败');
    }
  };

  const saveSettings = () => {
    setError('');
    if (!draft.apiKey.trim()) {
      setError('请填写 API Key');
      return;
    }
    try {
      saveAiSettings(draft);
      setSettingsOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存配置失败');
    }
  };

  const isToolbar = variant === 'toolbar';
  const showInlineError = error && !settingsOpen && !formatOpen && !isToolbar;

  const openSettings = () => {
    setDraft(loadAiSettings());
    setError('');
    setSettingsOpen(true);
  };

  return (
    <>
      <div className={`ai-format ${isToolbar ? 'ai-format--toolbar' : ''}`}>
        <Button
          type="button"
          variant="outline"
          className={isToolbar ? 'ai-format__btn' : 'btn--sm ai-format__btn'}
          disabled={disabled || formatting}
          onClick={openFormatDialog}
        >
          {formatting ? '整理中…' : 'AI 整理'}
        </Button>
        {originalBackup !== null && (
          <Button
            type="button"
            variant={isToolbar ? 'outline' : 'ghost'}
            className={isToolbar ? 'ai-format__restore' : 'btn--sm ai-format__restore'}
            disabled={disabled || formatting}
            onClick={() => void restoreOriginal()}
            title="恢复为 AI 整理前的正文"
          >
            恢复原文
          </Button>
        )}
        {!isToolbar && (
          <button
            type="button"
            className="ai-format__settings"
            title="AI 接口设置"
            disabled={formatting}
            onClick={openSettings}
          >
            设置
          </button>
        )}
      </div>

      {showInlineError && (
        <p className="ai-format__error ai-format__error--inline" role="alert">
          {error}
        </p>
      )}

      {formatOpen && (
        <DialogPortal>
          <div className="app-dialog" role="dialog" aria-modal="true" aria-labelledby="ai-format-title">
            <div className="app-dialog__backdrop app-dialog__backdrop--blur" onClick={() => !formatting && setFormatOpen(false)} />
            <div className="ai-format-panel">
              <header className="ai-format-panel__header">
                <div className="ai-format-panel__header-text">
                  <h3 id="ai-format-title" className="ai-format-panel__title">
                    AI 整理正文
                  </h3>
                  <p className="ai-format-panel__subtitle">
                    多轮微调 · 知识库检索 · 章节级修改
                  </p>
                </div>
                <button
                  type="button"
                  className="ai-format-panel__close"
                  disabled={formatting}
                  onClick={() => setFormatOpen(false)}
                  aria-label="关闭"
                >
                  ×
                </button>
              </header>

              <div className="ai-format-panel__body thin-scroll">
                <p className="ai-format-panel__hint">
                  上传文件写入知识库后，指令中含「知识库 / 查询 / 文档」等关键词时会自动检索相关内容。
                </p>

                {chatHistory.length > 0 && (
                  <section className="ai-format-panel__section" aria-label="对话历史">
                    <h4 className="ai-format-panel__section-title">对话记录</h4>
                    <div className="ai-format-chat thin-scroll">
                      {chatHistory.map((msg, i) => (
                        <div key={i} className={`ai-format-chat__bubble ai-format-chat__bubble--${msg.role}`}>
                          <span className="ai-format-chat__role">{msg.role === 'user' ? '你' : 'AI'}</span>
                          <p>{msg.content}</p>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                <section className="ai-format-panel__section">
                  <label className="ai-format-field" htmlFor="ai-format-instructions">
                    <span className="ai-format-field__label">整理要求</span>
                    <textarea
                      id="ai-format-instructions"
                      className="ai-format-field__textarea"
                      value={userInstructions}
                      onChange={(e) => setUserInstructions(e.target.value)}
                      placeholder="例如：保留英文术语；按步骤编号；查询知识库整理 React 部分…"
                      rows={5}
                      disabled={formatting}
                    />
                  </label>
                </section>

                {sectionOptions.length > 0 && (
                  <section className="ai-format-panel__section ai-format-panel__section--row">
                    <label className="ai-format-field ai-format-field--grow">
                      <span className="ai-format-field__label">微调章节（可选）</span>
                      <select
                        className="ai-format-field__select"
                        value={targetSection}
                        onChange={(e) => setTargetSection(e.target.value)}
                        disabled={formatting}
                      >
                        <option value="">整篇整理</option>
                        {sectionOptions.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </label>
                  </section>
                )}

                <section className="ai-format-panel__section">
                  <div className="ai-format-kb">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".txt,.md,.markdown,.json,.csv,.log"
                      hidden
                      onChange={(e) => void handleFileUpload(e)}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      disabled={formatting}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      上传知识库文件
                    </Button>
                    {kbFiles.length > 0 && (
                      <span className="ai-format-kb__badge">{kbFiles.length} 个文件</span>
                    )}
                  </div>
                </section>

                {error && <p className="ai-format__error ai-format__error--panel">{error}</p>}
              </div>

              <footer className="ai-format-panel__footer">
                {isToolbar && (
                  <Button type="button" variant="ghost" disabled={formatting} onClick={openSettings}>
                    API 设置
                  </Button>
                )}
                <div className="ai-format-panel__footer-actions">
                  <Button type="button" variant="ghost" disabled={formatting} onClick={() => setFormatOpen(false)}>
                    关闭
                  </Button>
                  <Button type="button" variant="primary" disabled={formatting} onClick={() => void runFormat()}>
                    {formatting ? '整理中…' : chatHistory.length ? '继续微调' : '开始整理'}
                  </Button>
                </div>
              </footer>
            </div>
          </div>
        </DialogPortal>
      )}

      {settingsOpen && (
        <DialogPortal>
          <div className="app-dialog" role="dialog" aria-modal="true">
            <div className="app-dialog__backdrop app-dialog__backdrop--blur" onClick={() => setSettingsOpen(false)} />
            <div className="app-dialog__panel app-dialog__panel--wide ai-format-settings">
              <h3 className="app-dialog__title">AI 接口设置</h3>
              <p className="app-dialog__hint">
                使用 OpenAI 兼容接口（OpenAI、DeepSeek、通义等）。Key 仅保存在本机。
              </p>
              <label className="ai-format-field">
                <span className="ai-format-field__label">API Key *</span>
                <input
                  className="ai-format-field__input"
                  type="password"
                  value={draft.apiKey}
                  onChange={(e) => setDraft((d) => ({ ...d, apiKey: e.target.value }))}
                  placeholder="sk-..."
                  autoComplete="off"
                />
              </label>
              <label className="ai-format-field">
                <span className="ai-format-field__label">API 地址</span>
                <input
                  className="ai-format-field__input"
                  type="url"
                  value={draft.baseUrl}
                  onChange={(e) => setDraft((d) => ({ ...d, baseUrl: e.target.value }))}
                  placeholder={DEFAULT_AI_SETTINGS.baseUrl}
                />
              </label>
              <label className="ai-format-field">
                <span className="ai-format-field__label">模型</span>
                <input
                  className="ai-format-field__input"
                  type="text"
                  value={draft.model}
                  onChange={(e) => setDraft((d) => ({ ...d, model: e.target.value }))}
                  placeholder={DEFAULT_AI_SETTINGS.model}
                />
              </label>
              {error && <p className="ai-format__error">{error}</p>}
              <div className="app-dialog__actions">
                <Button type="button" variant="ghost" onClick={() => setSettingsOpen(false)}>
                  取消
                </Button>
                <Button type="button" variant="primary" onClick={saveSettings}>
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
