import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  findMarkdownSearchMatches,
  type TextSearchMatch,
} from '@/utils/markdownSearchHighlight';

/** 阅读页正文检索状态（供详情页工具栏 + 正文高亮共用） */
export function useMarkdownReaderSearch(content: string) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchCaseSensitive, setSearchCaseSensitive] = useState(false);
  const [matchIndex, setMatchIndex] = useState(0);

  const matches = useMemo(
    () => findMarkdownSearchMatches(content, searchQuery, searchCaseSensitive),
    [content, searchQuery, searchCaseSensitive]
  );

  useEffect(() => {
    setMatchIndex(0);
  }, [searchQuery, searchCaseSensitive, content]);

  const goToMatch = useCallback(
    (next: number) => {
      if (matches.length === 0) return;
      setMatchIndex(((next % matches.length) + matches.length) % matches.length);
    },
    [matches.length]
  );

  const toggleCase = useCallback(() => {
    setSearchCaseSensitive((on) => !on);
  }, []);

  return {
    searchQuery,
    setSearchQuery,
    searchCaseSensitive,
    toggleCase,
    matchIndex,
    matches: matches as TextSearchMatch[],
    goToMatch,
  };
}
