import { useState, useCallback, useRef } from 'react';

interface EditorState {
  title: string;
  content: string;
}

interface UseEditorHistoryReturn {
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;
  pushState: (state: EditorState) => void;
  clearHistory: () => void;
}

export function useEditorHistory(
  initialState: EditorState,
  onStateChange: (state: EditorState) => void,
  maxHistorySize = 50
): UseEditorHistoryReturn {
  const [history, setHistory] = useState<EditorState[]>([initialState]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const isUndoRedo = useRef(false);

  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < history.length - 1;

  const undo = useCallback(() => {
    if (canUndo) {
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      isUndoRedo.current = true;
      onStateChange(history[newIndex]);
      setTimeout(() => {
        isUndoRedo.current = false;
      }, 0);
    }
  }, [canUndo, currentIndex, history, onStateChange]);

  const redo = useCallback(() => {
    if (canRedo) {
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      isUndoRedo.current = true;
      onStateChange(history[newIndex]);
      setTimeout(() => {
        isUndoRedo.current = false;
      }, 0);
    }
  }, [canRedo, currentIndex, history, onStateChange]);

  const pushState = useCallback((state: EditorState) => {
    // 如果正在执行撤销/重做操作，不记录新状态
    if (isUndoRedo.current) {
      return;
    }

    // 检查状态是否真的发生了变化
    const currentState = history[currentIndex];
    if (currentState && 
        currentState.title === state.title && 
        currentState.content === state.content) {
      return;
    }

    setHistory(prevHistory => {
      // 如果当前不在历史记录的末尾，需要截断后续的历史记录
      const newHistory = prevHistory.slice(0, currentIndex + 1);
      
      // 添加新状态
      newHistory.push(state);
      
      // 限制历史记录大小
      if (newHistory.length > maxHistorySize) {
        newHistory.shift();
        setCurrentIndex(newHistory.length - 1);
      } else {
        setCurrentIndex(newHistory.length - 1);
      }
      
      return newHistory;
    });
  }, [currentIndex, history, maxHistorySize]);

  const clearHistory = useCallback(() => {
    const currentState = history[currentIndex];
    setHistory([currentState]);
    setCurrentIndex(0);
  }, [history, currentIndex]);

  return {
    canUndo,
    canRedo,
    undo,
    redo,
    pushState,
    clearHistory
  };
}